/* Production – Logistics Bridge – TEST ONLY (?beta=1) (Mark, 9 Nov 2026)
   Mark's list: 1 select rock · 2 pick what to make (weight for bulk, count for things like modules) ·
   3 show what you need (stock, mine, fly in / buy) · 4 work the chain back as far as needed for the amount ·
   5 don't show the whole chain, just what's needed · 6 list the processes to run · 7 pick where materials come
   from and where outputs go · 8 work through the chain in order, using by-products · 9 list the moves, option to
   start the processes · 10 keep the order and show finished / next lined up.
   THIS FILE: steps 1–9 – moves + starts go through the hub's approve(). Step 10 (tracking) comes next and reuse the hub's moves + starts.
   Uses the hub's helpers (window.YICDOCK from vendor/dock.js); drawn on the viewscreen by vendor/hubbridge.js. */
(function () {
  'use strict';
  if (!/[?&]beta=1\b/.test(location.search)) return; // test only
  const K = () => window.YICDOCK;
  const P = { p: 0, q: 100, unit: 't', find: '', use: '', n: 1, for: '', runner: 0, feed: {} };
  // Where things go (Mark, 9 Nov): a materials warehouse (inputs gathered here, in-between products land here so the
  // next process finds them), and the finished product goes to the store for what it's for – Stock, Market or Building –
  // or to a tank farm when it's all fluid. Warehouses take anything; tank farms only fluids (SDK Inventory.TYPES 10 / 19).
  // The stores are remembered per rock in this browser.
  const SKEY = 'sk_prod_stores';
  const FOR = [['stock', 'Stock'], ['market', 'Market'], ['build', 'Building']];
  function storesGet() { try { return JSON.parse(localStorage.getItem(SKEY) || '{}'); } catch (e) { return {}; } }
  function storesPut(o) { try { localStorage.setItem(SKEY, JSON.stringify(o)); } catch (e) {} }

  const UNITS = { kg: 1, t: 1000, kt: 1e6 };
  const hrs = (s) => (s < 3600 ? Math.max(1, Math.round(s / 60)) + ' min' : s < 86400 * 2 ? (s / 3600).toFixed(1).replace(/\.0$/, '') + ' h' : (s / 86400).toFixed(1).replace(/\.0$/, '') + ' days');

  // ---------- the planner: work back from the target, as far as needed ----------
  function work(target, qty) {
    const k = K(), R = k.recipes(), on = k.onRock();
    const types = new Set(on.map((b) => b.Building.buildingType));
    const pool = {};
    on.filter(k.isStore).forEach((b) => { ((k.inv(b) || { contents: [] }).contents).forEach((c) => { if (c.amount > 0) pool[c.product] = (pool[c.product] || 0) + c.amount; }); ((k.S.inc && k.S.inc[b.id]) || []).forEach((x) => { pool[x[0]] = (pool[x[0]] || 0) + x[1]; }); });
    const haveTarget = pool[target] || 0;
    const steps = [], key = {}, fly = {}, mine = {}, made = {}, byUsed = {}, stock = {}, noBld = {};
    const all = (p) => R.filter((x) => x.out[p] && !/Unbundling/.test(x.name));
    const here = (p) => all(p).filter((x) => types.has(k.FBT[x.type]));
    // rough cost of one unit of p made here: [kg to fly in, processes] – used only to pick between recipes
    const memo = {};
    function est(p, path) {
      if (pool[p] > 0 || k.canMine(p)) return [0, 0];
      if (memo[p]) return memo[p];
      if (path.length > 8) return [k.grams(p) / 1000, 0];
      const rs = here(p).filter((r) => !Object.keys(r.inp).some((ip) => path.includes(+ip)));
      if (!rs.length) return [k.grams(p) / 1000, 0];
      const best = rs.map((r) => recipeEst(r, p, path.concat(p))).sort((a, b) => a[0] - b[0] || a[1] - b[1])[0];
      if (!path.length || path.length < 3) memo[p] = best;
      return best;
    }
    function recipeEst(r, p, path) {
      let f = 0, n = 1;
      Object.keys(r.inp).forEach((ip) => { const e = est(+ip, path); f += e[0] * r.inp[ip] / r.out[p]; n += e[1]; });
      return [f, n];
    }
    function need(p, q, path, depth, top) {
      if (q <= 0) return;
      if (!top) {
        // by-products of earlier steps first, then stock on the rock (Mark: "using byproducts if available")
        if (made[p] > 0) { const u = Math.min(made[p], q); made[p] -= u; q -= u; byUsed[p] = (byUsed[p] || 0) + u; if (q <= 0) return; }
        if (pool[p] > 0) { const u = Math.min(pool[p], q); pool[p] -= u; q -= u; stock[p] = (stock[p] || 0) + u; if (q <= 0) return; }
        if (k.canMine(p)) { mine[p] = (mine[p] || 0) + q; return; }
      }
      const rs = here(p).filter((r) => !Object.keys(r.inp).some((ip) => path.includes(+ip)));
      if (!rs.length || depth > 10) {
        fly[p] = (fly[p] || 0) + q;
        if (all(p).length && !here(p).length) noBld[p] = [...new Set(all(p).map((r) => k.BTN[k.FBT[r.type]]).filter(Boolean))];
        return;
      }
      // best recipe: p a main output (not a small by-product), then the least to fly in over the whole chain below it,
      // then the fewest processes (est), then the least input weight
      const share = (r) => { const tot = Object.keys(r.out).reduce((t, o) => t + r.out[o] * k.grams(+o), 0); return tot ? r.out[p] * k.grams(p) / tot : 0; };
      const main = rs.filter((r) => share(r) >= 0.25);
      const cost = (r) => Object.keys(r.inp).reduce((t, ip) => t + r.inp[ip] * k.grams(+ip), 0) / (r.out[p] * k.grams(p));
      const sc = (r) => recipeEst(r, p, path.concat(p));
      const r = (main.length ? main : rs).map((x) => [x, sc(x)]).sort((a, b) => a[1][0] - b[1][0] || a[1][1] - b[1][1] || cost(a[0]) - cost(b[0]))[0][0];
      const runs = Math.ceil(q / r.out[p]);
      let st = key[r.i], fresh = false;
      if (!st) { st = key[r.i] = { r, p, runs: 0 }; fresh = true; }
      st.runs += runs;
      Object.keys(r.inp).forEach((ip) => need(+ip, r.inp[ip] * runs, path.concat(p), depth + 1, false));
      // other outputs (and surplus) can feed later needs; secondary outputs counted at 62.5% (SDK getOutputs, a safe under-estimate)
      Object.keys(r.out).forEach((o) => { const a = +o === p ? r.out[o] * runs - q : Math.floor(r.out[o] * runs * 0.625); if (a > 0) made[o] = (made[o] || 0) + a; });
      if (fresh) steps.push(st); // inputs first, so steps come out in the order to run them
    }
    need(target, qty, [], 0, true);
    return { steps, fly, mine, byUsed, stock, noBld, haveTarget, extra: made };
  }

  // ---------- page ----------
  function products() {
    const k = K(), seen = {};
    k.recipes().forEach((r) => { if (/Unbundling/.test(r.name)) return; Object.keys(r.out).forEach((o) => { seen[o] = 1; }); });
    return Object.keys(seen).map(Number).sort((a, b) => k.pname(a).localeCompare(k.pname(b)));
  }
  // "What's it for?" (Mark, 9 Nov – like the Construction planner): pick a building or ship and how many,
  // and the amount is filled in from the game's building recipe (window.YICBL from vendor/buildplan.js)
  const uses = (p) => Object.entries(window.YICBL || {}).filter(([, v]) => v[1][p]).map(([key, v]) => ({ key, name: v[0], per: v[1][p] }));
  function forHTML() {
    const k = K(), esc = k.esc, u = uses(P.p);
    if (!u.length) return '';
    return `<div class="row" style="margin-top:10px"><span class="src">What's it for?</span><select id="pp-use" style="min-width:220px"><option value="">— my own amount —</option>${u.map((x) => `<option value="${esc(x.key)}"${x.key === P.use ? ' selected' : ''}>${esc(x.name)} – ${k.bulk(P.p) ? k.amt(P.p, x.per) : x.per.toLocaleString("en-GB")} each</option>`).join('')}</select>` +
      (P.use ? `<span class="src">How many</span><input type="number" id="pp-n" min="1" step="1" value="${esc(P.n)}">` : '') + '</div>' +
      (P.use ? '<div class="hint">Amount filled in from the game’s building recipe – change it above if you want extra.</div>' : '');
  }
  function fillFor() {
    const k = K(), x = uses(P.p).find((y) => y.key === P.use);
    if (!x) return;
    const tot = x.per * Math.max(1, Math.floor(+P.n || 1));
    if (k.bulk(P.p)) { P.unit = tot >= 1e6 ? 'kt' : tot >= 1000 ? 't' : 'kg'; P.q = +(tot / UNITS[P.unit]).toFixed(3); } else P.q = tot;
  }
  function stores(W) {
    const k = K(), rock = k.S.rock, on = k.onRock();
    const wh = on.filter((b) => b.Building.buildingType === 1).sort((a, b) => k.nm(a).localeCompare(k.nm(b)));
    const tf = on.filter((b) => b.Building.buildingType === k.TANK).sort((a, b) => k.nm(a).localeCompare(k.nm(b)));
    const full = (b) => { const i = k.inv(b) || { mass: 0, volume: 0 }, c = b.Building.buildingType === k.TANK ? [75e9, 997.5e9] : [1.5e12, 75e9]; return Math.round(Math.max((i.mass + (i.reservedMass || 0)) / c[0], (i.volume + (i.reservedVolume || 0)) / c[1]) * 100); };
    const roomy = wh.slice().sort((a, b) => full(a) - full(b))[0];
    const guess = (re) => (wh.find((b) => re.test(k.nm(b))) || {}).id;
    const saved = storesGet()[rock] || {};
    const ok = (id, list) => list.some((b) => b.id === id);
    const pick = (key, re, list, dflt) => (ok(saved[key], list) ? saved[key] : (re && guess(re)) || dflt);
    // materials: the warehouse already holding the most of what the plan takes from storage (fewest moves), else the roomiest
    const holdsKg = (b) => Object.keys((W && W.stock) || {}).reduce((t, p) => t + Math.min(k.holds(b, +p), W.stock[p]) * k.grams(+p), 0);
    const most = wh.map((b) => [b, holdsKg(b)]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1])[0];
    const mat = pick('mat', /material|input|stag|process/i, wh, (most || [roomy])[0] && (most || [roomy])[0].id);
    return { wh, tf, full, mat, stock: pick('stock', /stock|store/i, wh, mat), market: pick('market', /market|distrib|sell|trade|export/i, wh, mat), build: pick('build', /build|construct|site/i, wh, mat), tank: ok(saved.tank, tf) ? saved.tank : '' };
  }
  // ---------- steps 8–9: moves into the materials warehouse, crew, start what can start, approve ----------
  // Sent through the hub's own approve() (vendor/dock.js – same checks, batches and wallet path as before):
  // S.calls = deliveries, S.startList = process starts.
  // moves: what the plan takes from storage, gathered into the materials warehouse (nearest storage first)
  function calcMoves(W, ST, mat) {
    const k = K(), stores = ST.wh.concat(ST.tf), km = (a, b) => k.kmBetween(k.lotOf(a), k.lotOf(b));
    const have = (b, p) => ((k.inv(b) || { contents: [] }).contents || []).filter((c) => c.product === p).reduce((t, c) => t + c.amount, 0);
    const dl = {}, short = [];
    Object.keys(W.stock).forEach((p) => {
      p = +p; let left = W.stock[p] - Math.min(W.stock[p], k.holds(mat, p));
      stores.filter((b) => b.id !== mat.id && have(b, p) > 0).sort((a, b) => (km(a, mat) ?? 1e9) - (km(b, mat) ?? 1e9)).forEach((b) => {
        if (left <= 0) return; const q = Math.min(left, have(b, p)); left -= q;
        (dl[b.id] = dl[b.id] || { from: b.id, to: mat.id, b, items: [] }).items.push([p, q]);
      });
      if (left > 0) short.push(p);
    });
    return { moves: Object.values(dl), short };
  }
  // how full each storage will be once the whole plan is done (Mark, 9 Nov): moves in/out, mined + flown-in goods
  // into the materials warehouse, every input used from it, in-between outputs back into it, finished goods to their store.
  // End state, by weight or space (whichever is fuller); by-products counted in full.
  function fullAfter(W, ST, byId) {
    const k = K(), MV = k.mv(), mat = byId(ST.mat), d = {};
    const add = (b, p, n) => { if (!b || !n) return; const v = MV[p] || [1000, 1000]; const x = (d[b.id] = d[b.id] || [0, 0]); x[0] += n * v[0]; x[1] += n * v[1]; };
    if (mat) {
      calcMoves(W, ST, mat).moves.forEach((mv) => mv.items.forEach(([p, a]) => { add(mv.b, p, -a); add(mat, p, a); }));
      Object.keys(W.mine).forEach((p) => add(mat, +p, W.mine[p]));
      Object.keys(W.fly).forEach((p) => add(mat, +p, W.fly[p]));
    }
    W.steps.forEach((st) => {
      Object.keys(st.r.inp).forEach((ip) => add(mat, +ip, -st.r.inp[ip] * st.runs));
      Object.keys(st.r.out).forEach((o) => add(st.to, +o, st.r.out[o] * st.runs));
    });
    return (b) => {
      if (!b) return null;
      const i = k.inv(b) || { mass: 0, volume: 0 }, c = b.Building.buildingType === k.TANK ? [75e9, 997.5e9] : [1.5e12, 75e9], x = d[b.id] || [0, 0];
      return Math.max(0, Math.round(Math.max((i.mass + (i.reservedMass || 0) + x[0]) / c[0], (i.volume + (i.reservedVolume || 0) + x[1]) / c[1]) * 100));
    };
  }
  function movesHTML(W, ST, byId) {
    const k = K(), esc = k.esc, S = k.S, mat = byId(ST.mat);
    if (!mat) return '<div class="card"><div class="src" style="color:var(--red)">Pick a materials warehouse first.</div></div>';
    const km = (a, b) => k.kmBetween(k.lotOf(a), k.lotOf(b));
    // TWO CREWS (Mark, 9 Nov): the best crew on the rock for the moves (free transport distance, then speed), and the
    // best for running the processes (the plan's main building type: Refinery = refining time, Factory / Shipyard =
    // manufacturing time, Bioreactor = reaction time – SDK Crewmate ability 8 / 9 / 10). Ready crews first; both can change.
    const cl = k.crews(), y = window.YIC || {}, cm = (k.D() && k.D().crewmates) || {};
    const roster = (c) => (((k.D() && k.D().crewList) || []).find((x) => x.id === c.id) || {}).roster || [];
    const ABIL = { 3: 8, 4: 10, 5: 9, 6: 9 };
    const tByType = {}; W.steps.forEach((st) => { const bt = k.FBT[st.r.type]; tByType[bt] = (tByType[bt] || 0) + (k.procSecs(st.r.name, st.runs) || 1); });
    const mainBt = +(Object.keys(tByType).sort((a, b) => tByType[b] - tByType[a])[0] || 3);
    const pBonus = (c) => { let m = 1; try { m = y.crewMult(ABIL[mainBt], roster(c).map((id) => cm[id]).filter(Boolean)); } catch (e) {} return m * c.fm; };
    const { moves, short } = calcMoves(W, ST, mat);
    // moves crew (Mark, 9 Nov): ranked by the real trip times of THIS plan's moves – free distance and speed
    // (Logistician +5% surface transport speed is in the speed bonus) both count; ready crews first
    const moveSecs = (c) => moves.reduce((t, x) => t + (k.tripSecs(km(x.b, mat), c) || 0), 0);
    const byM = cl.slice().sort((a, b) => (!!a.busy - !!b.busy) || moveSecs(a) - moveSecs(b) || b.free - a.free || b.speed - a.speed);
    if (!P.moverSet || !cl.find((c) => c.id === S.mover)) S.mover = (byM[0] || {}).id || 0;
    const byP = cl.slice().sort((a, b) => (!!a.busy - !!b.busy) || pBonus(b) - pBonus(a));
    if (!cl.find((c) => c.id === P.runner)) P.runner = (byP[0] || {}).id || 0;
    const crew = cl.find((c) => c.id === S.mover), runner = cl.find((c) => c.id === P.runner);
    S.moverObj = crew;
    // starts: in order, each process whose inputs are ALREADY in the materials warehouse (deliveries have to be
    // finished first) and that has a free building of its type
    const pool = {}; ((k.inv(mat) || { contents: [] }).contents || []).forEach((c) => { pool[c.product] = (pool[c.product] || 0) + c.amount; });
    const used = new Set(), ready = [], wait = [];
    W.steps.forEach((st, i) => {
      const lack = Object.keys(st.r.inp).filter((ip) => (pool[ip] || 0) < st.r.inp[ip] * st.runs);
      const bt = k.FBT[st.r.type], b = k.onRock().filter((x) => x.Building.buildingType === bt && k.freeSlot(x) && !used.has(x.id))[0];
      if (lack.length) { wait.push([i, st, 'waiting for ' + lack.map((ip) => k.pname(+ip)).slice(0, 3).join(', ') + (lack.length > 3 ? '…' : '')]); return; }
      if (!b) { wait.push([i, st, 'no free ' + k.BTN[bt]]); return; }
      if (!st.to) { wait.push([i, st, 'no storage for its outputs']); return; }
      if (!k.PID[st.r.name]) { wait.push([i, st, 'can’t be started from here']); return; }
      used.add(b.id);
      Object.keys(st.r.inp).forEach((ip) => { pool[ip] -= st.r.inp[ip] * st.runs; });
      ready.push({ i, b, slot: k.freeSlot(b), r: st.r, p: st.p, runs: st.runs, from: mat, to: st.to, crew: P.runner || S.mover });
    });
    S.calls = moves.map((x) => ({ from: x.from, to: x.to, items: x.items }));
    S.startList = P.start ? ready : [];
    // feed the crews first (Mark, 9 Nov) – same amount and source as the hub's crew step: a year's food at most,
    // from the biggest Food stock on this rock (shared out); goes first in the same approval (dock.js buildCalls S.feedCalls)
    const food = {}; k.onRock().filter(k.isStore).forEach((b) => { food[b.id] = ((k.inv(b) || { contents: [] }).contents || []).reduce((t, c) => t + (c.product === 129 ? c.amount : 0), 0); });
    const feedOne = (c, key) => {
      if (!c || c.food >= 0.95) return '';
      const yrs = Math.min(1, c.food >= 0.5 ? 1 - c.food : (0.75 - c.food) / 0.5), need = Math.floor(c.mates * 1000 * yrs);
      const sid = Object.keys(food).filter((id) => food[id] > 0).sort((a, b) => food[b] - food[a])[0];
      const src = sid && k.onRock().find((b) => b.id === +sid);
      const f = src && need > 0 ? { src: src.id, give: Math.min(need, food[sid]), crew: c.id } : null;
      if (f) { food[sid] -= f.give; if (P.feed[key]) feeds.push(f); }
      return `<div style="margin-top:8px;padding:8px 12px;border-radius:8px;background:#3fd68a12;border:1px solid #3fd68a55"><div style="color:var(--amber);margin-bottom:4px">${c.fm < 1 ? '⚠ ' + esc(c.name) + ' is hungry – slower.' : esc(c.name) + ' is ' + Math.round(c.food * 100) + '% fed.'}</div>` +
        (f ? `<label style="margin:0"><input type="checkbox" data-feed="${key}"${P.feed[key] ? ' checked' : ''}> Feed ${esc(c.name)} first: ${k.tonnes(f.give)} Food from ${esc(k.nm(src))}</label>` : '<div class="src">No Food stored on this rock to feed it.</div>') + '</div>';
    };
    const feeds = [];
    const feedM = feedOne(crew, 'm'), feedR = runner && runner.id !== (crew && crew.id) ? feedOne(runner, 'r') : '';
    S.feedCalls = feeds; S.feed = false;
    const tot = S.calls.length + S.startList.length + feeds.length;
    let h = `<div class="card"><h2><span class="n">6</span>Moves into ${esc(k.nm(mat))} (${moves.length})</h2>` +
      (moves.length ? `<table><thead><tr><th>From</th><th>Goods</th><th class="num">Trip</th></tr></thead><tbody>${moves.map((x) => { const d = km(x.b, mat); return `<tr><td>${esc(k.nm(x.b))}</td><td>${x.items.map(([p, a]) => esc(k.pname(p)) + ' ' + k.amt(p, a)).join('<br>')}</td><td class="num">${d == null ? '' : k.kmTxt(d) + ' · ' + k.tripTxt(k.tripSecs(d, crew))}</td></tr>`; }).join('')}</tbody></table>`
        : '<div class="src"><span class="ok">✓ Nothing to move</span> – what the plan takes from storage is already there (or on its way).</div>') +
      (short.length ? `<div class="hint" style="color:var(--amber)">Not enough on this rock yet: ${short.map((p) => esc(k.pname(p))).join(', ')}.</div>` : '') +
      (Object.keys(W.mine).length ? `<div class="hint">⛏ Mine into ${esc(k.nm(mat))}: ${Object.keys(W.mine).map((p) => esc(k.pname(+p)) + ' ' + k.amt(+p, W.mine[p])).join(', ')}.</div>` : '') +
      (Object.keys(W.fly).length ? `<div class="hint">✈ Fly or buy into ${esc(k.nm(mat))}: ${Object.keys(W.fly).map((p) => esc(k.pname(+p)) + ' ' + k.amt(+p, W.fly[p])).join(', ')} – the 🚀 Cargo bay can load a ship for it.</div>` : '') + '</div>';
    const copt = (c, sel, extra) => `<option value="${c.id}"${c.id === sel ? ' selected' : ''}>${esc(c.name)} – ${extra(c)} · fed ${Math.round(c.food * 100)}%${c.fm < 1 ? ' (hungry)' : ''}${c.busy ? ' · busy until ' + esc(c.busy) : ' · ready now'}</option>`;
    h += `<div class="card"><h2><span class="n">7</span>Crews</h2>` + (cl.length
      ? `<div class="row"><span class="src" style="min-width:150px">🚚 Does the moves</span><select id="pp-crew">${byM.map((c) => copt(c, S.mover, (x) => (moves.length ? 'moves ' + (moveSecs(x) ? k.tripTxt(moveSecs(x)) : 'instant') + ' · ' : '') + 'free distance ×' + x.free.toFixed(2) + ' · speed ×' + x.speed.toFixed(2))).join('')}</select></div>${feedM}
<div class="row" style="margin-top:12px"><span class="src" style="min-width:150px">⚙ Runs the processes</span><select id="pp-run">${byP.map((c) => copt(c, P.runner, (x) => esc(k.BTN[mainBt]).toLowerCase() + ' speed ×' + pBonus(x).toFixed(2))).join('')}</select></div>${feedR}
<div class="hint">Both must be on this rock. Best picked for you: moves by the total trip time of these moves (free distance and speed, Logistician included), processes by ${esc(k.BTN[mainBt]).toLowerCase()} speed (most of this plan's time). Can be the same crew.</div>`
      : '<div class="src" style="color:var(--red)">None of your crews is on this rock – a crew must be on the rock to move goods or start processes.</div>') + '</div>';
    h += `<div class="card"><h2><span class="n">8</span>Start processes</h2>` +
      `<label style="margin:0 0 8px"><input type="checkbox" id="pp-start"${P.start ? ' checked' : ''}> Start the ones that are ready in the same approval (${ready.length})</label>` +
      `<table><tbody>${ready.map((c) => `<tr><td>${c.i + 1}</td><td>▶ ${esc(c.r.name)}</td><td>${esc(k.nm(c.b))}</td><td class="ok">ready now</td></tr>`).join('')}${wait.map(([i, st, why]) => `<tr><td>${i + 1}</td><td class="src">⏳ ${esc(st.r.name)}</td><td></td><td class="src">${esc(why)}</td></tr>`).join('')}</tbody></table>` +
      '<div class="hint">A process can only start once its inputs are in the materials warehouse – moves have to be finished in the game first. The rest wait their turn.</div></div>';
    const can = !S.busy && tot && crew;
    h += `<div class="card"><h2><span class="n">9</span>Approve</h2><button class="approve" id="pp-go"${can ? '' : ' disabled style="opacity:.5;cursor:not-allowed"'}>${S.busy ? 'WAITING FOR YOUR WALLET…' : 'APPROVE IN WALLET (' + (feeds.length ? 'feed ' + feeds.length + ' crew' + (feeds.length > 1 ? 's' : '') + ' + ' : '') + S.calls.length + ' move' + (S.calls.length === 1 ? '' : 's') + (S.startList.length ? ' + start ' + S.startList.length : '') + ')'}</button>` +
      `<div class="hint">If one action fails, the game cancels the whole approval – nothing is changed.${tot > 30 ? ' This approval sends the first 30; the rest next time.' : ''}</div>` +
      `<div id="dk-msg" class="hint" style="display:${S.msg ? 'block' : 'none'};margin-top:10px;padding:10px 12px;border-radius:8px;border:1px solid ${S.msgErr ? '#ff4d4d88' : '#8fe3ff55'};color:${S.msgErr ? '#ffb3ae' : 'var(--ink)'}">${S.msg || ''}</div></div>`;
    return h;
  }
  function render(m) {
    const k = K();
    if (!k) return;
    const esc = k.esc, S = k.S, rl = k.rocks();
    if (!rl.length) { m.innerHTML = '<div class="card"><div class="src">No warehouses or tank farms found for this wallet.</div></div>'; return; }
    if (!rl.includes(S.rock)) S.rock = rl[0];
    const types = new Set(k.onRock().map((b) => b.Building.buildingType));
    const canHere = (p) => k.recipes().some((r) => r.out[p] && !/Unbundling/.test(r.name) && types.has(k.FBT[r.type]));
    const prods = products();
    const f = P.find.trim().toLowerCase();
    const hit = (p) => !f || k.pname(p).toLowerCase().includes(f);
    // a new search clears the old pick if it no longer matches (Mark, 9 Nov: "it remembers the first search")
    if (P.p && !hit(P.p)) { P.p = 0; P.use = ''; }
    const shown = prods.filter(hit);
    const bulk = P.p ? k.bulk(P.p) : true;
    const qty = P.p ? Math.max(0, bulk ? Math.round((+P.q || 0) * UNITS[P.unit]) : Math.ceil(+P.q || 0)) : 0;

    let h = `<div class="card"><h2><span class="n">1</span>Rock</h2><select id="pp-rock">${rl.map((r) => `<option${r === S.rock ? ' selected' : ''}>${esc(r)}</option>`).join('')}</select></div>`;
    h += `<div class="card"><h2><span class="n">2</span>What to make</h2><div class="row">
<input type="search" id="pp-find" placeholder="🔍 Search…" value="${esc(P.find)}">
<select id="pp-p" style="flex:1 1 320px"><option value="0">${f ? shown.length + ' found – pick one' : '— pick what to make —'}</option>${shown.map((p) => `<option value="${p}"${p === P.p ? ' selected' : ''}>${esc(k.pname(p))}${canHere(p) ? '' : ' (can’t make on this rock)'}</option>`).join('')}</select></div>` +
      (f && !P.p ? `<div class="dkp-chips" style="margin-top:8px">${shown.slice(0, 24).map((p) => `<button type="button" data-pp="${p}" class="dk-shipbtn" style="cursor:pointer">${esc(k.pname(p))}</button>`).join('') || '<span class="src">Nothing matches.</span>'}</div>` : '') +
      (P.p ? `<div class="row" style="margin-top:10px"><span class="src">How much</span><input type="number" id="pp-q" min="0" step="any" value="${esc(P.q)}">` +
        (bulk ? `<select id="pp-u" style="min-width:0">${Object.keys(UNITS).map((u) => `<option${u === P.unit ? ' selected' : ''}>${u}</option>`).join('')}</select>` : '<span class="src">×</span>') + '</div>' + forHTML() : '') + '</div>';

    if (P.p && qty > 0) {
      const W = work(P.p, qty);
      if (!W.steps.length) {
        h += `<div class="card"><h2><span class="n">3</span>What you need</h2><div class="src" style="color:var(--red)">✗ ${esc(k.pname(P.p))} can’t be made on ${esc(S.rock)}` +
          (W.noBld[P.p] ? ' – it needs a ' + W.noBld[P.p].join(' or ') + ', and there isn’t one here.' : '.') + '</div>' +
          (window.YICSRCTXT ? `<div class="src" style="margin-top:8px">Where to get it instead: ${window.YICSRCTXT(P.p, qty, k.astId(S.rock)) || 'nowhere found'}</div>` : '') + '</div>';
      } else {
        // step 3: what you need – only the things that come from outside the chain
        const row = (p, q, how) => `<tr><td>${esc(k.pname(p))}</td><td class="num">${k.amt(p, q)}</td><td class="src">${how}</td></tr>`;
        const fl = Object.keys(W.fly), mi = Object.keys(W.mine), st = Object.keys(W.stock), by = Object.keys(W.byUsed);
        const prods = [...new Set([...fl, ...mi, ...st, ...by].map(Number))].sort((a, b) => (!W.fly[b] - !W.fly[a]) || k.pname(a).localeCompare(k.pname(b)));
        let t = '';
        prods.forEach((p) => {
          const parts = [], tot = (W.fly[p] || 0) + (W.mine[p] || 0) + (W.stock[p] || 0) + (W.byUsed[p] || 0);
          if (W.stock[p]) parts.push('<span class="ok">✓ ' + k.amt(p, W.stock[p]) + ' in storage here</span>');
          if (W.byUsed[p]) parts.push('♻ ' + k.amt(p, W.byUsed[p]) + ' by-product of an earlier step');
          if (W.mine[p]) parts.push('⛏ ' + k.amt(p, W.mine[p]) + ' to mine here');
          if (W.fly[p]) parts.push('<span class="short">✈ ' + k.amt(p, W.fly[p]) + ' to fly in or buy</span>' + (W.noBld[p] ? ' <span class="hint" style="margin:0">(needs a ' + esc(W.noBld[p].join(' or ')) + ' to make here)</span>' : '') + (window.YICSRCTXT ? '<br>' + (window.YICSRCTXT(p, W.fly[p], k.astId(S.rock)) || '') : ''));
          t += row(p, tot, parts.join('<br>'));
        });
        h += `<div class="card"><h2><span class="n">3</span>What you need</h2>` +
          `<div class="dkp-sum"><div class="${fl.length ? 'bad' : 'good'}"><b>${fl.length}</b>to fly in or buy</div><div><b>${mi.length}</b>to mine here</div><div class="good"><b>${st.length}</b>from storage</div><div><b>${W.steps.length}</b>processes</div></div>` +
          (W.haveTarget ? `<div class="hint">You already have ${k.amt(P.p, W.haveTarget)} of ${esc(k.pname(P.p))} on this rock – this plan makes ${k.amt(P.p, qty)} more.</div>` : '') +
          `<table style="margin-top:8px"><thead><tr><th>Input</th><th class="num">Amount</th><th>Where from</th></tr></thead><tbody>${t}</tbody></table>` +
          `<div class="hint">Worked back from ${k.amt(P.p, qty)} ${esc(k.pname(P.p))}: stock and by-products are used first, then anything this rock can mine, then anything its buildings can make. Only what’s left needs flying in or buying.</div></div>`;

        // where each process's outputs go
        const ST = stores(W), byId = (id) => ST.wh.concat(ST.tf).find((b) => b.id === +id);
        const pf = P.for || (P.use ? 'build' : 'stock');
        const fin = W.steps[W.steps.length - 1];
        const fluid = (r) => Object.keys(r.out).every((o) => k.TANKOK.has(+o));
        W.steps.forEach((s) => { s.to = s === fin ? (ST.tank && fluid(s.r) ? byId(ST.tank) : byId(ST[pf])) : byId(ST.mat); });
        // step 6: the processes to run, in order
        const blds = (bt) => k.onRock().filter((b) => b.Building.buildingType === bt);
        h += `<div class="card"><h2><span class="n">4</span>Processes to run (${W.steps.length}), in order</h2><table><thead><tr><th>#</th><th>Process</th><th>Makes</th><th class="num">Runs</th><th>Building</th><th>Outputs go to</th><th class="num">Time</th></tr></thead><tbody>` +
          W.steps.map((s, i) => {
            const bt = k.FBT[s.r.type], bs = blds(bt), free = bs.filter((b) => k.freeSlot(b)).length;
            return `<tr><td>${i + 1}</td><td>${esc(s.r.name)}</td><td>${esc(k.pname(s.p))} ${k.amt(s.p, s.r.out[s.p] * s.runs)}</td><td class="num">${s.runs.toLocaleString('en-GB')}</td>` +
              `<td>${esc(k.BTN[bt])} <span class="${free ? 'ok' : 'src'}">· ${free} of ${bs.length} free</span></td><td>${s.to ? esc(k.nm(s.to)) : '<span style="color:var(--red)">no storage</span>'}</td><td class="num">${hrs(k.procSecs(s.r.name, s.runs) || 0)}</td></tr>`;
          }).join('') + '</tbody></table>' +
          '<div class="hint">Earlier steps make what later steps need. Times are without crew or building bonuses.</div></div>';
        // step 7: where things go
        const after = fullAfter(W, ST, byId);
        const pc = (n) => `<b style="color:${n > 100 ? '#ff4d4d' : n >= 90 ? '#ff6b6b' : n >= 75 ? '#ffb03b' : '#3fd68a'}">${n}%</b>`;
        const aft = (key) => { const b = byId(ST[key]); if (!b) return '<td></td>'; const a = after(b), n = ST.full(b); return `<td class="num" style="white-space:nowrap">${n}% → ${pc(a)}${a > 100 ? ' <span style="color:#ff4d4d">won’t fit</span>' : ''}</td>`; };
        const sel = (key, list, none) => `<select data-st="${key}">${none ? `<option value="">${none}</option>` : ''}${list.map((b) => `<option value="${b.id}"${b.id === ST[key] ? ' selected' : ''}>${esc(k.nm(b))} · ${ST.full(b)}% full</option>`).join('')}</select>`;
        h += `<div class="card"><h2><span class="n">5</span>Where things go</h2>
<div class="row"><span class="src">What it's for</span>${FOR.map(([v, t]) => `<button type="button" class="dk-shipbtn${pf === v ? ' on' : ''}" data-for="${v}">${t}</button>`).join('')}</div>
<table style="margin-top:10px"><tbody>
<tr><td>📦 Materials warehouse</td><td>${sel('mat', ST.wh)}</td>${aft('mat')}<td class="src">Everything the processes use is gathered here; in-between products land here too.</td></tr>
<tr><td>🏷 Stock store</td><td>${sel('stock', ST.wh)}</td>${aft('stock')}<td class="src">Finished goods made for stock.</td></tr>
<tr><td>🛒 Market store</td><td>${sel('market', ST.wh)}</td>${aft('market')}<td class="src">Finished goods made to sell.</td></tr>
<tr><td>🏗 Building store</td><td>${sel('build', ST.wh)}</td>${aft('build')}<td class="src">Finished goods for your own building.</td></tr>
<tr><td>🛢 Tank farm</td><td>${ST.tf.length ? sel('tank', ST.tf, '— don’t use one —') : '<span class="src">none on this rock</span>'}</td>${aft('tank')}<td class="src">Finished goods that are all fluid (e.g. Hydrogen Propellant).</td></tr>
</tbody></table><div class="hint">Full now → full when the plan is done: <span style="color:#3fd68a">green</span> under 75%, <span style="color:#ffb03b">amber</span> 75–89%, <span style="color:#ff6b6b">red</span> 90% or more. Remembered for ${esc(S.rock)} in this browser.</div></div>`;
        h += movesHTML(W, ST, byId);
      }
    }
    m.innerHTML = h;
    const on = (id, ev, fn) => { const e = m.querySelector('#' + id); if (e) e.addEventListener(ev, fn); };
    on('pp-rock', 'change', (e) => { S.rock = e.target.value; P.moverSet = false; P.runner = 0; k.render(); });
    on('pp-p', 'change', (e) => { const was = P.p; P.p = +e.target.value; P.use = ''; if (P.p && (!was || k.bulk(was) !== k.bulk(P.p))) { P.q = k.bulk(P.p) ? 100 : 1; P.unit = 't'; } k.render(); });
    on('pp-find', 'input', (e) => { P.find = e.target.value; const pos = e.target.selectionStart; k.render(); const n = m.querySelector('#pp-find'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } });
    on('pp-q', 'change', (e) => { P.q = e.target.value; k.render(); });
    on('pp-crew', 'change', (e) => { S.mover = +e.target.value; P.moverSet = true; P.feed.m = false; k.render(); });
    m.querySelectorAll('[data-feed]').forEach((e) => e.addEventListener('change', () => { P.feed[e.dataset.feed] = e.checked; k.render(); }));
    on('pp-run', 'change', (e) => { P.runner = +e.target.value; P.feed.r = false; k.render(); });
    on('pp-start', 'change', (e) => { P.start = e.target.checked; k.render(); });
    on('pp-go', 'click', () => k.approve());
    m.querySelectorAll('[data-for]').forEach((b) => b.addEventListener('click', () => { P.for = b.dataset.for; k.render(); }));
    m.querySelectorAll('select[data-st]').forEach((e) => e.addEventListener('change', () => { const all = storesGet(), r = (all[S.rock] = all[S.rock] || {}); r[e.dataset.st] = e.value ? +e.value : ''; storesPut(all); k.render(); }));
    m.querySelectorAll('[data-pp]').forEach((b) => b.addEventListener('click', () => { P.p = +b.dataset.pp; P.use = ''; P.q = k.bulk(P.p) ? 100 : 1; P.unit = 't'; k.render(); }));
    on('pp-use', 'change', (e) => { P.use = e.target.value; P.n = 1; fillFor(); k.render(); });
    on('pp-n', 'change', (e) => { P.n = e.target.value; fillFor(); k.render(); });
    on('pp-u', 'change', (e) => { P.unit = e.target.value; k.render(); });
  }

  window.YICPROD = { render, work };
})();
