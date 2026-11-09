/* Feed crews – Logistics Hub – TEST ONLY (?beta=1) (Mark, 9 Nov 2026)
   "A button to feed all the crew but also let you select ones you don't think need feeding."
   Mark: game actions stay in the Logistics Hub, not on the main site. So:
   - Crew Quarters gets a "🍽 Feed crews" button that opens the hub (?dock=1&feed=1) – it sends nothing itself.
   - In the hub, "🍽 Feed crews" mode (vendor/dock.js modeBar) shows a card per crew with a tick. Every crew that
     can be fed (food under 95%, Food stored on its rock, not in flight) starts ticked; click a card to untick.
   Each crew is fed from the biggest Food stock on its own rock (stock shared out as it goes, A–Z),
   up to one year's food (1,000 kg per crewmate, same maths as the Logistics Hub's crew step).
   Nothing is sent until the player presses Approve AND approves again in their own wallet, and the
   connected wallet must be the one the page is showing. Only the game's ResupplyFood system is called:
     run_system('ResupplyFood', [5, buildingId, 2, food, 1, crewId])   (@influenceth/sdk 2.8.1, as tidy.js / dock.js)
   Busy crews start unticked – not yet known whether the game lets a busy crew be fed. */
(function () {
  'use strict';
  if (!/[?&]beta=1\b/.test(location.search)) return; // test only

  const DISPATCHER = '0x0422d33a3638dcc4c62e72e1d6942cd31eb643ef596ccac2351e0e21f6cd4bf4';
  const SLOT = 2, FOOD = 129, WAREHOUSE = 1, TANK = 10;
  const CLASS_COL = { 1: '#884fff', 2: '#e0282e', 3: '#ff8c1a', 4: '#ffd94f', 5: '#4f90ff' };
  const S = { pick: {}, busy: false, msg: '', err: false, sent: {} };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const D = () => (window.YIC && window.YIC.D) || null;
  const hex = (n) => '0x' + BigInt(n).toString(16);
  const short = (t) => '0x' + [...t].map((ch) => ch.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  const sameAddr = (a, b) => { try { return BigInt(a) === BigInt(b); } catch (e) { return false; } };
  const tonnes = (kg) => (kg >= 10000 ? Math.round(kg / 1000).toLocaleString('en-GB') : (kg / 1000).toLocaleString('en-GB', { maximumFractionDigits: 1 })) + ' t';
  const nm = (b) => (b && b.Name && b.Name.name) || 'Building #' + b.id;
  const inv = (b) => (b.Inventories || []).find((x) => x.slot === SLOT && x.status === 1);
  const isStore = (b) => b.Building && (b.Building.buildingType === WAREHOUSE || b.Building.buildingType === TANK);

  // ---------- Crew Quarters: a button that opens the hub in feed mode (sends nothing itself) ----------
  const H = window.YICDECKHERO;
  if (H && H.crew) {
    const orig = H.crew;
    H.crew = function (el) {
      orig(el);
      const row = el.querySelector('.cq-row');
      if (!row || el.querySelector('.cf-open')) return;
      const a = document.createElement('a');
      a.className = 'cf-open';
      a.href = location.pathname + (location.search ? location.search.replace(/[?&](dock|feed)=1\b/g, '').replace(/^&/, '?') + '&' : '?') + 'dock=1&feed=1';
      a.textContent = '🍽 Feed crews – in the Logistics Hub ▸';
      a.title = 'Opens the Logistics Hub, where game actions are sent';
      a.style.cssText = 'display:inline-block;margin:0 0 8px;padding:4px 12px 5px;border:1px solid #3fd68a;border-radius:4px;background:#0b110e;font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#3fd68a;text-decoration:none';
      row.before(a);
    };
  }

  // ---------- the plan ----------
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

  // ---------- Logistics Hub: 🍽 Feed crews mode (vendor/dock.js calls YICFEED.render) ----------
  const CSS = '#dk-ov .cf-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}' +
    '#dk-ov .cf-c{all:unset;box-sizing:border-box;cursor:pointer;display:flex;gap:10px;align-items:flex-start;background:#0b0e14;border:1px solid #232a37;border-radius:10px;padding:10px 12px}' +
    '#dk-ov .cf-c.on{border-color:#ffb03b88;box-shadow:0 0 14px #ff8a1f22}#dk-ov .cf-c.no{cursor:default;opacity:.5}' +
    '#dk-ov .cf-tk{flex:none;width:1.2em;height:1.2em;margin-top:.15em;border:2px solid #3a4356;border-radius:4px;text-align:center;line-height:1em;font-weight:900;color:#1a1000}' +
    '#dk-ov .cf-c.on .cf-tk{background:var(--amber);border-color:var(--amber)}' +
    '#dk-ov .cf-n{font-weight:700;font-size:1.05em}#dk-ov .cf-s{color:var(--dim);font-size:.88em;line-height:1.3}' +
    '#dk-ov .cf-f{height:6px;border-radius:3px;background:#1d2330;overflow:hidden;margin:4px 0}#dk-ov .cf-f i{display:block;height:100%}' +
    '#dk-ov .cf-faces{display:flex;gap:3px;margin-top:5px}#dk-ov .cf-faces img{width:20px;height:25px;object-fit:cover;object-position:50% 0;border-radius:3px;border:1.5px solid;background:#000}' +
    '#dk-ov .cf-do{margin-top:4px;font-size:.88em}#dk-ov .cf-btn{background:#0d1d26;border:1px solid #8fe3ff66;color:var(--cyan);border-radius:8px;padding:6px 14px;font:600 1em Rajdhani,sans-serif;cursor:pointer}';

  function render(el) {
    if (!el) return;
    if (!document.getElementById('cf-css')) { const st = document.createElement('style'); st.id = 'cf-css'; st.textContent = CSS; document.head.appendChild(st); }
    const rows = plan().sort((a, b) => (!a.give - !b.give) || String(a.c.name).localeCompare(String(b.c.name)));
    const pick = rows.filter(ticked), kg = pick.reduce((s, r) => s + r.give, 0);
    const canN = rows.filter((r) => r.give && !S.sent[r.id]).length;
    const cms = (D() && D().crewmates) || {};
    const card = (r) => {
      const c = r.c, on = ticked(r), can = r.give && !S.sent[r.id];
      const pct = Math.round((c.food || 0) * 100), col = c.food == null ? '#5b6677' : c.food >= 0.65 ? '#3fd68a' : c.food >= 0.5 ? '#ffb03b' : '#ff4d4d';
      const faces = c.roster.map((id) => `<img src="cimg.php?id=${esc(id)}&s=1" alt="" loading="lazy" style="border-color:${CLASS_COL[(cms[id] || {}).class] || '#6b7a90'}">`).join('');
      const what = S.sent[r.id] ? '<span class="ok">Fed ✓</span>'
        : r.give ? `Feed <b>${tonnes(r.give)}</b> from ${esc(nm(r.src))}${r.busy ? ' · <span style="color:var(--amber)">busy</span>' : ''}`
          : esc(r.why === 'full' ? 'Fed enough' : r.why);
      return `<button type="button" class="cf-c${on ? ' on' : ''}${can ? '' : ' no'}" data-cf="${esc(r.id)}"><span class="cf-tk">${on ? '✓' : ''}</span><span style="flex:1;min-width:0">
<span class="cf-n">${esc(c.name)}</span><span class="cf-s" style="display:block">${esc(/in flight|in orbit/i.test(c.place || '') ? c.place.split(' · ')[0] : c.ast || c.place || '–')} · food ${c.food == null ? '–' : pct + '%'}</span>
<span class="cf-f" style="display:block"><i style="width:${pct}%;background:${col}"></i></span><span class="cf-faces">${faces}</span>
<span class="cf-do" style="display:block">${what}</span></span></button>`;
    };
    el.innerHTML = `<div class="card"><h2><span class="n">1</span>Crews to feed</h2>
<div class="row" style="margin-bottom:10px"><span class="src"><b>${pick.length}</b> of ${canN} ticked · <b>${tonnes(kg)}</b> Food</span><button type="button" class="cf-btn" data-cfa="all">Tick all</button><button type="button" class="cf-btn" data-cfa="none">Untick all</button></div>
<div class="cf-g">${rows.map(card).join('') || '<div class="src">No crews found.</div>'}</div>
<div class="hint">Click a crew to tick or untick it. Each crew is fed from the biggest Food stock on its own rock, up to a year's food. Busy crews start unticked.</div></div>
<div class="card"><h2><span class="n">2</span>Approve</h2>
<button class="approve" id="cf-go"${pick.length && !S.busy ? '' : ' disabled style="opacity:.5;cursor:not-allowed"'}>${S.busy ? 'WAITING FOR YOUR WALLET…' : 'APPROVE IN WALLET (feed ' + pick.length + ' crew' + (pick.length === 1 ? '' : 's') + ')'}</button>
<div class="hint">If the game can't feed one of them, it cancels the whole approval – nothing is changed.</div>
<div id="cf-wl" class="row" style="margin-top:8px"></div>
<div class="hint" style="display:${S.msg ? 'block' : 'none'};margin-top:10px;padding:10px 12px;border-radius:8px;border:1px solid ${S.err ? '#ff4d4d88' : '#8fe3ff55'};color:${S.err ? '#ffb3ae' : 'var(--ink)'}">${S.msg}</div></div>`;
    el.querySelectorAll('[data-cf]').forEach((b) => b.addEventListener('click', () => {
      const r = rows.find((x) => x.id === b.dataset.cf);
      if (r && r.give && !S.sent[r.id] && !S.busy) { S.pick[r.id] = !ticked(r); render(el); }
    }));
    el.querySelectorAll('[data-cfa]').forEach((b) => b.addEventListener('click', () => { rows.forEach((r) => { if (r.give) S.pick[r.id] = b.dataset.cfa === 'all'; }); render(el); }));
    const go = el.querySelector('#cf-go');
    if (go) go.addEventListener('click', () => start(el));
    if (window.YIC && window.YIC.fillFacesIn) window.YIC.fillFacesIn(el);
  }
  function say(el, html, err) { S.msg = html; S.err = !!err; render(el); }

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
    const wl = el.querySelector('#cf-wl');
    wl.innerHTML = '<span class="src">Pick the wallet to approve with:</span>' + list.map((w, i) => `<button type="button" class="cf-btn" data-i="${i}">${esc(w.name)}</button>`).join('');
    wl.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => send(el, list[+b.dataset.i])));
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
      say(el, '✓ Sent to the game – ' + pick.length + ' crew' + (pick.length === 1 ? '' : 's') + ' fed. ' + (h ? `Transaction <a href="https://voyager.online/tx/${esc(h)}" target="_blank" rel="noopener noreferrer" style="color:var(--cyan)">${esc(String(h).slice(0, 10))}…</a>. ` : '') + 'In a minute or two press ↻ Check the game again to see the new food levels.');
    } catch (e) {
      S.busy = false;
      const t = String((e && e.message) || e || '');
      say(el, /reject|cancel|abort|denied|User/i.test(t) ? 'Cancelled in the wallet – nothing was changed.' : 'Not sent: ' + esc(t) + ' (try unticking busy crews).', true);
    }
  }

  window.YICFEED = { render, count: () => plan().filter((r) => r.give && !S.sent[r.id]).length };
})();
