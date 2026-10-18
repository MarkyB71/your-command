/* Deliveries page – Your Influence Command
   One file per page (started 2026-10-18). Shows deliveries waiting to accept,
   on the way, ships in flight, 7-day totals, busiest routes and recent deliveries.
   The delivery data (YIC.DLV) is shared with Today's Workload, so loading stays shared too.
   Shared data and helpers come from window.YIC (set up in app.js). */
(function () {
  'use strict';

  const when = t => new Date(t * 1000).toLocaleString('en-GB',
    { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  // Start loading deliveries.php once; redraw when done
  function load(Y) {
    if (Y.dlvLoad) return;
    Y.dlvLoad = fetch('deliveries.php?wallet=' + encodeURIComponent(Y.D.wallet || ''), { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { if (j.error) throw new Error(j.error); Y.DLV = j; })
      .catch(e => { Y.DLV = { err0: (e && e.message) || 'error' }; })
      .finally(() => { Y.dlvLoad = null; if (Y.viewNow === 'V' || Y.viewNow === 'N') Y.draw(); });
  }

  // One section: heading, description, then a table (or an "empty" note)
  const section = (title, desc, n, head, rows, empty) =>
    '<h2>' + title + ' <span class="a" style="font-size:14px;font-weight:400">(' + n + ')</span></h2>' +
    '<div class="note" style="padding:0 0 8px">' + desc + '</div>' +
    (n ? '<div class="wrap"><table><thead><tr>' + head.map(h => '<th>' + h + '</th>').join('') +
      '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'
       : '<div class="note">' + empty + '</div>');

  function drawDeliveries(m) {
    const Y = window.YIC, D = Y.D, esc = Y.esc, pn = Y.pn, fq = Y.fq, ricon = Y.ricon, BT = Y.BT;
    const DLV = Y.DLV;

    // Not loaded yet (or failed)
    if (!DLV || DLV.err0) {
      if (DLV && DLV.err0) {
        m.innerHTML = '<div class="note">Could not load deliveries (' + esc(DLV.err0) + '). Click Deliveries to try again.</div>';
        Y.DLV = null;
        return;
      }
      m.innerHTML = '<div class="note">Loading your deliveries…</div>';
      load(Y);
      return;
    }

    const ai = document.querySelector('#ast').value;
    const an = ai === '' ? null : Y.asts[+ai].name;
    const now = Date.now() / 1000;

    // Look-ups: buildings, ships, asteroid names
    const bById = {}; (D.allB || []).forEach(b => { bById[b.id] = b; });
    const sById = {}; (D.ships || []).forEach(s => { sById[s.id] = s; });
    const astN = {};
    (D.owned || []).forEach(a => { astN[a.id] = (a.Name && a.Name.name) || ('Asteroid #' + a.id); });
    (D.allB || []).forEach(b => {
      const l = ((b.Location && b.Location.locations) || []).find(x => x.label === 3);
      if (l && b.meta && b.meta.asteroid && b.meta.asteroid.name) astN[l.id] = b.meta.asteroid.name;
    });
    const aName = id => id ? (astN[id] || ('Asteroid #' + id)) : '';

    // Name of a building / ship (plain text)
    const nameOf = ([label, id]) => {
      if (label === 5) {
        const b = bById[id], t = b ? (BT[b.Building && b.Building.buildingType] || 'Building') : 'Building';
        return b ? ((b.Name && b.Name.name) || (t + ' #' + id)) : (t + ' #' + id);
      }
      if (label === 6) { const s = sById[id]; return s ? s.name : ('Ship #' + id); }
      return '#' + id;
    };
    // From / To cell (name, type, asteroid)
    const ent = e => {
      const [label, , ast, mine] = e;
      const b = label === 5 ? bById[e[1]] : null;
      const t = label === 5 ? (b ? (BT[b.Building && b.Building.buildingType] || 'Building') : 'Building') : label === 6 ? 'Ship' : '?';
      return '<b' + (mine ? '' : ' style="font-weight:400"') + '>' + esc(nameOf(e)) + '</b>' +
        (mine ? '' : ' <span class="a">(other player)</span>') +
        '<br><span class="a">' + esc(t) + (ast ? ' · ' + esc(aName(ast)) : '') + '</span>';
    };
    const what = c => c.length
      ? c.map(([p, a]) => ricon(p, 20) + esc(pn(String(p))) + ' <span class="a">' + fq(String(p), a) + '</span>').join('<br>')
      : '<span class="a">–</span>';
    const okA = r => !an || aName(r[3][2]) === an || aName(r[4][2]) === an;

    // Row = [id, status, time, from, to, contents, forSale]; from/to = [label, id, asteroidId, mine]
    const waiting = (DLV.pending || []).filter(r => r[4][3] && okA(r));
    const sentOut = (DLV.pending || []).filter(r => !r[4][3] && r[3][3] && okA(r));
    const onWay = (DLV.transit || []).filter(okA).sort((x, y) => x[2] - y[2]);
    const flying = (D.ships || []).filter(s => s.fl && (!an || s.ast === an || String(s.place || '').includes(an)));
    const recent = (DLV.recent || []).filter(okA);

    let h = '<div class="note" style="padding:0 0 10px">Updated ' +
      esc(new Date(DLV.fetched * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })) +
      ' (refreshes every 2 minutes)' + (an ? ' · showing <b>' + esc(an) + '</b> only' : '') +
      (DLV.err ? ' · <span style="color:#ff7a7a">' + esc(DLV.err) + '</span>' : '') + '</div>';

    h += section('Waiting to accept', 'Deliveries other players have sent to you. Accept them in the game.',
      waiting.length, ['What', 'From', 'To', 'Sent'],
      waiting.map(r => '<tr><td>' + what(r[5]) + '</td><td>' + ent(r[3]) + '</td><td>' + ent(r[4]) + '</td><td class="cls">' +
        (r[2] ? esc(when(r[2])) : '–') + (r[6] ? '<br><span class="a">for sale</span>' : '') + '</td></tr>'),
      'Nothing waiting for you.');

    if (sentOut.length) h += section('Sent, waiting for the other player', 'Deliveries you sent that the other player has not accepted yet.',
      sentOut.length, ['What', 'From', 'To', 'Sent'],
      sentOut.map(r => '<tr><td>' + what(r[5]) + '</td><td>' + ent(r[3]) + '</td><td>' + ent(r[4]) + '</td><td class="cls">' +
        (r[2] ? esc(when(r[2])) : '–') + '</td></tr>'), '');

    h += section('On the way now', 'Deliveries moving to or from your buildings and ships right now, soonest first.',
      onWay.length, ['What', 'From', 'To', 'Arrives', 'Time left'],
      onWay.map(r => '<tr><td>' + what(r[5]) + '</td><td>' + ent(r[3]) + '</td><td>' + ent(r[4]) + '</td><td class="cls">' +
        esc(when(r[2])) + '</td><td><b data-fin="' + r[2] + '">' + Y.tLeft(r[2], now) + '</b></td></tr>'),
      'Nothing on the way right now.');

    h += section('Your ships in flight', 'Ships travelling between asteroids.',
      flying.length, ['Ship', 'Type', 'Route', 'Cargo'],
      flying.map(s => '<tr><td><span style="display:inline-block;width:56px;height:42px;vertical-align:middle;margin-right:8px;' +
        'border-radius:4px;background:#000 url(shipimg.php?t=' + s.st + '&v=' + s.sv + '&s=1) no-repeat 50% 42%/170% auto"></span>' +
        esc(s.name) + '</td><td class="cls">' + esc(s.type) + '</td><td class="cls" style="white-space:normal">' + esc(s.place) +
        '</td><td class="cls" style="white-space:normal">' + (s.useM > 0 ? Y.fmtT(s.useM / 1e6) + (s.carry ? ' · ' + esc(s.carry) : '') : 'Empty') +
        '</td></tr>'),
      'None of your ships are flying right now.');

    // 7-day totals per product, and busiest routes
    if ((DLV.recent || []).length) {
      const P = {}, RT = {};
      recent.forEach(r => {
        const dir = r[4][3] && r[3][3] ? 'mv' : r[4][3] ? 'in' : 'out';
        (r[5] || []).forEach(([p, a]) => { const x = P[p] = P[p] || { in: 0, out: 0, mv: 0, n: 0 }; x[dir] += a; x.n++; });
        const k = (r[3][3] ? nameOf(r[3]) : 'Other player') + ' → ' + (r[4][3] ? nameOf(r[4]) : 'Other player');
        const t = RT[k] = RT[k] || { n: 0, p: {} };
        t.n++;
        (r[5] || []).forEach(([p, a]) => { t.p[p] = (t.p[p] || 0) + a; });
      });
      const tot = x => x.in + x.out + x.mv;
      const cell = (p, v) => v ? fq(String(p), v) : '<span class="a">–</span>';
      const PL = Object.keys(P).sort((a, b) => tot(P[b]) - tot(P[a]));
      const RL = Object.keys(RT).sort((a, b) => RT[b].n - RT[a].n).slice(0, 15);

      h += section('Totals – last 7 days', 'What you moved most, by product. In = from other players, Out = to other players, Moved = between your own buildings and ships.',
        PL.length, ['Product', 'In', 'Out', 'Moved', 'Deliveries'],
        PL.map(p => '<tr><td>' + ricon(p, 20) + esc(pn(String(p))) + '</td><td class="num">' + cell(p, P[p].in) + '</td><td class="num">' +
          cell(p, P[p].out) + '</td><td class="num">' + cell(p, P[p].mv) + '</td><td class="num">' + P[p].n + '</td></tr>'), '');

      h += section('Busiest routes – last 7 days', 'Where your deliveries went most often, busiest first (top 15).',
        RL.length, ['From → To', 'Deliveries', 'What'],
        RL.map(k => '<tr><td style="white-space:normal">' + esc(k) + '</td><td class="num">' + RT[k].n + '</td><td style="white-space:normal">' +
          Object.keys(RT[k].p).sort((a, b) => RT[k].p[b] - RT[k].p[a]).slice(0, 4)
            .map(p => ricon(p, 16) + esc(pn(String(p))) + ' <span class="a">' + fq(String(p), RT[k].p[p]) + '</span>').join('<br>') +
          '</td></tr>'), '');
    }

    h += section('Recent deliveries', 'Everything that arrived in the last 7 days, newest first.',
      recent.length, ['', 'What', 'From', 'To', 'Arrived'],
      recent.slice(0, 300).map(r => {
        const io = r[4][3] && r[3][3] ? '<span class="a">Moved</span>' : r[4][3] ? '<span style="color:#4cd04c">In</span>' : '<span style="color:#fab219">Out</span>';
        return '<tr><td>' + io + '</td><td>' + what(r[5]) + '</td><td>' + ent(r[3]) + '</td><td>' + ent(r[4]) + '</td><td class="cls">' + esc(when(r[2])) + '</td></tr>';
      }),
      'No deliveries in the last 7 days.');

    m.innerHTML = h;
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.V = drawDeliveries;
})();
