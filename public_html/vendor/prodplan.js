/* Production – Logistics Bridge – TEST ONLY (?beta=1) (Mark, 9 Nov 2026)
   Mark's list: 1 select rock · 2 pick what to make (weight for bulk, count for things like modules) ·
   3 show what you need (stock, mine, fly in / buy) · 4 work the chain back as far as needed for the amount ·
   5 don't show the whole chain, just what's needed · 6 list the processes to run · 7 pick where materials come
   from and where outputs go · 8 work through the chain in order, using by-products · 9 list the moves, option to
   start the processes · 10 keep the order and show finished / next lined up.
   THIS FILE: steps 1–6 (nothing is sent). Steps 7–10 come next and reuse the hub's moves + starts.
   Uses the hub's helpers (window.YICDOCK from vendor/dock.js); drawn on the viewscreen by vendor/hubbridge.js. */
(function () {
  'use strict';
  if (!/[?&]beta=1\b/.test(location.search)) return; // test only
  const K = () => window.YICDOCK;
  const P = { p: 0, q: 100, unit: 't', find: '' };

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
    const shown = prods.filter((p) => !f || k.pname(p).toLowerCase().includes(f) || p === P.p);
    const bulk = P.p ? k.bulk(P.p) : true;
    const qty = P.p ? Math.max(0, bulk ? Math.round((+P.q || 0) * UNITS[P.unit]) : Math.ceil(+P.q || 0)) : 0;

    let h = `<div class="card"><h2><span class="n">1</span>Rock</h2><select id="pp-rock">${rl.map((r) => `<option${r === S.rock ? ' selected' : ''}>${esc(r)}</option>`).join('')}</select></div>`;
    h += `<div class="card"><h2><span class="n">2</span>What to make</h2><div class="row">
<input type="search" id="pp-find" placeholder="🔍 Search…" value="${esc(P.find)}">
<select id="pp-p" style="flex:1 1 320px"><option value="0">— pick what to make —</option>${shown.map((p) => `<option value="${p}"${p === P.p ? ' selected' : ''}>${esc(k.pname(p))}${canHere(p) ? '' : ' (can’t make on this rock)'}</option>`).join('')}</select></div>` +
      (P.p ? `<div class="row" style="margin-top:10px"><span class="src">How much</span><input type="number" id="pp-q" min="0" step="any" value="${esc(P.q)}">` +
        (bulk ? `<select id="pp-u" style="min-width:0">${Object.keys(UNITS).map((u) => `<option${u === P.unit ? ' selected' : ''}>${u}</option>`).join('')}</select>` : '<span class="src">×</span>') + '</div>' : '') + '</div>';

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

        // step 6: the processes to run, in order
        const blds = (bt) => k.onRock().filter((b) => b.Building.buildingType === bt);
        h += `<div class="card"><h2><span class="n">4</span>Processes to run (${W.steps.length}), in order</h2><table><thead><tr><th>#</th><th>Process</th><th>Makes</th><th class="num">Runs</th><th>Building</th><th class="num">Time</th></tr></thead><tbody>` +
          W.steps.map((s, i) => {
            const bt = k.FBT[s.r.type], bs = blds(bt), free = bs.filter((b) => k.freeSlot(b)).length;
            return `<tr><td>${i + 1}</td><td>${esc(s.r.name)}</td><td>${esc(k.pname(s.p))} ${k.amt(s.p, s.r.out[s.p] * s.runs)}</td><td class="num">${s.runs.toLocaleString('en-GB')}</td>` +
              `<td>${esc(k.BTN[bt])} <span class="${free ? 'ok' : 'src'}">· ${free} of ${bs.length} free</span></td><td class="num">${hrs(k.procSecs(s.r.name, s.runs) || 0)}</td></tr>`;
          }).join('') + '</tbody></table>' +
          '<div class="hint">Earlier steps make what later steps need. Times are without crew or building bonuses.</div></div>';
        h += '<div class="card"><div class="src" style="color:var(--amber)">Next to build: pick where materials come from and where outputs go, the moves, starting the processes, and tracking them.</div></div>';
      }
    }
    m.innerHTML = h;
    const on = (id, ev, fn) => { const e = m.querySelector('#' + id); if (e) e.addEventListener(ev, fn); };
    on('pp-rock', 'change', (e) => { S.rock = e.target.value; k.render(); });
    on('pp-p', 'change', (e) => { const was = P.p; P.p = +e.target.value; if (P.p && (!was || k.bulk(was) !== k.bulk(P.p))) { P.q = k.bulk(P.p) ? 100 : 1; P.unit = 't'; } k.render(); });
    on('pp-find', 'input', (e) => { P.find = e.target.value; const pos = e.target.selectionStart; k.render(); const n = m.querySelector('#pp-find'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } });
    on('pp-q', 'change', (e) => { P.q = e.target.value; k.render(); });
    on('pp-u', 'change', (e) => { P.unit = e.target.value; k.render(); });
  }

  window.YICPROD = { render, work };
})();
