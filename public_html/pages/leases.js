/* Buildings › Leases – Your Influence Command
   One file per page (started 2026-10-18). Lots you lease on other players'
   asteroids, ended / ending first. The lease maths (YIC.leaseInfo) stays in
   app.js because Today's Workload uses it too. */
(function () {
  'use strict';

  const RANK = { ended: 0, none: 1, soon: 2, ok: 3 };
  const COL = { ended: '#ff7a7a', none: '#ff7a7a', soon: '#fab219', ok: '#4cd04c' };
  const LBL = { ended: 'Ended', none: 'No lease', soon: 'Ends soon', ok: 'OK' };
  const day = t => new Date(t * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const dot = s => '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + COL[s] +
    ';margin-right:7px;vertical-align:middle"></span>' + LBL[s];

  function drawLeases(m) {
    const Y = window.YIC, D = Y.D, esc = Y.esc;
    const ai = document.querySelector('#ast').value;
    const an = ai === '' ? null : Y.asts[+ai].name;
    const q = (document.querySelector('#q') || { value: '' }).value.trim().toLowerCase();
    const now = Date.now() / 1000;

    if (D.leaseErr && !(D.leases || []).length) {
      m.innerHTML = '<div class="note">Could not load your leases just now. Try Refresh in a minute.</div>';
      return;
    }

    const all = Y.leaseInfo();
    const list = all
      .filter(x => (!an || x.a === an) &&
        (!q || [x.a, x.crew, '#' + x.lot, ...x.b.map(b => b.name + ' ' + b.type)].some(v => String(v).toLowerCase().includes(q))))
      .sort((x, y) => RANK[x.st] - RANK[y.st] || (x.end - y.end) || x.lot - y.lot);
    const n = k => list.filter(x => x.st === k).length;

    let h = '<div class="note" style="padding:0 0 10px">' + list.length + ' leased lot' + (list.length === 1 ? '' : 's') +
      (an ? ' on <b>' + esc(an) + '</b>' : '') +
      ' · <b style="color:#ff7a7a">' + (n('ended') + n('none')) + ' ended</b>' +
      ' · <b style="color:#fab219">' + n('soon') + ' ending within 30 days</b>' +
      ' · <b style="color:#4cd04c">' + n('ok') + ' OK</b></div>';

    if (!list.length) {
      m.innerHTML = h + '<div class="note">' + (all.length ? 'Nothing matches.' : 'None of your buildings are on leased lots.') + '</div>';
      return;
    }

    h += '<div class="wrap"><table><thead><tr><th>Status</th><th>Lot</th><th>Asteroid</th><th>On this lot</th>' +
      '<th>Leased by</th><th>Lease ends</th><th>Time left</th></tr></thead><tbody>' +
      list.map(x => '<tr><td>' + dot(x.st) + '</td><td>#' + x.lot.toLocaleString() + '</td><td class="cls">' + esc(x.a) + '</td>' +
        '<td style="white-space:normal">' + (x.b.map(b => Y.bthumb(b.type, 48, 36) + esc(b.name) + (b.planned ? ' <span class="a">(site)</span>' : '')).join('<br>') || '–') + '</td>' +
        '<td class="cls">' + esc(x.crew) + (x.kind && x.kind !== 'Prepaid' ? ' <span class="a">(' + x.kind + ')</span>' : '') + '</td>' +
        '<td class="cls">' + (x.end ? esc(day(x.end)) : '–') + '</td>' +
        '<td>' + timeLeft(x, now, Y.tLeft) + (x.notice ? '<br><span class="a">notice given</span>' : '') + '</td></tr>').join('') +
      '</tbody></table></div>';

    m.innerHTML = h + '<div class="note" style="padding:10px 0 0">If a lease runs out, the asteroid owner can seize the building and everything in it. ' +
      'Extend ended or ending leases in the game. Only lots with your buildings or building sites are shown; lots on asteroids you own need no lease.</div>';
  }

  function timeLeft(x, now, tLeft) {
    if (x.st === 'none') return '<b style="color:#ff7a7a">No lease</b>';
    if (x.left <= 0) return '<b style="color:#ff7a7a">Ended ' + Math.floor(-x.left / 86400) + ' days ago</b>';
    return '<b' + (x.st === 'soon' ? ' style="color:#fab219"' : '') + '>' + tLeft(x.end, now) + '</b>';
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.L = drawLeases;
})();
