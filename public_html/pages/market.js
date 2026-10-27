/* Trading › Market – Your Influence Command
   One file per page (started 2026-10-18). Two tabs:
   - My listings: your crews' open buy / sell orders
   - Whole belt: every open listing in the game, grouped by product
   The belt data (market.php) is also used by Trade finder, so its loader
   lives here as window.BELTDATA. Shared helpers come from window.YIC. */
(function () {
  'use strict';

  // ---- Shared belt-wide market data (also used by pages/trade.js) ----
  const BELTDATA = window.BELTDATA = {
    data: null, loading: null,
    // Returns the data, or null while loading (calls onDone when it arrives)
    get(onDone) {
      if (this.data && !this.data.err) return this.data;
      if (!this.loading) {
        this.loading = fetch('market.php', { cache: 'no-store' })
          .then(r => r.json())
          .then(j => { if (j.error) throw new Error(j.error); this.data = j; })
          .catch(e => { this.data = { err: (e && e.message) || 'error' }; })
          .finally(() => { this.loading = null; onDone(); });
      }
      return null;
    }
  };

  // ---- Page state ----
  const S = { tab: 'mine', type: 2, open: null, sort: 'name', dir: 1 };   // type 2 = for sale, 1 = wanted
  // Trade Deck board (beta): open one product on Whole belt › For sale
  window.YICmarketOpen = p => { S.tab = 'belt'; S.type = 2; S.open = String(p); };

  const num = v => (+v.toFixed(v < 1 ? 4 : v < 100 ? 2 : 0)).toLocaleString();
  const sway = v => (v >= 100 ? Math.round(v).toLocaleString() : (+v.toFixed(v < 1 ? 4 : 2)).toLocaleString()) + ' SWAY';
  const unitMass = (Y, p) => (Y.PR[p] && Y.PR[p][2]) || 1000;   // grams per unit

  function tabs() {
    return '<div class="bar" style="margin:0 0 12px"><span class="seg">' +
      '<button data-mt="mine"' + (S.tab === 'mine' ? ' class="on"' : '') + '>My listings</button>' +
      '<button data-mt="belt"' + (S.tab === 'belt' ? ' class="on"' : '') + '>Whole belt</button></span>' +
      (S.tab === 'belt' ? '<span class="seg"><button data-mty="2"' + (S.type === 2 ? ' class="on"' : '') + '>For sale</button>' +
        '<button data-mty="1"' + (S.type === 1 ? ' class="on"' : '') + '>Wanted</button></span>' : '') + '</div>';
  }

  function wireTabs(m, Y) {
    m.querySelectorAll('[data-mt]').forEach(b => b.addEventListener('click', () => { S.tab = b.dataset.mt; S.open = null; Y.draw(); }));
    m.querySelectorAll('[data-mty]').forEach(b => b.addEventListener('click', () => { S.type = +b.dataset.mty; S.open = null; Y.draw(); }));
  }

  function drawMarket(m) {
    const Y = window.YIC;
    if (S.tab === 'belt') drawBelt(m, Y); else drawMine(m, Y);
    wireTabs(m, Y);
  }

  // ---- My listings ----
  function drawMine(m, Y) {
    const D = Y.D, esc = Y.esc, pn = Y.pn, fq = Y.fq, BT = Y.BT;
    const ai = document.querySelector('#ast').value;
    const an = ai === '' ? null : Y.asts[+ai].name;
    const q = (document.querySelector('#q') || { value: '' }).value.trim().toLowerCase();
    const now = Date.now() / 1000;

    const bById = {}; (D.allB || []).forEach(b => { bById[b.id] = b; });
    const astN = {};
    (D.owned || []).forEach(a => { astN[a.id] = (a.Name && a.Name.name) || ('Asteroid #' + a.id); });
    (D.allB || []).forEach(b => {
      const l = ((b.Location && b.Location.locations) || []).find(x => x.label === 3);
      if (l && b.meta && b.meta.asteroid && b.meta.asteroid.name) astN[l.id] = b.meta.asteroid.name;
    });
    const bName = id => { const b = bById[id]; return b ? ((b.Name && b.Name.name) || ((BT[b.Building && b.Building.buildingType] || 'Building') + ' #' + id)) : ('#' + id); };

    const list = (D.orders || []).map(o => {
      const loc = (o.locations || []).find(x => x.label === 3), pr = (o.price || 0) / 1e6;
      return {
        p: String(o.product), type: o.orderType === 2 ? 'Selling' : 'Buying',
        amt: o.amount || 0, init: o.initialAmount || o.amount || 0, pr, total: (o.amount || 0) * pr,
        mkt: bName(o.entity && o.entity.id), mid: o.entity && o.entity.id, from: o.storage ? bName(o.storage.id) : '',
        ast: loc ? (astN[loc.id] || ('Asteroid #' + loc.id)) : '', crew: (D.crewN || {})[o.crew && o.crew.id] || '',
        live: !o.validTime || o.validTime <= now, vt: o.validTime
      };
    })
      .filter(x => (!an || x.ast === an) && (!q || [pn(x.p), x.type, x.mkt, x.from, x.ast, x.crew].some(v => String(v).toLowerCase().includes(q))))
      .sort((a, b) => a.ast.localeCompare(b.ast) || a.type.localeCompare(b.type) || pn(a.p).localeCompare(pn(b.p)));

    let h = tabs();
    if (D.ordErr) { m.innerHTML = h + '<div class="note">Could not load your market listings just now. Try Refresh in a minute.</div>'; return; }
    if (!list.length) { m.innerHTML = h + '<div class="note">' + ((D.orders || []).length ? 'Nothing matches.' : 'Your crews have no open buy or sell listings.') + '</div>'; return; }

    const sell = list.filter(x => x.type === 'Selling'), tv = sell.reduce((s, x) => s + x.total, 0);
    h += '<div class="note" style="padding:0 0 10px">' + list.length + ' open listing' + (list.length > 1 ? 's' : '') +
      (sell.length ? ' · selling ' + sell.length + ' worth ' + sway(tv) + ' in total' : '') + '</div>';

    const price = x => Y.isAt(x.p)
      ? sway(x.pr) + ' <span class="a">each</span>'
      : (+(x.pr * 1000 / unitMass(Y, x.p)).toFixed(4)).toLocaleString() + ' SWAY <span class="a">per kg</span><br><span class="a">' +
        sway(x.pr * 1e6 / unitMass(Y, x.p)) + ' per t</span>';

    h += '<div class="wrap"><table><thead><tr><th>Product</th><th>Type</th><th class="num">Amount left</th><th class="num">Price</th>' +
      '<th class="num">Total value</th><th>Marketplace</th><th>Asteroid</th><th>From storage</th><th>Crew</th></tr></thead><tbody>' +
      list.map(x => '<tr><td>' + Y.ricon(x.p, 24) + esc(pn(x.p)) + '</td>' +
        '<td class="cls" style="color:' + (x.type === 'Selling' ? '#4cd04c' : '#fab219') + '">' + x.type +
        (x.live ? '' : '<br><span class="a">starts ' + esc(new Date(x.vt * 1000).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) + '</span>') + '</td>' +
        '<td class="num">' + fq(x.p, x.amt) + (x.init > x.amt ? '<br><span class="a">of ' + fq(x.p, x.init) + '</span>' : '') + '</td>' +
        '<td class="num">' + price(x) + '</td><td class="num tot">' + sway(x.total) + '</td>' +
        '<td>' + Y.bthumb('Marketplace', 40, 30) + esc(x.mkt) + (x.mid ? (window.GL ? window.GL('/building/' + x.mid, 'Open this marketplace in the game') : '') : '') + '</td><td class="cls">' + esc(x.ast) + '</td>' +
        '<td class="cls">' + esc(x.from) + '</td><td class="cls">' + esc(x.crew) + '</td></tr>').join('') +
      '</tbody></table></div>';

    h += '<div class="note" style="padding:10px 0 0">Shows open listings placed by your crews. Prices are in SWAY; bulk goods are shown per kg (as in the game) and per tonne. Market fees are not included.</div>';
    m.innerHTML = h;
  }

  // ---- Whole belt ----
  function drawBelt(m, Y) {
    const BELT = BELTDATA.get(() => { if (Y.viewNow === 'K' && S.tab === 'belt') Y.draw(); });
    const esc = Y.esc, pn = Y.pn, pc = Y.pc, fq = Y.fq;
    if (!BELT) { m.innerHTML = tabs() + '<div class="note">Loading every listing in the belt…</div>'; return; }
    if (BELT.err) {
      m.innerHTML = tabs() + '<div class="note">Could not load the belt market (' + esc(BELT.err) + '). Click Whole belt to try again.</div>';
      BELTDATA.data = null;
      return;
    }

    const ai = document.querySelector('#ast').value;
    const an = ai === '' ? null : Y.asts[+ai].name;
    const q = (document.querySelector('#q') || { value: '' }).value.trim().toLowerCase();
    const cl = (document.querySelector('#cls') || { value: '' }).value;
    const mk = BELT.markets || {}, mine = new Set(Object.keys(Y.D.crewN || {}).map(Number));
    const mName = id => (mk[id] && mk[id].name) || ('Marketplace #' + id);
    const aName = (id, a) => (mk[id] && mk[id].ast) || ('Asteroid #' + a);
    const fee = id => { const x = mk[id] && mk[id].ex; return x ? ((S.type === 2 ? x.takerFee : x.makerFee) || 0) / 100 : null; };
    const perKg = (p, raw) => raw / 1e6 * 1000 / unitMass(Y, p);
    const perT = (p, raw) => raw / 1e6 * 1e6 / unitMass(Y, p);
    const each = raw => raw / 1e6;
    const priceH = (p, raw) => Y.isAt(p)
      ? num(each(raw)) + ' SWAY <span class="a">each</span>'
      : num(perKg(p, raw)) + ' SWAY <span class="a">per kg</span><br><span class="a">' + num(perT(p, raw)) + ' per t</span>';

    // Order row = [product, type, amount, price raw, marketplace id, asteroid id, crew id, makerFee]
    const rows = (BELT.orders || []).filter(o => o[1] === S.type && o[2] > 0 && o[3] > 0)
      .map(o => ({ p: String(o[0]), amt: o[2], raw: o[3], mid: o[4], ast: aName(o[4], o[5]), crew: o[6] }))
      .filter(o => (!an || o.ast === an) && (!cl || pc(o.p) === cl) &&
        (!q || pn(o.p).toLowerCase().includes(q) || mName(o.mid).toLowerCase().includes(q) || o.ast.toLowerCase().includes(q)));

    // Group by product
    const g = {};
    rows.forEach(o => { (g[o.p] = g[o.p] || []).push(o); });
    const list = Object.keys(g).map(p => {
      const os = g[p].sort((a, b) => S.type === 2 ? a.raw - b.raw : b.raw - a.raw);
      return { p, os, amt: os.reduce((s, o) => s + o.amt, 0), best: os[0].raw, worst: os[os.length - 1].raw,
        mk: new Set(os.map(o => o.mid)).size, mine: os.some(o => mine.has(o.crew)) };
    });
    const key = { name: x => pn(x.p), amt: x => Y.kg(x.p, x.amt), best: x => Y.isAt(x.p) ? each(x.best) : perKg(x.p, x.best), n: x => x.os.length };
    list.sort((a, b) => { const ka = key[S.sort](a), kb = key[S.sort](b); return (typeof ka === 'string' ? ka.localeCompare(kb) : ka - kb) * S.dir; });

    const all = (BELT.orders || []).filter(o => o[1] === S.type).length;
    const mks = new Set((BELT.orders || []).map(o => o[4])).size, asts = new Set((BELT.orders || []).map(o => o[5])).size;
    let h = tabs() + '<div class="note" style="padding:0 0 10px">' + all.toLocaleString() + ' ' + (S.type === 2 ? 'listings for sale' : 'buy requests') +
      ' in ' + mks + ' marketplaces on ' + asts + ' asteroids · updated ' +
      esc(new Date(BELT.fetched * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })) + ' (refreshes every 5 minutes)' +
      (an ? ' · showing <b>' + esc(an) + '</b> only' : '') + '</div>';
    if (!list.length) { m.innerHTML = h + '<div class="note">Nothing matches.</div>'; return; }

    const th = (k, t, c) => '<th data-ms="' + k + '"' + (c ? ' class="' + c + '"' : '') + '>' + t + (S.sort === k ? (S.dir > 0 ? ' ▴' : ' ▾') : '') + '</th>';
    h += '<div class="wrap"><table><thead><tr>' + th('name', 'Product') + '<th>Type</th>' +
      th('amt', S.type === 2 ? 'Available' : 'Wanted', 'num') + th('best', S.type === 2 ? 'Lowest price' : 'Highest offer', 'num') +
      '<th class="num">' + (S.type === 2 ? 'Highest' : 'Lowest') + '</th>' + th('n', 'Listings', 'num') + '<th class="num">Markets</th></tr></thead><tbody>';

    list.forEach(x => {
      const open = S.open === x.p;
      h += '<tr class="prow' + (open ? ' open' : '') + '" data-p="' + x.p + '"><td>' + Y.ricon(x.p, 24) + esc(pn(x.p)) +
        (x.mine ? ' <span class="a">(incl. yours)</span>' : '') + '</td><td class="cls">' + esc(pc(x.p)) + '</td>' +
        '<td class="num tot">' + fq(x.p, x.amt) + '</td><td class="num">' + priceH(x.p, x.best) + '</td>' +
        '<td class="num cls">' + priceH(x.p, x.worst) + '</td><td class="num">' + x.os.length + '</td><td class="num">' + x.mk + '</td></tr>';
      if (open) h += '<tr class="det"><td colspan="7"><table style="width:auto"><thead><tr><th class="num">Price</th><th class="num">Amount</th>' +
        '<th>Marketplace</th><th>Asteroid</th><th class="num">' + (S.type === 2 ? 'Buyer fee' : 'Seller fee') + '</th></tr></thead><tbody>' +
        x.os.slice(0, 200).map(r => {
          const f = fee(r.mid);
          return '<tr><td class="num">' + priceH(r.p, r.raw) + '</td><td class="num">' + fq(r.p, r.amt) + '</td>' +
            '<td>' + esc(mName(r.mid)) + (window.GL ? window.GL('/building/' + r.mid, 'Open this marketplace in the game') : '') + (mine.has(r.crew) ? ' <span style="color:var(--accent)">· yours</span>' : '') + '</td>' +
            '<td class="cls">' + esc(r.ast) + '</td><td class="num cls">' + (f == null ? '–' : (+f.toFixed(2)) + '%') + '</td></tr>';
        }).join('') +
        (x.os.length > 200 ? '<tr><td colspan="5" class="a">…and ' + (x.os.length - 200) + ' more</td></tr>' : '') + '</tbody></table></td></tr>';
    });

    m.innerHTML = h + '</tbody></table></div><div class="note" style="padding:10px 0 0">Every open listing in the game, from every player. ' +
      'Click a product to see each listing. Prices are as listed; the marketplace fee is shown per listing.</div>';

    m.querySelectorAll('tr.prow').forEach(tr => tr.addEventListener('click', () => { S.open = S.open === tr.dataset.p ? null : tr.dataset.p; Y.draw(); }));
    m.querySelectorAll('th[data-ms]').forEach(t => t.addEventListener('click', () => {
      const k = t.dataset.ms;
      if (S.sort === k) S.dir = -S.dir;
      else { S.sort = k; S.dir = k === 'name' ? 1 : (k === 'best' && S.type === 2 ? 1 : -1); }
      Y.draw();
    }));
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.K = drawMarket;
})();
