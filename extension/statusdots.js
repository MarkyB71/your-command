// Skippy's Command Deck – building status dots (runs on game.influenceth.io, in the page).
// Draws a tiny traffic-light dot beside each of YOUR buildings in the game's own asteroid view:
//   green  = finished or idle (ready for you)      planned site: every material delivered (ready to build)
//   yellow = under 3 hours left                    planned site: reservation runs out within 3 hours
//   red    = busy, more than 3 hours left          planned site: reservation ran out with materials still in it
// No dot on warehouses, tank farms, spaceports, marketplaces, habitats, or empty expired sites.
// It only READS what the game has already loaded (no requests of its own), never clicks or changes
// anything in the game, and switches itself off quietly if a game update moves things.
// Off by default – switched on in the extension's options.
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
  // mine[ast] = Map(lot -> colour or null)
  let mine = {};
  function readBuildings() {
    if (!qc) qc = findQueryClient();
    if (!qc) return false;
    const now = Date.now() / 1000, out = {};
    qc.getQueryCache().getAll().forEach(q => {
      const k = q.queryKey;
      if (!k || k[0] !== 'entities' || k[1] !== 5 || !k[2] || !Array.isArray(k[2].controllerId) || !k[2].controllerId.length) return;
      (Array.isArray(q.state.data) ? q.state.data : []).forEach(b => {
        const L = lotOf(b); if (!L) return;
        (out[L.ast] = out[L.ast] || new Map()).set(L.lot, colourOf(b, now));
      });
    });
    mine = out;
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
  let layer = null;
  let lastKey = '', lastCover = 0;
  function makeLayer() {
    layer = document.createElement('div');
    layer.id = 'yic-dots';
    layer.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:2147483000';
    document.body.appendChild(layer);
  }
  function clearView() { if (view) view.lots.forEach(o => o.el.remove()); view = null; lastKey = ''; }
  function dot(c) {
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;left:0;top:0;width:8px;height:8px;margin:-5px 0 0 -5px;border-radius:50%;'
      + 'border:1px solid rgba(0,0,0,.85);display:none;will-change:transform;box-shadow:0 0 5px ' + COL[c] + ';background:' + COL[c];
    el.dataset.c = c;
    return el;
  }

  function refresh() { // every 2 s: buildings, asteroid on screen, colours
    if (!getStore()) return;
    const st = store.getState(), V = st.camera.position.constructor, M = st.camera.matrixWorld.constructor;
    readBuildings();
    const rock = findRock(st.scene);
    if (!rock) { clearView(); note('waiting for an asteroid view'); return; }
    // key: changes when the game draws a different set of lots/icons (zooming, panning, new buildings)
    const mat = new M(), v = new V();
    const key = rock.uuid + ':' + rock.children.map(m => {
      if (!m.isInstancedMesh || !m.count) return 0;
      m.getMatrixAt(0, mat); v.setFromMatrixPosition(mat);
      return m.count + '@' + Math.round(v.x) + ',' + Math.round(v.y);
    }).join('|') + ':' + Object.keys(mine).map(a => mine[a].size).join(',');
    if (!view || view.key !== key) {
      const pts = points(rock, V, M), found = whichAsteroid(rock, pts, V, M);
      if (!found) { clearView(); view = { rock, ast: null, key, lots: [], pos: new Map() }; note('not one of your asteroids'); return; }
      if (view && view.ast === found.ast && view.rock === rock) { view.key = key; view.pos = found.out; view.lotW = found.lotW; lastKey = ''; }
      else { clearView(); view = { rock, ast: found.ast, key, lots: [], pos: found.out, lotW: found.lotW }; }
    }
    if (view.ast == null) return;
    if (!mine[view.ast]) { clearView(); return; }
    if (!layer || !layer.isConnected) makeLayer();
    // (re)build the dots for this asteroid's coloured buildings
    const want = [...mine[view.ast].entries()].filter(([lot, c]) => c && view.pos.has(lot));
    const have = new Map(view.lots.map(o => [o.lot, o]));
    view.lots = want.map(([lot, c]) => {
      let o = have.get(lot);
      if (o && o.el.dataset.c !== c) { o.el.remove(); o = null; }
      if (!o) { o = { lot, el: dot(c), vis: false }; layer.appendChild(o.el); }
      have.delete(lot);
      return o;
    });
    have.forEach(o => o.el.remove());
    const n = { green: 0, yellow: 0, red: 0 }; want.forEach(([, c]) => n[c]++);
    note('asteroid ' + view.ast + ': ' + n.green + ' green, ' + n.yellow + ' yellow, ' + n.red + ' red');
  }

  function frame() {
    if (!getStore() || !view || view.ast == null || !view.lots.length) return;
    const st = store.getState(), cam = st.camera, canvas = st.gl && st.gl.domElement;
    if (!canvas) return;
    const t = performance.now();
    const k = cam.matrixWorld.elements.join() + view.rock.matrixWorld.elements.join();
    const cover = t - lastCover > 300;
    if (k === lastKey && !cover) return;
    lastKey = k; if (cover) lastCover = t;
    const V = cam.position.constructor, M = cam.matrixWorld.constructor;
    const cr = canvas.getBoundingClientRect();
    const camW = new V().setFromMatrixPosition(cam.matrixWorld), centre = new V().setFromMatrixPosition(view.rock.matrixWorld);
    const w = new V(), out = new V(), toCam = new V(), side = new V(), right = new V().setFromMatrixColumn(cam.matrixWorld, 0).normalize();
    const rs = view.rock.matrixWorld.elements, scale = Math.hypot(rs[0], rs[1], rs[2]) || 1;
    for (const o of view.lots) {
      const p = view.pos.get(o.lot);
      if (!p) { o.el.style.display = 'none'; continue; }
      w.set(p[0], p[1], p[2]).applyMatrix4(view.rock.matrixWorld);
      // round the back of the rock?
      out.copy(w).sub(centre).normalize(); toCam.copy(camW).sub(w).normalize();
      if (out.dot(toCam) < 0.15) { o.vis = false; o.el.style.display = 'none'; continue; }
      // how big one lot looks on screen – the offset shrinks with it so the dot stays by its own icon
      side.copy(right).multiplyScalar(view.lotW * scale).add(w).project(cam);
      w.project(cam);
      const lotPx = Math.abs(side.x - w.x) / 2 * cr.width, f = Math.max(0.25, Math.min(1, lotPx * 0.35 / OFFSET[0]));
      const x = (w.x + 1) / 2 * cr.width + cr.left + OFFSET[0] * f, y = (1 - w.y) / 2 * cr.height + cr.top + OFFSET[1] * f;
      // under a game panel?
      if (cover) o.vis = x >= cr.left && x <= cr.right && y >= cr.top && y <= cr.bottom && document.elementFromPoint(x, y) === canvas;
      o.el.style.display = o.vis ? '' : 'none';
      o.el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    }
  }

  // ---- start: wait for your options, then run ---------------------------------------------
  note('starting');
  let waited = 0;
  const go = setInterval(() => {
    const raw = root.dataset.yicOpts;
    if (!raw) { if (++waited > 60) { clearInterval(go); note('options not found'); } return; }
    clearInterval(go);
    let on = true; try { on = JSON.parse(raw).statusDots === true; } catch (e) {}
    if (!on) { note('switched off in options'); return; }
    setInterval(() => { try { refresh(); } catch (e) { clearView(); note('paused – ' + e.message); } }, 2000);
    const loop = () => { requestAnimationFrame(loop); try { frame(); } catch (e) { clearView(); note('paused – ' + e.message); } };
    requestAnimationFrame(loop);
  }, 1000);
})();
