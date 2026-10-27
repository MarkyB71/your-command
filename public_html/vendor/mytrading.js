/* My trading – Your Influence Command (Mark, 27 Oct 2026) – LIVE for everyone 27 Oct 2026 (tested on ?beta=1 first)
   The spare console on the Trade Deck. Three tabs in one page:
     Orders     – your open buy/sell listings, and whether someone is cheaper / bidding higher
     Watch      – products you pin (plus anything you have an order for), best prices on the belt
     Calculator – what an amount would fetch selling into the wanted offers right now,
                  or cost buying from the cheapest listings (walks the order book, fees included)
   Uses window.BELTDATA (pages/market.js) and window.YIC (app.js). Classic script. */
(function () {
  'use strict';

  const CSS = `.mt-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px}
.mt-tabs button{font-size:14px;padding:7px 16px;border-radius:8px;border:1px solid #2a3648;background:#121a26;color:#c4cdd9;cursor:pointer}
.mt-tabs button.on{background:#3a2f0c;border-color:#ffd24a;color:#ffd24a;font-weight:600}
.mt-note{color:#8b9ab0;font-size:13px;margin:0 0 10px}
.mt-p{display:flex;align-items:center;gap:8px;cursor:pointer;color:#e6ebf2}
.mt-p:hover{color:#ffd24a}
.mt-ok{color:#3fd68a}.mt-bad{color:#ff8a6b}.mt-dim{color:#8b9ab0;font-size:12px}
.mt-star{all:unset;cursor:pointer;font-size:18px;color:#5d6b7e;padding:0 4px}.mt-star.on{color:#ffd24a}
.mt-star:focus-visible{outline:2px solid #ffd24a;border-radius:4px}
.mt-add{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 12px}
.mt-add select,.mt-calc select,.mt-calc input{font-size:15px;padding:6px 10px}
.mt-calc{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 14px}
.mt-res{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.mt-card{background:#121a26;border:1px solid #2a3648;border-radius:10px;padding:12px 16px}
.mt-card h3{margin:0 0 6px;font-size:15px;color:#ffd24a;font-weight:600}
.mt-card .big{font-size:24px;font-weight:700;color:#e6ebf2;margin:2px 0}
.mt-card table{font-size:13px;margin-top:8px}`;

  const S = { tab: 'orders', calcP: '', calcAmt: '', lastD: null };
  const KEY = 'yic-watch';
  const loadW = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]').map(String); } catch (e) { return []; } };
  const saveW = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} };
  let WATCH = loadW();

  const num = (v) => (+v.toFixed(v < 1 ? 4 : v < 100 ? 2 : 0)).toLocaleString();
  const sway = (v) => (v >= 100 ? Math.round(v).toLocaleString() : (+v.toFixed(v < 1 ? 4 : 2)).toLocaleString()) + ' SWAY';

  function page(m) {
    if (!document.getElementById('mt-css')) {
      const st = document.createElement('style');
      st.id = 'mt-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    const Y = window.YIC, D = Y.D || {}, esc = Y.esc, pn = Y.pn;
    S.lastD = D;
    const BELT = window.BELTDATA && window.BELTDATA.get(() => { if (isOn()) page(m); });
    const tabs = '<div class="mt-tabs">' + [['orders', 'Orders'], ['watch', 'Watch'], ['calc', 'Calculator']]
      .map(([k, t]) => '<button type="button" data-mt="' + k + '"' + (S.tab === k ? ' class="on"' : '') + '>' + t + '</button>').join('') + '</div>';
    if (!BELT || BELT.err) {
      if (BELT && BELT.err) window.BELTDATA.data = null;
      m.innerHTML = tabs + '<div class="note">Loading every market listing in the belt…</div>';
      wire(m);
      return;
    }

    const mk = BELT.markets || {}, mine = new Set(Object.keys(D.crewN || {}).map(Number));
    const unitMass = (p) => (Y.PR[p] && Y.PR[p][2]) || 1000;
    const fee = (id) => { const x = mk[id] && mk[id].ex; return x ? (x.takerFee || 0) / 10000 : 0; };
    const aN = (mid, aid) => (mk[mid] && mk[mid].ast) || ('Asteroid #' + aid);
    // price shown the game's way: per kg for bulk, each for items
    const price = (p, raw) => Y.isAt(p) ? num(raw / 1e6) + ' <span class="a">each</span>' : num(raw / 1e6 * 1000 / unitMass(p)) + ' <span class="a">/kg</span>';
    // Belt order row = [product, type 1 buy / 2 sell, amount, price raw, marketplace, asteroid, crew, makerFee]
    const ords = (BELT.orders || []).filter((o) => o[2] > 0 && o[3] > 0);
    const book = {};
    ords.forEach((o) => {
      const b = (book[o[0]] = book[o[0]] || { sell: [], buy: [] });
      (o[1] === 2 ? b.sell : b.buy).push(o);
    });
    Object.values(book).forEach((b) => { b.sell.sort((x, y) => x[3] - y[3]); b.buy.sort((x, y) => y[3] - x[3]); });
    const bestSell = (p, notMine) => ((book[p] || {}).sell || []).find((o) => !notMine || !mine.has(o[6]));
    const bestBuy = (p, notMine) => ((book[p] || {}).buy || []).find((o) => !notMine || !mine.has(o[6]));
    const pcell = (p) => '<span class="mt-p" data-calc="' + p + '" title="Open in the calculator">' + Y.ricon(p, 24) + esc(pn(p)) + '</span>';
    const star = (p) => '<button type="button" class="mt-star' + (WATCH.includes(String(p)) ? ' on' : '') + '" data-star="' + p + '" title="' +
      (WATCH.includes(String(p)) ? 'Stop watching' : 'Watch this product') + '">' + (WATCH.includes(String(p)) ? '★' : '☆') + '</button>';

    const my = (D.orders || []).map((o) => ({
      p: String(o.product), sell: o.orderType === 2, amt: o.amount || 0, raw: o.price || 0,
      mid: o.entity && o.entity.id, loc: ((o.locations || []).find((x) => x.label === 3) || {}).id,
    }));

    let h = tabs;
    if (S.tab === 'orders') {
      if (D.ordErr) h += '<div class="note">Could not load your orders just now – try ⟳ Refresh in a minute.</div>';
      else if (!my.length) h += '<div class="note">Your crews have no open buy or sell orders.</div>';
      else {
        h += '<div class="mt-note">' + my.length + ' open order' + (my.length > 1 ? 's' : '') + '. "Best elsewhere" is the best price from other players on the whole belt. Click a product for the calculator.</div>';
        h += '<div class="wrap"><table><thead><tr><th></th><th>Product</th><th>Type</th><th class="num">Amount left</th><th class="num">Your price</th><th class="num">Best elsewhere</th><th>How you stand</th><th>Where</th></tr></thead><tbody>' +
          my.sort((a, b) => pn(a.p).localeCompare(pn(b.p))).map((x) => {
            const o = x.sell ? bestSell(x.p, true) : bestBuy(x.p, true);
            let st = '<span class="mt-dim">nobody else</span>';
            if (o) {
              const good = x.sell ? x.raw <= o[3] : x.raw >= o[3];
              st = x.sell ? (good ? '<span class="mt-ok">✓ Cheapest</span>' : '<span class="mt-bad">Undercut</span>')
                : (good ? '<span class="mt-ok">✓ Top bid</span>' : '<span class="mt-bad">Outbid</span>');
            }
            return '<tr><td>' + star(x.p) + '</td><td>' + pcell(x.p) + '</td><td style="color:' + (x.sell ? '#4cd04c' : '#fab219') + '">' + (x.sell ? 'Selling' : 'Buying') + '</td>' +
              '<td class="num">' + Y.fq(x.p, x.amt) + '</td><td class="num">' + price(x.p, x.raw) + '</td>' +
              '<td class="num">' + (o ? price(x.p, o[3]) + '<br><span class="a">' + esc(aN(o[4], o[5])) + '</span>' : '–') + '</td><td>' + st + '</td>' +
              '<td class="cls">' + esc(x.mid ? aN(x.mid, x.loc) : '') + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      }
    } else if (S.tab === 'watch') {
      const auto = my.map((x) => x.p).filter((p) => !WATCH.includes(p));
      const list = [...new Set(WATCH.concat(auto))].sort((a, b) => pn(a).localeCompare(pn(b)));
      const opts = Object.keys(book).filter((p) => !list.includes(p)).sort((a, b) => pn(a).localeCompare(pn(b)));
      h += '<div class="mt-add"><select id="mt-addp"><option value="">Add a product to watch…</option>' +
        opts.map((p) => '<option value="' + p + '">' + esc(pn(p)) + '</option>').join('') + '</select></div>';
      if (!list.length) h += '<div class="note">Nothing watched yet. Pick a product above, or tap ☆ on the Orders tab.</div>';
      else {
        h += '<div class="mt-note">Best prices on the whole belt right now. Products you have orders for are shown automatically (☆ = not pinned).</div>';
        h += '<div class="wrap"><table><thead><tr><th></th><th>Product</th><th class="num">Cheapest for sale</th><th class="num">Best wanted offer</th><th class="num">Listings</th></tr></thead><tbody>' +
          list.map((p) => {
            const s = bestSell(p), b = bestBuy(p), n = ((book[p] || {}).sell || []).length + ((book[p] || {}).buy || []).length;
            return '<tr><td>' + star(p) + '</td><td>' + pcell(p) + '</td>' +
              '<td class="num">' + (s ? price(p, s[3]) + '<br><span class="a">' + esc(aN(s[4], s[5])) + '</span>' : '<span class="mt-dim">none for sale</span>') + '</td>' +
              '<td class="num" style="color:#3fd68a">' + (b ? price(p, b[3]) + '<br><span class="a">' + esc(aN(b[4], b[5])) + '</span>' : '<span class="mt-dim">no offers</span>') + '</td>' +
              '<td class="num">' + n + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      }
    } else {
      const prods = Object.keys(book).sort((a, b) => pn(a).localeCompare(pn(b)));
      if (!S.calcP || !book[S.calcP]) S.calcP = (my[0] && book[my[0].p] && my[0].p) || WATCH.find((p) => book[p]) || prods[0] || '';
      const p = S.calcP, bulk = p && !Y.isAt(p), unit = bulk ? 'tonnes' : 'items';
      h += '<div class="mt-calc"><select id="mt-cp">' + prods.map((x) => '<option value="' + x + '"' + (x === p ? ' selected' : '') + '>' + esc(pn(x)) + '</option>').join('') + '</select>' +
        '<input id="mt-ca" type="number" min="0" step="any" inputmode="decimal" placeholder="Amount" value="' + esc(S.calcAmt) + '" style="width:140px"> <span class="a">' + unit + '</span></div>';
      S.out = () => {
      let h = '';
      const amt = parseFloat(S.calcAmt);
      if (!p) h += '<div class="note">No listings on the belt right now.</div>';
      else if (!(amt > 0)) h += '<div class="note">Enter an amount to see what it would sell for, or cost to buy, right now.</div>';
      else {
        const units = bulk ? amt * 1e6 / unitMass(p) : amt;
        // walk the book: fill from the best offer down, fees included
        const walk = (list, sell) => {
          let left = units, tot = 0, got = 0;
          const used = [];
          for (const o of list.filter((x) => !mine.has(x[6]))) { // not your own orders
            if (left <= 0) break;
            const take = Math.min(left, o[2]), f = fee(o[4]), each = o[3] / 1e6 * (sell ? 1 - f : 1 + f);
            tot += take * each; got += take; left -= take;
            used.push({ o, take });
          }
          return { tot, got, short: left > 1e-6 ? left : 0, used };
        };
        const card = (title, r, sell) => {
          if (!r.got) return '<div class="mt-card"><h3>' + title + '</h3><div class="mt-dim">' + (sell ? 'Nobody is buying this right now.' : 'Nobody is selling this right now.') + '</div></div>';
          return '<div class="mt-card"><h3>' + title + '</h3><div class="big">' + sway(r.tot) + '</div>' +
            '<div class="mt-dim">' + Y.fq(p, r.got) + ' at an average of ' + price(p, r.tot / r.got * 1e6) + ', after market fees</div>' +
            (r.short ? '<div class="mt-bad" style="margin-top:6px">Only ' + Y.fq(p, r.got) + ' ' + (sell ? 'wanted' : 'for sale') + ' on the belt – ' + Y.fq(p, r.short) + ' short.</div>' : '') +
            '<table><tbody>' + r.used.slice(0, 6).map((u) => '<tr><td>' + esc(aN(u.o[4], u.o[5])) + '</td><td class="num">' + Y.fq(p, u.take) + '</td><td class="num">' + price(p, u.o[3]) + '</td></tr>').join('') +
            (r.used.length > 6 ? '<tr><td colspan="3" class="mt-dim">…and ' + (r.used.length - 6) + ' more</td></tr>' : '') + '</tbody></table></div>';
        };
        h += '<div class="mt-res">' + card('Sell it now', walk(book[p].buy, true), true) + card('Buy it now', walk(book[p].sell, false), false) + '</div>';
        h += '<div class="mt-note" style="margin-top:10px">Fills the best offers on the whole belt first, then the next best. Flight costs are not included.</div>';
      }
      return h;
      };
      h += '<div id="mt-out">' + S.out() + '</div>';
    }
    m.innerHTML = h;
    wire(m);
  }

  function wire(m) {
    m.querySelectorAll('[data-mt]').forEach((b) => b.addEventListener('click', () => { S.tab = b.dataset.mt; page(m); }));
    m.querySelectorAll('[data-star]').forEach((b) => b.addEventListener('click', () => {
      const p = b.dataset.star, i = WATCH.indexOf(p);
      if (i >= 0) WATCH.splice(i, 1); else WATCH.push(p);
      saveW(WATCH); page(m);
    }));
    m.querySelectorAll('[data-calc]').forEach((b) => b.addEventListener('click', () => { S.calcP = b.dataset.calc; S.tab = 'calc'; page(m); }));
    const a = m.querySelector('#mt-addp');
    if (a) a.addEventListener('change', () => { if (a.value && !WATCH.includes(a.value)) { WATCH.push(a.value); saveW(WATCH); } page(m); });
    const cp = m.querySelector('#mt-cp');
    if (cp) cp.addEventListener('change', () => { S.calcP = cp.value; S.calcAmt = ''; page(m); });
    const ca = m.querySelector('#mt-ca');
    if (ca) {
      let t = null;
      ca.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => { S.calcAmt = ca.value; const o = m.querySelector('#mt-out'); if (o && S.out) o.innerHTML = S.out(); }, 250);
      });
    }
  }

  const isOn = () => { const b = document.getElementById('vW'); return !!(b && b.className === 'on'); };

  // Adds "My trading" to the Trading menu, after Market history (same way as markethist.js)
  const hook = () => {
    const after = document.getElementById('vM') || document.getElementById('vY'), main = document.getElementById('main');
    if (!after || !main || document.getElementById('vW')) {
      // after ⟳ Refresh the orders change – redraw if this page is showing
      try { if (isOn() && window.YIC.D !== S.lastD) page(main); } catch (e) {}
      return;
    }
    const b = document.createElement('button');
    b.id = 'vW';
    b.textContent = 'My trading';
    after.after(b);
    b.addEventListener('click', () => {
      document.querySelectorAll('button.on').forEach((x) => x.classList.remove('on'));
      try { window.YIC.view = 'M'; } catch (e) {} // 'M' = an add-on page is showing (app.js leaves #main alone)
      b.className = 'on';
      page(main);
    });
  };
  document.addEventListener('click', (e) => {
    const b = document.getElementById('vW'), t = e.target.closest && e.target.closest('button[id^="v"]');
    if (b && t && t !== b) b.className = '';
  }, true);
  setInterval(hook, 700);
})();
