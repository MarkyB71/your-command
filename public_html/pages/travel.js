/* Planners › Travel – Your Influence Command
   One file per page (started 2026-10-18). A table of the quickest trip between
   each pair of your asteroids, for a chosen ship, propellant, cargo and start time.
   Flight maths: vendor/travel.js (Influence's own Lambert solver).
   Shared data and helpers come from window.YIC (set up in app.js). */
(function () {
  'use strict';

  // Chosen options (kept while you move between pages)
  const S = { ship: null, prop: 'full', cargo: 'empty', leave: 0, allAst: false, fuel: false, from: null };
  let run = 0;   // stops an old calculation when the page redraws

  // Adalia Prime option (community idea, Mark 15 Nov 2026 – TEST ONLY, ?beta=1): a tick box adds Adalia Prime (#1) to the
  // table even though it isn't yours – everyone starts there and most players still fly out from it. Off to start with;
  // the choice is remembered in this browser, so ticking it makes it your default.
  const APT = true; // LIVE 15 Nov 2026 (tested on ?beta=1 – Mark)
  const AP_ID = 1, APKEY = 'yic-travel-ap';
  let apOrbit = null, apBusy = false;
  const apOn = () => { try { return localStorage.getItem(APKEY) === '1'; } catch (e) { return false; } };
  const apSet = v => { try { localStorage.setItem(APKEY, v ? '1' : '0'); } catch (e) {} };
  const apBox = () => APT ? ' <label style="margin-left:8px;white-space:nowrap;cursor:pointer"><input type="checkbox" id="trAP"' +
    (apOn() ? ' checked' : '') + '> Include Adalia Prime</label>' : '';
  function apWire(m) {
    const cb = m.querySelector('#trAP'); if (cb) cb.onchange = () => { apSet(cb.checked); drawTravel(m); };
  }

  const TYPE_NAME = { 2: 'Light Transport', 3: 'Heavy Transport', 4: 'Shuttle' };

  // Launch windows chart
  // Can this rock make its own propellant? Every step of the chain needs a raw it can mine or a working
  // facility on it (no stock counted). Hydrogen Propellant = Hydrogen + Silica Powder + Tungsten Powder in a Refinery.
  // st (?beta=1 test, Mark 15 Nov): what's in storage on the rock. Some chains loop round (e.g. Ammonia goes into
  // Ammonium Paratungstate and comes back out with Tungsten; Sulfuric Acid ↔ Sulfur Dioxide) – a loop is fine when the
  // rock already has some of it in storage to start the loop off (never propellant itself).
  function canMake(Y, D, ast, prod, seen, st) {
    const R = window.YICREC; if (!R) return false;
    if (+prod <= 22) {                                     // raw material: can it be mined here?
      const c = ast.Celestial || {};
      const ok = (c.scanStatus || 0) >= 4 && c.abundances && Y.astAbund ? (Y.astAbund(c.abundances)[prod] || 0) > 0
        : !!((Y.SPEC || {})[c.celestialType] && Y.SPEC[c.celestialType][1].includes(+prod));
      // a raw not mined here can still be made here (e.g. Hydrogen from Water – Mark, 29 Oct)
      if (ok) return true;
    }
    if (seen[prod]) return !!(st && +prod !== 170 && st[prod] > 0); seen = Object.assign({}, seen, { [prod]: 1 });
    const has = t => (D.allB || []).some(b => b.Building && b.Building.buildingType === R.FBT[t] && b.Building.status === 3 &&
      (((b.Location || {}).locations || []).find(x => x.label === 3) || {}).id === ast.id);
    return (R.MK[prod] || []).some(([, pt, inp, , out]) => has(pt) &&
      Object.keys(inp).every(k => (out && out[k]) || canMake(Y, D, ast, k, seen, st)));   // catalysts that come back are fine
  }
  let REF = {};
  // Refuel check with stock (community idea + Mark, 15 Nov 2026 – TEST ONLY, ?beta=1): a rock also counts as a refuel
  // stop if it has Hydrogen Propellant in storage. And a rock with a working Refinery that can get Hydrogen is flagged
  // "can make it if you bring the powders" (Silica Powder + Tungsten Powder) – still the half-propellant rule there.
  const RFS = true; // LIVE 15 Nov 2026 (tested on ?beta=1 – Mark)
  const RST = {};   // id -> 'make' | 'stock' | 'powders' | 'no'
  const STK = {};   // id -> kg of Hydrogen Propellant stored
  // Belt markets selling propellant (Mark, 15 Nov – ?beta=1): asteroid id -> { kg, name }, from window.BELTDATA (pages/market.js)
  let SELL = null;
  function beltFuel(Y, B) {
    SELL = {};
    if (!B || B.err) return SELL;
    const mk = B.markets || {};
    (B.orders || []).forEach(o => {
      if (String(o[0]) !== '170' || o[1] !== 2 || !(o[2] > 0)) return;
      const x = SELL[o[5]] = SELL[o[5]] || { kg: 0, name: (mk[o[4]] && mk[o[4]].ast) || ('Asteroid #' + o[5]), pt: null };
      x.kg += Y.kg ? Y.kg(170, o[2]) : o[2];
      // SWAY per tonne, market fee included (same sum as Trade Deck › Where to buy)
      const ex = mk[o[4]] && mk[o[4]].ex, fee = ex ? (ex.takerFee || 0) / 10000 : 0, uM = (Y.PR && Y.PR[170] && Y.PR[170][2]) || 1000;
      const pt = o[3] * (1 + fee) / 1e6 * 1000 / uM * 1000;
      if (x.pt === null || pt < x.pt) x.pt = pt;
    });
    return SELL;
  }
  function refuelMap(Y, D, asts) {
    REF = {};
    asts.forEach(a => {
      // Adalia Prime: everyone's starting rock – propellant can always be bought at its markets (Mark, 15 Nov)
      if (RFS && a.id === AP_ID) { REF[a.id] = true; RST[a.id] = 'market'; return; }
      const ast = (D.owned || []).find(x => x.id === a.id) || {};
      const as = (D.asteroids || []).find(x => +x.id === +a.id), st = {};
      ((as && as.buildings) || []).forEach(b => Object.keys(b.items || {}).forEach(k => { st[k] = (st[k] || 0) + +b.items[k]; }));
      const mk = canMake(Y, D, ast, '170', {}, RFS ? st : null);
      REF[a.id] = mk; RST[a.id] = mk ? 'make' : 'no';
      if (!RFS || mk) return;
      const n = +(st[170] || 0);
      const kg = n && Y.kg ? Y.kg(170, n) : n;
      STK[a.id] = kg;
      if (kg >= 1000) { REF[a.id] = true; RST[a.id] = 'stock'; return; }
      if (SELL && SELL[a.id] && SELL[a.id].kg >= 1000) { REF[a.id] = true; RST[a.id] = 'market'; return; }
      const R = window.YICREC, pt = R && R.MK && R.MK['170'] && R.MK['170'][0] && R.MK['170'][0][1];
      const refinery = pt != null && (D.allB || []).some(b => b.Building && b.Building.buildingType === R.FBT[pt] && b.Building.status === 3 &&
        (((b.Location || {}).locations || []).find(x => x.label === 3) || {}).id === a.id);
      if (refinery && canMake(Y, D, ast, '2', {}, st)) RST[a.id] = 'powders';
    });
    return REF;
  }
  // DCL (community idea, Mark 21 Nov 2026 – LIVE): colour the distance by how far it is right now
  // (under 1 AU green, 1–2 lime, 2–3 yellow, 3+ red), so a close rock no longer looks far just because a better window is coming.
  const DCL = true; // LIVE 21 Nov 2026 (tested on ?beta=1 – Mark)
  const auCol = au => au < 1 ? '#3fd68a' : au < 2 ? '#b5e04a' : au < 3 ? '#ffd24a' : '#ff6b6b';
  const WDAYS = 30, WSTEP = 12;                       // next 30 days, a sample every 12 hours
  const TOFS = [];                                    // trip lengths tried: every hour to 2 days, then coarser
  for (let t = 1; t <= 48; t++) TOFS.push(t);
  for (let t = 54; t <= 96; t += 6) TOFS.push(t);
  for (let t = 108; t <= 365; t += 12) TOFS.push(t);
  // Quickest trip (rounded to the steps above) within the ship's reach, or null
  async function quick(T, a, b, dep, maxDv) {
    for (const t of TOFS) { if ((await T.deltaV(a, b, dep, t)) <= maxDv) return t; }
    return null;
  }
  // 0 = best in this route's 30 days (green) … 1 = worst (red)
  const hue = f => 'hsl(' + Math.round(130 - 130 * f) + ',70%,' + (42 - 6 * f) + '%)';
  const WIN_CSS = '<style>.lw{margin-top:22px}.lw h3{margin:0 0 4px}.lw .r{display:flex;align-items:center;gap:8px;margin:3px 0}' +
    '.lw .n{width:250px;flex:none;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.lw .s{flex:1;display:flex;height:20px;border-radius:4px;overflow:hidden;background:#1a212c;position:relative}' +
    '.lw .s i{flex:1;display:block;border-right:1px solid rgba(0,0,0,.25)}.lw .s i.x{background:#3a4352}' +
    '.lw .s:after{content:"";position:absolute;left:0;top:-2px;bottom:-2px;width:3px;background:#fff;box-shadow:0 0 6px #fff}' +
    '.lw .b{width:190px;flex:none;font-size:12px;color:#9aa8bb}.lw .ok{color:#3fd68a;font-weight:bold}' +
    '.lw .ax{display:flex;margin-left:258px;margin-right:198px;font-size:11px;color:#9aa8bb;justify-content:space-between}' +
    '.lw .g{margin:10px 0 4px;font-weight:bold;color:#8fe3ff}' +
    '.lwb{padding:5px 12px;border-radius:6px;border:1px solid #5fc3e4;background:#14202c;color:#8fe3ff;cursor:pointer;font-weight:bold}' +
    '@media(max-width:700px){.lw .n{width:110px}.lw .b{display:none}.lw .ax{margin-left:118px;margin-right:0}}</style>';

  const FORB = {};   // belt orbits for Fuel on the belt
  async function fillFuel(m, T, me, dep, maxDv, from, Y, esc) {
    const box = m.querySelector('#trFT');
    if (!box || !SELL) return;
    if (!from || !from.o) {
      if (from && from.id === AP_ID && !apOrbit && !apBusy) {
        apBusy = true;
        fetch('orbits.php?ids=' + AP_ID).then(r => r.json()).then(j => { const x = j && j.orbits && j.orbits[AP_ID]; if (x && x.o) apOrbit = x.o; })
          .catch(() => {}).then(() => { apBusy = false; if (apOrbit && m.isConnected) drawTravel(m); });
      }
      box.innerHTML = '<div class="note">Loading…</div>'; return;
    }
    const ids = Object.keys(SELL).map(Number).filter(id => SELL[id].kg >= 1000);
    if (!ids.length) { box.innerHTML = '<div class="note">Nobody is selling Hydrogen Propellant on the belt right now.</div>'; return; }
    const need = ids.filter(id => !FORB[id]);
    for (let i = 0; i < need.length; i += 200) {
      const j = await fetch('orbits.php?ids=' + need.slice(i, i + 200).join(',')).then(r => r.json()).catch(() => ({}));
      Object.entries((j && j.orbits) || {}).forEach(([k, v]) => { if (v && v.o) FORB[k] = v.o; });
    }
    if (me !== run || !m.isConnected) return;
    const t = kg => Y.fmtT ? Y.fmtT(kg / 1000) : Math.round(kg / 1000) + ' t';
    const rows = ids.filter(id => FORB[id]).map(id => ({ id, o: FORB[id], au: id === from.id ? 0 : T.distance(from.o, FORB[id], dep) / 1.495978707e11 }))
      .sort((a, b) => a.au - b.au);
    box.innerHTML = '<div class="wrap"><table id="trFTt"><thead><tr><th>Asteroid</th><th class="num">For sale</th><th class="num">Cheapest</th>' +
      '<th class="num">Trip from ' + esc(from.name) + '</th><th class="num">Distance now</th></tr></thead><tbody>' +
      rows.map(r => '<tr><td><b>' + esc(SELL[r.id].name) + '</b>' + (window.GL ? window.GL('/asteroids/' + r.id, 'Open this asteroid in the game') : '') + '</td>' +
        '<td class="num" data-sort="' + Math.round(SELL[r.id].kg) + '">' + t(SELL[r.id].kg) + '</td>' +
        '<td class="num" data-sort="' + SELL[r.id].pt.toFixed(2) + '">' + Math.round(SELL[r.id].pt).toLocaleString() + ' SWAY/t</td>' +
        '<td class="num" data-fu="' + r.id + '" data-sort="">' + (r.id === from.id ? '<span class="a">you\'re there</span>' : '<span class="a">…</span>') + '</td>' +
        '<td class="num" data-sort="' + r.au.toFixed(3) + '">' + r.au.toFixed(2) + ' AU</td></tr>').join('') + '</tbody></table></div>';
    for (const r of rows) {
      if (r.id === from.id) continue;
      if (me !== run || !m.isConnected) return;
      const td = m.querySelector('td[data-fu="' + r.id + '"]'); if (!td) continue;
      const f = await T.fastest(from.o, r.o, dep, maxDv);
      td.innerHTML = f ? '<b>' + f.tof + ' h</b>' + (f.tof >= 48 ? ' <span class="a">(' + (f.tof / 24).toFixed(1) + ' d)</span>' : '') : '<span class="a">out of range</span>';
      td.dataset.sort = f ? f.tof : '';
      await new Promise(res => setTimeout(res, 0));
    }
  }

  function drawTravel(m) {
    const Y = window.YIC, D = Y.D, esc = Y.esc;

    const asts = (D.owned || []).filter(a => a.Orbit && a.Orbit.a)
      .map(a => ({ id: a.id, name: (a.Name && a.Name.name) || ('Asteroid #' + a.id), o: a.Orbit }))
      .sort((a, b) => a.name.localeCompare(b.name));
    // Adalia Prime added when ticked (its orbit is fetched once, then the page redraws)
    let apAdd = false;
    if (APT && apOn() && !asts.some(a => a.id === AP_ID)) {
      if (!apOrbit) {
        if (!apBusy) {
          apBusy = true;
          fetch('orbits.php?ids=' + AP_ID).then(r => r.json()).then(j => {
            const x = j && j.orbits && j.orbits[AP_ID]; if (x && x.o) apOrbit = x.o;
          }).catch(() => {}).then(() => { apBusy = false; if (apOrbit && m.isConnected) drawTravel(m); });
        }
      } else apAdd = true;
    }
    if (asts.length + (apAdd ? 1 : 0) < 2) {
      m.innerHTML = '<div class="note">You need at least two asteroids for a travel table.' + apBox() + '</div>'; apWire(m); return;
    }
    // Test (?beta=1): only asteroids with a crew on them (a button shows them all)
    let hidden = 0;
    {
      const crewed = new Set((D.crewsRaw || []).filter(c => ((c.Crew && c.Crew.roster) || []).length)
        .map(c => ((((c.Location || {}).locations) || []).find(x => x.label === 3) || {}).id).filter(Boolean));
      const few = asts.filter(a => crewed.has(a.id));
      if (!S.allAst && few.length >= 2) { hidden = asts.length - few.length; asts.splice(0, asts.length, ...few); }
    }
    if (apAdd) asts.unshift({ id: AP_ID, name: 'Adalia Prime', o: apOrbit });
    // Fuel on the belt (Mark, 15 Nov – ?beta=1): trips start from one of your rocks or Adalia Prime
    const fromList = (D.owned || []).filter(a => a.Orbit && a.Orbit.a)
      .map(a => ({ id: a.id, name: (a.Name && a.Name.name) || ('Asteroid #' + a.id), o: a.Orbit }))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (!fromList.some(a => a.id === AP_ID)) fromList.push({ id: AP_ID, name: 'Adalia Prime', o: apOrbit });
    if (!S.from || !fromList.some(a => a.id === +S.from)) S.from = fromList[0].id;

    // Ship choices: your transports and shuttles, plus generic ones
    const ships = (D.ships || []).filter(s => s.st >= 2 && s.st <= 4).sort((a, b) => a.name.localeCompare(b.name));
    const opts = [...ships.map(s => ['s' + s.id, s.name + ' · ' + s.type]),
      ['g2', 'Any Light Transport (no crew bonus)'], ['g3', 'Any Heavy Transport (no crew bonus)'], ['g4', 'Any Shuttle (no crew bonus)']];
    if (!S.ship || !opts.some(o => o[0] === S.ship)) {
      const lt = ships.find(s => s.st === 2);
      S.ship = lt ? 's' + lt.id : opts[0][0];
    }

    const sel = (id, cur, list) => '<select id="' + id + '">' + list.map(([v, t]) =>
      '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select>';

    let h = WIN_CSS + '<div class="bar" style="margin:0 0 10px">' +
      'Ship ' + sel('trS', S.ship, opts) +
      ' Propellant ' + sel('trP', S.prop, [['full', 'Full tank'], ['now', 'What it has now']]) +
      ' Cargo ' + sel('trC', S.cargo, [['empty', 'Empty'], ['full', 'Full'], ['now', 'What it has now']]) +
      ' Leave ' + sel('trL', S.leave, [[0, 'now'], [6, 'in 6 hours'], [12, 'in 12 hours'], [24, 'in 1 day'], [48, 'in 2 days']]) +
      (RFS ? ' <button class="lwb" id="trFuel" style="margin-left:8px">' + (S.fuel ? '← Back to Travel' : '⛽ Fuel on the belt') + '</button>' : '') +
      (RFS && S.fuel ? ' From ' + sel('trF', S.from, fromList.map(a => [a.id, a.name])) : '') +
      (!S.fuel && (hidden || S.allAst) ? ' <button class="lwb" id="trAll" style="margin-left:8px">' + (S.allAst ? 'Only asteroids with a crew' : 'Show all asteroids (' + hidden + ' more)') + '</button>' : '') + (S.fuel ? '' : apBox()) + '</div>';

    if (RFS) {
      const B = window.BELTDATA && window.BELTDATA.get(() => { if (SELL) return; beltFuel(Y, window.BELTDATA.data); if (m.isConnected) drawTravel(m); });
      if (B) beltFuel(Y, B); else if (!window.BELTDATA) SELL = {};
    }
    const ref = refuelMap(Y, D, asts);
    if (S.fuel) {
      h += '<div id="trInfo" class="note" style="padding:0 0 10px"></div><div id="trFT">' +
        (SELL ? '' : '<div class="note">Checking the belt markets for propellant…</div>') + '</div>' +
        '<div class="note" style="padding:10px 0 0">Every asteroid with at least 1 t of Hydrogen Propellant for sale. Price = cheapest listing, market fee included. ' +
        'Trip = quickest flight there leaving at the chosen time with the ship above (it can refuel when it arrives). Click a heading to sort.</div>';
    } else { {
      if (RFS) {
        const of = k => asts.filter(a => RST[a.id] === k);
        const mk = of('make'), st = of('stock'), mkt = of('market'), pw = of('powders'), no = of('no');
        const t = kg => Y.fmtT ? Y.fmtT(kg / 1000) : Math.round(kg / 1000) + ' t';
        h += '<div class="note" style="padding:0 0 10px">⛽ <b>Makes its own propellant:</b> ' + (mk.map(a => esc(a.name)).join(', ') || 'none') +
          (mkt.length ? '<br>⛽ <b>Propellant for sale at its markets:</b> ' + mkt.map(a => esc(a.name) + (SELL && SELL[a.id] ? ' (' + t(SELL[a.id].kg) + ')' : '')).join(', ') : '') +
          (st.length ? '<br>⛽ <b>Has propellant in storage:</b> ' + st.map(a => esc(a.name) + ' (' + t(STK[a.id]) + ')').join(', ') : '') +
          (pw.length ? '<br>⛽ <b>Can make it if you bring Silica Powder and Tungsten Powder:</b> ' + pw.map(a => esc(a.name)).join(', ') : '') +
          (no.length ? '<br>⛽ <b>Can\'t refuel:</b> ' + no.map(a => esc(a.name)).join(', ') : '') +
          (SELL ? (() => {
            const shown = new Set(asts.map(a => +a.id)), more = Object.keys(SELL).filter(id => !shown.has(+id) && SELL[id].kg >= 1000)
              .sort((x, y) => SELL[y].kg - SELL[x].kg);
            return more.length ? '<br>⛽ Propellant is also for sale on <b>' + more.length + '</b> other asteroid' + (more.length === 1 ? '' : 's') + ' across the belt – see <b>⛽ Fuel on the belt</b>.' : '';
          })() : '<br><span class="a">⛽ Checking the belt markets for propellant…</span>') +
          (pw.length || no.length ? '<br><span class="a">Flying to a rock that can\'t refuel yet, the ship only uses half its propellant so it can get back.</span>' : '') + '</div>';
      } else {
      const yes = asts.filter(a => ref[a.id]).map(a => esc(a.name)), no = asts.filter(a => !ref[a.id]).map(a => esc(a.name));
      h += '<div class="note" style="padding:0 0 10px">⛽ <b>Makes its own propellant:</b> ' + (yes.join(', ') || 'none') +
        (no.length ? '<br>⛽ <b>Can\'t refuel:</b> ' + no.join(', ') + ' – flying there, the ship only uses half its propellant so it can get back.' : '') + '</div>';
      }
    }
    h += '<div id="trInfo" class="note" style="padding:0 0 10px"></div><div class="wrap"><table id="trT"><thead><tr><th>From \\ To</th>' +
      asts.map(a => '<th class="num">' + esc(a.name) + '</th>').join('') + '</tr></thead><tbody>' +
      asts.map(a => '<tr><td><b>' + esc(a.name) + '</b>' + (window.GL?window.GL('/asteroids/' + a.id,'Open this asteroid in the game'):'') + '</td>' + asts.map(b =>
        '<td class="num" data-f="' + a.id + '" data-t="' + b.id + '">' + (a.id === b.id ? '<span class="a">–</span>' : '<span class="a">…</span>') + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div>' +
      '<div class="note" style="padding:10px 0 0">Quickest trip leaving at the chosen time, worked out the same way as the game\'s route planner ' +
      '(1 game day = 1 real hour). The fastest in each row is highlighted. Small grey figure = distance between the two asteroids right now. ' +
      'Food, emergency mode and waiting for a better launch window are not included.</div>';
    h += '<div class="lw" id="trW"></div>';
    }
    m.innerHTML = h;

    // Changing an option redraws the page
    const keyOf = { trS: 'ship', trP: 'prop', trC: 'cargo', trL: 'leave' };
    Object.keys(keyOf).forEach(id => m.querySelector('#' + id).addEventListener('change', e => {
      S[keyOf[id]] = id === 'trL' ? +e.target.value : e.target.value;
      drawTravel(m);
    }));

    const ab = m.querySelector('#trAll'); if (ab) ab.onclick = () => { S.allAst = !S.allAst; drawTravel(m); };
    const fb = m.querySelector('#trFuel'); if (fb) fb.onclick = () => { S.fuel = !S.fuel; drawTravel(m); };
    const fs = m.querySelector('#trF'); if (fs) fs.onchange = () => { S.from = +fs.value; drawTravel(m); };
    apWire(m);

    // Ship figures
    let st = 2, variant = 1, mates = null, propKg = 0, cargoKg = 0, label;
    if (S.ship[0] === 's') {
      const s = ships.find(x => 's' + x.id === S.ship);
      st = s.st; variant = s.sv;
      const cr = (D.crewsRaw || []).find(c => c.id === s.crewId);
      mates = ((cr && cr.Crew && cr.Crew.roster) || []).map(id => (D.crewmates || {})[id]).filter(Boolean);
      propKg = s.prop * 1000;
      cargoKg = s.useM / 1000;
      label = esc(s.name) + (cr ? ' (crew ' + esc((cr.Name && cr.Name.name) || ('#' + cr.id)) + ')' : '');
    } else {
      st = +S.ship.slice(1);
      label = 'a standard ' + TYPE_NAME[st] + ' with no crew bonus';
    }
    const info = m.querySelector('#trInfo');
    info.innerHTML = 'Working out trips for ' + label + '…';

    const me = ++run;
    import('../vendor/travel.js?v=' + Y.VER).then(async T => {
      if (me !== run || !m.isConnected) return;
      let bonus = 1;
      if (mates && mates.length) { bonus = T.exhaustBonus(mates); label += ' · engine bonus ×' + bonus.toFixed(2); }

      const ship = T.SHIPS[st];
      const pk = S.prop === 'full' ? ship[2] / 1000 : propKg;
      const ck = S.cargo === 'empty' ? 0 : S.cargo === 'full' ? ship[3] / 1000 : cargoKg;
      const maxDv = T.maxDeltaV(st, variant, bonus, ck, pk);
      // Going somewhere you can't refuel: burn only half, carry the other half as extra weight
      const halfDv = T.maxDeltaV(st, variant, bonus, ck + pk / 2, pk / 2);
      const reach = b => ref[b.id] ? maxDv : halfDv;
      const dep = (Date.now() / 1000 - 1609459200) / 3600 + S.leave;   // orbit time in hours
      info.innerHTML = label + ' · ' + Y.fmtT(pk / 1000) + ' propellant · ' + (ck ? Y.fmtT(ck / 1000) + ' cargo' : 'no cargo') +
        ' · up to ' + (maxDv / 1000).toFixed(1) + ' km/s' + (' (' + (halfDv / 1000).toFixed(1) + ' km/s to places you can\'t refuel)');

      if (S.fuel) { await fillFuel(m, T, me, dep, maxDv, fromList.find(a => a.id === +S.from), Y, esc); return; }
      // Fill each cell, then highlight the fastest in each row
      const best = {};
      for (const a of asts) for (const b of asts) {
        if (a.id === b.id) continue;
        if (me !== run || !m.isConnected) return;
        const td = m.querySelector('td[data-f="' + a.id + '"][data-t="' + b.id + '"]');
        const au = T.distance(a.o, b.o, dep) / 1.495978707e11;
        const f = await T.fastest(a.o, b.o, dep, reach(b));
        td.innerHTML = (f ? '<b>' + f.tof + ' h</b>' + (f.tof >= 48 ? ' <span class="a">(' + (f.tof / 24).toFixed(1) + ' d)</span>' : '') : '<span class="a">out of range</span>') +
          '<br>' + (DCL ? '<span style="color:' + auCol(au) + ';font-weight:bold" title="Distance right now">' : '<span class="a">') + au.toFixed(2) + ' AU</span>';
        td.dataset.h = f ? f.tof : '';
        if (f && (!best[a.id] || f.tof < best[a.id].tof)) best[a.id] = { tof: f.tof, td };
        await new Promise(r => setTimeout(r, 0));
      }
      Object.values(best).forEach(x => { x.td.style.background = 'rgba(95,195,228,.15)'; });
      drawWindows(m, T, asts, reach, me, esc);
    }).catch(e => { info.innerHTML = 'Could not load the travel maths (' + esc((e && e.message) || e) + ').'; });
  }

  // One strip per route: each block = leaving at that time, coloured by how quick the trip is
  // Which routes to chart: none until you click a trip in the table, or all of them
  const W = { sel: null, all: false };
  const strips = {};                                   // worked-out strips, kept for this ship set-up
  let wkey = '', wrun = 0;
  function drawWindows(m, T, asts, reach, me, esc) {
    const box = m.querySelector('#trW'); if (!box) return;
    // Clicking a trip time in the table picks that route
    m.querySelectorAll('#trT td[data-f]').forEach(td => {
      if (td.dataset.f === td.dataset.t) return;
      td.style.cursor = 'pointer'; td.title = 'Show launch windows for this trip';
      td.onclick = () => { W.sel = td.dataset.f + '_' + td.dataset.t; W.all = false; show(); };
    });
    const k = JSON.stringify([S, REF]); if (k !== wkey) { wkey = k; for (const x in strips) delete strips[x]; }
    const name = id => esc((asts.find(a => a.id === +id) || {}).name || '');
    const now = (Date.now() / 1000 - 1609459200) / 3600, n = WDAYS * 24 / WSTEP;
    const fmtH = x => x >= 48 ? (x / 24).toFixed(1) + ' days' : x + ' h';

    function show() {
      const mine = ++wrun;
      m.querySelectorAll('#trT td[data-f]').forEach(td => {
        const k = td.dataset.f + '_' + td.dataset.t, back = W.sel && W.sel.split('_').reverse().join('_');
        const on = !W.all && W.sel && (k === W.sel || k === back);
        td.style.outline = on ? (k === W.sel ? '2px solid #8fe3ff' : '2px dashed #5fc3e4') : '';
        td.style.outlineOffset = on ? '-2px' : '';
        td.style.boxShadow = on && k === W.sel ? 'inset 0 0 12px rgba(143,227,255,.45)' : '';
      });
      let routes = [];
      if (W.all) asts.forEach(a => asts.forEach(b => { if (a.id !== b.id) routes.push([a, b]); }));
      else if (W.sel) {
        const [f, t] = W.sel.split('_').map(Number), a = asts.find(x => x.id === f), b = asts.find(x => x.id === t);
        if (a && b) routes = [[a, b], [b, a]];          // the trip and the way back
      }
      const btn = '<button class="lwb" id="lwAll">' + (W.all ? 'Show just one trip' : 'Show all trips') + '</button>';
      let h = '<div class="note" style="padding:0 0 12px">Trip times in the table are coloured by how good leaving <b>now</b> is: ' +
        '<b style="color:hsl(130,80%,62%)">green</b> = about as quick as it gets in the next 30 days, ' +
        '<b style="color:hsl(0,80%,62%)">red</b> = slow now, a better time is coming.' +
        (DCL ? '<br>Distances are coloured by how far away the rock is right now: <b style="color:#3fd68a">under 1 AU</b>, <b style="color:#b5e04a">1–2 AU</b>, <b style="color:#ffd24a">2–3 AU</b>, <b style="color:#ff6b6b">3 AU or more</b>.' : '') + '</div>' +
        '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><h3>🚀 Launch windows – next 30 days</h3>' + btn + '</div>';
      if (!routes.length) {
        h += '<div class="note" style="padding:4px 0">Click a trip time in the table above to see the best times to leave.</div>';
        box.innerHTML = h; box.querySelector('#lwAll').onclick = () => { W.all = true; show(); }; return;
      }
      const ticks = [0, 5, 10, 15, 20, 25, 30].map(d => {
        const t = new Date(Date.now() + d * 86400000);
        return '<span>' + (d ? t.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'Now') + '</span>';
      }).join('');
      h += '<div class="note" style="padding:0 0 6px">Green = a quick trip if you leave then, red = a slow one, grey = out of reach for this ship. ' +
        'The white line is now. Hover a block for the trip time.</div><div class="ax">' + ticks + '</div>';
      let last = null;
      routes.forEach(([a, b]) => {
        if (W.all && last !== a.id) { h += '<div class="g">From ' + esc(a.name) + '</div>'; last = a.id; }
        h += '<div class="r"><div class="n">' + (W.all ? '' : esc(a.name) + ' ') + '→ ' + esc(b.name) + (REF[b.id] ? '' : ' <span class="a">(½ fuel)</span>') + '</div>' +
          '<div class="s" id="lw' + a.id + '_' + b.id + '"></div><div class="b" id="lb' + a.id + '_' + b.id + '">working out…</div></div>';
      });
      box.innerHTML = h;
      box.querySelector('#lwAll').onclick = () => { W.all = !W.all; show(); };
      (async () => {
        for (const [a, b] of routes) {
          const key = a.id + '_' + b.id;
          const v = await strip(a, b);
          if (!v || mine !== wrun || !m.isConnected) return;
          paint(key, v);
        }
      })();
    }
    // Work out one route's 30 days once (shared by the chart and the table colours)
    function strip(a, b) {
      const key = a.id + '_' + b.id;
      if (!strips[key]) strips[key] = (async () => {
        const v = [];
        for (let i = 0; i < n; i++) {
          if (me !== run || !m.isConnected) { delete strips[key]; return null; }
          v.push(await quick(T, a.o, b.o, now + i * WSTEP, reach(b)));
          if (i % 6 === 5) await new Promise(r => setTimeout(r, 0));
        }
        return v;
      })();
      return strips[key];
    }
    // Colour each trip time in the table: how good leaving now is, compared with the next 30 days
    (async () => {
      for (const a of asts) for (const b of asts) {
        if (a.id === b.id) continue;
        const v = await strip(a, b);
        if (!v || me !== run || !m.isConnected) return;
        const td = m.querySelector('td[data-f="' + a.id + '"][data-t="' + b.id + '"]'), bt = td && td.querySelector('b');
        const ok = v.filter(x => x !== null); if (!bt || !ok.length || v[0] === null) continue;
        const lo = Math.min(...ok), hi = Math.max(...ok), f = hi > lo ? (v[0] - lo) / (hi - lo) : 0;
        bt.style.color = 'hsl(' + Math.round(130 - 130 * f) + ',80%,62%)';
        bt.style.fontSize = '17px';
        bt.title = f <= 0.15 ? 'Good time to go' : f >= 0.7 ? 'Slow right now – better times coming' : 'OK right now';
      }
    })();
    function paint(key, v) {
      const ok = v.filter(x => x !== null), lo = Math.min(...ok), hi = Math.max(...ok);
      m.querySelector('#lw' + key).innerHTML = v.map((x, i) => {
        const when = i ? 'Leave in ' + fmtH(i * WSTEP) : 'Leave now';
        if (x === null) return '<i class="x" title="' + when + ': out of reach"></i>';
        const f = hi > lo ? (x - lo) / (hi - lo) : 0;
        return '<i style="background:' + hue(f) + '" title="' + when + ': about ' + fmtH(x) + ' flight"></i>';
      }).join('');
      const lb = m.querySelector('#lb' + key);
      if (!ok.length) { lb.textContent = 'out of reach'; return; }
      const bi = v.indexOf(lo), cur = v[0];
      lb.innerHTML = (cur !== null && cur <= lo * 1.15 ? '<span class="ok">✓ good now</span> · ' : '') +
        'best: ' + (bi ? 'in ' + fmtH(bi * WSTEP) : 'now') + ', ~' + fmtH(lo);
    }
    show();
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.R = drawTravel;
})();
