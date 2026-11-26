/* ⛽ Fuel a ship – Logistics Hub › Cargo bay – TEST ONLY (?beta=1&dock=1), Mark 26 Nov 2026
   Mark: "use the hub to work out how much fuel is needed in a ship, then start the process and send it to the ship".
   1. Ship – one of your ships parked on a rock (shows what's in its tank now).
   2. How much – fills the tank to the top (Mark, 26 Nov: "work out how much to fill the ship", not a flight).
      Tank sizes from @influenceth/sdk 2.8.1 Ship.TYPES (same as vendor/travel.js SHIPS). The amount can be changed.
   3. Propellant on that rock – in its warehouses / tank farms. Short? "Make it in Production" opens Production
      with Hydrogen Propellant and the amount filled in (window.YICPRODGO). The game can't send fuel that isn't made
      yet, so it's two goes: make it, then come back here and send it.
   4. Moved by – a crew on that rock. One SendDelivery per storage → the ship's PROPELLANT slot:
        run_system('SendDelivery', [5, storeId, 2, 1, 170, n, 6, shipId, 1, 1, crewId])
      Ships have propellantSlot 1 and cargoSlot 2 (@influenceth/sdk 2.8.1 Ship.TYPES, checked 26 Nov).
   Uses the hub's own helpers (window.YICDOCK, vendor/dock.js). */
(function () {
  'use strict';
  if (!/[?&]dock=1\b/.test(location.search) || !/[?&]beta=1\b/.test(location.search)) return;
  const K = () => window.YICDOCK;
  const PROP = 170, PSLOT = 1;
  const UNITS = { kg: 1, t: 1000, kt: 1e6 };
  const SF = { ship: 0, amt: '', unit: 't', key: '', crew: 0, msg: '', msgErr: false, busy: false, sentAt: 0 };
  const TANK = { 1: 2e8, 2: 4e9, 3: 24e9, 4: 2e9 }; // grams of propellant a full tank holds, by ship type
  let host = null;

  const kgTxt = (kg) => kg >= 1e6 ? (+(kg / 1e6).toFixed(2)).toLocaleString('en-GB') + ' kt' : kg >= 1000 ? (+(kg / 1000).toFixed(kg >= 1e5 ? 0 : 1)).toLocaleString('en-GB') + ' t' : Math.round(kg).toLocaleString('en-GB') + ' kg';
  const uG = () => K().grams(PROP) || 1000; // grams per unit of propellant
  const storesOn = (rock) => K().allB().filter((b) => K().isStore(b) && K().rockOf(b) === rock);
  const have = (b) => ((K().inv(b) || { contents: [] }).contents.filter((c) => c.product === PROP).reduce((t, c) => t + c.amount, 0));
  const astName = (id) => { const Y = window.YIC || {}, D = Y.D || {}; const a = (Y.asts || []).find((x) => x.id === id) || (D.owned || []).find((x) => x.id === id); return a ? (a.name || (a.Name && a.Name.name)) : ('Asteroid #' + id); };

  // your ships, parked ones first
  function ships() {
    const k = K(), d = k.D() || {};
    return (d.ships || []).filter((s) => TANK[s.st]).map((s) => {
      let why = '';
      if (s.sst === 'f') why = 'in flight';
      else if (s.sst === 'o') why = 'in orbit – land or dock it first';
      else if (!s.lot) why = "can't tell where it is on the rock";
      return { s, ok: !why, why, rock: astName(s.dId) };
    }).sort((a, b) => (b.ok - a.ok) || a.s.name.localeCompare(b.s.name));
  }
  // storage → ship moves for `units` of propellant, nearest storage first
  function moves(rock, x, units) {
    const k = K(), ast = x.s.dId, out = []; let left = units;
    storesOn(rock).map((b) => [b, have(b), k.kmBetween(k.lotOf(b), x.s.lot, ast) ?? 1e9]).filter((z) => z[1] > 0)
      .sort((a, b) => a[2] - b[2] || b[1] - a[1]).forEach(([b, h, km]) => {
        if (left <= 0) return;
        const n = Math.min(left, h); left -= n; out.push({ b, n, km });
      });
    return { out, short: Math.max(0, left) };
  }

  function render(el) {
    const k = K();
    host = el;
    if (!k) { el.innerHTML = ''; return; }
    const esc = k.esc, sl = ships();
    let h = `<div class="card"><h2><span class="n">⛽</span>Fuel a ship <span class="sl-tag" style="background:#2a1d08;color:#ffd28a">TEST</span></h2>
<div class="hint" style="margin:0 0 8px">Fills the ship's tank with propellant from storage on the rock it's parked on.</div>`;
    if (!sl.length) { el.innerHTML = h + '<div class="src">No ships found for this wallet.</div></div>'; return; }
    if (!sl.find((x) => x.s.id === SF.ship)) SF.ship = (sl.find((x) => x.ok) || sl[0]).s.id;
    const x = sl.find((y) => y.s.id === SF.ship), s = x.s, tankKg = TANK[s.st] / 1000, nowKg = (s.prop || 0) * 1000;
    // 1 ship
    h += `<div class="src" style="margin-bottom:4px"><b>1 · Ship</b></div><select id="sf-ship">${sl.map((y) => `<option value="${y.s.id}"${y.s.id === SF.ship ? ' selected' : ''}>${esc(y.s.name)} – ${esc(y.ok ? y.rock : y.why)}</option>`).join('')}</select>`;
    h += `<div class="sl-bar" style="width:260px"><i style="width:${Math.round(Math.min(1, nowKg / tankKg) * 100)}%"></i></div><div class="src">${esc(s.type)} on ${esc(x.rock)} · tank ${kgTxt(nowKg)} of ${kgTxt(tankKg)}${s.useM ? ' · carrying ' + kgTxt(s.useM / 1000) : ''}</div>`;
    if (!x.ok) { el.innerHTML = h + `<div class="hint" style="color:var(--amber)">${esc(s.name)} is ${esc(x.why)} – it has to be parked on a rock to be fuelled.</div></div>`; wire(el); return; }
    const rock = x.rock, key = s.id + '|' + Math.round(nowKg);
    const op = (v, t, cur) => `<option value="${v}"${String(cur) === String(v) ? ' selected' : ''}>${t}</option>`;
    const roomKg = Math.max(0, tankKg - nowKg);
    if (roomKg < 1) h += `<div class="hint" style="color:var(--green)">✓ The tank is already full.</div>`;
    // 3 amount + stock
    if (SF.key !== key) {
      SF.key = key; SF.msg = '';
      const q = roomKg;
      SF.unit = q >= 1e6 ? 'kt' : q >= 1000 ? 't' : 'kg'; SF.amt = String(Math.ceil(q / UNITS[SF.unit] * 10) / 10);
    }
    const amtKg = Math.min(Math.max(0, (+SF.amt || 0) * UNITS[SF.unit]), Math.max(0, tankKg - nowKg));
    const units = Math.floor(amtKg * 1000 / uG());
    const M = moves(rock, x, units), haveU = storesOn(rock).reduce((t, b) => t + have(b), 0);
    h += `<div class="src" style="margin:12px 0 4px"><b>2 · Propellant to put in</b> <span class="src">(fills it to the top)</span></div><div class="row" style="gap:6px"><input type="number" id="sf-amt" min="0" step="any" value="${esc(SF.amt)}"><select id="sf-unit">${['kg', 't', 'kt'].map((u) => op(u, u, SF.unit)).join('')}</select>
<span class="src">room in the tank: ${kgTxt(Math.max(0, tankKg - nowKg))}</span></div>`;
    h += `<div class="src" style="margin-top:6px">In storage on ${esc(rock)}: <b>${kgTxt(haveU * uG() / 1000)}</b></div>`;
    if (units > 0 && M.short > 0) {
      const sk = M.short * uG() / 1000;
      h += `<div class="hint" style="color:var(--amber)">Short by ${kgTxt(sk)}. Make it first – then come back here and send it.</div>
<button type="button" id="sf-make" class="dk-shipbtn" style="margin-top:6px">🏭 Make ${kgTxt(sk)} in Production ▸</button>`;
    }
    // 4 crew + moves
    const cl = k.crews(rock);
    if (!cl.find((c) => c.id === SF.crew)) SF.crew = (cl.find((c) => !c.busy) || cl[0] || {}).id || 0;
    const crew = cl.find((c) => c.id === SF.crew);
    h += `<div class="src" style="margin:12px 0 4px"><b>3 · Moved by</b></div>`;
    h += cl.length ? `<select id="sf-crew">${cl.map((c) => `<option value="${c.id}"${c.id === SF.crew ? ' selected' : ''}>${esc(c.name)}${c.busy ? ' – busy' : ' – ready'}</option>`).join('')}</select>` : `<div class="src" style="color:var(--amber)">No crew on ${esc(rock)} – a crew there has to send it.</div>`;
    if (M.out.length && units > 0) h += `<table style="margin-top:8px"><thead><tr><th>From</th><th>Propellant</th><th>To</th></tr></thead><tbody>${M.out.map((mv) => `<tr><td class="src">${esc(k.nm(mv.b))}</td><td>${kgTxt(mv.n * uG() / 1000)}</td><td class="src">${esc(s.name)} – tank</td></tr>`).join('')}</tbody></table>`;
    const wait = SF.sentAt && Date.now() - SF.sentAt < 180000;
    const can = k.isOwner() && !SF.busy && !wait && units > 0 && M.out.length && crew;
    const sendKg = (units - M.short) * uG() / 1000;
    h += `<div style="margin-top:12px"><button id="sf-go" class="dkp-rc" style="border-color:var(--amber);color:#ffd28a"${can ? '' : ' disabled'}>⛽ Approve – put ${kgTxt(Math.max(0, sendKg))} in the tank</button></div>
${M.short > 0 && M.out.length ? '<div class="hint">Only what is in storage now can be sent.</div>' : ''}
<div class="hint">${wait ? '<span style="color:var(--amber)">Just sent – wait a moment, then ↻ Check the game again.</span> ' : ''}Nothing is sent until you approve it in your wallet.</div>
<div id="sf-msg" class="hint" style="display:${SF.msg ? 'block' : 'none'};margin-top:8px;padding:10px 12px;border-radius:8px;border:1px solid ${SF.msgErr ? '#ff4d4d88' : '#8fe3ff55'};color:${SF.msgErr ? '#ffb3ae' : 'var(--ink)'}">${SF.msg || ''}</div></div>`;
    el.innerHTML = h;
    SF.cur = { x, rock, M, tankKg, nowKg };
    wire(el);
  }

  function wire(el) {
    const again = () => render(host);
    const on = (id, ev, f) => { const e = el.querySelector(id); if (e) e.addEventListener(ev, () => f(e)); };
    on('#sf-ship', 'change', (e) => { SF.ship = +e.value; SF.crew = 0; SF.key = ''; again(); });
    on('#sf-amt', 'change', (e) => { SF.amt = e.value; again(); });
    on('#sf-unit', 'change', (e) => { SF.unit = e.value; again(); });
    on('#sf-crew', 'change', (e) => { SF.crew = +e.value; again(); });
    on('#sf-make', 'click', () => {
      const k = K(), c = SF.cur; if (!c) return;
      window.YICPRODGO = { p: PROP, q: Math.ceil(c.M.short), rock: c.rock };
      k.S.mode = 'make'; k.render();
      const s = document.querySelector('#dk-ov .lb-scr'); if (s) s.scrollTop = 0;
    });
    on('#sf-go', 'click', () => { if (!SF.busy) send(); });
  }

  const say = (html, err) => { SF.msg = html; SF.msgErr = !!err; const e = document.getElementById('sf-msg'); if (e) { e.style.display = 'block'; e.innerHTML = html; e.style.color = err ? '#ffb3ae' : 'var(--ink)'; e.style.borderColor = err ? '#ff4d4d88' : '#8fe3ff55'; } };
  function calls(c) {
    const k = K();
    return c.M.out.map((mv) => {
      const data = [5, mv.b.id, k.SLOT, 1, PROP, Math.floor(mv.n), 6, c.x.s.id, PSLOT, 1, SF.crew];
      return { contract_address: k.DISPATCHER, entry_point: 'run_system', calldata: [k.short('SendDelivery'), k.hex(data.length), ...data.map(k.hex)] };
    });
  }
  function checks(c) {
    const k = K(), errs = [];
    if (!k.S.dataAt || Date.now() - k.S.dataAt > 10 * 60000) errs.push('The game data is over 10 minutes old – press ↻ Check the game again first.');
    const crew = k.crews(c.rock).find((x) => x.id === SF.crew);
    if (!crew) errs.push('No crew on ' + c.rock + ' picked.'); else if (k.crewReady(crew) - Date.now() / 1000 > 86400) errs.push(crew.name + ' already has more than 24 hours of jobs queued.');
    const x = ships().find((y) => y.s.id === c.x.s.id);
    if (!x || !x.ok || x.s.dId !== c.x.s.dId) errs.push(c.x.s.name + ' is no longer parked on ' + c.rock + '.');
    let tot = 0;
    c.M.out.forEach((mv) => { const b = k.allB().find((y) => y.id === mv.b.id); if (!b || have(b) < mv.n) errs.push(k.nm(mv.b) + ' no longer holds that much propellant.'); tot += mv.n; });
    if (x && tot * uG() / 1000 > c.tankKg - (x.s.prop || 0) * 1000 + 0.5) errs.push("That's more than the room left in the tank.");
    return [...new Set(errs)];
  }
  async function send() {
    const k = K(), c = SF.cur;
    if (!k.isOwner() || !c || !c.M.out.length) return;
    const ws = k.wallets();
    if (!ws.length) return say('No Starknet wallet found in this browser. Open this page in the browser that has your wallet.', true);
    const w = ws[0];
    SF.busy = true; SF.msg = ''; render(host);
    try {
      const a = await k.account(w);
      if (!a) throw new Error('The wallet did not share an address.');
      if (!k.sameAddr(a, k.D().wallet)) throw new Error('That wallet (' + k.esc(a) + ') is not the one this page is showing. Switch account in your wallet and try again.');
      const errs = checks(c);
      if (errs.length) throw new Error('Checked just before sending – nothing was sent:<br>• ' + errs.map(k.esc).join('<br>• '));
      const cs = calls(c);
      say('Waiting for your wallet… check the wallet window and approve (or reject) it there.');
      let res;
      if (typeof w.request === 'function') res = await w.request({ type: 'wallet_addInvokeTransaction', params: { calls: cs } });
      else if (w.account && typeof w.account.execute === 'function') res = await w.account.execute(cs.map((q) => ({ contractAddress: q.contract_address, entrypoint: q.entry_point, calldata: q.calldata })));
      else throw new Error('This wallet cannot send transactions from a web page.');
      const hsh = res && (res.transaction_hash || res.transactionHash);
      const crew = k.crews(c.rock).find((x) => x.id === SF.crew);
      const link = crew ? ' Finish it with <b>' + k.esc(crew.name) + '</b>' + (window.GL && window.GL.on() ? window.GL('/crew/' + crew.id, 'Open this crew in the game') : ' <a href="https://game.influenceth.io/crew/' + crew.id + '" target="influencegame" rel="noopener" style="color:var(--cyan)">in game ↗</a>') + '.' : '';
      SF.sentAt = Date.now(); SF.busy = false;
      SF.msg = '✓ Sent to the game. ' + (hsh ? `Transaction <a href="https://voyager.online/tx/${k.esc(hsh)}" target="_blank" rel="noopener noreferrer" style="color:var(--cyan)">${k.esc(String(hsh).slice(0, 10))}…</a>. ` : '') + 'When it arrives, use Finish All Ready Items – then the propellant is in the tank.' + link;
      SF.msgErr = false; render(host);
      setTimeout(() => { k.loadDeliveries().then(k.render); }, 150000);
    } catch (e) {
      const t = String((e && e.message) || e || '');
      SF.busy = false; render(host);
      say(/reject|cancel|abort|denied|User/i.test(t) && !/Checked just before/.test(t) ? 'Cancelled in the wallet – nothing was changed.' : 'Not sent: ' + (/^Checked just before/.test(t) ? t : k.esc(t)), true);
    }
  }

  window.YICFUEL = { render, _test: { SF, moves, ships } };
})();
