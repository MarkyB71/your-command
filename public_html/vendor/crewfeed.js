/* Feed crews – Crew Quarters – TEST ONLY (?beta=1) (Mark, 9 Nov 2026)
   "A button to feed all the crew but also let you select ones you don't think need feeding."
   A "Feed crews" button above the lockers. Pressing it puts a tick on every locker that can be fed
   (food under 95%, on a rock with Food stored, not in flight). Click a locker to untick / tick it.
   Each crew is fed from the biggest Food stock on its own rock (stock shared out as it goes),
   up to one year's food (1,000 kg per crewmate, same maths as the Logistics Hub).
   Nothing is sent until the player presses Approve AND approves again in their own wallet, and the
   connected wallet must be the one the page is showing. Only the game's ResupplyFood system is called:
     run_system('ResupplyFood', [5, buildingId, 2, food, 1, crewId])   (@influenceth/sdk 2.8.1, as tidy.js / dock.js)
   Busy crews start unticked – not yet known whether the game lets a busy crew be fed. */
(function () {
  'use strict';
  if (!/[?&]beta=1\b/.test(location.search)) return; // test only
  const H = window.YICDECKHERO;
  if (!H || !H.crew) return;

  const DISPATCHER = '0x0422d33a3638dcc4c62e72e1d6942cd31eb643ef596ccac2351e0e21f6cd4bf4';
  const SLOT = 2, FOOD = 129, WAREHOUSE = 1, TANK = 10;
  const AMBER = '#ffab3d', GREEN = '#3fd68a', RED = '#ff6b6b';
  const S = { on: false, pick: {}, busy: false, msg: '', err: false, sent: {} };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const D = () => (window.YIC && window.YIC.D) || null;
  const hex = (n) => '0x' + BigInt(n).toString(16);
  const short = (t) => '0x' + [...t].map((ch) => ch.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  const sameAddr = (a, b) => { try { return BigInt(a) === BigInt(b); } catch (e) { return false; } };
  const tonnes = (kg) => (kg >= 10000 ? Math.round(kg / 1000).toLocaleString('en-GB') : (kg / 1000).toLocaleString('en-GB', { maximumFractionDigits: 1 })) + ' t';
  const nm = (b) => (b && b.Name && b.Name.name) || 'Building #' + b.id;
  const inv = (b) => (b.Inventories || []).find((x) => x.slot === SLOT && x.status === 1);
  const isStore = (b) => b.Building && (b.Building.buildingType === WAREHOUSE || b.Building.buildingType === TANK);

  const CSS = `
.cf-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 8px;font:12px/1.4 system-ui,sans-serif;color:#c8f5dc}
.cf-bar button{all:unset;box-sizing:border-box;cursor:pointer;padding:4px 12px 5px;border:1px solid ${GREEN};border-radius:4px;background:#0b110e;font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:${GREEN}}
.cf-bar button:hover,.cf-bar button:focus-visible{background:${GREEN};color:#05070a}
.cf-bar button.cf-go{border-color:${AMBER};color:${AMBER}}
.cf-bar button.cf-go:hover{background:${AMBER};color:#05070a}
.cf-bar button[disabled]{opacity:.45;cursor:not-allowed;pointer-events:none}
.cf-warn{flex-basis:100%;padding:5px 10px;border:1px solid ${AMBER};border-radius:4px;background:rgba(255,171,61,.1);color:${AMBER};font-weight:700;letter-spacing:.06em}
.cf-msg{flex-basis:100%;color:#c8f5dc}.cf-msg.err{color:${RED}}.cf-msg a{color:${GREEN}}
.cf-tk{position:absolute;top:6px;left:6px;width:16px;height:16px;border:2px solid #5b6b63;border-radius:3px;background:#060a08;font:900 12px/13px system-ui;text-align:center;color:#05070a}
.cf-tk.on{background:${GREEN};border-color:${GREEN}}
.cf-feed{font:600 11px/1.35 system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cq-lk.cf-no{opacity:.5}
`;
  function addCss() {
    if (document.getElementById('cf-css')) return;
    const s = document.createElement('style');
    s.id = 'cf-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // one row per crew: can it be fed, how much, from where
  function plan() {
    const d = D();
    if (!d) return [];
    const stock = {}; // rock name -> [[building, kg left]]
    (d.allB || []).forEach((b) => {
      const r = b.meta && b.meta.asteroid && b.meta.asteroid.name;
      if (!r || !b.Building || b.Building.status !== 3 || !isStore(b)) return;
      const kg = ((inv(b) || { contents: [] }).contents || []).reduce((s, x) => s + (x.product === FOOD ? x.amount : 0), 0);
      if (kg > 0) (stock[r] = stock[r] || []).push([b, kg]);
    });
    const crews = (d.crewList || []).filter((c) => c.roster && c.roster.length).sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return crews.map((c) => {
      const row = { c, id: String(c.id), busy: !!c.busy, give: 0, src: null, why: '' };
      if (c.food == null) row.why = 'food not known';
      else if (c.food >= 0.95) row.why = 'full';
      else if (/in flight|in orbit/i.test(c.place || '') || !c.ast) row.why = 'not on a rock';
      else {
        // time since fed in years from the food ratio (inverse of SDK getCurrentFoodRatio), at most one year's food
        const yrs = Math.min(1, c.food >= 0.5 ? 1 - c.food : (0.75 - c.food) / 0.5);
        const need = Math.floor(c.roster.length * 1000 * yrs);
        const list = (stock[c.ast] || []).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]);
        if (need <= 0) row.why = 'full';
        else if (!list.length) row.why = stock[c.ast] ? 'Food on ' + c.ast + ' all used above' : 'no Food on ' + c.ast;
        else { row.src = list[0][0]; row.give = Math.min(need, list[0][1]); list[0][1] -= row.give; }
      }
      return row;
    });
  }
  const ticked = (r) => !!r.give && !S.sent[r.id] && (r.id in S.pick ? S.pick[r.id] : !r.busy);

  function paint(el) {
    const rows = plan(), by = {};
    rows.forEach((r) => { by[r.id] = r; });
    let bar = el.querySelector('.cf-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'cf-bar';
      const row = el.querySelector('.cq-row');
      if (!row) return;
      row.before(bar);
    }
    const pick = rows.filter(ticked), kg = pick.reduce((s, r) => s + r.give, 0);
    const canN = rows.filter((r) => r.give && !S.sent[r.id]).length;
    const msg = S.msg ? `<span class="cf-msg${S.err ? ' err' : ''}">${S.msg}</span>` : '';
    bar.innerHTML = !S.on
      ? `<button type="button" data-cf="open">🍽 Feed crews</button>${msg}`
      : `<span class="cf-warn">⚠ LIVE GAME ACTION · SENT ONLY WHEN YOU APPROVE IN YOUR WALLET</span>
<span><b>${pick.length}</b> of ${canN} crew${canN === 1 ? '' : 's'} ticked · <b>${tonnes(kg)}</b> Food · click a locker to tick / untick</span>
<button type="button" class="cf-go" data-cf="go"${pick.length && !S.busy ? '' : ' disabled'}>${S.busy ? 'Waiting for your wallet…' : 'Approve: feed ' + pick.length}</button>
<button type="button" data-cf="all">Tick all</button><button type="button" data-cf="none">Untick all</button><button type="button" data-cf="close">Close</button>${msg}`;

    el.querySelectorAll('.cq-lk[data-crew]').forEach((lk) => {
      const r = by[lk.dataset.crew];
      lk.querySelectorAll('.cf-tk,.cf-feed').forEach((x) => x.remove());
      lk.classList.remove('cf-no');
      if (!S.on || !r) return;
      const on = ticked(r);
      if (r.give && !S.sent[r.id]) {
        const tk = document.createElement('span');
        tk.className = 'cf-tk' + (on ? ' on' : '');
        tk.textContent = on ? '✓' : '';
        lk.appendChild(tk);
      }
      const t = document.createElement('span');
      t.className = 'cf-feed';
      if (S.sent[r.id]) { t.textContent = 'Fed ✓'; t.style.color = GREEN; }
      else if (r.give) { t.textContent = 'Feed ' + tonnes(r.give) + ' from ' + nm(r.src) + (r.busy ? ' · busy' : ''); t.style.color = on ? GREEN : '#8fa79a'; t.title = t.textContent; }
      else { t.textContent = r.why === 'full' ? 'Fed enough' : r.why; t.style.color = '#8fa79a'; lk.classList.add('cf-no'); }
      const name = lk.querySelector('.cq-name');
      if (name) name.after(t); else lk.appendChild(t);
    });
  }

  function wire(el) {
    if (el.dataset.cfWired) return;
    el.dataset.cfWired = '1';
    // capture: while feeding is open, a locker click ticks it instead of opening the crew card
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-cf]');
      if (b) {
        e.stopPropagation();
        const k = b.dataset.cf;
        if (k === 'open') { S.on = true; S.msg = ''; }
        else if (k === 'close') { S.on = false; S.msg = ''; }
        else if (k === 'all') plan().forEach((r) => { if (r.give) S.pick[r.id] = true; });
        else if (k === 'none') plan().forEach((r) => { S.pick[r.id] = false; });
        else if (k === 'go') return start(el);
        return paint(el);
      }
      if (!S.on) return;
      const lk = e.target.closest('.cq-lk[data-crew]');
      if (!lk) return;
      e.stopPropagation();
      e.preventDefault();
      const r = plan().find((x) => x.id === lk.dataset.crew);
      if (r && r.give && !S.sent[r.id]) { S.pick[r.id] = !ticked(r); paint(el); }
    }, true);
  }

  function say(el, html, err) { S.msg = html; S.err = !!err; paint(el); }

  // same wallet path as vendor/tidy.js
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
  function start(el) {
    const list = wallets();
    if (!list.length) return say(el, 'No Starknet wallet found in this browser. Open this page in the browser that has your wallet.', true);
    if (list.length === 1) return send(el, list[0]);
    S.msg = 'Pick the wallet to approve with: ' + list.map((w, i) => `<button type="button" data-cfw="${i}">${esc(w.name)}</button>`).join(' ');
    S.err = false;
    paint(el);
    el.querySelectorAll('[data-cfw]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); S.msg = ''; send(el, list[+b.dataset.cfw]); }));
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
  async function send(el, w) {
    const d = D();
    if (!d || !d.wallet) return say(el, 'Your game data is not loaded yet – try again in a moment.', true);
    const pick = plan().filter(ticked);
    if (!pick.length) return say(el, 'Nothing ticked.', true);
    S.busy = true;
    say(el, 'Waiting for your wallet… check the wallet window and approve (or reject) it there.');
    try {
      const a = await account(w);
      if (!a) throw new Error('The wallet did not share an address.');
      if (!sameAddr(a, d.wallet)) throw new Error('That wallet (' + esc(a) + ') is not the one this page is showing. Switch account in your wallet and try again.');
      const calls = pick.map((r) => ({ contract_address: DISPATCHER, entry_point: 'run_system', calldata: [short('ResupplyFood'), '0x6', '0x5', hex(r.src.id), hex(SLOT), hex(r.give), '0x1', hex(r.c.id)] }));
      let res;
      if (typeof w.request === 'function') res = await w.request({ type: 'wallet_addInvokeTransaction', params: { calls } });
      else if (w.account && typeof w.account.execute === 'function') res = await w.account.execute(calls.map((c) => ({ contractAddress: c.contract_address, entrypoint: c.entry_point, calldata: c.calldata })));
      else throw new Error('This wallet cannot send transactions from a web page.');
      const h = res && (res.transaction_hash || res.transactionHash);
      pick.forEach((r) => { S.sent[r.id] = 1; });
      S.busy = false;
      say(el, '✓ Sent to the game – ' + pick.length + ' crew' + (pick.length === 1 ? '' : 's') + ' fed. ' + (h ? `Transaction <a href="https://voyager.online/tx/${esc(h)}" target="_blank" rel="noopener noreferrer">${esc(String(h).slice(0, 10))}…</a>. ` : '') + 'Food bars update when the site next refreshes.');
    } catch (e) {
      S.busy = false;
      const t = String((e && e.message) || e || '');
      say(el, /reject|cancel|abort|denied|User/i.test(t) ? 'Cancelled in the wallet – nothing was changed.' : 'Not sent: ' + esc(t) + ' (if one crew can’t be fed, the game cancels the whole approval – try unticking busy crews).', true);
    }
  }

  const orig = H.crew;
  H.crew = function (el) {
    orig(el);
    addCss();
    wire(el);
    paint(el);
  };
})();
