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
  if (!/[?&]dock=1\b/.test(location.search)) return; // LIVE 26 Nov 2026 (tested on ?beta=1 – Mark)
  const K = () => window.YICDOCK;
  const PROP = 170, PSLOT = 1;
  const UNITS = { kg: 1, t: 1000, kt: 1e6 };
  const SF = { ship: 0, amt: '', unit: 't', key: '', crew: 0, msg: '', msgErr: false, busy: false, sentAt: 0, how: '', ref: 0, store: 0, set: false, storePicked: false };
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
    // 1 ship – one card per ship (Mark, 26 Nov 21:03): tank gauge, where it is; parked ones first
    const pc = (y) => Math.round(Math.min(1, ((y.s.prop || 0) * 1e6) / TANK[y.s.st]) * 100);
    h += `<div class="src" style="margin-bottom:6px"><b>1 · Ship</b></div><div class="sf-cards">${sl.map((y) => `<button type="button" class="sf-card${y.s.id === SF.ship ? ' on' : ''}${y.ok ? '' : ' off'}" data-sfship="${y.s.id}"><img src="shipimg.php?t=${y.s.st}&v=${y.s.sv || 1}&s=1" alt="" loading="lazy" class="sf-img" data-hide><b>${esc(y.s.name)}</b><span class="src">${esc(y.s.type)} · ${esc(y.ok ? y.rock : y.why)}</span><span class="sl-bar" style="width:100%"><i style="width:${pc(y)}%;background:${pc(y) > 50 ? '#57ff65' : pc(y) >= 25 ? '#ffd94f' : '#e0282e'}"></i></span><span class="src">⛽ ${pc(y)}% · ${kgTxt((y.s.prop || 0) * 1000)} of ${kgTxt(TANK[y.s.st] / 1000)}</span></button>`).join('')}</div>
<style>#dk-ov .sf-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}#dk-ov .sf-card{display:flex;flex-direction:column;gap:3px;text-align:left;padding:8px 10px;border-radius:8px;border:1px solid #ffb03b55;background:#ffffff08;color:var(--ink);cursor:pointer;font:inherit}#dk-ov .sf-card.on{border-color:#ffb03b;box-shadow:0 0 0 1px #ffb03b inset,0 0 10px #ffb03b55;background:#2a1d08}#dk-ov .sf-card.off{opacity:.55}#dk-ov .sf-card .sl-bar{display:block}#dk-ov .sf-card .sf-img{width:100%;height:90px;object-fit:contain;background:#000;border-radius:6px;margin-bottom:4px}</style>`;
    if (!x.ok) { el.innerHTML = h + `<div class="hint" style="color:var(--amber)">${esc(s.name)} is ${esc(x.why)} – it has to be parked on a rock to be fuelled.</div></div>`; wire(el); return; }
    const rock = x.rock, key = s.id + '|' + Math.round(nowKg);
    const op = (v, t, cur) => `<option value="${v}"${String(cur) === String(v) ? ' selected' : ''}>${t}</option>`;
    const roomKg = Math.max(0, tankKg - nowKg);
    if (roomKg < 1) h += `<div class="hint" style="color:var(--green)">✓ The tank is already full.</div>`;
    // 3 amount + stock
    if (SF.key !== key) {
      SF.key = key; SF.msg = ''; SF.set = false; SF.storePicked = false;
      const q = roomKg;
      SF.unit = q >= 1e6 ? 'kt' : q >= 1000 ? 't' : 'kg'; SF.amt = String(Math.ceil(q / UNITS[SF.unit] * 10) / 10);
    }
    const amtKg = SF.set ? Math.min(Math.max(0, (+SF.amt || 0) * UNITS[SF.unit]), roomKg) : roomKg; // Fill is the default (Mark, 26 Nov)
    const units = Math.floor(amtKg * 1000 / uG());
    const M = moves(rock, x, units), haveU = storesOn(rock).reduce((t, b) => t + have(b), 0);
    h += `<div class="src" style="margin:12px 0 4px"><b>2 · How much</b></div><div class="row" style="gap:8px"><button type="button" class="dk-shipbtn${SF.set ? '' : ' on'}" data-sfset="0" style="cursor:pointer">⛽ Fill it – ${kgTxt(roomKg)}</button><button type="button" class="dk-shipbtn${SF.set ? ' on' : ''}" data-sfset="1" style="cursor:pointer">Set amount</button>` +
      (SF.set ? `<input type="number" id="sf-amt" min="0" step="any" value="${esc(SF.amt)}"><select id="sf-unit">${['kg', 't', 'kt'].map((u) => op(u, u, SF.unit)).join('')}</select><span class="src">up to ${kgTxt(roomKg)}</span>` : '') + '</div>';
    h += `<div class="src" style="margin:12px 0 4px"><b>3 · Propellant from</b> <span class="src">(already made, in storage on ${esc(rock)}: ${kgTxt(haveU * uG() / 1000)})</span></div>`;
    // 🏭 make it at a refinery (Mark, 26 Nov): "most of the time I have the resources to make the propellant, so I only need to
    // move them. I just need to say fill this ship up with fuel made at this refinery." One process, output straight into the tank.
    if (!SF.how) SF.how = haveU >= units ? 'stock' : 'make';
    h += `<div class="row" style="gap:8px">${[['stock', '📦 Propellant from storage'], ['make', '🏭 Make it at a refinery']].map(([v, t]) => `<button type="button" class="dk-shipbtn${SF.how === v ? ' on' : ''}" data-sfhow="${v}" style="cursor:pointer">${t}</button>`).join('')}</div>`;
    if (SF.how === 'make') { el.innerHTML = h + makeHTML(rock, x, units, roomKg) + '</div>'; wire(el); return; }
    if (units > 0 && M.short > 0) {
      const sk = M.short * uG() / 1000;
      h += `<div class="hint" style="color:var(--amber)">Short by ${kgTxt(sk)}. A refinery on this rock can make it straight into the tank.</div>
<button type="button" id="sf-make" class="dk-shipbtn" style="margin-top:6px">🏭 Make it at a refinery instead ▸</button>`;
    }
    // 4 crew + moves
    const cl = k.crews(rock);
    if (!cl.find((c) => c.id === SF.crew)) SF.crew = (cl.find((c) => !c.busy) || cl[0] || {}).id || 0;
    const crew = cl.find((c) => c.id === SF.crew);
    h += `<div class="src" style="margin:12px 0 4px"><b>4 · Moved by</b></div>`;
    h += crewHTML(cl, rock);
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

  // crew: the best ready crew on the rock is picked for you (Mark, 26 Nov: "or the crew if it picks the best") – k.crews() is
  // sorted ready first, then free transport distance, then speed. Only when none is ready is there a choice.
  function crewHTML(cl, rock) {
    const esc = K().esc, ready = cl.filter((q) => !q.busy);
    if (!cl.length) return `<div class="src" style="color:var(--amber)">No crew on ${esc(rock)} – a crew there has to do it.</div>`;
    if (ready.length) { if (!ready.find((q) => q.id === SF.crew)) SF.crew = ready[0].id; return `<div class="src">By <b>${esc(ready.find((q) => q.id === SF.crew).name)}</b> (ready)</div>`; }
    if (!cl.find((q) => q.id === SF.crew)) SF.crew = cl[0].id;
    return `<div class="src" style="color:var(--amber)">No crew on ${esc(rock)} is ready – pick one to queue it:</div><select id="sf-crew">${cl.map((q) => `<option value="${q.id}"${q.id === SF.crew ? ' selected' : ''}>${esc(q.name)} – busy</option>`).join('')}</select>`;
  }
  // ---------- 🏭 make it at a refinery ----------
  const SKEY = 'sk_fuel_store'; // inputs store per rock, remembered in this browser
  const lsGet = () => { try { return JSON.parse(localStorage.getItem(SKEY) || '{}'); } catch (e) { return {}; } };
  const lsPut = (o) => { try { localStorage.setItem(SKEY, JSON.stringify(o)); } catch (e) {} };
  const holds = (b, p) => ((K().inv(b) || { contents: [] }).contents || []).filter((c) => c.product === +p).reduce((t, c) => t + c.amount, 0);
  const capOf = (b) => b.Building.buildingType === K().TANK ? [75e9, 997.5e9] : [1.5e12, 75e9];
  function makePlan(rock, x, units) {
    const k = K(), all = k.allB().filter((b) => k.rockOf(b) === rock);
    const recs = k.recipes().filter((r) => r.out[PROP] && k.PID[r.name]);
    const stores = all.filter((b) => k.isStore(b));
    const onRockU = (p) => stores.reduce((t, b) => t + holds(b, p), 0);
    // the recipe that can do the most runs from what's on the rock (normally Hydrogen Cryocooling: 97 Hydrogen + 2 Silica Powder + 1 Tungsten Powder → 100)
    const canDo = (r) => Math.min(...Object.keys(r.inp).map((p) => Math.floor(onRockU(p) / r.inp[p])));
    const r = recs.filter((q) => all.some((b) => b.Building.buildingType === k.FBT[q.type])).sort((a, b) => canDo(b) - canDo(a))[0];
    if (!r) return { err: 'No refinery on ' + rock + ' that can make Hydrogen Propellant.' };
    const bt = k.FBT[r.type], refs = all.filter((b) => b.Building.buildingType === bt && b.Building.status === 3);
    const fits = (b) => b.Building.buildingType !== k.TANK || Object.keys(r.inp).every((p) => k.TANKOK.has(+p));
    const cands = stores.filter(fits);
    if (!cands.length) return { err: 'No warehouse or tank farm on ' + rock + ' that can hold the inputs.' };
    const kg = (b) => Object.keys(r.inp).reduce((t, p) => t + holds(b, p) * k.grams(+p), 0);
    const saved = lsGet()[rock];
    // all the inputs already in one store → use it, so the refinery can start straight away (Mark, 26 Nov)
    const wantR = Math.min(Math.floor(units / r.out[PROP]), canDo(r)), hasAll = (b) => wantR > 0 && Object.keys(r.inp).every((p) => holds(b, p) >= r.inp[p] * wantR);
    if (!SF.storePicked && cands.find(hasAll)) SF.store = (cands.find((b) => b.id === saved && hasAll(b)) || cands.find(hasAll)).id;
    if (!cands.find((b) => b.id === SF.store)) SF.store = (cands.find((b) => b.id === saved) || cands.find((b) => /fuel|propel/i.test(k.nm(b))) || cands.slice().sort((a, b) => kg(b) - kg(a))[0]).id;
    const store = cands.find((b) => b.id === SF.store);
    const km = (a, b) => k.kmBetween(k.lotOf(a), k.lotOf(b));
    if (!refs.find((b) => b.id === SF.ref)) SF.ref = (refs.slice().sort((a, b) => (!k.freeSlot(a) - !k.freeSlot(b)) || ((km(a, store) ?? 1e9) - (km(b, store) ?? 1e9)))[0] || {}).id || 0;
    const ref = refs.find((b) => b.id === SF.ref);
    // runs: fill the tank (never more than fits), no more than the inputs on the rock allow, and the game's max process time
    const wantRuns = Math.floor(units / r.out[PROP]), avail = canDo(r);
    const one = { r, runs: Math.min(wantRuns, avail) };
    if (k.capRuns && one.runs > 0 && !k.capRuns(one)) one.runs = 0;
    const runs = one.runs;
    // moves into the inputs store, nearest first
    const mv = {}, rows = [];
    Object.keys(r.inp).forEach((p) => {
      const need = r.inp[p] * runs, here = holds(store, p); let left = Math.max(0, need - here);
      stores.filter((b) => b.id !== store.id && holds(b, p) > 0).sort((a, b) => (km(a, store) ?? 1e9) - (km(b, store) ?? 1e9)).forEach((b) => {
        if (left <= 0) return; const n = Math.min(left, holds(b, p)); left -= n; (mv[b.id] = mv[b.id] || { b, items: [] }).items.push([+p, n]);
      });
      rows.push({ p: +p, need, here, move: Math.max(0, need - here) - left, short: left, rock: onRockU(p) });
    });
    // will the inputs store hold everything moved in? (the game refuses a move that won't fit – 'inventory volume exceeded')
    const MV = k.mv(), i = k.inv(store) || { mass: 0, volume: 0 }, c = capOf(store);
    let g = i.mass + (i.reservedMass || 0), v = i.volume + (i.reservedVolume || 0);
    Object.values(mv).forEach((m) => m.items.forEach(([p, n]) => { const q = MV[p] || [1000, 1000]; g += n * q[0]; v += n * q[1]; }));
    const peak = Math.round(Math.max(g / c[0], v / c[1]) * 100), now = Math.round(Math.max((i.mass + (i.reservedMass || 0)) / c[0], (i.volume + (i.reservedVolume || 0)) / c[1]) * 100);
    // already being made on this rock (Mark, 26 Nov: "can it check to see if there is already some in production?"):
    // running (or finished, not yet collected) processes whose outputs include an input – processor.recipes runs × output per run
    const PROCN = (window.YIC && window.YIC.PROCN) || {}, nowS = Date.now() / 1000, coming = {};
    all.forEach((b) => (b.Processors || []).forEach((q) => {
      if (q.status !== 1 || !q.runningProcess) return; const pr = PROCN[q.runningProcess]; if (!pr || !pr[1]) return;
      Object.keys(r.inp).forEach((p) => { const per = pr[1][p]; if (!per) return; const n = Math.floor((q.recipes || 0) * per); if (n > 0) (coming[p] = coming[p] || []).push({ b, n, fin: q.finishTime || 0, done: (q.finishTime || 0) <= nowS }); });
    }));
    return { r, refs, ref, cands, store, runs, wantRuns, avail, capTxt: one.capTxt, rows, moves: Object.values(mv), peak, now, x, coming };
  }
  function makeHTML(rock, x, units) {
    const k = K(), esc = k.esc, c = makePlan(rock, x, units);
    SF.cur = Object.assign({ make: true, rock }, c);
    if (c.err) return `<div class="hint" style="color:var(--amber);margin-top:8px">${esc(c.err)}</div>`;
    const kgU = (p, n) => kgTxt(n * k.grams(p) / 1000);
    const outKg = c.runs * c.r.out[PROP] * uG() / 1000;
    // a free refinery is picked for you (Mark, 26 Nov: "it doesn't need the refinery option if there is one free")
    const freeRef = c.ref && k.freeSlot(c.ref);
    let h = `<div class="src" style="margin:12px 0 4px"><b>4 · Make it</b></div>` + (freeRef ? `<div class="src">At <b>${esc(k.nm(c.ref))}</b> (free)</div>`
      : `<div class="src" style="color:var(--amber)">No refinery on ${esc(rock)} is free right now – it can start when one finishes.</div>`) + `
<div class="src" style="margin-top:4px">${esc(c.r.name)} · <b>${c.runs.toLocaleString('en-GB')} runs</b> → <b>${kgTxt(outKg)}</b> straight into ${esc(x.s.name)}'s tank${c.ref && k.procSecs ? ' · about ' + Math.round((k.procSecs(c.r.name, c.runs) || 0) / 360) / 10 + ' h without bonuses' : ''}.</div>`;
    // not enough for it in one process → make the short inputs in Production, into the store the refinery takes them from
    // (Mark, 26 Nov: "point to production for the next part of the chain, so they can start it there")
    if (c.runs < c.wantRuns) {
      const when = (t) => new Date(t * 1000).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      const short = c.rows.filter((w) => w.rock < c.r.inp[w.p] * c.wantRuns).map((w) => {
        const n = Math.ceil(c.r.inp[w.p] * c.wantRuns - w.rock), cm = c.coming[w.p] || [], got = cm.reduce((t, z) => t + z.n, 0);
        return { p: w.p, n, cm, left: Math.max(0, n - got) };
      });
      // a clear box so it's easy to see (Mark, 26 Nov: "not easy to see – needs to be more visible")
      h += '<div style="margin:10px 0;padding:10px 14px;border:2px solid #ffb03b;border-radius:10px;background:#ffb03b1a;font-size:1.05em;line-height:1.5">';
      h += `<div style="color:#ffb03b;font-weight:700">⚠ ${c.capTxt ? esc(c.capTxt) : (c.runs ? 'Only enough on ' + esc(rock) + ' for ' + kgTxt(outKg) + ' – the tank won’t be full.' : 'Not enough on ' + esc(rock) + ' to make any.')}</div>`;
      const bx = (t) => `<div style="margin-top:6px">${t}</div>`;
      if (!c.capTxt && short.length) {
        h += bx(`Short for a full tank: <b>${short.map((z) => esc(k.pname(z.p)) + ' ' + kgU(z.p, z.n)).join(', ')}</b>.`);
        short.forEach((z) => z.cm.forEach((m) => { h += bx(`⚙ <b>${esc(k.pname(z.p))} ${kgU(z.p, m.n)}</b> already being made at <b>${esc(k.nm(m.b))}</b> – ${m.done ? '<b>finished, collect it in the game</b>' : 'ready about <b>' + when(m.fin) + '</b>'}.`); }));
        const need = short.filter((z) => z.left > 0);
        if (need.length) h += `<div class="row" style="gap:6px;margin-top:4px">${need.map((z) => `<button type="button" class="dk-shipbtn" data-sfmk="${z.p}" data-q="${z.left}" style="cursor:pointer">🏭 Make ${z.cm.length ? 'the other ' + kgU(z.p, z.left) + ' ' : ''}${esc(k.pname(z.p))} in Production ▸</button>`).join('')}</div><div class="hint">It goes into ${esc(k.nm(c.store))}, ready for the refinery – then come back here.</div>`;
        else { const last = Math.max(...short.map((z) => Math.max(0, ...z.cm.map((m) => m.fin)))); h += `<div style="margin-top:8px;padding:8px 12px;border-radius:8px;background:#3fd68a22;border:1px solid #3fd68a;color:#3fd68a;font-weight:700;font-size:1.05em">✓ That covers it – come back ${last > Date.now() / 1000 ? 'after ' + when(last) : 'once it’s collected'} to fill the tank.</div>`; }
      }
      h += '</div>';
    }
    // inputs: everything already in one store → just say so; otherwise the move section
    if (!c.moves.length && c.runs > 0) h += `<div class="src" style="margin-top:8px"><span class="ok">✓</span> Everything it needs is in <b>${esc(k.nm(c.store))}</b>${c.cands.length > 1 ? ` <select id="sf-store" style="margin-left:6px">${c.cands.map((b) => `<option value="${b.id}"${b.id === SF.store ? ' selected' : ''}>${esc(k.nm(b))}</option>`).join('')}</select>` : ''}</div>`;
    else if (c.runs > 0) {
      h += `<div class="src" style="margin:12px 0 4px"><b>5 · Move the inputs</b> <span class="src">(the refinery takes them from one store)</span></div><div class="row" style="gap:6px"><span class="src">Into</span><select id="sf-store">${c.cands.map((b) => `<option value="${b.id}"${b.id === SF.store ? ' selected' : ''}>${esc(k.nm(b))}</option>`).join('')}</select></div>
<table style="margin-top:8px"><thead><tr><th>Input</th><th class="num">Needs</th><th class="num">In ${esc(k.nm(c.store))}</th><th class="num">To move in</th></tr></thead><tbody>${c.rows.map((w) => `<tr><td>${esc(k.pname(w.p))}</td><td class="num">${kgU(w.p, w.need)}</td><td class="num">${kgU(w.p, Math.min(w.here, w.need))}</td><td class="num">${w.move > 0 ? kgU(w.p, w.move) : '<span class="ok">✓</span>'}</td></tr>`).join('')}</tbody></table>
<div class="src" style="margin-top:6px">From: ${c.moves.map((m) => esc(k.nm(m.b)) + ' → ' + m.items.map(([p, n]) => esc(k.pname(p)) + ' ' + kgU(p, n)).join(', ')).join(' · ')}</div>
<div class="src">${esc(k.nm(c.store))}: ${c.now}% full now → <b style="color:${c.peak > 100 ? '#ff4d4d' : c.peak >= 90 ? '#ffb03b' : '#3fd68a'}">${c.peak}%</b> with the moves in${c.peak > 100 ? ' – <b style="color:#ff4d4d">won’t fit</b>. Pick another store.' : ''}</div>`;
    }
    // 5 crew
    const cl = k.crews(rock);
    if (!cl.find((q) => q.id === SF.crew)) SF.crew = (cl.find((q) => !q.busy) || cl[0] || {}).id || 0;
    h += `<div class="src" style="margin:12px 0 4px"><b>${c.moves.length ? 6 : 5} · Crew</b></div>` + crewHTML(cl, rock);
    const crew = cl.find((q) => q.id === SF.crew), wait = SF.sentAt && Date.now() - SF.sentAt < 180000;
    const step = c.moves.length ? 'moves' : 'start';
    const ok = c.runs > 0 && crew && (step === 'moves' ? c.peak <= 100 : c.ref && k.freeSlot(c.ref));
    const can = k.isOwner() && !SF.busy && !wait && ok;
    // nothing to make (0 runs) → no Approve button at all (Mark, 26 Nov)
    if (!(c.runs > 0)) h += `<div class="hint" style="margin-top:12px">Nothing to approve yet – there isn’t enough on ${esc(rock)} to make any.</div>`;
    else h += `<div style="margin-top:12px"><button id="sf-go" class="dkp-rc" style="border-color:var(--amber);color:#ffd28a${can ? '' : ';opacity:.5;cursor:not-allowed'}"${can ? '' : ' disabled'}>${step === 'moves' ? '🚚 Approve – move the inputs (' + c.moves.length + ')' : '⛽ Approve – start making ' + kgTxt(outKg) + ' into the tank'}</button></div>
${c.runs > 0 ? `<div class="hint">${step === 'moves' ? 'The refinery can only start once the inputs are in ' + esc(k.nm(c.store)) + ' – when the moves have arrived, come back here and the button starts it.' : c.ref && !k.freeSlot(c.ref) ? '<span style="color:var(--amber)">Waiting for a free refinery.</span>' : 'Everything is in ' + esc(k.nm(c.store)) + ' – this starts the refinery.'}</div>` : ''}
<div class="hint">${wait ? '<span style="color:var(--amber)">Just sent – wait a moment, then ↻ Check the game again.</span> ' : ''}Nothing is sent until you approve it in your wallet.</div>
<div id="sf-msg" class="hint" style="display:${SF.msg ? 'block' : 'none'};margin-top:8px;padding:10px 12px;border-radius:8px;border:1px solid ${SF.msgErr ? '#ff4d4d88' : '#8fe3ff55'};color:${SF.msgErr ? '#ffb3ae' : 'var(--ink)'}">${SF.msg || ''}</div>`;
    SF.cur.step = step; SF.cur.crewObj = crew;
    return h;
  }
  function makeCalls(c) {
    const k = K();
    if (c.step === 'moves') return c.moves.map((m) => { const data = [5, m.b.id, k.SLOT, m.items.length, ...m.items.flat().map((n) => Math.floor(n)), 5, c.store.id, k.SLOT, 1, SF.crew];
      return { contract_address: k.DISPATCHER, entry_point: 'run_system', calldata: [k.short('SendDelivery'), k.hex(data.length), ...data.map(k.hex)] }; });
    // ProcessProductsStart: [processor(5,id), slot, process, target output, recipes (Fixed n·2^32, sign 0), origin(5,id), slot, destination(6, ship), propellant slot 1, caller crew(1,id)]
    const data = [5, c.ref.id, k.freeSlot(c.ref), k.PID[c.r.name], PROP, BigInt(c.runs) * 4294967296n, 0, 5, c.store.id, k.SLOT, 6, c.x.s.id, PSLOT, 1, SF.crew];
    return [{ contract_address: k.DISPATCHER, entry_point: 'run_system', calldata: [k.short('ProcessProductsStart'), k.hex(data.length), ...data.map(k.hex)] }];
  }
  function makeChecks(c) {
    const k = K(), errs = [];
    if (!k.S.dataAt || Date.now() - k.S.dataAt > 10 * 60000) errs.push('The game data is over 10 minutes old – press ↻ Check the game again first.');
    const crew = k.crews(c.rock).find((x) => x.id === SF.crew);
    if (!crew) errs.push('No crew on ' + c.rock + ' picked.'); else if (k.crewReady(crew) - Date.now() / 1000 > 86400) errs.push(crew.name + ' already has more than 24 hours of jobs queued.');
    const x = ships().find((y) => y.s.id === c.x.s.id);
    if (!x || !x.ok || x.s.dId !== c.x.s.dId) errs.push(c.x.s.name + ' is no longer parked on ' + c.rock + '.');
    if (c.step === 'moves') { if (c.peak > 100) errs.push(k.nm(c.store) + " won't hold the inputs."); c.moves.forEach((m) => m.items.forEach(([p, n]) => { if (holds(m.b, p) < n) errs.push(k.nm(m.b) + ' no longer holds that much ' + k.pname(p) + '.'); })); }
    else {
      if (!c.ref || !k.freeSlot(c.ref)) errs.push((c.ref ? k.nm(c.ref) : 'The refinery') + ' is not free.');
      Object.keys(c.r.inp).forEach((p) => { if (holds(c.store, p) < c.r.inp[p] * c.runs) errs.push(k.nm(c.store) + ' no longer holds enough ' + k.pname(+p) + '.'); });
      if (c.runs * c.r.out[PROP] * uG() / 1000 > TANK[x ? x.s.st : 0] / 1000 - ((x && x.s.prop) || 0) * 1000 + 0.5) errs.push("That's more than the room left in the tank.");
    }
    return [...new Set(errs)];
  }

  function wire(el) {
    const again = () => render(host);
    const on = (id, ev, f) => { const e = el.querySelector(id); if (e) e.addEventListener(ev, () => f(e)); };
    el.querySelectorAll('[data-sfship]').forEach((b) => b.addEventListener('click', () => { SF.ship = +b.dataset.sfship; SF.crew = 0; SF.key = ''; SF.how = ''; again(); }));
    el.querySelectorAll('[data-sfmk]').forEach((b) => b.addEventListener('click', () => {
      const k = K(), c = SF.cur; if (!c || !c.store) return;
      window.YICPRODGO = { p: +b.dataset.sfmk, q: +b.dataset.q, rock: c.rock, to: c.store.id }; // output into the refinery's inputs store
      k.S.mode = 'make'; k.render();
      const sc = document.querySelector('#dk-ov .lb-scr'); if (sc) sc.scrollTop = 0;
    }));
    el.querySelectorAll('[data-sfset]').forEach((b) => b.addEventListener('click', () => { SF.set = b.dataset.sfset === '1'; again(); }));
    on('#sf-amt', 'change', (e) => { SF.amt = e.value; again(); });
    on('#sf-unit', 'change', (e) => { SF.unit = e.value; again(); });
    on('#sf-crew', 'change', (e) => { SF.crew = +e.value; again(); });
    on('#sf-make', 'click', () => { SF.how = 'make'; SF.msg = ''; again(); });
    on('#sf-go', 'click', () => { if (!SF.busy) send(); });
    on('#sf-ref', 'change', (e) => { SF.ref = +e.value; again(); });
    on('#sf-store', 'change', (e) => { SF.store = +e.value; SF.storePicked = true; const c = SF.cur; if (c && c.rock) { const a = lsGet(); a[c.rock] = SF.store; lsPut(a); } again(); });
    el.querySelectorAll('[data-sfhow]').forEach((b) => b.addEventListener('click', () => { SF.how = b.dataset.sfhow; SF.msg = ''; again(); }));
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
    if (!k.isOwner() || !c || (!c.make && !c.M.out.length)) return;
    const ws = k.wallets();
    if (!ws.length) return say('No Starknet wallet found in this browser. Open this page in the browser that has your wallet.', true);
    const w = ws[0];
    SF.busy = true; SF.msg = ''; render(host);
    try {
      const a = await k.account(w);
      if (!a) throw new Error('The wallet did not share an address.');
      if (!k.sameAddr(a, k.D().wallet)) throw new Error('That wallet (' + k.esc(a) + ') is not the one this page is showing. Switch account in your wallet and try again.');
      const errs = c.make ? makeChecks(c) : checks(c);
      if (errs.length) throw new Error('Checked just before sending – nothing was sent:<br>• ' + errs.map(k.esc).join('<br>• '));
      const cs = c.make ? makeCalls(c) : calls(c);
      say('Waiting for your wallet… check the wallet window and approve (or reject) it there.');
      let res;
      if (typeof w.request === 'function') res = await w.request({ type: 'wallet_addInvokeTransaction', params: { calls: cs } });
      else if (w.account && typeof w.account.execute === 'function') res = await w.account.execute(cs.map((q) => ({ contractAddress: q.contract_address, entrypoint: q.entry_point, calldata: q.calldata })));
      else throw new Error('This wallet cannot send transactions from a web page.');
      const hsh = res && (res.transaction_hash || res.transactionHash);
      const crew = k.crews(c.rock).find((x) => x.id === SF.crew);
      const link = crew ? ' Finish it with <b>' + k.esc(crew.name) + '</b>' + (window.GL && window.GL.on() ? window.GL('/crew/' + crew.id, 'Open this crew in the game') : ' <a href="https://game.influenceth.io/crew/' + crew.id + '" target="influencegame" rel="noopener" style="color:var(--cyan)">in game ↗</a>') + '.' : '';
      SF.sentAt = Date.now(); SF.busy = false;
      SF.msg = '✓ Sent to the game. ' + (hsh ? `Transaction <a href="https://voyager.online/tx/${k.esc(hsh)}" target="_blank" rel="noopener noreferrer" style="color:var(--cyan)">${k.esc(String(hsh).slice(0, 10))}…</a>. ` : '') + (c.make && c.step === 'moves' ? 'When the moves arrive, use Finish All Ready Items in the game – then come back here and the same button starts the refinery.' : c.make ? 'The refinery has started. When it’s done, use Finish All Ready Items – then the propellant is in the tank.' : 'When it arrives, use Finish All Ready Items – then the propellant is in the tank.') + link;
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
