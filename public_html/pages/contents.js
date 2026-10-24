/* Buildings › Contents – Your Influence Command
   One file per page (started 2026-10-18). A card per storage building showing
   what's inside, with a "how full" bar for warehouses and tank farms.
   Shared data and helpers come from window.YIC (set up in app.js). */
(function () {
  'use strict';

  function drawContents(m) {
    const Y = window.YIC, esc = Y.esc, pn = Y.pn, pc = Y.pc, fmt = Y.pfmt, ricon = Y.ricon, bthumb = Y.bthumb, fmtT = Y.fmtT;
    const q = (document.querySelector('#q') || { value: '' }).value.trim().toLowerCase();
    const ai = document.querySelector('#ast').value;
    const typeFilter = (document.querySelector('#cls') || { value: '' }).value;

    let h = '';
    Y.asts.forEach((a, i) => {
      if (ai !== '' && +ai !== i) return;

      const cards = a.buildings.map(b => {
        // Products to show: match the type filter, and the search (building name or product name)
        const nameHit = !q || b.name.toLowerCase().includes(q);
        const shown = Object.keys(b.items)
          .filter(p => !typeFilter || pc(p) === typeFilter)
          .filter(p => nameHit || pn(p).toLowerCase().includes(q))
          .sort((x, y) => pn(x).localeCompare(pn(y)));
        if (!shown.length) return '';

        return '<div class="card"><div style="display:flex;align-items:center;margin-bottom:4px">' + bthumb(b.type, 64, 48) +
          '<h3 style="margin:0">' + esc(b.name) + (window.GL ? window.GL('/building/' + b.id, 'Open this building in the game') : '') + '</h3></div>' +
          '<div class="t">' + esc(b.type) + (b.crew ? ' · ' + esc(b.crew) : '') + '</div>' +
          fullBar(b.fill, fmtT) +
          '<table>' + shown.map(p => '<tr><td>' + ricon(p, 22) + esc(pn(p)) + '</td><td class="num">' + fmt(p, b.items[p]) + '</td></tr>').join('') +
          '</table></div>';
      }).join('');

      if (cards) h += '<h2>' + esc(a.name) + '</h2><div class="grid">' + cards + '</div>';
    });

    m.innerHTML = h || '<div class="note">Nothing matches.</div>';
  }

  // "How full" bar: amber from 75 %, red from 90 %
  function fullBar(fill, fmtT) {
    if (!fill) return '';
    const f = fill.f, col = f >= 0.9 ? '#d03b3b' : f >= 0.75 ? '#fab219' : '#5fc3e4';
    return '<div style="margin:6px 0 8px"><div style="height:8px;background:#232b38;border-radius:2px;overflow:hidden">' +
      '<div style="height:100%;width:' + Math.min(100, Math.round(f * 100)) + '%;background:' + col + '"></div></div>' +
      '<div class="t" style="margin-top:3px">' + Math.round(f * 100) + '% full · ' + fmtT(fill.m / 1e6) + ' of ' + fmtT(fill.cap / 1e6) +
      ' · ' + Math.round(fill.vo / 1e6).toLocaleString() + ' of ' + Math.round(fill.vc / 1e6).toLocaleString() + ' m³</div></div>';
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.B = drawContents;
})();
