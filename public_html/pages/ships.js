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
  // Live 19 Oct 2026: from (purple) → destination (soft gold, glow)
  const BETA = true;
  const FROM = '#b388ff', TO = '#e0b04a';   // from = soft purple, destination = soft gold
  function routeHTML(r, esc) {
    const m = /^on route from (.*) to (.*)$/.exec(r || '');
    if (!m) return '<b>' + esc(r) + '</b>';
    return '<b style="color:' + FROM + '">' + esc(m[1]) + '</b>' +
      ' <span style="color:#8a96a8">→</span> ' +
      '<b style="color:' + TO + ';font-size:1.15em;text-shadow:0 0 8px rgba(224,176,74,.45)">' + esc(m[2]) + '</b>';
  }
  // Crew on board each ship (tested on ?beta=1, live 23 Oct 2026) each ship
  const CRB = true;   // live 23 Oct 2026
  const CLASS_COL = { 1: '#5b9dff', 2: '#ffab3d', 3: '#3fd68a', 4: '#f5c542', 5: '#b388ff' };
  function crewAboard(D, esc) {
    const by = {}, cms = D.crewmates || {}, CMC = window.YIC.CMC || {};
    (D.crewsRaw || []).forEach(c => {
      const loc = (c.Location && c.Location.location) || {};
      if (loc.label !== 6) return;
      const cl = (D.crewList || []).find(x => x.id === c.id) || {};
      const nm = (c.Name && c.Name.name) || ('Crew #' + c.id);
      const roster = (c.Crew && c.Crew.roster) || [];
      if (!roster.length) return;   // skip empty crews
      const food = cl.food;
      const fc = food == null ? '#5d6878' : food < 0.5 ? '#ff6b6b' : food < 0.65 ? '#ffab3d' : '#3fd68a';
      const faces = roster.map(id => {
        const x = cms[id] || {}, k = x.class, col = CLASS_COL[k] || '#6b7a90';
        const mn = (cl.mn && cl.mn[id]) || ('Crewmate #' + id);
        const first = mn.split(' ')[0];
        return '<div class="cob-m" title="' + esc(mn + (CMC[k] ? ' · ' + CMC[k] : '')) + '">' +
          '<img data-face="' + id + '" src="cimg.php?id=' + id + '&s=1" alt="" loading="lazy" style="border-color:' + col + ';box-shadow:0 0 6px ' + col + '55">' +
          '<span class="cob-n">' + esc(first) + '</span>' +
          (CMC[k] ? '<span class="cob-c" style="color:' + col + '">' + esc(CMC[k]) + '</span>' : '') + '</div>';
      }).join('');
      (by[loc.id] = by[loc.id] || []).push('<div class="cob">' +
        '<div class="cob-h"><span class="cob-t">👥 ' + esc(nm) + '</span>' +
        (food != null ? '<span class="cob-f" title="Food ' + Math.round(food * 100) + '%"><i style="width:' + Math.round(food * 100) + '%;background:' + fc + '"></i></span>' : '') +
        '</div><div class="cob-r">' + faces + '</div></div>');
    });
    return by;
  }
  const COB_CSS = '.cob{background:linear-gradient(180deg,#121a26,#0d131c);border:1px solid #2a3648;border-radius:10px;padding:8px 10px;margin:2px 0 6px;min-width:250px}' +
    '.cob-h{display:flex;align-items:center;gap:10px;margin-bottom:6px}' +
    '.cob-t{font-weight:700;color:#cfe6ff;text-shadow:0 0 6px rgba(91,157,255,.35)}' +
    '.cob-f{flex:1;max-width:70px;height:6px;border-radius:3px;background:#232b38;overflow:hidden}.cob-f i{display:block;height:100%}' +
    '.cob-r{display:flex;flex-wrap:wrap;gap:8px}' +
    '.cob-m{display:flex;flex-direction:column;align-items:center;width:52px;text-align:center;line-height:1.15}' +
    '.cob-m img{width:46px;height:60px;object-fit:cover;object-position:50% 0;border-radius:6px;border:1.5px solid;background:#000;transition:transform .15s}' +
    '.cob-m:hover img{transform:scale(1.12)}' +
    '.cob-n{font-size:11px;color:#dde6f2;margin-top:3px;max-width:52px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.cob-c{font-size:10px;opacity:.9}' +
    '.cob-none{color:#5d6878;font-style:italic}' +
    '@media (prefers-reduced-motion:reduce){.cob-m img{transition:none}.cob-m:hover img{transform:none}}';
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

    const aboard = CRB ? crewAboard(D, esc) : null;
    let h = '<div class="note" style="padding:0 0 10px">' + ships.length + ' ships' +
      (astName ? ' at or heading to <b>' + esc(astName) + '</b>' : '') + '</div>';

    h += '<div class="wrap"><table><thead><tr><th>Ship</th><th class="num">ID</th><th>Type</th>' +
      '<th>Asteroid</th>' + (aboard ? '<th>Crew on board</th>' : '') + '<th>Where</th><th>Arrives</th><th>Cargo</th><th class="num">Propellant</th>' +
      '</tr></thead><tbody>' + ships.map(x => row(x, esc, fmtT, tLeft, aboard)).join('') + '</tbody></table></div>';

    if (aboard) h = '<style>' + COB_CSS + '</style>' + h;
    m.innerHTML = h;
    if (aboard && Y.fillFacesIn) Y.fillFacesIn(m);
  }

  function row(x, esc, fmtT, tLeft, aboard) {
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
      '<td>' + esc(x.ast || '–') + '</td>' +
      (aboard ? '<td class="cls" style="white-space:normal">' + ((aboard[x.id] || []).join('') || '<span class="cob-none">No crew aboard</span>') + '</td>' : '') +
      whereCell + arrivesCell + cargoCell +
      '<td class="num">' + fmtT(x.prop) + '</td></tr>';
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.S = drawShips;
})();
