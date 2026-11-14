/* Production – Logistics Bridge – LIVE 9 Nov 2026 (Mark tested a real load and process start on ?beta=1)
   Mark's list: 1 select rock · 2 pick what to make (weight for bulk, count for things like modules) ·
   3 show what you need (stock, mine, fly in / buy) · 4 work the chain back as far as needed for the amount ·
   5 don't show the whole chain, just what's needed · 6 list the processes to run · 7 pick where materials come
   from and where outputs go · 8 work through the chain in order, using by-products · 9 list the moves, option to
   start the processes · 10 keep the order and show finished / next lined up.
   THIS FILE: steps 1–9 – moves + starts go through the hub's approve(). Step 10 (tracking) comes next and reuse the hub's moves + starts.
   Uses the hub's helpers (window.YICDOCK from vendor/dock.js); drawn on the viewscreen by vendor/hubbridge.js. */
(function () {
  'use strict';
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

  // ---------- step 10: keep the order, show finished / running / next (Mark, 13 Nov – TEST ONLY, ?beta=1) ----------
  // A plan is saved (this browser only – Mark: "fine for now") when its approval is sent. Reopening Production lists the
  // plans; one shows each process as ✓ done / ⚙ running / ▶ ready / ⏳ waiting, read from the game (processors running
  // that process in the buildings this plan started it in), and the ready ones can be started from there.
  const TRACK = true; // LIVE 13 Nov 2026 (tested on ?beta=1 – Mark)
  const PKEY = 'sk_prod_plans';
  const MVLINK = /[?&]beta=1\b/.test(location.search); // 🚚 moves + crew links on a plan – TEST ONLY (Mark, 14 Nov)
  function plansGet() { try { return JSON.parse(localStorage.getItem(PKEY) || '[]'); } catch (e) { return []; } }
  function plansPut(a) { try { localStorage.setItem(PKEY, JSON.stringify(a)); } catch (e) {} }
  const myPlans = () => { const k = K(), w = String((k.D() && k.D().wallet) || '').toLowerCase(); return plansGet().filter((x) => !x.wallet || x.wallet === w); };
  function snapPlan(W, ST, qty) {
    const k = K();
    return { id: 'p' + Date.now(), wallet: String((k.D() && k.D().wallet) || '').toLowerCase(), rock: k.S.rock, p: P.p, qty, mat: ST.mat, made: Date.now(),
      steps: W.steps.map((s) => ({ name: s.r.name, p: s.p, runs: s.runs, to: s.to ? s.to.id : 0 })), started: {}, mover: k.S.mover || 0 };
  }
  function noteStarts(plan, list) {
    (list || []).forEach((c) => { if (c.i == null) return; (plan.started[c.i] = plan.started[c.i] || []).push({ b: c.b.id, runs: c.runs, at: Math.floor(Date.now() / 1000) }); });
  }
  function savePlan(plan) { const a = plansGet().filter((x) => x.id !== plan.id); a.unshift(plan); plansPut(a.slice(0, 30)); }
  // where each step of a saved plan stands now
  function planStatus(plan) {
    const k = K(), R = k.recipes(), now = Date.now() / 1000;
    const on = k.allB().filter((b) => k.rockOf(b) === plan.rock), byId = (id) => on.find((b) => b.id === +id);
    const mat = byId(plan.mat);
    const pool = {}; ((mat && k.inv(mat)) || { contents: [] }).contents.forEach((c) => { pool[c.product] = (pool[c.product] || 0) + c.amount; });
    const used = new Set();
    return plan.steps.map((st, i) => {
      const r = R.find((x) => x.name === st.name), pid = k.PID[st.name], bt = r ? k.FBT[r.type] : 0;
      const starts = plan.started[i] || [];
      let runningFin = 0, toCollect = 0, startedRuns = 0;
      starts.forEach((x) => {
        startedRuns += x.runs;
        const b = byId(x.b), pr = b && (b.Processors || []).find((q) => q.status === 1 && q.runningProcess === pid);
        if (pr) { if (pr.finishTime > now) runningFin = Math.max(runningFin, pr.finishTime); else toCollect++; }
      });
      const left = Math.max(0, st.runs - startedRuns);
      const o = { i, st, r, bt, left, runningFin, toCollect };
      if (runningFin) o.s = 'run'; else if (toCollect) o.s = 'collect'; else if (!left) o.s = 'done';
      if (!left) return o;
      if (o.s) { o.why = left.toLocaleString('en-GB') + ' runs still to start after this'; return o; }
      o.s = 'wait';
      if (!r) { o.why = 'recipe not found'; return o; }
      if (!mat) { o.why = 'materials warehouse not found'; return o; }
      if (!pid) { o.why = 'can’t be started from here'; return o; }
      const one = { r, runs: left };
      if (k.capRuns && !k.capRuns(one)) { o.why = 'one run takes longer than the game allows'; return o; }
      const lack = Object.keys(r.inp).filter((ip) => (pool[ip] || 0) < r.inp[ip] * one.runs);
      if (lack.length) { o.why = 'waiting for ' + lack.map((ip) => k.pname(+ip)).slice(0, 3).join(', ') + (lack.length > 3 ? '…' : ''); return o; }
      const b = on.filter((x) => x.Building.buildingType === bt && k.freeSlot(x) && !used.has(x.id))[0];
      if (!b) { o.why = 'no free ' + (k.BTN[bt] || 'building'); return o; }
      const to = byId(st.to) || mat;
      used.add(b.id); Object.keys(r.inp).forEach((ip) => { pool[ip] -= r.inp[ip] * one.runs; });
      o.s = 'ready'; o.start = { i, b, slot: k.freeSlot(b), r, p: st.p, runs: one.runs, capTxt: one.capTxt, from: mat, to };
      return o;
    });
  }
  const tally = (ss) => ({ done: ss.filter((x) => x.s === 'done').length, run: ss.filter((x) => x.s === 'run').length, col: ss.filter((x) => x.s === 'collect').length, ready: ss.filter((x) => x.s === 'ready').length });
  const whenTxt = (t) => new Date(t * 1000).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  function plansListHTML() {
    const k = K(), esc = k.esc, a = myPlans();
    if (!a.length) return '';
    return `<div class="card"><h2><span class="n">📋</span>Your production plans (${a.length})</h2>` + a.map((pl) => {
      const t = tally(planStatus(pl)), n = pl.steps.length;
      const bits = [t.done + ' of ' + n + ' done'];
      if (t.run) bits.push('⚙ ' + t.run + ' running'); if (t.col) bits.push('✓ ' + t.col + ' to collect'); if (t.ready) bits.push('<span class="ok">▶ ' + t.ready + ' ready</span>');
      return `<div class="dkp-t${t.done === n ? ' fin' : ''}" style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><a href="#" data-track="${esc(pl.id)}" style="flex:1;color:inherit;text-decoration:none"><b>${esc(k.pname(pl.p))}</b> ${k.amt(pl.p, pl.qty)} · ${esc(pl.rock)}<div class="src" style="margin-top:2px">${bits.join(' · ')}</div></a><button type="button" data-ppforget="${esc(pl.id)}" title="Forget this plan" style="min-width:0;flex:none">✕</button></div>`;
    }).join('') + '<div class="hint">Saved in this browser when you approve a plan. Click one to see where it’s up to.</div></div>';
  }
  function trackHTML(plan) {
    const k = K(), esc = k.esc, S = k.S, ss = planStatus(plan), t = tally(ss);
    const on = k.allB().filter((b) => k.rockOf(b) === plan.rock), byId = (id) => on.find((b) => b.id === +id);
    const cl = k.crews(plan.rock);
    if (!cl.find((c) => c.id === P.runner)) P.runner = ((cl.find((c) => !c.busy) || cl[0]) || {}).id || 0;
    const runner = cl.find((c) => c.id === P.runner);
    const ready = ss.filter((x) => x.s === 'ready').map((x) => Object.assign(x.start, { crew: P.runner }));
    S.rock = plan.rock; S.calls = []; S.feedCalls = []; S.feed = false; S.mover = P.runner; S.moverObj = runner;
    S.startList = ready;
    const ICON = { done: '<span class="ok">✓ done</span>', run: '⚙ running', collect: '<span style="color:var(--amber)">✓ finished – collect it in the game</span>', ready: '<span class="ok">▶ ready to start</span>', wait: '<span class="src">⏳ waiting</span>' };
    let h = `<div class="card"><h2><span class="n">📋</span>${esc(k.pname(plan.p))} ${k.amt(plan.p, plan.qty)} on ${esc(plan.rock)}</h2>` +
      `<div class="row"><button type="button" class="dk-shipbtn" id="pp-back" style="cursor:pointer">← All plans / new plan</button><span class="src">Planned ${esc(whenTxt(plan.made / 1000))} · materials in ${esc(byId(plan.mat) ? k.nm(byId(plan.mat)) : '?')}</span></div>` +
      `<div class="dkp-sum" style="margin-top:10px"><div class="good"><b>${t.done}</b>done</div><div><b>${t.run}</b>running</div><div><b>${t.col}</b>to collect</div><div class="good"><b>${t.ready}</b>ready now</div><div><b>${plan.steps.length - t.done - t.run - t.col - t.ready}</b>waiting</div></div>` +
      `<table style="margin-top:10px"><thead><tr><th>#</th><th>Process</th><th>Makes</th><th class="num">Runs</th><th>Status</th></tr></thead><tbody>` +
      ss.map((x) => {
        const st = x.st, b = x.start && x.start.b;
        const extra = x.s === 'run' ? ' · finishes about ' + esc(whenTxt(x.runningFin)) : x.s === 'ready' ? ' · ' + esc(k.nm(b)) + (x.start.capTxt ? '<br><span class="src">⏱ ' + esc(x.start.capTxt) + '</span>' : '') : '';
        return `<tr><td>${x.i + 1}</td><td>${esc(st.name)}</td><td>${esc(k.pname(st.p))}</td><td class="num">${st.runs.toLocaleString('en-GB')}${x.left && x.left < st.runs ? '<br><span class="src">' + x.left.toLocaleString('en-GB') + ' left</span>' : ''}</td><td>${ICON[x.s] || ''}${extra}${x.why ? '<br><span class="src">' + esc(x.why) + '</span>' : ''}</td></tr>`;
      }).join('') + '</tbody></table>' +
      (t.col ? '<div class="hint" style="color:var(--amber)">Finished processes must be collected in the game before their outputs can be used and the building is free.</div>' : '') + '</div>';
    // 🚚 the moves for this plan, with in-game links to finish them (Mark, 14 Nov – TEST ONLY, ?beta=1): processes sat
    // "waiting for stock" and there was no quick way to the crew that sent the moves. Deliveries into the materials
    // warehouse that aren't finished yet; the crew that sent them is saved on the plan from now on (older plans
    // just get the warehouse link – any crew can finish a delivery there).
    if (MVLINK) {
      const now = Date.now() / 1000, ow = (S.incList || []).filter((r) => r[4][0] === 5 && r[4][1] === +plan.mat);
      if (ow.length) {
        const mv = k.crews(plan.rock).find((c) => c.id === plan.mover), matB = byId(plan.mat), ready = ow.filter((r) => r[2] <= now).length;
        const gl = (path, t) => (window.GL && window.GL.on() ? window.GL(path, t) : ' <a href="https://game.influenceth.io' + path + '" target="influencegame" rel="noopener" style="color:var(--cyan)" title="' + esc(t) + '">in game ↗</a>');
        h += `<div class="card"><h2><span class="n">🚚</span>Moves on their way (${ow.length})</h2>` +
          `<div class="row" style="flex-wrap:wrap;gap:6px 14px">` +
          (mv ? `<span>Finish them with <b>${esc(mv.name)}</b>${gl('/crew/' + mv.id, 'Open ' + mv.name + ' in the game')}</span>` : '') +
          (matB ? `<span class="src">or at <b>${esc(k.nm(matB))}</b>${gl('/building/' + matB.id, 'Open ' + k.nm(matB) + ' in the game – any crew can finish the delivery there')}</span>` : '') + '</div>' +
          `<table style="margin-top:8px"><thead><tr><th>Goods</th><th>From</th><th>Status</th></tr></thead><tbody>` +
          ow.map((r) => `<tr><td>${r[5].map((x) => esc(k.pname(x[0])) + ' ' + k.amt(x[0], x[1])).join('<br>')}</td><td class="src">${esc(r[3][0] === 5 ? (byId(r[3][1]) ? k.nm(byId(r[3][1])) : 'Building #' + r[3][1]) : 'elsewhere')}</td><td class="src">${r[2] <= now ? '<span class="ok">ready – Finish All Ready Items</span>' : 'arrives in ' + Math.max(1, Math.round((r[2] - now) / 60)) + ' min'}</td></tr>`).join('') +
          `</tbody></table>${ready ? '<div class="hint">Once they’re finished in the game, press ↻ Check the game again.</div>' : ''}</div>`;
      }
    }
    if (t.done === plan.steps.length) return h + '<div class="card"><div class="src"><span class="ok">✓ All done.</span> You can forget this plan from the list.</div></div>';
    h += `<div class="card"><h2><span class="n">▶</span>Start the next ones</h2>` + (cl.length
      ? `<div class="row"><span class="src" style="min-width:150px">⚙ Runs the processes</span><select id="pp-trun">${cl.map((c) => `<option value="${c.id}"${c.id === P.runner ? ' selected' : ''}>${esc(c.name)}${c.busy ? ' – busy until ' + esc(c.busy) : ' – ready now'}</option>`).join('')}</select></div>`
      : '<div class="src" style="color:var(--red)">None of your crews is on this rock.</div>') +
      `<button class="approve" id="pp-tgo" style="margin-top:10px"${ready.length && runner && !S.busy ? '' : ' disabled style="opacity:.5;cursor:not-allowed"'}>${S.busy ? 'WAITING FOR YOUR WALLET…' : ready.length ? 'APPROVE IN WALLET (start ' + ready.length + ')' : 'NOTHING READY TO START YET'}</button>` +
      `<div class="hint">Press ↻ Check the game again to update. A process is ready when its inputs are in the materials warehouse and a building is free.</div>` +
      `<div id="dk-msg" class="hint" style="display:${S.msg ? 'block' : 'none'};margin-top:10px;padding:10px 12px;border-radius:8px;border:1px solid ${S.msgErr ? '#ff4d4d88' : '#8fe3ff55'};color:${S.msgErr ? '#ffb3ae' : 'var(--ink)'}">${S.msg || ''}</div></div>`;
    return h;
  }

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
      let best = rs.map((r) => recipeEst(r, p, path.concat(p))).sort((a, b) => a[0] - b[0] || a[1] - b[1])[0];
      // making it must not mean flying in more than 5× what the item itself weighs (Mark, 9 Nov: 53 trips of Troilite for one
      // Solids Automation Module – Silver / Tin are tiny by-products of Lead / Troilite processing). Then just fly it in.
      if (best[0] > 5 * k.grams(p) / 1000) best = [k.grams(p) / 1000, 0];
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
      const best = (main.length ? main : rs).map((x) => [x, sc(x)]).sort((a, b) => a[1][0] - b[1][0] || a[1][1] - b[1][1] || cost(a[0]) - cost(b[0]))[0];
      // over 5× its own weight to fly in what making it needs (e.g. Silver from tons of Lead) → fly the item in instead
      if (!top && best[1][0] > 5 * k.grams(p) / 1000) { fly[p] = (fly[p] || 0) + q; return; }
      const r = best[0];
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

  // ---------- MAX (Mark, 13 Nov – TEST ONLY, ?beta=1): "use all the Pyroxene I have to make Sodium Tungstate" ----------
  // The most of the target that can be made from what's on the rock now (storage, deliveries on the way, by-products) –
  // nothing to fly in, buy or mine. Found by doubling then halving the amount. Says which input runs out first.
  const MAXB = true; // MAX, search by input/process, Cargo bay ship fixes – LIVE 13 Nov 2026 (tested on ?beta=1 – Mark)
  function maxMake(target) {
    const ok = (q) => { const W = work(target, q); return W.steps.length && !Object.keys(W.fly).length && !Object.keys(W.mine).length; };
    if (!ok(1)) { const W = work(target, 1); return { q: 0, by: Object.keys(W.fly).concat(Object.keys(W.mine)).map(Number) }; }
    let lo = 1, hi = 2;
    while (hi < 1e13 && ok(hi)) { lo = hi; hi *= 2; }
    while (hi - lo > 1) { const mid = Math.floor((lo + hi) / 2); if (ok(mid)) lo = mid; else hi = mid; }
    const W = work(target, hi);
    return { q: lo, by: Object.keys(W.fly).concat(Object.keys(W.mine)).map(Number) };
  }

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
      const one = { r: st.r, runs: st.runs }; // game's max process time (dock.js capRuns, Mark 13 Nov)
      if (k.capRuns && !k.capRuns(one)) { wait.push([i, st, 'one run takes longer than the game allows']); return; }
      used.add(b.id);
      Object.keys(st.r.inp).forEach((ip) => { pool[ip] -= st.r.inp[ip] * one.runs; });
      ready.push({ i, b, slot: k.freeSlot(b), r: st.r, p: st.p, runs: one.runs, capTxt: one.capTxt, from: mat, to: st.to, crew: P.runner || S.mover });
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
    // TIMES (Mark, 9 Nov): duration with the process crew's speed bonus for that building type, and an estimated finish:
    // a process starts once the earlier processes that make its inputs have finished (moves taken as quick) and a
    // building of its type is free (busy ones counted from when they finish). Real time = game time ÷ 24.
    const now = Date.now() / 1000;
    const bonusFor = (bt) => { let m = 1; try { m = y.crewMult(ABIL[bt], roster(runner || {}).map((id) => cm[id]).filter(Boolean)); } catch (e) {} return Math.max(0.1, m * ((runner && runner.fm) || 1)); };
    const bFree = {}; k.onRock().filter((b) => k.BTN[b.Building.buildingType]).forEach((b) => {
      const fin = (b.Processors || []).filter((x) => x.status === 1).map((x) => x.finishTime || now);
      bFree[b.id] = k.freeSlot(b) ? now : Math.max(now, fin.length ? Math.min(...fin) : now);
    });
    const T = [];
    W.steps.forEach((st, i) => {
      const bt = k.FBT[st.r.type], dur = Math.ceil((k.procSecs(st.r.name, st.runs) || 0) / bonusFor(bt));
      let dep = now; W.steps.slice(0, i).forEach((e, j) => { if (Object.keys(st.r.inp).some((ip) => e.r.out[ip])) dep = Math.max(dep, T[j].fin); });
      const rd = ready.find((c) => c.i === i);
      const bid = rd ? rd.b.id : (Object.keys(bFree).filter((id) => k.onRock().find((b) => b.id === +id).Building.buildingType === bt).sort((a, b) => bFree[a] - bFree[b])[0]);
      const start = Math.max(dep, bid ? bFree[bid] : dep);
      if (bid) bFree[bid] = start + dur;
      T[i] = { dur, start, fin: start + dur };
    });
    const when = (t) => new Date(t * 1000).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const tcells = (i) => `<td class="num">${hrs(T[i].dur)}</td><td class="num">${when(T[i].fin)}</td>`;
    h += `<div class="card"><h2><span class="n">8</span>Start processes</h2>` +
      `<label style="margin:0 0 8px"><input type="checkbox" id="pp-start"${P.start ? ' checked' : ''}> Start the ones that are ready in the same approval (${ready.length})</label>` +
      `<table><thead><tr><th>#</th><th>Process</th><th>Building</th><th>Status</th><th class="num">Takes</th><th class="num">Finishes about</th></tr></thead><tbody>` +
      W.steps.map((st, i) => { const c = ready.find((x) => x.i === i), w = wait.find((x) => x[0] === i);
        return c ? `<tr><td>${i + 1}</td><td>▶ ${esc(c.r.name)}</td><td>${esc(k.nm(c.b))}</td><td class="ok">ready now${c.capTxt ? `<br><span class="src">⏱ ${esc(c.capTxt)}</span>` : ''}</td>${tcells(i)}</tr>`
          : `<tr><td>${i + 1}</td><td class="src">⏳ ${esc(st.r.name)}</td><td></td><td class="src">${esc(w ? w[2] : '')}</td>${tcells(i)}</tr>`; }).join('') + '</tbody></table>' +
      `<div class="hint">All done about <b>${when(Math.max(...T.map((x) => x.fin)))}</b>. Times use ${runner ? esc(runner.name) + '’s' : 'no'} speed bonus, without building bonuses; moves still to finish in the game can add to it.</div>` +
      '<div class="hint">A process can only start once its inputs are in the materials warehouse – moves have to be finished in the game first. The rest wait their turn.</div></div>';
    const can = !S.busy && tot && crew;
    h += `<div class="card"><h2><span class="n">9</span>Approve</h2><button class="approve" id="pp-go"${can ? '' : ' disabled style="opacity:.5;cursor:not-allowed"'}>${S.busy ? 'WAITING FOR YOUR WALLET…' : 'APPROVE IN WALLET (' + (feeds.length ? 'feed ' + feeds.length + ' crew' + (feeds.length > 1 ? 's' : '') + ' + ' : '') + S.calls.length + ' move' + (S.calls.length === 1 ? '' : 's') + (S.startList.length ? ' + start ' + S.startList.length : '') + ')'}</button>` +
      `<div class="hint">If one action fails, the game cancels the whole approval – nothing is changed.${tot > 30 ? ' This approval sends the first 30; the rest next time.' : ''}</div>` +
      `<div id="dk-msg" class="hint" style="display:${S.msg ? 'block' : 'none'};margin-top:10px;padding:10px 12px;border-radius:8px;border:1px solid ${S.msgErr ? '#ff4d4d88' : '#8fe3ff55'};color:${S.msgErr ? '#ffb3ae' : 'var(--ink)'}">${S.msg || ''}</div></div>`;
    return h;
  }
  // ---------- Cargo bay: which rock has it, which ship, flight times, how many trips (Mark, 9 Nov) ----------
  // "I'd just like to know what rock has the resources, are there ships with enough space, if not the best ship to send
  // there to collect, showing flight times and how many flights will be needed. Shuttles are not any good for transporting."
  // Flight times: the site's own route maths (vendor/travel.js, same as the Travel page – quickest trip leaving now,
  // 1 game day = 1 real hour), the ship's propellant now, no crew engine bonus. Light / Heavy Transports only.
  const C = { src: '', pick: {}, mine: {}, chg: {}, rt: {}, to: {}, key: '', busy: false };
  const SHIPT = { 2: 'Light Transport', 3: 'Heavy Transport' };
  let TR = null;
  // Mark (9 Nov, 3rd go): "too much on here. I just want to know how many locations i need to fly in from, are there any
  // ships there or nearest ship available. If multiple rocks can supply then give me the quickest ones available."
  // So: one card per pick-up rock – what it supplies, the ship there or the nearest one, trips, all done in. Rocks are
  // used quickest-first (flight time to the rock it's for). The by-material list is folded away.
  function cargoPanel(el, items) {
    const k = K(), esc = k.esc, S = k.S, d = k.D() || {}, dest = S.rock;
    const g = (p) => k.grams(+p), v = (p) => (k.mv()[p] || [1000, 1000])[1];
    const stores = (r) => k.allB().filter((b) => k.isStore(b) && k.rockOf(b) === r);
    const have = (b, p) => ((k.inv(b) || { contents: [] }).contents || []).filter((c) => c.product === +p).reduce((t, c) => t + c.amount, 0);
    const rockHas = (r, p) => stores(r).reduce((t, b) => t + have(b, p), 0);
    const orbit = (id) => ((d.owned || []).find((a) => a.id === id) || {}).Orbit;
    const astName = (id) => { const a = (d.owned || []).find((x) => x.id === id); return (a && a.Name && a.Name.name) || (id ? 'Asteroid #' + id : '?'); };
    const hrsTxt = (x) => (x == null ? '…' : x < 1 ? 'under 1 h' : x < 48 ? Math.round(x) + ' h' : (x / 24).toFixed(1) + ' days');
    const dstAst = k.astId(dest);
    // which rocks have any of it; used quickest first (C.rt = flight hours rock → here), then most of the load
    const cand = [...new Set(k.allB().filter(k.isStore).map(k.rockOf).filter(Boolean))].filter((r) => r !== dest && Object.keys(items).some((p) => rockHas(r, p) > 0));
    const totG = Object.keys(items).reduce((t, p) => t + items[p] * g(p), 0) || 1;
    const share = (r) => Object.keys(items).reduce((t, p) => t + Math.min(items[p], rockHas(r, p)) * g(p), 0) / totG;
    const rt = (r) => (C.rt[r] && C.rt[r].ok ? C.rt[r].h : 1e6);
    const left = Object.assign({}, items), pk = [];
    cand.sort((a, b) => rt(a) - rt(b) || share(b) - share(a)).forEach((r) => {
      const got = {}; let G = 0, V = 0;
      Object.keys(left).forEach((p) => { const n = Math.min(left[p], rockHas(r, p)); if (n > 0) { got[p] = n; left[p] -= n; G += n * g(p); V += n * v(p); } });
      if (G > 0) pk.push({ r, ast: k.astId(r), got, G, V });
    });
    const short = Object.keys(left).filter((p) => left[p] > 0);
    // ships (Light / Heavy Transports): there now, or how far away (C.to[rock][ship] = hours to get there)
    const ships = (d.ships || []).filter((s) => SHIPT[s.st] && s.capM);
    const shipsTxt = ships.length ? '' : 'You have no Light or Heavy Transports.';
    pk.forEach((x) => {
      const opts = ships.map((s) => {
        const there = s.sst === 'd' && s.dId === x.ast, f = (C.to[x.r] || {})[s.id];
        const trips = Math.max(1, Math.ceil(Math.max(x.G / (s.capM * 0.995), x.V / (s.capV * 0.995))));
        const away = there ? 0 : f && f.ok ? f.h : null;
        const leg = rt(x.r) < 1e6 ? rt(x.r) : null;
        const done = away == null || leg == null ? null : away + trips * leg + (trips - 1) * leg;
        // full already (Mark, 13 Nov – Skippys Last LT had 2,000 t of Sulfur Dioxide on board: "0 t in 0 moves") – TEST ONLY
        const full = MAXB && ((s.capM - s.useM) < s.capM * 0.01 || (s.capV - s.useV) < s.capV * 0.01);
        return { s, there, trips, away, refuel: f && f.refuel, done, full };
      }).sort((a, b) => (a.full - b.full) || (a.done ?? 1e9) - (b.done ?? 1e9) || (b.there - a.there));
      x.opts = opts;
      // Mark (13 Nov, TEST ONLY ?beta=1): the ship was picked before the flight times were worked out and then kept –
      // now the best ship is picked again as the times come in, until you pick one yourself; when it changes, a warning
      // says so. If you picked one and a quicker one turns up, it says that instead.
      if (MAXB && opts[0]) {
        const was = C.pick[x.r], top = opts[0];
        if (!C.mine[x.r]) { if (was && was !== top.s.id && top.done != null) C.chg[x.r] = was; C.pick[x.r] = top.s.id; }
        else if (!opts.find((o) => o.s.id === was)) { C.pick[x.r] = top.s.id; C.mine[x.r] = false; }
        const cur = opts.find((o) => o.s.id === C.pick[x.r]);
        x.warn = C.mine[x.r] && cur && top !== cur && top.done != null && cur.done != null && cur.done - top.done > 0.5 ? 'quicker: ' + top.s.name + ' – all done in ' + hrsTxt(top.done)
          : C.chg[x.r] ? 'ship changed to ' + (cur ? cur.s.name : '?') + ' now the flight times are worked out – check it’s the one you want' : '';
      } else if (!opts.find((o) => o.s.id === (C.pick[x.r] || 0))) C.pick[x.r] = opts[0] ? opts[0].s.id : 0;
      x.best = opts.find((o) => o.s.id === C.pick[x.r]);
    });
    let h = `<div class="card"><h2><span class="n">🚀</span>Fly it in to ${esc(dest)}</h2>`;
    if (!pk.length) { el.innerHTML = h + '<div class="src" style="color:var(--amber)">None of your other rocks has any of it in stock – it all has to be bought or mined.</div></div>'; return; }
    // short = not ENOUGH in stock on your other rocks (Mark, 9 Nov: "3 items not on any of your rocks? That can't be right"
    // – they were partly in stock). Says how much is short and which of your rocks has the buildings to make it.
    const R = k.recipes(), types = {};
    k.allB().forEach((b) => { const r = k.rockOf(b); if (r && r !== dest) (types[r] = types[r] || new Set()).add(b.Building.buildingType); });
    const makers = (p) => Object.keys(types).filter((r) => R.some((x) => x.out[p] && !/Unbundling/.test(x.name) && types[r].has(k.FBT[x.type])));
    h += `<div class="src" style="font-size:1.1em;margin-bottom:8px">You need to fly in from <b>${pk.length} rock${pk.length === 1 ? '' : 's'}</b>.${MAXB ? ' <span class="src">Click a rock to load its ship.</span>' : ''}</div>` +
      (short.length ? `<div class="src" style="margin-bottom:10px"><span class="short">Not enough in stock on your rocks:</span>` + short.map((p) => { const mk = makers(+p); return `<div style="margin-top:3px">• <b>${esc(k.pname(+p))}</b> – short by ${k.amt(+p, left[p])}${mk.length ? ' · <span class="ok">can be made on ' + mk.map(esc).join(', ') + '</span>' : ' · buy it or mine it'}</div>`; }).join('') + '</div>' : '');
    h += pk.map((x) => {
      const b = x.best, sel = x.r === C.src;
      const shipLine = !b ? `<span style="color:var(--amber)">${shipsTxt || 'No ship can get there.'}</span>`
        : b.there ? `🚀 <b>${esc(b.s.name)}</b> is there · ${SHIPT[b.s.st]}${b.full ? ' <span style="color:var(--amber)">(full – unload it first)</span>' : ''}`
          : `🚀 Nearest: <b>${esc(b.s.name)}</b> · ${b.s.sst === 'f' ? 'flying to ' : 'at '}${esc(astName(b.s.dId))} · ${b.away == null ? '…' : hrsTxt(b.away) + ' away'}${b.refuel ? ' <span style="color:var(--amber)">(refuel first)</span>' : ''}`;
      return `<div class="dkp-t${sel ? ' fin' : ''}" data-src="${esc(x.r)}" style="cursor:pointer;margin-bottom:8px;display:block">
<div class="dkp-n">${esc(x.r)} <span class="src" style="font-weight:400">· ${k.tonnes(x.G / 1000)} · ${hrsTxt(rt(x.r) < 1e6 ? rt(x.r) : null)} flight to ${esc(dest)}</span></div>
<div class="src" style="margin-top:4px">${shipLine}${b ? ' · ' + b.trips + ' trip' + (b.trips === 1 ? '' : 's') + ' · all done in <b>' + hrsTxt(b.done) + '</b>' : ''}</div>${x.warn ? `<div class="src" style="margin-top:4px;color:var(--amber)">⚠ ${esc(x.warn)}</div>` : ''}${MAXB && b ? (b.there && b.full ? `<div class="src" style="margin-top:8px;color:var(--amber)">⚠ ${esc(b.s.name)} is full – unload it in the game first</div>` : b.there ? `<div style="margin-top:8px"><span class="dk-shipbtn" style="display:inline-block;padding:4px 12px;border-radius:8px;background:${sel ? '#ffb03b' : '#2a1d08'};color:${sel ? '#1a1000' : '#ffd28a'};border:1px solid #ffb03b;font-weight:700">📦 ${sel ? 'Loading list below ↓' : 'Click to load ' + esc(b.s.name) + ' now'}</span></div>` : `<div class="src" style="margin-top:8px;color:var(--dim)">✈ No ship here yet – fly one here in the game first</div>`) : ''}
<div class="dkp-s" style="margin-top:4px">${Object.keys(x.got).sort((p1, p2) => x.got[p2] * g(p2) - x.got[p1] * g(p1)).map((p) => esc(k.pname(+p))).slice(0, 6).join(', ')}${Object.keys(x.got).length > 6 ? ' and ' + (Object.keys(x.got).length - 6) + ' more' : ''}</div></div>`;
    }).join('');
    // folded details: by material, and what to buy
    h += `<details class="dkp-fold"><summary>Details – by material</summary><table><thead><tr><th>Material</th><th class="num">Need</th><th>From</th><th>Short</th></tr></thead><tbody>` +
      Object.keys(items).sort((a, b) => items[b] * g(b) - items[a] * g(a)).map((p) => `<tr><td>${esc(k.pname(+p))}</td><td class="num">${k.amt(+p, items[p])}</td><td class="src">${pk.filter((x) => x.got[p]).map((x) => k.amt(+p, x.got[p]) + ' ' + esc(x.r)).join('<br>') || '–'}</td><td>${left[p] > 0 ? '<span class="short">' + k.amt(+p, left[p]) + '</span>' + (window.YICSRCTXT ? '<div class="hint" style="margin:2px 0 0">' + (window.YICSRCTXT(+p, left[p], k.astId(dest)) || '') + '</div>' : '') : '<span class="ok">✓</span>'}</td></tr>`).join('') + '</tbody></table></details>';
    // the picked rock: change ship, and load it if it's there
    if (!pk.find((x) => x.r === C.src)) C.src = pk[0].r;
    const X = pk.find((x) => x.r === C.src), pick = X.best;
    S.calls = []; S.startList = []; S.feed = false; S.srcRock = C.src;
    h += `<div style="margin-top:12px;padding-top:10px;border-top:1px solid #3a2c18"><div class="row"><span class="src"><b>${esc(C.src)}</b> – ship</span><select id="pp-cship">${X.opts.map((o) => `<option value="${o.s.id}"${o.s.id === C.pick[C.src] ? ' selected' : ''}>${esc(o.s.name)} · ${o.full ? 'FULL · ' : ''}${o.there ? 'there now' : o.away == null ? '…' : hrsTxt(o.away) + ' away'} · ${o.trips} trip${o.trips === 1 ? '' : 's'}${o.done != null ? ' · done in ' + hrsTxt(o.done) : ''}</option>`).join('')}</select></div>`;
    if (pick && pick.there) {
      const cl = k.crews(C.src);
      if (!cl.find((c) => c.id === S.mover)) S.mover = (cl.find((c) => !c.busy) || cl[0] || {}).id || 0;
      S.moverObj = cl.find((c) => c.id === S.mover);
      let fg = (pick.s.capM - pick.s.useM) * 0.995, fv = (pick.s.capV - pick.s.useV) * 0.995; const mv = {};
      Object.keys(X.got).sort((a, b) => X.got[b] * v(b) - X.got[a] * v(a)).forEach((p) => {
        let n = Math.min(X.got[p], Math.floor(fg / g(p)), Math.floor(fv / v(p))); if (n <= 0) return;
        fg -= n * g(p); fv -= n * v(p);
        stores(C.src).map((b) => [b, have(b, p), k.kmBetween(k.lotOf(b), pick.s.lot, X.ast) ?? 1e9]).filter((z) => z[1] > 0).sort((a, b) => a[2] - b[2]).forEach(([b, hv]) => {
          if (n <= 0) return; const q = Math.min(n, hv); n -= q; (mv[b.id] = mv[b.id] || { b, items: [] }).items.push([+p, q]);
        });
      });
      S.calls = Object.keys(mv).map((id) => ({ from: +id, to: pick.s.id, ship: true, slot: 2, items: mv[id].items }));
      const lg = S.calls.reduce((t, c) => t + c.items.reduce((u, [p, a]) => u + a * g(p), 0), 0);
      // what will be loaded, shown before the wallet asks (Mark, 9 Nov): storage → ship, item by item
      if (MAXB && !S.calls.length) h += `<div class="src" style="margin-top:8px;color:var(--amber)">⚠ Nothing fits – ${esc(pick.s.name)} is full (${k.tonnes(pick.s.useM / 1000)} on board${pick.s.carry ? ', ' + esc(pick.s.carry) : ''}). Unload it in the game first, or pick another ship.</div>`;
      else h += `<div class="src" style="margin-top:8px">Load ${esc(pick.s.name)}${pick.trips > 1 ? ' – trip 1 of ' + pick.trips : ''}: <b>${k.tonnes(lg / 1000)}</b> in ${S.calls.length} move${S.calls.length === 1 ? '' : 's'}:</div>` +
        `<div style="margin:6px 0 0 4px;padding-left:12px;border-left:2px solid #ffb03b55">` + Object.keys(mv).map((id) => `<div style="margin:6px 0"><b>${esc(k.nm(mv[id].b))}</b> → 🚀 ${esc(pick.s.name)}` +
          mv[id].items.map(([p, a]) => `<div class="src" style="margin-left:16px">└ ${esc(k.pname(p))} <b>${k.amt(p, a)}</b></div>`).join('') + '</div>').join('') + '</div>' +
        (cl.length ? `<div class="row" style="margin-top:6px"><span class="src">Moved by</span><select id="pp-ccrew">${cl.map((c) => `<option value="${c.id}"${c.id === S.mover ? ' selected' : ''}>${esc(c.name)}${c.busy ? ' – busy until ' + esc(c.busy) : ' – ready'}</option>`).join('')}</select></div>` : `<div class="src" style="color:var(--red)">No crew on ${esc(C.src)} to do the loading.</div>`) +
        `<button class="approve" id="pp-cgo" style="margin-top:10px"${S.calls.length && cl.length && !S.busy ? '' : ' disabled'}>${S.busy ? 'WAITING FOR YOUR WALLET…' : 'APPROVE IN WALLET (load ' + esc(pick.s.name) + ')'}</button>` +
        `<div id="dk-msg" class="hint" style="display:${S.msg ? 'block' : 'none'};margin-top:10px;padding:10px 12px;border-radius:8px;border:1px solid ${S.msgErr ? '#ff4d4d88' : '#8fe3ff55'};color:${S.msgErr ? '#ffb3ae' : 'var(--ink)'}">${S.msg || ''}</div>`;
    } else if (pick) h += `<div class="src" style="margin-top:8px;color:var(--amber)">Fly ${esc(pick.s.name)} to ${esc(C.src)} in the game first${pick.away != null ? ' (about ' + hrsTxt(pick.away) + ')' : ''}, then come back here to load it.</div>`;
    h += `</div><div class="hint">This only loads a ship – you fly it and unload it in the game. Flight times: quickest route leaving now (site's route maths), loaded with a full tank; getting there with the propellant it has now. Light / Heavy Transports only.</div>`;
    el.innerHTML = h + '</div>';
    el.querySelectorAll('[data-src]').forEach((r) => r.addEventListener('click', () => { C.src = r.dataset.src; k.render(); }));
    const cs = el.querySelector('#pp-cship'); if (cs) cs.addEventListener('change', () => { C.pick[C.src] = +cs.value; C.mine[C.src] = true; delete C.chg[C.src]; k.render(); });
    const cc = el.querySelector('#pp-ccrew'); if (cc) cc.addEventListener('change', () => { S.mover = +cc.value; k.render(); });
    const go = el.querySelector('#pp-cgo'); if (go) go.addEventListener('click', () => k.approve());
    // flight times (take a moment): each rock → here, and each ship → each pick-up rock; then draw again
    const key = dest + '|' + cand.join(',') + '|' + pk.map((x) => x.r).join(',');
    if (C.key === key || C.busy) return;
    C.key = key; C.busy = true;
    (TR ? Promise.resolve(TR) : import('./travel.js').then((T) => (TR = T))).then(async (T) => {
      const dep = (Date.now() / 1000 - 1609459200) / 3600, oD = orbit(dstAst), now = Date.now() / 1000;
      const lt = T.SHIPS[2]; let changed = false;
      for (const r of cand) if (!C.rt[r]) {
        const oS = orbit(k.astId(r)); let f = null;
        try { f = oS && oD ? await T.fastest(oS, oD, dep, T.maxDeltaV(2, 1, 1, lt[3] / 2000, lt[2] / 1000)) : null; } catch (e) {}
        C.rt[r] = f ? { ok: true, h: f.tof } : { ok: false }; changed = true;
      }
      for (const x of pk) {
        C.to[x.r] = C.to[x.r] || {};
        const oS = orbit(x.ast);
        for (const s of ships) {
          if (C.to[x.r][s.id]) continue;
          if (s.sst === 'd' && s.dId === x.ast) { C.to[x.r][s.id] = { ok: true, h: 0 }; changed = true; continue; }
          const wait = s.sst === 'f' && s.arrT > now ? Math.ceil((s.arrT - now) / 3600) : 0, oF = orbit(s.dId), out = { ok: false };
          try {
            if (s.dId === x.ast) Object.assign(out, { ok: true, h: wait });
            else if (oF && oS) {
              const pkg = (s.prop || 0) * 1000, full = (T.SHIPS[s.st] || [0, 0, 0])[2] / 1000;
              let f = await T.fastest(oF, oS, dep + wait, T.maxDeltaV(s.st, s.sv, 1, s.useM / 1000, pkg));
              if (!f) { f = await T.fastest(oF, oS, dep + wait, T.maxDeltaV(s.st, s.sv, 1, s.useM / 1000, full)); if (f) out.refuel = true; }
              if (f) Object.assign(out, { ok: true, h: wait + f.tof });
            }
          } catch (e) {}
          C.to[x.r][s.id] = out; changed = true;
        }
      }
      C.busy = false;
      if (changed) k.render();
    }).catch(() => { C.busy = false; });
  }
  function render(m, mode) {
    const k = K();
    const cargo = mode === 'ship'; // Cargo bay (Mark, 9 Nov): same steps 1–3 on the rock to make it on, then load a ship with what's left to fly in
    if (!k) return;
    const esc = k.esc, S = k.S, rl = k.rocks();
    if (!rl.length) { m.innerHTML = '<div class="card"><div class="src">No warehouses or tank farms found for this wallet.</div></div>'; return; }
    // opened from a Captain's log box (dock.js start, ?mk=…) – fill in rock, product and amount once
    const go = window.YICPRODGO;
    if (go && !cargo) {
      window.YICPRODGO = null;
      if (go.rock && rl.includes(go.rock)) S.rock = go.rock;
      P.p = go.p; P.use = ''; P.find = ''; P.track = ''; P.maxTxt = '';
      if (k.bulk(P.p)) { const q = go.q || 100000; P.unit = q >= 1e6 ? 'kt' : q >= 1000 ? 't' : 'kg'; P.q = Math.ceil(q / UNITS[P.unit] * 1000) / 1000; } else P.q = go.q || 1;
    }
    if (!rl.includes(S.rock)) S.rock = rl[0];
    // step 10 (TEST ONLY): a saved plan open → show where it's up to; otherwise the list of plans goes above step 1
    P.snap = null;
    if (TRACK && !cargo && P.track) { const pl = myPlans().find((x) => x.id === P.track); if (pl) return finish(m, trackHTML(pl)); P.track = ''; }
    const types = new Set(k.onRock().map((b) => b.Building.buildingType));
    const canHere = (p) => k.recipes().some((r) => r.out[p] && !/Unbundling/.test(r.name) && types.has(k.FBT[r.type]));
    const prods = products();
    const f = P.find.trim().toLowerCase();
    // search by input or process too (Mark, 13 Nov – TEST ONLY, ?beta=1): "Pyroxene" also finds what's made FROM it,
    // e.g. Sodium Chromate from Pyroxene Acid Leaching. via(p) = the matching process, shown on the button.
    const via = (p) => { if (!MAXB || !f || k.pname(p).toLowerCase().includes(f)) return null; return k.recipes().find((r) => r.out[p] && !/Unbundling/.test(r.name) && (r.name.toLowerCase().includes(f) || Object.keys(r.inp).some((ip) => k.pname(+ip).toLowerCase().includes(f)))) || null; };
    const hit = (p) => !f || k.pname(p).toLowerCase().includes(f) || !!via(p);
    // a new search clears the old pick if it no longer matches (Mark, 9 Nov: "it remembers the first search")
    if (P.p && !hit(P.p)) { P.p = 0; P.use = ''; }
    const shown = prods.filter(hit);
    const bulk = P.p ? k.bulk(P.p) : true;
    const qty = P.p ? Math.max(0, bulk ? Math.round((+P.q || 0) * UNITS[P.unit]) : Math.ceil(+P.q || 0)) : 0;

    let h = TRACK && !cargo ? plansListHTML() : '';
    h += `<div class="card"><h2><span class="n">1</span>${cargo ? 'Rock to make it on' : 'Rock'}</h2><select id="pp-rock">${rl.map((r) => `<option${r === S.rock ? ' selected' : ''}>${esc(r)}</option>`).join('')}</select></div>`;
    h += `<div class="card"><h2><span class="n">2</span>What to make</h2><div class="row">
<input type="search" id="pp-find" placeholder="${MAXB ? '🔍 Product, input or process…' : '🔍 Search…'}" value="${esc(P.find)}">
<select id="pp-p" style="flex:1 1 320px"><option value="0">${f ? shown.length + ' found – pick one' : '— pick what to make —'}</option>${shown.map((p) => `<option value="${p}"${p === P.p ? ' selected' : ''}>${esc(k.pname(p))}${canHere(p) ? '' : ' (can’t make on this rock)'}</option>`).join('')}</select></div>` +
      (f && !P.p ? `<div class="dkp-chips" style="margin-top:8px">${shown.slice(0, 40).map((p) => { const v = via(p); return `<button type="button" data-pp="${p}" class="dk-shipbtn" style="cursor:pointer"${v ? ` title="${esc(v.name)}"` : ''}>${esc(k.pname(p))}${v ? ` <span class="src" style="font-size:.85em">← ${esc(v.name)}</span>` : ''}</button>`; }).join('') || '<span class="src">Nothing matches.</span>'}</div>` : '') +
      (P.p ? `<div class="row" style="margin-top:10px"><span class="src">How much</span><input type="number" id="pp-q" min="0" step="any" value="${esc(P.q)}">` +
        (bulk ? `<select id="pp-u" style="min-width:0">${Object.keys(UNITS).map((u) => `<option${u === P.unit ? ' selected' : ''}>${u}</option>`).join('')}</select>` : '<span class="src">×</span>') +
        (MAXB ? `<button type="button" class="dk-shipbtn" id="pp-max" style="cursor:pointer" title="As much as you can make from what’s on this rock now">MAX</button>` : '') + '</div>' +
        (MAXB && P.maxTxt ? `<div class="hint">${P.maxTxt}</div>` : '') + forHTML() : '') + '</div>';

    if (P.p && qty > 0) {
      const W = work(P.p, qty);
      if (!W.steps.length) {
        h += `<div class="card"><h2><span class="n">3</span>What you need</h2><div class="src" style="color:var(--red)">✗ ${esc(k.pname(P.p))} can’t be made on ${esc(S.rock)}` +
          (W.noBld[P.p] ? ' – it needs a ' + W.noBld[P.p].join(' or ') + ', and there isn’t one here.' : '.') + '</div>' +
          (window.YICSRCTXT ? `<div class="src" style="margin-top:8px">Where to get it instead: ${window.YICSRCTXT(P.p, qty, k.astId(S.rock)) || 'nowhere found'}</div>` : '') + '</div>';
        if (cargo) { P.shipItems = { [P.p]: qty }; P.shipQty = qty; h += '<div id="pp-ship"></div>'; return finish(m, h); }
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
          `<div class="dkp-sum"><div><b>${W.steps.length}</b>processes</div><div class="good"><b>${st.length}</b>from storage</div><div><b>${mi.length}</b>to mine here</div><div class="${fl.length ? 'bad' : 'good'}"><b>${fl.length}</b>to fly in or buy</div></div>` +
          (W.haveTarget ? `<div class="hint">You already have ${k.amt(P.p, W.haveTarget)} of ${esc(k.pname(P.p))} on this rock – this plan makes ${k.amt(P.p, qty)} more.</div>` : '') +
          // the inputs list folds away if the player wants (Mark, 9 Nov) – remembered while the page is open
          `<details id="pp-inputs" class="dkp-fold"${P.inOpen ? ' open' : ''}><summary>Inputs (${prods.length})</summary><table style="margin-top:4px"><thead><tr><th>Input</th><th class="num">Amount</th><th>Where from</th></tr></thead><tbody>${t}</tbody></table></details>` +
          `<div class="hint">Worked back from ${k.amt(P.p, qty)} ${esc(k.pname(P.p))}: stock and by-products are used first, then anything this rock can mine, then anything its buildings can make. Only what’s left needs flying in or buying.</div></div>`;

        if (cargo) {
          // only what the rock can't get from its storage, by-products, mining or making goes on the ship –
          // worked back through the chain as far as the amount needs (Mark, 9 Nov)
          const items = {}; Object.keys(W.fly).forEach((p) => { items[p] = Math.ceil(W.fly[p]); });
          h += Object.keys(items).length ? '<div id="pp-ship"></div>'
            : `<div class="card"><div class="src"><span class="ok">✓ Nothing to fly in</span> – everything for ${k.amt(P.p, qty)} ${esc(k.pname(P.p))} can come from ${esc(S.rock)} itself. Use 🏭 Production.</div></div>`;
          P.shipItems = items; P.shipQty = qty;
          return finish(m, h);
        }
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
        if (TRACK) P.snap = snapPlan(W, ST, qty);
      }
    }
    P.shipItems = null;
    finish(m, h);
  }
  function finish(m, h) {
    const k = K(), S = k.S;
    m.innerHTML = h;
    const sh = m.querySelector('#pp-ship');
    if (sh && P.shipItems) cargoPanel(sh, P.shipItems);
    const on = (id, ev, fn) => { const e = m.querySelector('#' + id); if (e) e.addEventListener(ev, fn); };
    on('pp-rock', 'change', (e) => { S.rock = e.target.value; P.moverSet = false; P.runner = 0; k.render(); });
    on('pp-p', 'change', (e) => { const was = P.p; P.p = +e.target.value; P.use = ''; P.maxTxt = ''; if (P.p && (!was || k.bulk(was) !== k.bulk(P.p))) { P.q = k.bulk(P.p) ? 100 : 1; P.unit = 't'; } k.render(); });
    on('pp-find', 'input', (e) => { P.find = e.target.value; const pos = e.target.selectionStart; k.render(); const n = m.querySelector('#pp-find'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } });
    on('pp-q', 'change', (e) => { P.q = e.target.value; P.maxTxt = ''; k.render(); });
    on('pp-max', 'click', () => {
      const x = maxMake(P.p), esc = k.esc, by = x.by.map((p) => esc(k.pname(p))).slice(0, 3).join(', ');
      if (!x.q) { P.maxTxt = '<span style="color:var(--amber)">Can’t make any from what’s on ' + esc(S.rock) + ' – needs ' + (by || 'more') + '.</span>'; k.render(); return; }
      if (k.bulk(P.p)) { P.unit = x.q >= 1e6 ? 'kt' : x.q >= 1000 ? 't' : 'kg'; P.q = Math.floor(x.q / UNITS[P.unit] * 1000) / 1000; } else P.q = x.q;
      P.use = ''; P.maxTxt = 'MAX from what’s on ' + esc(S.rock) + ' now' + (by ? ' – runs out of <b>' + by + '</b> first' : '') + '.';
      k.render();
    });
    on('pp-inputs', 'toggle', (e) => { P.inOpen = e.target.open; });
    on('pp-crew', 'change', (e) => { S.mover = +e.target.value; P.moverSet = true; P.feed.m = false; k.render(); });
    m.querySelectorAll('[data-feed]').forEach((e) => e.addEventListener('change', () => { P.feed[e.dataset.feed] = e.checked; k.render(); }));
    on('pp-run', 'change', (e) => { P.runner = +e.target.value; P.feed.r = false; k.render(); });
    on('pp-start', 'change', (e) => { P.start = e.target.checked; k.render(); });
    // step 10: save the plan once its approval is sent (TEST ONLY)
    const sent = () => !S.msgErr && /Sent to the game/.test(S.msg || '');
    on('pp-go', 'click', async () => { const snap = P.snap; S.msg = ''; await k.approve(); if (TRACK && snap && sent()) { noteStarts(snap, S.batchStart); savePlan(snap); P.track = snap.id; k.render(); } });
    on('pp-tgo', 'click', async () => { const id = P.track; S.msg = ''; await k.approve(); if (sent()) { const pl = plansGet().find((x) => x.id === id); if (pl) { noteStarts(pl, S.batchStart); savePlan(pl); } k.render(); } });
    on('pp-trun', 'change', (e) => { P.runner = +e.target.value; k.render(); });
    on('pp-back', 'click', () => { P.track = ''; S.msg = ''; k.render(); });
    m.querySelectorAll('[data-track]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); P.track = b.dataset.track; S.msg = ''; k.render(); }));
    m.querySelectorAll('[data-ppforget]').forEach((b) => b.addEventListener('click', () => { plansPut(plansGet().filter((x) => x.id !== b.dataset.ppforget)); k.render(); }));
    m.querySelectorAll('[data-for]').forEach((b) => b.addEventListener('click', () => { P.for = b.dataset.for; k.render(); }));
    m.querySelectorAll('select[data-st]').forEach((e) => e.addEventListener('change', () => { const all = storesGet(), r = (all[S.rock] = all[S.rock] || {}); r[e.dataset.st] = e.value ? +e.value : ''; storesPut(all); k.render(); }));
    m.querySelectorAll('[data-pp]').forEach((b) => b.addEventListener('click', () => { P.p = +b.dataset.pp; P.use = ''; P.q = k.bulk(P.p) ? 100 : 1; P.unit = 't'; k.render(); }));
    on('pp-use', 'change', (e) => { P.use = e.target.value; P.n = 1; fillFor(); k.render(); });
    on('pp-n', 'change', (e) => { P.n = e.target.value; fillFor(); k.render(); });
    on('pp-u', 'change', (e) => { P.unit = e.target.value; k.render(); });
  }

  window.YICPROD = { render, work, planStatus, maxMake };
})();
