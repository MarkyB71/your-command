/* Lot leases – Your Influence Command (Mark, 5 Nov 2026) – LIVE 5 Nov 2026
   Community request: see which lots can be leased. Pick ANY asteroid (name or number) and see
   the owner's lease offer once, plus every lot on a globe: leased by you, leased by someone else, or free.
   Where the leases on a rock were made at different prices, "Colour by price" shows them as a heat map.
   Data: lotleases.php (public game data, kept 30 min per asteroid on the server).
   Lot positions: the game's lot layout (golden-angle spiral), lot count from vendor/abund.js. */
(function () {
  'use strict';
  // LIVE 5 Nov 2026 (tested on ?beta=1, Mark)

  const GA = Math.PI * (3 - Math.sqrt(5));
  const MOVE = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  // colours: the game's own (influence-client theme) – green = free/available, gold = yours, grey = someone else's
  const C_FREE = [87, 255, 101], C_MINE = [255, 210, 74], C_OTHER = [139, 154, 176];
  const C_CHEAP = [87, 255, 101], C_MID = [255, 217, 79], C_DEAR = [255, 86, 77];
  const S = { q: '', ff: false, zoom: 1, rotY: 0.6, rotX: -0.35, spin: MOVE, byPrice: false, show: { free: true, mine: true, other: true } };
  const CACHE = {}, LOAD = {};
  // friend / foe tags: kept in the Command Deck extension (0.6.3+), keyed by the owner's wallet
  let TAGS = null, TCOL = { friendly: '#88e675', neutral: '#ffd94f', hostile: '#ff564d' };
  const hexRGB = (h) => [1, 3, 5].map((k) => parseInt(h.substr(k, 2), 16));
  window.addEventListener('message', (e) => {
    if (e.source !== window || e.origin !== location.origin || !e.data || e.data.type !== 'yic-opts') return;
    TAGS = e.data.tags || {}; const o = e.data.opts || {};
    ['friendly', 'neutral', 'hostile'].forEach((k) => { if (/^#[0-9a-f]{6}$/i.test(o['tagCol_' + k] || '')) TCOL[k] = o['tagCol_' + k]; });
    if (G) G.tagRGB = null;
    if (isOn() && G) page(document.getElementById('main'));
  });
  const askTags = () => window.postMessage({ type: 'yic-opts-get' }, location.origin);
  const tagOf = (crew) => { const w = G && G.owners && G.owners[crew]; const t = w && TAGS && TAGS[w]; return t && TCOL[t.tag] ? t : null; };
  let G = null, raf = 0;

  const CSS = `
.ll-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 12px}
.ll-top input{flex:1 1 220px;min-width:0;padding:8px 10px;background:#0c1320;border:1px solid #2a3646;border-radius:6px;color:#e6ebf2;font-size:14px}
.ll-top button{padding:8px 12px;border:1px solid #2a3646;border-radius:6px;background:#101a26;color:#8fe3ff;cursor:pointer}
.ll-top button:hover{border-color:#8fe3ff}
.ll-quick{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}
.ll-quick button{padding:4px 10px;border:1px solid #1e2a3a;border-radius:12px;background:#0c1320;color:#c4cdd9;font-size:12px;cursor:pointer}
.ll-quick button:hover{border-color:#4fb3ff}
.ll-offer{padding:10px 14px;margin:0 0 12px;border:1px solid #2a3646;border-left:3px solid #57ff65;background:#0c1320;color:#c4cdd9;line-height:1.5}
.ll-offer.no{border-left-color:#8b9ab0}
.ll-offer b{color:#fff}
.ll-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,300px);gap:16px;align-items:start}
@media (max-width:760px){.ll-grid{grid-template-columns:minmax(0,1fr)}}
.ll-st{position:relative;width:100%;max-width:640px;aspect-ratio:1;margin:0 auto;cursor:grab;touch-action:none}
.ll-st.drag{cursor:grabbing}
.ll-st canvas{width:100%;height:100%;display:block}
.ll-zm{position:absolute;right:8px;top:8px;display:flex;flex-direction:column;gap:4px;z-index:3}
.ll-zm button{width:30px;height:30px;padding:0;border:1px solid #2a3646;border-radius:6px;background:rgba(16,26,38,.9);color:#8fe3ff;font:700 16px/1 system-ui,sans-serif;cursor:pointer}
.ll-zm button:hover{border-color:#8fe3ff}
.ll-tip{position:absolute;display:none;pointer-events:none;padding:6px 9px;background:rgba(8,14,24,.94);border:1px solid #2a3646;border-radius:6px;color:#c4cdd9;font-size:12px;line-height:1.45;white-space:nowrap;z-index:2}
.ll-tip b{color:#fff}
.ll-side label{display:flex;align-items:center;gap:8px;padding:7px 10px;margin:0 0 6px;border:1px solid #1e2a3a;border-radius:8px;background:#0c1320;cursor:pointer;color:#c4cdd9}
.ll-side label:hover{border-color:#4fb3ff}
.ll-side i{display:inline-block;width:10px;height:10px;border-radius:50%;flex:none}
.ll-side .n{margin-left:auto;color:#fff;font-weight:600}
.ll-side h3{margin:14px 0 6px;font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#4fb3ff}
.ll-bar{height:8px;border-radius:4px;background:linear-gradient(90deg,#57ff65,#ffd94f,#ff564d);margin:4px 0 2px}
.ll-dim{color:#8b9ab0;font-size:12px}
.ll-mine{max-height:220px;overflow:auto;font-size:12px}
.ll-mine div{padding:3px 0;border-bottom:1px solid #141d2b}`;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const perDay = (rate) => (rate / 1e6) * 24; // rate = SWAY x1e6 per hour
  const fmtSway = (v) => (v >= 100 ? Math.round(v).toLocaleString() : (+v.toPrecision(3)).toLocaleString()) + ' SWAY';
  const days = (s) => { const d = Math.round(s / 86400); return d + (d === 1 ? ' day' : ' days'); };
  const day = (t) => new Date(t * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const isOn = () => { const b = document.getElementById('vLL'); return !!(b && b.className === 'on'); };
  const myCrews = () => { try { return new Set(((window.YIC.D && window.YIC.D.crewList) || []).map((c) => c.id)); } catch (e) { return new Set(); } };
  const myRocks = () => { try { return ((window.YIC.D && window.YIC.D.owned) || []).map((a) => ({ id: a.id, name: (a.Name && a.Name.name) || 'Asteroid #' + a.id })); } catch (e) { return []; } };

  function css() {
    if (document.getElementById('ll-css')) return;
    const st = document.createElement('style'); st.id = 'll-css'; st.textContent = CSS; document.documentElement.appendChild(st);
  }

  function lotPos(n) {
    const p = new Float32Array((n + 1) * 3);
    for (let i = 1; i <= n; i++) {
      const y = 1 - ((i - 1) / Math.max(1, n - 1)) * 2, r = Math.sqrt(Math.max(0, 1 - y * y)), th = GA * (i - 1);
      p[i * 3] = r * Math.cos(th); p[i * 3 + 1] = y; p[i * 3 + 2] = r * Math.sin(th);
    }
    return p;
  }

  function fetchRock(q) {
    const k = q.toLowerCase();
    if (CACHE[k] || LOAD[k]) return;
    const url = 'lotleases.php?' + (/^\d+$/.test(q) ? 'a=' + q : 'n=' + encodeURIComponent(q));
    LOAD[k] = fetch(url, { cache: 'no-store' }).then((r) => r.json()).then((j) => { CACHE[k] = j; })
      .catch((e) => { CACHE[k] = { error: String((e && e.message) || e) }; })
      .finally(() => { delete LOAD[k]; if (isOn() && S.q.toLowerCase() === k) page(document.getElementById('main')); });
  }

  function pick(q, m) { S.q = String(q).trim(); G = null; page(m); }

  function page(m) {
    css();
    const Y = window.YIC || {};
    let h = '<div class="ll-top"><input id="ll-q" placeholder="Asteroid name or number – e.g. Adalia Prime or 104" value="' + esc(S.q) + '"><button id="ll-go">Show leases</button></div>';
    const quick = [{ id: 1, name: 'Adalia Prime' }].concat(myRocks().filter((a) => a.id !== 1));
    h += '<div class="ll-quick">' + quick.map((a) => '<button data-q="' + a.id + '">' + esc(a.name) + '</button>').join('') + '</div>';
    const bind = () => {
      const go = () => { const v = m.querySelector('#ll-q').value.trim(); if (v) pick(v, m); };
      m.querySelector('#ll-go').addEventListener('click', go);
      m.querySelector('#ll-q').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      m.querySelectorAll('.ll-quick button').forEach((b) => b.addEventListener('click', () => pick(b.dataset.q, m)));
    };
    if (!S.q) { stop(); m.innerHTML = h + '<div class="note">Pick an asteroid to see its lease offer and which lots are leased.</div>'; bind(); return; }
    if (!Y.ABM) {
      m.innerHTML = h + '<div class="note">Loading the game\'s lot maths…</div>'; bind();
      import('./abund.js?v=' + (Y.VER || 1)).then((x) => { Y.ABM = x; if (isOn()) page(m); })
        .catch((e) => { m.innerHTML = h + '<div class="note">Could not load the lot maths (' + esc((e && e.message) || e) + ').</div>'; bind(); });
      return;
    }
    const d = CACHE[S.q.toLowerCase()];
    if (!d) { stop(); fetchRock(S.q); m.innerHTML = h + '<div class="note">Reading the leases on ' + esc(S.q) + '… (big rocks like Adalia Prime take a little while the first time)</div>'; bind(); return; }
    if (d.error) { stop(); m.innerHTML = h + '<div class="note">' + esc(d.error) + '</div>'; bind(); return; }

    // build the globe data once per rock
    if (!G || G.id !== d.id) {
      const n = Y.ABM.lotCount(d.id), mine = myCrews();
      const st = new Uint8Array(n + 1), rate = new Float32Array(n + 1), info = {};
      d.leases.forEach(([lot, crew, r, end]) => { if (lot < 1 || lot > n) return; st[lot] = mine.has(crew) ? 2 : 1; rate[lot] = r; info[lot] = [crew, r, end]; });
      const rates = [...new Set(d.leases.map((l) => l[2]))].sort((a, b) => a - b);
      G = { owners: d.owners || {}, id: d.id, n, pos: lotPos(n), st, rate, info, rates, leased: d.leases.map((l) => l[0]).filter((i) => i >= 1 && i <= n), lo: rates[0] || 0, hi: rates[rates.length - 1] || 0 };
      if (G.rates.length < 2) S.byPrice = false;
    }
    const nm = d.name || 'Asteroid #' + d.id;
    const cnt = [0, 0, 0]; for (let i = 1; i <= G.n; i++) cnt[G.st[i]]++;
    const crew = (id) => (d.crews && d.crews[id]) || 'Crew #' + id;

    let offer;
    if (d.offer) offer = '<div class="ll-offer"><b>' + esc(nm) + '</b> leases its lots for <b>' + fmtSway(perDay(d.offer.rate)) + ' a day</b>' +
      ' · minimum ' + days(d.offer.minTerm) + ' · notice ' + days(d.offer.notice) + (d.admin ? ' · from ' + esc(crew(d.admin)) + (() => { const t = TAGS && d.owners && d.owners[d.admin] && TAGS[d.owners[d.admin]]; return t && TCOL[t.tag] ? ' <span style="color:' + TCOL[t.tag] + '">(' + t.tag + ')</span>' : ''; })() : '') + '</div>';
    else if (d.public) offer = '<div class="ll-offer"><b>' + esc(nm) + '</b> lets anyone use its lots free (public).</div>';
    else offer = '<div class="ll-offer no"><b>' + esc(nm) + '</b> is not offering lots for lease at the moment' + (d.contract ? ' (it uses contracts instead).' : '.') + '</div>';

    const row = (k, c, label, n) => '<label><input type="checkbox" data-k="' + k + '"' + (S.show[k] ? ' checked' : '') + '><i style="background:rgb(' + c.join(',') + ')"></i>' + label + '<span class="n">' + n.toLocaleString() + '</span></label>';
    let side = '<div class="ll-side"><h3>Lots</h3>' +
      row('free', C_FREE, d.offer || d.public ? 'Free to lease' : 'Not leased', cnt[0]) +
      row('mine', C_MINE, 'Leased by you', cnt[2]) +
      row('other', C_OTHER, 'Leased by others', cnt[1]);
    if (G.rates.length > 1) {
      side += '<h3>Price</h3><label><input type="checkbox" id="ll-price"' + (S.byPrice ? ' checked' : '') + '>Colour leased lots by price</label>' +
        '<div class="ll-bar"></div><div class="ll-dim" style="display:flex;justify-content:space-between"><span>' + fmtSway(perDay(G.lo)) + '/day</span><span>' + fmtSway(perDay(G.hi)) + '/day</span></div>' +
        '<div class="ll-dim" style="margin-top:4px">Leases here were made at different prices.</div>';
    }
    {
      const tc = { friendly: 0, neutral: 0, hostile: 0 };
      d.leases.forEach((l) => { const t = tagOf(l[1]); if (t) tc[t.tag]++; });
      side += '<h3>Friend / foe</h3>';
      if (TAGS === null) side += '<div class="ll-dim">Needs Skippy\'s Command Deck 0.6.3 or later – your tags from the game\'s belt map show here.</div>';
      else side += '<label><input type="checkbox" id="ll-ff"' + (S.ff ? ' checked' : '') + '>Colour leased lots by your tags</label>' +
        ['friendly', 'neutral', 'hostile'].map((k) => '<div class="ll-dim" style="display:flex;align-items:center;gap:8px;padding:2px 10px"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + TCOL[k] + '"></i>' + k[0].toUpperCase() + k.slice(1) + '<span style="margin-left:auto;color:#fff">' + tc[k].toLocaleString() + '</span></div>').join('') +
        '<div class="ll-dim" style="margin-top:4px">Untagged tenants stay grey. Tag players on the game\'s belt map or in Deck controls.</div>';
    }
    const mineList = d.leases.filter((l) => G.st[l[0]] === 2).sort((a, b) => a[3] - b[3]);
    if (mineList.length) side += '<h3>Your leases here</h3><div class="ll-mine">' + mineList.map((l) => '<div><a href="#" data-lot="' + l[0] + '" style="color:#8fe3ff">Lot ' + l[0].toLocaleString() + ' ↗</a> – ends ' + day(l[3]) + '</div>').join('') + '</div>';
    side += '<p class="ll-dim" style="margin-top:12px">' + G.n.toLocaleString() + ' lots · updated ' + new Date(d.fetched * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' (kept 30 min). Drag to turn the rock, scroll or pinch (or + / −) to zoom, hover a lot for details, click a lot to open it in the game.</p></div>';

    m.innerHTML = h + offer + '<div class="ll-grid"><div class="ll-st"><canvas></canvas><div class="ll-zm"><button data-z="in" title="Zoom in">+</button><button data-z="out" title="Zoom out">−</button><button data-z="0" title="Whole rock" style="font-size:12px">⟲</button></div><div class="ll-tip" id="ll-tip"></div></div>' + side + '</div>';
    bind();
    m.querySelectorAll('.ll-side input[data-k]').forEach((x) => x.addEventListener('change', () => { S.show[x.dataset.k] = x.checked; }));
    const pc = m.querySelector('#ll-price'); if (pc) pc.addEventListener('change', () => { S.byPrice = pc.checked; if (pc.checked) { S.ff = false; const f = m.querySelector('#ll-ff'); if (f) f.checked = false; } });
    const fc = m.querySelector('#ll-ff'); if (fc) fc.addEventListener('change', () => { S.ff = fc.checked; if (fc.checked) { S.byPrice = false; if (pc) pc.checked = false; } });
    G.crew = crew; G.offer = d.offer;
    m.querySelectorAll('.ll-mine a[data-lot]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); openLot(+a.dataset.lot); }));
    start(m.querySelector('.ll-st'));
  }

  const mix = (a, b, t) => a.map((x, k) => Math.round(x + (b[k] - x) * t));
  function priceRGB(r) {
    const t = G.hi > G.lo ? (r - G.lo) / (G.hi - G.lo) : 0;
    return t < 0.5 ? mix(C_CHEAP, C_MID, t * 2) : mix(C_MID, C_DEAR, (t - 0.5) * 2);
  }
  function rgbOf(i) {
    const s = G.st[i];
    if (s === 0) return S.show.free ? C_FREE : null;
    if (s === 2) return S.show.mine ? C_MINE : null;
    if (!S.show.other) return null;
    if (S.ff) { const t = tagOf(G.info[i] && G.info[i][0]); return t ? hexRGB(TCOL[t.tag]) : C_OTHER; }
    return S.byPrice ? priceRGB(G.rate[i]) : C_OTHER;
  }

  function tipHTML(i) {
    const f = G.info[i];
    let t = '<b>Lot ' + i.toLocaleString() + '</b><br>';
    if (!f) return t + (G.offer ? 'Free to lease – ' + fmtSway(perDay(G.offer.rate)) + ' a day' : 'Not leased') + CLICK;
    return t + (G.st[i] === 2 ? '<span style="color:#ffd24a">Leased by you</span> (' + esc(G.crew(f[0])) + ')' : 'Leased by ' + esc(G.crew(f[0])) + (() => { const t = tagOf(f[0]); return t ? ' <span style="color:' + TCOL[t.tag] + '">' + t.tag + (t.name ? ' – ' + esc(t.name) : '') + '</span>' : ''; })()) +
      '<br>' + fmtSway(perDay(f[1])) + ' a day · ends ' + day(f[2]) + CLICK;
  }

  // open a lot in the game: through the Command Deck extension when it's there (moves the open game tab), else a new tab
  function openLot(i) {
    if (!G || !i) return;
    const path = '/lot/' + (BigInt(G.id) + (BigInt(i) << 32n)).toString();
    if (window.GL && window.GL.on && window.GL.on()) window.postMessage({ type: 'yic-open', path }, location.origin);
    else window.open('https://game.influenceth.io' + path, 'influencegame');
  }
  const CLICK = '<br><span style="color:#8fe3ff">Click to open in the game ↗</span>';

  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  function start(st) {
    stop();
    const cv = st.querySelector('canvas'), tip = st.querySelector('#ll-tip'), ctx = cv.getContext('2d');
    let W = 0, drag = null, mouse = null, last = performance.now(), hot = 0, down = null, lastKey = '', lastP = null;
    const fit = () => { const r = st.getBoundingClientRect(), dp = window.devicePixelRatio || 1; W = Math.max(200, Math.round(r.width)); cv.width = W * dp; cv.height = W * dp; ctx.setTransform(dp, 0, 0, dp, 0, 0); };
    fit();
    const zoomBy = (f) => { S.zoom = Math.max(1, Math.min(40, S.zoom * f)); if (S.zoom > 1) S.spin = false; };
    st.querySelectorAll('.ll-zm button').forEach((b) => { b.addEventListener('pointerdown', (e) => e.stopPropagation()); b.addEventListener('click', (e) => { e.stopPropagation(); const z = b.dataset.z; if (z === 'in') zoomBy(1.6); else if (z === 'out') zoomBy(1 / 1.6); else S.zoom = 1; }); });
    st.addEventListener('wheel', (e) => { e.preventDefault(); zoomBy(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0025))); }, { passive: false });
    st.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; drag = { x: e.clientX, y: e.clientY, ry: S.rotY, rx: S.rotX }; st.classList.add('drag'); st.setPointerCapture(e.pointerId); });
    st.addEventListener('pointermove', (e) => {
      const r = st.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (drag) { const k = 0.01 / S.zoom; S.rotY = drag.ry + (e.clientX - drag.x) * k; S.rotX = Math.max(-1.5, Math.min(1.5, drag.rx + (e.clientY - drag.y) * k)); }
    });
    const up = (e) => { drag = null; st.classList.remove('drag'); if (down && e && e.type === 'pointerup' && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 5 && hot) openLot(hot); down = null; };
    st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
    st.addEventListener('pointerleave', () => { mouse = null; tip.style.display = 'none'; });
    function frame(t) {
      if (!st.isConnected || !isOn()) { raf = 0; return; }
      const dt = Math.min(0.1, (t - last) / 1000); last = t;
      if (Math.abs(st.getBoundingClientRect().width - W) > 2) fit();
      if (S.spin && !drag && !mouse) S.rotY += dt * 0.08;
      const key = [W, S.rotY, S.rotX, S.zoom, S.show.free, S.show.mine, S.show.other, S.byPrice, S.ff, TAGS ? Object.keys(TAGS).length : -1].join('|');
      if (key !== lastKey) { lastP = draw(ctx, W); lastKey = key; } // big rocks: only redraw when the view changes
      hover(lastP);
      raf = requestAnimationFrame(frame);
    }
    function hover(p) {
      if (drag) { tip.style.display = 'none'; return; } // keep the lot under the pointer for a click
      hot = 0;
      if (!mouse || !p) { tip.style.display = 'none'; st.style.cursor = ''; return; }
      let best = -1, bd = 1e9;
      for (let j = 0; j < p.length; j += 3) { const dx = p[j + 1] - mouse.x, dy = p[j + 2] - mouse.y, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = p[j]; } }
      if ((best < 0 || bd > 400) && G && G.n > BIG && S.show.free) { const f = lotAt(mouse.x, mouse.y, W); if (f && G.st[f] === 0) { best = f; bd = 0; } }
      if (best < 0 || bd > 400) { tip.style.display = 'none'; st.style.cursor = ''; return; }
      hot = best; st.style.cursor = 'pointer';
      tip.innerHTML = tipHTML(best); tip.style.display = 'block';
      tip.style.left = Math.min(W - tip.offsetWidth - 6, mouse.x + 14) + 'px'; tip.style.top = Math.max(6, mouse.y - tip.offsetHeight - 10) + 'px';
    }
    raf = requestAnimationFrame(frame);
  }

  // Big rocks (Adalia Prime has about 1.7 million lots): free lots are a green wash until you zoom in
  // far enough to see them one by one, and then only the lots in view are drawn.
  const BIG = 40000;
  // screen point → point on the rock (unit sphere), or null off the rock
  function unproject(px, py, W) {
    const c = W / 2, R = W * 0.4 * S.zoom, x1 = (px - c) / R, y2 = (c - py) / R, q = 1 - x1 * x1 - y2 * y2;
    if (q < 0) return null;
    const z2 = Math.sqrt(q), cy = Math.cos(S.rotY), sy = Math.sin(S.rotY), cx = Math.cos(S.rotX), sx = Math.sin(S.rotX);
    const y = y2 * cx + z2 * sx, z1 = -y2 * sx + z2 * cx;
    return [x1 * cy - z1 * sy, y, x1 * sy + z1 * cy];
  }
  const idxOfY = (y) => 1 + ((1 - y) / 2) * (G.n - 1);
  // the lot nearest a screen point (searches the spiral around the right height)
  function lotAt(px, py, W) {
    const u = unproject(px, py, W); if (!u) return 0;
    const n = G.n, w = Math.ceil(3 * Math.sqrt(n)), m = Math.round(idxOfY(u[1]));
    let best = 0, bd = 9;
    for (let i = Math.max(1, m - w); i <= Math.min(n, m + w); i++) {
      const dx = G.pos[i * 3] - u[0], dy = G.pos[i * 3 + 1] - u[1], dz = G.pos[i * 3 + 2] - u[2], d = dx * dx + dy * dy + dz * dz;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }
  // lot numbers that can be on screen (lot number follows height on the rock)
  function visibleRange(W) {
    let lo = 2, hi = -2, any = false;
    for (let a = 0; a <= 8; a++) for (let b = 0; b <= 8; b++) {
      const u = unproject((W * a) / 8, (W * b) / 8, W); if (!u) continue;
      any = true; lo = Math.min(lo, u[1]); hi = Math.max(hi, u[1]);
    }
    if (!any || S.zoom < 1.5) return [1, G.n];
    const pad = 3 * Math.sqrt(G.n);
    return [Math.max(1, Math.floor(idxOfY(hi) - pad)), Math.min(G.n, Math.ceil(idxOfY(lo) + pad))];
  }

  // returns [lot, x, y] for lots drawn on the near side
  function draw(ctx, W) {
    ctx.clearRect(0, 0, W, W);
    if (!G) return null;
    const c = W / 2, R = W * 0.4 * S.zoom, n = G.n, big = n > BIG;
    const cy = Math.cos(S.rotY), sy = Math.sin(S.rotY), cx = Math.cos(S.rotX), sx = Math.sin(S.rotX);
    const body = ctx.createRadialGradient(c - R * 0.35, c - R * 0.35, R * 0.1, c, c, R);
    body.addColorStop(0, '#1c2638'); body.addColorStop(1, '#070b13');
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(c, c, R, 0, 7); ctx.fill();
    const dot = Math.max(1.1, Math.min(14, R * Math.sqrt(4 / n) * 0.9));
    // big rock: free lots one by one only when zoomed in far enough that few are in view, else a wash
    // lots actually on screen ≈ screen area ÷ area of one lot on screen (the y-band loop itself is cheap)
    const onScreen = Math.min(n / 2, (W * W * n) / (4 * Math.PI * R * R));
    const vr = big && dot * 0.75 >= 1.6 && onScreen <= 40000 ? visibleRange(W) : null;
    const freeDots = !big || !!vr;
    if (big && S.show.free && !freeDots) {
      const g = ctx.createRadialGradient(c - R * 0.35, c - R * 0.35, R * 0.1, c, c, R);
      g.addColorStop(0, 'rgba(87,255,101,.32)'); g.addColorStop(1, 'rgba(87,255,101,.08)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, R, 0, 7); ctx.fill();
    }
    const out = [];
    const one = (i) => {
      const rgb = rgbOf(i); if (!rgb) return;
      const x = G.pos[i * 3], y = G.pos[i * 3 + 1], z = G.pos[i * 3 + 2];
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy, y2 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
      if (z2 < -0.1) return;
      const px = c + x1 * R, py = c - y2 * R;
      if (px < -10 || py < -10 || px > W + 10 || py > W + 10) return; // off screen when zoomed in
      const sh = Math.max(0.15, Math.min(1, (z2 + 0.15) * 1.1));
      const free = G.st[i] === 0, a = sh * (free ? 0.45 : 1);
      // on big rocks leased lots stay at least 2.5 px so they show on the wash
      const r = Math.max(free || !big ? 0 : 2.5, dot * (free ? 0.75 : 1) * (0.55 + 0.45 * Math.sqrt(Math.max(0, z2))));
      ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a.toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();
      if (z2 > 0) out.push(i, px, py);
    };
    if (!big) for (let i = 1; i <= n; i++) one(i);
    else {
      if (freeDots && S.show.free) { for (let i = vr[0]; i <= vr[1]; i++) if (G.st[i] === 0) one(i); }
      G.leased.forEach(one);
    }
    ctx.strokeStyle = 'rgba(79,144,255,.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(c, c, R, 0, 7); ctx.stroke();
    return out;
  }

  // "Lot leases" button, next to Resource map (test only)
  const hook = () => {
    const after = document.getElementById('vI'), main = document.getElementById('main');
    if (!after || !main || document.getElementById('vLL')) return;
    const b = document.createElement('button');
    b.id = 'vLL'; b.textContent = 'Lot leases';
    after.after(b);
    b.addEventListener('click', () => {
      document.querySelectorAll('button.on').forEach((x) => x.classList.remove('on'));
      try { window.YIC.view = 'M'; } catch (e) {}
      b.className = 'on';
      askTags();
      page(main);
    });
  };
  document.addEventListener('click', (e) => {
    const b = document.getElementById('vLL'), t = e.target.closest && e.target.closest('button[id^="v"]');
    if (b && t && t !== b) b.className = '';
  }, true);
  setInterval(hook, 700);
})();
