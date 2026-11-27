/* ⛽ Fuel a fleet – Logistics Hub › Cargo bay – TEST ONLY (?beta=1&dock=1), Mark 27 Nov 2026
   From Fristy's 23 Nov batch (B): "Fuel Fleet: fill all chosen ships with fuel from a number of chosen tank farms,
   and pick a crew for this action." Mark's choices (27 Nov):
   - ships parked on the SAME rock only (fuel transport ships may come in Discovery – not now)
   - from propellant already in storage only (making it / buying it come later)
   - not enough to fill them all? the player picks: share it out evenly, or fill them in the order they were ticked
   - crew: the best ready crew is picked, and the player can change it
   - storage: every store on the rock with propellant, all ticked, nearest first; the player can untick and change the order
   One approval: one SendDelivery per store → ship pair
     run_system('SendDelivery', [5, storeId, 2, 1, 170, n, 6, shipId, 1, 1, crewId])  (same as vendor/shipfuel.js)
   Uses the hub's own helpers (window.YICDOCK, vendor/dock.js). */
(function () {
  'use strict';
  if (!/[?&]dock=1\b/.test(location.search)) return;
  const K = () => window.YICDOCK;
  const PROP = 170, PSLOT = 1;
  const TANK = { 1: 2e8, 2: 4e9, 3: 24e9, 4: 2e9 }; // grams of propellant a full tank holds, by ship type (SDK Ship.TYPES)
  const FF = { rock: '', fl: [], off: {}, ord: [], split: 'even', crew: 0, msg: '', msgErr: false, busy: false, sentAt: 0, cur: null };
  let host = null;

  const kgTxt = (kg) => kg >= 1e6 ? (+(kg / 1e6).toFixed(2)).toLocaleString() + ' kt' : kg >= 1000 ? (+(kg / 1000).toFixed(kg >= 1e5 ? 0 : 1)).toLocaleString() + ' t' : Math.round(kg).toLocaleString() + ' kg';
  const uG = () => K().grams(PROP) || 1000; // grams per unit of propellant
  const uKg = (u) => u * uG() / 1000;
  const have = (b) => ((K().inv(b) || { contents: [] }).contents.filter((c) => c.product === PROP).reduce((t, c) => t + c.amount, 0));
  const astName = (id) => { const Y = window.YIC || {}, D = Y.D || {}; const a = (Y.asts || []).find((x) => x.id === id) || (D.owned || []).find((x) => x.id === id); return a ? (a.name || (a.Name && a.Name.name)) : ('Asteroid #' + id); };
  const roomU = (s) => Math.max(0, Math.floor((TANK[s.st] - (s.prop || 0) * 1e6) / uG()));
  const pcOf = (s) => Math.round(Math.min(1, ((s.prop || 0) * 1e6) / TANK[s.st]) * 100);

  // ships parked on a rock (not in flight / orbit)
  function parked() {
    const d = K().D() || {};
    return (d.ships || []).filter((s) => TANK[s.st] && s.sst !== 'f' && s.sst !== 'o' && s.lot).map((s) => ({ s, rock: astName(s.dId) }));
  }
  // stores on the rock holding propellant, in the player's order (nearest to the first ticked ship to start with)
  function stores(rock, ref) {
    const k = K();
    const l = k.allB().filter((b) => k.isStore(b) && k.rockOf(b) === rock && have(b) > 0)
      .map((b) => ({ b, h: have(b), km: ref ? (k.kmBetween(k.lotOf(b), ref.lot, ref.dId) ?? 1e9) : 1e9, tank: b.Building.buildingType === k.TANK }));
    l.sort((a, b) => a.km - b.km || b.h - a.h);
    FF.ord = FF.ord.filter((id) => l.some((z) => z.b.id === id));
    l.forEach((z) => { if (!FF.ord.includes(z.b.id)) FF.ord.push(z.b.id); });
    return FF.ord.map((id) => l.find((z) => z.b.id === id));
  }
  // how much each ship gets: wants[i] = room in units; avail = total ticked stock
  function share(wants, avail, how) {
    const tot = wants.reduce((t, w) => t + w, 0);
    if (avail >= tot) return wants.slice();
    const got = wants.map(() => 0);
    if (how === 'order') { let left = avail; wants.forEach((w, i) => { const n = Math.min(w, left); got[i] = n; left -= n; }); return got; }
    // evenly: the same for each ship, capped at its room (water-filling)
    let left = avail, open = wants.map((w, i) => i).filter((i) => wants[i] > 0);
    while (left > 0 && open.length) {
      const each = Math.floor(left / open.length);
      if (each < 1) { for (const i of open) { if (left < 1) break; if (got[i] < wants[i]) { got[i]++; left--; } } break; }
      open.forEach((i) => { const n = Math.min(each, wants[i] - got[i]); got[i] += n; left -= n; });
      open = open.filter((i) => got[i] < wants[i]);
    }
    return got;
  }
  // store → ship moves: ships in tick order, stores in the player's order
  function plan(ships, src, got) {
    const left = src.map((z) => z.h), out = [];
    ships.forEach((x, i) => {
      let need = got[i];
      src.forEach((z, j) => { if (need <= 0 || left[j] <= 0) return; const n = Math.min(need, left[j]); left[j] -= n; need -= n; out.push({ b: z.b, x, n }); });
    });
    return out;
  }

  function render(el) {
    const k = K();
    host = el;
    if (!k) { el.innerHTML = ''; return; }
    const esc = k.esc, all = parked();
    let h = `<div class="card"><h2><span class="n">⛽</span>Fuel a fleet <span class="sl-tag" style="background:#2a1d08;color:#ffd28a">TEST</span></h2>
<div class="hint" style="margin:0 0 8px">Fills the tanks of several ships parked on the same rock, from propellant already in storage there.</div>
<style>#dk-ov .ff-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}#dk-ov .ff-card{display:flex;flex-direction:column;gap:3px;text-align:left;padding:8px 10px;border-radius:8px;border:1px solid #ffb03b55;background:#ffffff08;color:var(--ink);cursor:pointer;font:inherit;position:relative}#dk-ov .ff-card.on{border-color:#ffb03b;box-shadow:0 0 0 1px #ffb03b inset,0 0 10px #ffb03b55;background:#2a1d08}#dk-ov .ff-card.full{opacity:.55}#dk-ov .ff-card .sl-bar{display:block}#dk-ov .ff-card .ff-img{width:100%;height:80px;object-fit:contain;background:#000;border-radius:6px;margin-bottom:4px}#dk-ov .ff-card .ff-n{position:absolute;top:6px;right:8px;background:#ffb03b;color:#1a1206;border-radius:10px;padding:0 7px;font-weight:700}#dk-ov .ff-arr{background:none;border:1px solid #ffb03b55;color:var(--amber);border-radius:4px;cursor:pointer;padding:0 6px;font:inherit}#dk-ov .ff-arr:disabled{opacity:.3;cursor:default}</style>`;
    const rocks = [...new Set(all.map((x) => x.rock))].sort();
    if (!rocks.length) { el.innerHTML = h + '<div class="src">None of your ships is parked on a rock right now.</div></div>'; return; }
    if (!rocks.includes(FF.rock)) { FF.rock = rocks[0]; FF.fl = []; FF.ord = []; FF.off = {}; }
    const rock = FF.rock, sl = all.filter((x) => x.rock === rock).sort((a, b) => a.s.name.localeCompare(b.s.name));
    if (FF.init !== rock) { FF.init = rock; FF.fl = sl.filter((x) => roomU(x.s) > 0).map((x) => x.s.id); } // all ticked to start with (Mark, 27 Nov)
    FF.fl = FF.fl.filter((id) => sl.some((x) => x.s.id === id && roomU(x.s) > 0));
    // 1 rock
    h += `<div class="src" style="margin-bottom:6px"><b>1 · Rock</b></div><select id="ff-rock">${rocks.map((r) => `<option${r === rock ? ' selected' : ''}>${esc(r)}</option>`).join('')}</select>`;
    // 2 ships – tick order is kept (it's the fill order)
    h += `<div class="src" style="margin:12px 0 6px"><b>2 · Ships</b> <span class="src">– tick the ships to fuel; the number is the order they're filled in</span></div>
<div class="row" style="gap:8px;margin-bottom:6px"><button type="button" class="dk-shipbtn" data-ffall="1" style="cursor:pointer">Tick all</button><button type="button" class="dk-shipbtn" data-ffall="0" style="cursor:pointer">Untick all</button></div>
<div class="ff-cards">${sl.map((x) => { const s = x.s, r = roomU(s), i = FF.fl.indexOf(s.id), p = pcOf(s);
      return `<button type="button" class="ff-card${i >= 0 ? ' on' : ''}${r > 0 ? '' : ' full'}" data-ffship="${s.id}"${r > 0 ? '' : ' disabled'}>${i >= 0 ? `<span class="ff-n">${i + 1}</span>` : ''}<img src="shipimg.php?t=${s.st}&v=${s.sv || 1}&s=1" alt="" loading="lazy" class="ff-img" data-hide><b>${esc(s.name)}</b><span class="src">${esc(s.type)}</span><span class="sl-bar" style="width:100%"><i style="width:${p}%;background:${p > 50 ? '#57ff65' : p >= 25 ? '#ffd94f' : '#e0282e'}"></i></span><span class="src">⛽ ${p}% · ${r > 0 ? 'room for ' + kgTxt(uKg(r)) : 'full'}</span></button>`; }).join('')}</div>`;
    const ships = FF.fl.map((id) => sl.find((x) => x.s.id === id).s);
    if (!ships.length) { el.innerHTML = h + '<div class="hint" style="margin-top:10px">Tick at least one ship.</div></div>'; wire(el); return; }
    // 3 storage – all ticked, nearest first, arrows to change the order
    const src = stores(rock, ships[0]), use = src.filter((z) => !FF.off[z.b.id]);
    h += `<div class="src" style="margin:12px 0 6px"><b>3 · Propellant from</b> <span class="src">– used from the top down; untick any you want to keep</span></div>`;
    if (!src.length) { const need = ships.reduce((t, s) => t + roomU(s), 0);
      el.innerHTML = h + `<div class="hint" style="color:var(--amber)">No propellant in storage on ${esc(rock)}.</div><button type="button" class="dk-shipbtn" data-ffmk="${need}" style="cursor:pointer;margin-top:6px">🏭 Make ${kgTxt(uKg(need))} ${esc(k.pname(PROP))} in Production ▸</button><div class="hint">Enough to fill the ticked ships – then come back here.</div></div>`; wire(el); return; }
    h += `<table><thead><tr><th></th><th>Order</th><th>Store</th><th>Propellant</th><th>Distance</th></tr></thead><tbody>${src.map((z, i) => `<tr><td><input type="checkbox" data-ffst="${z.b.id}"${FF.off[z.b.id] ? '' : ' checked'}></td><td style="white-space:nowrap"><button type="button" class="ff-arr" data-ffup="${z.b.id}"${i ? '' : ' disabled'} title="Use earlier">▲</button> <button type="button" class="ff-arr" data-ffdn="${z.b.id}"${i < src.length - 1 ? '' : ' disabled'} title="Use later">▼</button></td><td>${esc(k.nm(z.b))} <span class="src">${z.tank ? 'tank farm' : 'warehouse'}</span></td><td class="num">${kgTxt(uKg(z.h))}</td><td class="src">${z.km < 1e8 ? k.kmTxt(z.km) : '?'}</td></tr>`).join('')}</tbody></table>`;
    // 4 split
    const wants = ships.map(roomU), want = wants.reduce((t, w) => t + w, 0), avail = use.reduce((t, z) => t + z.h, 0);
    const short = avail < want;
    if (short) h += `<div class="src" style="margin:12px 0 6px"><b>4 · Not enough to fill them all</b> <span class="src">(${kgTxt(uKg(avail))} of ${kgTxt(uKg(want))})</span></div><div class="row" style="gap:8px">${[['even', '⚖ Share it out evenly'], ['order', '🔢 Fill them in order']].map(([v, t]) => `<button type="button" class="dk-shipbtn${FF.split === v ? ' on' : ''}" data-ffsplit="${v}" style="cursor:pointer">${t}</button>`).join('')}</div>`;
    else h += `<div class="hint" style="margin-top:10px;color:var(--green)">✓ Enough to fill every ticked ship (${kgTxt(uKg(want))} of ${kgTxt(uKg(avail))}).</div>`;
    const got = share(wants, avail, FF.split), M = plan(ships, use, got);
    h += `<table style="margin-top:8px"><thead><tr><th>#</th><th>Ship</th><th>Gets</th><th>Tank after</th></tr></thead><tbody>${ships.map((s, i) => { const after = Math.round(Math.min(1, ((s.prop || 0) * 1e6 + got[i] * uG()) / TANK[s.st]) * 100);
      return `<tr><td>${i + 1}</td><td>${esc(s.name)}</td><td class="num">${got[i] ? kgTxt(uKg(got[i])) : '–'}</td><td class="num">${pcOf(s)}% → <b style="color:${after >= 100 ? 'var(--green)' : 'var(--ink)'}">${after}%</b></td></tr>`; }).join('')}</tbody></table>`;
    // 5 crew – best ready picked, can be changed
    const cl = k.crews(rock);
    if (!cl.find((c) => c.id === FF.crew)) FF.crew = (cl.find((c) => !c.busy) || cl[0] || {}).id || 0;
    const crew = cl.find((c) => c.id === FF.crew);
    h += `<div class="src" style="margin:12px 0 4px"><b>${short ? 5 : 4} · Crew</b></div>` + (cl.length ? `<select id="ff-crew">${cl.map((q) => `<option value="${q.id}"${q.id === FF.crew ? ' selected' : ''}>${esc(q.name)}${q.busy ? ' – busy' : ' – ready'}</option>`).join('')}</select>` : `<div class="src" style="color:var(--amber)">No crew on ${esc(rock)} – a crew there has to do it.</div>`);
    // moves + approve
    if (M.length) h += `<details style="margin-top:8px"><summary class="src" style="cursor:pointer">${M.length} move${M.length > 1 ? 's' : ''} in one approval</summary><table><thead><tr><th>From</th><th>Propellant</th><th>To</th></tr></thead><tbody>${M.map((m) => `<tr><td class="src">${esc(k.nm(m.b))}</td><td class="num">${kgTxt(uKg(m.n))}</td><td class="src">${esc(m.x.name)} – tank</td></tr>`).join('')}</tbody></table></details>`;
    const wait = FF.sentAt && Date.now() - FF.sentAt < 180000;
    const sendU = M.reduce((t, m) => t + m.n, 0);
    const can = k.isOwner() && !FF.busy && !wait && M.length && crew;
    h += `<div style="margin-top:12px"><button id="ff-go" class="dkp-rc" style="border-color:var(--amber);color:#ffd28a"${can ? '' : ' disabled'}>⛽ Approve – fuel ${ships.length} ship${ships.length > 1 ? 's' : ''} (${kgTxt(uKg(sendU))})</button></div>
<div class="hint">${wait ? '<span style="color:var(--amber)">Just sent – wait a moment, then ↻ Check the game again.</span> ' : ''}Nothing is sent until you approve it in your wallet.</div>
<div id="ff-msg" class="hint" style="display:${FF.msg ? 'block' : 'none'};margin-top:8px;padding:10px 12px;border-radius:8px;border:1px solid ${FF.msgErr ? '#ff4d4d88' : '#8fe3ff55'};color:${FF.msgErr ? '#ffb3ae' : 'var(--ink)'}">${FF.msg || ''}</div></div>`;
    el.innerHTML = h;
    FF.cur = { rock, M, ships };
    wire(el);
  }

  function wire(el) {
    const again = () => render(host);
    const on = (id, ev, f) => { const e = el.querySelector(id); if (e) e.addEventListener(ev, () => f(e)); };
    on('#ff-rock', 'change', (e) => { FF.rock = e.value; FF.fl = []; FF.ord = []; FF.off = {}; FF.crew = 0; FF.msg = ''; again(); });
    el.querySelectorAll('[data-ffship]').forEach((b) => b.addEventListener('click', () => { const id = +b.dataset.ffship, i = FF.fl.indexOf(id); if (i >= 0) FF.fl.splice(i, 1); else FF.fl.push(id); FF.msg = ''; again(); }));
    el.querySelectorAll('[data-ffall]').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.ffall === '0') FF.fl = []; else parked().filter((x) => x.rock === FF.rock && roomU(x.s) > 0).sort((a, c) => a.s.name.localeCompare(c.s.name)).forEach((x) => { if (!FF.fl.includes(x.s.id)) FF.fl.push(x.s.id); });
      FF.msg = ''; again();
    }));
    el.querySelectorAll('[data-ffst]').forEach((b) => b.addEventListener('change', () => { FF.off[+b.dataset.ffst] = !b.checked; again(); }));
    const mv = (id, d) => { const i = FF.ord.indexOf(id), j = i + d; if (i < 0 || j < 0 || j >= FF.ord.length) return; [FF.ord[i], FF.ord[j]] = [FF.ord[j], FF.ord[i]]; again(); };
    el.querySelectorAll('[data-ffup]').forEach((b) => b.addEventListener('click', () => mv(+b.dataset.ffup, -1)));
    el.querySelectorAll('[data-ffdn]').forEach((b) => b.addEventListener('click', () => mv(+b.dataset.ffdn, 1)));
    el.querySelectorAll('[data-ffsplit]').forEach((b) => b.addEventListener('click', () => { FF.split = b.dataset.ffsplit; again(); }));
    on('#ff-crew', 'change', (e) => { FF.crew = +e.value; again(); });
    on('#ff-go', 'click', () => { if (!FF.busy) send(); });
    el.querySelectorAll('[data-ffmk]').forEach((b) => b.addEventListener('click', () => {
      const k = K(); window.YICPRODGO = { p: PROP, q: +b.dataset.ffmk, rock: FF.rock };
      k.S.mode = 'make'; k.render();
      const sc = document.querySelector('#dk-ov .lb-scr'); if (sc) sc.scrollTop = 0;
    }));
  }

  const say = (html, err) => { FF.msg = html; FF.msgErr = !!err; const e = document.getElementById('ff-msg'); if (e) { e.style.display = 'block'; e.innerHTML = html; e.style.color = err ? '#ffb3ae' : 'var(--ink)'; e.style.borderColor = err ? '#ff4d4d88' : '#8fe3ff55'; } };
  function calls(c) {
    const k = K();
    return c.M.map((m) => {
      const data = [5, m.b.id, k.SLOT, 1, PROP, Math.floor(m.n), 6, m.x.id, PSLOT, 1, FF.crew];
      return { contract_address: k.DISPATCHER, entry_point: 'run_system', calldata: [k.short('SendDelivery'), k.hex(data.length), ...data.map(k.hex)] };
    });
  }
  function checks(c) {
    const k = K(), errs = [];
    if (!k.S.dataAt || Date.now() - k.S.dataAt > 10 * 60000) errs.push('The game data is over 10 minutes old – press ↻ Check the game again first.');
    const crew = k.crews(c.rock).find((x) => x.id === FF.crew);
    if (!crew) errs.push('No crew on ' + c.rock + ' picked.'); else if (k.crewReady(crew) - Date.now() / 1000 > 86400) errs.push(crew.name + ' already has more than 24 hours of jobs queued.');
    const now = parked(), from = {}, to = {};
    c.M.forEach((m) => { from[m.b.id] = (from[m.b.id] || 0) + m.n; to[m.x.id] = (to[m.x.id] || 0) + m.n; });
    Object.keys(from).forEach((id) => { const b = k.allB().find((y) => y.id === +id); if (!b || have(b) < from[id]) errs.push((b ? k.nm(b) : 'A store') + ' no longer holds that much propellant.'); });
    c.ships.forEach((s) => { const x = now.find((y) => y.s.id === s.id); if (!x || x.rock !== c.rock) errs.push(s.name + ' is no longer parked on ' + c.rock + '.'); else if ((to[s.id] || 0) > roomU(x.s)) errs.push("That's more than the room left in " + s.name + "'s tank."); });
    return [...new Set(errs)];
  }
  async function send() {
    const k = K(), c = FF.cur;
    if (!k.isOwner() || !c || !c.M.length) return;
    const ws = k.wallets();
    if (!ws.length) return say('No Starknet wallet found in this browser. Open this page in the browser that has your wallet.', true);
    const w = ws[0];
    FF.busy = true; FF.msg = ''; render(host);
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
      const crew = k.crews(c.rock).find((x) => x.id === FF.crew);
      const link = crew ? ' Finish it with <b>' + k.esc(crew.name) + '</b>' + (window.GL && window.GL.on() ? window.GL('/crew/' + crew.id, 'Open this crew in the game') : ' <a href="https://game.influenceth.io/crew/' + crew.id + '" target="influencegame" rel="noopener" style="color:var(--cyan)">in game ↗</a>') + '.' : '';
      FF.sentAt = Date.now(); FF.busy = false;
      FF.msg = '✓ Sent to the game. ' + (hsh ? `Transaction <a href="https://voyager.online/tx/${k.esc(hsh)}" target="_blank" rel="noopener noreferrer" style="color:var(--cyan)">${k.esc(String(hsh).slice(0, 10))}…</a>. ` : '') + 'When the deliveries arrive, use Finish All Ready Items – then the propellant is in the tanks.' + link;
      FF.msgErr = false; render(host);
      setTimeout(() => { k.loadDeliveries().then(k.render); }, 150000);
    } catch (e) {
      const t = String((e && e.message) || e || '');
      FF.busy = false; render(host);
      say(/reject|cancel|abort|denied|User/i.test(t) && !/Checked just before/.test(t) ? 'Cancelled in the wallet – nothing was changed.' : 'Not sent: ' + (/^Checked just before/.test(t) ? t : k.esc(t)), true);
    }
  }

  window.YICFLEETFUEL = { render, _test: { FF, share, plan } };
})();
