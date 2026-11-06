/* Storage tidy – Skippy's Awesome Command Deck (Mark, 6 Nov 2026) – TEST ONLY (?beta=1)
   Step 1 of the "move all X to X on X" plan (claude/storage-tidy-plan-2026-11-06.md): rename storage
   buildings to the "Skippys X" standard. The page shows exactly what will happen; nothing is sent
   until the player presses Approve AND approves again in their own wallet.
   Only the game's ChangeName and SendDelivery systems are ever called, only on buildings the wallet's crews control,
   and the connected wallet must be the one the page is showing. No pasted code, no other actions.
   Step 2 (6 Nov 2026): move goods with the game's SendDelivery, all in one approval.
   Call formats checked against @influenceth/sdk 2.8.1 System.getRunSystemCall:
   run_system('ChangeName', [5, buildingId, name, 1, crewId])
   run_system('SendDelivery', [5, fromId, slot, n, (product, amount)×n, 5, toId, slot, 1, crewId]). */
(function () {
  'use strict';
  if (!/[?&]beta=1\b/.test(location.search)) return; // test only

  const DISPATCHER = '0x0422d33a3638dcc4c62e72e1d6942cd31eb643ef596ccac2351e0e21f6cd4bf4';
  // Newark plan, agreed by Mark 6 Nov 2026 (building id, name now, new name)
  const PLAN = {
    rock: 'Newark',
    renames: [
      [40805, 'Skippys Iron', "Skippys Troilite"],
      [41334, 'Skippys Raw Metals', "Skippys Taenite"],
      [41429, 'Skippys Supply Co Ltd', "Skippys Steel"],
      [34498, 'Skippys Propellent Processin', "Skippys Gases"],
      [24646, 'Skippys Newark Warehouse', "Skippys Supplies"],
    ],
    // Step 2 – moves (from building, to building, product ids). Each move sends the FULL amount the
    // "from" building holds right now (read live), out of and into the main storage slot.
    moves: [
      [40805, 41334, [20]],          // Troilite → Taenite: Taenite
      [41334, 34498, [7, 6, 23]],    // Taenite → Gases: Carbon Monoxide, Carbon Dioxide, Oxygen
      [41334, 41429, [31, 19]],      // Taenite → Steel: Nickel, Graphite
      [41334, 24646, [18, 37]],      // Taenite → Supplies: Rhabdite, Iron Sulfide
      [24646, 34498, [5]],           // Supplies → Gases: Sulfur Dioxide
      [34498, 24646, [66, 169]],     // Gases → Supplies: Silica Powder, Tungsten Powder
      [41438, 24646, [25]],          // Water → Supplies: Raw Salts
    ],
  };
  const PN = { 5: 'Sulfur Dioxide', 6: 'Carbon Dioxide', 7: 'Carbon Monoxide', 18: 'Rhabdite', 19: 'Graphite', 20: 'Taenite', 23: 'Oxygen', 25: 'Raw Salts', 31: 'Nickel', 37: 'Iron Sulfide', 66: 'Silica Powder', 169: 'Tungsten Powder' };
  const SLOT = 2; // warehouse / tank farm main storage (inventoryType 10 / 19)
  // renames are done (6 Nov); step 2 goes all at once (Mark: "lets go for all at once this time")
  const S = { tick: {}, mtick: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }, busy: false, msg: '', tx: '' };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const D = () => (window.YIC && window.YIC.D) || null;
  const hex = (n) => '0x' + BigInt(n).toString(16);
  // Starknet short string (max 31 plain ASCII characters) → felt
  const short = (s) => {
    if (!/^[\x20-\x7e]{1,31}$/.test(s)) throw new Error('Name must be plain letters, numbers and symbols (max 31).');
    return '0x' + [...s].map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  };
  // the game's building-name rules (@influenceth/sdk Name.TYPES[BUILDING]): 4–28 characters, single spaces
  const nameErr = (s) => {
    if (s.length < 4 || s.length > 28) return 'must be 4 to 28 characters';
    if (!/^(\S+\s)*\S+$/.test(s)) return 'single spaces only, none at the ends';
    // the contract is stricter than the SDK: "Skippy's Troilite" failed with E6013 name invalid (6 Nov 2026)
    if (!/^[A-Za-z0-9 ]+$/.test(s)) return 'letters, numbers and spaces only';
    return '';
  };
  const sameAddr = (a, b) => { try { return BigInt(a) === BigInt(b); } catch (e) { return false; } };

  function rows() {
    const d = D(), all = (d && d.allB) || [];
    return PLAN.renames.map(([id, was, to]) => {
      const b = all.find((x) => x.id === id);
      const now = b && b.Name && b.Name.name;
      const crew = b && b.Control && b.Control.controller && b.Control.controller.id;
      const crewName = (crew && d.crewN && d.crewN[crew]) || (crew ? 'Crew #' + crew : '');
      let state = 'ok', note = 'Ready';
      if (!b) { state = 'no'; note = 'Not found in your buildings'; }
      else if (now === to) { state = 'done'; note = 'Already done ✓'; }
      else if (now !== was) { state = 'no'; note = 'Name has changed since the plan – skipped'; }
      else if (nameErr(to)) { state = 'no'; note = 'New name ' + nameErr(to); }
      return { id, was, to, now, crew, crewName, state, note };
    });
  }

  function css() {
    if (document.getElementById('st-css')) return;
    const s = document.createElement('style');
    s.id = 'st-css';
    s.textContent = `
#st-wrap{max-width:980px;margin:18px auto;padding:0 16px;color:#dbe7f5}
#st-wrap h2{margin:0 0 4px;color:#8fe3ff;font-size:22px}
#st-wrap .st-test{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:6px;background:#3a2a00;color:#ffd24a;font-size:12px;vertical-align:middle}
#st-wrap p{color:#b7c3d4;line-height:1.5;margin:8px 0}
#st-wrap table{width:100%;border-collapse:collapse;margin:14px 0;font-size:15px}
#st-wrap th,#st-wrap td{padding:9px 10px;border-bottom:1px solid #1d2734;text-align:left}
#st-wrap th{color:#8b9ab0;font-weight:600;font-size:13px}
#st-wrap td.st-to{color:#ffd24a;font-weight:700}
#st-wrap tr.st-off td{opacity:.55}
#st-wrap input[type=checkbox]{width:18px;height:18px;cursor:pointer}
#st-wrap .st-go{font:700 16px system-ui,sans-serif;padding:12px 22px;border-radius:10px;border:1px solid #57ff65;background:#0f2a14;color:#57ff65;cursor:pointer}
#st-wrap .st-go:disabled{opacity:.4;cursor:default}
#st-msg{margin-top:12px;padding:10px 12px;border-radius:8px;background:#0d1520;border:1px solid #2b5a72;display:none}
#st-msg.err{border-color:#ff564d;color:#ffb3ae}
#st-wrap .st-w{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
#st-wrap .st-w button{padding:8px 14px;border-radius:8px;border:1px solid #2b5a72;background:#131821;color:#e6ebf2;cursor:pointer}
#st-wrap a{color:#8fe3ff}`;
    document.head.appendChild(s);
  }

  function mrows() {
    const d = D(), all = (d && d.allB) || [];
    const byId = (id) => all.find((x) => x.id === id);
    const nm = (b, id) => (b && b.Name && b.Name.name) || 'Building #' + id;
    const crewOf = (b) => b && b.Control && b.Control.controller && b.Control.controller.id;
    return PLAN.moves.map(([from, to, prods], i) => {
      const o = byId(from), t = byId(to);
      const inv = o && (o.Inventories || []).find((x) => x.slot === SLOT && x.status === 1);
      const items = prods.map((p) => ({ p, a: ((inv && inv.contents) || []).reduce((s, c) => s + (c.product === p ? c.amount : 0), 0) })).filter((x) => x.a > 0);
      const crew = crewOf(o), tcrew = crewOf(t);
      let state = 'ok', note = tcrew === crew ? 'Arrives on its own' : 'Needs accepting';
      if (!o || !t) { state = 'no'; note = 'Building not found'; }
      else if (!inv) { state = 'no'; note = 'No storage found'; }
      else if (!items.length) { state = 'done'; note = 'Nothing left to move ✓'; }
      return { i, from, to, fromN: nm(o, from), toN: nm(t, to), items, crew, crewName: (crew && d.crewN && d.crewN[crew]) || (crew ? 'Crew #' + crew : ''), state, note };
    });
  }
  const tonnes = (kg) => (kg >= 10000 ? Math.round(kg / 1000).toLocaleString('en-GB') : (kg / 1000).toLocaleString('en-GB', { maximumFractionDigits: 1 })) + ' t';

  function page(m) {
    css();
    const r = rows(), mv = mrows();
    const picked = r.filter((x) => x.state === 'ok' && S.tick[x.id]);
    const mpicked = mv.filter((x) => x.state === 'ok' && S.mtick[x.i]);
    const allDone = r.every((x) => x.state === 'done');
    m.innerHTML = `<div id="st-wrap">
<h2>Storage tidy – ${esc(PLAN.rock)} <span class="st-test">TEST</span></h2>
<p>Nothing happens unless you press Approve <b>and</b> approve again in your wallet.</p>
<h3 style="color:#8fe3ff;margin:18px 0 0">Step 1 of 3: renames${allDone ? ' – done ✓' : ''}</h3>
<table><thead><tr><th></th><th>Name now</th><th>New name</th><th>Crew</th><th>Check</th></tr></thead><tbody>
${r.map((x) => `<tr class="${x.state === 'ok' ? '' : 'st-off'}"><td>${x.state === 'ok' ? `<input type="checkbox" data-id="${x.id}"${S.tick[x.id] ? ' checked' : ''}>` : ''}</td>
<td>${esc(x.now || x.was)}</td><td class="st-to">${esc(x.to)}</td><td>${esc(x.crewName)}</td><td>${esc(x.note)}</td></tr>`).join('')}
</tbody></table>
${allDone ? '' : `<button class="st-go" id="st-go"${picked.length && !S.busy ? '' : ' disabled'}>Approve ${picked.length} rename${picked.length === 1 ? '' : 's'}</button>`}
<h3 style="color:#8fe3ff;margin:26px 0 0">Step 2 of 3: move goods</h3>
<p>Each delivery sends everything of those products that the building holds right now.</p>
<table><thead><tr><th></th><th>From</th><th>To</th><th>Goods</th><th>Sent by</th><th>Check</th></tr></thead><tbody>
${mv.map((x) => `<tr class="${x.state === 'ok' ? '' : 'st-off'}"><td>${x.state === 'ok' ? `<input type="checkbox" data-mi="${x.i}"${S.mtick[x.i] ? ' checked' : ''}>` : ''}</td>
<td>${esc(x.fromN)}</td><td class="st-to">${esc(x.toN)}</td><td>${x.items.map((it) => esc(PN[it.p] || '#' + it.p) + ' ' + tonnes(it.a)).join('<br>') || '–'}</td><td>${esc(x.crewName)}</td><td>${esc(x.note)}</td></tr>`).join('')}
</tbody></table>
<button class="st-go" id="st-mgo"${mpicked.length && !S.busy ? '' : ' disabled'}>Approve ${mpicked.length} deliver${mpicked.length === 1 ? 'y' : 'ies'}</button>
<div class="st-w" id="st-wl"></div>
<div id="st-msg"></div>
<p style="margin-top:16px;font-size:13px">Step 3 (accepting deliveries and checking the result) comes later. Until then, accept them in the game or see Waiting to accept on the Bridge.</p>
</div>`;
    m.querySelectorAll('input[data-id]').forEach((c) => c.addEventListener('change', () => { S.tick[c.dataset.id] = c.checked; page(m); }));
    m.querySelectorAll('input[data-mi]').forEach((c) => c.addEventListener('change', () => { S.mtick[c.dataset.mi] = c.checked; page(m); }));
    const g = m.querySelector('#st-go');
    if (g) g.addEventListener('click', () => start(m, () => renameCalls(picked), 'rename'));
    m.querySelector('#st-mgo').addEventListener('click', () => start(m, () => moveCalls(mpicked), 'delivery'));
    if (S.msg) say(m, S.msg, S.msgErr);
  }

  const call = (sys, data) => ({ contract_address: DISPATCHER, entry_point: 'run_system', calldata: [short(sys), hex(data.length), ...data.map(hex)] });
  // one ChangeName call per building
  const renameCalls = (picked) => picked.map((x) => {
    if (nameErr(x.to)) throw new Error(esc(x.to) + ': ' + nameErr(x.to));
    return { contract_address: DISPATCHER, entry_point: 'run_system', calldata: [short('ChangeName'), '0x5', '0x5', hex(x.id), short(x.to), '0x1', hex(x.crew)] };
  });
  // one SendDelivery call per from → to pair, sent by the crew that controls the "from" building
  const moveCalls = (picked) => picked.map((x) => {
    if (!x.crew || !x.items.length) throw new Error('Nothing to send from ' + esc(x.fromN));
    return call('SendDelivery', [5, x.from, SLOT, x.items.length, ...x.items.flatMap((it) => [it.p, it.a]), 5, x.to, SLOT, 1, x.crew]);
  });

  function say(m, html, err) {
    S.msg = html; S.msgErr = !!err;
    const e = m.querySelector('#st-msg');
    if (!e) return;
    e.style.display = 'block';
    e.className = err ? 'err' : '';
    e.innerHTML = html;
  }

  // same wallet list as vendor/wallet.js
  function wallets() {
    const seen = {}, out = [];
    let keys = ['starknet', 'starknet_argentX', 'starknet_ready', 'starknet_braavos', 'starknet_okxwallet', 'starknet_keplr'];
    try { keys = keys.concat(Object.getOwnPropertyNames(window)); } catch (e) {}
    keys.forEach((k) => {
      if (!/^starknet/.test(k)) return;
      let w; try { w = window[k]; } catch (e) { return; }
      if (!w || typeof w !== 'object' || !w.id || !w.name || seen[w.id]) return;
      if (typeof w.request !== 'function' && typeof w.enable !== 'function') return;
      seen[w.id] = 1; out.push(w);
    });
    return out;
  }

  function start(m, build, kind) {
    const list = wallets();
    const wl = m.querySelector('#st-wl');
    if (!list.length) return say(m, 'No Starknet wallet found in this browser. Open this page in the browser that has your wallet (e.g. Brave with Ready).', true);
    if (list.length === 1) return send(m, build, kind, list[0]);
    wl.innerHTML = '<span style="align-self:center">Pick the wallet to approve with:</span>' + list.map((w, i) => `<button data-i="${i}">${esc(w.name)}</button>`).join('');
    wl.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { wl.innerHTML = ''; send(m, build, kind, list[+b.dataset.i]); }));
  }

  async function account(w) {
    let a = null;
    if (typeof w.request === 'function') {
      try { const r = await w.request({ type: 'wallet_requestAccounts' }); if (Array.isArray(r) && r[0]) a = r[0]; } catch (e) { if (typeof w.enable !== 'function') throw e; }
    }
    if (!a && typeof w.enable === 'function') { const r = await w.enable(); if (Array.isArray(r) && r[0]) a = r[0]; }
    if (!a && w.selectedAddress) a = w.selectedAddress;
    return a;
  }

  async function send(m, build, kind, w) {
    const d = D();
    if (!d || !d.wallet) return say(m, 'Your game data is not loaded yet – try again in a moment.', true);
    S.busy = true; page(m);
    try {
      const a = await account(w);
      if (!a) throw new Error('The wallet did not share an address.');
      if (!sameAddr(a, d.wallet)) throw new Error('That wallet (' + esc(a) + ') is not the one this page is showing. Switch account in your wallet and try again.');
      const calls = build();
      if (!calls.length) throw new Error('Nothing ticked.');
      say(m, 'Waiting for your wallet… check the wallet window and approve (or reject) it there.');
      let res;
      if (typeof w.request === 'function') {
        res = await w.request({ type: 'wallet_addInvokeTransaction', params: { calls } });
      } else if (w.account && typeof w.account.execute === 'function') {
        res = await w.account.execute(calls.map((c) => ({ contractAddress: c.contract_address, entrypoint: c.entry_point, calldata: c.calldata })));
      } else throw new Error('This wallet cannot send transactions from a web page.');
      const h = res && (res.transaction_hash || res.transactionHash);
      S.tx = h || '';
      say(m, '✓ Sent to the game. ' + (h ? `Transaction <a href="https://voyager.online/tx/${esc(h)}" target="_blank" rel="noopener noreferrer">${esc(String(h).slice(0, 10))}…</a>. ` : '') +
        (kind === 'rename' ? 'In a minute or two, press Refresh at the top of the page and the new names should show as "Already done ✓".'
          : 'In a minute or two, press Refresh at the top of the page. Rows show "Nothing left to move ✓" once sent; deliveries between different crews then wait for you to accept them.'));
    } catch (e) {
      const t = String((e && e.message) || e || '');
      say(m, /reject|cancel|abort|denied|User/i.test(t) ? 'Cancelled in the wallet – nothing was changed.' : 'Not sent: ' + t, true);
    } finally {
      S.busy = false;
      const msg = S.msg, err = S.msgErr;
      if (isOn()) { page(m); say(m, msg, err); }
    }
  }

  const isOn = () => { const b = document.getElementById('vST'); return !!(b && b.className === 'on'); };

  // hidden "Storage tidy" page button – the Engineering deck shows it as a console (decks.js, beta only)
  const hook = () => {
    const after = document.getElementById('vB'), main = document.getElementById('main');
    if (!after || !main || document.getElementById('vST')) return;
    const b = document.createElement('button');
    b.id = 'vST'; b.textContent = 'Storage tidy';
    after.after(b);
    b.addEventListener('click', () => {
      document.querySelectorAll('button.on').forEach((x) => x.classList.remove('on'));
      try { window.YIC.view = 'M'; } catch (e) {}
      b.className = 'on';
      S.msg = '';
      page(main);
    });
  };
  document.addEventListener('click', (e) => {
    const b = document.getElementById('vST'), t = e.target.closest && e.target.closest('button[id^="v"]');
    if (b && t && t !== b) b.className = '';
  }, true);
  setInterval(hook, 700);
})();
