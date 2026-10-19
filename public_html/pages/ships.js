/* Ships page – Your Influence Command
   One file per page (started 2026-10-18). This page draws the Ships table.
   It reads shared data and helpers from window.YIC (set up in app.js). */
(function () {
  'use strict';

  // Colour and label for each ship status
  const STATUS = {
    d: { colour: '#3fd68a', label: 'Docked' },
    o: { colour: '#ffab3d', label: 'In orbit' },
    f: { colour: '#5b9dff', label: 'In flight' }
  };
  // Test (?beta=1): place / destination name in its own bright colour
  const BETA = /[?&]beta=1/.test(location.search);
  const FROM = '#b388ff', TO = '#e0b04a';   // from = soft purple, destination = soft gold
  function routeHTML(r, esc) {
    const m = /^on route from (.*) to (.*)$/.exec(r || '');
    if (!m) return '<b>' + esc(r) + '</b>';
    return '<b style="color:' + FROM + '">' + esc(m[1]) + '</b>' +
      ' <span style="color:#8a96a8">→</span> ' +
      '<b style="color:' + TO + ';font-size:1.15em;text-shadow:0 0 8px rgba(224,176,74,.45)">' + esc(m[2]) + '</b>';
  }
  const VARIANTS = { 2: 'Cobalt Pioneer', 3: 'Titanium Pioneer', 4: 'Aureate Pioneer' };

  function drawShips(m) {
    const Y = window.YIC, D = Y.D, esc = Y.esc, fmtT = Y.fmtT, tLeft = Y.tLeft;

    // Filters: asteroid dropdown and search box
    const ai = document.querySelector('#ast').value;
    const astName = ai === '' ? null : Y.asts[+ai].name;
    const q = (document.querySelector('#q') || { value: '' }).value.trim().toLowerCase();
    const okAst = x => !astName || x.ast === astName;
    const okText = (...t) => !q || t.some(v => String(v || '').toLowerCase().includes(q));

    const ships = (D.ships || [])
      .filter(x => okAst(x) && okText(x.name, x.place, x.ast, x.type, '#' + x.id, x.id))
      .sort((a, b) => (a.ast || '~').localeCompare(b.ast || '~') || a.name.localeCompare(b.name));

    let h = '<div class="note" style="padding:0 0 10px">' + ships.length + ' ships' +
      (astName ? ' at or heading to <b>' + esc(astName) + '</b>' : '') + '</div>';

    h += '<div class="wrap"><table><thead><tr><th>Ship</th><th class="num">ID</th><th>Type</th>' +
      '<th>Asteroid</th><th>Where</th><th>Arrives</th><th>Cargo</th><th class="num">Propellant</th>' +
      '</tr></thead><tbody>' + ships.map(x => row(x, esc, fmtT, tLeft)).join('') + '</tbody></table></div>';

    m.innerHTML = h;
  }

  function row(x, esc, fmtT, tLeft) {
    const pic = 'shipimg.php?t=' + x.st + '&v=' + x.sv;
    const st = STATUS[x.sst] || STATUS.d;

    const shipCell = '<td><a href="' + pic + '" target="_blank" title="Open picture" ' +
      'style="display:inline-block;width:72px;height:54px;vertical-align:middle;margin-right:10px;' +
      'border-radius:4px;background:#000 url(' + pic + '&s=1) no-repeat 50% 42%/170% auto"></a>' +
      esc(x.name) + '</td>';

    const typeCell = '<td class="cls">' + esc(x.type) +
      (x.sv > 1 ? '<br><span style="color:var(--accent)">' + esc(VARIANTS[x.sv] || ('Variant ' + x.sv)) + '</span>' : '') +
      '</td>';

    const whereCell = '<td class="cls" style="white-space:normal;color:' + st.colour + '">' +
      '<span class="shst" style="border-color:' + st.colour + ';color:' + st.colour + '">' + st.label + '</span> ' +
      (BETA
        ? (x.fl ? routeHTML(x.route, esc) : esc(x.place))
        : (x.fl ? '<b>' + esc(x.route) + '</b>' : esc(x.place))) + '</td>';

    const arrivesCell = '<td class="cls">' + (x.arrT
      ? esc(new Date(x.arrT * 1000).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) +
        '<br><b data-fin="' + x.arrT + '">' + tLeft(x.arrT, Date.now() / 1000) + '</b>'
      : '<span class="a">–</span>') + '</td>';

    const cargoCell = '<td class="cls" style="white-space:normal">' +
      (x.useM > 0 ? fmtT(x.useM / 1e6) + (x.carry ? ' · ' + esc(x.carry) : '') : 'Empty') + '</td>';

    return '<tr>' + shipCell +
      '<td class="num">' + esc(x.id) + '</td>' + typeCell +
      '<td>' + esc(x.ast || '–') + '</td>' + whereCell + arrivesCell + cargoCell +
      '<td class="num">' + fmtT(x.prop) + '</td></tr>';
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.S = drawShips;
})();
