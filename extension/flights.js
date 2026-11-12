// Skippy's Command Deck – your ships in flight on the system map (runs on game.influenceth.io, in the page).
// Draws a small marker where each of your ships is right now, with a faint line along its route,
// a hollow ring where ship and rock meet and light blue dots back to where that rock is now
// (worked out with the same orbit maths as the game: Lambert transfer from where the start rock was
// when the ship left, to where the end rock will be when it arrives). Hover a ship for its name,
// route and arrival time. Your own ships come from what the game has already loaded.
// Other players' ships come from the Command Deck's belt-wide flight list (your-command.adalia.academy,
// refreshed every 5 minutes – game.js fetches it via the background). They're coloured by your friend /
// foe tags (tagged on the owner's wallet). Never clicks or changes anything in the game.
(() => {
  if (window.top !== window || window.__yicFlights) return;
  window.__yicFlights = true;
  const root = document.documentElement;
  const note = t => { if (root) root.dataset.yicFlights = t; };

  // ---- orbit maths (metres, sun-centred – the same frame as the game's map) ----
  const MU = 1.1369e20, EPOCH = 1609459200;
  const adays = unix => (unix - EPOCH) / 3600;
  const gameUnix = x => EPOCH + x / 24;   // Ship.transitDeparture / transitArrival → unix seconds
  function astPos(o, t) {
    const a = o.a * 1000, e = o.ecc, n = Math.sqrt(MU / (a * a * a));
    const M = (o.m + n * t * 86400) % (2 * Math.PI);
    let E = M;
    for (let i = 0; i < 30; i++) { const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-12) break; }
    const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    const r = a * (1 - e * Math.cos(E)), u = o.argp + nu;
    const cO = Math.cos(o.raan), sO = Math.sin(o.raan), ci = Math.cos(o.inc), si = Math.sin(o.inc), cu = Math.cos(u), su = Math.sin(u);
    return [r * (cO * cu - sO * su * ci), r * (sO * cu + cO * su * ci), r * su * si];
  }
  const C = z => z > 1e-6 ? (1 - Math.cos(Math.sqrt(z))) / z : z < -1e-6 ? (Math.cosh(Math.sqrt(-z)) - 1) / -z : 0.5 - z / 24;
  const S = z => { if (z > 1e-6) { const s = Math.sqrt(z); return (s - Math.sin(s)) / (s * s * s); } if (z < -1e-6) { const s = Math.sqrt(-z); return (Math.sinh(s) - s) / (s * s * s); } return 1 / 6 - z / 120; };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = a => Math.sqrt(dot(a, a));
  // Lambert (universal variables, no extra laps): velocities at both ends for r1 → r2 in dt seconds.
  // long = go the long way round. Returns null if there's no answer.
  function lambert(r1, r2, dt, long) {
    const R1 = len(r1), R2 = len(r2);
    let th = Math.acos(Math.max(-1, Math.min(1, dot(r1, r2) / (R1 * R2))));
    if (long) th = 2 * Math.PI - th;
    const A = Math.sin(th) * Math.sqrt(R1 * R2 / (1 - Math.cos(th)));
    if (!isFinite(A) || Math.abs(A) < 1) return null;
    const y = z => R1 + R2 + A * (z * S(z) - 1) / Math.sqrt(C(z));
    const F = z => { const v = y(z); return Math.pow(v / C(z), 1.5) * S(z) + A * Math.sqrt(v) - Math.sqrt(MU) * dt; };
    let lo = -4 * Math.PI * Math.PI, hi = 4 * Math.PI * Math.PI - 1e-6;
    while (y(lo) < 0 && lo < hi) lo += 0.01;
    if (F(lo) > 0 || F(hi) < 0) return null;
    for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (F(m) > 0) hi = m; else lo = m; }
    const v = y((lo + hi) / 2), f = 1 - v / R1, g = A * Math.sqrt(v / MU), gd = 1 - v / R2;
    return { v1: [0, 1, 2].map(i => (r2[i] - f * r1[i]) / g), v2: [0, 1, 2].map(i => (gd * r2[i] - r1[i]) / g) };
  }
  // The game picks the cheapest way (least Δv), so try both ways round and keep the cheaper one.
  function transfer(oO, dO, dep, arr) {
    const t1 = adays(dep), t2 = adays(arr), T = (arr - dep) * 24;
    const r1 = astPos(oO, t1), r2 = astPos(dO, t2);
    const vel = (o, t) => { const a = astPos(o, t + 1 / 24), b = astPos(o, t - 1 / 24); return [0, 1, 2].map(i => (a[i] - b[i]) / 7200); };
    const va = vel(oO, t1), vb = vel(dO, t2);
    let best = null;
    for (const long of [false, true]) {
      const s = lambert(r1, r2, T, long); if (!s) continue;
      const dv = len(s.v1.map((x, i) => x - va[i])) + len(s.v2.map((x, i) => x - vb[i]));
      if (!best || dv < best.dv) best = { r1, v1: s.v1, dv, T };
    }
    return best;
  }
  function propagate(r0, v0, dt) {
    const R0 = len(r0), vr = dot(r0, v0) / R0, al = 2 / R0 - dot(v0, v0) / MU, sm = Math.sqrt(MU);
    let x = sm * Math.abs(al) * dt;
    for (let i = 0; i < 100; i++) {
      const z = al * x * x, c = C(z), s = S(z);
      const Fx = R0 * vr / sm * x * x * c + (1 - al * R0) * x * x * x * s + R0 * x - sm * dt;
      const dF = R0 * vr / sm * x * (1 - al * x * x * s) + (1 - al * R0) * x * x * c + R0;
      const d = Fx / dF; x -= d; if (Math.abs(d) < 1e-8) break;
    }
    const z = al * x * x, f = 1 - x * x / R0 * C(z), g = dt - x * x * x / sm * S(z);
    return [0, 1, 2].map(i => f * r0[i] + g * v0[i]);
  }

  // ---- what the game has loaded: your ships, and the asteroids' orbits and names ----
  let qc = null;
  function findQueryClient() {
    let start = null;
    for (const el of document.querySelectorAll('body *')) { const k = Object.keys(el).find(k => k.startsWith('__reactFiber$')); if (k) { start = el[k]; break; } }
    if (!start) return null;
    let f = start; while (f.return) f = f.return;
    const st = [f]; let n = 0;
    while (st.length && n < 300000) { const x = st.pop(); n++; const p = x.memoizedProps; if (p && p.client && typeof p.client.getQueryCache === 'function') return p.client; if (x.sibling) st.push(x.sibling); if (x.child) st.push(x.child); }
    return null;
  }
  const routes = new Map(); // ship id -> { rel, name, from, to, dep, arr, r1, v1, path, end, dOrb, owner }
  // ---- other players' ships, from the Command Deck (game.js passes them in) and your tags ----
  let others = null, tags = {};
  const std = a => { try { return '0x' + BigInt(a).toString(16); } catch (e) { return null; } };
  const short = a => a ? a.slice(0, 6) + '…' + a.slice(-4) : '';
  window.addEventListener('message', e => {
    if (e.source !== window || !e.data) return;
    if (e.data.yic === 'tags' && e.data.tags && typeof e.data.tags === 'object') { tags = e.data.tags; retag(); }
    if (e.data.yic === 'flights' && e.data.data && Array.isArray(e.data.data.ships)) { others = e.data.data; readOthers(); }
  });
  const relOf = owner => { const t = owner && tags[owner]; return t && RGB[t.tag] ? t.tag : 'other'; };
  function retag() { routes.forEach(r => { if (r.rel !== 'mine') { const n = relOf(r.owner); if (n !== r.rel) { r.rel = n; dirty = true; } } }); }
  function readOthers() {
    if (!others) return;
    const now = Date.now() / 1000, seen = new Set(), O = others.orbits || {}, N = others.names || {};
    const orbit = id => { const o = O[id]; return o && { a: o[0], ecc: o[1], inc: o[2], raan: o[3], argp: o[4], m: o[5] }; };
    for (const k in N) if (!astName.has(Number(k))) astName.set(Number(k), N[k]);
    others.ships.forEach(x => {
      const [id, name, , ownerRaw, , from, to, dep, arr] = x;
      if (!(arr > now) || (routes.get(id) && routes.get(id).rel === 'mine')) return;
      seen.add(id);
      const owner = ownerRaw ? std(ownerRaw) : null, old = routes.get(id);
      if (old && old.dep === dep && old.arr === arr) return;
      const oO = orbit(from), dO = orbit(to); if (!oO || !dO) return;
      const tr = transfer(oO, dO, dep, arr); if (!tr) return;
      const path = []; for (let i = 0; i <= 64; i++) path.push(...propagate(tr.r1, tr.v1, tr.T * i / 64));
      routes.set(id, { rel: relOf(owner), owner, name: name || ('Ship #' + id), from, to, dep, arr, r1: tr.r1, v1: tr.v1, path, end: path.slice(-3), dOrb: dO });
      dirty = true;
    });
    for (const [id, r] of [...routes]) if (r.rel !== 'mine' && !seen.has(id)) { routes.delete(id); dirty = true; }
  }
  const astName = new Map();
  function readShips() {
    if (!qc) qc = findQueryClient();
    if (!qc) return;
    const orb = new Map(), ships = new Map();
    qc.getQueryCache().getAll().forEach(q => {
      const d = q.state && q.state.data; if (!d) return;
      const arr = Array.isArray(d) ? d : Array.isArray(d.hits) ? d.hits : [d];
      arr.forEach(x => {
        if (!x || typeof x !== 'object' || !x.id) return;
        if (x.Celestial && x.Orbit) { orb.set(Number(x.id), x.Orbit); if (x.Name && x.Name.name) astName.set(Number(x.id), x.Name.name); }
        if (x.Ship && x.Location && x.Location.location && x.Location.location.label === 10) ships.set(Number(x.id), x);
      });
    });
    const now = Date.now() / 1000, seen = new Set();
    ships.forEach((s, id) => {
      const sh = s.Ship, dep = gameUnix(sh.transitDeparture || 0), arr = gameUnix(sh.transitArrival || 0);
      const from = sh.transitOrigin && sh.transitOrigin.id, to = sh.transitDestination && sh.transitDestination.id;
      if (!(arr > now) || !from || !to) return;
      seen.add(id);
      const old = routes.get(id);
      if (old && old.rel === 'mine' && old.dep === dep && old.arr === arr) return;
      const oO = orb.get(from), dO = orb.get(to); if (!oO || !dO) return;
      const tr = transfer(oO, dO, dep, arr); if (!tr) return;
      const path = [];
      for (let i = 0; i <= 64; i++) path.push(...propagate(tr.r1, tr.v1, tr.T * i / 64));
      routes.set(id, { rel: 'mine', name: (s.Name && s.Name.name) || ('Ship #' + id), from, to, dep, arr, r1: tr.r1, v1: tr.v1, path, dv: tr.dv, end: path.slice(-3), dOrb: dO });
      dirty = true;
    });
    for (const id of [...routes.keys()]) if (!seen.has(id) && routes.get(id).rel === 'mine') { routes.delete(id); dirty = true; }
  }

  // Colour = whose ship: yours in the game's Pilot purple. Ready for later (other players' flights, not fetched yet):
  // friendly teal (green clashed with the market diamonds), neutral yellow, hostile red.
  const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const CSS = { mine: '#884fff', friendly: '#2ee6c9', neutral: '#ffd94f', hostile: '#ff564d', other: '#ff8c1a' };
  const RGB = {}; for (const k in CSS) RGB[k] = hex(CSS[k]);
  const LABEL = { mine: 'Yours', friendly: 'Friendly', neutral: 'Neutral', hostile: 'Hostile', other: 'Not tagged' };
  // Brightness = how much it matters: yours and hostile routes always drawn; friendly / neutral only when you hover the ship.
  const ALWAYS = { mine: 0.5, hostile: 0.45 };
  let hoverId = null;
  let store = null, group = null, marks = null, omarks = null, ends = null, dots = null, dirty = true;
  const VERT = 'attribute vec3 highlightColor; varying vec3 vColor; void main(){ vColor = highlightColor; gl_PointSize = SIZE; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  // a bright core with a soft ring – reads as "something moving", different from the rings and diamonds
  const FRAG = 'varying vec3 vColor; void main(){ float d = length(gl_PointCoord - vec2(0.5)); if (d > 0.5) discard; float a = d < 0.18 ? 1.0 : d > 0.38 ? 0.9 : 0.15; gl_FragColor = vec4(d < 0.18 ? vec3(1.0) : vColor, a); }';
  // where ship and rock meet: a hollow ring; the link back to where the rock is now: small dots
  // other players' ships: a small triangle with a dark edge, so it can't be mistaken for an asteroid dot
  const OFRAG = 'varying vec3 vColor; float tri(vec2 p, float m){ float y0 = 0.06 + m, y1 = 0.94 - m * 0.6; if (p.y < y0 || p.y > y1) return 0.0; return abs(p.x - 0.5) <= (p.y - y0) * 0.5 ? 1.0 : 0.0; } void main(){ vec2 p = gl_PointCoord; if (tri(p, 0.0) < 0.5) discard; gl_FragColor = tri(p, 0.08) > 0.5 ? vec4(vColor, 1.0) : vec4(0.02, 0.04, 0.08, 0.95); }';
  const RING = 'varying vec3 vColor; void main(){ float d = length(gl_PointCoord - vec2(0.5)); if (d > 0.5 || d < 0.3) discard; gl_FragColor = vec4(vColor, 0.9); }';
  // the rock's dotted link is light blue, like your own asteroids' diamonds, so it doesn't look like a ship route
  const DOT = 'varying vec3 vColor; void main(){ if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard; gl_FragColor = vec4(0.31, 0.82, 1.0, 0.85); }';
  function gamePoints(scene) { let p = null; scene.traverse(o => { if (!p && o.isPoints && o !== marks && o !== omarks && o !== ends && o !== dots && o.geometry && o.geometry.attributes && o.geometry.attributes.highlightColor) p = o; }); return p; }
  function gameLine(scene) { let l = null; scene.traverse(o => { if (!l && o.isLine && !(group && group.children.includes(o))) l = o; }); return l; }
  function build(pts, scene) {
    const loop = gameLine(scene); if (!loop) return false;
    group = new (Object.getPrototypeOf(pts.parent).constructor)(); group.name = 'yic-flights';
    const dpr = (store.getState().gl && store.getState().gl.getPixelRatio && store.getState().gl.getPixelRatio()) || window.devicePixelRatio || 1;
    const mk = (size, frag, order) => {
      const m = pts.material.clone();
      m.vertexShader = VERT.replace('SIZE', (size * dpr).toFixed(1)); m.fragmentShader = frag; m.uniforms = {};
      m.depthWrite = false; m.transparent = true; m.needsUpdate = true;
      const p = new pts.constructor(new pts.geometry.constructor(), m);
      p.raycast = () => {}; p.frustumCulled = false; p.renderOrder = order; group.add(p); return p;
    };
    marks = mk(13, FRAG, 12); omarks = mk(22, OFRAG, 11); ends = mk(11, RING, 10); dots = mk(3, DOT, 10);
    group.userData.Line = Object.getPrototypeOf(loop.constructor.prototype).constructor; // THREE.Line
    group.userData.lineMat = loop.material;
    group.userData.A = pts.geometry.attributes.position.constructor;
    return true;
  }
  const nowPos = r => propagate(r.r1, r.v1, (Math.min(r.arr, Math.max(r.dep, Date.now() / 1000)) - r.dep) * 24);
  function update() {
    if (!store) store = window.__yicR3f || null;
    if (!store) return;
    const st = store.getState(), pts = gamePoints(st.scene);
    if (!pts) { if (group) group.visible = false; return; }
    if (!group && !build(pts, st.scene)) return;
    if (group.parent !== pts.parent) { if (group.parent) group.parent.remove(group); pts.parent.add(group); dirty = true; }
    const u = pts.material.uniforms && pts.material.uniforms.uOpacity;
    group.visible = pts.visible && (!u || u.value >= 1) && routes.size > 0 && !hidden;
    showPill(pts.visible && (!u || u.value >= 1));
    const A = group.userData.A;
    if (dirty) {
      group.children.filter(c => c !== marks && c !== omarks && c !== ends && c !== dots).forEach(c => { group.remove(c); c.geometry.dispose(); c.material.dispose(); });
      routes.forEach((r, id) => {
        const g = new marks.geometry.constructor();
        g.setAttribute('position', new A(new Float32Array(r.path), 3));
        const m = group.userData.lineMat.clone(); m.color && m.color.setRGB(...RGB[r.rel]); m.transparent = true; m.depthWrite = false;
        const l = new group.userData.Line(g, m); l.raycast = () => {}; l.frustumCulled = false; l.renderOrder = 9;
        l.userData.id = id; r.line = l; group.add(l);
      });
      dirty = false;
    }
    const P = [], Cc = [], OP = [], OC = [], E = [], EC = [], D = [], DC = [], t = adays(Date.now() / 1000);
    readOpts();
    routes.forEach((r, id) => {
      if (!shown(r)) { r.now = null; if (r.line) r.line.visible = false; return; }
      const p = nowPos(r); r.now = p;
      if (r.rel === 'mine') { P.push(...p); Cc.push(...RGB.mine); } else { OP.push(...p); OC.push(...RGB[r.rel]); }
      const on = id === hoverId, full = r.rel === 'mine' || on;
      if (r.line) { r.line.visible = on || r.rel in ALWAYS; r.line.material.opacity = on ? 0.85 : (ALWAYS[r.rel] || 0); }
      if (!full) return;   // meeting ring and rock link only for your own ships, or the one you hover
      E.push(...r.end); EC.push(...RGB[r.rel]);
      // dotted link from the meeting point back to where the rock is right now (a dot every ~0.04 AU)
      const q = astPos(r.dOrb, t), gap = Math.hypot(q[0] - r.end[0], q[1] - r.end[1], q[2] - r.end[2]);
      const k = Math.min(200, Math.floor(gap / 6e9));
      for (let i = 1; i < k; i++) { const f = i / k; D.push(...[0, 1, 2].map(j => r.end[j] + (q[j] - r.end[j]) * f)); DC.push(0, 0, 0); }
    });
    const put = (o, p, c) => { o.geometry.setAttribute('position', new A(new Float32Array(p), 3)); o.geometry.setAttribute('highlightColor', new A(new Float32Array(c), 3)); };
    put(marks, P, Cc); put(omarks, OP, OC); put(ends, E, EC); put(dots, D, DC);
    note(routes.size + ' ships in flight on the map');
  }

  // ---- hover a ship → name, route and arrival ----
  let tip = null, lastMove = 0;
  const when = t => new Date(t * 1000).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const left = t => { const h = Math.max(0, (t - Date.now() / 1000) / 3600); return h < 1 ? Math.round(h * 60) + ' min' : h < 48 ? h.toFixed(1) + ' h' : (h / 24).toFixed(1) + ' days'; };
  function hover(e) {
    const t = performance.now(); if (t - lastMove < 100) return; lastMove = t;
    let hit = null, hitId = null;
    if (group && group.visible && store) {
      const st = store.getState(), cv = st.gl && st.gl.domElement;
      if (cv && e.target === cv) {
        const b = cv.getBoundingClientRect(); let best = 12;
        routes.forEach((r, id) => {
          if (!r.now) return;
          const v = st.camera.position.clone().set(...r.now);
          group.parent && v.applyMatrix4(group.parent.matrixWorld);
          v.project(st.camera); if (v.z > 1) return;
          const d = Math.hypot(b.left + (v.x + 1) / 2 * b.width - e.clientX, b.top + (1 - v.y) / 2 * b.height - e.clientY);
          if (d < best) { best = d; hit = r; hitId = id; }
        });
      }
    }
    if (hitId !== hoverId) { hoverId = hitId; update(); }
    if (!hit) { if (tip) tip.style.display = 'none'; return; }
    if (!tip || !tip.isConnected) {
      tip = document.createElement('div');
      tip.style.cssText = 'position:fixed;z-index:2147483000;pointer-events:none;font:12px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;color:#fff;background:rgba(8,14,24,.92);padding:4px 8px;border-left:3px solid;white-space:nowrap';
      (document.body || root).appendChild(tip);
    }
    const nm = id => astName.get(id) || ('Asteroid #' + id.toLocaleString());
    const now = Date.now() / 1000, pc = Math.round(100 * (now - hit.dep) / (hit.arr - hit.dep));
    tip.style.borderLeftColor = CSS[hit.rel];
    const lines = [['🚀 ' + hit.name + (hit.rel === 'mine' ? '' : ' · ' + LABEL[hit.rel]), '#fff', 600], [nm(hit.from) + ' → ' + nm(hit.to), '#c3d2e2']];
    if (hit.rel !== 'mine') { const t = hit.owner && tags[hit.owner]; lines.push(['Owner: ' + ((t && t.name) ? t.name + ' (' + short(hit.owner) + ')' : (short(hit.owner) || 'unknown')), '#9fb0c4']); }
    if (now < hit.dep) lines.push(['Leaves ' + when(hit.dep) + ' (in ' + left(hit.dep) + ')', '#ffd94f']);
    lines.push(['Arrives ' + when(hit.arr) + ' (' + left(hit.arr) + (now >= hit.dep ? ', ' + pc + '% there)' : ')'), '#c3d2e2']);
    tip.textContent = '';
    lines
      .forEach(([s, c, w]) => { const d = document.createElement('div'); d.textContent = s; d.style.color = c; if (w) d.style.fontWeight = w; tip.appendChild(d); });
    tip.style.left = (e.clientX + 16) + 'px'; tip.style.top = (e.clientY + 14) + 'px'; tip.style.display = '';
  }

  // ---- a small switch on the belt map, beside the Tags / Markets ones ----
  // Which groups to show – your choices from Options / Deck controls (game.js keeps them up to date, no refresh needed).
  const GROUP = { friendly: 'flightsFriendly', neutral: 'flightsNeutral', hostile: 'flightsHostile', other: 'flightsOther' };
  let opts = {};
  function readOpts() { try { opts = JSON.parse(root.dataset.yicOpts || '{}') || {}; } catch (e) {} }
  const shown = r => r.rel === 'mine' ? opts.mapFlights !== false : opts.mapFlights !== false && opts[GROUP[r.rel]] !== false;
  let hidden = false; try { hidden = localStorage.getItem('yicFlightsHidden') === '1'; } catch (e) {}
  let pill = null;
  function showPill(onMap) {
    if (!pill || !pill.isConnected) {
      pill = document.createElement('button'); pill.type = 'button';
      pill.title = "Skippy's Command Deck – show or hide your ships in flight";
      pill.style.cssText = 'position:fixed;top:44px;right:90px;z-index:2147483000;cursor:pointer;font:12px/1 system-ui,-apple-system,"Segoe UI",sans-serif;padding:5px 10px;color:#d7e6f5;background:rgba(8,14,24,.85);border:1px solid #884fff';
      ['pointerdown', 'pointerup'].forEach(t => pill.addEventListener(t, e => e.stopPropagation()));
      pill.addEventListener('click', e => { e.stopPropagation(); hidden = !hidden; try { localStorage.setItem('yicFlightsHidden', hidden ? '1' : '0'); } catch (err) {} update(); });
      (document.body || root).appendChild(pill);
    }
    pill.textContent = (hidden ? '○ Ships in flight: hidden' : '● Ships in flight: ' + (() => { const v = [...routes.values()].filter(shown), m = v.filter(r => r.rel === 'mine').length; return m + ' yours' + (v.length > m ? ' · ' + (v.length - m) + ' others' : ''); })());
    pill.style.opacity = hidden ? '.6' : '1';
    pill.style.display = onMap && routes.size ? '' : 'none';
  }

  function start() {
    window.addEventListener('pointermove', e => { try { hover(e); } catch (err) {} }, true);
    const tick = () => { try { readShips(); update(); } catch (e) { if (group) group.visible = false; note('paused – ' + e.message); } };
    tick(); setInterval(tick, 2000);
  }
  // In the extension: wait for your options (option "mapFlights"). Pasted in for a test: start straight away.
  if (window.__yicFlightsTest) { start(); return; }
  let waited = 0;
  const go = setInterval(() => {
    const raw = root.dataset.yicOpts;
    if (!raw) { if (++waited > 60) { clearInterval(go); note('options not found'); } return; }
    clearInterval(go);
    start(); // checks "mapFlights" on every tick, so switching it in Options works without a refresh (0.6.7)
  }, 1000);
})();
