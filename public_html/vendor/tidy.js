/* Storage tidy – Skippy's Awesome Command Deck (Mark, 6 Nov 2026) – TEST ONLY (?beta=1)
   Step 1 of the "move all X to X on X" plan (claude/storage-tidy-plan-2026-11-06.md): rename storage
   buildings to the "Skippys X" standard. The page shows exactly what will happen; nothing is sent
   until the player presses Approve AND approves again in their own wallet.
   Only the game's ChangeName system is ever called, only on buildings the wallet's crews control,
   and the connected wallet must be the one the page is showing. No pasted code, no other actions.
   Call format checked against @influenceth/sdk 2.8.1 System.getRunSystemCall('ChangeName', …):
   Dispatcher.run_system('ChangeName', [5, buildingId, name, 1, crewId]). */
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
  };
  const S = { tick: { 40805: true }, busy: false, msg: '', tx: '' }; // first test: just one rename ticked

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
#st-go{font:700 16px system-ui,sans-serif;padding:12px 22px;border-radius:10px;border:1px solid #57ff65;background:#0f2a14;color:#57ff65;cursor:pointer}
#st-go:disabled{opacity:.4;cursor:default}
#st-msg{margin-top:12px;padding:10px 12px;border-radius:8px;background:#0d1520;border:1px solid #2b5a72;display:none}
#st-msg.err{border-color:#ff564d;color:#ffb3ae}
#st-wrap .st-w{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
#st-wrap .st-w button{padding:8px 14px;border-radius:8px;border:1px solid #2b5a72;background:#131821;color:#e6ebf2;cursor:pointer}
#st-wrap a{color:#8fe3ff}`;
    document.head.appendChild(s);
  }

  function page(m) {
    css();
    const r = rows();
    const picked = r.filter((x) => x.state === 'ok' && S.tick[x.id]);
    m.innerHTML = `<div id="st-wrap">
<h2>Storage tidy – ${esc(PLAN.rock)} <span class="st-test">TEST</span></h2>
<p><b>Step 1 of 3: renames.</b> Tick the buildings to rename, then press Approve. Your wallet then shows the request,
and nothing happens unless you approve it there too.</p>
<p>For the first test only one rename is ticked.</p>
<table><thead><tr><th></th><th>Name now</th><th>New name</th><th>Crew</th><th>Check</th></tr></thead><tbody>
${r.map((x) => `<tr class="${x.state === 'ok' ? '' : 'st-off'}"><td>${x.state === 'ok' ? `<input type="checkbox" data-id="${x.id}"${S.tick[x.id] ? ' checked' : ''}>` : ''}</td>
<td>${esc(x.now || x.was)}</td><td class="st-to">${esc(x.to)}</td><td>${esc(x.crewName)}</td><td>${esc(x.note)}</td></tr>`).join('')}
</tbody></table>
<button id="st-go"${picked.length && !S.busy ? '' : ' disabled'}>Approve ${picked.length} rename${picked.length === 1 ? '' : 's'}</button>
<div class="st-w" id="st-wl"></div>
<div id="st-msg"></div>
<p style="margin-top:16px;font-size:13px">Steps 2 (moving goods) and 3 (checking the result) come later.</p>
</div>`;
    m.querySelectorAll('input[data-id]').forEach((c) => c.addEventListener('change', () => { S.tick[c.dataset.id] = c.checked; page(m); }));
    m.querySelector('#st-go').addEventListener('click', () => start(m, picked));
    if (S.msg) say(m, S.msg, S.msgErr);
  }

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

  function start(m, picked) {
    const list = wallets();
    const wl = m.querySelector('#st-wl');
    if (!list.length) return say(m, 'No Starknet wallet found in this browser. Open this page in the browser that has your wallet (e.g. Brave with Ready).', true);
    if (list.length === 1) return send(m, picked, list[0]);
    wl.innerHTML = '<span style="align-self:center">Pick the wallet to approve with:</span>' + list.map((w, i) => `<button data-i="${i}">${esc(w.name)}</button>`).join('');
    wl.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { wl.innerHTML = ''; send(m, picked, list[+b.dataset.i]); }));
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

  async function send(m, picked, w) {
    const d = D();
    if (!d || !d.wallet) return say(m, 'Your game data is not loaded yet – try again in a moment.', true);
    S.busy = true; page(m);
    try {
      const a = await account(w);
      if (!a) throw new Error('The wallet did not share an address.');
      if (!sameAddr(a, d.wallet)) throw new Error('That wallet (' + esc(a) + ') is not the one this page is showing. Switch account in your wallet and try again.');
      // build one ChangeName call per building
      const calls = picked.map((x) => {
        if (nameErr(x.to)) throw new Error(esc(x.to) + ': ' + nameErr(x.to));
        return {
          contract_address: DISPATCHER,
          entry_point: 'run_system',
          calldata: [short('ChangeName'), '0x5', '0x5', hex(x.id), short(x.to), '0x1', hex(x.crew)],
        };
      });
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
        'In a minute or two, press Refresh at the top of the page and the new name should show here as "Already done ✓".');
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
