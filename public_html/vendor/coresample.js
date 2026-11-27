/* 🧪 Core samples – Logistics Hub (Mark, 27 Nov 2026) – TEST ONLY (?beta=1)
   "We have set up the mining in the Logistics hub. Can you now set up taking core samples?"
   Sits next to ⛏ Mining on the Production screen. Two jobs, one approval:
   1. FINISH samples that are ready (being taken, finish time passed) – they then show up in ⛏ Mining.
   2. TAKE new samples on the lots of your extractors that have no sample with yield left (and none being taken).
      Pick a resource at the top (e.g. Pyroxene) → every extractor lot with some Pyroxene gets that resource, all ticked.
      Otherwise each lot defaults to its richest resource (Mark, 27 Nov 19:30), shown under the lot as "Richest here".

   Game calls (@influenceth/sdk 2.8.1):
     SampleDepositStart(lot, resource, origin, origin_slot, caller_crew) → [4, lot, resource, 5, store, slot, 1, crew]
       (uses up one Core Drill, product 175, from the origin storage – nearest storage on the rock that has one)
     SampleDepositFinish(deposit, caller_crew) → [7, deposit, 1, crew] (the crew that controls the sample)
   Sample time: Deposit.CORE_SAMPLING_TIME 86,400 game s = 1 real hour (÷ 24), without crew bonuses.
   Crew time counted as trip there + the whole sample hour + trip back – a safe over-estimate – inside the game's 24 h
   queue rule (same as ⛏ Mining). Lot richness: vendor/abund.js (the game's own maths, as Lot resources).
   Samples come from samples.php?core=1. Nothing is sent until the player presses Approve AND approves in the wallet. */
(function () {
  'use strict';
  if (!/[?&]beta=1\b/.test(location.search)) return;
  const K = () => window.YICDOCK, Y = () => window.YIC || {};
  const DRILL = 175, SAMPLE_SECS = 3600;
  const M = { rock: '', res: 0, pick: {}, rsel: {}, drill: {}, crew: {}, fin: {}, busy: false, msg: '', msgErr: false, samp: null, sampAt: 0, err: '', ab: {} };
  const now = () => Date.now() / 1000;
  const when = (t) => new Date(t * 1000).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const lotIdx = (id) => Math.floor(id / 4294967296);
  const astOfLot = (id) => id % 4294967296;

  function loadSamples(force) {
    const d = K().D() || {};
    if (!force && M.samp && Date.now() - M.sampAt < 300000) return Promise.resolve();
    if (M.loading) return M.loading;
    M.loading = fetch('samples.php?core=1&wallet=' + encodeURIComponent(d.wallet || ''), { cache: 'no-store' })
      .then((r) => r.json()).then((j) => { if (j.error) throw new Error(j.error); M.samp = j.rows || []; M.sampAt = Date.now(); M.err = ''; })
      .catch((e) => { M.err = 'Couldn’t read your core samples: ' + ((e && e.message) || e); })
      .finally(() => { M.loading = null; });
    return M.loading;
  }
  function loadMaths() {
    const y = Y();
    if (y.ABM) return Promise.resolve();
    return import('./abund.js?v=' + (y.VER || 1)).then((x) => { y.ABM = x; }).catch((e) => { M.err = 'Couldn’t load the resource maths: ' + ((e && e.message) || e); });
  }
  // the asteroid's scanned abundances, or null
  function celestial(ast) { const a = ((K().D() || {}).owned || []).find((x) => x.id === ast); const c = a && a.Celestial; return c && c.abundances && (c.scanStatus || 0) >= 4 ? c : null; }
  // resources on a lot, richest first: [[resource, fraction 0–1], …]
  function lotRes(ast, lot) {
    const y = Y(), c = celestial(ast); if (!c || !y.ABM) return [];
    const all = y.ABM.abundances(c.abundances), n = y.ABM.lotCount(ast), out = [];
    Object.keys(all).map(Number).filter((r) => all[r] > 0).forEach((r) => {
      // one lot at a time (abund.js lotOne, added 27 Nov) – a whole-rock lotsFor per resource is too slow on big rocks
      const k = ast + '_' + lot + '_' + r; if (M.ab[k] == null) M.ab[k] = y.ABM.lotOne ? y.ABM.lotOne(ast, c.abundances, r, n, lot) : (y.ABM.lotsFor(ast, c.abundances, r, n)[lot] || 0);
      const v = M.ab[k] || 0; if (v > 0.0005) out.push([r, v]);
    });
    return out.sort((a, b) => b[1] - a[1]);
  }

  // extractor lots with no sample left to mine and none being taken
  function list() {
    const k = K(), samp = M.samp || [], out = [];
    // every extractor lot is listed (Mark, 27 Nov 19:32: "only showing me 1 extractor") – ones with a sample still to
    // mine or one being taken say so and start unticked
    const seen = new Set();
    k.allB().forEach((b) => {
      if (!b.Building || b.Building.status !== 3 || !(b.Extractors || []).length) return;
      const rock = k.rockOf(b), ast = k.astId(rock), lot = k.lotOf(b), ent = lot * 4294967296 + ast;
      if (!ast || !lot || seen.has(ent)) return;
      seen.add(ent);
      const idle = (b.Extractors || []).some((x) => x.status === 0);
      const last = samp.filter((r) => r[3] === ent).sort((a, c) => c[0] - a[0])[0];
      const left = samp.filter((r) => r[3] === ent && (r[6] === 2 || r[6] === 3) && r[2] > 0 && !r[5]);
      const taking = samp.filter((r) => r[3] === ent && r[6] === 1);
      out.push({ b, rock, ast, lot, ent, idle, left, taking, free: !left.length && !taking.length, last: last ? last[1] : 0, res: lotRes(ast, lot) });
    });
    return out.sort((a, c) => ((c.idle && c.free) - (a.idle && a.free)) || (c.free - a.free) || (c.idle - a.idle) || a.rock.localeCompare(c.rock) || k.nm(a.b).localeCompare(k.nm(c.b)));
  }
  function count() { if (M.err) return 0; if (!M.samp) return null; return M.samp.filter((r) => r[6] === 1 && r[7] && r[7] <= now() && K().crewReady({ id: r[8] }) <= now() + 86400).length + list().filter((e) => e.idle && e.free).length; }

  function render(host) {
    const k = K(), esc = k.esc;
    if ((!M.samp || !Y().ABM) && !M.err) { host.innerHTML = '<div class="card"><div class="src">Reading your core samples…</div></div>'; Promise.all([loadSamples(), loadMaths()]).then(() => k.render()); return; }
    const all = list();
    // samples being taken: ready to finish, or still going
    const mineCrew = new Set(((k.D() || {}).crewList || []).map((c) => c.id));
    const taking = (M.samp || []).filter((r) => r[6] === 1);
    const ready = taking.filter((r) => r[7] && r[7] <= now() && mineCrew.has(r[8]));
    const going = taking.filter((r) => !(r[7] && r[7] <= now()));
    const crewNm = (id) => ((((k.D() || {}).crewList) || []).find((c) => c.id === id) || {}).name || 'crew #' + id;

    const rl = [...new Set(all.map((e) => e.rock))].sort();
    if (M.rock && !rl.includes(M.rock)) M.rock = '';
    const rows0 = all.filter((e) => !M.rock || e.rock === M.rock);
    const rc = {}; rows0.forEach((e) => e.res.forEach(([r]) => { rc[r] = (rc[r] || 0) + 1; }));
    const rlist = Object.keys(rc).map(Number).sort((a, c) => k.pname(a).localeCompare(k.pname(c)));
    if (M.res && !rc[M.res]) M.res = 0;
    const rows1 = M.res ? rows0.filter((e) => e.res.some(([r]) => r === M.res)) : rows0;

    let h = `<div class="card"><h2><span class="n">🧪</span>Core samples</h2><div class="src">Finish samples that are ready, and take new ones on your extractors’ lots that have nothing left to mine. Each new sample uses one Core Drill from storage on the same rock and takes about an hour.</div>` +
      (M.err ? `<div class="src" style="color:var(--red);margin-top:8px">${esc(M.err)}</div>` : '') +
      (rl.length > 1 ? `<div class="row" style="margin-top:10px"><span class="src">Asteroid</span><select id="cs-rock"><option value="">All asteroids</option>${rl.map((r) => `<option${r === M.rock ? ' selected' : ''}>${esc(r)}</option>`).join('')}</select></div>` : '') +
      (rlist.length ? `<div class="row" style="margin-top:10px"><span class="src">Resource</span><select id="cs-res"><option value="0">Each lot’s own pick</option>${rlist.map((p) => `<option value="${p}"${p === M.res ? ' selected' : ''}>${esc(k.pname(p))} · ${rc[p]} lot${rc[p] === 1 ? '' : 's'}</option>`).join('')}</select></div>` : '') + '</div>';

    // 1. finish the ready ones
    const fcalls = [];
    // E6009 "crew resting" (Mark, 27 Nov 20:48) – one refused call fails the whole approval. The game DOES let a busy crew
    // finish a sample (Mark 20:52, in game), so the rule is the usual 24 h queue: crew readyAt ≤ now + 24 h. So only free crews' samples
    // are ticked; the rest wait, grouped by crew with the time it's free.
    const rdy = (id) => k.crewReady({ id });
    const canFin = ready.filter((r) => rdy(r[8]) <= now() + 86400);
    const wait = ready.filter((r) => rdy(r[8]) > now() + 86400);
    const byCrew = {}; wait.forEach((r) => { (byCrew[r[8]] = byCrew[r[8]] || []).push(r); });
    if (ready.length || going.length) {
      h += `<div class="card"><h2><span class="n">1</span>Finish samples (${canFin.length} ready${wait.length ? ', ' + wait.length + ' waiting for their crew' : ''})</h2>` +
        canFin.map((r) => {
          if (M.fin[r[0]] == null) M.fin[r[0]] = true;
          if (M.fin[r[0]]) fcalls.push({ dep: r[0], crew: r[8], lot: r[3] });
          return `<label style="display:block;margin:4px 0"><input type="checkbox" data-cfin="${r[0]}"${M.fin[r[0]] ? ' checked' : ''}> <b>${esc(k.pname(r[1]))}</b> on ${esc(r[4])} lot ${lotIdx(r[3])} · ${esc(crewNm(r[8]))}</label>`;
        }).join('') +
        Object.keys(byCrew).map((id) => `<div class="src" style="margin-top:6px;color:var(--amber)">${esc(crewNm(+id))} ’s queue is over 24 h until about ${when(rdy(+id) - 86400)} – ${byCrew[id].length} sample${byCrew[id].length === 1 ? '' : 's'} to finish then</div>`).join('') +
        (going.length ? `<div class="src" style="margin-top:6px">Still being taken: ${going.length} sample${going.length === 1 ? '' : 's'}${going.some((r) => r[7]) ? ', last one ready about ' + when(Math.max(...going.map((r) => r[7] || 0))) : ''}</div>` : '') +
        '<div class="hint">A finished sample shows its yield and turns up in ⛏ Mining, ready to mine.</div></div>';
    }

    // 2. new samples: resource, Core Drill storage, crew
    const drillsLeft = {}, Q = {}, calls = [], rows = [];
    rows1.forEach((e) => {
      const key = e.ent;
      if (M.pick[key] == null) M.pick[key] = e.idle && e.free;
      const has = (r) => e.res.some(([x]) => x === r);
      const r = (M.res && has(M.res) && M.res) || (has(M.rsel[key]) && M.rsel[key]) || (e.res[0] && e.res[0][0]) || 0; // richest on the lot (Mark, 27 Nov 19:30 – was last-sampled first)
      const ab = (e.res.find(([x]) => x === r) || [0, 0])[1];
      const stores = k.allB().filter((b) => k.isStore(b) && b.Building.status === 3 && k.rockOf(b) === e.rock && k.holds(b, DRILL) > 0);
      stores.forEach((b) => { if (drillsLeft[b.id] == null) drillsLeft[b.id] = Math.floor(k.holds(b, DRILL)); });
      const km = (b) => { const d = k.kmBetween(e.lot, k.lotOf(b), e.ast); return d == null ? 9e9 : d; };
      let st = stores.find((b) => b.id === M.drill[key] && drillsLeft[b.id] > 0) || stores.filter((b) => drillsLeft[b.id] > 0).sort((a, c) => km(a) - km(c))[0] || null;
      const cl = k.crews(e.rock);
      const cost = (c) => SAMPLE_SECS + 2 * (k.tripSecs(k.kmBetween(c.lot, e.lot, e.ast), c) || 0);
      const qEnd = (c) => Q[c.id] != null ? Q[c.id] : Math.max(now(), k.crewReady(c));
      const lim = now() + 86400;
      let crew = null, over = false;
      if (M.pick[key] && r && st) {
        const ch = cl.find((c) => c.id === M.crew[key]);
        if (ch) { crew = ch; over = qEnd(ch) > lim; }
        else crew = cl.filter((c) => qEnd(c) <= lim).sort((a, c) => (qEnd(a) + cost(a)) - (qEnd(c) + cost(c)))[0] || null;
        if (crew && !over) Q[crew.id] = qEnd(crew) + cost(crew);
      }
      const on = !!(M.pick[key] && r && st && crew && !over);
      if (on) { drillsLeft[st.id]--; calls.push({ e, r, st, crew }); }
      rows.push({ e, key, r, ab, st, stores, km, crew, cl, over, on });
    });
    if (rows.length) {
      const n0 = ready.length || going.length ? 2 : 1;
      h += `<div class="card"><h2><span class="n">${n0}</span>Take new samples (${rows.length} extractor lot${rows.length === 1 ? '' : 's'})</h2><div class="row" style="gap:8px;margin:0 0 8px"><button type="button" class="dk-shipbtn" id="cs-all" style="cursor:pointer">Select all</button><button type="button" class="dk-shipbtn" id="cs-none" style="cursor:pointer">Clear selected</button></div><table><thead><tr><th></th><th>Extractor lot</th><th>Sample for</th><th>Core Drill from</th><th>Crew</th></tr></thead><tbody>` +
        rows.map((x) => `<tr><td><input type="checkbox" data-cpick="${x.key}"${M.pick[x.key] ? ' checked' : ''}></td>` +
          `<td><b>${esc(k.nm(x.e.b))}</b><div class="src">${esc(x.e.rock)} · lot ${x.e.lot} · ${x.e.idle ? '<span style="color:var(--amber)">idle</span>' : 'still mining'}</div>${x.e.left.length ? `<div class="src">Sample to mine: ${x.e.left.map((r) => esc(k.pname(r[1])) + ' ' + k.tonnes(r[2])).join(', ')}</div>` : ''}${x.e.taking.length ? `<div class="src">Sample being taken: ${x.e.taking.map((r) => esc(k.pname(r[1]))).join(', ')}</div>` : ''}${x.e.res[0] ? `<div class="src" style="color:var(--cyan)">Richest here: <b>${esc(k.pname(x.e.res[0][0]))}</b> ${(x.e.res[0][1] * 100).toFixed(0)}%</div>` : ''}</td>` +
          `<td>${x.e.res.length ? `<select data-cres="${x.key}">${x.e.res.map(([p, v]) => `<option value="${p}"${p === x.r ? ' selected' : ''}>${esc(k.pname(p))} · ${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%${p === x.e.last ? ' (last time)' : ''}</option>`).join('')}</select>` : '<span class="src">no resource scan for this rock</span>'}</td>` +
          `<td>${x.stores.length ? `<select data-cdrill="${x.key}">${x.stores.map((b) => `<option value="${b.id}"${x.st && b.id === x.st.id ? ' selected' : ''}>${esc(k.nm(b))} · ${Math.floor(k.holds(b, DRILL))} drill${Math.floor(k.holds(b, DRILL)) === 1 ? '' : 's'} · ${k.kmTxt(x.km(b))}</option>`).join('')}</select>` + (M.pick[x.key] && !x.st ? '<div class="src" style="color:var(--amber)">all its Core Drills are used by the rows above</div>' : '') : `<span style="color:var(--amber)">no Core Drill on ${esc(x.e.rock)}</span>`}</td>` +
          `<td>${!x.cl.length ? `<span style="color:var(--amber)">no crew on ${esc(x.e.rock)}</span>` : `<select data-ccrew="${x.key}"><option value="">${M.pick[x.key] && x.st && !M.crew[x.key] ? (x.crew ? 'Auto – ' + esc(x.crew.name) : 'Auto – no crew has room') : 'Auto'}</option>${x.cl.map((c) => `<option value="${c.id}"${M.crew[x.key] === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select>` +
            (M.pick[x.key] && x.st && !x.crew ? '<div class="src" style="color:var(--amber)">every crew’s 24 h queue is full – take this one later</div>' : '') +
            (x.over ? `<div class="src" style="color:var(--red)">${esc(x.crew.name)}’s queue would go past 24 h</div>` : '')}</td></tr>`).join('') +
        '</tbody></table><div class="hint">The % is how rich the lot is in that resource (the game’s own maths). Idle extractors with no sample are ticked to start with. Ones that already have a sample to mine (or one being taken) are listed too, unticked – tick them to take another sample.</div></div>';
    } else if (!ready.length && !going.length) {
      h += `<div class="card"><div class="src">${M.res ? 'None of your extractor lots without a sample has any ' + esc(k.pname(M.res)) + '.' : 'Every one of your extractor lots has a sample to mine or one being taken.'}</div></div>`;
    }
    M.calls = calls; M.fcalls = fcalls;
    if (rows.length || ready.length) {
      const can = k.isOwner() && !M.busy && (calls.length || fcalls.length) && !(M.sentAt && Date.now() - M.sentAt < 180000);
      const parts = [fcalls.length ? 'FINISH ' + fcalls.length : '', calls.length ? 'TAKE ' + calls.length : ''].filter(Boolean).join(' + ');
      h += `<div class="card"><button type="button" id="cs-go" class="approve"${can ? '' : ' disabled style="opacity:.5;cursor:not-allowed"'}>${M.busy ? 'WAITING FOR YOUR WALLET…' : '🧪 APPROVE – ' + (parts || 'NOTHING TICKED') + (parts ? ' SAMPLE' + (fcalls.length + calls.length === 1 ? '' : 'S') : '')}</button>` +
        `<div class="hint">${M.sentAt && Date.now() - M.sentAt < 180000 ? '<span style="color:var(--amber)">Just sent – wait a moment, then ↻ Check the game again.</span> ' : ''}Nothing is sent until you approve it in your wallet.</div>` +
        `<div class="hint" style="display:${M.msg ? 'block' : 'none'};margin-top:10px;padding:10px 12px;border-radius:8px;border:1px solid ${M.msgErr ? '#ff4d4d88' : '#8fe3ff55'};color:${M.msgErr ? '#ffb3ae' : 'var(--ink)'}">${M.msg || ''}</div></div>`;
    }
    host.innerHTML = h;
    const re = () => k.render(), q = (s) => host.querySelector(s);
    host.querySelectorAll('[data-cfin]').forEach((x) => x.addEventListener('change', () => { M.fin[x.dataset.cfin] = x.checked; re(); }));
    host.querySelectorAll('[data-cpick]').forEach((x) => x.addEventListener('change', () => { M.pick[x.dataset.cpick] = x.checked; re(); }));
    host.querySelectorAll('[data-cres]').forEach((x) => x.addEventListener('change', () => { M.rsel[x.dataset.cres] = +x.value; re(); }));
    host.querySelectorAll('[data-cdrill]').forEach((x) => x.addEventListener('change', () => { M.drill[x.dataset.cdrill] = +x.value; re(); }));
    host.querySelectorAll('[data-ccrew]').forEach((x) => x.addEventListener('change', () => { if (x.value) M.crew[x.dataset.ccrew] = +x.value; else delete M.crew[x.dataset.ccrew]; re(); }));
    if (q('#cs-rock')) q('#cs-rock').addEventListener('change', (e) => { M.rock = e.target.value; re(); });
    if (q('#cs-res')) q('#cs-res').addEventListener('change', (e) => {
      M.res = +e.target.value;
      if (M.res) rows0.forEach((x) => { if (x.res.some(([r]) => r === M.res)) M.pick[x.ent] = true; });
      re();
    });
    if (q('#cs-all')) q('#cs-all').addEventListener('click', () => { rows.forEach((r) => { M.pick[r.key] = true; }); re(); });
    if (q('#cs-none')) q('#cs-none').addEventListener('click', () => { rows.forEach((r) => { M.pick[r.key] = false; }); re(); });
    const go = q('#cs-go'); if (go) go.addEventListener('click', () => { if (!M.busy) send(); });
  }

  function say(t, err) { M.msg = t; M.msgErr = !!err; K().render(); }
  async function send() {
    const k = K(), cs = M.calls || [], fs = M.fcalls || [];
    if (!k.isOwner() || !(cs.length || fs.length)) return;
    const ws = k.wallets();
    if (!ws.length) return say('No Starknet wallet found in this browser. Open this page in the browser that has your wallet.', true);
    const w = ws[0];
    M.busy = true; M.msg = ''; k.render();
    try {
      const a = await k.account(w);
      if (!a) throw new Error('The wallet did not share an address.');
      if (!k.sameAddr(a, k.D().wallet)) throw new Error('That wallet (' + k.esc(a) + ') is not the one this page is showing. Switch account in your wallet and try again.');
      const errs = [];
      if (Date.now() - (k.S.dataAt || 0) > 30 * 60000) errs.push('The game data is over 30 minutes old – press ↻ Check the game again first.');
      if (Date.now() - M.sampAt > 30 * 60000) errs.push('The sample list is over 30 minutes old – press ↻ Check the game again first.');
      const used = {}; cs.forEach((c) => { used[c.st.id] = (used[c.st.id] || 0) + 1; });
      Object.keys(used).forEach((id) => { const b = k.allB().find((x) => x.id === +id); if (!b || k.holds(b, DRILL) < used[id]) errs.push((b ? k.nm(b) : 'A storage') + ' doesn’t have ' + used[id] + ' Core Drill' + (used[id] > 1 ? 's' : '') + ' any more.'); });
      if (errs.length) throw new Error('Checked just before sending – nothing was sent:<br>• ' + errs.map(k.esc).join('<br>• '));
      const run = (name, data) => ({ contract_address: k.DISPATCHER, entry_point: 'run_system', calldata: [k.short(name), k.hex(data.length), ...data.map(k.hex)] });
      const calls = fs.map((f) => run('SampleDepositFinish', [7, f.dep, 1, f.crew]))
        .concat(cs.map((c) => run('SampleDepositStart', [4, c.e.ent, c.r, 5, c.st.id, k.SLOT, 1, c.crew.id])));
      say('Waiting for your wallet… check the wallet window and approve (or reject) it there.');
      let res;
      if (typeof w.request === 'function') res = await w.request({ type: 'wallet_addInvokeTransaction', params: { calls } });
      else if (w.account && typeof w.account.execute === 'function') res = await w.account.execute(calls.map((q) => ({ contractAddress: q.contract_address, entrypoint: q.entry_point, calldata: q.calldata })));
      else throw new Error('This wallet cannot send transactions from a web page.');
      const hsh = res && (res.transaction_hash || res.transactionHash);
      M.sentAt = Date.now(); M.busy = false; M.samp = null;
      if (window.YICMINE && window.YICMINE.load) window.YICMINE.load(true);
      say('✓ Sent to the game – ' + [fs.length ? fs.length + ' sample' + (fs.length > 1 ? 's' : '') + ' finished' : '', cs.length ? cs.length + ' new sample' + (cs.length > 1 ? 's' : '') + ' started' : ''].filter(Boolean).join(', ') + '. ' + (hsh ? `Transaction <a href="https://voyager.online/tx/${k.esc(hsh)}" target="_blank" rel="noopener noreferrer" style="color:var(--cyan)">${k.esc(String(hsh).slice(0, 10))}…</a>. ` : '') + 'Press ↻ Check the game again in a minute or two.');
    } catch (e) {
      const t = String((e && e.message) || e || '');
      M.busy = false;
      say(/reject|cancel|abort|denied|User/i.test(t) && !/Checked just before/.test(t) ? 'Cancelled in the wallet – nothing was changed.' : 'Not sent: ' + (/^Checked just before/.test(t) ? t : K().esc(t)), true);
    }
  }
  window.YICCORE = { render, count, load: () => Promise.all([loadSamples(), loadMaths()]), plan: () => ({ finish: (M.fcalls || []).slice(), take: (M.calls || []).map((c) => ({ lot: c.e.lot, ent: c.e.ent, rock: c.e.rock, res: c.r, drillFrom: c.st.id, crew: c.crew.id, crewName: c.crew.name })) }) };
})();
