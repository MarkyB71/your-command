/* Search results – Your Influence Command
   One file per page (started 2026-10-18). What the search box finds: products in stock, buildings, crews and ships.
   APP = window.YIC: shared data, helpers and page state that still live in app.js
   (Today's Workload and other pages use some of them too). */
(function () {
  'use strict';
  // window.YIC is only set once app.js has loaded your data, so look it up each time
  const APP = new Proxy({}, { get: (_, k) => window.YIC[k], set: (_, k, v) => ((window.YIC[k] = v), true) });

  function drawSearch(m) {
    const gq = APP.$('#gq'),
      q = (gq ? gq.value : '').trim().toLowerCase(),
      an = '';
    if (!q) {
      m.innerHTML = '<div class="note">Type in the search box to search everything.</div>';
      return;
    }
    const has = (s) =>
        String(s || '')
          .toLowerCase()
          .includes(q),
      okA = (a) => !an || a === an,
      cap = 200;
    const prod = [];
    APP.asts.forEach((a) => {
      if (!okA(a.name)) return;
      const per = {};
      a.buildings.forEach((b) =>
        Object.keys(b.items).forEach((p) => {
          if (!has(APP.pn(p))) return;
          const x = (per[p] = per[p] || { amt: 0, bs: [] });
          x.amt += b.items[p];
          x.bs.push(b.name);
        }),
      );
      Object.keys(per).forEach((p) => prod.push({ p, a: a.name, amt: per[p].amt, bs: per[p].bs }));
    });
    prod.sort((x, y) => APP.pn(x.p).localeCompare(APP.pn(y.p)) || x.a.localeCompare(y.a));
    const astOf = (b) => (b.meta && b.meta.asteroid && b.meta.asteroid.name) || '';
    const bl = [];
    (APP.D.allB || []).forEach((b) => {
      const B = b.Building || {};
      if ((B.status || 0) < 1) return;
      const t = APP.BT[B.buildingType] || 'Building',
        n = (b.Name && b.Name.name) || t + ' #' + b.id,
        a = astOf(b);
      if (!okA(a) || !(has(n) || has(t))) return;
      bl.push({
        n,
        t,
        a,
        c: (APP.D.crewN || {})[b.Control && b.Control.controller && b.Control.controller.id] || '',
        s: B.status === 3 ? 'Built' : B.status === 2 ? 'Being built' : 'Planned site',
      });
    });
    bl.sort((x, y) => x.a.localeCompare(y.a) || x.n.localeCompare(y.n));
    const cl = (APP.D.crewList || [])
      .filter((c) => okA(c.ast || '') && has(c.name))
      .sort((x, y) => String(x.name).localeCompare(String(y.name)));
    const sl = (APP.D.ships || [])
      .filter((s) => okA(s.ast || '') && (has(s.name) || has(s.type) || String(s.id) === q))
      .sort((x, y) => x.name.localeCompare(y.name));
    const al = (APP.D.owned || [])
      .map((a) => {
        const c = a.Celestial || {},
          sp = (APP.SPEC[c.celestialType] || ['?'])[0],
          own = (a.Nft && a.Nft.owners && a.Nft.owners.starknet) === APP.D.wallet,
          ctl = (APP.D.crewN || {})[a.Control && a.Control.controller && a.Control.controller.id] || '';
        return {
          id: a.id,
          n: (a.Name && a.Name.name) || 'Asteroid #' + a.id,
          sp,
          own,
          ctl,
          used: a.lotsUsed || 0,
        };
      })
      .filter((x) => has(x.n) || has(x.sp + '-type') || String(x.id) === q)
      .sort((x, y) => x.n.localeCompare(y.n));
    const tot = prod.length + bl.length + cl.length + sl.length + al.length;
    let h =
      '<div class="note" style="padding:0 0 10px">Search results for <b>“' +
      APP.esc(q) +
      '”</b> on ' +
      (an ? '<b>' + APP.esc(an) + '</b>' : 'all asteroids') +
      ' · ' +
      tot +
      ' found. Clear the search box or pick a menu button to go back.</div>';
    if (!tot) {
      m.innerHTML = h + '<div class="note">Nothing matches.</div>';
      return;
    }
    const sec = (t, n, head, rows) =>
      n
        ? '<h2>' +
          t +
          ' <span class="a" style="font-size:14px;font-weight:400">(' +
          n +
          ')</span></h2><div class="wrap"><table><thead><tr>' +
          head.map((x) => '<th' + (x[1] ? ' class="num"' : '') + '>' + x[0] + '</th>').join('') +
          '</tr></thead><tbody>' +
          rows.slice(0, cap).join('') +
          '</tbody></table></div>' +
          (n > cap ? '<div class="note">…and ' + (n - cap) + ' more – narrow the search.</div>' : '')
        : '';
    h += sec(
      'Crews',
      cl.length,
      [['Crew'], ['Asteroid'], ['Where'], ['Crewmates', 1]],
      cl.map(
        (c) =>
          '<tr><td>' +
          APP.esc(c.name) +
          '</td><td class="cls">' +
          APP.esc(c.ast || '–') +
          '</td><td class="cls" style="white-space:normal">' +
          APP.esc(c.place || '') +
          '</td><td class="num">' +
          c.mates +
          '</td></tr>',
      ),
    );
    h += sec(
      'Resources',
      prod.length,
      [['Product'], ['Asteroid'], ['Amount', 1], ['In buildings']],
      prod.map(
        (x) =>
          '<tr><td>' +
          APP.ricon(x.p, 22) +
          APP.esc(APP.pn(x.p)) +
          '</td><td class="cls">' +
          APP.esc(x.a) +
          '</td><td class="num tot">' +
          APP.fq(x.p, x.amt) +
          '</td><td class="cls" style="white-space:normal">' +
          APP.esc(x.bs.join(', ')) +
          '</td></tr>',
      ),
    );
    h += sec(
      'Ships',
      sl.length,
      [['Ship'], ['Type'], ['Asteroid'], ['Where']],
      sl.map(
        (s) =>
          '<tr><td>' +
          APP.esc(s.name) +
          ' <span class="a">#' +
          APP.esc(s.id) +
          '</span></td><td class="cls">' +
          APP.esc(s.type) +
          '</td><td class="cls">' +
          APP.esc(s.ast || '–') +
          '</td><td class="cls" style="white-space:normal">' +
          APP.esc(s.place || '') +
          '</td></tr>',
      ),
    );
    h += sec(
      'Asteroids',
      al.length,
      [['Asteroid'], ['Type'], ['Owner'], ['Lots in use', 1]],
      al.map(
        (x) =>
          '<tr><td>' +
          APP.esc(x.n) +
          ' <span class="a">#' +
          APP.esc(x.id) +
          '</span></td><td class="cls">' +
          APP.esc(x.sp) +
          '-type</td><td class="cls">' +
          (x.own ? 'Owned' : '') +
          (x.ctl ? (x.own ? ' · ' : '') + 'Controlled by ' + APP.esc(x.ctl) : '') +
          '</td><td class="num">' +
          x.used +
          '</td></tr>',
      ),
    );
    h += sec(
      'Buildings',
      bl.length,
      [['Building'], ['Type'], ['Asteroid'], ['Crew'], ['State']],
      bl.map(
        (x) =>
          '<tr><td>' +
          APP.bthumb(x.t, 48, 36) +
          APP.esc(x.n) +
          '</td><td class="cls">' +
          APP.esc(x.t) +
          '</td><td class="cls">' +
          APP.esc(x.a) +
          '</td><td class="cls">' +
          APP.esc(x.c) +
          '</td><td class="cls">' +
          APP.esc(x.s) +
          '</td></tr>',
      ),
    );
    m.innerHTML = h;
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.Z = function (m) {
    drawSearch(m);
  };
})();
