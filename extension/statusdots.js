// Skippy's Command Deck – building status dots (runs on game.influenceth.io, in the page).
// Draws a tiny traffic-light dot beside each of YOUR buildings in the game's own asteroid view:
//   green  = finished or idle (ready for you)      planned site: every material delivered (ready to build)
//   yellow = under 3 hours left                    planned site: reservation runs out within 3 hours
//   red    = busy, more than 3 hours left          planned site: reservation ran out with materials still in it
// No dot on warehouses, tank farms, spaceports, marketplaces, habitats, or empty expired sites.
// It only READS what the game has already loaded (no requests of its own), never clicks or changes
// anything in the game, and switches itself off quietly if a game update moves things.
// On by default – can be switched off in the extension's options.
// It also tells the deck strip which of your rocks is on screen (its "On this rock" card), and opens
// a building in the game when you pick one there (the game's own /building/ link – no game actions).
(() => {
  if (window.top !== window) return;
  const root = document.documentElement;
  const note = t => { if (root) root.dataset.yicStatusDots = t; };

  // ---- 1. The game's 3D store – caught at page start by r3fstore.js (shared with the map tags) ----
  let store = null;
  const getStore = () => store || (store = window.__yicR3f || null);

  // ---- settings ---------------------------------------------------------------------------
  const COL = { green: '#57ff65', yellow: '#ffd94f', red: '#ff564d' }; // the game's own colours
  const SOON = 3 * 3600;          // "almost ready" = under 3 hours
  const RESERVE = 172800;         // planned site reservation: 48 hours (same as Command Deck)
  const JOBS = new Set([2, 3, 4, 5, 6]); // Extractor, Refinery, Bioreactor, Factory, Shipyard
  const OFFSET = [12, -10];       // dot sits just above-right of the game's icon (close up; shrinks when zoomed out)

  // ---- 2. Your buildings, from what the game has already loaded -----------------------------
  let qc = null;
  function findQueryClient() {
    let start = null;
    for (const el of document.querySelectorAll('body *')) {
      const k = Object.keys(el).find(k => k.startsWith('__reactFiber$'));
      if (k) { start = el[k]; break; }
    }
    if (!start) return null;
    let f = start; while (f.return) f = f.return;
    const stack = [f]; let n = 0;
    while (stack.length && n < 300000) {
      const x = stack.pop(); n++;
      const p = x.memoizedProps;
      if (p && p.client && typeof p.client.getQueryCache === 'function') return p.client;
      if (x.sibling) stack.push(x.sibling);
      if (x.child) stack.push(x.child);
    }
    return null;
  }
  const lotOf = b => {
    const l = ((b.Location && b.Location.locations) || []).find(x => x && x.label === 4);
    if (!l) return null;
    const id = BigInt(l.id);
    return { ast: Number(id & 0xffffffffn), lot: Number(id >> 32n) };
  };
  function colourOf(b, now) {
    const B = b.Building || {};
    if (B.status === 1) { // planned site
      const end = (B.plannedAt || 0) + RESERVE;
      const has = (b.Inventories || []).some(i => (i.contents || []).some(x => x && x.amount > 0));
      if (end <= now) return has ? 'red' : null;
      if (allIn(b, B.buildingType)) return 'green'; // every material delivered – ready to build
      return end - now <= SOON ? 'yellow' : null;
    }
    let jobs;
    if (B.status === 2) jobs = [{ status: 1, finishTime: B.finishTime }]; // being built
    else if (B.status === 3 && JOBS.has(B.buildingType)) jobs = [...(b.Extractors || []), ...(b.Processors || []), ...(b.DryDocks || [])];
    else return null;
    let left = -1;
    for (const j of jobs) if (j && j.status && j.finishTime) left = Math.max(left, j.finishTime - now);
    return left <= 0 ? 'green' : left <= SOON ? 'yellow' : 'red';
  }
  // Materials each building needs (from the game's sdk, same table as the Command Deck's Construction planner)
  const NEEDS = {"1":{"44":400000,"69":350000,"70":200000},"2":{"44":250000,"69":300000,"125":3000,"237":1,"243":6},"3":{"44":600000,"69":300000,"70":200000,"104":2,"237":12,"238":2,"240":2,"243":16,"244":4},"4":{"24":1400000,"41":300000,"44":500000,"56":300000,"69":100000,"70":300000,"74":25000,"180":125000,"237":16,"238":12,"240":3,"243":8},"5":{"44":900000,"69":1100000,"70":700000,"237":4,"238":40,"240":8,"243":20,"244":6},"6":{"44":1500000,"69":2000000,"70":1000000,"237":8,"238":60,"240":10,"243":24,"244":6},"7":{"44":3000000,"69":1600000,"70":2500000,"101":200000,"237":50,"238":180,"240":40,"243":150,"244":60},"8":{"44":3000000,"69":2500000,"70":3000000,"101":500000,"133":6,"235":80,"240":160,"243":60,"244":40},"9":{"24":300000,"44":5000000,"56":200000,"69":4000000,"70":5000000,"101":1000000,"133":12,"235":240,"240":200,"243":240,"244":320},"10":{"44":200000,"69":50000,"70":50000,"171":200000,"237":2}};
  function allIn(b, type) {
    const need = NEEDS[type]; if (!need) return false;
    const got = {};
    (b.Inventories || []).forEach(i => (i.contents || []).forEach(x => { if (x && x.product) got[x.product] = (got[x.product] || 0) + (x.amount || 0); }));
    return Object.keys(need).every(p => (got[p] || 0) >= need[p]);
  }
  // mine[ast] = Map(lot -> colour or null); list[ast] = your buildings there (for the deck strip's "On this rock" card)
  let mine = {}, list = {};
  const BT = { 1: 'Warehouse', 2: 'Extractor', 3: 'Refinery', 4: 'Bioreactor', 5: 'Factory', 6: 'Shipyard', 7: 'Spaceport', 8: 'Marketplace', 9: 'Habitat', 10: 'Tank Farm' };
  function readBuildings() {
    if (!qc) qc = findQueryClient();
    if (!qc) return false;
    const now = Date.now() / 1000, out = {}, ls = {};
    qc.getQueryCache().getAll().forEach(q => {
      const k = q.queryKey;
      if (!k || k[0] !== 'entities' || k[1] !== 5 || !k[2] || !Array.isArray(k[2].controllerId) || !k[2].controllerId.length) return;
      (Array.isArray(q.state.data) ? q.state.data : []).forEach(b => {
        const L = lotOf(b); if (!L) return;
        const c = colourOf(b, now), B = b.Building || {};
        (out[L.ast] = out[L.ast] || new Map()).set(L.lot, c);
        const seen = (ls[L.ast] = ls[L.ast] || new Map());
        if (!seen.has(b.id)) seen.set(b.id, { id: b.id, lot: L.lot, t: BT[B.buildingType] || 'Building', st: B.status, n: (b.Name && b.Name.name) || '', c: c || '' });
      });
    });
    mine = out;
    list = {}; for (const a in ls) list[a] = [...ls[a].values()];
    return Object.keys(out).length > 0;
  }

  // ---- 3. The asteroid on screen ------------------------------------------------------------
  // The rock group holds the game's building icons (one instanced mesh per type, named by its
  // picture) and some lot-circle meshes. On small asteroids there is one circle per lot, but on big
  // ones (Adalia Prime has 1.77 million lots) the game only draws the lots near the camera, so we
  // can't count circles to find a lot. Instead we work out where each lot is with the game's own
  // maths (influenceth sdk: lots spiral round the asteroid, Fibonacci style) and then snap to the
  // game's circle or icon at that spot so the dot sits exactly on it.
  const ICON = /\/(Warehouse|Extractor|Refinery|Bioreactor|Factory|Shipyard|Spaceport|Marketplace|Habitat|Tankfarm|Construction)\.png/;
  const PHI = Math.PI * (3 - Math.sqrt(5));
  const radiusKm = ast => 375.142 / Math.pow(ast, 0.475);          // sdk getRadius
  const lotCount = ast => Math.floor(4 * Math.PI * radiusKm(ast) ** 2); // sdk getSurfaceArea
  function lotDir(ast, lot) {                                          // sdk getLotPosition (unit)
    const N = lotCount(ast), th = PHI * (lot - 1), y = 1 - 2 * (lot - 1) / (N - 1), r = Math.sqrt(Math.max(0, 1 - y * y));
    return [r * Math.cos(th), y, r * Math.sin(th)];
  }
  let view = null; // { rock, ast, key, lots: [{lot, el, p: [x,y,z] in rock space]}] }
  function shown(o) { for (; o; o = o.parent) if (!o.visible) return false; return true; }
  const srcOf = m => m.material && m.material.map && m.material.map.source && m.material.map.source.data && m.material.map.source.data.src;
  function findRock(scene) {
    let rock = null;
    scene.traverse(o => {
      if (rock || !o.isInstancedMesh) return;
      const src = srcOf(o);
      if (src && ICON.test(src)) rock = o.parent;
    });
    return rock && shown(rock) ? rock : null;
  }
  // Every circle and icon the game is drawing, as points in rock space (with their direction).
  function points(rock, V, M) {
    const pts = [], mat = new M();
    rock.children.forEach(m => {
      if (!m.isInstancedMesh || !m.visible || !m.geometry) return;
      const t = m.geometry.type, src = srcOf(m);
      if (!(t === 'CircleGeometry' || (t === 'PlaneGeometry' && src && ICON.test(src)))) return;
      for (let i = 0; i < m.count; i++) {
        m.getMatrixAt(i, mat);
        const p = new V().setFromMatrixPosition(mat).applyMatrix4(m.matrix);
        const l = p.length(); if (!l) continue;
        pts.push({ p, d: [p.x / l, p.y / l, p.z / l], icon: t === 'PlaneGeometry' });
      }
    });
    return pts;
  }
  // Where each of your buildings on this asteroid is, in rock space, and how well they line up
  // with what the game draws (err = average gap to the nearest circle/icon, in lot widths).
  function placeLots(ast, pts, radius) {
    const N = lotCount(ast), w = Math.sqrt(4 * Math.PI / N), tol = Math.cos(0.7 * w);
    const out = new Map(); let gap = 0, n = 0;
    for (const lot of mine[ast].keys()) {
      if (lot < 1 || lot > N) continue;
      const u = lotDir(ast, lot); let best = null, bd = -2;
      for (const q of pts) { const d = q.d[0] * u[0] + q.d[1] * u[1] + q.d[2] * u[2]; if (d > bd) { bd = d; best = q; } }
      gap += Math.acos(Math.min(1, bd)) / w; n++;
      out.set(lot, best && bd > tol ? [best.p.x, best.p.y, best.p.z] : [u[0] * radius, u[1] * radius, u[2] * radius]);
    }
    return { out, err: n ? gap / n : Infinity };
  }
  // Which of your asteroids is on screen.
  // 1) Small rocks: the game draws one circle per lot, so a circle mesh with exactly the
  //    asteroid's lot count is a sure match, and circle i is lot i+1 (exact positions).
  // 2) Big rocks (only nearby lots drawn): the asteroid whose buildings line up most exactly
  //    with the game's circles/icons (rough size must match too).
  function whichAsteroid(rock, pts, V, M) {
    if (!pts.length) return null;
    const ls = pts.map(q => q.p.length()).sort((x, y) => x - y), radius = ls[ls.length >> 1];
    const okSize = ast => { const r = radius / (radiusKm(ast) * 1000); return r > 0.8 && r < 1.25; };
    const counts = new Map();
    rock.children.forEach(m => { if (m.isInstancedMesh && m.visible && m.geometry && m.geometry.type === 'CircleGeometry' && m.count) counts.set(m.count, m); });
    for (const a in mine) {
      const ast = Number(a), circ = counts.get(lotCount(ast));
      if (!circ || !okSize(ast)) continue;
      const out = new Map(), mat = new M();
      for (const lot of mine[ast].keys()) {
        if (lot < 1 || lot > circ.count) continue;
        circ.getMatrixAt(lot - 1, mat);
        const p = new V().setFromMatrixPosition(mat).applyMatrix4(circ.matrix);
        out.set(lot, [p.x, p.y, p.z]);
      }
      return { ast, radius, out, err: 0, lotW: radius * Math.sqrt(4 * Math.PI / lotCount(ast)) };
    }
    let best = null;
    for (const a in mine) {
      const ast = Number(a);
      if (!okSize(ast)) continue;
      const r = placeLots(ast, pts, radius);
      if (r.err < 0.35 && (!best || r.err < best.err)) best = { ast, radius, ...r, lotW: radius * Math.sqrt(4 * Math.PI / lotCount(ast)) };
    }
    return best;
  }

  // ---- 4. Drawing ---------------------------------------------------------------------------
  // 0.7.2: all dots are painted on ONE see-through canvas (was one <div> per dot). Big rocks with
  // hundreds of buildings were slowing the game's frame rate when zoomed out.
  let layer = null, ctx = null, dpr = 1;
  let lastKey = '', lastCover = 0, coverAt = -1;
  function makeLayer() {
    layer = document.createElement('canvas');
    layer.id = 'yic-dots';
    layer.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483000';
    document.body.appendChild(layer);
    ctx = layer.getContext('2d');
    sizeLayer();
  }
  function sizeLayer() {
    dpr = window.devicePixelRatio || 1;
    const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    if (layer.width !== w || layer.height !== h) { layer.width = w; layer.height = h; }
  }
  function wipe() { if (ctx) ctx.clearRect(0, 0, layer.width, layer.height); }
  function clearView() { wipe(); view = null; lastKey = ''; coverAt = -1; }
  function paint() {
    sizeLayer(); wipe();
    if (!view) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const c of ['green', 'yellow', 'red']) {
      const on = view.lots.filter(o => o.c === c && o.vis && o.show);
      if (!on.length) continue;
      ctx.globalAlpha = 0.35; ctx.fillStyle = COL[c]; ctx.beginPath();          // soft glow
      for (const o of on) { ctx.moveTo(o.x + 7, o.y); ctx.arc(o.x, o.y, 7, 0, 6.2832); }
      ctx.fill();
      ctx.globalAlpha = 1; ctx.beginPath();                                       // the dot
      for (const o of on) { ctx.moveTo(o.x + 4.5, o.y); ctx.arc(o.x, o.y, 4.5, 0, 6.2832); }
      ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.stroke();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // The rock on screen, shared with the deck strip (it runs in the extension's own space, so it reads
  // this from the page's <html> tag). Only your own buildings, only what the game has already loaded.
  let rockSent = '';
  function rockName(ast) {
    let nm = '';
    try {
      qc.getQueryCache().getAll().forEach(q => {
        if (nm) return;
        const d = q.state.data; (Array.isArray(d) ? d : [d]).forEach(x => { if (!nm && x && x.label === 3 && Number(x.id) === ast && x.Name && x.Name.name) nm = x.Name.name; });
      });
    } catch (e) {}
    return nm || 'Asteroid #' + ast;
  }
  function shareRock(ast) {
    const v = ast == null ? '' : JSON.stringify({ ast, name: rockName(ast), b: list[ast] || [] });
    if (v !== rockSent) { rockSent = v; if (v) root.dataset.yicRock = v; else delete root.dataset.yicRock; }
  }
  // "Go" from the card: open that building in the game – the same as the game's own /building/ link.
  addEventListener('message', e => {
    if (e.source !== window || e.origin !== location.origin || !e.data || e.data.type !== 'yic-goto-building') return;
    const id = Number(e.data.id); if (!(id > 0)) return;
    history.pushState({}, '', '/building/' + id);
    dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  });
  function clearDots() { if (view) view.lots = []; wipe(); }

  function refresh(draw) { // every 2 s: buildings, asteroid on screen, colours
    if (!getStore()) return;
    const st = store.getState(), V = st.camera.position.constructor, M = st.camera.matrixWorld.constructor;
    readBuildings();
    const rock = findRock(st.scene);
    if (!rock) { clearView(); shareRock(null); note('waiting for an asteroid view'); return; }
    // key: changes when the game draws a different set of lots/icons (zooming, panning, new buildings)
    const mat = new M(), v = new V();
    const key = rock.uuid + ':' + rock.children.map(m => {
      if (!m.isInstancedMesh || !m.count) return 0;
      m.getMatrixAt(0, mat); v.setFromMatrixPosition(mat);
      return m.count + '@' + Math.round(v.x) + ',' + Math.round(v.y);
    }).join('|') + ':' + Object.keys(mine).map(a => mine[a].size).join(',');
    if (!view || view.key !== key) {
      const pts = points(rock, V, M), found = whichAsteroid(rock, pts, V, M);
      if (!found) { clearView(); shareRock(null); view = { rock, ast: null, key, lots: [], pos: new Map() }; note('not one of your asteroids'); return; }
      if (view && view.ast === found.ast && view.rock === rock) { view.key = key; view.pos = found.out; view.lotW = found.lotW; lastKey = ''; }
      else { clearView(); view = { rock, ast: found.ast, key, lots: [], pos: found.out, lotW: found.lotW }; }
    }
    if (view.ast == null) return;
    if (!mine[view.ast]) { clearView(); shareRock(null); return; }
    shareRock(view.ast);
    if (!draw) { clearDots(); note('dots off – rock ' + view.ast + ' shared with the deck strip'); return; }
    if (!layer || !layer.isConnected) makeLayer();
    // (re)build the dots for this asteroid's coloured buildings
    const want = [...mine[view.ast].entries()].filter(([lot, c]) => c && view.pos.has(lot));
    const have = new Map(view.lots.map(o => [o.lot, o]));
    view.lots = want.map(([lot, c]) => {
      const o = have.get(lot) || { lot, vis: false, show: false, x: 0, y: 0 };
      o.c = c;
      return o;
    });
    lastKey = '';
    const n = { green: 0, yellow: 0, red: 0 }; want.forEach(([, c]) => n[c]++);
    note('asteroid ' + view.ast + ': ' + n.green + ' green, ' + n.yellow + ' yellow, ' + n.red + ' red');
  }

  function frame() {
    if (!getStore() || !view || view.ast == null || !view.lots.length || !ctx) return;
    const st = store.getState(), cam = st.camera, canvas = st.gl && st.gl.domElement;
    if (!canvas) return;
    const t = performance.now();
    // "under a game panel?" – checked a few dots per frame (was every dot at once, every 300 ms)
    if (coverAt < 0 && t - lastCover > 300) { coverAt = 0; lastCover = t; }
    const k = cam.matrixWorld.elements.join() + view.rock.matrixWorld.elements.join() + innerWidth + 'x' + innerHeight;
    const moved = k !== lastKey;
    if (!moved && coverAt < 0) return;
    const cr = canvas.getBoundingClientRect();
    if (moved) {
      lastKey = k;
      const V = cam.position.constructor;
      const camW = new V().setFromMatrixPosition(cam.matrixWorld), centre = new V().setFromMatrixPosition(view.rock.matrixWorld);
      const w = new V(), out = new V(), toCam = new V(), side = new V(), right = new V().setFromMatrixColumn(cam.matrixWorld, 0).normalize();
      const rs = view.rock.matrixWorld.elements, scale = Math.hypot(rs[0], rs[1], rs[2]) || 1;
      for (const o of view.lots) {
        const p = view.pos.get(o.lot);
        o.show = false;
        if (!p) continue;
        w.set(p[0], p[1], p[2]).applyMatrix4(view.rock.matrixWorld);
        out.copy(w).sub(centre).normalize(); toCam.copy(camW).sub(w).normalize();
        if (out.dot(toCam) < 0.15) continue;                     // round the back of the rock
        side.copy(right).multiplyScalar(view.lotW * scale).add(w).project(cam);
        w.project(cam);
        const lotPx = Math.abs(side.x - w.x) / 2 * cr.width, f = Math.max(0.25, Math.min(1, lotPx * 0.35 / OFFSET[0]));
        o.x = (w.x + 1) / 2 * cr.width + cr.left + OFFSET[0] * f; o.y = (1 - w.y) / 2 * cr.height + cr.top + OFFSET[1] * f;
        o.show = o.x >= cr.left && o.x <= cr.right && o.y >= cr.top && o.y <= cr.bottom;
      }
    }
    let changed = false;
    if (coverAt >= 0) {
      const stop = Math.min(view.lots.length, coverAt + 40);
      for (; coverAt < stop; coverAt++) {
        const o = view.lots[coverAt];
        const v = o.show && document.elementFromPoint(o.x, o.y) === canvas;
        if (v !== o.vis) { o.vis = v; changed = true; }
      }
      if (coverAt >= view.lots.length) coverAt = -1;
    }
    if (moved || changed) paint();
  }

  // ---- start: wait for your options, then run ---------------------------------------------
  note('starting');
  let waited = 0;
  const go = setInterval(() => {
    const raw = root.dataset.yicOpts;
    if (!raw) { if (++waited > 60) { clearInterval(go); note('options not found'); } return; }
    clearInterval(go);
    // Checks the switch every time, so turning it on or off in Options works without a refresh (0.6.7).
    const live = (k, d) => { try { const v = JSON.parse(root.dataset.yicOpts || '{}')[k]; return v === undefined ? d : v; } catch (e) { return d; } };
    let on = live('statusDots', true) !== false;
    setInterval(() => {
      on = live('statusDots', true) !== false;
      const strip = live('deckStrip', true) !== false; // the strip's "On this rock" card needs the rock too
      if (!on && !strip) { clearView(); shareRock(null); note('switched off in options'); return; }
      try { refresh(on); } catch (e) { clearView(); shareRock(null); note('paused – ' + e.message); }
    }, 2000);
    const loop = () => { requestAnimationFrame(loop); if (!on) return; try { frame(); } catch (e) { clearView(); note('paused – ' + e.message); } };
    requestAnimationFrame(loop);
  }, 1000);
})();
