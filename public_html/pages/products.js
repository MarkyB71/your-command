/* Products page – Your Influence Command
   One file per page (started 2026-10-18). A table of every product you hold,
   one column per asteroid; click a row to see which buildings hold it,
   click a heading to sort. Shared data and helpers come from window.YIC. */
(function () {
  'use strict';

  // Game links on building rows (live)
  const PGL = true;

  function drawProducts(m) {
    const Y = window.YIC, esc = Y.esc, pn = Y.pn, pc = Y.pc, fmt = Y.pfmt, ricon = Y.ricon, asts = Y.asts;
    const open = Y.prodOpen;                 // products whose row is opened
    const { r, cols } = Y.rows();            // rows already filtered + sorted
    if (!r.length) { m.innerHTML = '<div class="note">Nothing matches.</div>'; return; }

    const multi = cols.length > 1;
    let h = '<div class="wrap"><table><thead><tr><th data-k="name">Product</th><th data-k="cls">Type</th>' +
      (multi ? cols.map((i, j) => '<th class="num" data-k="' + j + '">' + esc(asts[i].name) + '</th>').join('') : '') +
      '<th class="num tot" data-k="total">' + (multi ? 'Total' : esc(asts[cols[0]].name)) + '</th></tr></thead><tbody>';

    r.forEach(x => {
      const isOpen = open.has(x.p);
      h += '<tr class="prow' + (isOpen ? ' open' : '') + '" data-p="' + x.p + '">' +
        '<td>' + ricon(x.p, 26) + esc(pn(x.p)) + '</td><td class="cls">' + esc(pc(x.p)) + '</td>' +
        (multi ? x.v.map(v => '<td class="num' + (v ? '' : ' empty') + '">' + (v ? fmt(x.p, v) : '–') + '</td>').join('') : '') +
        '<td class="num tot">' + fmt(x.p, x.total) + '</td></tr>';

      // Opened row: which buildings hold it
      if (isOpen) {
        let d = '';
        cols.forEach(i => asts[i].buildings.forEach(b => {
          if (b.items[x.p]) d += '<div class="b"><span>' + esc(b.name) + (PGL && window.GL && b.id ? window.GL('/building/' + b.id, 'Open this building in the game') : '') + ' <span class="a">· ' + esc(asts[i].name) +
            '</span></span><span>' + fmt(x.p, b.items[x.p]) + '</span></div>';
        }));
        h += '<tr class="det"><td colspan="' + (3 + (multi ? cols.length : 0)) + '">' + d + '</td></tr>';
      }
    });
    m.innerHTML = h + '</tbody></table></div>';

    // Click a row to open / close it
    m.querySelectorAll('tr.prow').forEach(tr => tr.addEventListener('click', () => {
      const p = tr.dataset.p;
      open.has(p) ? open.delete(p) : open.add(p);
      Y.draw();
    }));

    // Click a heading to sort (again to reverse)
    m.querySelectorAll('th').forEach(th => th.addEventListener('click', () => {
      const k = th.dataset.k, key = isNaN(k) ? k : +k;
      if (Y.sortKey === key) Y.sortDir = -Y.sortDir;
      else { Y.sortKey = key; Y.sortDir = (key === 'name' || key === 'cls') ? 1 : -1; }
      Y.draw();
    }));
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.P = drawProducts;
})();
