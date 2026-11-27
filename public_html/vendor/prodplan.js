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
  const PKEY = 'sk_prod_plans';
  function plansGet() { try { return JSON.parse(localStorage.getItem(PKEY) || '[]'); } catch (e) { return []; } }
  function plansPut(a) { try { localStorage.setItem(PKEY, JSON.stringify(a)); } catch (e) {} }
  const myPlans = () => { const k = K(), w = String((k.D() && k.D().wallet) || '').toLowerCase(); return plansGet().filter((x) => !x.wallet || x.wallet === w); };
  function snapPlan(W, ST, qty) {
    const k = K();
    return { id: 'p' + Date.now(), wallet: String((k.D() && k.D().wallet) || '').toLowerCase(), rock: k.S.rock, p: P.p, qty, mat: ST.mat, made: Date.now(),
      steps: W.steps.map((s) => ({ name: s.r.name, p: s.p, runs: s.runs, to: s.to ? s.to.id : 0, ship: s.to && s.to.ship ? 1 : 0, from: s.from ? s.from.id : 0 })), started: {}, mover: k.S.mover || 0 };
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
    // each step takes its inputs from its own store: the materials warehouse, or the fuel processing store (26 Nov)
    const pools = {}, poolOf = (b) => { if (!b) return {}; if (!pools[b.id]) { const q = pools[b.id] = {}; (k.inv(b) || { contents: [] }).contents.forEach((c) => { q[c.product] = (q[c.product] || 0) + c.amount; }); } return pools[b.id]; };
    const used = new Set(), doneP = new Set(), runB = {};
    return plan.steps.map((st, i) => {
      const org = (st.from && byId(st.from)) || mat, pool = poolOf(org);
      const r = R.find((x) => x.name === st.name), pid = k.PID[st.name], bt = r ? k.FBT[r.type] : 0;
      const starts = plan.started[i] || [];
      let runningFin = 0, toCollect = 0, startedRuns = 0, colB = 0;
      starts.forEach((x) => {
        startedRuns += x.runs;
        const b = byId(x.b), pr = b && (b.Processors || []).find((q) => q.status === 1 && q.runningProcess === pid);
        if (pr) { if (pr.finishTime > now) { runningFin = Math.max(runningFin, pr.finishTime); runB[String(st.p)] = runB[String(st.p)] || b.id; } else { toCollect++; colB = colB || b.id; } }
      });
      const left = Math.max(0, st.runs - startedRuns);
      const o = { i, st, r, bt, left, runningFin, toCollect, colB };
      if (runningFin) o.s = 'run'; else if (toCollect) o.s = 'collect'; else if (!left) o.s = 'done';
      if (o.s === 'done') doneP.add(String(st.p));
      if (!left) return o;
      // still running but runs left (Mark, 15 Nov – LIVE 18 Nov): "nothing ready" while a second Bioreactor
      // sat free with the inputs there. Now the rest can start in another free building while this one runs.
      if (o.s) { o.why = left.toLocaleString('en-GB') + ' runs still to start after this';  }
      const busy = o.s;
      o.s = o.s || 'wait';
      const nope = (why) => { if (!busy) o.why = why; return o; };
      if (!r) return nope('recipe not found');
      if (!org) return nope('materials warehouse not found');
      if (!pid) return nope('can’t be started from here');
      const one = { r, runs: left };
      if (k.capRuns && !k.capRuns(one)) return nope('one run takes longer than the game allows');
      const lack = Object.keys(r.inp).filter((ip) => (pool[ip] || 0) < r.inp[ip] * one.runs);
      // WFD (Mark, 23 Nov – TEST ONLY, ?beta=1): leave out inputs whose own step is already done – "waiting for Pump, Computer"
      // with Computer done. If only done ones are short, say they haven't reached the materials store yet.
      const lackW = lack.filter((ip) => !doneP.has(String(ip)));
      const nm3 = (a) => a.map((ip) => k.pname(+ip)).slice(0, 3).join(', ') + (a.length > 3 ? '…' : '');
      // WLB (Mark, 23 Nov – TEST ONLY, ?beta=1): link to the building it's waiting on – the one making the missing input,
      // else the materials store it has to reach
      o.wb = (lack.map((ip) => runB[String(ip)]).find(Boolean)) || (org && org.id) || 0;
      if (lackW.length) return nope('waiting for ' + nm3(lackW));
      // COMMS (Mark, 23 Nov – TEST ONLY, ?beta=1): a bit of fun – the step is done, the game just hasn't told us yet
      // Mark (24 Nov): still showing 10+ minutes after accepting – some of it may be there but not enough. Say how much.
      // Mark (24 Nov): "maybe it delivered them to another location?" – look in the rock's other buildings and say where
      const elsewhere = [];
      lack.forEach((ip) => on.forEach((x) => { if (x.id === org.id) return; const n = ((k.inv(x) || { contents: [] }).contents || []).filter((c) => c.product === +ip).reduce((t, c) => t + c.amount, 0); if (n > 0) elsewhere.push([ip, x, n]); }));
      if (elsewhere.length) {
        o.wb = elsewhere[0][1].id;
        // FXB (Mark, 24 Nov – TEST ONLY, ?beta=1): "can't it now tell me to move them?" – offer the move in the approval
        { const want = {}; lack.forEach((ip) => { want[ip] = Math.max(0, r.inp[ip] * one.runs - (pool[ip] || 0)); });
          o.fix = []; elsewhere.forEach(([ip, x, n]) => { const a = Math.min(n, want[ip]); if (a > 0) { want[ip] -= a; o.fix.push({ from: x.id, to: org.id, items: [[+ip, a]], fromName: k.nm(x), toName: k.nm(org) }); } }); }
        return nope('found it: ' + elsewhere.slice(0, 3).map(([ip, x, n]) => k.pname(+ip) + ' ' + k.amt(+ip, n) + ' in ' + k.nm(x)).join(', ') + ' – move it to ' + k.nm(org)); }
      const partly = lack.filter((ip) => (pool[ip] || 0) > 0);
      if (partly.length) return nope('short in ' + k.nm(org) + ': ' + partly.map((ip) => k.pname(+ip) + ' ' + k.amt(+ip, pool[ip]) + ' of ' + k.amt(+ip, r.inp[ip] * one.runs)).join(', '));
      if (lack.length) return nope('📡 Confirmation is still crawling here at the speed of light');
      const b = on.filter((x) => x.Building.buildingType === bt && k.freeSlot(x) && !used.has(x.id))[0];
      if (!b) {
        // the building of that type that frees up first
        { const fin = (x) => Math.min(...(x.Processors || []).filter((q) => q.status === 1).map((q) => q.finishTime || Infinity), Infinity); o.wb = (on.filter((x) => x.Building.buildingType === bt).sort((x, y) => fin(x) - fin(y))[0] || {}).id || 0; }
        return nope('no free ' + (k.BTN[bt] || 'building'));
      }
      const to = st.ship ? { ship: true, id: st.to, slot: 1, Name: { name: 'the ship’s tank' } } : (byId(st.to) || mat); // ⛽ straight into a ship (26 Nov)
      used.add(b.id); Object.keys(r.inp).forEach((ip) => { pool[ip] -= r.inp[ip] * one.runs; });
      if (busy) o.why = 'the other ' + one.runs.toLocaleString('en-GB') + ' runs can start now';
      else o.s = 'ready';
      o.start = { i, b, slot: k.freeSlot(b), r, p: st.p, runs: one.runs, capTxt: one.capTxt, from: org, to };
      return o;
    });
  }
  const tally = (ss) => ({ done: ss.filter((x) => x.s === 'done').length, run: ss.filter((x) => x.s === 'run').length, col: ss.filter((x) => x.s === 'collect').length, ready: ss.filter((x) => x.start).length, wait: ss.filter((x) => x.s === 'wait').length });
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
    // pick which ready process(es) to start (Mark, 14 Nov – TEST ONLY, ?beta=1): each ready one gets a tick box,
    // ticked by default; only the ticked ones go in the approval. "Ready" already means its inputs are there and a building
    // is free, so nothing ticked here waits on another process finishing.
    P.noStart = P.noStart || {};
    const pick = (i) => !(P.noStart[plan.id + ':' + i]);
    const ready = ss.filter((x) => x.start && pick(x.i)).map((x) => Object.assign(x.start, { crew: P.runner }));
    S.rock = plan.rock; S.calls = []; S.feedCalls = []; S.feed = false; S.mover = P.runner; S.moverObj = runner;
    S.startList = ready;
    const fixes = [].concat(...ss.filter((x) => x.fix && x.fix.length).map((x) => x.fix));
    if (fixes.length) S.calls = fixes.map((f) => ({ from: f.from, to: f.to, items: f.items }));
    // Colour coding (Mark, 23 Nov – TEST ONLY, ?beta=1): each status its own colour, game palette (theme.js, as used
    // elsewhere on the site): done green, ready bright green, running blue, to collect yellow, waiting orange (no free
    // building) or grey (waiting on an earlier step). Summary boxes match.
    const wGL = (path, t) => (window.GL && window.GL.on() ? window.GL(path, t) : ' <a href="https://game.influenceth.io' + path + '" target="influencegame" rel="noopener" style="color:var(--cyan)" title="' + esc(t) + '">in game ↗</a>');
    const wLink = (x) => { if ((x.s !== 'wait') || !x.wb || x.start) return ''; const wb = byId(x.wb); return wb ? '<br><span class="src">🏭 ' + esc(k.nm(wb)) + '</span>' + wGL('/building/' + wb.id, 'Open ' + k.nm(wb) + ' in the game') : ''; };
    // CLB (Mark, 24 Nov – LIVE 24 Nov): "finished – collect it in the game" gets the same in-game link to the
    // building to collect from, on the row and on the "to collect" box.
    const cLink = (x) => { if ((x.s !== 'collect') || !x.colB) return ''; const cb = byId(x.colB); return cb ? '<br><span class="src">🏭 ' + esc(k.nm(cb)) + '</span>' + wGL('/building/' + cb.id, 'Open ' + k.nm(cb) + ' in the game to collect it') : ''; };
    const firstC = ss.find((x) => x.s === 'collect' && x.colB && byId(x.colB));
    const firstW = ss.find((x) => x.s === 'wait' && x.wb && !x.start);
    const COL = { done: '#88e675', ready: '#57ff65', run: '#57d5ff', collect: '#ffd94f', wait: '#ff8c1a', waitStep: '#8a96aa' };
    const colOf = (x) => x.s === 'wait' && !/^no free/.test(x.why || '') ? COL.waitStep : COL[x.s];
    const sumBox = (n, lab, c) => `<div style="border-color:${c};box-shadow:0 0 0 1px ${c}55 inset"><b style="color:${n ? c : '#5c6573'}">${n}</b>${lab}</div>`;
    let h = `<div class="card"><h2><span class="n">📋</span>${esc(k.pname(plan.p))} ${k.amt(plan.p, plan.qty)} on ${esc(plan.rock)}</h2>` +
      `<div class="row"><button type="button" class="dk-shipbtn" id="pp-back" style="cursor:pointer">← All plans / new plan</button><span class="src">Planned ${esc(whenTxt(plan.made / 1000))} · materials in ${esc(byId(plan.mat) ? k.nm(byId(plan.mat)) : '?')}</span></div>` +
      (`<div class="dkp-sum" style="margin-top:10px">${sumBox(t.done, 'done', COL.done)}${sumBox(t.run, 'running', COL.run)}${firstC ? sumBox(t.col, 'to collect' + wGL('/building/' + firstC.colB, 'Open ' + k.nm(byId(firstC.colB)) + ' in the game to collect it'), COL.collect) : sumBox(t.col, 'to collect', COL.collect)}${sumBox(t.ready, 'ready now', COL.ready)}${firstW && byId(firstW.wb) ? sumBox(t.wait, 'waiting' + wGL('/building/' + firstW.wb, 'Open ' + k.nm(byId(firstW.wb)) + ' in the game'), COL.wait) : sumBox(t.wait, 'waiting', COL.wait)}</div>`) +
      `<table style="margin-top:10px"><thead><tr><th>#</th><th>Process</th><th>Makes</th><th class="num">Runs</th><th>Status</th></tr></thead><tbody>` +
      ss.map((x) => {
        const st = x.st, b = x.start && x.start.b;
        const cap = x.start && x.start.capTxt ? '<br><span class="src">⏱ ' + esc(x.start.capTxt) + '</span>' : '';
        const extra = x.s === 'run' ? ' · finishes ' + esc(whenTxt(x.runningFin)) : x.s === 'ready' ? ' · ' + esc(k.nm(b)) + cap : '';
        const more = x.start && x.s !== 'ready' ? '<br><span class="ok">▶ ' + esc(x.why) + ' in ' + esc(k.nm(b)) + '</span>' + cap : '';
        const tick = x.start ? `<input type="checkbox" data-pick="${plan.id}:${x.i}"${pick(x.i) ? ' checked' : ''} title="Start this one" style="margin:0 6px 0 0">` : '';
        const c = colOf(x), rs = ` style="box-shadow:inset 4px 0 0 ${c}"`, ss2 = ` style="color:${c}"`;
        const icon = `<b style="color:${c};font-weight:600">${{ done: '✓ done', run: '⚙ running', collect: '✓ finished – collect it in the game', ready: '▶ ready to start', wait: '⏳ waiting' }[x.s] || ''}</b>`;
        return `<tr${rs}><td>${tick}${x.i + 1}</td><td>${esc(st.name)}</td><td>${esc(k.pname(st.p))}</td><td class="num">${st.runs.toLocaleString('en-GB')}${x.left && x.left < st.runs ? '<br><span class="src">' + x.left.toLocaleString('en-GB') + ' left</span>' : ''}</td><td>${icon}<span${ss2}>${extra}</span>${more || (x.why ? '<br><span class="src"' + ss2 + '>' + esc(x.why) + '</span>' : '')}${wLink(x)}${cLink(x)}</td></tr>`;
      }).join('') + '</tbody></table>' +
      ((t.ready > 1) ? '<div class="hint">Tick the ready processes you want to start – only those go in the approval.</div>' : '') +
      (t.col ? '<div class="hint" style="color:var(--amber)">Finished processes must be collected in the game before their outputs can be used and the building is free.</div>' : '') + '</div>';
    // 🚚 the moves for this plan, with in-game links to finish them (Mark, 14 Nov – TEST ONLY, ?beta=1): processes sat
    // "waiting for stock" and there was no quick way to the crew that sent the moves. Deliveries into the materials
    // warehouse that aren't finished yet; the crew that sent them is saved on the plan from now on (older plans
    // just get the warehouse link – any crew can finish a delivery there).
    {
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
      (fixes.length ? `<div class="src" style="margin-top:8px">🚚 Move to where the plan needs it:<br>${fixes.map((f) => '• ' + f.items.map(([p2, a2]) => esc(k.pname(p2)) + ' ' + k.amt(p2, a2)).join(', ') + ' from <b>' + esc(f.fromName) + '</b> → <b>' + esc(f.toName) + '</b>').join('<br>')}</div>` : '') +
      `<button class="approve" id="pp-tgo" style="margin-top:10px"${(ready.length || fixes.length) && runner && !S.busy ? '' : ' disabled style="opacity:.5;cursor:not-allowed"'}>${S.busy ? 'WAITING FOR YOUR WALLET…' : ready.length || fixes.length ? 'APPROVE IN WALLET (' + [fixes.length ? 'move ' + fixes.length : '', ready.length ? 'start ' + ready.length : ''].filter(Boolean).join(' · ') + ')' : 'NOTHING READY TO START YET'}</button>` +
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
    const illMine = new Set(mineGet());
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
        if (k.canMine(p) || illMine.has(p)) { mine[p] = (mine[p] || 0) + q; return; }
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
  // 🗄 Storage Management (Mark, 14 Nov – TEST ONLY, ?beta=1): pick what's in storage on a rock and send it to one of its warehouses / tank farms
  // ⛏ "No, don't do that – I'll mine it" (Mark, 14 Nov – TEST ONLY, ?beta=1): when the plan makes a raw resource
  // (e.g. Sulfur Dioxide from Sulfuric Acid), the player can say they'll mine it instead. The planner then puts it on
  // the mine list rather than making it. Remembered in this browser; "make it again" undoes it.
  const IMB = /[?&]beta=1\b/.test(location.search);
  const MKEY = 'sk_prod_illmine';
  function mineGet() { if (!IMB) return []; try { return JSON.parse(localStorage.getItem(MKEY) || '[]'); } catch (e) { return []; } }
  function minePut(a) { try { localStorage.setItem(MKEY, JSON.stringify(a)); } catch (e) {} }
  function illMineHTML() {
    const n = mineGet(), k = K();
    if (!n.length) return '';
    return '<div class="hint">⛏ You’ll mine these, not make them: ' +
      n.map((p) => `${k.esc(k.pname(p))} <button type="button" class="dk-shipbtn" data-mkagain="${p}" style="cursor:pointer;padding:1px 6px">make it again</button>`).join(' · ') + '</div>';
  }
  // EXF (Mark 21 Nov 2026 – LIVE): Export for production step 4 gets a button to spread what's collected over
  // several ships – it hands the pick-up rock and the amounts to 🚀 Load a fleet, with every ship parked there ticked.
  // MRG (Mark, 26 Nov 2026 – TEST ONLY ?beta=1): Export for production and Load one ship merged – one flow: rock → ship →
  // what to put on it, with an optional "Fill it for something to make" that works out what the rock you'll make it on
  // is missing and fills the amounts in from this rock's storage. The Export for production button goes.
  const MRG = true; // LIVE 26 Nov 2026 (tested on ?beta=1 – Mark)
  const FLEETFB = /[?&]beta=1\b/.test(location.search); // ⛽ Fuel a fleet – TEST ONLY (?beta=1), Mark 27 Nov 2026: vendor/fleetfuel.js
  const FUELB = true; // ⛽ Fuel a ship – LIVE 26 Nov 2026 (tested on ?beta=1 – Mark)
  // ⛽ Make propellant straight into a ship's tank (Mark, 26 Nov – TEST ONLY ?beta=1): "the game does that – it's too hard to
  // work out how much to make, and if you make too much the refinery won't let you start". Step 5 gets a "Ship's tank" choice
  // for Hydrogen Propellant when a ship is parked on the rock: the last process outputs into the ship's propellant slot
  // (ProcessProductsStart destination [6, shipId, 1]) and makes no more than the room left in the tank.
  const TANKG = { 1: 2e8, 2: 4e9, 3: 24e9, 4: 2e9 }; // grams of propellant a full tank holds (SDK 2.8.1 Ship.TYPES)
  function fuelShips() {
    const k = K(), d = k.D() || {}, Y = window.YIC || {};
    const an = (id) => { const a = (Y.asts || []).find((x) => x.id === id) || (d.owned || []).find((x) => x.id === id); return a ? (a.name || (a.Name && a.Name.name)) : ''; };
    return (d.ships || []).filter((s) => TANKG[s.st] && s.sst === 'd' && s.lot && an(s.dId) === k.S.rock);
  }
  const tankRoom = (s) => Math.max(0, Math.floor((TANKG[s.st] - (s.prop || 0) * 1e6) / (K().grams(170) || 1000))); // in units of propellant
  const shipTo = () => { if (!FUELB || P.p !== 170 || P.for !== 'ship') return null; const l = fuelShips(); return l.find((s) => s.id === P.fship) || l[0] || null; };
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
    // materials in a TANK FARM when everything gathered there can go in one (Mark, 26 Nov: 23,000 t of Hydrogen for
    // propellant is 4× a whole warehouse by space – 'inventory volume exceeded'; a tank farm holds 13× the space)
    const matTF = FUELB && W && W.steps && W.steps.length && W.steps.every((st) => Object.keys(st.r.inp).every((ip) => k.TANKOK.has(+ip)) && (st === W.steps[W.steps.length - 1] || Object.keys(st.r.out).every((o) => k.TANKOK.has(+o)))) ? tf : [];
    const matL = wh.concat(matTF);
    let mat = pick('mat', /material|input|stag|process/i, matL, (most || [roomy])[0] && (most || [roomy])[0].id);
    // ⛽ fuel processing store (Mark, 26 Nov – TEST ONLY ?beta=1): "There is a fuel processing tank farm" – the propellant
    // process takes its inputs from there. Guessed from the name, else none; the player picks it in step 5.
    const fuel = FUELB ? (ok(saved.fuel, wh.concat(tf)) ? saved.fuel : saved.fuel === '' ? '' : ((tf.concat(wh)).find((b) => /fuel|propel/i.test(k.nm(b))) || {}).id || '') : '';
    return { wh, tf, full, matL, mat, fuel, stock: pick('stock', /stock|store/i, wh, mat), market: pick('market', /market|distrib|sell|trade|export/i, wh, mat), build: pick('build', /build|construct|site/i, wh, mat), tank: ok(saved.tank, tf) ? saved.tank : '' };
  }
  // ---------- steps 8–9: moves into the materials warehouse, crew, start what can start, approve ----------
  // Sent through the hub's own approve() (vendor/dock.js – same checks, batches and wallet path as before):
  // S.calls = deliveries, S.startList = process starts.
  // moves: what the plan takes from storage, gathered into the materials warehouse (nearest storage first)
  function calcMoves(W, ST, mat) {
    const k = K(), stores = ST.wh.concat(ST.tf), km = (a, b) => k.kmBetween(k.lotOf(a), k.lotOf(b)), mat0 = mat;
    const have = (b, p) => ((k.inv(b) || { contents: [] }).contents || []).filter((c) => c.product === p).reduce((t, c) => t + c.amount, 0);
    const dl = {}, short = [];
    const used = {}; // how much of each store's stock is already spoken for (a split input is moved from the same stores twice)
    const take = (b, p) => have(b, p) - (used[b.id + '|' + p] || 0);
    Object.keys(W.stock).forEach((p) => {
      p = +p;
      const fb = W.split && W.split[p] != null && ST.fuel ? ST.wh.concat(ST.tf).find((b) => b.id === +ST.fuel) : null;
      const parts = fb ? [[fb, W.split[p]], [mat0, W.stock[p] - W.split[p]]] : [[(W.dest && W.dest[p]) || mat0, W.stock[p]]]; // where this input is used (materials warehouse or fuel processing store)
      let shortP = false;
      parts.forEach(([mat, need]) => {
        if (need <= 0) return;
        const inMat = Math.max(0, Math.min(need, k.holds(mat, p) - (used[mat.id + '|' + p] || 0))); used[mat.id + '|' + p] = (used[mat.id + '|' + p] || 0) + inMat;
        let left = need - inMat;
        stores.filter((b) => b.id !== mat.id && take(b, p) > 0).sort((a, b) => (km(a, mat) ?? 1e9) - (km(b, mat) ?? 1e9)).forEach((b) => {
          if (left <= 0) return; const q = Math.min(left, take(b, p)); left -= q; used[b.id + '|' + p] = (used[b.id + '|' + p] || 0) + q;
          (dl[b.id + '>' + mat.id] = dl[b.id + '>' + mat.id] || { from: b.id, to: mat.id, b, tb: mat, items: [] }).items.push([p, q]);
        });
        if (left > 0) shortP = true;
      });
      if (shortP) short.push(p);
    });
    return { moves: Object.values(dl), short };
  }
  // how full each storage will be once the whole plan is done (Mark, 9 Nov): moves in/out, mined + flown-in goods
  // into the materials warehouse, every input used from it, in-between outputs back into it, finished goods to their store.
  // End state, by weight or space (whichever is fuller); by-products counted in full.
  // how full the materials store gets while the inputs are gathered (all moves arrived, nothing used yet) – the game
  // refuses a move that won't fit ('inventory volume exceeded'), and the whole approval fails with it (Mark, 26 Nov)
  function peakMat(W, ST, byId, b) {
    const k = K(), MV = k.mv(), mat = byId(ST.mat); b = b || mat; if (!mat || !b) return 0;
    const i = k.inv(b) || { mass: 0, volume: 0 }, c = b.Building.buildingType === k.TANK ? [75e9, 997.5e9] : [1.5e12, 75e9];
    let g = i.mass + (i.reservedMass || 0), v = i.volume + (i.reservedVolume || 0);
    calcMoves(W, ST, mat).moves.filter((mv) => (mv.tb || mat).id === b.id).forEach((mv) => mv.items.forEach(([p, a]) => { const x = MV[p] || [1000, 1000]; g += a * x[0]; v += a * x[1]; }));
    return Math.round(Math.max(g / c[0], v / c[1]) * 100);
  }
  function fullAfter(W, ST, byId) {
    const k = K(), MV = k.mv(), mat = byId(ST.mat), d = {};
    const add = (b, p, n) => { if (!b || !n || b.ship) return; const v = MV[p] || [1000, 1000]; const x = (d[b.id] = d[b.id] || [0, 0]); x[0] += n * v[0]; x[1] += n * v[1]; };
    if (mat) {
      calcMoves(W, ST, mat).moves.forEach((mv) => mv.items.forEach(([p, a]) => { add(mv.b, p, -a); add(mv.tb || mat, p, a); }));
      Object.keys(W.mine).forEach((p) => add(mat, +p, W.mine[p]));
      Object.keys(W.fly).forEach((p) => add(mat, +p, W.fly[p]));
    }
    W.steps.forEach((st) => {
      Object.keys(st.r.inp).forEach((ip) => add(st.from || mat, +ip, -st.r.inp[ip] * st.runs));
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
    const moveSecs = (c) => moves.reduce((t, x) => t + (k.tripSecs(km(x.b, x.tb || mat), c) || 0), 0);
    const byM = cl.slice().sort((a, b) => (!!a.busy - !!b.busy) || moveSecs(a) - moveSecs(b) || b.free - a.free || b.speed - a.speed);
    if (!P.moverSet || !cl.find((c) => c.id === S.mover)) S.mover = (byM[0] || {}).id || 0;
    const byP = cl.slice().sort((a, b) => (!!a.busy - !!b.busy) || pBonus(b) - pBonus(a));
    if (!cl.find((c) => c.id === P.runner)) P.runner = (byP[0] || {}).id || 0;
    const crew = cl.find((c) => c.id === S.mover), runner = cl.find((c) => c.id === P.runner);
    S.moverObj = crew;
    // starts: in order, each process whose inputs are ALREADY in the materials warehouse (deliveries have to be
    // finished first) and that has a free building of its type
    const pools = {}, poolOf = (b) => { if (!pools[b.id]) { const q = pools[b.id] = {}; ((k.inv(b) || { contents: [] }).contents || []).forEach((c) => { q[c.product] = (q[c.product] || 0) + c.amount; }); } return pools[b.id]; };
    const used = new Set(), ready = [], wait = [];
    W.steps.forEach((st, i) => {
      const org = st.from || mat, pool = poolOf(org); // its inputs come from its own store (materials warehouse or fuel processing store)
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
      ready.push({ i, b, slot: k.freeSlot(b), r: st.r, p: st.p, runs: one.runs, capTxt: one.capTxt, from: org, to: st.to, crew: P.runner || S.mover });
    });
    S.calls = moves.map((x) => ({ from: x.from, to: x.to, items: x.items }));
    S.startList = P.start ? ready : [];
    // feed the crews first (Mark, 9 Nov) – same amount and source as the hub's crew step: a year's food at most,
    // from the biggest Food stock on this rock (shared out); goes first in the same approval (dock.js buildCalls S.feedCalls)
    const food = {}; k.onRock().filter(k.isStore).forEach((b) => { food[b.id] = ((k.inv(b) || { contents: [] }).contents || []).reduce((t, c) => t + (c.product === 129 ? c.amount : 0), 0); });
    const feedOne = (c, key) => {
      if (!c || c.food >= 0.95) return '';
      const need = Math.max(0, c.mates * 1000 - Math.ceil(c.mates * 1000 * c.food)); /* game's limit: max food - current food (as crewfeed.js; over it = E6030 food limit reached) */
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
    const multi = moves.some((x) => x.tb && x.tb.id !== mat.id); // some go to the fuel processing store (26 Nov)
    let h = `<div class="card"><h2><span class="n">6</span>${multi ? 'Moves' : 'Moves into ' + esc(k.nm(mat))} (${moves.length})</h2>` +
      (moves.length ? `<table><thead><tr><th>From</th>${multi ? '<th>To</th>' : ''}<th>Goods</th><th class="num">Trip</th></tr></thead><tbody>${moves.map((x) => { const d = km(x.b, x.tb || mat); return `<tr><td>${esc(k.nm(x.b))}</td>${multi ? `<td>${esc(k.nm(x.tb || mat))}</td>` : ''}<td>${x.items.map(([p, a]) => esc(k.pname(p)) + ' ' + k.amt(p, a)).join('<br>')}</td><td class="num">${d == null ? '' : k.kmTxt(d) + ' · ' + k.tripTxt(k.tripSecs(d, crew))}</td></tr>`; }).join('')}</tbody></table>`
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
    const can = !S.busy && tot && crew && !(P.peakBad && S.calls.length); // moves that won't fit would fail the whole approval (26 Nov)
    h += `<div class="card"><h2><span class="n">9</span>Approve</h2><button class="approve" id="pp-go"${can ? '' : ' disabled style="opacity:.5;cursor:not-allowed"'}>${S.busy ? 'WAITING FOR YOUR WALLET…' : 'APPROVE IN WALLET (' + (feeds.length ? 'feed ' + feeds.length + ' crew' + (feeds.length > 1 ? 's' : '') + ' + ' : '') + S.calls.length + ' move' + (S.calls.length === 1 ? '' : 's') + (S.startList.length ? ' + start ' + S.startList.length : '') + ')'}</button>` +
      (P.peakBad && S.calls.length ? '<div class="hint" style="color:#ff4d4d">✗ The materials store would overflow while the inputs are gathered – see step 5.</div>' : '') +
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
  // ⛽ fuel gauge for ships (Mark, 23 Nov – TEST ONLY, ?beta=1): propellant now vs a full tank (4,000 t Light, 24,000 t
  // Heavy – same as Travel). Bar colours from the game palette: green over half, yellow a quarter to half, red under.
  const TANK = { 2: 4000, 3: 24000 };
  const fuelPc = (s) => TANK[s.st] ? Math.max(0, Math.min(1, (s.prop || 0) / TANK[s.st])) : 0;
  const fuelTxt = (s) => TANK[s.st] ? ` · ⛽ ${Math.round(fuelPc(s) * 100)}%` : '';
  const fuelBar = (s) => {
    if (!s || !TANK[s.st]) return '';
    const f = fuelPc(s), c = f > 0.5 ? '#57ff65' : f >= 0.25 ? '#ffd94f' : '#e0282e';
    return `<span title="Propellant" style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap"><span class="src">⛽</span><span style="display:inline-block;width:110px;height:10px;border:1px solid ${c};border-radius:3px;background:rgba(0,0,0,.4);overflow:hidden"><span style="display:block;height:100%;width:${(f * 100).toFixed(1)}%;background:${c}"></span></span><span style="color:${c}">${Math.round(f * 100)}%</span><span class="src">${Math.round(s.prop || 0).toLocaleString('en-GB')} t of ${TANK[s.st].toLocaleString('en-GB')} t</span></span>`;
  };
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
    // TEST ONLY (?beta=1): every other rock of yours, and what one rock alone can give (not just what's left after quicker rocks)
    const allR = [...new Set(k.allB().filter(k.isStore).map(k.rockOf).filter(Boolean))].filter((r) => r !== dest);
    const mkX = (r) => { const got = {}; let G = 0, V = 0; Object.keys(items).forEach((p) => { const n = Math.min(items[p], rockHas(r, p)); if (n > 0) { got[p] = n; G += n * g(p); V += n * v(p); } }); return { r, ast: k.astId(r), got, G, V }; };
    if (!allR.includes(C.qr)) C.qr = pk.length ? pk[0].r : (allR[0] || '');
    // the load list for ship s on rock X.r: storage → ship, item by item, crew, approve (Mark, 9 Nov)
    function loadHTML(X, s, trips) {
      let o = '';
      const cl = k.crews(X.r);
      if (!cl.find((c) => c.id === S.mover)) S.mover = (cl.find((c) => !c.busy) || cl[0] || {}).id || 0;
      S.moverObj = cl.find((c) => c.id === S.mover);
      let fg = (s.capM - s.useM) * 0.995, fv = (s.capV - s.useV) * 0.995; const mv = {};
      Object.keys(X.got).sort((a, b) => X.got[b] * v(b) - X.got[a] * v(a)).forEach((p) => {
        let n = Math.min(X.got[p], Math.floor(fg / g(p)), Math.floor(fv / v(p))); if (n <= 0) return;
        fg -= n * g(p); fv -= n * v(p);
        stores(X.r).map((b) => [b, have(b, p), k.kmBetween(k.lotOf(b), s.lot, X.ast) ?? 1e9]).filter((z) => z[1] > 0).sort((a, b) => a[2] - b[2]).forEach(([b, hv]) => {
          if (n <= 0) return; const q = Math.min(n, hv); n -= q; (mv[b.id] = mv[b.id] || { b, items: [] }).items.push([+p, q]);
        });
      });
      S.calls = Object.keys(mv).map((id) => ({ from: +id, to: s.id, ship: true, slot: 2, items: mv[id].items }));
      const lg = S.calls.reduce((t, c) => t + c.items.reduce((u, [p, a]) => u + a * g(p), 0), 0);
      if (!S.calls.length) return `<div class="src" style="margin-top:8px;color:var(--amber)">⚠ Nothing fits – ${esc(s.name)} is full (${k.tonnes(s.useM / 1000)} on board${s.carry ? ', ' + esc(s.carry) : ''}). Unload it in the game first, or pick another ship.</div>`;
      o += `<div class="src" style="margin-top:10px">These moves put <b>${k.tonnes(lg / 1000)}</b> from your storage on ${esc(X.r)} into ${esc(s.name)}${trips > 1 ? ` – that’s <b>trip 1 of ${trips}</b>, it won’t all fit in one go` : ''}:</div>` +
        `<div style="margin:6px 0 0 4px;padding-left:12px;border-left:2px solid #ffb03b55">` + Object.keys(mv).map((id) => `<div style="margin:6px 0"><b>${esc(k.nm(mv[id].b))}</b> → 🚀 ${esc(s.name)}` +
          mv[id].items.map(([p, a]) => `<div class="src" style="margin-left:16px">└ ${esc(k.pname(p))} <b>${k.amt(p, a)}</b></div>`).join('') + '</div>').join('') + '</div>' +
        (cl.length ? `<div class="row" style="margin-top:6px"><span class="src">Crew doing the loading</span><select id="pp-ccrew">${cl.map((c) => `<option value="${c.id}"${c.id === S.mover ? ' selected' : ''}>${esc(c.name)}${c.busy ? ' – busy until ' + esc(c.busy) : ' – ready'}</option>`).join('')}</select></div>` : `<div class="src" style="color:var(--red)">No crew on ${esc(X.r)} to do the loading.</div>`) +
        `<button class="approve" id="pp-cgo" style="margin-top:10px"${S.calls.length && cl.length && !S.busy ? '' : ' disabled'}>${S.busy ? 'WAITING FOR YOUR WALLET…' : 'APPROVE IN WALLET (load ' + esc(s.name) + ')'}</button>` +
        `<div class="hint">Your wallet will ask you to approve these moves. Nothing happens in the game until you do.</div>` +
        `<div id="dk-msg" class="hint" style="display:${S.msg ? 'block' : 'none'};margin-top:10px;padding:10px 12px;border-radius:8px;border:1px solid ${S.msgErr ? '#ff4d4d88' : '#8fe3ff55'};color:${S.msgErr ? '#ffb3ae' : 'var(--ink)'}">${S.msg || ''}</div>`;
      return o;
    }
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
        const full = (s.capM - s.useM) < s.capM * 0.01 || (s.capV - s.useV) < s.capV * 0.01;
        return { s, there, trips, away, refuel: f && f.refuel, done, full };
      }).sort((a, b) => (a.full - b.full) || (a.done ?? 1e9) - (b.done ?? 1e9) || (b.there - a.there));
      x.opts = opts;
      // Mark (13 Nov, TEST ONLY ?beta=1): the ship was picked before the flight times were worked out and then kept –
      // now the best ship is picked again as the times come in, until you pick one yourself; when it changes, a warning
      // says so. If you picked one and a quicker one turns up, it says that instead.
      if (opts[0]) {
        const was = C.pick[x.r], top = opts[0];
        if (!C.mine[x.r]) { if (was && was !== top.s.id && top.done != null) C.chg[x.r] = was; C.pick[x.r] = top.s.id; }
        else if (!opts.find((o) => o.s.id === was)) { C.pick[x.r] = top.s.id; C.mine[x.r] = false; }
        const cur = opts.find((o) => o.s.id === C.pick[x.r]);
        x.warn = C.mine[x.r] && cur && top !== cur && top.done != null && cur.done != null && cur.done - top.done > 0.5 ? 'quicker: ' + top.s.name + ' – all done in ' + hrsTxt(top.done)
          : C.chg[x.r] ? 'ship changed to ' + (cur ? cur.s.name : '?') + ' now the flight times are worked out – check it’s the one you want' : '';
      } else if (!opts.find((o) => o.s.id === (C.pick[x.r] || 0))) C.pick[x.r] = opts[0] ? opts[0].s.id : 0;
      x.best = opts.find((o) => o.s.id === C.pick[x.r]);
    });
    let h = `<div class="card"><h2><span class="n">🚀</span>Where to collect it from</h2><div class="src" style="margin-bottom:8px">Your other rocks that have what ${esc(dest)} is missing – quickest flight first. Each card shows the ship there (or the nearest one), how many trips, and how long it all takes. Click a rock to load from it in step 4.</div>`;
    if (!pk.length) { el.innerHTML = h + '<div class="src" style="color:var(--amber)">None of your other rocks has any of it in stock – it all has to be bought or mined.</div></div>'; return; }
    // short = not ENOUGH in stock on your other rocks (Mark, 9 Nov: "3 items not on any of your rocks? That can't be right"
    // – they were partly in stock). Says how much is short and which of your rocks has the buildings to make it.
    const R = k.recipes(), types = {};
    k.allB().forEach((b) => { const r = k.rockOf(b); if (r && r !== dest) (types[r] = types[r] || new Set()).add(b.Building.buildingType); });
    const makers = (p) => Object.keys(types).filter((r) => R.some((x) => x.out[p] && !/Unbundling/.test(x.name) && types[r].has(k.FBT[x.type])));
    h += `<div class="src" style="font-size:1.1em;margin-bottom:8px">You need to fly in from <b>${pk.length} rock${pk.length === 1 ? '' : 's'}</b>.${''}</div>` +
      (short.length ? `<div class="src" style="margin-bottom:10px"><span class="short">Not enough in stock on your rocks:</span>` + short.map((p) => { const mk = makers(+p); return `<div style="margin-top:3px">• <b>${esc(k.pname(+p))}</b> – short by ${k.amt(+p, left[p])}${mk.length ? ' · <span class="ok">can be made on ' + mk.map(esc).join(', ') + '</span>' : ' · buy it or mine it'}</div>`; }).join('') + '</div>' : '');
    h += pk.map((x) => {
      const b = x.best, sel = x.r === (C.qr);
      const shipLine = !b ? `<span style="color:var(--amber)">${shipsTxt || 'No ship can get there.'}</span>`
        : b.there ? `🚀 <b>${esc(b.s.name)}</b> is there · ${SHIPT[b.s.st]}${b.full ? ' <span style="color:var(--amber)">(full – unload it first)</span>' : ''}`
          : `🚀 Nearest: <b>${esc(b.s.name)}</b> · ${b.s.sst === 'f' ? 'flying to ' : 'at '}${esc(astName(b.s.dId))} · ${b.away == null ? '…' : hrsTxt(b.away) + ' away'}${b.refuel ? ' <span style="color:var(--amber)">(refuel first)</span>' : ''}`;
      return `<div class="dkp-t${sel ? ' fin' : ''}" data-src="${esc(x.r)}" style="cursor:pointer;margin-bottom:8px;display:block">
<div class="dkp-n">${esc(x.r)} <span class="src" style="font-weight:400">· ${k.tonnes(x.G / 1000)} · ${hrsTxt(rt(x.r) < 1e6 ? rt(x.r) : null)} flight to ${esc(dest)}</span></div>
<div class="src" style="margin-top:4px">${shipLine}${b ? ' · ' + b.trips + ' trip' + (b.trips === 1 ? '' : 's') + ' · all done in <b>' + hrsTxt(b.done) + '</b>' : ''}</div>${x.warn ? `<div class="src" style="margin-top:4px;color:var(--amber)">⚠ ${esc(x.warn)}</div>` : ''}${b ? (b.there && b.full ? `<div class="src" style="margin-top:8px;color:var(--amber)">⚠ ${esc(b.s.name)} is full – unload it in the game first</div>` : b.there ? `<div style="margin-top:8px"><span class="dk-shipbtn" style="display:inline-block;padding:4px 12px;border-radius:8px;background:${sel ? '#ffb03b' : '#2a1d08'};color:${sel ? '#1a1000' : '#ffd28a'};border:1px solid #ffb03b;font-weight:700">📦 ${sel ? ('Picked in step 4 ↑') : 'Click to load ' + esc(b.s.name) + ' now'}</span></div>` : `<div class="src" style="margin-top:8px;color:var(--dim)">✈ No ship here yet – fly one here in the game first</div>`) : ''}
<div class="dkp-s" style="margin-top:4px">${Object.keys(x.got).sort((p1, p2) => x.got[p2] * g(p2) - x.got[p1] * g(p1)).map((p) => esc(k.pname(+p))).slice(0, 6).join(', ')}${Object.keys(x.got).length > 6 ? ' and ' + (Object.keys(x.got).length - 6) + ' more' : ''}</div></div>`;
    }).join('');
    // folded details: by material, and what to buy
    h += `<details class="dkp-fold"><summary>Details – by material</summary><table><thead><tr><th>Material</th><th class="num">Need</th><th>From</th><th>Short</th></tr></thead><tbody>` +
      Object.keys(items).sort((a, b) => items[b] * g(b) - items[a] * g(a)).map((p) => `<tr><td>${esc(k.pname(+p))}</td><td class="num">${k.amt(+p, items[p])}</td><td class="src">${pk.filter((x) => x.got[p]).map((x) => k.amt(+p, x.got[p]) + ' ' + esc(x.r)).join('<br>') || '–'}</td><td>${left[p] > 0 ? '<span class="short">' + k.amt(+p, left[p]) + '</span>' + (window.YICSRCTXT ? '<div class="hint" style="margin:2px 0 0">' + (window.YICSRCTXT(+p, left[p], k.astId(dest)) || '') + '</div>' : '') : '<span class="ok">✓</span>'}</td></tr>`).join('') + '</tbody></table></details>';
    let Q = '';
    {
      // Mark (14 Nov, TEST ONLY ?beta=1): "I need to put stuff to make X into ship Y on asteroid Z" – X is step 2 at the
      // top, Z the pick-up rock, Y a ship parked there. Clicking a rock card below fills it in.
      const at = (r) => ships.filter((s) => s.sst === 'd' && s.dId === k.astId(r));
      const room = (s) => Math.min((s.capM - s.useM) / s.capM, (s.capV - s.useV) / s.capV);
      const there = at(C.qr);
      if (!there.find((s) => s.id === C.qs)) C.qs = (there.slice().sort((a, b) => room(b) - room(a))[0] || {}).id || 0;
      const what = P.p && P.shipQty ? k.amt(P.p, P.shipQty) + ' ' + esc(k.pname(P.p)) : 'it';
      Q = `<div class="card" id="pp-qcard"><h2><span class="n">4</span>Load a ship</h2>` +
        `<div class="src" style="margin-bottom:8px">Put what <b>${esc(dest)}</b> is missing to make <b>${what}</b> into one of your ships. Pick the asteroid to collect it from, then a ship that is parked there.</div>` +
        `<div class="row"><span class="src">From asteroid</span><select id="pp-qrock">${allR.map((r) => { const pc = Math.round(share(r) * 100), n = at(r).length; return `<option value="${esc(r)}"${r === C.qr ? ' selected' : ''}>${esc(r)} · has ${pc ? pc + '% of it' : 'none of it'} · ${n ? n + ' ship' + (n === 1 ? '' : 's') + ' there' : 'no ship there'}</option>`; }).join('')}</select>` +
        `<span class="src">into ship</span>${there.length ? `<select id="pp-qship">${there.map((s) => `<option value="${s.id}"${s.id === C.qs ? ' selected' : ''}>${esc(s.name)} · ${SHIPT[s.st]} · ${Math.max(0, Math.round(room(s) * 100))}% space free${fuelTxt(s)}</option>`).join('')}</select>${fuelBar(there.find((z) => z.id === C.qs))}` : `<span style="color:var(--amber)">no ship parked there</span>`}</div>`;
      const X = mkX(C.qr), qs = there.find((z) => z.id === C.qs);
      S.calls = []; S.startList = []; S.feed = false; S.srcRock = C.qr;
      if (!X.G) Q += `<div class="src" style="margin-top:8px;color:var(--amber)">${esc(C.qr)} has none of what ${esc(dest)} needs – pick another asteroid.</div>`;
      else if (!qs) Q += `<div class="src" style="margin-top:8px;color:var(--amber)">✈ No ship is parked at ${esc(C.qr)}. Fly one there in the game first, then come back here to load it.</div>`;
      else Q += loadHTML(X, qs, Math.max(1, Math.ceil(Math.max(X.G / (qs.capM * 0.995), X.V / (qs.capV * 0.995)))));
      if (X.G && there.length > 1) {
        Q += `<div class="row" style="margin-top:10px"><button type="button" class="dk-shipbtn" id="pp-qfleet" style="cursor:pointer;padding:5px 12px;border:1px solid #ffb03b;color:#ffd28a">🚀 Spread it over ${there.length} ships here instead</button>` +
          `<span class="src">opens Load a fleet with this load and every ship parked at ${esc(C.qr)} ticked</span></div>`;
        C.qfleet = () => {
          P.cmode = 'fleet'; P.sr = C.qr; P.ss = 0; P.sq = {}; P.fl = there.map((s) => s.id);
          Object.keys(X.got).forEach((p) => { const n = X.got[p]; if (k.bulk(+p)) { const u = n >= 1e6 ? 'kt' : n >= 1000 ? 't' : 'kg'; P.sq[p] = { q: Math.floor(n / UNITS[u] * 1000) / 1000, unit: u }; } else P.sq[p] = { q: n }; });
          S.msg = ''; k.render();
        };
      }
      Q += `<div class="hint">This only loads the ship. You fly it to ${esc(dest)} and unload it in the game yourself.</div></div>`;
      h += `<div class="hint">Flight times: quickest route leaving now, loaded with a full tank; ships getting there with the propellant they have now. Light / Heavy Transports only.</div>`;
    }
    el.innerHTML = Q + h + '</div>';
    { const qf = el.querySelector('#pp-qfleet'); if (qf && C.qfleet) qf.addEventListener('click', C.qfleet); }
    el.querySelectorAll('[data-src]').forEach((r) => r.addEventListener('click', () => {
      { C.qr = r.dataset.src; C.qs = 0; k.render(); const q = document.getElementById('pp-qcard'); if (q) q.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    }));
    const qr = el.querySelector('#pp-qrock'); if (qr) qr.addEventListener('change', () => { C.qr = qr.value; C.qs = 0; k.render(); });
    const qsh = el.querySelector('#pp-qship'); if (qsh) qsh.addEventListener('change', () => { C.qs = +qsh.value; k.render(); });
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
      if (go.ship) { P.for = 'ship'; P.fship = go.ship; } // ⛽ from Fuel a ship: straight into its tank
      P.fto = go.to ? { p: go.p, id: go.to } : null; // from Fuel a ship (make a short input): the finished goods go into the refinery's inputs store
      if (k.bulk(P.p)) { const q = go.q || 100000; P.unit = q >= 1e6 ? 'kt' : q >= 1000 ? 't' : 'kg'; P.q = Math.ceil(q / UNITS[P.unit] * 1000) / 1000; } else P.q = go.q || 1;
    }
    if (!rl.includes(S.rock)) S.rock = rl[0];
    // Cargo bay, TEST ONLY (?beta=1): load for making something, or just pick what's in stock and put it on a ship (Mark, 14 Nov)
    // ⛽ Fuel a ship (Mark, 26 Nov – TEST ONLY ?beta=1): vendor/shipfuel.js
    if (cargo && FLEETFB && P.cmode === 'ffuel' && window.YICFLEETFUEL) {
      m.innerHTML = cmodeBar() + '<div id="ff-pg"></div>';
      m.querySelectorAll('[data-cmode]').forEach((b) => b.addEventListener('click', () => { P.cmode = b.dataset.cmode; S.msg = ''; k.render(); }));
      window.YICFLEETFUEL.render(m.querySelector('#ff-pg'));
      return;
    }
    if (cargo && FUELB && P.cmode === 'fuel') {
      m.innerHTML = cmodeBar() + '<div id="sf-pg"></div>';
      m.querySelectorAll('[data-cmode]').forEach((b) => b.addEventListener('click', () => { P.cmode = b.dataset.cmode; S.msg = ''; k.render(); }));
      window.YICFUEL.render(m.querySelector('#sf-pg'));
      return;
    }
    if (cargo && MRG && (!P.cmode || P.cmode === 'make')) P.cmode = 'stock';
    if (cargo && (P.cmode === 'stock' || (P.cmode === 'fleet'))) return stockPage(m);
    // step 10 (TEST ONLY): a saved plan open → show where it's up to; otherwise the list of plans goes above step 1
    P.snap = null;
    if (!cargo && P.track) { const pl = myPlans().find((x) => x.id === P.track); if (pl) return finish(m, trackHTML(pl)); P.track = ''; }
    const types = new Set(k.onRock().map((b) => b.Building.buildingType));
    const canHere = (p) => k.recipes().some((r) => r.out[p] && !/Unbundling/.test(r.name) && types.has(k.FBT[r.type]));
    const prods = products();
    const f = P.find.trim().toLowerCase();
    // search by input or process too (Mark, 13 Nov – TEST ONLY, ?beta=1): "Pyroxene" also finds what's made FROM it,
    // e.g. Sodium Chromate from Pyroxene Acid Leaching. via(p) = the matching process, shown on the button.
    const via = (p) => { if (!f || k.pname(p).toLowerCase().includes(f)) return null; return k.recipes().find((r) => r.out[p] && !/Unbundling/.test(r.name) && (r.name.toLowerCase().includes(f) || Object.keys(r.inp).some((ip) => k.pname(+ip).toLowerCase().includes(f)))) || null; };
    const hit = (p) => !f || k.pname(p).toLowerCase().includes(f) || !!via(p);
    // a new search clears the old pick if it no longer matches (Mark, 9 Nov: "it remembers the first search")
    if (P.p && !hit(P.p)) { P.p = 0; P.use = ''; }
    const shown = prods.filter(hit);
    const bulk = P.p ? k.bulk(P.p) : true;
    const fsh = !cargo && shipTo(), fRoom = fsh ? tankRoom(fsh) : 0;
    const qty = P.p ? Math.max(0, bulk ? Math.round((+P.q || 0) * UNITS[P.unit]) : Math.ceil(+P.q || 0)) : 0;

    let h = !cargo ? plansListHTML() : '';
    if (cargo) h += cmodeBar();
    h += `<div class="card"><h2><span class="n">1</span>${cargo ? 'Rock to make it on' : 'Rock'}</h2>${cargo ? '<div class="src" style="margin-bottom:8px">The rock where you’ll make it. The ship brings what this rock is missing here.</div>' : ''}<select id="pp-rock">${rl.map((r) => `<option${r === S.rock ? ' selected' : ''}>${esc(r)}</option>`).join('')}</select></div>`;
    h += `<div class="card"><h2><span class="n">2</span>What to make</h2>${cargo ? '<div class="src" style="margin-bottom:8px">What you want to make there, and how much. The page works out everything it needs and what that rock is short of.</div>' : ''}<div class="row">
<input type="search" id="pp-find" placeholder="${'🔍 Product, input or process…'}" value="${esc(P.find)}">
<select id="pp-p" style="flex:1 1 320px"><option value="0">${f ? shown.length + ' found – pick one' : '— pick what to make —'}</option>${shown.map((p) => `<option value="${p}"${p === P.p ? ' selected' : ''}>${esc(k.pname(p))}${canHere(p) ? '' : ' (can’t make on this rock)'}</option>`).join('')}</select></div>` +
      (f && !P.p ? `<div class="dkp-chips" style="margin-top:8px">${shown.slice(0, 40).map((p) => { const v = via(p); return `<button type="button" data-pp="${p}" class="dk-shipbtn" style="cursor:pointer"${v ? ` title="${esc(v.name)}"` : ''}>${esc(k.pname(p))}${v ? ` <span class="src" style="font-size:.85em">← ${esc(v.name)}</span>` : ''}</button>`; }).join('') || '<span class="src">Nothing matches.</span>'}</div>` : '') +
      (P.p ? `<div class="row" style="margin-top:10px"><span class="src">How much</span><input type="number" id="pp-q" min="0" step="any" value="${esc(P.q)}">` +
        (bulk ? `<select id="pp-u" style="min-width:0">${Object.keys(UNITS).map((u) => `<option${u === P.unit ? ' selected' : ''}>${u}</option>`).join('')}</select>` : ('<span class="src" style="display:inline-block;min-width:4.2em">units</span>')) +
        (`<button type="button" class="dk-shipbtn" id="pp-max" style="cursor:pointer" title="As much as you can make from what’s on this rock now">MAX</button>`) + '</div>' +
        (P.maxTxt ? `<div class="hint">${P.maxTxt}</div>` : '') + forHTML() : '') + '</div>';

    if (P.p && qty > 0) {
      const W = work(P.p, fsh ? Math.min(qty, fRoom) : qty);
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
          if (W.mine[p]) parts.push('⛏ ' + k.amt(p, W.mine[p]) + (k.canMine(p) ? ' to mine here' : ' – you’ll mine it and bring it here'));
          if (W.fly[p]) parts.push('<span class="short">✈ ' + k.amt(p, W.fly[p]) + ' to fly in or buy</span>' + (W.noBld[p] ? ' <span class="hint" style="margin:0">(needs a ' + esc(W.noBld[p].join(' or ')) + ' to make here)</span>' : '') + (window.YICSRCTXT ? '<br>' + (window.YICSRCTXT(p, W.fly[p], k.astId(S.rock)) || '') : ''));
          t += row(p, tot, parts.join('<br>'));
        });
        h += `<div class="card"><h2><span class="n">3</span>What you need</h2>` +
          `<div class="dkp-sum"><div><b>${W.steps.length}</b>processes</div><div class="good"><b>${st.length}</b>from storage</div><div><b>${mi.length}</b>to mine here</div><div class="${fl.length ? 'bad' : 'good'}"><b>${fl.length}</b>to fly in or buy</div></div>` +
          illMineHTML() +
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
        const pf = fsh ? 'ship' : (P.for && P.for !== 'ship' ? P.for : (P.use ? 'build' : 'stock'));
        const fin = W.steps[W.steps.length - 1];
        const fluid = (r) => Object.keys(r.out).every((o) => k.TANKOK.has(+o));
        W.steps.forEach((s) => { s.to = s === fin ? (ST.tank && fluid(s.r) ? byId(ST.tank) : byId(ST[pf])) : byId(ST.mat); });
        // ⛽ fuel processing store (Mark, 26 Nov – TEST ONLY ?beta=1): the propellant process takes its inputs from there, and the
        // in-between products it needs are sent there; the inputs it needs from storage are moved there (W.dest)
        { const fb = ST.fuel ? byId(ST.fuel) : null, fits = (b, ps) => !b || b.Building.buildingType !== k.TANK || ps.every((p) => k.TANKOK.has(+p));
          W.steps.forEach((s) => { s.from = fb && s.r.out[170] && fits(fb, Object.keys(s.r.inp)) ? fb : byId(ST.mat); });
          W.steps.forEach((s, i) => { if (s === fin) return; const users = W.steps.slice(i + 1).filter((u) => u.r.inp[s.p]);
            if (fb && users.length && users.every((u) => u.from === fb) && fits(fb, Object.keys(s.r.out))) s.to = fb; });
          W.dest = {}; W.split = {}; Object.keys(W.stock).forEach((p) => { const users = W.steps.filter((u) => u.r.inp[p]); if (fb && users.length && users.every((u) => u.from === fb)) W.dest[p] = fb;
            // used by BOTH the propellant step and an earlier step (e.g. Hydrogen: propellant + Tungsten Powder) – each store gets
            // only its own share, so 35 kt of Hydrogen isn't gathered in the materials warehouse (Mark, 27 Nov – LIVE 27 Nov, tested on ?beta=1)
            else if (fb && users.some((u) => u.from === fb)) W.split[p] = Math.min(W.stock[p], users.filter((u) => u.from === fb).reduce((t, u) => t + u.r.inp[p] * u.runs, 0)); }); }
        if (P.fto && P.fto.p === P.p) { const tb = byId(P.fto.id); if (tb && (tb.Building.buildingType !== k.TANK || fluid(fin.r))) fin.to = tb; }
        // ⛽ into the ship's tank: never more runs than the room left (the refinery won't start if it can't all fit)
        if (fsh && fin.p === 170 && fluid(fin.r)) { fin.to = { ship: true, id: fsh.id, slot: 1, Name: { name: fsh.name + '’s tank' } }; fin.runs = Math.min(fin.runs, Math.floor(fRoom / fin.r.out[170])); }
        // step 6: the processes to run, in order
        const blds = (bt) => k.onRock().filter((b) => b.Building.buildingType === bt);
        h += `<div class="card"><h2><span class="n">4</span>Processes to run (${W.steps.length}), in order</h2><table><thead><tr><th>#</th><th>Process</th><th>Makes</th><th class="num">Runs</th><th>Building</th><th>Outputs go to</th><th class="num">Time</th></tr></thead><tbody>` +
          W.steps.map((s, i) => {
            const bt = k.FBT[s.r.type], bs = blds(bt), free = bs.filter((b) => k.freeSlot(b)).length;
            return `<tr><td>${i + 1}</td><td>${esc(s.r.name)}</td><td>${esc(k.pname(s.p))} ${k.amt(s.p, s.r.out[s.p] * s.runs)}${IMB && s.p <= 22 ? ` <button type="button" class="dk-shipbtn" data-illmine="${s.p}" style="cursor:pointer;padding:1px 6px" title="Don’t make it – put it on the mine list instead">⛏ No, I’ll mine it</button>` : ''}</td><td class="num">${s.runs.toLocaleString('en-GB')}</td>` +
              `<td>${esc(k.BTN[bt])} <span class="${free ? 'ok' : 'src'}">· ${free} of ${bs.length} free</span></td><td>${s.to ? esc(k.nm(s.to)) : '<span style="color:var(--red)">no storage</span>'}</td><td class="num">${hrs(k.procSecs(s.r.name, s.runs) || 0)}</td></tr>`;
          }).join('') + '</tbody></table>' +
          '<div class="hint">Earlier steps make what later steps need. Times are without crew or building bonuses.</div></div>';
        // step 7: where things go
        const after = fullAfter(W, ST, byId), pk = peakMat(W, ST, byId), fuelB = ST.fuel ? byId(ST.fuel) : null, pkF = fuelB ? peakMat(W, ST, byId, fuelB) : 0;
        const fuelUsed = fuelB && W.steps.some((s) => s.from === fuelB);
        P.peakBad = FUELB && (pk > 100 || (fuelUsed && pkF > 100)); // TEST ONLY (?beta=1) with Fuel a ship, 26 Nov
        const pc = (n) => `<b style="color:${n > 100 ? '#ff4d4d' : n >= 90 ? '#ff6b6b' : n >= 75 ? '#ffb03b' : '#3fd68a'}">${n}%</b>`;
        const aft = (key) => { const b = byId(ST[key]); if (!b) return '<td></td>'; const a = after(b), n = ST.full(b); return `<td class="num" style="white-space:nowrap">${n}% → ${pc(a)}${a > 100 ? ' <span style="color:#ff4d4d">won’t fit</span>' : ''}</td>`; };
        const sel = (key, list, none) => `<select data-st="${key}">${none ? `<option value="">${none}</option>` : ''}${list.map((b) => `<option value="${b.id}"${b.id === ST[key] ? ' selected' : ''}>${esc(k.nm(b))} · ${ST.full(b)}% full</option>`).join('')}</select>`;
        h += `<div class="card"><h2><span class="n">5</span>Where things go</h2>
<div class="row"><span class="src">What it's for</span>${FOR.concat(FUELB && P.p === 170 && fuelShips().length ? [['ship', '⛽ Ship’s tank']] : []).map(([v, t]) => `<button type="button" class="dk-shipbtn${pf === v ? ' on' : ''}" data-for="${v}">${t}</button>`).join('')}</div>
<table style="margin-top:10px"><tbody>
${fsh ? `<tr><td>⛽ Ship’s tank</td><td><select id="pp-fship">${fuelShips().map((s) => `<option value="${s.id}"${s.id === fsh.id ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</select></td><td class="num" style="white-space:nowrap">${Math.round((s0 => (s0.prop || 0) * 1e6 / TANKG[s0.st] * 100)(fsh))}% → ${pc(Math.round(((fsh.prop || 0) * 1e6 + fin.runs * fin.r.out[170] * k.grams(170)) / TANKG[fsh.st] * 100))}</td><td class="src">The Hydrogen Propellant goes straight into the tank – ${fRoom > 0 ? 'room for ' + k.amt(170, fRoom) + ', so it makes no more than that.' : '<span style="color:var(--amber)">the tank is already full.</span>'}</td></tr>` : ''}
${P.fto && P.fto.p === P.p && fin.to && fin.to.id === P.fto.id ? `<tr><td>⛽ For Fuel a ship</td><td><b>${esc(k.nm(fin.to))}</b></td><td></td><td class="src">The ${esc(k.pname(P.p))} goes here, ready for the refinery that fills the ship.</td></tr>` : ''}
<tr><td>📦 Materials ${ST.matL.length > ST.wh.length ? 'store' : 'warehouse'}</td><td>${sel('mat', ST.matL)}</td>${aft('mat')}<td class="src">Everything the processes use is gathered here; in-between products land here too.${FUELB && pk > 100 ? `<br><b style="color:#ff4d4d">✗ Won’t fit while the inputs are gathered (${pk}% full before anything is used)</b> – the game refuses the moves.${ST.matL.length > ST.wh.length ? ' Pick a tank farm here, or make less.' : ' Make less, or move things out first.'}` : FUELB && pk >= 90 ? `<br><span style="color:#ffb03b">${pk}% full while the inputs are gathered.</span>` : ''}</td></tr>
${FUELB ? `<tr><td>⛽ Fuel processing store</td><td>${sel('fuel', ST.tf.concat(ST.wh), '— don’t use one —')}</td>${fuelUsed ? `<td class="num" style="white-space:nowrap">${ST.full(fuelB)}% → ${pc(after(fuelB))}</td>` : '<td></td>'}<td class="src">Where you make Hydrogen Propellant – the propellant process takes its inputs from here, so they don’t all have to be gathered in the materials warehouse.${fuelB && !fuelUsed && W.steps.some((s) => s.r.out[170]) ? '<br><span style="color:var(--amber)">' + esc(k.nm(fuelB)) + ' is a tank farm and can’t take every input – using the materials warehouse.</span>' : ''}${fuelUsed && pkF > 100 ? `<br><b style="color:#ff4d4d">✗ Won’t fit while the inputs are gathered (${pkF}% full before anything is used)</b> – make less, or move things out first.` : ''}</td></tr>` : ''}
<tr><td>🏷 Stock store</td><td>${sel('stock', ST.wh)}</td>${aft('stock')}<td class="src">Finished goods made for stock.</td></tr>
<tr><td>🛒 Market store</td><td>${sel('market', ST.wh)}</td>${aft('market')}<td class="src">Finished goods made to sell.</td></tr>
<tr><td>🏗 Building store</td><td>${sel('build', ST.wh)}</td>${aft('build')}<td class="src">Finished goods for your own building.</td></tr>
<tr><td>🛢 Tank farm</td><td>${ST.tf.length ? sel('tank', ST.tf, '— don’t use one —') : '<span class="src">none on this rock</span>'}</td>${aft('tank')}<td class="src">Finished goods that are all fluid (e.g. Hydrogen Propellant).</td></tr>
</tbody></table><div class="hint">Full now → full when the plan is done: <span style="color:#3fd68a">green</span> under 75%, <span style="color:#ffb03b">amber</span> 75–89%, <span style="color:#ff6b6b">red</span> 90% or more. Remembered for ${esc(S.rock)} in this browser.</div></div>`;
        h += movesHTML(W, ST, byId);
        P.snap = snapPlan(W, ST, qty);
      }
    }
    P.shipItems = null;
    finish(m, h);
  }
  // ---------- Cargo bay: two ways to load (Mark, 14 Nov – TEST ONLY, ?beta=1) ----------
  function cmodeBar() {
    const b = (v, t) => `<button type="button" class="dk-shipbtn${(P.cmode || 'make') === v ? ' on' : ''}" data-cmode="${v}" style="cursor:pointer">${t}</button>`;
    // Mark (15 Nov – TEST ONLY): three buttons – Export for production / Load one ship / Load a fleet
    {
      const cm = P.cmode || 'make';
      return `<div class="card"><div class="row" style="gap:8px">${MRG ? '' : b('make', '🏭 Export for production')}${b('stock', '📦 Load one ship')}${b('fleet', '🚀 Load a fleet')}${FUELB ? b('fuel', '⛽ Fuel a ship') : ''}${FLEETFB ? b('ffuel', '⛽ Fuel a fleet') : ''}</div>` +
        `<div class="hint" style="margin:8px 0 0">${cm === 'ffuel' ? 'Pick a rock and tick the ships parked there – the page fills their tanks from the propellant in storage on that rock.' : cm === 'fuel' ? 'Pick a ship parked on a rock – the page works out how much fills its tank and puts it in from storage.' : cm === 'make' ? 'Pick where you’ll make it and what – the page works out what that rock is missing and which of your rocks to collect it from.'
          : cm === 'fleet' ? 'Pick a rock, tick the ships parked there, and what to load – it’s spread so each ship carries about the same weight.'
          : (MRG ? 'Pick a rock, a ship parked there, and what to put on it – type amounts yourself, or let the page fill them in for something you want to make.' : 'Pick a rock, a ship parked there, and what to put on it from that rock’s storage.')}</div></div>`;
    }
  }
  // 🏭 Fill it for something to make (MRG, TEST ONLY): P.fx = { r: rock to make it on, p, q, unit, find, open, res }
  function fillHTML(k, r, rl, tot) {
    const esc = k.esc, x = P.fx = P.fx || { r: '', p: 0, q: '', unit: 't', find: '' };
    if (!rl.includes(x.r)) x.r = rl.find((y) => y !== r) || r;
    const f = (x.find || '').trim().toLowerCase();
    const shown = products().filter((p) => !f || k.pname(p).toLowerCase().includes(f));
    // buildings and ships too (Mark, 26 Nov): their construction materials, from window.YICBL (vendor/buildplan.js)
    const BLx = Object.entries(window.YICBL || {}).filter(([, v]) => !f || v[0].toLowerCase().includes(f)).sort((a, b) => a[1][0].localeCompare(b[1][0]));
    const bS = BLx.filter(([key]) => /^s\d$/.test(key)), bB = BLx.filter(([key]) => !/^s\d$/.test(key));
    const isB = typeof x.p === 'string';
    if (x.p && !(isB ? BLx.some(([key]) => 'b:' + key === x.p) : shown.includes(x.p))) x.p = 0;
    const bulk = x.p && !isB ? k.bulk(x.p) : !x.p;
    const og = (lab, l) => l.length ? `<optgroup label="${lab}">${l.map(([key, v]) => `<option value="b:${key}"${'b:' + key === x.p ? ' selected' : ''}>${esc(v[0])}</option>`).join('')}</optgroup>` : '';
    let h = `<details class="card dkp-fold" id="pp-fx"${x.open ? ' open' : ''}><summary><b>🏭 Fill it for something to make</b> <span class="src">(optional)</span></summary>` +
      `<div class="src" style="margin:8px 0">Pick what you want to make and where. The page works out what that rock is missing and fills in step 3 from what’s on ${esc(r)}.</div>` +
      `<div class="row"><span class="src">Make it on</span><select id="pp-fxr">${rl.map((y) => `<option${y === x.r ? ' selected' : ''}>${esc(y)}</option>`).join('')}</select></div>` +
      `<div class="row" style="margin-top:8px"><span class="src">What</span><input type="search" id="pp-fxf" placeholder="🔍 Search…" value="${esc(x.find || '')}">` +
      `<select id="pp-fxp" style="flex:1 1 260px"><option value="0">${f ? (shown.length + BLx.length) + ' found – pick one' : '— pick what to make —'}</option>${og('🏗 Buildings', bB)}${og('🚀 Ships', bS)}${shown.length ? `<optgroup label="📦 Products">${shown.map((p) => `<option value="${p}"${p === x.p ? ' selected' : ''}>${esc(k.pname(p))}</option>`).join('')}</optgroup>` : ''}</select></div>` +
      (x.p ? `<div class="row" style="margin-top:8px"><span class="src">${isB ? 'How many' : 'How much'}</span><input type="number" id="pp-fxq" min="0" step="any" value="${esc(x.q)}">` +
        (bulk ? `<select id="pp-fxu" style="min-width:0">${Object.keys(UNITS).map((u) => `<option${u === x.unit ? ' selected' : ''}>${u}</option>`).join('')}</select>` : '<span class="src" style="display:inline-block;min-width:4.2em">units</span>') +
        `<button type="button" class="dk-shipbtn" id="pp-fxgo" style="cursor:pointer;border:1px solid #ffb03b;color:#ffd28a">Fill in step 3</button></div>` : '') +
      (x.res ? `<div class="hint" style="margin-top:8px">${x.res}</div>` : '') +
      // short here → make it in Production on this rock, then come back and load it (Mark, 26 Nov)
      (x.res && (x.short || []).length ? `<div class="row" style="gap:6px;margin-top:6px">${x.short.map(([p, n]) => `<button type="button" class="dk-shipbtn" data-fxmk="${p}" data-q="${n}" style="cursor:pointer;border:1px solid #ffb03b;color:#ffd28a">🏭 Make ${k.amt(p, n)} ${esc(k.pname(p))} in Production ▸</button>`).join('')}</div><div class="hint">Made on ${esc(r)} – then come back here to load it.</div>` : '') + '</details>';
    return h;
  }
  function fillWire(m, k, r, tot) {
    const x = P.fx, esc = k.esc, S = k.S, on = (id, ev, fn) => { const e = m.querySelector('#' + id); if (e) e.addEventListener(ev, fn); };
    const d = m.querySelector('#pp-fx'); if (d) d.addEventListener('toggle', () => { x.open = d.open; });
    on('pp-fxr', 'change', (e) => { x.r = e.target.value; x.res = ''; k.render(); });
    on('pp-fxp', 'change', (e) => { const v = e.target.value; x.p = /^b:/.test(v) ? v : +v; if (typeof x.p === 'string' && !(+x.q > 0)) x.q = 1; x.res = ''; k.render(); });
    on('pp-fxq', 'change', (e) => { x.q = e.target.value; });
    on('pp-fxu', 'change', (e) => { x.unit = e.target.value; });
    on('pp-fxf', 'input', (e) => { x.find = e.target.value; const pos = e.target.selectionStart; k.render(); const n = m.querySelector('#pp-fxf'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (z) {} } });
    m.querySelectorAll('[data-fxmk]').forEach((b) => b.addEventListener('click', () => {
      window.YICPRODGO = { p: +b.dataset.fxmk, q: +b.dataset.q, rock: r };
      S.mode = 'make'; k.render();
      const sc = document.querySelector('#dk-ov .lb-scr'); if (sc) sc.scrollTop = 0;
    }));
    on('pp-fxgo', 'click', () => {
      const qi = m.querySelector('#pp-fxq'); if (qi) x.q = qi.value; x.short = [];
      const B = typeof x.p === 'string' ? (window.YICBL || {})[x.p.slice(2)] : null;
      const qty = B ? Math.ceil(+x.q || 0) : k.bulk(x.p) ? Math.round((+x.q || 0) * UNITS[x.unit || 't']) : Math.ceil(+x.q || 0);
      if (!(qty > 0)) { x.res = '<span style="color:var(--amber)">Type how much you want to make.</span>'; k.render(); return; }
      // a building or ship: each construction material worked back on its own, and what's missing added up
      const parts = B ? Object.entries(B[1]).map(([p, n]) => [+p, n * qty]) : [[x.p, qty]];
      const keep = S.rock, need = {}; let cant = [];
      try {
        S.rock = x.r;
        // for a building or ship, what's already on the rock you'll build it on counts first
        const has = (p) => k.onRock().filter(k.isStore).reduce((t, b) => t + (((k.inv(b) || { contents: [] }).contents || []).filter((c) => c.product === p).reduce((u, c) => u + c.amount, 0)), 0);
        parts.forEach(([p, n0]) => { const n = B ? Math.max(0, n0 - has(p)) : n0; if (!(n > 0)) return; const W = work(p, n); if (W.steps.length) Object.keys(W.fly).forEach((q) => { need[q] = (need[q] || 0) + W.fly[q]; }); else { need[p] = (need[p] || 0) + n; if (!B) cant.push(p); } });
      } finally { S.rock = keep; }
      const what = B ? qty + ' × ' + esc(B[0]) : k.amt(x.p, qty) + ' ' + esc(k.pname(x.p));
      const W = { steps: cant.length ? [] : [1] };
      const ps = Object.keys(need).map(Number).filter((p) => need[p] > 0);
      if (!ps.length) { x.res = `<span class="ok">✓ Nothing to bring</span> – ${esc(x.r)} has everything for ${what}. Use 🏭 Production.`; k.render(); return; }
      P.sq = {};
      const got = [], short = []; x.short = [];
      ps.forEach((p) => {
        const n = Math.min(Math.ceil(need[p]), tot(p));
        if (n > 0) { got.push(p); if (k.bulk(p)) { const u = n >= 1e6 ? 'kt' : n >= 1000 ? 't' : 'kg'; P.sq[p] = { q: Math.ceil(n / UNITS[u] * 1000) / 1000, unit: u }; } else P.sq[p] = { q: n }; }
        if (n < need[p]) x.short.push([p, Math.ceil(need[p]) - n]);
        if (n < need[p]) short.push(esc(k.pname(p)) + ' (' + k.amt(p, Math.ceil(need[p]) - n) + ' short)');
      });
      x.res = (W.steps.length ? '' : `<span style="color:var(--amber)">${esc(k.pname(x.p))} can’t be made on ${esc(x.r)} – filled in the finished item instead.</span><br>`) +
        (got.length ? `<span class="ok">✓ Filled in ${got.length} item${got.length > 1 ? 's' : ''}</span> that ${esc(x.r)} is missing for ${what}.` : `${esc(r)} has none of what ${esc(x.r)} is missing for ${what}.`) +
        (short.length ? `<br><span style="color:var(--amber)">Not enough on ${esc(r)}:</span> ${short.join(' · ')}` : '');
      k.render();
    });
  }
  // "I'd also like to be able to just pick what's in stock on a rock and send it to a ship" (Mark, 14 Nov)
  function stockPage(m) {
    const FL = P.cmode === 'fleet'; // 🚀 Load a fleet (Mark, 15 Nov – own button)
    const k = K(), esc = k.esc, S = k.S, d = k.D() || {}, rl = k.rocks();
    const SHIPT = { 2: 'Light Transport', 3: 'Heavy Transport' };
    const g = (p) => k.grams(+p), v = (p) => (k.mv()[p] || [1000, 1000])[1];
    if (!rl.includes(P.sr)) P.sr = S.rock;
    const r = P.sr, ast = k.astId(r);
    const stores = k.allB().filter((b) => k.isStore(b) && k.rockOf(b) === r);
    const stock = {}; // product → [[building, amount]]
    stores.forEach((b) => ((k.inv(b) || { contents: [] }).contents || []).forEach((c) => { if (c.amount > 0) (stock[c.product] = stock[c.product] || []).push([b, c.amount]); }));
    const tot = (p) => (stock[p] || []).reduce((t, z) => t + z[1], 0);
    const ships = (d.ships || []).filter((s) => SHIPT[s.st] && s.capM && s.sst === 'd' && s.dId === ast);
    const room = (s) => Math.min((s.capM - s.useM) / s.capM, (s.capV - s.useV) / s.capV);
    if (!ships.find((s) => s.id === P.ss)) P.ss = (ships.slice().sort((a, b) => room(b) - room(a))[0] || {}).id || 0;
    const ship = ships.find((s) => s.id === P.ss);
    P.sq = P.sq || {};
    const want = (p) => { const x = P.sq[p]; if (!x || !(+x.q > 0)) return 0; return Math.min(tot(p), k.bulk(+p) ? Math.round(+x.q * UNITS[x.unit || 't']) : Math.floor(+x.q)); };
    let h = cmodeBar();
    h += `<div class="card"><h2><span class="n">1</span>Rock the ship is on</h2><div class="src" style="margin-bottom:8px">The rock whose storage you’re loading from.</div><select id="pp-sr">${rl.map((x) => `<option${x === r ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></div>`;
    // Fleet (community idea, Mark 15 Nov – TEST ONLY, ?beta=1): tick several ships parked here; what you pick is spread
    // so each ship leaves with about the same weight (a ship with less room just takes what fits; the rest share the extra).
    // full = under 1% room left (same rule as the Cargo bay) – greyed out and can't be ticked (Mark, 15 Nov)
    const isFull = (s) => room(s) < 0.01;
    const usedPc = (s) => Math.min(100, Math.round(Math.max(s.useM / s.capM, s.useV / s.capV) * 100));
    if (FL) {
      if (!P.fl) P.fl = P.ss ? [P.ss] : [];
      P.fl = P.fl.filter((id) => ships.some((s) => s.id === id && !isFull(s)));
    }
    if (FL) h += `<div class="card"><h2><span class="n">2</span>Ships to load</h2><div class="src" style="margin-bottom:8px">Your Light and Heavy Transports parked at ${esc(r)}. Tick one, or several – the load is spread so each ship carries about the same weight.</div>` +
      (ships.length ? `<div class="row" style="margin:0 0 6px;gap:8px"><button type="button" class="dk-shipbtn" id="pp-flall">Tick all</button><button type="button" class="dk-shipbtn" id="pp-flnone">Untick all</button></div>` +
        ships.map((s) => isFull(s)
          ? `<label style="display:flex;gap:8px;align-items:center;padding:4px 0;opacity:.45;cursor:not-allowed" title="Full – unload it in the game first"><input type="checkbox" disabled><b>${esc(s.name)}</b> <span class="src">${SHIPT[s.st]} · <b style="color:var(--amber)">Full</b> (${k.tonnes(s.useM / 1000)} on board)</span></label>`
          : `<label style="display:flex;gap:8px;align-items:center;padding:4px 0;cursor:pointer"><input type="checkbox" data-fl="${s.id}"${P.fl.includes(s.id) ? ' checked' : ''}><b>${esc(s.name)}</b> <span class="src">${SHIPT[s.st]} · ` +
            (s.useM > 0 || s.useV > 0 ? `<b style="color:var(--amber)">${usedPc(s)}% loaded</b> (${k.tonnes(s.useM / 1000)} on board) · ` : 'empty · ') + `${k.tonnes(Math.max(0, s.capM - s.useM) / 1000)} free</span> ${fuelBar(s)}</label>`).join('')
        : `<div class="src" style="color:var(--amber)">✈ No ship is parked at ${esc(r)}. Fly one there in the game first, then come back here to load it.</div>`) + '</div>';
    else h += `<div class="card"><h2><span class="n">2</span>Ship to load</h2><div class="src" style="margin-bottom:8px">Your Light and Heavy Transports parked at ${esc(r)}.</div>` +
      (ships.length ? `<select id="pp-ss">${ships.map((s) => `<option value="${s.id}"${s.id === P.ss ? ' selected' : ''}>${esc(s.name)} · ${SHIPT[s.st]} · ${Math.max(0, Math.round(room(s) * 100))}% space free (${k.tonnes(Math.max(0, s.capM - s.useM) / 1000)})${fuelTxt(s)}</option>`).join('')}</select> ${fuelBar(ships.find((z) => z.id === P.ss) || ships[0])}`
        : `<div class="src" style="color:var(--amber)">✈ No ship is parked at ${esc(r)}. Fly one there in the game first, then come back here to load it.</div>`) + '</div>';
    // Load a fleet (Mark, 15 Nov): how the picked amounts compare with the room in the ticked ships, and a button that
    // scales every item down by the same fraction to fit – the player can then change any amount (more of one, less of another)
    const fitInfo = () => {
      const fl = ships.filter((s) => (P.fl || []).includes(s.id));
      const pk = Object.keys(P.sq).map(Number).filter((p) => want(p) > 0);
      const W = pk.reduce((t, p) => t + want(p) * g(p), 0), V = pk.reduce((t, p) => t + want(p) * v(p), 0);
      const cg = fl.reduce((t, s) => t + Math.max(0, (s.capM - s.useM) * 0.995), 0), cv = fl.reduce((t, s) => t + Math.max(0, (s.capV - s.useV) * 0.995), 0);
      return { fl, pk, W, V, cg, cv, k: Math.min(1, W ? cg / W : 1, V ? cv / V : 1) };
    };
    const fitBar = () => {
      if (!FL) return '';
      const x = fitInfo();
      if (!x.pk.length) return '';
      if (!x.fl.length) return '<div class="src" style="margin-top:8px;color:var(--amber)">Tick at least one ship in step 2.</div>';
      const over = x.k < 0.999;
      return `<div class="row" style="margin-top:10px;gap:10px;align-items:center"><span class="src">Picked <b>${k.tonnes(x.W / 1000)}</b> · room in the ticked ships <b>${k.tonnes(x.cg / 1000)}</b> · ` +
        // Mark (15 Nov): no automatic scaling – the player decides what to cut
        (over ? `<b style="color:var(--amber)">⚠ ${x.W > x.cg ? k.tonnes((x.W - x.cg) / 1000) : Math.round((1 - x.k) * 100) + '% (by space)'} too much</b></span>`
          : `<b style="color:var(--green)">✓ fits</b> · ${k.tonnes((x.cg - x.W) / 1000)} room left</span>`) + '</div>' +
        (over ? '<div class="hint">Lower some amounts above (or tick another ship) until it fits – you choose what goes.</div>' : '');
    };
    if (MRG) h += fillHTML(k, r, rl, tot);
    const f = (P.sfind || '').trim().toLowerCase();
    const prods = Object.keys(stock).map(Number).filter((p) => !f || k.pname(p).toLowerCase().includes(f)).sort((a, b) => !!want(b) - !!want(a) || k.pname(a).localeCompare(k.pname(b)));
    h += `<div class="card"><h2><span class="n">3</span>What to put on it</h2><div class="src" style="margin-bottom:8px">Everything in storage on ${esc(r)}. Type how much of each to load, or press ALL.</div>` +
      `<input type="search" id="pp-sfind" placeholder="🔍 Search…" value="${esc(P.sfind || '')}">` +
      (prods.length ? `<table style="margin-top:8px"><thead><tr><th>Item</th><th class="num">In stock</th><th>Load</th></tr></thead><tbody>` + prods.map((p) => {
        const x = P.sq[p] || {}, bulk = k.bulk(p);
        return `<tr><td>${esc(k.pname(p))}</td><td class="num">${k.amt(p, tot(p))}</td><td><div class="row" style="gap:6px;margin:0"><input type="number" min="0" step="any" data-sq="${p}" value="${esc(x.q || '')}" placeholder="0">` +
          (bulk ? `<select data-su="${p}" style="min-width:0">${Object.keys(UNITS).map((u) => `<option${u === (x.unit || 't') ? ' selected' : ''}>${u}</option>`).join('')}</select>` : ('<span class="src" style="display:inline-block;min-width:4.2em">units</span>')) +
          // an item with an amount gets CLEAR instead of ALL, to take it off easily (Mark, 15 Nov – TEST ONLY)
          ((want(p) > 0) ? `<button type="button" class="dk-shipbtn" data-sclr="${p}" style="cursor:pointer">CLEAR</button>`
            : `<button type="button" class="dk-shipbtn" data-sall="${p}" style="cursor:pointer">ALL</button>`) + `</div></td></tr>`;
      }).join('') + '</tbody></table>' : `<div class="src" style="margin-top:8px">${f ? 'Nothing matches.' : 'Nothing in storage on ' + esc(r) + '.'}</div>`) + fitBar() + '</div>';
    // step 4: the moves – storage → ship, nearest storage to the ship first; capped at the ship's free space
    S.calls = []; S.startList = []; S.feed = false; S.srcRock = r;
    const picked = Object.keys(P.sq).map(Number).filter((p) => want(p) > 0);
    const fleet = FL ? ships.filter((s) => P.fl.includes(s.id)) : [];
    if (FL && fleet.length && picked.length && fitInfo().k < 0.999) {
      h += `<div class="card"><h2><span class="n">4</span>Load them</h2><div class="src" style="color:var(--amber)">⚠ That's more than the ticked ships can carry. Lower some amounts in step 3, or tick another ship, then the split appears here.</div></div>`;
    } else if (FL && fleet.length && picked.length) {
      const cl = k.crews(r);
      if (!cl.find((c) => c.id === S.mover)) S.mover = (cl.find((c) => !c.busy) || cl[0] || {}).id || 0;
      S.moverObj = cl.find((c) => c.id === S.mover);
      // each ship's share of the weight: equal, but never more than it has room for (water-filling)
      const free = fleet.map((s) => ({ s, g: Math.max(0, (s.capM - s.useM) * 0.995), v: Math.max(0, (s.capV - s.useV) * 0.995) }));
      const W = picked.reduce((t, p) => t + want(p) * g(p), 0);
      let rest = Math.min(W, free.reduce((t, f) => t + f.g, 0)), open = free.slice();
      free.forEach((f) => { f.t = 0; });
      while (rest > 1 && open.length) {
        const each = rest / open.length, small = open.filter((f) => f.g - f.t <= each);
        if (small.length) { small.forEach((f) => { rest -= f.g - f.t; f.t = f.g; }); open = open.filter((f) => !small.includes(f)); }
        else { open.forEach((f) => { f.t += each; }); rest = 0; }
      }
      const tt = free.reduce((t, f) => t + f.t, 0) || 1;
      const load = free.map(() => ({}));
      // every material is shared out in the same proportion, so each ship gets a bit of everything (biggest items first)
      picked.slice().sort((a, b) => want(b) * g(b) - want(a) * g(a)).forEach((p) => {
        let left = want(p);
        const share = free.map((f) => Math.floor(want(p) * f.t / Math.max(tt, W)));   // too much picked: every item cut by the same fraction
        free.forEach((f, i) => {
          const n = Math.min(share[i], left, Math.floor((f.g - (f.ug || 0)) / g(p)), Math.floor((f.v - (f.uv || 0)) / v(p)));
          if (n > 0) { load[i][p] = n; left -= n; f.ug = (f.ug || 0) + n * g(p); f.uv = (f.uv || 0) + n * v(p); }
        });
        // round-off and anything a full ship couldn't take: to the ship furthest below its share that has room
        while (left > 0) {
          const i = free.map((f, j) => [j, f.t - (f.ug || 0), Math.min(Math.floor((f.g - (f.ug || 0)) / g(p)), Math.floor((f.v - (f.uv || 0)) / v(p)))])
            .filter((z) => z[2] > 0).sort((a, b) => b[1] - a[1])[0];
          if (!i) break;
          const n = Math.min(left, i[2], i[1] > 0 ? Math.max(1, Math.ceil(i[1] / g(p))) : Infinity);
          load[i[0]][p] = (load[i[0]][p] || 0) + n; left -= n; free[i[0]].ug = (free[i[0]].ug || 0) + n * g(p); free[i[0]].uv = (free[i[0]].uv || 0) + n * v(p);
        }
      });
      const cut = picked.some((p) => load.reduce((t, L) => t + (L[p] || 0), 0) < want(p));
      // storage → ship moves, nearest storage first; one store's stock is shared between the ships
      const taken = {}, mv = {};
      free.forEach((f, i) => Object.keys(load[i]).forEach((p) => {
        let n = load[i][p];
        stock[p].map(([b, hv]) => [b, hv - (taken[b.id + ':' + p] || 0), k.kmBetween(k.lotOf(b), f.s.lot, ast) ?? 1e9]).filter((z) => z[1] > 0).sort((a, b) => a[2] - b[2]).forEach(([b, hv]) => {
          if (n <= 0) return; const q = Math.min(n, hv); n -= q; taken[b.id + ':' + p] = (taken[b.id + ':' + p] || 0) + q;
          const key = b.id + '>' + f.s.id; (mv[key] = mv[key] || { b, s: f.s, items: [] }).items.push([+p, q]);
        });
      }));
      S.calls = Object.values(mv).map((x) => ({ from: x.b.id, to: x.s.id, ship: true, slot: 2, items: x.items }));
      const kg = (i) => Object.keys(load[i]).reduce((t, p) => t + load[i][p] * g(p), 0) / 1000;
      h += `<div class="card"><h2><span class="n">4</span>Load them</h2>` + (!S.calls.length ? `<div class="src" style="color:var(--amber)">⚠ Nothing fits – the ticked ships are full. Unload them in the game first, or tick another ship.</div>` :
        `<div class="src">Spread over <b>${fleet.length} ship${fleet.length === 1 ? '' : 's'}</b>:</div>` +
        // products down the side, ships across the top (Mark, 15 Nov – long names were messy in one Goods column)
        `<div style="margin-top:6px;overflow-x:auto"><table class="nosort"><tbody><tr><th>Product</th>` +
        free.map((f) => `<th class="num" style="white-space:normal;min-width:90px">${esc(f.s.name)}<br><span class="src" style="font-weight:400">${SHIPT[f.s.st]}</span></th>`).join('') + `<th class="num">Total</th></tr>` +   // no <thead>: the site's sticky headings (tables.js) pushed it down inside the Hub
        picked.filter((p) => load.some((L) => L[p] > 0)).sort((a, b) => k.pname(a).localeCompare(k.pname(b))).map((p) => `<tr><td>${esc(k.pname(p))}</td>` +
          free.map((f, i) => `<td class="num">${load[i][p] ? k.amt(p, load[i][p]) : '<span class="src">–</span>'}</td>`).join('') +
          `<td class="num"><b>${k.amt(p, load.reduce((t, L) => t + (L[p] || 0), 0))}</b></td></tr>`).join('') +
        `<tr style="border-top:2px solid #ffb03b55"><td><b>Loading</b></td>${free.map((f, i) => `<td class="num"><b>${k.tonnes(kg(i))}</b></td>`).join('')}<td class="num"><b>${k.tonnes(free.reduce((t, f, i) => t + kg(i), 0))}</b></td></tr>` +
        `<tr><td class="src">On board after</td>${free.map((f, i) => `<td class="num src">${k.tonnes(f.s.useM / 1000 + kg(i))}</td>`).join('')}<td></td></tr>` +
        '</tbody></table></div>' +
        (cut ? `<div class="src" style="margin-top:4px;color:var(--amber)">⚠ Not all of it fits in the ticked ships – tick another ship or send the rest on a second trip.</div>` : '') +
        `<details class="dkp-fold" style="margin-top:6px"><summary>The ${S.calls.length} move${S.calls.length === 1 ? '' : 's'} – storage → ship</summary><div style="margin:6px 0 0 4px;padding-left:12px;border-left:2px solid #ffb03b55">` +
        Object.values(mv).map((x) => `<div style="margin:6px 0"><b>${esc(k.nm(x.b))}</b> → 🚀 ${esc(x.s.name)}` + x.items.map(([p, a]) => `<div class="src" style="margin-left:16px">└ ${esc(k.pname(p))} <b>${k.amt(p, a)}</b></div>`).join('') + '</div>').join('') + '</div></details>' +
        (cl.length ? `<div class="row" style="margin-top:6px"><span class="src">Crew doing the loading</span><select id="pp-ccrew">${cl.map((c) => `<option value="${c.id}"${c.id === S.mover ? ' selected' : ''}>${esc(c.name)}${c.busy ? ' – busy' : ' – ready'}</option>`).join('')}</select></div>` : `<div class="src" style="color:var(--amber)">No crew on ${esc(r)} to do the loading.</div>`) +
        `<button class="approve" id="pp-cgo" style="margin-top:10px"${cl.length && !S.busy ? '' : ' disabled'}>${S.busy ? 'WAITING FOR YOUR WALLET…' : 'APPROVE IN WALLET (load ' + fleet.length + ' ship' + (fleet.length === 1 ? '' : 's') + ')'}</button>` +
        `<div class="hint">Your wallet will ask you to approve these moves. Nothing happens in the game until you do.</div>` +
        `<div id="dk-msg" class="hint" style="display:${S.msg ? 'block' : 'none'};margin-top:10px;padding:10px 12px;border-radius:8px;border:1px solid ${S.msgErr ? '#ff4d4d88' : '#8fe3ff55'};color:${S.msgErr ? '#ffb3ae' : 'var(--ink)'}">${S.msg || ''}</div>`) +
        `<div class="hint">This only loads the ships. You fly them and unload them in the game yourself.</div></div>`;
    } else if (!FL && ship && picked.length) {
      const cl = k.crews(r);
      if (!cl.find((c) => c.id === S.mover)) S.mover = (cl.find((c) => !c.busy) || cl[0] || {}).id || 0;
      S.moverObj = cl.find((c) => c.id === S.mover);
      let fg = (ship.capM - ship.useM) * 0.995, fv = (ship.capV - ship.useV) * 0.995, cut = false; const mv = {};
      picked.forEach((p) => {
        let n = Math.min(want(p), Math.floor(fg / g(p)), Math.floor(fv / v(p))); if (n < want(p)) cut = true; if (n <= 0) return;
        fg -= n * g(p); fv -= n * v(p);
        stock[p].map(([b, hv]) => [b, hv, k.kmBetween(k.lotOf(b), ship.lot, ast) ?? 1e9]).sort((a, b) => a[2] - b[2]).forEach(([b, hv]) => {
          if (n <= 0) return; const q = Math.min(n, hv); n -= q; (mv[b.id] = mv[b.id] || { b, items: [] }).items.push([p, q]);
        });
      });
      S.calls = Object.keys(mv).map((id) => ({ from: +id, to: ship.id, ship: true, slot: 2, items: mv[id].items }));
      const lg = S.calls.reduce((t, c) => t + c.items.reduce((u, [p, a]) => u + a * g(p), 0), 0);
      h += `<div class="card"><h2><span class="n">4</span>Load it</h2>` + (!S.calls.length ? `<div class="src" style="color:var(--amber)">⚠ Nothing fits – ${esc(ship.name)} is full. Unload it in the game first, or pick another ship.</div>` :
        `<div class="src">These moves put <b>${k.tonnes(lg / 1000)}</b> from your storage on ${esc(r)} into ${esc(ship.name)}:</div>` +
        (cut ? `<div class="src" style="margin-top:4px;color:var(--amber)">⚠ Not all of it fits – ${esc(ship.name)} takes what it has room for.</div>` : '') +
        `<div style="margin:6px 0 0 4px;padding-left:12px;border-left:2px solid #ffb03b55">` + Object.keys(mv).map((id) => `<div style="margin:6px 0"><b>${esc(k.nm(mv[id].b))}</b> → 🚀 ${esc(ship.name)}` +
          mv[id].items.map(([p, a]) => `<div class="src" style="margin-left:16px">└ ${esc(k.pname(p))} <b>${k.amt(p, a)}</b></div>`).join('') + '</div>').join('') + '</div>' +
        (cl.length ? `<div class="row" style="margin-top:6px"><span class="src">Crew doing the loading</span><select id="pp-ccrew">${cl.map((c) => `<option value="${c.id}"${c.id === S.mover ? ' selected' : ''}>${esc(c.name)}${c.busy ? ' – busy until ' + esc(c.busy) : ' – ready'}</option>`).join('')}</select></div>` : `<div class="src" style="color:var(--red)">No crew on ${esc(r)} to do the loading.</div>`) +
        `<button class="approve" id="pp-cgo" style="margin-top:10px"${cl.length && !S.busy ? '' : ' disabled'}>${S.busy ? 'WAITING FOR YOUR WALLET…' : 'APPROVE IN WALLET (load ' + esc(ship.name) + ')'}</button>` +
        `<div class="hint">Your wallet will ask you to approve these moves. Nothing happens in the game until you do.</div>` +
        `<div id="dk-msg" class="hint" style="display:${S.msg ? 'block' : 'none'};margin-top:10px;padding:10px 12px;border-radius:8px;border:1px solid ${S.msgErr ? '#ff4d4d88' : '#8fe3ff55'};color:${S.msgErr ? '#ffb3ae' : 'var(--ink)'}">${S.msg || ''}</div>`) +
        `<div class="hint">This only loads the ship. You fly it and unload it in the game yourself.</div></div>`;
    }
    m.innerHTML = h;
    const on = (id, ev, fn) => { const e = m.querySelector('#' + id); if (e) e.addEventListener(ev, fn); };
    m.querySelectorAll('[data-cmode]').forEach((b) => b.addEventListener('click', () => { P.cmode = b.dataset.cmode; S.msg = ''; k.render(); }));
    on('pp-sr', 'change', (e) => { P.sr = e.target.value; P.ss = 0; P.sq = {}; P.fl = null; S.msg = ''; k.render(); });
    on('pp-ss', 'change', (e) => { P.ss = +e.target.value; k.render(); });
    m.querySelectorAll('[data-fl]').forEach((e) => e.addEventListener('change', () => { const id = +e.dataset.fl; P.fl = (P.fl || []).filter((x) => x !== id); if (e.checked) P.fl.push(id); k.render(); }));
    on('pp-flall', 'click', () => { P.fl = ships.filter((s) => room(s) >= 0.01).map((s) => s.id); k.render(); });
    on('pp-flnone', 'click', () => { P.fl = []; k.render(); });
    on('pp-sfind', 'input', (e) => { P.sfind = e.target.value; const pos = e.target.selectionStart; k.render(); const n = m.querySelector('#pp-sfind'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } });
    m.querySelectorAll('[data-sq]').forEach((e) => e.addEventListener('change', () => { const p = e.dataset.sq; P.sq[p] = Object.assign(P.sq[p] || {}, { q: e.value }); k.render(); }));
    m.querySelectorAll('[data-su]').forEach((e) => e.addEventListener('change', () => { const p = e.dataset.su; P.sq[p] = Object.assign(P.sq[p] || {}, { unit: e.value }); k.render(); }));
    m.querySelectorAll('[data-sclr]').forEach((e) => e.addEventListener('click', () => { delete P.sq[e.dataset.sclr]; k.render(); }));
    m.querySelectorAll('[data-sall]').forEach((e) => e.addEventListener('click', () => {
      const p = +e.dataset.sall, n = tot(p);
      if (k.bulk(p)) { const u = n >= 1e6 ? 'kt' : n >= 1000 ? 't' : 'kg'; P.sq[p] = { q: Math.floor(n / UNITS[u] * 1000) / 1000, unit: u }; } else P.sq[p] = { q: n };
      k.render();
    }));
    if (MRG) fillWire(m, k, r, tot);
    on('pp-ccrew', 'change', (e) => { S.mover = +e.target.value; k.render(); });
    on('pp-cgo', 'click', () => k.approve());
  }
  // 🗄 Storage Management (Mark, 14 Nov – TEST ONLY): "select resources on a rock and send them to a storage" – same rock, a surface move
  function storePage(m) {
    const k = K(), esc = k.esc, S = k.S, rl = k.rocks(), TANK = k.TANK, CAP = k.CAP;
    const g = (p) => k.grams(+p), v = (p) => (k.mv()[p] || [1000, 1000])[1];
    if (!rl.includes(S.rock)) S.rock = rl[0] || '';
    const r = S.rock, ast = k.astId(r);
    const stores = k.allB().filter((b) => k.isStore(b) && k.rockOf(b) === r).sort((a, b) => k.nm(a).localeCompare(k.nm(b)));
    const used = (b) => { const i = k.inv(b) || { mass: 0, volume: 0 }; return [i.mass + (i.reservedMass || 0), i.volume + (i.reservedVolume || 0)]; };
    const full = (b) => { const u = used(b), c = CAP[b.Building.buildingType]; return Math.max(u[0] / c[0], u[1] / c[1]); };
    if (!stores.find((b) => b.id === P.mdest)) P.mdest = (stores.slice().sort((a, b) => full(a) - full(b))[0] || {}).id || 0;
    const dest = stores.find((b) => b.id === P.mdest), tank = dest && dest.Building.buildingType === TANK;
    const stock = {}; // product → [[building, amount]] – everything except what's already in the storage it goes to
    stores.filter((b) => b !== dest).forEach((b) => ((k.inv(b) || { contents: [] }).contents || []).forEach((c) => { if (c.amount > 0) (stock[c.product] = stock[c.product] || []).push([b, c.amount]); }));
    const tot = (p) => (stock[p] || []).reduce((t, z) => t + z[1], 0);
    P.mq = P.mq || {};
    const want = (p) => { const x = P.mq[p]; if (!x || !(+x.q > 0)) return 0; return Math.min(tot(p), k.bulk(+p) ? Math.round(+x.q * UNITS[x.unit || 't']) : Math.floor(+x.q)); };
    let h = '';
    h += `<div class="card"><h2><span class="n">1</span>Rock</h2><div class="src" style="margin-bottom:8px">The rock whose storage you’re sorting out. Everything stays on this rock.</div><select id="pp-mr">${rl.map((x) => `<option${x === r ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></div>`;
    h += `<div class="card"><h2><span class="n">2</span>Send it to</h2><div class="src" style="margin-bottom:8px">The warehouse or tank farm on ${esc(r)} to move things into.</div>` +
      (stores.length ? `<select id="pp-md">${stores.map((b) => `<option value="${b.id}"${b.id === P.mdest ? ' selected' : ''}>${esc(k.nm(b))} · ${b.Building.buildingType === TANK ? 'tank farm' : 'warehouse'} · ${Math.round(full(b) * 100)}% full</option>`).join('')}</select>` +
        (tank ? '<div class="src" style="margin-top:6px">A tank farm only takes fluids – anything else is left out.</div>' : '')
        : `<div class="src" style="color:var(--amber)">No warehouse or tank farm on ${esc(r)}.</div>`) + '</div>';
    // 🧪 Gather to make (Mark, 19 Nov – TEST ONLY, ?beta=1): "select what I want to make, it all moves into the same
    // warehouse so I can then pick in game how much I want to make". Pick one or more products; their ingredients
    // (the process inputs, one step back) are listed with ALL ready to move, trimmed to keep some for other processes.
    // Shows the most you could make from all the stock on the rock, and from what these moves put in the warehouse.
    P.gm = P.gm || []; P.gr = P.gr || {};
    const types = new Set(k.onRock().map((b) => b.Building.buildingType));
    const rOf = (p) => k.recipes().filter((x) => x.out[p] && !/Unbundling/.test(x.name) && types.has(k.FBT[x.type]));
    const inDest = (p) => (dest ? ((k.inv(dest) || { contents: [] }).contents || []).filter((c) => c.product === p).reduce((t, c) => t + c.amount, 0) : 0);
    const allOn = (p) => tot(p) + inDest(p);
    const pickR = (p) => { const rs = rOf(p); if (!rs.length) return null; const by = rs.find((x) => x.i === P.gr[p]); if (by) return by; const mk = (x) => Math.min(...Object.keys(x.inp).map((ip) => allOn(+ip) / x.inp[ip])); return rs.slice().sort((a, b) => mk(b) - mk(a))[0]; };
    const makes = (p, x, have) => { let lim = null, runs = Infinity; Object.keys(x.inp).forEach((ip) => { const n = Math.floor(have(+ip) / x.inp[ip]); if (n < runs) { runs = n; lim = +ip; } }); return { q: (runs === Infinity ? 0 : runs) * x.out[p], lim }; };
    P.gm = P.gm.filter((p) => rOf(p).length);
    let gmAt = -1;
    {
      const gf = (P.gfind || '').trim().toLowerCase();
      const can = gf ? products().filter((p) => !P.gm.includes(p) && rOf(p).length && k.pname(p).toLowerCase().includes(gf)).slice(0, 12) : [];
      h += `<div class="card"><h2><span class="n">3</span>What do you want to make? <span class="src">(optional)</span></h2><div class="src" style="margin-bottom:8px">Pick one or more things – the whole chain to make them is listed, coloured by how many steps down. Type how many to make (or press MAX) and step 4 fills in what to move into ${dest ? esc(k.nm(dest)) : 'the storage above'}.</div>` +
        `<input type="search" id="pp-gfind" placeholder="🔍 Search what to make…" value="${esc(P.gfind || '')}">` +
        (gf ? (can.length ? '<div style="margin-top:6px">' + can.map((p) => `<button type="button" class="dk-shipbtn" data-gadd="${p}" style="cursor:pointer;margin:2px">${esc(k.pname(p))}</button>`).join('') + '</div>' : `<div class="src" style="margin-top:6px">Nothing that can be made on ${esc(r)} matches.</div>`) : '');
      gmAt = h.length;
    }
    const f = (P.mfind || '').trim().toLowerCase();
    // the whole chain for each pick (Mark, 19 Nov): every ingredient down to what's mined, coloured by how many steps
    // down it is (game palette, theme.js); something used by more than one process gets one dot per use, and a striped
    // bar in step 4. Step 4 then lists only what's needed.
    const LV = ['#57ff65', '#36a7cd', '#884fff', '#ff8c1a', '#e0282e', '#ffd94f', '#88e675', '#4f90ff'], lc = (d) => LV[(d - 1) % LV.length];
    const stopAt = new Set(IMB ? mineGet() : []), rows = {}, need = new Map();
    P.gm.forEach((top) => {
      const out = rows[top] = [];
      const walk = (p, path, d) => {
        const go = !stopAt.has(p) && !k.canMine(p) && rOf(p).length && !path.includes(p) && d < 9;
        out.push({ p, d, x: go ? pickR(p) : null, key: path.concat(p).join('-'), par: path.join('-') }); if (!need.has(p)) need.set(p, []); need.get(p).push(d);
        if (go) { const x = pickR(p); Object.keys(x.inp).forEach((ip) => walk(+ip, path.concat(p), d + 1)); }
      };
      const x = pickR(top); if (x) Object.keys(x.inp).forEach((ip) => walk(+ip, [top], 1));
    });
    const dot = (d) => `<span title="${d} step${d > 1 ? 's' : ''} down" style="display:inline-block;width:11px;height:11px;border-radius:50%;background:${lc(d)};margin-right:3px;vertical-align:middle"></span>`;
    const dots = (p) => (need.get(p) || []).map(dot).join('');
    const bar = (p) => { const u = need.get(p) || []; if (u.length < 2) return lc(u[0]); return 'linear-gradient(' + u.map((d, j) => `${lc(d)} ${j * 100 / u.length}% ${(j + 1) * 100 / u.length}%`).join(',') + ')'; };
    // how much the most you could make would really use (Mark, 19 Nov: "Tungsten Powder will never use that much water
    // or oxygen") – the planner run at MAX for each pick, minus what's already in the storage it goes to
    let gneed = {};
    P.gq = P.gq || {};
    // modules and other counted items: units, or a weight turned into whole units (Mark, 21 Nov)
    const gqty = (p) => { const x = P.gq[p]; if (!x || !(+x.q > 0)) return 0; if (k.bulk(+p)) return x.unit === 'units' ? Math.floor(+x.q) : Math.round(+x.q * UNITS[x.unit || 't']); /* 1 unit of a bulk item = 1 kg */ const u = x.unit || 'units'; return u === 'units' ? Math.floor(+x.q) : Math.floor(+x.q * UNITS[u] * 1000 / k.grams(+p)); };
    const typed = P.gm.some((p) => gqty(p) > 0), nLbl = typed ? 'Needed' : 'Used at MAX';
    if (P.gm.length) {
      // how many to make (Mark, 21 Nov – TEST ONLY, ?beta=1): a typed amount per pick, else MAX
      const key = r + '|' + P.gm.join(',') + '|' + P.mdest + '|' + (S.msg || '').length + '|' + JSON.stringify(P.gq);
      if (P.gnk !== key) {
        P.gnv = {}; P.gmax = {}; P.gshort = {};
        P.gm.forEach((p) => {
          const mx = P.gmax[p] = maxMake(p).q, amt = gqty(p) || mx; if (!(amt > 0)) return;
          const W = work(p, amt); Object.keys(W.stock).forEach((ip) => { if (+ip !== p) P.gnv[ip] = (P.gnv[ip] || 0) + W.stock[ip]; });
          if (gqty(p)) P.gshort[p] = Object.keys(W.fly).concat(Object.keys(W.mine)).map(Number);
        });
        P.gnk = key;
      }
      gneed = P.gnv || {};
    }
    const useAmt = (p) => Math.max(0, Math.min(tot(p), (gneed[p] || 0) - inDest(p)));
    const setQ = (p, n) => { if (k.bulk(p)) { const u = n >= 1e6 ? 'kt' : n >= 1000 ? 't' : 'kg'; P.mq[p] = { q: Math.ceil(n / UNITS[u] * 1000) / 1000, unit: u }; } else P.mq[p] = { q: n }; };
    const prods = Object.keys(stock).map(Number).filter((p) => (!need.size || need.has(p)) && (!f || k.pname(p).toLowerCase().includes(f))).sort((a, b) => Math.min(...(need.get(a) || [99])) - Math.min(...(need.get(b) || [99])) || !!want(b) - !!want(a) || k.pname(a).localeCompare(k.pname(b)));
    h += `<div class="card"><h2><span class="n">${4}</span>What to move</h2><div class="src" style="margin-bottom:8px">${need.size ? 'Only what your picks in step 3 need, from the other storage on ' + esc(r) + '.' : 'Everything in the other storage on ' + esc(r) + '.'} Type how much of each to move, or press ALL.</div>` +
      `<input type="search" id="pp-mfind" placeholder="🔍 Search…" value="${esc(P.mfind || '')}">` +
      (prods.length ? `<table style="margin-top:8px"><thead><tr><th>Item</th><th class="num">In stock</th>${need.size ? '<th class="num">' + nLbl + '</th>' : ''}<th>Move</th></tr></thead><tbody>` + prods.map((p) => {
        const x = P.mq[p] || {}, bulk = k.bulk(p), no = tank && !k.TANKOK.has(p);
        const nd = need.has(p), uses = (need.get(p) || []).length;
        return `<tr${nd ? ` style="background:#ffffff08"` : ''}><td${nd ? ` style="position:relative;padding-left:16px"` : ''}>${nd ? `<span style="position:absolute;left:0;top:4px;bottom:4px;width:6px;border-radius:3px;background:${bar(p)}"></span>` + dots(p) + ' <b>' + esc(k.pname(p)) + '</b>' + (uses > 1 ? ` <span class="src">· used in ${uses} processes</span>` : '') : esc(k.pname(p))}${no ? ' <span class="src" style="color:var(--amber)">· not a fluid</span>' : ''}</td><td class="num">${k.amt(p, tot(p))}</td>${need.size ? `<td class="num">${useAmt(p) > 0 ? k.amt(p, useAmt(p)) + ` <button type="button" class="dk-shipbtn" data-muse="${p}" style="cursor:pointer;padding:1px 6px">USE</button>` : '<span class="src">' + (gneed[p] ? 'already there' : '–') + '</span>'}</td>` : ''}<td><div class="row" style="gap:6px;margin:0"><input type="number" min="0" step="any" data-mq="${p}" value="${esc(x.q || '')}" placeholder="0"${no ? ' disabled' : ''}>` +
          (bulk ? `<select data-mu="${p}" style="min-width:0">${Object.keys(UNITS).map((u) => `<option${u === (x.unit || 't') ? ' selected' : ''}>${u}</option>`).join('')}</select>` : '<span class="src" style="display:inline-block;min-width:4.2em">units</span>') +
          `<button type="button" class="dk-shipbtn" data-mall="${p}" style="cursor:pointer"${no ? ' disabled' : ''}>ALL</button></div></td></tr>`;
      }).join('') + '</tbody></table>' : `<div class="src" style="margin-top:8px">${f ? 'Nothing matches.' : 'Nothing else in storage on ' + esc(r) + '.'}</div>`) + '</div>';
    // step 4: the moves – nearest storage to the destination first; fills it to 95% at most
    S.calls = []; S.startList = []; S.feed = false; S.srcRock = r;
    const picked = Object.keys(P.mq).map(Number).filter((p) => want(p) > 0 && !(tank && !k.TANKOK.has(p)));
    if (dest && picked.length) {
      const cl = k.crews(r);
      if (!cl.find((c) => c.id === S.mover)) S.mover = (cl[0] || {}).id || 0; // best free crew first (hub's own order)
      S.moverObj = cl.find((c) => c.id === S.mover);
      const cp = CAP[dest.Building.buildingType], u = used(dest);
      let fg = cp[0] * 0.95 - u[0], fv = cp[1] * 0.95 - u[1], cut = false; const mv = {};
      picked.forEach((p) => {
        let n = Math.min(want(p), Math.floor(fg / g(p)), Math.floor(fv / v(p))); if (n < want(p)) cut = true; if (n <= 0) return;
        fg -= n * g(p); fv -= n * v(p);
        stock[p].map(([b, hv]) => [b, hv, k.kmBetween(k.lotOf(b), k.lotOf(dest), ast) ?? 1e9]).sort((a, b) => a[2] - b[2]).forEach(([b, hv]) => {
          if (n <= 0) return; const q = Math.min(n, hv); n -= q; (mv[b.id] = mv[b.id] || { b, items: [] }).items.push([p, q]);
        });
      });
      S.calls = Object.keys(mv).map((id) => ({ from: +id, to: dest.id, items: mv[id].items }));
      const lg = S.calls.reduce((t, c) => t + c.items.reduce((s2, [p, a]) => s2 + a * g(p), 0), 0);
      const after = Math.round(Math.max((u[0] + lg) / cp[0], (u[1] + S.calls.reduce((t, c) => t + c.items.reduce((s2, [p, a]) => s2 + a * v(p), 0), 0)) / cp[1]) * 100);
      // feed the moving crew first (Mark, 21 Nov – TEST ONLY, ?beta=1): same amount and source as Production's feed step –
      // a year's food at most, from the biggest Food stock on this rock; goes first in the same approval (dock.js S.feedCalls)
      S.feedCalls = [];
      const mFeed = () => {
        const c = S.moverObj; if (!c || c.food >= 0.95) return '';
        const food = {}; k.onRock().filter(k.isStore).forEach((b) => { food[b.id] = ((k.inv(b) || { contents: [] }).contents || []).reduce((t, z) => t + (z.product === 129 ? z.amount : 0), 0); });
        const need = Math.max(0, c.mates * 1000 - Math.ceil(c.mates * 1000 * c.food)); /* game's limit: max food - current food (as crewfeed.js; over it = E6030 food limit reached) */
        const sid = Object.keys(food).filter((id) => food[id] > 0).sort((a, b) => food[b] - food[a])[0], src = sid && k.onRock().find((b) => b.id === +sid);
        const fd = src && need > 0 ? { src: src.id, give: Math.min(need, food[sid]), crew: c.id } : null;
        if (fd && P.mfeed) S.feedCalls = [fd];
        return `<div style="margin-top:8px;padding:8px 12px;border-radius:8px;background:#3fd68a12;border:1px solid #3fd68a55"><div style="color:var(--amber);margin-bottom:4px">${c.food < 0.5 ? '⚠ ' + esc(c.name) + ' is hungry – moves will be slower.' : esc(c.name) + ' is ' + Math.round(c.food * 100) + '% fed.'}</div>` +
          (fd ? `<label style="margin:0"><input type="checkbox" id="pp-mfeed"${P.mfeed ? ' checked' : ''}> Feed ${esc(c.name)} first: ${k.tonnes(fd.give)} Food from ${esc(k.nm(src))}</label>` : '<div class="src">No Food stored on this rock to feed it.</div>') + '</div>';
      };
      const crewTxt = (c) => esc(c.name) + (c.busy ? ' – busy until ' + esc(c.busy) : ' – ready') + (c.food < 0.5 ? ' – food ' + Math.round(c.food * 100) + '% (hungry, slower)' : '');
      h += `<div class="card"><h2><span class="n">${5}</span>Move it</h2>` + (!S.calls.length ? `<div class="src" style="color:var(--amber)">⚠ Nothing fits – ${esc(k.nm(dest))} is full. Pick another storage.</div>` :
        `<div class="src">These moves put <b>${k.tonnes(lg / 1000)}</b> into ${esc(k.nm(dest))} (${Math.round(full(dest) * 100)}% → <b>${after}%</b> full):</div>` +
        (cut ? `<div class="src" style="margin-top:4px;color:var(--amber)">⚠ Not all of it fits – ${esc(k.nm(dest))} takes what it has room for (up to 95%).</div>` : '') +
        `<div style="margin:6px 0 0 4px;padding-left:12px;border-left:2px solid #ffb03b55">` + Object.keys(mv).map((id) => { const km = k.kmBetween(k.lotOf(mv[id].b), k.lotOf(dest), ast); return `<div style="margin:6px 0"><b>${esc(k.nm(mv[id].b))}</b> → 🗄 ${esc(k.nm(dest))}${km != null ? ' <span class="src">· ' + k.kmTxt(km) + '</span>' : ''}` +
          mv[id].items.map(([p, a]) => `<div class="src" style="margin-left:16px">└ ${esc(k.pname(p))} <b>${k.amt(p, a)}</b></div>`).join('') + '</div>'; }).join('') + '</div>' +
        (cl.length ? `<div class="row" style="margin-top:6px"><span class="src">Crew doing the moving</span><select id="pp-mcrew">${cl.map((c) => `<option value="${c.id}"${c.id === S.mover ? ' selected' : ''}>${crewTxt(c)}</option>`).join('')}</select></div>` +
          mFeed() : `<div class="src" style="color:var(--red)">No crew on ${esc(r)} to do the moving.</div>`) +
        `<button class="approve" id="pp-mgo" style="margin-top:10px"${cl.length && !S.busy ? '' : ' disabled'}>${S.busy ? 'WAITING FOR YOUR WALLET…' : 'APPROVE IN WALLET (move to ' + esc(k.nm(dest)) + ')'}</button>` +
        `<div class="hint">Your wallet will ask you to approve these moves. Nothing happens in the game until you do.</div>` +
        `<div id="dk-msg" class="hint" style="display:${S.msg ? 'block' : 'none'};margin-top:10px;padding:10px 12px;border-radius:8px;border:1px solid ${S.msgErr ? '#ff4d4d88' : '#8fe3ff55'};color:${S.msgErr ? '#ffb3ae' : 'var(--ink)'}">${S.msg || ''}</div>`) + '</div>';
    }
    if (gmAt >= 0) {
      const moved = {}; S.calls.forEach((c) => c.items.forEach(([p, a]) => { moved[p] = (moved[p] || 0) + a; }));
      const recLine = (p, x, rs, pad) => `<div class="src" style="margin:2px 0 2px ${pad}px">` + (rs.length > 1 ? `<select data-grec="${p}" style="min-width:0">${rs.map((y) => `<option value="${y.i}"${y === x ? ' selected' : ''}>${esc(y.name)}</option>`).join('')}</select>` : '⚙ ' + esc(x.name)) + '</div>';
      const legend = [...new Set([].concat(...[...need.values()]))].sort((a, b) => a - b).map((d) => dot(d) + `<span class="src" style="margin-right:10px">${d} step${d > 1 ? 's' : ''} down</span>`).join('');
      const gh = P.gm.map((p) => {
        const x = pickR(p), rs = rOf(p), a = makes(p, x, allOn), b = makes(p, x, (ip) => inDest(ip) + (moved[ip] || 0));
        return `<div style="margin:8px 0;padding:8px 10px;border:1px solid #ffb03b44;border-radius:8px"><b>${esc(k.pname(p))}</b> <button type="button" class="dk-shipbtn" data-gdel="${p}" style="cursor:pointer;padding:1px 6px">✕</button>` +
          recLine(p, x, rs, 0) +
          (() => { const q = P.gq[p] || {}, sh = (P.gshort || {})[p] || []; return `<div class="row" style="gap:6px;margin:6px 0"><span class="src">How many to make</span><input type="number" min="0" step="any" data-gq="${p}" value="${esc(q.q || '')}" placeholder="MAX" style="width:8em">` +
            (k.bulk(p) ? `<select data-gqu="${p}" style="min-width:0">${['units'].concat(Object.keys(UNITS)).map((u) => `<option${u === (q.unit || 't') ? ' selected' : ''}>${u}</option>`).join('')}</select>` : `<select data-gqu="${p}" style="min-width:0">${['units'].concat(Object.keys(UNITS)).map((u) => `<option${u === (q.unit || 'units') ? ' selected' : ''}>${u}</option>`).join('')}</select>`) +
            `<button type="button" class="dk-shipbtn" data-gqmax="${p}" style="cursor:pointer">MAX</button>` +
            (!k.bulk(p) && q.unit && q.unit !== 'units' && gqty(p) > 0 ? `<span class="src">= <b>${k.amt(p, gqty(p))}</b></span>` : '') + '</div>' +
            (sh.length ? `<div class="src" style="color:var(--amber)">⚠ Not enough on ${esc(r)} for that many – short of ${sh.slice(0, 3).map((z) => esc(k.pname(z))).join(', ')}.</div>` : ''); })() +
          `<div class="src">Most from all the stock on ${esc(r)}: <b>${k.amt(p, a.q)}</b>${a.lim != null ? ' – ' + esc(k.pname(a.lim)) + ' runs out first' : ''}</div>` +
          `<div class="src">With what’s in ${dest ? esc(k.nm(dest)) : 'the storage'} after these moves: <b>${k.amt(p, b.q)}</b></div>` +
          `<details class="dkp-fold" data-gch="${p}"${(P.gopen || {})[p] ? ' open' : ''} style="margin-top:6px"><summary>Show the chain (${(rows[p] || []).length} items)</summary>` + (() => { P.gx = P.gx || {}; const shown = {}; shown[String(p)] = true; return (rows[p] || []).map((z) => {
            if (!shown[z.par]) return ''; shown[z.key] = !!(z.x && P.gx[z.key]);
            return `<div style="margin:3px 0 3px ${(z.d - 1) * 18}px;padding-left:8px;border-left:3px solid ${lc(z.d)}"><span class="src">${dot(z.d)}<b>${esc(k.pname(z.p))}</b> · ${k.amt(z.p, allOn(z.p))} on ${esc(r)}${(need.get(z.p) || []).length > 1 ? ' · <i>also used elsewhere</i>' : ''}</span>` +
              (z.x ? ` <button type="button" class="dk-shipbtn" data-gx="${esc(z.key)}" style="cursor:pointer;padding:1px 6px">${shown[z.key] ? '▾ hide' : '▸ how it’s made'}</button>` + (shown[z.key] ? recLine(z.p, z.x, rOf(z.p), 0).replace('margin:2px 0 2px 0px', 'margin:1px 0 0 16px') : '') : '') + '</div>';
          }).join(''); })() + '</details></div>';
      }).join('');
      P.gtree = [...need.keys()].filter((p) => !P.gm.includes(p));
      const card = (gh ? (legend ? `<div style="margin:8px 0 2px">${legend}</div>` : '') + gh +
        `<div class="row" style="gap:8px;margin-top:6px"><button type="button" class="dk-shipbtn" id="pp-gneed" style="cursor:pointer">${typed ? 'MOVE WHAT’S NEEDED' : 'MOVE WHAT MAX USES'}</button><button type="button" class="dk-shipbtn" id="pp-gall" style="cursor:pointer">MOVE ALL THE INGREDIENTS</button></div><div class="hint">${typed ? 'Needed = what making the amounts above would use' : 'MAX uses = what the most you can make from the stock here would use'} (the planner’s own recipe picks). Change any amount in step 4.</div>` : '') + '</div>';
      h = h.slice(0, gmAt) + card + h.slice(gmAt);
    }
    m.innerHTML = h;
    const on = (id, ev, fn) => { const e = m.querySelector('#' + id); if (e) e.addEventListener(ev, fn); };
    on('pp-mr', 'change', (e) => { S.rock = e.target.value; P.mdest = 0; P.mq = {}; P.gm = []; P.gr = {}; P.gq = {}; S.msg = ''; k.render(); });
    on('pp-md', 'change', (e) => { P.mdest = +e.target.value; S.msg = ''; k.render(); });
    on('pp-mfind', 'input', (e) => { P.mfind = e.target.value; const pos = e.target.selectionStart; k.render(); const n = document.getElementById('pp-mfind'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } });
    m.querySelectorAll('[data-mq]').forEach((e) => e.addEventListener('change', () => { const p = e.dataset.mq; P.mq[p] = Object.assign(P.mq[p] || {}, { q: e.value }); k.render(); }));
    m.querySelectorAll('[data-mu]').forEach((e) => e.addEventListener('change', () => { const p = e.dataset.mu; P.mq[p] = Object.assign(P.mq[p] || {}, { unit: e.value }); k.render(); }));
    m.querySelectorAll('[data-mall]').forEach((e) => e.addEventListener('click', () => {
      const p = +e.dataset.mall, n = tot(p);
      if (k.bulk(p)) { const u = n >= 1e6 ? 'kt' : n >= 1000 ? 't' : 'kg'; P.mq[p] = { q: Math.floor(n / UNITS[u] * 1000) / 1000, unit: u }; } else P.mq[p] = { q: n };
      k.render();
    }));
    on('pp-mcrew', 'change', (e) => { S.mover = +e.target.value; P.mfeed = false; k.render(); });
    on('pp-mfeed', 'change', (e) => { P.mfeed = e.target.checked; k.render(); });
    on('pp-mgo', 'click', () => k.approve());
    on('pp-gfind', 'input', (e) => { P.gfind = e.target.value; const pos = e.target.selectionStart; k.render(); const n = document.getElementById('pp-gfind'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } });
    m.querySelectorAll('[data-gadd]').forEach((b) => b.addEventListener('click', () => { P.gm.push(+b.dataset.gadd); P.gfind = ''; k.render(); }));
    m.querySelectorAll('[data-gq]').forEach((e) => e.addEventListener('change', () => { const p = e.dataset.gq; P.gq[p] = Object.assign(P.gq[p] || {}, { q: e.value }); k.render(); }));
    m.querySelectorAll('[data-gqu]').forEach((e) => e.addEventListener('change', () => { const p = e.dataset.gqu; P.gq[p] = Object.assign(P.gq[p] || {}, { unit: e.value }); k.render(); }));
    m.querySelectorAll('[data-gqmax]').forEach((b) => b.addEventListener('click', () => { const p = +b.dataset.gqmax, n = (P.gmax || {})[p] || 0;
      if (k.bulk(p)) { const u = n >= 1e6 ? 'kt' : n >= 1000 ? 't' : 'kg'; P.gq[p] = { q: Math.floor(n / UNITS[u] * 1000) / 1000, unit: u }; } else P.gq[p] = { q: n, unit: 'units' }; k.render(); }));
    m.querySelectorAll('[data-gdel]').forEach((b) => b.addEventListener('click', () => { P.gm = P.gm.filter((p) => p !== +b.dataset.gdel); delete P.gq[b.dataset.gdel]; k.render(); }));
    m.querySelectorAll('[data-grec]').forEach((e) => e.addEventListener('change', () => { P.gr[e.dataset.grec] = +e.value; k.render(); }));
    m.querySelectorAll('[data-gch]').forEach((d) => d.addEventListener('toggle', () => { P.gopen = P.gopen || {}; P.gopen[d.dataset.gch] = d.open; }));
    m.querySelectorAll('[data-gx]').forEach((b) => b.addEventListener('click', () => { const key = b.dataset.gx; if (P.gx[key]) delete P.gx[key]; else P.gx[key] = 1; k.render(); }));
    on('pp-gneed', 'click', () => { P.mq = {}; Object.keys(gneed).map(Number).forEach((p) => { const n = useAmt(p); if (n > 0 && !(tank && !k.TANKOK.has(p))) setQ(p, n); }); k.render(); });
    m.querySelectorAll('[data-muse]').forEach((b) => b.addEventListener('click', () => { const p = +b.dataset.muse; setQ(p, useAmt(p)); k.render(); }));
    on('pp-gall', 'click', () => {
      (P.gtree || []).forEach((p) => { const n = tot(p); if (!n || (tank && !k.TANKOK.has(p))) return;
        if (k.bulk(p)) { const u = n >= 1e6 ? 'kt' : n >= 1000 ? 't' : 'kg'; P.mq[p] = { q: Math.floor(n / UNITS[u] * 1000) / 1000, unit: u }; } else P.mq[p] = { q: n }; });
      k.render();
    });
  }
  function finish(m, h) {
    const k = K(), S = k.S;
    m.innerHTML = h;
    const sh = m.querySelector('#pp-ship');
    if (sh && P.shipItems) cargoPanel(sh, P.shipItems);
    const on = (id, ev, fn) => { const e = m.querySelector('#' + id); if (e) e.addEventListener(ev, fn); };
    m.querySelectorAll('[data-cmode]').forEach((b) => b.addEventListener('click', () => { P.cmode = b.dataset.cmode; S.msg = ''; k.render(); }));
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
    on('pp-go', 'click', async () => { const snap = P.snap; S.msg = ''; await k.approve(); if (snap && sent()) { noteStarts(snap, S.batchStart); savePlan(snap); P.track = snap.id; k.render(); } });
    on('pp-tgo', 'click', async () => { const id = P.track; S.msg = ''; await k.approve(); if (sent()) { const pl = plansGet().find((x) => x.id === id); if (pl) { noteStarts(pl, S.batchStart); savePlan(pl); } k.render(); } });
    on('pp-trun', 'change', (e) => { P.runner = +e.target.value; k.render(); });
    on('pp-back', 'click', () => { P.track = ''; S.msg = ''; k.render(); });
    m.querySelectorAll('[data-track]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); P.track = b.dataset.track; S.msg = ''; k.render(); }));
    m.querySelectorAll('[data-ppforget]').forEach((b) => b.addEventListener('click', () => { plansPut(plansGet().filter((x) => x.id !== b.dataset.ppforget)); k.render(); }));
    m.querySelectorAll('[data-for]').forEach((b) => b.addEventListener('click', () => { P.for = b.dataset.for; k.render(); }));
    { const fs = m.querySelector('#pp-fship'); if (fs) fs.addEventListener('change', () => { P.fship = +fs.value; k.render(); }); }
    m.querySelectorAll('select[data-st]').forEach((e) => e.addEventListener('change', () => { const all = storesGet(), r = (all[S.rock] = all[S.rock] || {}); r[e.dataset.st] = e.value ? +e.value : ''; storesPut(all); k.render(); }));
    m.querySelectorAll('[data-pp]').forEach((b) => b.addEventListener('click', () => { P.p = +b.dataset.pp; P.use = ''; P.q = k.bulk(P.p) ? 100 : 1; P.unit = 't'; k.render(); }));
    on('pp-use', 'change', (e) => { P.use = e.target.value; P.n = 1; fillFor(); k.render(); });
    on('pp-n', 'change', (e) => { P.n = e.target.value; fillFor(); k.render(); });
    on('pp-u', 'change', (e) => { P.unit = e.target.value; k.render(); });
    m.querySelectorAll('[data-pick]').forEach((e) => e.addEventListener('change', () => { if (e.checked) delete P.noStart[e.dataset.pick]; else P.noStart[e.dataset.pick] = 1; k.render(); }));
    m.querySelectorAll('[data-illmine]').forEach((b) => b.addEventListener('click', () => { const n = mineGet(), p = +b.dataset.illmine; if (!n.includes(p)) n.push(p); minePut(n); P.maxTxt = ''; k.render(); }));
    m.querySelectorAll('[data-mkagain]').forEach((b) => b.addEventListener('click', () => { minePut(mineGet().filter((x) => x !== +b.dataset.mkagain)); P.maxTxt = ''; k.render(); }));
  }

  window.YICPROD = { render, work, planStatus, maxMake, store: storePage };
})();
