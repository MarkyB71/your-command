/* Trading › Trade finder – Your Influence Command
   One file per page (started 2026-10-18). Finds products you can buy on one
   marketplace and sell straight into a "wanted" offer on another for a profit
   (after both buyer fees), with a Light Transport flight time.
   Uses the belt data loader from pages/market.js (window.BELTDATA). */
(function () {
  'use strict';

  let openP = null;      // product row opened
  let run = 0;           // stops old flight-time loops when the page redraws
  const memo = {};       // flight-time cache

  const num = v => (+v.toFixed(v < 1 ? 4 : v < 100 ? 2 : 0)).toLocaleString();
  const swayShort = v => v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'k' : Math.round(v).toLocaleString();

  function drawTrade(m) {
    const Y = window.YIC, esc = Y.esc, pn = Y.pn, pc = Y.pc;
    const BELT = window.BELTDATA.get(() => { if (Y.viewNow === 'Y') Y.draw(); });
    if (!BELT || BELT.err) {
      if (BELT && BELT.err) window.BELTDATA.data = null;
      m.innerHTML = '<div class="note">Loading every market listing in the belt…</div>';
      return;
    }

    const q = (document.querySelector('#q') || { value: '' }).value.trim().toLowerCase();
    const cl = (document.querySelector('#cls') || { value: '' }).value;
    const mk = BELT.markets || {};
    const fee = id => { const x = mk[id] && mk[id].ex; return x ? (x.takerFee || 0) / 10000 : 0; };
    const aN = (mid, aid) => (mk[mid] && mk[mid].ast) || ('Asteroid #' + aid);
    const mN = id => (mk[id] && mk[id].name) || ('Marketplace #' + id);
    const unitMass = p => (Y.PR[p] && Y.PR[p][2]) || 1000;
    const tonnes = (p, amt) => amt * unitMass(p) / 1e6;
    const price = (p, raw) => Y.isAt(p) ? num(raw / 1e6) + ' <span class="a">each</span>' : num(raw / 1e6 * 1000 / unitMass(p)) + ' <span class="a">/kg</span>';

    // Order row = [product, type 1 buy / 2 sell, amount, price raw, marketplace id, asteroid id, crew id, makerFee]
    const orders = (BELT.orders || []).filter(o => o[2] > 0 && o[3] > 0);
    const sell = orders.filter(o => o[1] === 2), buy = orders.filter(o => o[1] === 1);

    // Every sell listing that can be sold on into a dearer buy offer elsewhere
    const byProduct = {};
    buy.forEach(b => sell.forEach(s => {
      if (s[0] !== b[0] || s[4] === b[4]) return;
      const cost = s[3] * (1 + fee(s[4])), get = b[3] * (1 - fee(b[4]));
      if (get <= cost) return;
      const amt = Math.min(s[2], b[2]), p = String(b[0]);
      (byProduct[p] = byProduct[p] || []).push({ p, amt, profit: (get - cost) * amt / 1e6, s, b, fa: s[5], ta: b[5], from: aN(s[4], s[5]), to: aN(b[4], b[5]) });
    }));

    const list = Object.keys(byProduct).map(p => {
      const deals = byProduct[p].sort((x, y) => y.profit - x.profit);
      return { p, best: deals[0], deals };
    })
      .filter(x => (!cl || pc(x.p) === cl) &&
        (!q || pn(x.p).toLowerCase().includes(q) || x.deals.some(d => d.from.toLowerCase().includes(q) || d.to.toLowerCase().includes(q))))
      .sort((x, y) => y.best.profit - x.best.profit);

    let h = '<div class="note" style="padding:0 0 10px">Products you can buy on one market and sell straight into a "wanted" offer on another, ' +
      'for more than you paid (after both market fees). ' + list.length + ' products · market data updated ' +
      esc(new Date(BELT.fetched * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })) + '</div>';
    if (!list.length) { m.innerHTML = h + '<div class="note">No profitable trades right now.</div>'; return; }

    const cells = d => {
      const t = tonnes(d.p, d.amt), trips = Math.max(1, Math.ceil(t / 2000));
      return '<td>' + esc(d.from) + '<br><span class="a">' + esc(mN(d.s[4])) + '</span></td><td class="num">' + price(d.p, d.s[3]) + '</td>' +
        '<td>' + esc(d.to) + '<br><span class="a">' + esc(mN(d.b[4])) + '</span></td><td class="num">' + price(d.p, d.b[3]) + '</td>' +
        '<td class="num">' + Y.fq(d.p, d.amt) + (Y.isAt(d.p) ? '' : '<br><span class="a">' + trips + ' LT trip' + (trips > 1 ? 's' : '') + '</span>') + '</td>' +
        '<td class="num tot">' + swayShort(d.profit) + ' <span class="a">SWAY</span></td>' +
        '<td class="num" data-fa="' + d.fa + '" data-ta="' + d.ta + '" data-kg="' + Math.round(Math.min(t, 2000) * 1000) + '">' +
        (d.fa === d.ta ? '<span class="a">same asteroid</span>' : '<span class="a">…</span>') + '</td>';
    };

    h += '<div class="wrap"><table id="trdT"><thead><tr><th>Product</th><th>Buy at</th><th class="num">Price</th><th>Sell at</th>' +
      '<th class="num">Price</th><th class="num">Amount</th><th class="num">Profit</th><th class="num">Flight</th></tr></thead><tbody>';
    list.forEach(x => {
      const open = openP === x.p;
      h += '<tr class="prow' + (open ? ' open' : '') + '" data-p="' + x.p + '"><td>' + Y.ricon(x.p, 24) + esc(pn(x.p)) +
        (x.deals.length > 1 ? ' <span class="a">(' + x.deals.length + ' deals)</span>' : '') + '</td>' + cells(x.best) + '</tr>';
      if (open) h += '<tr class="det"><td colspan="8"><table style="width:auto"><thead><tr><th>Buy at</th><th class="num">Price</th><th>Sell at</th>' +
        '<th class="num">Price</th><th class="num">Amount</th><th class="num">Profit</th><th class="num">Flight</th></tr></thead><tbody>' +
        x.deals.slice(1, 21).map(d => '<tr>' + cells(d) + '</tr>').join('') + '</tbody></table></td></tr>';
    });

    m.innerHTML = h + '</tbody></table></div><div class="note" style="padding:10px 0 0">Profit = (their wanted price − the listing price) × amount, ' +
      'after both buyer fees. Flight = quickest trip for a standard Light Transport with a full tank, carrying the load (up to 2,000 t), ' +
      'leaving now – no crew bonus. Click a product for more deals.</div>';

    m.querySelectorAll('tr.prow').forEach(tr => tr.addEventListener('click', () => { openP = openP === tr.dataset.p ? null : tr.dataset.p; Y.draw(); }));
    flightTimes(m, Y);
  }

  // Fill the Flight cells one at a time (orbits from orbits.php, maths from vendor/travel.js)
  function flightTimes(m, Y) {
    const tds = [...m.querySelectorAll('td[data-fa]')].filter(td => td.dataset.fa !== td.dataset.ta);
    if (!tds.length) return;
    const ids = [...new Set(tds.flatMap(td => [td.dataset.fa, td.dataset.ta]))];
    const me = ++run;

    Promise.all([fetch('orbits.php?ids=' + ids.join(',')).then(r => r.json()), import('../vendor/travel.js?v=' + Y.VER)])
      .then(async ([j, T]) => {
        const O = j.orbits || {}, ship = T.SHIPS[2], propKg = ship[2] / 1000;
        const now = (Date.now() / 1000 - 1609459200) / 3600;
        for (const td of tds) {
          if (me !== run || !td.isConnected) return;
          const a = O[td.dataset.fa], b = O[td.dataset.ta];
          if (!a || !b) { td.innerHTML = '<span class="a">?</span>'; continue; }
          const kg = +td.dataset.kg, k = td.dataset.fa + '>' + td.dataset.ta + '>' + Math.round(kg / 1e5) + '>' + Math.floor(now);
          if (!(k in memo)) {
            const f = await T.fastest(a.o, b.o, now, T.maxDeltaV(2, 1, 1, kg, propKg));
            memo[k] = f ? f.tof : 0;
            await new Promise(r => setTimeout(r, 0));
          }
          const hrs = memo[k];
          td.innerHTML = hrs ? '<b>' + hrs + ' h</b>' + (hrs >= 48 ? '<br><span class="a">' + (hrs / 24).toFixed(1) + ' d</span>' : '') : '<span class="a">out of range</span>';
        }
      })
      .catch(() => { tds.forEach(td => { td.innerHTML = '<span class="a">?</span>'; }); });
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.Y = drawTrade;
})();
