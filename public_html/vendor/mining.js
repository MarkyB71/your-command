/* ⛏ Mining – Logistics Hub (Mark, 26 Nov 2026) – LIVE 27 Nov 2026 (tested on ?beta=1 by Mark)
   "Restart idle extractors": every idle extractor that has a core sample with yield left on its own lot is listed.
   Default (Mark): mine everything left in the sample, as long as the storage has room. Tick which ones to restart,
   one approval for all.

   Game call (@influenceth/sdk 2.8.1): ExtractResourceStart(deposit, yield, extractor, extractor_slot, destination,
   destination_slot, caller_crew) → calldata [7, deposit, yield, 5, extractor, slot, 5, store, 2, 1, crew].
   Samples come from samples.php?used=1 (untouched AND part-used samples with yield left, controlled by your crews).
   Yield is in kg (= units of the raw material). Extraction time (SDK getExtractionTime): (√(left/10,000 t) −
   √((left − yield)/10,000 t)) × 365 game days, ÷ 24 for real time, without crew bonuses.
   Nothing is sent until the player presses Approve AND approves again in the wallet. */
(function () {
  'use strict';
  const K = () => window.YICDOCK;
  const M = { rock: '', res: 0, feed: {}, samp_: {}, pick: {}, store: {}, crew: {}, amt: {}, busy: false, msg: '', msgErr: false, samp: null, sampAt: 0, err: '' };
  const MAXY = 10000e6, YEAR = 365 * 86400;
  const now = () => Date.now() / 1000;
  // busy-until as a date and time (Mark, 27 Nov – LIVE 27 Nov), e.g. "Sat 28 Nov, 21:40"
  const when = (t) => new Date(t * 1000).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  function loadSamples(force) {
    const k = K(), d = k.D() || {};
    if (!force && M.samp && Date.now() - M.sampAt < 300000) return Promise.resolve();
    if (M.loading) return M.loading;
    M.loading = fetch('samples.php?used=1&wallet=' + encodeURIComponent(d.wallet || ''), { cache: 'no-store' })
      .then((r) => r.json()).then((j) => { if (j.error) throw new Error(j.error); M.samp = j.rows || []; M.sampAt = Date.now(); M.err = ''; })
      .catch((e) => { M.err = 'Couldn’t read your core samples: ' + ((e && e.message) || e); })
      .finally(() => { M.loading = null; });
    return M.loading;
  }
  const lotIdx = (id) => Math.floor(id / 4294967296);
  const aboard = (c) => { const r = ((K().D() || {}).crewsRaw || []).find((x) => x.id === c.id); return !!(r && r.Location && r.Location.location && r.Location.location.label === 6); };
  // Game client (main.js): extraction time = (√(left/1e10) − √((left − y)/1e10)) × 1 year ÷ bonus, with yield and left in
  // GRAMS (units × massPerUnit), then ÷ 24 for real time. (Was in kg – 31.6× too short; found 26 Nov after E6009.)
  const realSecs = (y, left, p) => { if (!(y > 0) || !(left > 0)) return 0; const g = K().grams(p) || 1000; const a = Math.sqrt(left * g / MAXY), b = Math.sqrt(Math.max(0, left - y) * g / MAXY); return Math.ceil((a - b) * YEAR / 24); };
  const hrs = (s) => s < 3600 ? Math.max(1, Math.round(s / 60)) + ' min' : s < 86400 * 2 ? (s / 3600).toFixed(1).replace(/\.0$/, '') + ' h' : (s / 86400).toFixed(1).replace(/\.0$/, '') + ' days';
  const capOf = (b) => b.Building.buildingType === K().TANK ? [75e9, 997.5e9] : [1.5e12, 75e9];
  const used = (b) => { const i = K().inv(b) || { mass: 0, volume: 0 }; return [(i.mass || 0) + (i.reservedMass || 0), (i.volume || 0) + (i.reservedVolume || 0)]; };
  const volOf = (p) => ((K().mv()[p] || [1000, 1000])[1]);
  // most units of p that still fit in b (after what's already promised to it in this plan)
  function roomFor(b, p, extraG, extraV) {
    const k = K(), c = capOf(b), u = used(b);
    if (b.Building.buildingType === k.TANK && !k.TANKOK.has(p)) return 0;
    const g = k.grams(p) || 1000, v = volOf(p);
    return Math.max(0, Math.floor(Math.min((c[0] - u[0] - extraG) / g, (c[1] - u[1] - extraV) / v)));
  }

  // every extractor of yours that's idle (status 0) and every one finished but not collected (status 1, time passed)
  function list() {
    const k = K(), S = k.S, out = [], done = [];
    const samp = M.samp || [];
    k.allB().forEach((b) => {
      if (!b.Building || b.Building.status !== 3) return;
      (b.Extractors || []).forEach((x) => {
        const rock = k.rockOf(b);
        if (x.status === 1 && x.finishTime && x.finishTime <= now()) { done.push({ b, x, rock }); return; }
        if (x.status !== 0) return;
        const lot = k.lotOf(b), ast = k.astId(rock);
        const here = samp.filter((r) => lotIdx(r[3]) === lot && (r[3] % 4294967296) === ast && r[2] > 0 && !r[5])
          .sort((a, c) => (c[6] === 3) - (a[6] === 3) || c[2] - a[2]); // part-used first, then the biggest
        out.push({ b, x, rock, slot: x.slot || 1, samples: here });
      });
    });
    return { out: out.sort((a, c) => a.rock.localeCompare(c.rock) || k.nm(a.b).localeCompare(k.nm(c.b))), done };
  }
  function count() { if (M.err) return 0; if (!M.samp) return null; return list().out.filter((e) => e.samples.length).length; }

  function render(host) {
    const k = K(), esc = k.esc;
    if (!M.samp && !M.err) { host.innerHTML = '<div class="card"><div class="src">Reading your core samples…</div></div>'; loadSamples().then(() => k.render()); return; }
    const all = list();
    // pick an asteroid (Mark, 26 Nov): only rocks with an idle or finished extractor
    const rl = [...new Set(all.out.concat(all.done).map((e) => e.rock))].sort();
    if (M.rock && !rl.includes(M.rock)) M.rock = '';
    const mine = (e) => !M.rock || e.rock === M.rock;
    const out = all.out.filter(mine), done = all.done.filter(mine);
    const ready0 = out.filter((e) => e.samples.length), none = out.filter((e) => !e.samples.length);
    // pick a resource (Mark, 27 Nov): every resource with a sample ready on these extractors; picking one shows only
    // the extractors with a sample of it (that sample chosen) and ticks them all
    const rc = {}; ready0.forEach((e) => [...new Set(e.samples.map((s) => s[1]))].forEach((p) => { rc[p] = (rc[p] || 0) + 1; }));
    const rlist = Object.keys(rc).map(Number).sort((a, c) => k.pname(a).localeCompare(k.pname(c)));
    if (M.res && !rc[M.res]) M.res = 0;
    const ready = M.res ? ready0.filter((e) => e.samples.some((s) => s[1] === M.res)) : ready0;
    let h = `<div class="card"><h2><span class="n">⛏</span>Restart mining</h2><div class="src">Idle extractors that have a core sample with yield left on the same lot. Each one mines everything left in its sample, as long as the storage has room – change the amount if you want less.</div>` +
      (M.err ? `<div class="src" style="color:var(--red);margin-top:8px">${esc(M.err)}</div>` : '') +
      (rl.length > 1 ? `<div class="row" style="margin-top:10px"><span class="src">Asteroid</span><select id="mn-rock"><option value="">All asteroids</option>${rl.map((r) => `<option${r === M.rock ? ' selected' : ''}>${esc(r)}</option>`).join('')}</select></div>` : '') +
      (rlist.length ? `<div class="row" style="margin-top:10px"><span class="src">Resource</span><select id="mn-res"><option value="0">All resources</option>${rlist.map((p) => `<option value="${p}"${p === M.res ? ' selected' : ''}>${esc(k.pname(p))} · ${rc[p]} extractor${rc[p] === 1 ? '' : 's'}</option>`).join('')}</select></div>` : '') + '</div>';
    if (done.length) h += `<div class="card"><div class="src" style="color:var(--amber)">⏳ ${done.length} extractor${done.length > 1 ? 's have' : ' has'} finished but not been collected: ${done.map((e) => '<b>' + esc(k.nm(e.b)) + '</b> (' + esc(e.rock) + ')').join(', ')}. Finish ${done.length > 1 ? 'them' : 'it'} in the game first, then ↻ Check the game again.</div></div>`;
    if (!ready.length) {
      h += `<div class="card"><div class="src">${out.length ? 'None of your idle extractors has a core sample with yield left on its lot.' : 'No idle extractors right now.'}</div></div>`;
    }
    // plan: per extractor, sample, amount, storage, crew
    const promised = {}, Q = {}; // store id → [g, v]; crew id → when its queue ends (this plan)
    const calls = [], rows = []; M.feeds = [];
    ready.forEach((e) => {
      const key = e.b.id + ':' + e.slot;
      if (M.pick[key] == null) M.pick[key] = true;
      const sl = M.res ? e.samples.filter((r) => r[1] === M.res) : e.samples;
      const s = sl.find((r) => r[0] === M.samp_[key]) || sl[0];
      const p = s[1], left = s[2];
      const stores = k.allB().filter((b) => k.isStore(b) && b.Building.status === 3 && k.rockOf(b) === e.rock && !(b.Building.buildingType === k.TANK && !k.TANKOK.has(p)));
      const km = (b) => { const d = k.kmBetween(k.lotOf(e.b), k.lotOf(b), k.astId(e.rock)); return d == null ? 9e9 : d; };
      const pr = (b) => promised[b.id] || [0, 0];
      const last = e.x.destination && e.x.destination.id;
      const want = M.amt[key] != null ? Math.min(left, Math.max(0, Math.round(+M.amt[key] * 1000))) : left;
      // default storage (Mark, 26 Nov: "pick a storage that will take everything, or there will be part samples left"):
      // where it went last time if ALL of it fits, else the nearest that takes all of it, else the one with the most room
      let st = stores.find((b) => b.id === M.store[key]);
      if (!st) {
        const rm = (b) => roomFor(b, p, pr(b)[0], pr(b)[1]), fits = (b) => rm(b) >= want;
        st = stores.find((b) => b.id === last && fits(b)) || stores.filter(fits).sort((a, c) => km(a) - km(c))[0] || stores.slice().sort((a, c) => rm(c) - rm(a))[0];
      }
      const room = st ? roomFor(st, p, pr(st)[0], pr(st)[1]) : 0;
      const y = Math.min(want, room);
      // CREW (Mark, 26 Nov: "one crew will not be able to do all the extractions"): each start keeps the crew busy for
      // the trip to the extractor + mining time ÷ 8 (SDK Time.getCrewLaborDuration), and a crew can only queue jobs
      // up to 24 h ahead (Crew.CREW_SCHEDULE_BUFFER). Spread over the crews on the rock – earliest free first.
      const cl = k.crews(e.rock); // crews aboard a ship CAN mine (Mark, 26 Nov 23:08) – E6009 was something else
      // Same as the game client (main.js, extraction dialog): trip to the extractor + on-site labour (mining time ÷ 8) +
      // trip back; a crew can take a new job while its queue ends no more than 24 h from now (client _readyToSequence).
      const cost = (c) => Math.ceil(realSecs(y, left, p) / 8) + 2 * (k.tripSecs(k.kmBetween(c.lot, k.lotOf(e.b), k.astId(e.rock)), c) || 0);
      const qEnd = (c) => Q[c.id] != null ? Q[c.id] : Math.max(now(), k.crewReady(c));
      const lim = now() + 86400;
      let crew = null, over = false;
      if (M.pick[key] && y > 0 && st) {
        const ch = cl.find((c) => c.id === M.crew[key]);
        if (ch) { crew = ch; over = qEnd(ch) > lim; }
        else crew = cl.filter((c) => qEnd(c) <= lim).sort((a, c) => (qEnd(a) + cost(a)) - (qEnd(c) + cost(c)))[0] || null;
        if (crew && !over) Q[crew.id] = qEnd(crew) + cost(crew);
      }
      const on = M.pick[key] && y > 0 && st && crew && !over;
      if (on) {
        promised[st.id] = [pr(st)[0] + y * (k.grams(p) || 1000), pr(st)[1] + y * volOf(p)];
        calls.push({ e, s, y, st, crew, p });
      }
      const fitsAll = (b) => b === st ? room >= want : roomFor(b, p, pr(b)[0], pr(b)[1]) >= want;
      rows.push({ e, key, sl, s, p, left, st, stores, room, y, want, crew, cl, km, fitsAll, over, on, ends: crew ? Q[crew.id] : 0 });
    });
    if (rows.length) {
      h += `<div class="card"><h2><span class="n">1</span>Extractors to restart (${rows.length})</h2><div class="row" style="gap:8px;margin:0 0 8px"><button type="button" class="dk-shipbtn" id="mn-all" style="cursor:pointer">Select all</button><button type="button" class="dk-shipbtn" id="mn-none" style="cursor:pointer">Clear selected</button></div><table><thead><tr><th></th><th>Extractor</th><th>Core sample</th><th class="num">Mine</th><th>Into</th><th>Crew</th><th class="num">Time</th></tr></thead><tbody>` +
        rows.map((r) => {
          const t = r.y ? realSecs(r.y, r.left, r.p) : 0, short = r.y < r.want;
          return `<tr><td><input type="checkbox" data-mpick="${r.key}"${M.pick[r.key] ? ' checked' : ''}></td>` +
            `<td><b>${esc(k.nm(r.e.b))}</b><div class="src">${esc(r.e.rock)} · lot ${k.lotOf(r.e.b)}</div></td>` +
            `<td>${r.sl.length > 1 ? `<select data-msamp="${r.key}">${r.sl.map((s) => `<option value="${s[0]}"${s === r.s ? ' selected' : ''}>${esc(k.pname(s[1]))} · ${k.tonnes(s[2])} left${s[6] === 3 ? ' (used before)' : ''}</option>`).join('')}</select>` : `${esc(k.pname(r.p))}<div class="src">${k.tonnes(r.left)} left${r.s[6] === 3 ? ' · used before' : ' · new sample'}</div>`}</td>` +
            `<td class="num"><input type="number" min="0" step="any" data-mamt="${r.key}" value="${M.amt[r.key] != null ? esc(M.amt[r.key]) : +(r.left / 1000).toFixed(3)}" style="width:100px"> t` +
            (short && r.st ? `<div class="src" style="color:var(--amber)">only ${k.tonnes(r.y)} fits${r.stores.some((b) => b !== r.st && r.fitsAll(b)) ? '' : ' – no storage here takes it all'}</div>` : '') + `</td>` +
            `<td>${r.stores.length ? `<select data-mst="${r.key}">${r.stores.map((b) => `<option value="${b.id}"${r.st && b.id === r.st.id ? ' selected' : ''}>${esc(k.nm(b))} · ${k.kmTxt(r.km(b))}${r.fitsAll(b) ? '' : ' · not all fits'}</option>`).join('')}</select>` : '<span style="color:var(--red)">no storage on this rock</span>'}` +
            (r.st && !r.room ? '<div class="src" style="color:var(--red)">full – pick another</div>' : '') + `</td>` +
            `<td>${!r.cl.length ? `<span style="color:var(--amber)">no crew on ${esc(r.e.rock)}</span>` : `<select data-mcrew="${r.key}"><option value="">${M.pick[r.key] && r.y && !M.crew[r.key] ? (r.crew ? 'Auto – ' + esc(r.crew.name) : 'Auto – no crew has room') : 'Auto'}</option>${r.cl.map((c) => `<option value="${c.id}"${M.crew[r.key] === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select>` +
              (M.pick[r.key] && r.y && !r.crew ? '<div class="src" style="color:var(--amber)">every crew’s 24 h queue is full – start this one later</div>' : '') +
              (r.over ? `<div class="src" style="color:var(--red)">${esc(r.crew.name)}’s queue would go past 24 h</div>` : '')}</td>` +
            `<td class="num">${r.y ? '~' + hrs(t) : '–'}</td></tr>`;
        }).join('') + '</tbody></table><div class="hint">Time is without crew or building bonuses. The amount is in tonnes; it’s capped at what’s left in the sample and the room in the storage.</div></div>';
      // crews used and how far ahead their queue goes
      const used = {}; rows.filter((r) => r.on).forEach((r) => { const u = used[r.crew.id] = used[r.crew.id] || { c: r.crew, n: 0, end: 0 }; u.n++; u.end = Math.max(u.end, Q[r.crew.id]); });
      const ul = Object.values(used);
      h += `<div class="card"><h2><span class="n">2</span>Crews</h2>` + (ul.length ? ul.map((u) => `<div class="src" style="margin:3px 0"><b>${esc(u.c.name)}</b> starts ${u.n} · busy until about ${when(u.end)}</div>`).join('') : '<div class="src">Nothing ticked.</div>') +
        '<div class="hint">Each start keeps a crew busy for a while, and a crew can only queue jobs up to 24 hours ahead – so they’re spread over your crews on the rock, the way the game counts it. Pick one in the Crew column to choose yourself.</div></div>';
      // 🍽 feed the crews first (Mark, 27 Nov) – same as Production / Storage Management: as much as the game allows
      // (max food − current food), from the biggest Food stock on the crew's rock (shared out); first in the same approval
      const food = {}, feeds = [], rockOf = {};
      rows.filter((r) => r.on).forEach((r) => { rockOf[r.crew.id] = r.e.rock; });
      const fl = ul.map((u) => {
        const c = u.c, rock = rockOf[c.id];
        if (c.food >= 0.95) return `<div class="src" style="margin:3px 0">✓ <b>${esc(c.name)}</b> is ${Math.round(c.food * 100)}% fed.</div>`;
        if (!food[rock]) { food[rock] = {}; k.allB().filter((b) => k.isStore(b) && b.Building.status === 3 && k.rockOf(b) === rock).forEach((b) => { food[rock][b.id] = ((k.inv(b) || { contents: [] }).contents || []).reduce((t, x) => t + (x.product === 129 ? x.amount : 0), 0); }); }
        const fr = food[rock], need = Math.max(0, c.mates * 1000 - Math.ceil(c.mates * 1000 * c.food));
        const sid = Object.keys(fr).filter((id) => fr[id] > 0).sort((a, b) => fr[b] - fr[a])[0];
        const src = sid && k.allB().find((b) => b.id === +sid);
        const f = src && need > 0 ? { src: src.id, give: Math.min(need, fr[sid]), crew: c.id } : null;
        if (M.feed[c.id] == null) M.feed[c.id] = true;
        if (f) { fr[sid] -= f.give; if (M.feed[c.id]) feeds.push(f); }
        return `<div style="margin:6px 0;padding:8px 12px;border-radius:8px;background:#3fd68a12;border:1px solid #3fd68a55"><div style="color:var(--amber);margin-bottom:4px">${c.fm < 1 ? '⚠ ' + esc(c.name) + ' is hungry – slower.' : esc(c.name) + ' is ' + Math.round(c.food * 100) + '% fed.'}</div>` +
          (f ? `<label style="margin:0"><input type="checkbox" data-mfeed="${c.id}"${M.feed[c.id] ? ' checked' : ''}> Feed ${esc(c.name)} first: ${k.tonnes(f.give)} Food from ${esc(k.nm(src))}</label>` : `<div class="src">No Food stored on ${esc(rock)} to feed it.</div>`) + '</div>';
      });
      M.feeds = feeds;
      if (ul.length) h += `<div class="card"><h2><span class="n">3</span>Feed the crews</h2>${fl.join('')}<div class="hint">Feeding goes in the same wallet approval, before the extractors start. Well-fed crews work faster.</div></div>`;
    }
    if (none.length) h += `<details class="card dkp-fold"><summary>Idle with no core sample on their lot (${none.length})</summary><div class="src">${none.map((e) => esc(k.nm(e.b)) + ' (' + esc(e.rock) + ')').join(' · ')}</div><div class="hint">Take a core sample on that lot in the game first.</div></details>`;
    M.calls = calls;
    if (rows.length) {
      const can = k.isOwner() && !M.busy && calls.length && !(M.sentAt && Date.now() - M.sentAt < 180000);
      h += `<div class="card"><button type="button" id="mn-go" class="approve"${can ? '' : ' disabled style="opacity:.5;cursor:not-allowed"'}>${M.busy ? 'WAITING FOR YOUR WALLET…' : '⛏ APPROVE – ' + (M.feeds.length ? 'FEED ' + M.feeds.length + ' CREW' + (M.feeds.length === 1 ? '' : 'S') + ' + ' : '') + 'START ' + calls.length + ' EXTRACTOR' + (calls.length === 1 ? '' : 'S')}</button>` +
        `<div class="hint">${M.sentAt && Date.now() - M.sentAt < 180000 ? '<span style="color:var(--amber)">Just sent – wait a moment, then ↻ Check the game again.</span> ' : ''}Nothing is sent until you approve it in your wallet.</div>` +
        `<div id="mn-msg" class="hint" style="display:${M.msg ? 'block' : 'none'};margin-top:10px;padding:10px 12px;border-radius:8px;border:1px solid ${M.msgErr ? '#ff4d4d88' : '#8fe3ff55'};color:${M.msgErr ? '#ffb3ae' : 'var(--ink)'}">${M.msg || ''}</div></div>`;
    }
    host.innerHTML = h;
    const re = () => k.render();
    host.querySelectorAll('[data-mpick]').forEach((x) => x.addEventListener('change', () => { M.pick[x.dataset.mpick] = x.checked; re(); }));
    host.querySelectorAll('[data-msamp]').forEach((x) => x.addEventListener('change', () => { M.samp_[x.dataset.msamp] = +x.value; delete M.amt[x.dataset.msamp]; re(); }));
    host.querySelectorAll('[data-mamt]').forEach((x) => x.addEventListener('change', () => { M.amt[x.dataset.mamt] = x.value; re(); }));
    host.querySelectorAll('[data-mst]').forEach((x) => x.addEventListener('change', () => { M.store[x.dataset.mst] = +x.value; re(); }));
    host.querySelectorAll('[data-mfeed]').forEach((x) => x.addEventListener('change', () => { M.feed[x.dataset.mfeed] = x.checked; re(); }));
    host.querySelectorAll('[data-mcrew]').forEach((x) => x.addEventListener('change', () => { if (x.value) M.crew[x.dataset.mcrew] = +x.value; else delete M.crew[x.dataset.mcrew]; re(); }));
    const q = (id) => host.querySelector(id);
    if (q('#mn-rock')) q('#mn-rock').addEventListener('change', (e) => { M.rock = e.target.value; re(); });
    if (q('#mn-res')) q('#mn-res').addEventListener('change', (e) => {
      M.res = +e.target.value;
      if (M.res) ready0.forEach((x) => { if (x.samples.some((s) => s[1] === M.res)) M.pick[x.b.id + ':' + x.slot] = true; });
      re();
    });
    if (q('#mn-all')) q('#mn-all').addEventListener('click', () => { rows.forEach((r) => { M.pick[r.key] = true; }); re(); });
    if (q('#mn-none')) q('#mn-none').addEventListener('click', () => { rows.forEach((r) => { M.pick[r.key] = false; }); re(); });
    const go = host.querySelector('#mn-go'); if (go) go.addEventListener('click', () => { if (!M.busy) send(); });
  }

  function say(t, err) { M.msg = t; M.msgErr = !!err; K().render(); }
  async function send() {
    const k = K(), cs = M.calls || [];
    if (!k.isOwner() || !cs.length) return;
    const ws = k.wallets();
    if (!ws.length) return say('No Starknet wallet found in this browser. Open this page in the browser that has your wallet.', true);
    const w = ws[0];
    M.busy = true; M.msg = ''; k.render();
    try {
      const a = await k.account(w);
      if (!a) throw new Error('The wallet did not share an address.');
      if (!k.sameAddr(a, k.D().wallet)) throw new Error('That wallet (' + k.esc(a) + ') is not the one this page is showing. Switch account in your wallet and try again.');
      // checks just before sending
      const errs = [];
      if (Date.now() - (k.S.dataAt || 0) > 30 * 60000) errs.push('The game data is over 30 minutes old – press ↻ Check the game again first.');
      cs.forEach((c) => { if (c.e.x.status !== 0) errs.push(k.nm(c.e.b) + ' is no longer idle.'); if (!(c.y > 0) || c.y > c.s[2]) errs.push(k.nm(c.e.b) + ': amount is more than the sample has left.'); });
      if (errs.length) throw new Error('Checked just before sending – nothing was sent:<br>• ' + errs.map(k.esc).join('<br>• '));
      const calls = (M.feeds || []).map((f) => ({ contract_address: k.DISPATCHER, entry_point: 'run_system', calldata: [k.short('ResupplyFood'), '0x6', '0x5', k.hex(f.src), k.hex(k.SLOT), k.hex(f.give), '0x1', k.hex(f.crew)] })).concat(cs.map((c) => {
        const data = [7, c.s[0], c.y, 5, c.e.b.id, c.e.slot, 5, c.st.id, k.SLOT, 1, c.crew.id];
        return { contract_address: k.DISPATCHER, entry_point: 'run_system', calldata: [k.short('ExtractResourceStart'), k.hex(data.length), ...data.map(k.hex)] };
      }));
      const nf = (M.feeds || []).length;
      say('Waiting for your wallet… check the wallet window and approve (or reject) it there.');
      let res;
      if (typeof w.request === 'function') res = await w.request({ type: 'wallet_addInvokeTransaction', params: { calls } });
      else if (w.account && typeof w.account.execute === 'function') res = await w.account.execute(calls.map((q) => ({ contractAddress: q.contract_address, entrypoint: q.entry_point, calldata: q.calldata })));
      else throw new Error('This wallet cannot send transactions from a web page.');
      const hsh = res && (res.transaction_hash || res.transactionHash);
      M.sentAt = Date.now(); M.busy = false; M.samp = null;
      say('✓ Sent to the game – ' + (nf ? nf + ' crew' + (nf > 1 ? 's' : '') + ' fed, ' : '') + cs.length + ' extractor' + (cs.length > 1 ? 's' : '') + ' started. ' + (hsh ? `Transaction <a href="https://voyager.online/tx/${k.esc(hsh)}" target="_blank" rel="noopener noreferrer" style="color:var(--cyan)">${k.esc(String(hsh).slice(0, 10))}…</a>. ` : '') + 'Press ↻ Check the game again in a minute or two.');
    } catch (e) {
      const t = String((e && e.message) || e || '');
      M.busy = false;
      say(/reject|cancel|abort|denied|User/i.test(t) && !/Checked just before/.test(t) ? 'Cancelled in the wallet – nothing was changed.' : 'Not sent: ' + (/^Checked just before/.test(t) ? t : K().esc(t)), true);
    }
  }
  window.YICMINE = { render, count, load: loadSamples, plan: () => (M.calls || []).map((c) => ({ ext: c.e.b.id, name: K().nm(c.e.b), rock: c.e.rock, slot: c.e.slot, dep: c.s[0], y: c.y, store: c.st.id, crew: c.crew.id, crewName: c.crew.name })) };
})();
