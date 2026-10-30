// Skippy's Command Deck – building status dots (runs on game.influenceth.io, in the page).
// Draws a tiny traffic-light dot beside each of YOUR buildings in the game's own asteroid view:
//   green  = finished or idle (ready for you)      planned site: –
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

  // ---- 1. Catch the game's 3D store as the game starts up --------------------------------
  // react-three-fiber puts a small "__r3f" record on every 3D object it makes, and that record
  // points at the 3D store (camera, scene, canvas). For a moment we watch for the first one being
  // set, keep its store, then remove the watcher. (It has to be here at page start: the game makes
  // its objects while loading.)
  let store = null;
  const KEY = '__r3f';
  function stopWatching() {
    const d = Object.getOwnPropertyDescriptor(Object.prototype, KEY);
    if (d && d.set === watcher) delete Object.prototype[KEY];
  }
  function watcher(v) {
    if (v && v.root && typeof v.root.getState === 'function' && !store) { store = v.root; stopWatching(); }
    Object.defineProperty(this, KEY, { value: v, writable: true, configurable: true, enumerable: true });
  }
  if (!Object.getOwnPropertyDescriptor(Object.prototype, KEY)) {
    Object.defineProperty(Object.prototype, KEY, { configurable: true, set: watcher });
    setTimeout(stopWatching, 120000); // never leave it on
  }

  // ---- settings ---------------------------------------------------------------------------
  const COL = { green: '#57ff65', yellow: '#ffd94f', red: '#ff564d' }; // the game's own colours
  const SOON = 3 * 3600;          // "almost ready" = under 3 hours
  const RESERVE = 172800;         // planned site reservation: 48 hours (same as Command Deck)
  const JOBS = new Set([2, 3, 4, 5, 6]); // Extractor, Refinery, Bioreactor, Factory, Shipyard
  const OFFSET = [12, -10];       // dot sits just above-right of the game's icon

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
  // picture) and one circle per lot (instance i = lot i+1).
  const ICON = /\/(Warehouse|Extractor|Refinery|Bioreactor|Factory|Shipyard|Spaceport|Marketplace|Habitat|Tankfarm|Construction)\.png/;
  let view = null; // { rock, circles, ast, lots: [{lot, el}], key }
  function shown(o) { for (; o; o = o.parent) if (!o.visible) return false; return true; }
  function findRock(scene) {
    let rock = null;
    scene.traverse(o => {
      if (rock || !o.isInstancedMesh) return;
      const src = o.material && o.material.map && o.material.map.source && o.material.map.source.data && o.material.map.source.data.src;
      if (src && ICON.test(src)) rock = o.parent;
    });
    return rock && shown(rock) ? rock : null;
  }
  function lotCircles(rock) {
    let best = null;
    rock.children.forEach(m => { if (m.isInstancedMesh && m.geometry && m.geometry.type === 'CircleGeometry' && (!best || m.count > best.count)) best = m; });
    return best;
  }
  function iconLots(rock, circles, V, M) {
    const pts = []; const mat = new M();
    for (let i = 0; i < circles.count; i++) { circles.getMatrixAt(i, mat); pts.push(new V().setFromMatrixPosition(mat)); }
    const lots = new Set();
    rock.children.forEach(m => {
      if (!m.isInstancedMesh || m.geometry.type !== 'PlaneGeometry') return;
      const src = m.material && m.material.map && m.material.map.source && m.material.map.source.data && m.material.map.source.data.src;
      if (!src || !ICON.test(src)) return;
      for (let i = 0; i < m.count; i++) {
        m.getMatrixAt(i, mat); const p = new V().setFromMatrixPosition(mat);
        let b = -1, bd = Infinity;
        for (let j = 0; j < pts.length; j++) { const d = pts[j].distanceToSquared(p); if (d < bd) { bd = d; b = j; } }
        if (b >= 0) lots.add(b + 1);
      }
    });
    return lots;
  }
  // The asteroid whose buildings (yours) all have an icon on screen, with lots that fit.
  function whichAsteroid(lots, lotCount) {
    let best = null, bestN = 0;
    for (const ast in mine) {
      const m = mine[ast]; let ok = true;
      for (const lot of m.keys()) if (lot > lotCount || !lots.has(lot)) { ok = false; break; }
      if (ok && m.size > bestN) { best = Number(ast); bestN = m.size; }
    }
    return best;
  }

  // ---- 4. Drawing ---------------------------------------------------------------------------
  let layer = null;
  function makeLayer() {
    layer = document.createElement('div');
    layer.id = 'yic-dots';
    layer.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:2147483000';
    document.body.appendChild(layer);
  }
  function clearView() { if (view) view.lots.forEach(o => o.el.remove()); view = null; }
  function dot(c) {
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;left:0;top:0;width:8px;height:8px;margin:-5px 0 0 -5px;border-radius:50%;'
      + 'border:1px solid rgba(0,0,0,.85);display:none;will-change:transform;box-shadow:0 0 5px ' + COL[c] + ';background:' + COL[c];
    el.dataset.c = c;
    return el;
  }

  function refresh() { // every 2 s: buildings, asteroid on screen, colours
    if (!store) return;
    const st = store.getState(), V = st.camera.position.constructor, M = st.camera.matrixWorld.constructor;
    readBuildings();
    const rock = findRock(st.scene);
    if (!rock) { clearView(); note('waiting for an asteroid view'); return; }
    const circles = lotCircles(rock);
    if (!circles) { clearView(); note('no lots found'); return; }
    const icons = rock.children.reduce((n, m) => n + (m.isInstancedMesh && m.geometry.type === 'PlaneGeometry' ? m.count : 0), 0);
    const key = rock.uuid + ':' + circles.count + ':' + icons;
    if (!view || view.key !== key) {
      clearView();
      const ast = whichAsteroid(iconLots(rock, circles, V, M), circles.count);
      view = { rock, circles, ast, key, lots: [] };
      if (ast == null) { note('not one of your asteroids'); return; }
    }
    if (view.ast == null) return;
    if (!layer || !layer.isConnected) makeLayer();
    // (re)build the dots for this asteroid's coloured buildings
    const want = [...mine[view.ast].entries()].filter(([, c]) => c);
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

  let lastKey = '', lastCover = 0;
  function frame() {
    if (!store || !view || view.ast == null || !view.lots.length) return;
    const st = store.getState(), cam = st.camera, canvas = st.gl && st.gl.domElement;
    if (!canvas) return;
    const t = performance.now();
    const k = cam.matrixWorld.elements.join() + view.rock.matrixWorld.elements.join();
    const cover = t - lastCover > 300;
    if (k === lastKey && !cover) return;
    lastKey = k; if (cover) lastCover = t;
    const V = cam.position.constructor, M = cam.matrixWorld.constructor;
    const cr = canvas.getBoundingClientRect(), mat = new M();
    const camW = new V().setFromMatrixPosition(cam.matrixWorld), centre = new V().setFromMatrixPosition(view.rock.matrixWorld);
    const w = new V(), out = new V(), toCam = new V();
    for (const o of view.lots) {
      if (o.lot > view.circles.count) { o.el.style.display = 'none'; continue; }
      view.circles.getMatrixAt(o.lot - 1, mat);
      w.setFromMatrixPosition(mat).applyMatrix4(view.circles.matrixWorld);
      // round the back of the rock?
      out.copy(w).sub(centre).normalize(); toCam.copy(camW).sub(w).normalize();
      if (out.dot(toCam) < 0.15) { o.vis = false; o.el.style.display = 'none'; continue; }
      w.project(cam);
      const x = (w.x + 1) / 2 * cr.width + cr.left + OFFSET[0], y = (1 - w.y) / 2 * cr.height + cr.top + OFFSET[1];
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
    if (!raw) { if (++waited > 60) { clearInterval(go); stopWatching(); note('options not found'); } return; }
    clearInterval(go);
    let on = true; try { on = JSON.parse(raw).statusDots === true; } catch (e) {}
    if (!on) { stopWatching(); note('switched off in options'); return; }
    setInterval(() => { try { refresh(); } catch (e) { clearView(); note('paused – ' + e.message); } }, 2000);
    const loop = () => { requestAnimationFrame(loop); try { frame(); } catch (e) { clearView(); note('paused – ' + e.message); } };
    requestAnimationFrame(loop);
  }, 1000);
})();
