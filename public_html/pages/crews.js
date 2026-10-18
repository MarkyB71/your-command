/* Crews page – Your Influence Command
   One file per page (started 2026-10-18). Draws a card for each crew,
   with sort / group options and crewmate faces + useful traits.
   Shared data and helpers come from window.YIC (set up in app.js). */
(function () {
  'use strict';

  // Food level -> colour and word
  const foodColour = f => f == null ? '#5b6677' : f >= 0.5 ? '#0ca30c' : f >= 0.25 ? '#fab219' : '#d03b3b';
  const foodWord = f => f == null ? '–' : f >= 0.5 ? 'Fed' : f >= 0.25 ? 'Getting low' : 'Starving';
  const mates = c => (c.roster || []).length;

  // Sort options: key -> [label, compare]
  const SORTS = {
    n: ['Most crewmates', (a, b) => mates(b) - mates(a)],
    f: ['Fewest crewmates', (a, b) => (!mates(a)) - (!mates(b)) || mates(a) - mates(b)],
    a: ['Crew name A–Z', (a, b) => String(a.name).localeCompare(String(b.name))],
    i: ['Crew ID (lowest first)', (a, b) => Number(a.id) - Number(b.id)],
    s: ['Asteroid', (a, b) => (a.ast || '~').localeCompare(b.ast || '~')],
    h: ['Hungriest first', (a, b) => (a.food == null ? 2 : a.food) - (b.food == null ? 2 : b.food)],
    r: ['Ready first', (a, b) => (!!a.busy) - (!!b.busy)]
  };

  // Group heading for each sort
  const byMates = c => { const k = mates(c); return k ? k + ' crewmate' + (k > 1 ? 's' : '') : 'Empty crews'; };
  const GROUPS = {
    n: byMates, f: byMates,
    a: c => (String(c.name || '?')[0] || '?').toUpperCase(),
    i: () => '',
    s: c => c.ast || 'No asteroid',
    h: c => foodWord(c.food) === '–' ? 'No food data' : foodWord(c.food),
    r: c => c.busy ? 'Busy' : 'Ready'
  };

  function drawCrews(m) {
    const Y = window.YIC, D = Y.D, esc = Y.esc;

    // Filters: asteroid dropdown and search box
    const ai = document.querySelector('#ast').value;
    const astName = ai === '' ? null : Y.asts[+ai].name;
    const q = (document.querySelector('#q') || { value: '' }).value.trim().toLowerCase();
    const okText = (...t) => !q || t.some(v => String(v || '').toLowerCase().includes(q));

    const crews = (D.crewList || []).filter(c => (!astName || c.ast === astName) && okText(c.name, c.place, c.ast));
    const starving = crews.filter(c => c.food != null && c.food < 0.25).length;

    if (!SORTS[window.crSort]) window.crSort = 'n';
    const hideEmpty = window.crHide !== false;

    let h = '<div class="note" style="padding:0 0 10px">' + crews.length + ' crews' +
      (astName ? ' at or heading to <b>' + esc(astName) + '</b>' : '') +
      (starving ? ' · <b style="color:#ff7a7a">' + starving + ' crew' + (starving > 1 ? 's' : '') + ' starving</b>' : '') + '</div>';

    // Sort + hide-empty controls
    h += '<div style="text-align:center;margin:0 0 12px"><label style="font-weight:bold">Sort crews by: <select id="crSort">' +
      Object.keys(SORTS).map(k => '<option value="' + k + '"' + (k === window.crSort ? ' selected' : '') + '>' + SORTS[k][0] + '</option>').join('') +
      '</select></label> <label style="font-weight:bold;margin-left:18px"><input type="checkbox" id="crHide"' +
      (hideEmpty ? ' checked' : '') + '> Hide empty crews</label></div>';

    // Cards, with a heading whenever the group changes
    const group = GROUPS[window.crSort];
    let last = null;
    h += crews.filter(c => !hideEmpty || mates(c)).sort(SORTS[window.crSort][1]).map(c => {
      const g = group(c);
      const head = g && g !== last ? '<h3 style="text-align:center;margin:18px 0 8px;color:var(--accent)">' + esc(g) + '</h3>' : '';
      last = g;
      return head + card(c, esc, Y.crewTraits);
    }).join('');

    h += '<div class="note" style="padding:10px 0 0">Food is worked out from when each crew was last fed; ' +
      'crewmate food traits aren\'t included, so treat it as a guide.</div>';

    m.innerHTML = h;
    Y.fillFacesIn(m);

    m.querySelector('#crSort').addEventListener('change', e => { window.crSort = e.target.value; Y.draw(); });
    m.querySelector('#crHide').addEventListener('change', e => { window.crHide = e.target.checked; Y.draw(); });
  }

  function card(c, esc, crewTraits) {
    const pct = Math.round((c.food || 0) * 100);
    return '<div class="crewcard" style="border:1px solid #2a3648;border-radius:10px;padding:10px 12px;margin:0 0 12px;background:#0b1018">' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center;justify-content:center;margin:0 0 10px">' +
      '<b style="font-size:16px">' + esc(c.name) + ' <span class="cls" style="font-weight:normal">#' + esc(c.id) + '</span></b>' +
      '<span><span class="cls">Asteroid</span> ' + esc(c.ast || '–') + '</span>' +
      '<span><span class="cls">Where</span> ' + esc(c.place) + '</span>' +
      '<span><span class="cls">Food</span> <span style="display:inline-block;width:60px;height:6px;background:#232b38;vertical-align:middle;margin:0 6px">' +
      '<span style="display:block;height:100%;width:' + pct + '%;background:' + foodColour(c.food) + '"></span></span>' +
      (c.food == null ? '–' : pct + '%') + ' <span class="cls">' + foodWord(c.food) + '</span></span>' +
      '<span class="cls">' + (c.busy ? 'Busy until ' + esc(c.busy) : 'Ready') + '</span>' +
      '</div>' + crewTraits(c) + '</div>';
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.C = drawCrews;
})();
