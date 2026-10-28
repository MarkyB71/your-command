/* Where to buy – Your Influence Command (Mark, 28 Oct 2026) – TEST on ?beta=1
   Trade Deck console. Pick a product, how much, which rock you fly from and which ship:
   lists every asteroid selling it, nearest first, with flight times there and back,
   propellant burned and what it costs in SWAY, the goods price (market fee included)
   and the total.
   Fuel rule (Mark): if the rock you're buying on sells Hydrogen Propellant, fly one way on
   a full tank and refuel there for the way home; if not, it's a round trip on one tank and
   only half the tank may be used on the way out.
   Uses window.BELTDATA (pages/market.js), window.YIC (app.js), orbits.php and vendor/travel.js. */
(function () {
  'use strict';
  const BETA = /[?&]beta=1/.test(location.search);
  if (!BETA) return;

  const PROP = 170; // Hydrogen Propellant
  const CSS = `.wb-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 10px}
.wb-row label{color:#8b9ab0;font-size:13px;display:flex;gap:6px;align-items:center}
.wb-row select,.wb-row input[type=number]{font-size:15px;padding:6px 10px;min-width:0!important}
.wb-row input[type=number]{width:110px!important}
.wb-one{flex-wrap:nowrap;overflow-x:auto;gap:8px}
.wb-one select{max-width:230px}
.wb-one #wb-a{width:80px!important}
.wb-row input[type=checkbox]{width:18px;height:18px}
.wb-box{background:#121a26;border:1px solid #2a3648;border-radius:10px;padding:12px 14px;margin:0 0 12px}
.wb-box h3{margin:0 0 8px;font-size:14px;color:#ffd24a;font-weight:600}
.wb-note{color:#8b9ab0;font-size:13px;margin:0 0 10px}
.wb-ok{color:#3fd68a}.wb-bad{color:#ff8a6b}.wb-dim{color:#8b9ab0;font-size:12px}
.wb-best td{background:rgba(255,210,74,.08)}`;

  const S = { p: '', amt: '', unit: 't', from: '', ship: '', prop: 'full', leave: 0, maxH: '', maxC: '', enough: false, fuelOnly: false };
  let run = 0;
  const memo = {};
  const ORB = {};

  const num = (v) => (+v.toFixed(v < 1 ? 4 : v < 100 ? 2 : 0)).toLocaleString();
  const sway = (v) => (v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : v >= 1e4 ? (v / 1e3).toFixed(1) + 'k' : Math.round(v).toLocaleString()) + ' SWAY';
  const hrs = (h) => h + ' h' + (h >= 48 ? ' <span class="a">(' + (h / 24).toFixed(1) + ' d)</span>' : '');

  function css() {
    if (document.getElementById('wb-css')) return;
    const st = document.createElement('style');
    st.id = 'wb-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function page(m) {
    css();
    const Y = window.YIC, D = Y.D || {}, esc = Y.esc, pn = Y.pn;
    const BELT = window.BELTDATA && window.BELTDATA.get(() => { if (isOn()) page(m); });
    if (!BELT || BELT.err) {
      if (BELT && BELT.err) window.BELTDATA.data = null;
      m.innerHTML = '<div class="note">Loading every market listing in the belt…</div>';
      return;
    }
    const mine = new Set(Object.keys(D.crewN || {}).map(Number));
    const sells = (BELT.orders || []).filter((o) => o[1] === 2 && o[2] > 0 && o[3] > 0 && !mine.has(o[6]));
    const prods = [...new Set(sells.map((o) => String(o[0])))].sort((a, b) => pn(a).localeCompare(pn(b)));
    if (!S.p || !prods.includes(S.p)) S.p = prods[0] || '';

    const rocks = (Y.asts || []).filter((a) => a.id).map((a) => ({ id: a.id, name: a.name }));
    (D.owned || []).forEach((a) => { if (a.id && !rocks.some((r) => r.id === a.id)) rocks.push({ id: a.id, name: (a.Name && a.Name.name) || ('Asteroid #' + a.id) }); });
    rocks.sort((a, b) => a.name.localeCompare(b.name));
    const ships = (D.ships || []).filter((s) => s.st >= 2);
    if (!S.ship) S.ship = ships[0] ? 's' + ships[0].id : 't2';
    if (!S.from) {
      const sh = ships.find((s) => 's' + s.id === S.ship);
      S.from = String((sh && sh.dId) || (rocks[0] && rocks[0].id) || '');
    }
    const bulk = S.p && !Y.isAt(S.p);
    if (S.amt === '') S.amt = bulk ? '100' : '10';
    if (!bulk) S.unit = 't';

    const opt = (v, t, sel) => '<option value="' + v + '"' + (String(sel) === String(v) ? ' selected' : '') + '>' + esc(t) + '</option>';
    let h = '<div class="wb-note">Find the nearest place selling what you need – flight times, propellant burned and its cost in SWAY, and the total.</div>';
    h += '<div class="wb-box"><h3>What do you need?</h3><div class="wb-row wb-one">' +
      '<select id="wb-p" title="Product">' + prods.map((p) => opt(p, pn(p), S.p)).join('') + '</select>' +
      '<input id="wb-a" type="number" min="0" step="any" inputmode="decimal" title="Amount" value="' + esc(S.amt) + '">' +
      (bulk ? '<select id="wb-u" title="Weight">' + opt('kg', 'kg', S.unit) + opt('t', 't', S.unit) + opt('kt', 'kt', S.unit) + '</select>' : '<span class="a">items</span>') +
      '<label>from <select id="wb-f">' + rocks.map((r) => opt(r.id, r.name, S.from)).join('') + '</select></label>' +
      '<label>in <select id="wb-s">' +
      ships.map((s) => opt('s' + s.id, s.name, S.ship)).join('') +
      opt('t2', 'Standard Light Transport', S.ship) + opt('t3', 'Standard Heavy Transport', S.ship) + opt('t4', 'Standard Shuttle', S.ship) + '</select></label>' +
      '<select id="wb-pr" title="Propellant">' + opt('full', 'Full tank', S.prop) + opt('now', 'Tank as it is now', S.prop) + '</select>' +
      '<select id="wb-l" title="When you leave">' + [[0, 'Leave now'], [6, 'In 6 h'], [12, 'In 12 h'], [24, 'In 1 day'], [48, 'In 2 days']].map(([v, t]) => opt(v, t, S.leave)).join('') + '</select></div></div>';
    h += '<div class="wb-box"><h3>Fine tune</h3><div class="wb-row">' +
      '<label>Max trip <input id="wb-mh" type="number" min="0" step="1" placeholder="any" value="' + esc(S.maxH) + '"> hours</label>' +
      '<label>Max total cost <input id="wb-mc" type="number" min="0" step="any" placeholder="any" value="' + esc(S.maxC) + '"> SWAY</label>' +
      '<label><input id="wb-en" type="checkbox"' + (S.enough ? ' checked' : '') + '> Only places with enough</label>' +
      '<label><input id="wb-fo" type="checkbox"' + (S.fuelOnly ? ' checked' : '') + '> Only places selling propellant</label></div></div>';
    h += '<div id="wb-out"></div>';
    m.innerHTML = h;
    wire(m);
    work(m, BELT, sells);
  }

  function wire(m) {
    const set = (id, k, f) => { const e = m.querySelector('#' + id); if (e) e.addEventListener('change', () => { S[k] = f ? f(e) : e.value; if (k === 'p') S.amt = ''; if (k === 'ship') S.from = ''; page(m); }); };
    set('wb-p', 'p'); set('wb-u', 'unit'); set('wb-f', 'from'); set('wb-s', 'ship'); set('wb-pr', 'prop'); set('wb-l', 'leave', (e) => +e.value);
    set('wb-en', 'enough', (e) => e.checked); set('wb-fo', 'fuelOnly', (e) => e.checked);
    // typing: wait a moment, then redo the results only (the boxes keep focus)
    [['wb-a', 'amt'], ['wb-mh', 'maxH'], ['wb-mc', 'maxC']].forEach(([id, k]) => {
      const e = m.querySelector('#' + id);
      let t = null;
      if (e) e.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { S[k] = e.value; work(m, window.BELTDATA.data, null); }, 400); });
    });
  }

  async function work(m, BELT, sells) {
    const out = m.querySelector('#wb-out');
    if (!out || !BELT) return;
    const Y = window.YIC, D = Y.D || {}, esc = Y.esc, pn = Y.pn, me = ++run;
    const mine = new Set(Object.keys(D.crewN || {}).map(Number));
    if (!sells) sells = (BELT.orders || []).filter((o) => o[1] === 2 && o[2] > 0 && o[3] > 0 && !mine.has(o[6]));
    const mk = BELT.markets || {};
    const fee = (id) => { const x = mk[id] && mk[id].ex; return x ? (x.takerFee || 0) / 10000 : 0; };
    const uM = (p) => (Y.PR[p] && Y.PR[p][2]) || 1000; // grams per unit
    const p = S.p, bulk = !Y.isAt(p);
    const want = parseFloat(S.amt);
    if (!p) { out.innerHTML = '<div class="note">Nothing is for sale on the belt right now.</div>'; return; }
    if (!(want > 0)) { out.innerHTML = '<div class="note">Enter how much you need.</div>'; return; }
    const units = bulk ? want * ({ kg: 1e3, t: 1e6, kt: 1e9 })[S.unit || 't'] / uM(p) : want;

    // propellant price per kg: cheapest on the belt, and cheapest on each asteroid
    const pkg = (o) => o[3] * (1 + fee(o[4])) / 1e6 * 1000 / uM(PROP);
    let beltFuel = null;
    const rockFuel = {};
    sells.filter((o) => String(o[0]) === String(PROP)).forEach((o) => {
      const v = pkg(o);
      if (beltFuel === null || v < beltFuel) beltFuel = v;
      if (!(o[5] in rockFuel) || v < rockFuel[o[5]]) rockFuel[o[5]] = v;
    });

    // listings of the product, grouped by asteroid, cheapest first
    const byRock = {};
    sells.filter((o) => String(o[0]) === p).forEach((o) => (byRock[o[5]] = byRock[o[5]] || []).push(o));
    const rockIds = Object.keys(byRock).map(Number);
    if (!rockIds.length) { out.innerHTML = '<div class="note">Nobody is selling ' + esc(pn(p)) + ' right now.</div>'; return; }

    // ship figures
    let st = 2, variant = 1, mates = null, propNowKg = 0, label;
    if (S.ship[0] === 's') {
      const s = (D.ships || []).find((x) => 's' + x.id === S.ship);
      if (s) {
        st = s.st; variant = s.sv; propNowKg = s.prop * 1000; label = s.name;
        const cr = (D.crewsRaw || []).find((c) => c.id === s.crewId);
        mates = ((cr && cr.Crew && cr.Crew.roster) || []).map((id) => (D.crewmates || {})[id]).filter(Boolean);
      }
    } else { st = +S.ship.slice(1); label = 'a standard ' + ({ 2: 'Light Transport', 3: 'Heavy Transport', 4: 'Shuttle' })[st] + ', no crew bonus'; }

    out.innerHTML = '<div class="note">Working out flights to ' + rockIds.length + ' asteroid' + (rockIds.length > 1 ? 's' : '') + '…</div>';
    const from = +S.from;
    const need = [from].concat(rockIds).filter((id) => !ORB[id]);
    let T;
    try {
      const [j, TT] = await Promise.all([
        need.length ? fetch('orbits.php?ids=' + need.slice(0, 200).join(',')).then((r) => r.json()) : Promise.resolve({ orbits: {} }),
        import('./travel.js?v=' + (Y.VER || 1)),
      ]);
      Object.assign(ORB, (j && j.orbits) || {});
      T = TT;
    } catch (e) { if (me === run) out.innerHTML = '<div class="note">Could not load the flight maths just now – try again in a minute.</div>'; return; }
    if (me !== run) return;

    const SH = T.SHIPS[st], hull = SH[1] / 1000, tank = SH[2] / 1000, capKg = SH[3] / 1000;
    const bonus = mates && mates.length ? T.exhaustBonus(mates) || 1 : 1;
    const ve = T.EXHAUST * bonus * (1 + (T.VARIANT_BONUS[variant] || 0));
    const P = S.prop === 'full' ? tank : Math.min(tank, propNowKg);
    const burn = (dv, wet) => wet * (1 - Math.exp(-dv / ve));
    const dep = (Date.now() / 1000 - 1609459200) / 3600 + S.leave;
    const depH = Math.floor(dep);
    const fast = async (a, b, t, maxDv) => {
      const k = a + '>' + b + '>' + Math.floor(t) + '>' + Math.round(maxDv);
      if (!(k in memo)) {
        if (!ORB[a] || !ORB[b]) return null;
        memo[k] = await T.fastest(ORB[a].o, ORB[b].o, Math.floor(t), maxDv);
        await new Promise((r) => setTimeout(r, 0));
      }
      return memo[k];
    };
    const fromName = ((Y.asts || []).find((a) => a.id === from) || {}).name || (ORB[from] && ORB[from].n) || ('Asteroid #' + from);

    const rows = [];
    let done = 0;
    for (const A of rockIds) {
      if (me !== run || !out.isConnected) return;
      const L = byRock[A].sort((x, y) => x[3] * (1 + fee(x[4])) - y[3] * (1 + fee(y[4])));
      let left = units, got = 0, goods = 0;
      for (const o of L) { if (left <= 0) break; const take = Math.min(left, o[2]); goods += take * o[3] / 1e6 * (1 + fee(o[4])); got += take; left -= take; }
      const have = L.reduce((s, o) => s + o[2], 0);
      const short = left > 1e-6;
      const fuelHere = A in rockFuel;
      const r = { A, name: (mk[L[0][4]] && mk[L[0][4]].ast) || ('Asteroid #' + A), L, got, goods, have, short, fuelHere, mks: [...new Set(L.map((o) => o[4]))] };
      const loadKg = got * uM(p) / 1000;
      r.trips = capKg ? Math.max(1, Math.ceil(loadKg / capKg)) : 1;
      const load = Math.min(loadKg, capKg);
      if (A === from) { r.same = true; r.h = 0; r.fuelT = 0; r.fuelCost = 0; }
      else {
        // way out (empty hold)
        const dv1max = fuelHere ? T.maxDeltaV(st, variant, bonus, 0, P) : T.maxDeltaV(st, variant, bonus, P / 2, P / 2);
        const f1 = P > 0 ? await fast(from, A, dep, dv1max) : null;
        if (!f1) r.out = true;
        else {
          const b1 = burn(f1.dv, hull + P);
          const p2 = fuelHere ? tank : P - b1; // refill there, or what's left
          const f2 = await fast(A, from, dep + f1.tof, T.maxDeltaV(st, variant, bonus, load, p2));
          r.h1 = f1.tof;
          if (!f2) r.noBack = true;
          else {
            const b2 = burn(f2.dv, hull + load + p2);
            r.h2 = f2.tof; r.h = f1.tof + f2.tof;
            r.fuelT = (b1 + b2) * r.trips / 1000;
            if (fuelHere) r.fuelCost = beltFuel === null ? null : (b1 * rockFuel[A] + b2 * beltFuel) * r.trips;
            else r.fuelCost = beltFuel === null ? null : (b1 + b2) * beltFuel * r.trips;
          }
        }
      }
      r.total = goods + (r.fuelCost || 0);
      rows.push(r);
      done++;
      if (done % 4 === 0 && me === run) out.innerHTML = '<div class="note">Working out flights… ' + done + ' of ' + rockIds.length + '</div>';
    }
    if (me !== run || !out.isConnected) return;

    const maxH = parseFloat(S.maxH), maxC = parseFloat(S.maxC);
    const ok = (r) => r.h !== undefined;
    let list = rows.filter((r) => (!S.enough || !r.short) && (!S.fuelOnly || r.fuelHere || r.same));
    const hidden = { far: 0, dear: 0 };
    list = list.filter((r) => {
      if (maxH > 0 && (!ok(r) || r.h * r.trips > maxH)) { hidden.far++; return false; }
      if (maxC > 0 && ok(r) && r.total > maxC) { hidden.dear++; return false; }
      return true;
    });
    list.sort((a, b) => (ok(b) - ok(a)) || ((a.h * a.trips) - (b.h * b.trips)) || (a.total - b.total));

    const price = (raw) => bulk ? num(raw / 1e6 * 1000 / uM(p)) + ' <span class="a">/kg</span>' : num(raw / 1e6) + ' <span class="a">each</span>';
    let h = '<div class="wb-note">' + esc(pn(p)) + ' from ' + esc(fromName) + ' with ' + esc(label) + (bonus > 1 ? ' (engine bonus ×' + bonus.toFixed(2) + ')' : '') +
      ' · ' + Y.fmtT(P / 1000) + ' propellant · ' + list.length + ' of ' + rows.length + ' places shown' +
      (hidden.far ? ' · ' + hidden.far + ' too far' : '') + (hidden.dear ? ' · ' + hidden.dear + ' over budget' : '') +
      (beltFuel === null ? ' · <span class="wb-bad">no propellant for sale on the belt, so fuel cost is unknown</span>' : ' · cheapest propellant on the belt ' + num(beltFuel) + ' SWAY/kg') + '</div>';
    if (!list.length) { out.innerHTML = h + '<div class="note">Nothing matches – try loosening the fine-tune options.</div>'; return; }
    h += '<div class="wrap"><table class="nosort"><thead><tr><th>Asteroid</th><th class="num">Cheapest</th><th class="num">They have</th><th class="num">Goods</th>' +
      '<th>Trip</th><th class="num">There</th><th class="num">Back</th><th class="num">Propellant</th><th class="num">Fuel cost</th><th class="num">Total</th></tr></thead><tbody>';
    list.forEach((r, i) => {
      const gl = window.GL ? window.GL('/asteroids/' + r.A, 'Open this asteroid in the game') : '';
      const mkt = r.mks.map((id) => esc((mk[id] && mk[id].name) || ('Marketplace #' + id))).join(', ');
      const trip = r.same ? '<span class="wb-ok">You\'re already here</span>'
        : r.fuelHere ? 'One way<br><span class="wb-dim">refuel there</span>' : 'Round trip<br><span class="wb-dim">no propellant there – ½ tank out</span>';
      let fl;
      if (r.same) fl = '<td class="num">–</td><td class="num">–</td><td class="num">–</td><td class="num">–</td>';
      else if (r.out) fl = '<td class="num" colspan="4"><span class="wb-bad">Out of range for this ship</span></td>';
      else if (r.noBack) fl = '<td class="num">' + hrs(r.h1) + '</td><td class="num" colspan="3"><span class="wb-bad">Can\'t get back loaded</span></td>';
      else fl = '<td class="num"><b>' + hrs(r.h1) + '</b></td><td class="num">' + hrs(r.h2) + '</td><td class="num">' + Y.fmtT(r.fuelT) + '</td>' +
        '<td class="num">' + (r.fuelCost === null ? '?' : sway(r.fuelCost)) + '</td>';
      h += '<tr' + (i === 0 && ok(r) ? ' class="wb-best"' : '') + '><td><b>' + esc(r.name) + '</b>' + gl + '<br><span class="a">' + mkt + '</span></td>' +
        '<td class="num">' + price(r.L[0][3]) + '</td>' +
        '<td class="num">' + Y.fq(p, r.have) + (r.short ? '<br><span class="wb-bad">short of ' + Y.fq(p, units - r.got) + '</span>' : '') + '</td>' +
        '<td class="num">' + sway(r.goods) + '<br><span class="a">' + Y.fq(p, r.got) + '</span></td>' +
        '<td>' + trip + (r.trips > 1 && !r.same ? '<br><span class="wb-bad">' + r.trips + ' trips</span>' : '') + '</td>' + fl +
        '<td class="num tot"><b>' + (ok(r) ? sway(r.total) : '–') + '</b></td></tr>';
    });
    h += '</tbody></table></div><div class="note" style="padding:10px 0 0">Nearest first (time there and back). Goods = cheapest listings on that asteroid first, ' +
      'market fee included; your own listings are skipped. Propellant = burned there and back' +
      ' (for more than one trip, all trips). Fuel cost: one way – what you burned getting there, bought on that asteroid, ' +
      'plus the way home at the cheapest belt price; round trip – everything at the cheapest belt price. ' +
      'Same maths as the game\'s route planner. Food and waiting for a better launch window are not included.</div>';
    out.innerHTML = h;
  }

  const isOn = () => { const b = document.getElementById('vO'); return !!(b && b.className === 'on'); };

  // Adds "Where to buy" to the Trading menu (Trade Deck console), after My trading
  const hook = () => {
    const after = document.getElementById('vW') || document.getElementById('vM') || document.getElementById('vY'), main = document.getElementById('main');
    if (!after || !main || document.getElementById('vO')) return;
    const b = document.createElement('button');
    b.id = 'vO';
    b.textContent = 'Where to buy';
    after.after(b);
    b.addEventListener('click', () => {
      document.querySelectorAll('button.on').forEach((x) => x.classList.remove('on'));
      try { window.YIC.view = 'M'; } catch (e) {} // add-on page showing – app.js leaves #main alone
      b.className = 'on';
      page(main);
    });
  };
  document.addEventListener('click', (e) => {
    const b = document.getElementById('vO'), t = e.target.closest && e.target.closest('button[id^="v"]');
    if (b && t && t !== b) b.className = '';
  }, true);
  setInterval(hook, 700);
})();
