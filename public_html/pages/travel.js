/* Planners › Travel – Your Influence Command
   One file per page (started 2026-10-18). A table of the quickest trip between
   each pair of your asteroids, for a chosen ship, propellant, cargo and start time.
   Flight maths: vendor/travel.js (Influence's own Lambert solver).
   Shared data and helpers come from window.YIC (set up in app.js). */
(function () {
  'use strict';

  // Chosen options (kept while you move between pages)
  const S = { ship: null, prop: 'full', cargo: 'empty', leave: 0 };
  let run = 0;   // stops an old calculation when the page redraws

  const TYPE_NAME = { 2: 'Light Transport', 3: 'Heavy Transport', 4: 'Shuttle' };

  function drawTravel(m) {
    const Y = window.YIC, D = Y.D, esc = Y.esc;

    const asts = (D.owned || []).filter(a => a.Orbit && a.Orbit.a)
      .map(a => ({ id: a.id, name: (a.Name && a.Name.name) || ('Asteroid #' + a.id), o: a.Orbit }))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (asts.length < 2) { m.innerHTML = '<div class="note">You need at least two asteroids for a travel table.</div>'; return; }

    // Ship choices: your transports and shuttles, plus generic ones
    const ships = (D.ships || []).filter(s => s.st >= 2 && s.st <= 4).sort((a, b) => a.name.localeCompare(b.name));
    const opts = [...ships.map(s => ['s' + s.id, s.name + ' · ' + s.type]),
      ['g2', 'Any Light Transport (no crew bonus)'], ['g3', 'Any Heavy Transport (no crew bonus)'], ['g4', 'Any Shuttle (no crew bonus)']];
    if (!S.ship || !opts.some(o => o[0] === S.ship)) {
      const lt = ships.find(s => s.st === 2);
      S.ship = lt ? 's' + lt.id : opts[0][0];
    }

    const sel = (id, cur, list) => '<select id="' + id + '">' + list.map(([v, t]) =>
      '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select>';

    let h = '<div class="bar" style="margin:0 0 10px">' +
      'Ship ' + sel('trS', S.ship, opts) +
      ' Propellant ' + sel('trP', S.prop, [['full', 'Full tank'], ['now', 'What it has now']]) +
      ' Cargo ' + sel('trC', S.cargo, [['empty', 'Empty'], ['full', 'Full'], ['now', 'What it has now']]) +
      ' Leave ' + sel('trL', S.leave, [[0, 'now'], [6, 'in 6 hours'], [12, 'in 12 hours'], [24, 'in 1 day'], [48, 'in 2 days']]) + '</div>';

    h += '<div id="trInfo" class="note" style="padding:0 0 10px"></div><div class="wrap"><table id="trT"><thead><tr><th>From \\ To</th>' +
      asts.map(a => '<th class="num">' + esc(a.name) + '</th>').join('') + '</tr></thead><tbody>' +
      asts.map(a => '<tr><td><b>' + esc(a.name) + '</b></td>' + asts.map(b =>
        '<td class="num" data-f="' + a.id + '" data-t="' + b.id + '">' + (a.id === b.id ? '<span class="a">–</span>' : '<span class="a">…</span>') + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div>' +
      '<div class="note" style="padding:10px 0 0">Quickest trip leaving at the chosen time, worked out the same way as the game\'s route planner ' +
      '(1 game day = 1 real hour). The fastest in each row is highlighted. Small grey figure = distance between the two asteroids right now. ' +
      'Food, emergency mode and waiting for a better launch window are not included.</div>';
    m.innerHTML = h;

    // Changing an option redraws the page
    const keyOf = { trS: 'ship', trP: 'prop', trC: 'cargo', trL: 'leave' };
    Object.keys(keyOf).forEach(id => m.querySelector('#' + id).addEventListener('change', e => {
      S[keyOf[id]] = id === 'trL' ? +e.target.value : e.target.value;
      drawTravel(m);
    }));

    // Ship figures
    let st = 2, variant = 1, mates = null, propKg = 0, cargoKg = 0, label;
    if (S.ship[0] === 's') {
      const s = ships.find(x => 's' + x.id === S.ship);
      st = s.st; variant = s.sv;
      const cr = (D.crewsRaw || []).find(c => c.id === s.crewId);
      mates = ((cr && cr.Crew && cr.Crew.roster) || []).map(id => (D.crewmates || {})[id]).filter(Boolean);
      propKg = s.prop * 1000;
      cargoKg = s.useM / 1000;
      label = esc(s.name) + (cr ? ' (crew ' + esc((cr.Name && cr.Name.name) || ('#' + cr.id)) + ')' : '');
    } else {
      st = +S.ship.slice(1);
      label = 'a standard ' + TYPE_NAME[st] + ' with no crew bonus';
    }
    const info = m.querySelector('#trInfo');
    info.innerHTML = 'Working out trips for ' + label + '…';

    const me = ++run;
    import('../vendor/travel.js?v=' + Y.VER).then(async T => {
      if (me !== run || !m.isConnected) return;
      let bonus = 1;
      if (mates && mates.length) { bonus = T.exhaustBonus(mates); label += ' · engine bonus ×' + bonus.toFixed(2); }

      const ship = T.SHIPS[st];
      const pk = S.prop === 'full' ? ship[2] / 1000 : propKg;
      const ck = S.cargo === 'empty' ? 0 : S.cargo === 'full' ? ship[3] / 1000 : cargoKg;
      const maxDv = T.maxDeltaV(st, variant, bonus, ck, pk);
      const dep = (Date.now() / 1000 - 1609459200) / 3600 + S.leave;   // orbit time in hours
      info.innerHTML = label + ' · ' + Y.fmtT(pk / 1000) + ' propellant · ' + (ck ? Y.fmtT(ck / 1000) + ' cargo' : 'no cargo') +
        ' · up to ' + (maxDv / 1000).toFixed(1) + ' km/s';

      // Fill each cell, then highlight the fastest in each row
      const best = {};
      for (const a of asts) for (const b of asts) {
        if (a.id === b.id) continue;
        if (me !== run || !m.isConnected) return;
        const td = m.querySelector('td[data-f="' + a.id + '"][data-t="' + b.id + '"]');
        const au = T.distance(a.o, b.o, dep) / 1.495978707e11;
        const f = await T.fastest(a.o, b.o, dep, maxDv);
        td.innerHTML = (f ? '<b>' + f.tof + ' h</b>' + (f.tof >= 48 ? ' <span class="a">(' + (f.tof / 24).toFixed(1) + ' d)</span>' : '') : '<span class="a">out of range</span>') +
          '<br><span class="a">' + au.toFixed(2) + ' AU</span>';
        td.dataset.h = f ? f.tof : '';
        if (f && (!best[a.id] || f.tof < best[a.id].tof)) best[a.id] = { tof: f.tof, td };
        await new Promise(r => setTimeout(r, 0));
      }
      Object.values(best).forEach(x => { x.td.style.background = 'rgba(95,195,228,.15)'; });
    }).catch(e => { info.innerHTML = 'Could not load the travel maths (' + esc((e && e.message) || e) + ').'; });
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.R = drawTravel;
})();
