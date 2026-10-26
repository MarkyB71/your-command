/* Buildings › Contents – Your Influence Command
   One file per page (started 2026-10-18). A card per storage building showing
   what's inside, with a "how full" bar for warehouses and tank farms.
   Shared data and helpers come from window.YIC (set up in app.js). */
(function () {
  'use strict';

  // Cards or one table – TEST on ?beta=1 (26 Oct 2026). Default cards; the choice is remembered.
  const TV = /[?&]beta=1/.test(location.search);
  const LS = 'yic-contents-view';
  function mode() { if (!TV) return 'cards'; try { return localStorage.getItem(LS) === 'table' ? 'table' : 'cards'; } catch (e) { return 'cards'; } }
  function setMode(v) { try { localStorage.setItem(LS, v); } catch (e) {} }
  const TV_CSS = '<style>.ct-sw{display:inline-flex;gap:0;margin:0 0 12px;border:1px solid #3a4658;border-radius:8px;overflow:hidden}' +
    '.ct-sw button{border:0;border-radius:0;padding:7px 16px;font-size:15px;background:transparent;color:#c8d3e0;cursor:pointer}' +
    '.ct-sw button.on{background:#6ec6e6;color:#06121c;font-weight:700}' +
    '.ct-full{display:inline-block;min-width:44px;font-weight:600}</style>';

  function drawContents(m) {
    const Y = window.YIC, esc = Y.esc, pn = Y.pn, pc = Y.pc, fmt = Y.pfmt, ricon = Y.ricon, bthumb = Y.bthumb, fmtT = Y.fmtT;
    const q = (document.querySelector('#q') || { value: '' }).value.trim().toLowerCase();
    const ai = document.querySelector('#ast').value;
    const typeFilter = (document.querySelector('#cls') || { value: '' }).value;

    const tableView = mode() === 'table';
    let h = '', rows = '';
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

        if (tableView) {
          const f = b.fill ? Math.round(b.fill.f * 100) : null;
          const fc = f === null ? '' : f >= 90 ? '#ff6b6b' : f >= 75 ? '#fab219' : '#6ec6e6';
          shown.forEach(p => {
            rows += '<tr><td>' + esc(a.name) + '</td>' +
              '<td>' + esc(b.name) + (window.GL ? window.GL('/building/' + b.id, 'Open this building in the game') : '') + '</td>' +
              '<td>' + esc(b.type) + '</td>' +
              '<td>' + ricon(p, 22) + esc(pn(p)) + '</td>' +
              '<td class="cls">' + esc(pc(p)) + '</td>' +
              '<td class="num">' + fmt(p, b.items[p]) + '</td>' +
              '<td class="num" data-sort="' + (f === null ? '' : f) + '">' + (f === null ? '–' : '<span class="ct-full" style="color:' + fc + '">' + f + '%</span>') + '</td></tr>';
          });
          return '';
        }

        return '<div class="card"><div style="display:flex;align-items:center;margin-bottom:4px">' + bthumb(b.type, 64, 48) +
          '<h3 style="margin:0">' + esc(b.name) + (window.GL ? window.GL('/building/' + b.id, 'Open this building in the game') : '') + '</h3></div>' +
          '<div class="t">' + esc(b.type) + (b.crew ? ' · ' + esc(b.crew) : '') + '</div>' +
          fullBar(b.fill, fmtT) +
          ('<table>' + shown.map(p => '<tr><td style="white-space:normal;overflow-wrap:anywhere">' + ricon(p, 22) + esc(pn(p)) + '</td><td class="num" style="white-space:nowrap;vertical-align:top">' + fmt(p, b.items[p]) + '</td></tr>').join('')) +
          '</table></div>';
      }).join('');

      if (cards) h += '<h2>' + esc(a.name) + '</h2><div class="grid">' + cards + '</div>';
    });

    const sw = TV ? TV_CSS + '<div class="ct-sw" role="group" aria-label="Show as"><button type="button" data-cv="cards"' + (tableView ? '' : ' class="on"') + '>▦ Cards</button><button type="button" data-cv="table"' + (tableView ? ' class="on"' : '') + '>☰ Table</button></div>' : '';
    if (tableView) {
      h = rows ? '<div class="wrap"><table><thead><tr><th>Asteroid</th><th>Building</th><th>Type</th><th>Product</th><th>Kind</th><th class="num">Amount</th><th class="num">How full</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '';
    }
    m.innerHTML = sw + (h || '<div class="note">Nothing matches.</div>');
    m.querySelectorAll('[data-cv]').forEach(btn => btn.addEventListener('click', () => { setMode(btn.dataset.cv); Y.draw(); }));
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
