/* Asteroids › Lot resources – Your Influence Command
   One file per page (started 2026-10-18). The richest lots for a resource on one of your asteroids (free lots, all lots or your extractors).
   APP = window.YIC: shared data, helpers and page state that still live in app.js
   (Today's Workload and other pages use some of them too). */
(function () {
  'use strict';
  // window.YIC is only set once app.js has loaded your data, so look it up each time
  const APP = new Proxy({}, { get: (_, k) => window.YIC[k], set: (_, k, v) => ((window.YIC[k] = v), true) });

  function drawLotRes(m) {
    const own = (APP.D.owned || []).filter(
      (a) => a.Celestial && a.Celestial.abundances && a.Celestial.scanStatus >= 4,
    );
    const nm = (a) => (a.Name && a.Name.name) || 'Asteroid #' + a.id;
    if (!own.length) {
      m.innerHTML =
        '<div class="note">This needs an asteroid you own or control that has had its resource scan.</div>';
      return;
    }
    const ai = APP.$('#ast').value,
      an = ai === '' ? null : APP.asts[+ai].name;
    if (an) {
      const f = own.find((a) => nm(a) === an);
      if (f) APP.lfAst = f.id;
    }
    if (!own.some((a) => a.id === APP.lfAst)) APP.lfAst = own[0].id;
    const A = own.find((a) => a.id === APP.lfAst);
    if (!APP.ABM) {
      m.innerHTML = '<div class="note">Loading the game\'s resource maths…</div>';
      import('../vendor/abund.js?v=' + APP.VER)
        .then((x) => {
          APP.ABM = x;
          if (APP.view === 'F') APP.draw();
        })
        .catch((e) => {
          m.innerHTML =
            '<div class="note">Could not load the resource maths (' +
            APP.esc((e && e.message) || e) +
            ').</div>';
        });
      return;
    }
    const ab = APP.ABM.abundances(A.Celestial.abundances),
      rs = Object.keys(ab)
        .filter((k) => ab[k] > 0)
        .sort((x, y) => ab[y] - ab[x])
        .map(Number);
    if (!rs.includes(APP.lfRes)) APP.lfRes = rs[0];
    let h =
      '<div class="note" style="padding:0 0 10px">How rich each free lot is in one resource, worked out with the game\'s own maths. Pick an asteroid and a resource.</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px"><select id="lfA">' +
      own
        .map(
          (a) =>
            '<option value="' +
            a.id +
            '"' +
            (a.id === APP.lfAst ? ' selected' : '') +
            '>' +
            APP.esc(nm(a)) +
            '</option>',
        )
        .join('') +
      '</select><select id="lfR">' +
      rs
        .map(
          (r) =>
            '<option value="' +
            r +
            '"' +
            (r === APP.lfRes ? ' selected' : '') +
            '>' +
            APP.esc(APP.pn(String(r))) +
            ' (' +
            Math.round(ab[r] * 1000) / 10 +
            '% of asteroid)</option>',
        )
        .join('') +
      '</select></div>';
    const wire = () => {
      const a = m.querySelector('#lfA'),
        r = m.querySelector('#lfR');
      if (a)
        a.addEventListener('change', () => {
          APP.lfAst = +a.value;
          if (APP.$('#ast').value !== '') {
            APP.$('#ast').value = '';
          }
          APP.draw();
        });
      if (r)
        r.addEventListener('change', () => {
          APP.lfRes = +r.value;
          APP.draw();
        });
    };
    const L = APP.LOTS[APP.lfAst];
    if (!L || L.err) {
      if (L && L.err) {
        m.innerHTML =
          h +
          '<div class="note">Could not load the lots (' +
          APP.esc(L.err) +
          '). Pick the asteroid again to retry.</div>';
        delete APP.LOTS[APP.lfAst];
        wire();
        return;
      }
      m.innerHTML = h + '<div class="note">Checking which lots are in use…</div>';
      wire();
      const id = APP.lfAst;
      if (!APP.lotsLoad[id])
        APP.lotsLoad[id] = fetch('lots.php?wallet=' + encodeURIComponent(APP.D.wallet || '') + '&a=' + id, {
          cache: 'no-store',
        })
          .then((r) => r.json())
          .then((j) => {
            if (j.error) throw new Error(j.error);
            APP.LOTS[id] = j;
          })
          .catch((e) => {
            APP.LOTS[id] = { err: (e && e.message) || 'error' };
          })
          .finally(() => {
            delete APP.lotsLoad[id];
            if (APP.view === 'F') APP.draw();
          });
      return;
    }
    const n = APP.ABM.lotCount(APP.lfAst),
      k = APP.lfAst + '_' + APP.lfRes;
    if (!APP.ABC[k]) APP.ABC[k] = APP.ABM.lotsFor(APP.lfAst, A.Celestial.abundances, APP.lfRes, n);
    const v = APP.ABC[k];
    const used = new Set(L.used || []),
      all = [];
    for (let l = 1; l <= n; l++) all.push(l);
    all.sort((x, y) => v[y] - v[x]);
    const free = all.filter((l) => !used.has(l)),
      best = all[0];
    const bar = (x) =>
      '<span style="display:inline-block;width:80px;height:6px;background:#232b38;vertical-align:middle;margin-right:8px"><span style="display:block;height:100%;width:' +
      Math.round(x * 100) +
      '%;background:' +
      (x >= 0.6 ? '#4cd04c' : x >= 0.35 ? '#fab219' : '#5fc3e4') +
      '"></span></span>';
    h +=
      '<div class="note" style="padding:0 0 10px">' +
      APP.esc(nm(A)) +
      ': ' +
      free.length +
      ' free of ' +
      n +
      ' lots. Richest lot for ' +
      APP.esc(APP.pn(String(APP.lfRes))) +
      ' is Lot #' +
      best +
      ' (' +
      (v[best] * 100).toFixed(1) +
      '%)' +
      (used.has(best) ? ' – already in use' : ' – free') +
      '.</div>';

    if (APP.BONB) {
      const rb = APP.resBonus(APP.astBonuses(A.Celestial.bonuses || 0, A.Celestial.celestialType), APP.lfRes);
      h +=
        '<div style="margin:0 0 10px;font-weight:600;color:' +
        (rb.m > 1.0001 ? '#4cd04c' : '#8a96a8') +
        '">' +
        (rb.m > 1.0001
          ? '⚡ ' +
            APP.esc(nm(A)) +
            ' bonus for ' +
            APP.esc(APP.pn(String(APP.lfRes))) +
            ': ' +
            APP.esc(rb.nn.join(' and ')) +
            ' – extraction is ' +
            Math.round((rb.m - 1) * 100) +
            '% faster here'
          : 'No asteroid bonus for ' + APP.esc(APP.pn(String(APP.lfRes))) + ' on ' + APP.esc(nm(A))) +
        '</div>';
    }
    const BETA = true;
    const GLB = false,
      GAME = 'https://game.influenceth.io',
      gl = (p, t) =>
        GLB
          ? ' <a href="' +
            GAME +
            p +
            '" target="influencegame" title="' +
            t +
            ' (reuses your game tab)" style="white-space:nowrap;font-size:12px;color:#8fe3ff">Open in game ↗</a>'
          : '';
    const mine = {};
    (APP.D.allB || []).forEach((b) => {
      const ls = (b.Location && b.Location.locations) || [],
        as = ls.find((x) => x.label === 3),
        lo = ls.find((x) => x.label === 4);
      if (!as || as.id !== APP.lfAst || !lo) return;
      const B = b.Building || {};
      if ((B.status || 0) < 1) return;
      const li = Math.floor(lo.id / 4294967296);
      (mine[li] = mine[li] || []).push(b);
    });
    const bdesc = (b) => {
      const B = b.Building || {},
        ty = APP.BT[B.buildingType] || 'Building',
        bn = (b.Name && b.Name.name) || ty + ' #' + b.id;
      let s = '';
      const pl = B.status === 1,
        px = pl && B.plannedAt && B.plannedAt + 172800 <= Date.now() / 1000;
      if (pl) s = '';
      else if (B.status === 2) s = 'being built';
      else if (B.buildingType === 2) {
        const e = (b.Extractors || []).find((x) => x.status === 1);
        s = e ? 'extracting ' + APP.pn(String(e.outputProduct)) : 'idle';
      }
      const col = BCOL ? BCAT[B.buildingType] || '' : '';
      return (
        (BCOL ? APP.bthumb(ty, 40, 30) : '') +
        '<b' +
        (col ? ' style="color:' + col + '"' : '') +
        '>' +
        APP.esc(bn) +
        '</b> <span class="a">· ' +
        APP.esc(ty) +
        (s ? ' · ' + APP.esc(s) : '') +
        '</span>' +
        gl('/building/' + b.id, 'Open this building in the game') +
        (px
          ? ' <span title="The 2-day site reservation has run out. The game makes any materials sent here public." style="display:inline-block;margin:2px 0;padding:1px 8px;border-radius:9px;' + (BCOL ? 'background:transparent;border:1px solid #4a5568;color:#9aa8bb' : 'background:rgba(255,90,90,.15);border:1px solid #ff6b6b;color:#ff7a7a') + ';font-size:12px;font-weight:600;white-space:nowrap">Planning expired – site is public</span>'
          : pl
            ? ' <span style="display:inline-block;margin:2px 0;padding:1px 8px;border-radius:9px;background:rgba(250,178,25,.15);border:1px solid #fab219;color:#fab219;font-size:12px;font-weight:600;white-space:nowrap">Planning approved – reserved for ' +
              (B.plannedAt ? APP.tLeft(B.plannedAt + 172800, Date.now() / 1000) : '2 days') +
              '</span>'
            : '')
      );
    };
    const on = (l) =>
      mine[l]
        ? mine[l].map(bdesc).join('<br>')
        : used.has(l)
          ? '<span class="a">Another player\'s building</span>'
          : '<span style="color:#4cd04c">Free</span>';
    const ex = all.filter((l) => mine[l] && mine[l].some((b) => (b.Building || {}).buildingType === 2));
    const MODES = [
      ['all', 'All lots (' + n + ')'],
      ['free', 'Free lots (' + free.length + ')'],
      ['ext', 'Your extractors (' + ex.length + ')'],
    ];
    if (!MODES.some((x) => x[0] === APP.lfMode)) APP.lfMode = 'free';
    if (BETA)
      h +=
        '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:4px 0 14px"><span style="font-size:17px;font-weight:800;color:#8fe3ff;text-shadow:0 0 8px rgba(110,198,230,.85),0 0 18px rgba(110,198,230,.45);letter-spacing:.2px">Show your lots:</span>' +
        MODES.map(
          ([k, t]) =>
            '<button data-lm="' +
            k +
            '" aria-pressed="' +
            (k === APP.lfMode) +
            '" style="padding:8px 16px;font-size:15px;border-radius:8px;' +
            (k === APP.lfMode
              ? 'background:#6ec6e6;color:#06121c;border:2px solid #9fe0f5;font-weight:700;box-shadow:0 0 12px rgba(110,198,230,.6)'
              : 'background:transparent;border:2px solid #3a4658;color:#c8d3e0') +
            '">' +
            (k === APP.lfMode ? '✓ ' : '') +
            t +
            '</button>',
        ).join('') +
        '</div>';
    const L2 = APP.lfMode === 'all' ? all : APP.lfMode === 'ext' ? ex : free,
      lim = APP.lfMode === 'ext' || ALLL ? L2.length : 30;
    if (!L2.length)
      h +=
        '<div class="note">' +
        (APP.lfMode === 'ext'
          ? 'You have no extractors on this asteroid.'
          : 'There are no free lots on this asteroid.') +
        '</div>';
    else
      h +=
        '<div class="wrap"><table><thead><tr><th class="num">#</th><th>Lot</th><th>' +
        APP.esc(APP.pn(String(APP.lfRes))) +
        ' here</th>' +
        (BETA ? '<th>On this lot</th>' : '') +
        '</tr></thead><tbody>' +
        L2.slice(0, lim)
          .map(
            (l, i) =>
              '<tr><td class="num">' +
              (i + 1) +
              '</td><td>Lot #' +
              l +
              gl('/lot/' + (APP.lfAst + l * 4294967296), 'Open this lot in the game') +
              '</td><td>' +
              bar(v[l]) +
              (v[l] * 100).toFixed(1) +
              '%</td>' +
              (BETA ? '<td style="white-space:normal">' + on(l) + '</td>' : '') +
              '</tr>',
          )
          .join('') +
        '</tbody></table></div>' +
        (L2.length > lim
          ? '<div class="note" style="padding:8px 0 0">Showing the ' +
            lim +
            ' richest of ' +
            L2.length +
            '.</div>'
          : '');
    m.innerHTML = h;
    wire();
    m.querySelectorAll('[data-lm]').forEach((b) =>
      b.addEventListener('click', () => {
        APP.lfMode = b.dataset.lm;
        APP.draw();
      }),
    );
  }

  var BCOL = /[?&]beta=1/.test(location.search); // building picture + game colour (test)
  // Game lot-map colours by building category (influence-client SearchFilters.js)
  var BCAT = { 1: '#ff8c00', 10: '#ff8c00', 2: '#ff4a3d', 3: '#e0458a', 4: '#2ecc1a', 5: '#c99a6e', 6: '#7a7aff', 7: '#19d9ff', 8: '#57ff65', 9: '#ffff00' };
  var ALLL = /[?&]beta=1/.test(location.search); // show every lot (test)
  window.PAGES = window.PAGES || {};
  window.PAGES.F = function (m) {
    drawLotRes(m);
  };
})();
