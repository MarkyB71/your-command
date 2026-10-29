/* Resource globe – Your Influence Command (Mark, 29 Oct 2026) – TEST on ?beta=1
   Science Lab console. Once you've scanned a rock in the game, every lot has a level for every
   resource. This shows the rock as a spinning globe with each lot glowing by how rich it is in the
   resource you pick. Drag to turn it, hover a lot for its number and level, click a top lot to
   turn the globe to it.
   Lot levels: vendor/abund.js (the game's own maths, from @influenceth/sdk – same as Lot resources).
   Lot positions: the game's lot layout (golden-angle spiral, SDK getLotPosition).
   Uses window.YIC (app.js). */
(function () {
  'use strict';
  const BETA = /[?&]beta=1/.test(location.search);
  if (!BETA) return;

  const GA = Math.PI * (3 - Math.sqrt(5));
  const MOVE = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const S = { rock: '', res: 0, rotY: 0.6, rotX: -0.35, spin: MOVE, focus: null, pulse: 0 };
  let G = null; // current globe {id, res, n, pos, val, max, mine}
  let raf = 0;

  const CSS = `.lg-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 10px}
.lg-row label{color:#8b9ab0;font-size:14px;display:flex;gap:8px;align-items:center}
.lg-row select{font-size:15px;padding:6px 10px;min-width:0!important;max-width:260px}
.lg-wrap{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start}
.lg-stage{position:relative;flex:1 1 420px;max-width:620px;aspect-ratio:1;background:radial-gradient(circle at 50% 50%,#0d1a30 0,#060a12 70%);border:1px solid #223047;border-radius:14px;overflow:hidden;cursor:grab;touch-action:none}
.lg-stage.drag{cursor:grabbing}
.lg-stage canvas{width:100%;height:100%;display:block}
.lg-tip{position:absolute;pointer-events:none;background:#0c1320ee;border:1px solid #4f90ff;color:#e6ebf2;font-size:13px;padding:5px 9px;border-radius:7px;white-space:nowrap;display:none;box-shadow:0 0 12px #4f90ff66}
.lg-side{flex:1 1 240px;min-width:220px}
.lg-box{background:#121a26;border:1px solid #2a3648;border-radius:10px;padding:10px 12px;margin:0 0 10px}
.lg-box h3{margin:0 0 8px;font-size:15px;color:#4f90ff;font-weight:600}
.lg-leg{height:12px;border-radius:6px;background:linear-gradient(90deg,#1a2740,#1f5bd0,#4fc3ff,#bff4ff,#fff);margin:4px 0}
.lg-legt{display:flex;justify-content:space-between;color:#8b9ab0;font-size:12px}
.lg-top{width:100%;border-collapse:collapse;font-size:14px}
.lg-top td{padding:4px 6px;border-top:1px solid #1e2a3b}
.lg-top tr{cursor:pointer}.lg-top tr:hover td{background:#16233a}
.lg-top .lg-p{color:#8fe3ff;font-weight:600;text-align:right}
.lg-dim{color:#8b9ab0;font-size:12px}
.lg-me{display:inline-block;width:9px;height:9px;border:2px solid #ffd24a;border-radius:50%;vertical-align:-1px;margin-right:4px}
.lg-need{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:28px 4px}
.lg-need b{font-size:18px;color:#ffd24a}
.lg-need select{font-size:17px;padding:8px 12px;border:2px solid #ffd24a;box-shadow:0 0 16px -2px #ffd24a;border-radius:8px;min-width:0!important}
.lg-hint{color:#8b9ab0;font-size:12px;margin-top:6px}`;

  function css() {
    if (document.getElementById('lg-css')) return;
    const st = document.createElement('style');
    st.id = 'lg-css';
    st.textContent = CSS;
    document.documentElement.appendChild(st);
  }

  const nm = (a) => (a.Name && a.Name.name) || 'Asteroid #' + a.id;
  const pct = (v) => (v * 100).toFixed(1) + '%';

  // colour for a level 0..1 of this rock's best (dark blue → blue → cyan → white)
  const STOPS = [[0, [26, 39, 64]], [0.35, [31, 91, 208]], [0.65, [79, 195, 255]], [0.88, [191, 244, 255]], [1, [255, 255, 255]]];
  function col(t) {
    t = Math.max(0, Math.min(1, t));
    for (let i = 1; i < STOPS.length; i++) {
      if (t <= STOPS[i][0]) {
        const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i], f = (t - a) / (b - a || 1);
        return ca.map((c, k) => Math.round(c + (cb[k] - c) * f));
      }
    }
    return STOPS[STOPS.length - 1][1];
  }

  // the game's lot layout on a unit sphere
  function lotPos(n) {
    const p = new Float32Array((n + 1) * 3);
    for (let i = 1; i <= n; i++) {
      const y = 1 - ((i - 1) / Math.max(1, n - 1)) * 2, r = Math.sqrt(Math.max(0, 1 - y * y)), th = GA * (i - 1);
      p[i * 3] = r * Math.cos(th); p[i * 3 + 1] = y; p[i * 3 + 2] = r * Math.sin(th);
    }
    return p;
  }

  // your buildings on that rock: lot index → building name
  function myLots(D, astId) {
    const out = {};
    (D.allB || []).forEach((b) => {
      const L = ((b.Location || {}).locations) || [];
      const a = L.find((x) => x.label === 3), l = L.find((x) => x.label === 4);
      if (!a || a.id !== astId || !l || !b.Building || !(b.Building.status >= 1)) return;
      out[Math.floor(l.id / 4294967296)] = (b.Name && b.Name.name) || 'Your building';
    });
    return out;
  }

  const isOn = () => { const b = document.getElementById('vI'); return !!(b && b.className === 'on'); };

  function page(m) {
    css();
    const Y = window.YIC, D = (Y && Y.D) || {}, esc = Y.esc, pn = Y.pn;
    const own = (D.owned || []).filter((a) => a.Celestial && a.Celestial.abundances && a.Celestial.scanStatus >= 4)
      .sort((a, b) => nm(a).localeCompare(nm(b)));
    if (!own.length) { stop(); m.innerHTML = '<div class="note">This needs a rock you own or control that has had its resource scan in the game.</div>'; return; }
    if (!Y.ABM) {
      m.innerHTML = '<div class="note">Loading the game\'s resource maths…</div>';
      import('./abund.js?v=' + Y.VER).then((x) => { Y.ABM = x; if (isOn()) page(m); })
        .catch((e) => { m.innerHTML = '<div class="note">Could not load the resource maths (' + esc((e && e.message) || e) + ').</div>'; });
      return;
    }
    // follow the rock picked on the viewscreen when it's one of the scanned ones
    const ai = (document.getElementById('ast') || {}).value;
    if (ai !== undefined && ai !== '' && Y.asts[+ai]) { const f = own.find((a) => nm(a) === Y.asts[+ai].name); if (f) S.rock = String(f.id); }
    if (!own.some((a) => String(a.id) === S.rock)) {
      // Mark: no default rock – pick one first (same as the planners)
      stop(); G = null;
      m.innerHTML = '<div class="lg-need"><b>👉 First, pick the rock you want to see</b><select id="lg-p"><option value="">– Pick a rock –</option>' +
        own.map((a) => '<option value="' + a.id + '">' + esc(nm(a)) + '</option>').join('') +
        '</select><span class="lg-dim">Only rocks that have had their resource scan in the game are listed.</span></div>';
      m.querySelector('#lg-p').addEventListener('change', (e) => { if (e.target.value) pickRock(Y, own, e.target.value, m); });
      return;
    }
    const A = own.find((a) => String(a.id) === S.rock);
    const ab = Y.ABM.abundances(A.Celestial.abundances);
    const rs = Object.keys(ab).filter((k) => ab[k] > 0).map(Number).sort((x, y) => pn(x).localeCompare(pn(y)));
    if (!rs.includes(S.res)) S.res = Object.keys(ab).map(Number).sort((x, y) => ab[y] - ab[x])[0];

    const n = Y.ABM.lotCount(A.id), k = A.id + '_' + S.res;
    if (!Y.ABC[k]) Y.ABC[k] = Y.ABM.lotsFor(A.id, A.Celestial.abundances, S.res, n);
    const val = Y.ABC[k];
    let max = 0, min = 1; for (let i = 1; i <= n; i++) { if (val[i] > max) max = val[i]; if (val[i] < min) min = val[i]; }
    if (!G || G.id !== A.id || G.n !== n) G = { id: A.id, n, pos: lotPos(n) };
    G.res = S.res; G.val = val; G.max = max; G.min = Math.min(min, max); G.mine = myLots(D, A.id);
    S.focus = null;

    const top = [];
    for (let i = 1; i <= n; i++) top.push(i);
    top.sort((a, b) => val[b] - val[a]);
    let avg = 0; for (let i = 1; i <= n; i++) avg += val[i]; avg /= n;

    let h = '<div class="lg-row"><label>Rock <select id="lg-r">' + own.map((a) => '<option value="' + a.id + '"' + (String(a.id) === S.rock ? ' selected' : '') + '>' + esc(nm(a)) + '</option>').join('') + '</select></label>' +
      '<label>Resource <select id="lg-s">' + rs.map((r) => '<option value="' + r + '"' + (r === S.res ? ' selected' : '') + '>' + esc(pn(r)) + ' (' + Math.round(ab[r] * 100) + '% of rock)</option>').join('') + '</select></label>' +
      '<label><input type="checkbox" id="lg-spin"' + (S.spin ? ' checked' : '') + '> Spin</label></div>';
    h += '<div class="lg-wrap"><div class="lg-stage" id="lg-st"><canvas id="lg-c"></canvas><div class="lg-tip" id="lg-tip"></div></div><div class="lg-side">' +
      '<div class="lg-box"><h3>' + esc(pn(S.res)) + ' on ' + esc(nm(A)) + '</h3>' +
      '<div class="lg-leg"></div><div class="lg-legt"><span>poorest ' + pct(min) + '</span><span>richest ' + pct(max) + '</span></div>' +
      '<div class="lg-dim" style="margin-top:6px">' + n.toLocaleString() + ' lots · average ' + pct(avg) + ' · <span class="lg-me"></span>your buildings</div></div>' +
      '<div class="lg-box"><h3>Richest lots</h3><table class="lg-top nosort">' +
      top.slice(0, 10).map((i) => '<tr data-lot="' + i + '"><td>Lot #' + i + '</td><td class="lg-dim">' + (G.mine[i] ? '<span class="lg-me"></span>' + esc(G.mine[i]) : 'Free / other') + '</td><td class="lg-p">' + pct(val[i]) + '</td></tr>').join('') +
      '</table><div class="lg-hint">Click a lot to turn the globe to it. Drag the globe to turn it.</div></div></div></div>';
    m.innerHTML = h;

    m.querySelector('#lg-r').addEventListener('change', (e) => pickRock(Y, own, e.target.value, m));
    m.querySelector('#lg-s').addEventListener('change', (e) => { S.res = +e.target.value; page(m); });
    m.querySelector('#lg-spin').addEventListener('change', (e) => { S.spin = e.target.checked; });
    m.querySelectorAll('tr[data-lot]').forEach((tr) => tr.addEventListener('click', () => { S.focus = +tr.dataset.lot; S.spin = false; const c = m.querySelector('#lg-spin'); if (c) c.checked = false; S.pulse = performance.now(); }));
    start(m.querySelector('#lg-st'));
  }

  // set the rock here and on the viewscreen rock box (by name)
  function pickRock(Y, own, id, m) {
    S.rock = String(id);
    const s = document.getElementById('ast'), a = own.find((x) => String(x.id) === S.rock);
    if (s && a) { const i = (Y.asts || []).findIndex((x) => x.name === nm(a)); if (i >= 0) s.value = String(i); }
    page(m);
  }

  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  function start(st) {
    stop();
    const cv = st.querySelector('canvas'), tip = st.querySelector('#lg-tip'), ctx = cv.getContext('2d');
    let W = 0, drag = null, mouse = null, last = performance.now(), proj = null;
    const fit = () => { const r = st.getBoundingClientRect(), d = window.devicePixelRatio || 1; W = Math.max(200, Math.round(r.width)); cv.width = W * d; cv.height = W * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    fit();

    st.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, ry: S.rotY, rx: S.rotX }; S.focus = null; st.classList.add('drag'); st.setPointerCapture(e.pointerId); });
    st.addEventListener('pointermove', (e) => {
      const r = st.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (drag) { S.rotY = drag.ry + (e.clientX - drag.x) * 0.01; S.rotX = Math.max(-1.5, Math.min(1.5, drag.rx + (e.clientY - drag.y) * 0.01)); }
    });
    const up = () => { drag = null; st.classList.remove('drag'); };
    st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
    st.addEventListener('pointerleave', () => { mouse = null; tip.style.display = 'none'; });

    function frame(t) {
      if (!st.isConnected || !isOn()) { raf = 0; return; }
      const dt = Math.min(0.1, (t - last) / 1000); last = t;
      if (st.getBoundingClientRect().width && Math.abs(st.getBoundingClientRect().width - W) > 2) fit();
      if (S.spin && !drag) S.rotY += dt * 0.25;
      if (S.focus && G) { // ease round to face that lot
        const i = S.focus, x = G.pos[i * 3], y = G.pos[i * 3 + 1], z = G.pos[i * 3 + 2];
        const ty = -Math.atan2(x, z), tx = Math.asin(Math.max(-1, Math.min(1, y)));
        let d = ty - S.rotY; d = Math.atan2(Math.sin(d), Math.cos(d));
        S.rotY += d * Math.min(1, dt * 4); S.rotX += (tx - S.rotX) * Math.min(1, dt * 4);
      }
      proj = draw(ctx, W, t);
      hover(proj);
      raf = requestAnimationFrame(frame);
    }

    function hover(p) {
      if (!mouse || drag || !p || !G) { tip.style.display = 'none'; return; }
      let best = -1, bd = 1e9;
      for (let j = 0; j < p.length; j += 4) {
        if (p[j + 3] <= 0) continue;
        const dx = p[j + 1] - mouse.x, dy = p[j + 2] - mouse.y, d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = p[j]; }
      }
      if (best < 0 || bd > 400) { tip.style.display = 'none'; return; }
      const Y = window.YIC, esc = Y.esc;
      tip.innerHTML = '<b>Lot #' + best + '</b> · ' + pct(G.val[best]) + ' ' + esc(Y.pn(G.res)) + (G.mine[best] ? '<br><span class="lg-me"></span>' + esc(G.mine[best]) : '');
      tip.style.display = 'block';
      const tx = Math.min(W - tip.offsetWidth - 6, mouse.x + 14), ty = Math.max(6, mouse.y - tip.offsetHeight - 10);
      tip.style.left = tx + 'px'; tip.style.top = ty + 'px';
    }

    raf = requestAnimationFrame(frame);
  }

  // draw the globe; returns [lot, x, y, depth] for lots on the near side
  function draw(ctx, W, t) {
    ctx.clearRect(0, 0, W, W);
    if (!G) return null;
    const c = W / 2, R = W * 0.4, n = G.n;
    const cy = Math.cos(S.rotY), sy = Math.sin(S.rotY), cx = Math.cos(S.rotX), sx = Math.sin(S.rotX);

    // halo + body
    const halo = ctx.createRadialGradient(c, c, R * 0.9, c, c, R * 1.25);
    halo.addColorStop(0, 'rgba(79,144,255,.28)'); halo.addColorStop(1, 'rgba(79,144,255,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(c, c, R * 1.25, 0, 7); ctx.fill();
    const body = ctx.createRadialGradient(c - R * 0.35, c - R * 0.35, R * 0.1, c, c, R);
    body.addColorStop(0, '#1c2638'); body.addColorStop(1, '#070b13');
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(c, c, R, 0, 7); ctx.fill();

    // dot size from lot spacing on the sphere
    const dot = Math.max(1.2, Math.min(9, R * Math.sqrt(4 / n) * 0.95));
    const out = [];
    const pts = [];
    for (let i = 1; i <= n; i++) {
      let x = G.pos[i * 3], y = G.pos[i * 3 + 1], z = G.pos[i * 3 + 2];
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;  // turn left/right
      const y2 = y * cx - z1 * sx, z2 = y * sx + z1 * cx; // tilt
      if (z2 < -0.15) continue;
      pts.push(i, x1, y2, z2);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let j = 0; j < pts.length; j += 4) {
      const i = pts[j], x = c + pts[j + 1] * R, y = c - pts[j + 2] * R, z = pts[j + 3];
      const lv = G.max > G.min ? (G.val[i] - G.min) / (G.max - G.min) : 1, [r, g, b] = col(lv);
      const shade = Math.max(0.15, Math.min(1, (z + 0.15) * 1.1)); // dimmer toward the edge
      const s = dot * (0.55 + 0.45 * Math.sqrt(Math.max(0, z))) * (0.7 + 0.5 * lv);
      if (lv > 0.75) { // rich lots glow
        const gl = ctx.createRadialGradient(x, y, 0, x, y, s * 3);
        gl.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + (0.45 * shade).toFixed(3) + ')');
        gl.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, s * 3, 0, 7); ctx.fill();
      }
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (shade * (0.35 + 0.65 * lv)).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill();
      if (z > 0) out.push(i, x, y, z);
    }
    ctx.globalCompositeOperation = 'source-over';

    // your buildings: gold rings on the near side
    ctx.strokeStyle = 'rgba(255,210,74,.85)'; ctx.lineWidth = 1.4;
    for (let j = 0; j < pts.length; j += 4) {
      const i = pts[j]; if (!G.mine[i] || pts[j + 3] <= 0.05) continue;
      ctx.beginPath(); ctx.arc(c + pts[j + 1] * R, c - pts[j + 2] * R, dot * 1.3 + 2, 0, 7); ctx.stroke();
    }

    // the lot picked from the list pulses
    if (S.focus) {
      for (let j = 0; j < pts.length; j += 4) {
        if (pts[j] !== S.focus || pts[j + 3] <= 0) continue;
        const ph = MOVE ? ((t - S.pulse) / 900) % 1 : 0.4;
        ctx.strokeStyle = 'rgba(143,227,255,' + (1 - ph).toFixed(3) + ')'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(c + pts[j + 1] * R, c - pts[j + 2] * R, dot * 1.5 + 4 + ph * 18, 0, 7); ctx.stroke();
      }
    }

    // soft rim light
    ctx.strokeStyle = 'rgba(79,144,255,.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(c, c, R, 0, 7); ctx.stroke();
    return out;
  }

  // Adds "Resource globe" to the Science Lab, after Supply chain (beta only)
  const hook = () => {
    const after = document.getElementById('vE') || document.getElementById('vF'), main = document.getElementById('main');
    if (!after || !main || document.getElementById('vI')) return;
    const b = document.createElement('button');
    b.id = 'vI';
    b.textContent = 'Resource globe';
    after.after(b);
    b.addEventListener('click', () => {
      document.querySelectorAll('button.on').forEach((x) => x.classList.remove('on'));
      try { window.YIC.view = 'M'; } catch (e) {} // add-on page showing – app.js leaves #main alone
      b.className = 'on';
      S.rock = ''; // ask for the rock each time the page is opened (unless the viewscreen box has one)
      page(main);
    });
  };
  document.addEventListener('click', (e) => {
    const b = document.getElementById('vI'), t = e.target.closest && e.target.closest('button[id^="v"]');
    if (b && t && t !== b) b.className = '';
  }, true);
  // redraw when the viewscreen rock box changes
  document.addEventListener('change', (e) => { if (e.target && e.target.id === 'ast' && isOn()) { if (e.target.value === '') S.rock = ''; } if (e.target && e.target.id === 'ast' && isOn()) page(document.getElementById('main')); });
  setInterval(hook, 700);
})();
