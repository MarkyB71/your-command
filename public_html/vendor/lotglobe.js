/* Resource map (was Resource globe) – Your Influence Command (Mark, 29 Oct 2026) – LIVE 29 Oct 2026; "All resources" option LIVE 30 Oct 2026
   Science Lab console. Once you've scanned a rock in the game, every lot has a level for every
   resource. This shows the rock as a spinning globe with each lot glowing by how rich it is in the
   resource you pick. Drag to turn it, hover a lot for its number and level, click a top lot to
   turn the globe to it.
   Lot levels: vendor/abund.js (the game's own maths, from @influenceth/sdk – same as Lot resources).
   Lot positions: the game's lot layout (golden-angle spiral, SDK getLotPosition).
   Uses window.YIC (app.js). */
(function () {
  'use strict';

  const GA = Math.PI * (3 - Math.sqrt(5));
  const MOVE = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const S = { rock: '', res: 0, rotY: 0.6, rotX: -0.35, spin: MOVE, focus: null, pulse: 0, spots: false, blend: true }; // blend: smooth heat map (Mark: the page default), or one patch per lot
  // LIVE 30 Oct 2026 (tested on ?beta=1, Mark – community request): "All resources" – every resource at once, to find
  // lots poor in everything (good spots for warehouses, refineries…) so rich mining lots aren't built over.
  const BETA = true; // LIVE 30 Oct 2026 (was the ?beta=1 test)
  const ALL = -1;
  const SPOT = '#e6ebf2'; // best building spots: soft white, stands apart from all five resource colours
  let G = null; // current globe {id, res, n, pos, val, max, mine}
  // Real shape: the 3D model the player added on the Asteroids page (IndexedDB influenceStock3d/models, key = rock id)
  S.view = 'shape';
  const HAS = {};            // rock id → true/false: a model is stored in this browser
  let T3 = null;             // {id, el, api} – kept while switching resource so the big file loads once
  function hasModel(id) {
    return new Promise((res) => {
      let q; try { q = indexedDB.open('influenceStock3d', 1); } catch (e) { res(false); return; }
      q.onupgradeneeded = () => q.result.createObjectStore('models');
      q.onerror = () => res(false);
      q.onsuccess = () => { try { const r = q.result.transaction('models', 'readonly').objectStore('models').getKey(id); r.onsuccess = () => res(r.result !== undefined); r.onerror = () => res(false); } catch (e) { res(false); } };
    });
  }
  function getModel(id) {
    return new Promise((res, rej) => {
      const q = indexedDB.open('influenceStock3d', 1);
      q.onupgradeneeded = () => q.result.createObjectStore('models');
      q.onerror = () => rej(q.error);
      q.onsuccess = () => { const r = q.result.transaction('models', 'readonly').objectStore('models').get(id); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); };
    });
  }
  let raf = 0;
  let OC = null; // off-screen canvas for the smooth All resources globe

  const CSS = `.lg-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 10px}
.lg-row label{color:#8b9ab0;font-size:14px;display:flex;gap:8px;align-items:center}
.lg-row select{font-size:15px;padding:6px 10px;min-width:0!important;max-width:260px}
.lg-wrap{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start}
.lg-stage{position:relative;flex:0 0 auto;width:min(620px,100%,max(300px,calc(100vh - 330px)));aspect-ratio:1;background:radial-gradient(circle at 50% 50%,#0d1a30 0,#060a12 70%);border:1px solid #223047;border-radius:14px;overflow:hidden;cursor:grab;touch-action:none}
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
.lg-sw{display:inline-flex;border:1px solid #4f90ff;border-radius:8px;overflow:hidden}
.lg-sw button{background:transparent;color:#8fb8ff;border:0;padding:6px 12px;font-size:14px;cursor:pointer}
.lg-sw button.on{background:#4f90ff;color:#fff;box-shadow:0 0 12px #4f90ff88}
.lg-3d{cursor:default}.lg-3dv{position:absolute;inset:0}.lg-3dv canvas{width:100%!important;height:100%!important}
.lg-load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;color:#8fe3ff;font-size:15px}
.lg-add{display:flex;gap:14px;align-items:center;flex-wrap:wrap;justify-content:space-between;margin:0 0 12px;padding:10px 14px;border:2px solid #ffd24a;border-radius:10px;background:rgba(255,210,74,.07);box-shadow:0 0 16px -4px #ffd24a}
.lg-add>div{flex:1 1 320px}.lg-add b{color:#ffd24a;font-size:15px}.lg-add span{display:block;color:#c9d3e0;font-size:13px;margin-top:3px}.lg-add span b{font-size:13px}
.lg-up{background:#ffd24a;color:#1a1408;font-weight:700;border-radius:8px;padding:8px 14px;cursor:pointer;white-space:nowrap;box-shadow:0 0 12px #ffd24a88}
.lg-up:hover{filter:brightness(1.1)}
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

  // Colours as in the game's resource map (influence-client theme.js resources + shaders/resource.glsl):
  // one colour per resource group, and 6 brightness steps. Step 1 = at the rock's floor (half its abundance),
  // then 5 equal steps from the floor up to 100%.
  const CAT = { Volatile: '#5bc0f5', Organic: '#68d346', Metal: '#f8852c', RareEarth: '#f63637', Fissile: '#8a1aff' };
  const catOf = (r) => (r <= 8 ? 'Volatile' : r <= 11 ? 'Organic' : r === 16 || r === 17 ? 'RareEarth' : r === 15 || r === 22 ? 'Fissile' : 'Metal');
  const DOT = { Volatile: '🔵', Organic: '🟢', Metal: '🟠', RareEarth: '🔴', Fissile: '🟣' };
  const GNM = { Volatile: 'Volatiles', Organic: 'Organics', Metal: 'Metals', RareEarth: 'Rare earths', Fissile: 'Fissiles' };
  const hexRGB = (h) => [1, 3, 5].map((k) => parseInt(h.substr(k, 2), 16));
  function band(v, ab) {
    const fl = ab / 2, st = (1 - fl) / 5;
    let k = 1 + (v >= fl + 0.001 ? 1 : 0);
    for (let j = 1; j <= 4; j++) if (v >= fl + st * j) k++;
    return k / 6;
  }
  function col(t) { return G.rgb.map((c) => Math.round(c * t)); }

  // All resources: for each lot, its highest step (1–6) over every resource, and which resource gives it
  function combine(Y, A, ab, rs, n) {
    const key = A.id + '_all';
    if (Y.ABC[key]) return Y.ABC[key];
    const best = new Float32Array(n + 1), from = new Uint8Array(n + 1), sum = new Float32Array(n + 1), idx = new Float32Array(n + 1);
    rs.forEach((r) => {
      const k = A.id + '_' + r;
      if (!Y.ABC[k]) Y.ABC[k] = Y.ABM.lotsFor(A.id, A.Celestial.abundances, r, n);
      const v = Y.ABC[k];
      for (let i = 1; i <= n; i++) { const b = band(v[i], ab[r]); sum[i] += b; if (b > best[i]) { best[i] = b; from[i] = r; } }
    });
    for (let i = 1; i <= n; i++) idx[i] = i;
    return (Y.ABC[key] = { best, from, sum, idx });
  }
  const BASE = [38, 48, 66]; // dark slate, close to the rock body
  const mix = (a, b, t) => a.map((x, k) => Math.round(x + (b[k] - x) * t));
  const POOR = 2 / 6 + 1e-6; // at or just above the rock's floor for every resource
  const isSpot = (i) => G.best[i] <= POOR && !G.mine[i];
  // colour of a lot in All resources: its richest resource's group colour, brighter = richer
  function allRGB(i) {
    if (S.spots) return isSpot(i) ? hexRGB(SPOT) : mix(BASE, hexRGB(CAT[catOf(G.from[i])]), 0.12);
    // blend from the dark rock grey up to the resource colour (no muddy browns); poorest steps stay grey
    const t = Math.max(0, (G.best[i] - 2 / 6) / (4 / 6));
    return mix(BASE, hexRGB(CAT[catOf(G.from[i])]), 0.18 + 0.82 * Math.pow(t, 1.3));
  }
  const lvOf = (i) => (G.all ? (S.spots ? (isSpot(i) ? 1 : 0.15) : G.best[i]) : band(G.val[i], G.ab));
  const rgbOf = (i, lv) => (G.all ? allRGB(i) : col(lv));
  // what the 3D model gets: one value per lot + colour for it (0..1)
  const softOn = () => S.blend && !(G.all && S.spots);
  const paintArgs = () => (G.all ? [G.idx, (i) => allRGB(i).map((c) => c / 255)] : [G.val, (v) => G.rgb.map((c) => (c / 255) * band(v, G.ab))]);

  // the game's lot layout on a unit sphere
  function lotPos(n) {
    const p = new Float32Array((n + 1) * 3);
    for (let i = 1; i <= n; i++) {
      const y = 1 - ((i - 1) / Math.max(1, n - 1)) * 2, r = Math.sqrt(Math.max(0, 1 - y * y)), th = GA * (i - 1);
      p[i * 3] = r * Math.cos(th); p[i * 3 + 1] = y; p[i * 3 + 2] = r * Math.sin(th);
    }
    return p;
  }

  // Building colours = the game's lot-map building groups (same as Lot resources, influence-client SearchFilters.js)
  const BCAT = { 1: '#ff8c00', 10: '#ff8c00', 2: '#ff4a3d', 3: '#e0458a', 4: '#2ecc1a', 5: '#c99a6e', 6: '#7a7aff', 7: '#19d9ff', 8: '#57ff65', 9: '#ffff00' };
  const BGRP = { 1: 'Storage', 10: 'Storage', 2: 'Extraction', 3: 'Refining', 4: 'Agriculture', 5: 'Manufacturing', 6: 'Shipbuilding', 7: 'Transport', 8: 'Trade', 9: 'Housing' };
  let MC = {}; // lot index → colour of your building there
  const me = (i) => '<span class="lg-me" style="border-color:' + (MC[i] || '#ffd24a') + '"></span>';
  // your buildings on that rock: lot index → building name (colours into MC)
  function myLots(D, astId) {
    const out = {}; MC = {};
    (D.allB || []).forEach((b) => {
      const L = ((b.Location || {}).locations) || [];
      const a = L.find((x) => x.label === 3), l = L.find((x) => x.label === 4);
      if (!a || a.id !== astId || !l || !b.Building || !(b.Building.status >= 1)) return;
      const i = Math.floor(l.id / 4294967296), t = b.Building.buildingType;
      out[i] = (b.Name && b.Name.name) || 'Your building'; MC[i] = BCAT[t] || '#ffd24a';
    });
    return out;
  }

  function bldLegend(D, astId) {
    const seen = {};
    (D.allB || []).forEach((b) => {
      const L = ((b.Location || {}).locations) || [], a = L.find((x) => x.label === 3);
      if (a && a.id === astId && b.Building && b.Building.status >= 1) { const g = BGRP[b.Building.buildingType]; if (g) seen[g] = BCAT[b.Building.buildingType]; }
    });
    const k = Object.keys(seen);
    return k.length ? '<div class="lg-dim" style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px 10px">Your buildings: ' + k.map((g) => '<span style="color:' + seen[g] + '"><span class="lg-me" style="border-color:' + seen[g] + '"></span>' + g + '</span>').join('') + '</div>' : '';
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
    const all = BETA && S.res === ALL;
    if (!all && !rs.includes(S.res)) S.res = Object.keys(ab).map(Number).sort((x, y) => ab[y] - ab[x])[0];

    const n = Y.ABM.lotCount(A.id);
    if (all && !Y.ABC[A.id + '_all']) { // every resource takes a moment on a big rock – say so first
      m.innerHTML = '<div class="note">Working out every resource on ' + esc(nm(A)) + '…</div>';
      setTimeout(() => { combine(Y, A, ab, rs, n); if (isOn()) page(m); }, 30);
      return;
    }
    const CB = all ? combine(Y, A, ab, rs, n) : null;
    const k = A.id + '_' + S.res;
    if (!all && !Y.ABC[k]) Y.ABC[k] = Y.ABM.lotsFor(A.id, A.Celestial.abundances, S.res, n);
    const val = all ? CB.best : Y.ABC[k];
    let max = 0, min = 1; for (let i = 1; i <= n; i++) { if (val[i] > max) max = val[i]; if (val[i] < min) min = val[i]; }
    if (!G || G.id !== A.id || G.n !== n) G = { id: A.id, n, pos: lotPos(n) };
    G.all = all; G.res = S.res; G.mine = myLots(D, A.id);
    if (all) { G.best = CB.best; G.from = CB.from; G.sum = CB.sum; G.idx = CB.idx; G.val = CB.best; G.cat = 'Metal'; G.rgb = hexRGB('#4f90ff'); G.ab = 0; G.lv = (i) => Y.ABC[A.id + '_' + G.from[i]][i]; }
    else { G.ab = ab[S.res]; G.cat = catOf(S.res); G.rgb = hexRGB(CAT[G.cat]); G.val = val; }
    G.max = max; G.min = Math.min(min, max);
    S.focus = null;
    if (HAS[A.id] === undefined) { HAS[A.id] = false; hasModel(A.id).then((v) => { HAS[A.id] = v; if (v && isOn()) page(m); }); }
    const shape = HAS[A.id] && S.view === 'shape';

    const top = [];
    for (let i = 1; i <= n; i++) if (!all || isSpot(i)) top.push(i);
    if (all) top.sort((a, b) => G.best[a] - G.best[b] || G.sum[a] - G.sum[b]); else top.sort((a, b) => val[b] - val[a]);
    let avg = 0; for (let i = 1; i <= n; i++) avg += val[i]; avg /= n;
    const sc = all ? '#4f90ff' : CAT[G.cat]; // resource box colour (All = Science Lab / Scientist blue)

    let h = '<div class="lg-row"><label>Rock <select id="lg-r">' + own.map((a) => '<option value="' + a.id + '"' + (String(a.id) === S.rock ? ' selected' : '') + '>' + esc(nm(a)) + '</option>').join('') + '</select></label>' +
      '<label>Resource <select id="lg-s" style="color:' + sc + ';border:2px solid ' + sc + ';box-shadow:0 0 10px -2px ' + sc + ';background:#0c1320">' +
        (BETA ? '<option value="' + ALL + '"' + (all ? ' selected' : '') + ' style="color:#4f90ff;background:#0c1320">✨ All resources</option>' : '') +
        // grouped and coloured by resource group, as in the game (dot works where the menu ignores colours)
        ['Volatile', 'Organic', 'Metal', 'RareEarth', 'Fissile'].map((c) => {
          const g = rs.filter((r) => catOf(r) === c);
          return g.length ? '<optgroup label="' + DOT[c] + ' ' + GNM[c] + '" style="color:' + CAT[c] + '">' + g.map((r) => '<option value="' + r + '"' + (r === S.res ? ' selected' : '') + ' style="color:' + CAT[c] + ';background:#0c1320">' + DOT[c] + ' ' + esc(pn(r)) + ' (' + Math.round(ab[r] * 100) + '% of rock)</option>').join('') + '</optgroup>' : '';
        }).join('') + '</select></label>' +
      (HAS[A.id] ? '<span class="lg-sw"><button type="button" data-v="shape"' + (shape ? ' class="on"' : '') + '>🪨 Real shape</button><button type="button" data-v="globe"' + (shape ? '' : ' class="on"') + '>🌐 Globe</button></span>' : '') +
      '<span class="lg-sw lg-bl"><button type="button" data-b="1"' + (S.blend ? ' class="on"' : '') + '>🌫️ Blend</button><button type="button" data-b="0"' + (S.blend ? '' : ' class="on"') + '>⬡ Lots</button></span>' +
      '<label><input type="checkbox" id="lg-spin"' + (S.spin ? ' checked' : '') + '> Spin</label></div>' +
      (HAS[A.id] ? '' : '<div class="lg-add"><div><b>🪨 Only seeing a globe? See the real shape of ' + esc(nm(A)) + '</b>' +
        '<span>In the game, open this rock\'s management page and press <b>Download 3D Model</b> (owners only). Then add that file here – it stays in this browser only.</span></div>' +
        '<label class="lg-up">📦 Add 3D model<input type="file" id="lg-file" accept=".glb,.gltf" style="display:none"></label></div>');
    h += '<div class="lg-wrap"><div class="lg-stage' + (shape ? ' lg-3d' : '') + '" id="lg-st">' + (shape ? '' : '<canvas id="lg-c"></canvas>') + '<div class="lg-tip" id="lg-tip"></div></div><div class="lg-side">';
    if (all) {
      const grp = ['Volatile', 'Organic', 'Metal', 'RareEarth', 'Fissile'].filter((c) => rs.some((r) => catOf(r) === c));
      h += '<div class="lg-box"><h3>All resources on ' + esc(nm(A)) + '</h3>' +
        '<div class="lg-dim">Each lot shows the resource it is richest in. Brighter = richer. Dark lots are poor in everything.</div>' +
        '<div class="lg-dim" style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px 10px">' + grp.map((c) => '<span style="color:' + CAT[c] + '">' + DOT[c] + ' ' + GNM[c] + '</span>').join('') + '</div>' +
        '<label class="lg-dim" style="display:flex;gap:8px;align-items:center;margin-top:10px;font-size:14px;color:' + SPOT + '"><input type="checkbox" id="lg-spots"' + (S.spots ? ' checked' : '') + '> Show only the best building spots</label>' +
        '<div class="lg-dim" style="margin-top:6px">' + n.toLocaleString() + ' lots · ' + top.length.toLocaleString() + ' free lots poor in everything</div>' + bldLegend(D, A.id) + '</div>' +
        '<div class="lg-box"><h3>Best building spots</h3>' + (top.length ? '<table class="lg-top nosort">' +
        top.slice(0, 10).map((i) => { const f = G.from[i]; return '<tr data-lot="' + i + '"><td>Lot #' + i + '</td><td class="lg-dim">Richest in <span style="color:' + CAT[catOf(f)] + '">' + esc(pn(f)) + '</span></td><td class="lg-p">' + pct(G.lv(i)) + '</td>' + (window.GL ? '<td>' + window.GL('/lot/' + (BigInt(A.id) + (BigInt(i) << 32n)).toString(), 'Open Lot #' + i + ' in the game') + '</td>' : '') + '</tr>'; }).join('') +
        '</table>' : '<div class="lg-dim">No free lots here are poor in everything.</div>') +
        '<div class="lg-hint">Only your own buildings are known here – check the lot in the game before building. Click a lot to turn the globe to it.</div></div></div></div>';
    } else h += '<div class="lg-box"><h3>' + esc(pn(S.res)) + ' on ' + esc(nm(A)) + '</h3>' +
      '<div class="lg-leg" style="background:linear-gradient(90deg,' + [1, 2, 3, 4, 5, 6].map((k, x) => 'rgb(' + col(k / 6).join(',') + ') ' + (x * 100 / 6).toFixed(1) + '% ' + ((x + 1) * 100 / 6).toFixed(1) + '%').join(',') + ')"></div><div class="lg-legt"><span>' + esc(G.cat.replace('RareEarth', 'Rare earth')) + ' · poorest ' + pct(min) + '</span><span>richest ' + pct(max) + '</span></div>' +
      '<div class="lg-dim" style="margin-top:6px">' + n.toLocaleString() + ' lots · average ' + pct(avg) + '</div>' + bldLegend(D, A.id) + '</div>' +
      '<div class="lg-box"><h3>Richest lots</h3><table class="lg-top nosort">' +
      top.slice(0, 10).map((i) => '<tr data-lot="' + i + '"><td>Lot #' + i + '</td><td class="lg-dim">' + (G.mine[i] ? me(i) + esc(G.mine[i]) : 'Free / other') + '</td><td class="lg-p">' + pct(val[i]) + '</td>' + (window.GL ? '<td>' + window.GL('/lot/' + (BigInt(A.id) + (BigInt(i) << 32n)).toString(), 'Open Lot #' + i + ' in the game') + '</td>' : '') + '</tr>').join('') +
      '</table><div class="lg-hint">Click a lot to turn the globe to it. Drag the globe to turn it.</div></div></div></div>';
    m.innerHTML = h;

    m.querySelector('#lg-r').addEventListener('change', (e) => pickRock(Y, own, e.target.value, m));
    m.querySelector('#lg-s').addEventListener('change', (e) => { S.res = +e.target.value; page(m); });
    const sp = m.querySelector('#lg-spots');
    if (sp) sp.addEventListener('change', (e) => { S.spots = e.target.checked; page(m); });
    m.querySelector('#lg-spin').addEventListener('change', (e) => { S.spin = e.target.checked; if (T3 && T3.api) T3.api.setSpin(S.spin); });
    const fi = m.querySelector('#lg-file');
    if (fi) fi.addEventListener('change', () => upload(fi, A, m));
    m.querySelectorAll('.lg-bl button').forEach((b) => b.addEventListener('click', () => { S.blend = b.dataset.b === '1'; page(m); }));
    m.querySelectorAll('.lg-sw button[data-v]').forEach((b) => b.addEventListener('click', () => { S.view = b.dataset.v; page(m); }));
    m.querySelectorAll('tr[data-lot]').forEach((tr) => tr.addEventListener('click', () => { S.focus = +tr.dataset.lot; S.spin = false; const c = m.querySelector('#lg-spin'); if (c) c.checked = false; S.pulse = performance.now(); if (shape && T3 && T3.api) T3.api.face(S.focus); }));
    if (shape) { stop(); real(Y, A, m.querySelector('#lg-st')); } else start(m.querySelector('#lg-st'));
  }

  // The real shape: load the model once per rock, then repaint it for each resource
  function real(Y, A, st) {
    if (T3 && (T3.id !== A.id || (T3.api && T3.api.dead))) { if (T3.api && !T3.api.dead) T3.api.stop(); T3 = null; }
    if (!T3) {
      const el = document.createElement('div'); el.className = 'lg-3dv';
      el.innerHTML = '<div class="lg-load">Loading your 3D model and laying out the lots…</div>';
      T3 = { id: A.id, el, api: null };
      const me = T3;
      Promise.all([import('./lotshape.js?v=' + Y.VER), getModel(A.id)])
        .then(async ([mod, rec]) => {
          if (!rec || !rec.buf) throw new Error('model not found');
          const stretch = await mod.stretchFor(A.id, A.Celestial.radius);
          el.innerHTML = '';
          const api = await mod.show(el, rec.buf, { stretch, n: G.n, spin: S.spin, onHover: hover3d });
          if (T3 !== me) { api.stop(); return; }
          me.api = api;
          if (G && G.id === A.id) api.paint(...paintArgs(), G.mine, MC, softOn());
          if (S.focus) api.face(S.focus);
        })
        .catch((e) => { el.innerHTML = '<div class="lg-load">Could not show the 3D model (' + Y.esc((e && e.message) || e) + '). Switch to 🌐 Globe.</div>'; });
    } else if (T3.api) { T3.api.paint(...paintArgs(), G.mine, MC, softOn()); T3.api.setSpin(S.spin); }
    st.prepend(T3.el);
  }
  function hover3d(lot, x, y) {
    const tip = document.getElementById('lg-tip');
    if (!tip) return;
    if (!lot || !G) { tip.style.display = 'none'; return; }
    tip.innerHTML = tipHTML(lot); tip.style.display = 'block';
    const W = tip.parentNode.clientWidth;
    tip.style.left = Math.min(W - tip.offsetWidth - 6, x + 14) + 'px'; tip.style.top = Math.max(6, y - tip.offsetHeight - 10) + 'px';
  }
  function tipHTML(lot) {
    const Y = window.YIC, esc = Y.esc;
    if (G.all) return '<b>Lot #' + lot + '</b> · richest in ' + esc(Y.pn(G.from[lot])) + ' ' + pct(G.lv(lot)) + (isSpot(lot) ? '<br>Poor in everything – good building spot' : '') + (G.mine[lot] ? '<br>' + me(lot) + esc(G.mine[lot]) : '');
    return '<b>Lot #' + lot + '</b> · ' + pct(G.val[lot]) + ' ' + esc(Y.pn(G.res)) + (G.mine[lot] ? '<br>' + me(lot) + esc(G.mine[lot]) : '');
  }

  // Add the 3D model right here – saved the same way as the Asteroids page does (IndexedDB, this browser only)
  function upload(inp, A, m) {
    const f = inp.files && inp.files[0], box = m.querySelector('.lg-add');
    if (!f || !box) return;
    const say = (t, again) => { box.innerHTML = '<div><b>' + window.YIC.esc(t) + '</b></div>'; if (again) setTimeout(() => { if (isOn()) page(m); }, 4000); };
    const want = String(A.id), got = (f.name.match(/asteroid_(\d+)/) || [])[1];
    if (got && got !== want) return say('That file is for asteroid #' + got + ', not ' + nm(A) + ' (#' + want + '). Pick asteroid_' + want + '.gltf.', true);
    if (f.size > 400e6) return say('That file is too big (over 400 MB).', true);
    say('Saving the model… (big files take a little while)');
    f.arrayBuffer().then((buf) => new Promise((res, rej) => {
      const q = indexedDB.open('influenceStock3d', 1);
      q.onupgradeneeded = () => q.result.createObjectStore('models');
      q.onerror = () => rej(q.error);
      q.onsuccess = () => { const tx = q.result.transaction('models', 'readwrite'); tx.objectStore('models').put({ name: f.name, buf, size: f.size, added: Date.now() }, A.id); tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); };
    })).then(() => { HAS[A.id] = true; S.view = 'shape'; if (isOn()) page(m); })
      .catch(() => say('Could not save it in this browser (storage may be full or turned off).', true));
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
      if (S.spin && !drag && !mouse) S.rotY += dt * 0.08; // slow (Mark); stops while the pointer is over the globe
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
      tip.innerHTML = tipHTML(best);
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
    // All resources: smooth heat map – big overlapping dots drawn off-screen, then blurred onto the globe
    const soft = softOn();
    let dc = ctx;
    if (soft) {
      const cv = ctx.canvas;
      if (!OC || OC.width !== cv.width || OC.height !== cv.height) { OC = document.createElement('canvas'); OC.width = cv.width; OC.height = cv.height; }
      dc = OC.getContext('2d'); dc.setTransform(ctx.getTransform()); dc.clearRect(0, 0, W, W);
    } else ctx.globalCompositeOperation = 'lighter';
    for (let j = 0; j < pts.length; j += 4) {
      const i = pts[j], x = c + pts[j + 1] * R, y = c - pts[j + 2] * R, z = pts[j + 3];
      const lv = lvOf(i), [r, g, b] = rgbOf(i, lv);
      if (soft) {
        const sh = Math.max(0.15, Math.min(1, (z + 0.15) * 1.1));
        dc.fillStyle = 'rgb(' + Math.round(r * sh) + ',' + Math.round(g * sh) + ',' + Math.round(b * sh) + ')';
        dc.beginPath(); dc.arc(x, y, dot * 2.3, 0, 7); dc.fill();
        if (z > 0) out.push(i, x, y, z);
        continue;
      }
      const shade = Math.max(0.15, Math.min(1, (z + 0.15) * 1.1)); // dimmer toward the edge
      const s = dot * (0.55 + 0.45 * Math.sqrt(Math.max(0, z))) * (0.7 + 0.5 * lv);
      if (lv > 0.95 && (!G.all || S.spots)) { // top step glows (All resources: only the building spots)
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
    if (soft) {
      const d = ctx.getTransform().a;
      ctx.save(); ctx.beginPath(); ctx.arc(c, c, R, 0, 7); ctx.clip();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'blur(' + (dot * 1.4 * d).toFixed(1) + 'px)';
      ctx.drawImage(OC, 0, 0); ctx.restore();
    }

    // your buildings: rings in the game's building-group colours, near side only
    ctx.lineWidth = 1.6;
    for (let j = 0; j < pts.length; j += 4) {
      const i = pts[j]; if (!G.mine[i] || pts[j + 3] <= 0.05) continue;
      ctx.strokeStyle = MC[i] || '#ffd24a';
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

  // Adds "Resource map" to the Science Lab, after Supply chain
  const hook = () => {
    const after = document.getElementById('vE') || document.getElementById('vF'), main = document.getElementById('main');
    if (!after || !main || document.getElementById('vI')) return;
    const b = document.createElement('button');
    b.id = 'vI';
    b.textContent = 'Resource map';
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
