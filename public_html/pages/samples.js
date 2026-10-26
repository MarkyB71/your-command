/* Asteroids › Core Samples – Your Influence Command
   One file per page (started 2026-10-18). Your untouched core samples, one row per asteroid + resource; click for each lot.
   APP = window.YIC: shared data, helpers and page state that still live in app.js
   (Today's Workload and other pages use some of them too). */
(function () {
  'use strict';
  // window.YIC is only set once app.js has loaded your data, so look it up each time
  const APP = new Proxy({}, { get: (_, k) => window.YIC[k], set: (_, k, v) => ((window.YIC[k] = v), true) });
  // Hide tiny samples (beta test, 26 Oct 2026): under 2 t hidden by default; the choice is remembered in this browser
  const SMALL_KG = 2000,
    SKEY = 'yic-samp-show-small';
  let SHOWSM = false;
  try {
    SHOWSM = localStorage.getItem(SKEY) === '1';
  } catch (e) {}

  function drawSamples(m) {
    if (!APP.SAMP || APP.SAMP.err) {
      if (APP.SAMP && APP.SAMP.err) {
        m.innerHTML =
          '<div class="note">Could not load your core samples (' +
          APP.esc(APP.SAMP.err) +
          '). Click Core Samples to try again.</div>';
        APP.SAMP = null;
        return;
      }
      m.innerHTML = '<div class="note">Loading your core samples…</div>';
      if (!APP.sampLoad)
        APP.sampLoad = fetch('samples.php?wallet=' + encodeURIComponent(APP.D.wallet || ''), {
          cache: 'no-store',
        })
          .then((r) => r.json())
          .then((j) => {
            if (j.error) throw new Error(j.error);
            APP.SAMP = j;
          })
          .catch((e) => {
            APP.SAMP = { err: (e && e.message) || 'error' };
          })
          .finally(() => {
            APP.sampLoad = null;
            if (APP.view === 'X') APP.draw();
          });
      return;
    }
    const ai = APP.$('#ast').value,
      an = ai === '' ? null : APP.asts[+ai].name,
      q = APP.$('#q').value.trim().toLowerCase(),
      cl = APP.$('#cls').value;
    const ex = {};
    (APP.D.allB || []).forEach((b) => {
      const B = b.Building || {};
      if (B.status !== 3 || B.buildingType !== 2) return;
      const l = ((b.Location && b.Location.locations) || []).find((x) => x.label === 4);
      if (!l) return;
      const e = (ex[l.id] = ex[l.id] || []);
      e.push({
        id: b.id,
        name: (b.Name && b.Name.name) || 'Extractor #' + b.id,
        busy: (b.Extractors || []).some((x) => x.status === 1),
      });
    });
    const lotN = (id) => Math.floor(id / 4294967296);
    const g = {};
    let hid = 0;
    (APP.SAMP.rows || []).forEach(([id, r, kg, lot, a, sale]) => {
      const p = String(r);
      if (an && a !== an) return;
      if (cl && APP.pc(p) !== cl) return;
      if (q && !(APP.pn(p).toLowerCase().includes(q) || a.toLowerCase().includes(q))) return;
      if ((!SHOWSM) && APP.kg(p, kg) < SMALL_KG) {
        hid++;
        return;
      }
      const k = a + '|' + p,
        x = (g[k] = g[k] || { a, p, n: 0, kg: 0, max: 0, lots: {} });
      x.n++;
      x.kg += kg;
      x.max = Math.max(x.max, kg);
      const L = (x.lots[lot] = x.lots[lot] || { lot, n: 0, kg: 0, max: 0, sale: 0 });
      L.n++;
      L.kg += kg;
      L.max = Math.max(L.max, kg);
      L.sale += sale;
    });
    const list = Object.values(g).sort((x, y) => y.kg - x.kg);
    const all = (APP.SAMP.rows || []).length;
    let h =
      '<div class="note" style="padding:0 0 10px">' +
      all.toLocaleString() +
      ' untouched samples (sampled, never extracted from) · updated ' +
      APP.esc(
        new Date(APP.SAMP.fetched * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      ) +
      ' (refreshes every 5 minutes)' +
      (an ? ' · showing <b>' + APP.esc(an) + '</b> only' : '') +
      '</div>' +
      ('<label style="display:inline-flex;align-items:center;gap:6px;margin:0 0 10px;font-size:15px;color:#c8d3e0;cursor:pointer"><input type="checkbox" id="smHide"' +
          (SHOWSM ? '' : ' checked') +
          '> Hide small samples (under 2 t)' +
          (!SHOWSM && hid ? ' <span class="a">– ' + hid.toLocaleString() + ' hidden</span>' : '') +
          '</label>');
    const wire = () => {
      const c = m.querySelector('#smHide');
      if (c)
        c.addEventListener('change', () => {
          SHOWSM = !c.checked;
          try {
            localStorage.setItem(SKEY, SHOWSM ? '1' : '0');
          } catch (e) {}
          APP.draw();
        });
    };
    if (!list.length) {
      m.innerHTML =
        h + '<div class="note">' + (all ? 'Nothing matches.' : 'You have no untouched samples.') + '</div>';
      wire();
      return;
    }
    h +=
      '<div class="wrap"><table><thead><tr><th>Resource</th><th>Asteroid</th><th class="num">Total left</th><th class="num">Samples</th><th class="num">Lots</th><th class="num">Biggest sample</th></tr></thead><tbody>';
    list.forEach((x) => {
      const k = x.a + '|' + x.p,
        o = APP.sampOpen === k,
        lots = Object.values(x.lots).sort((a, b) => b.max - a.max || b.kg - a.kg);
      h +=
        '<tr class="prow' +
        (o ? ' open' : '') +
        '" data-k="' +
        APP.esc(k) +
        '"><td>' +
        APP.ricon(x.p, 24) +
        APP.esc(APP.pn(x.p)) +
        '</td><td class="cls">' +
        APP.esc(x.a) +
        '</td><td class="num tot">' +
        APP.fmt(x.p, x.kg) +
        '</td><td class="num">' +
        x.n +
        '</td><td class="num">' +
        lots.length +
        '</td><td class="num">' +
        APP.fmt(x.p, x.max) +
        '</td></tr>';
      if (o)
        h +=
          '<tr class="det"><td colspan="6"><table style="width:auto"><thead><tr><th>Lot</th><th class="num">Samples</th><th class="num">Total</th><th class="num">Biggest</th><th>Extractor on this lot</th></tr></thead><tbody>' +
          lots
            .map((L) => {
              const e = ex[L.lot];
              return (
                '<tr><td>#' +
                lotN(L.lot).toLocaleString() +
                (window.GL ? window.GL('/lot/' + L.lot, 'Open this lot in the game') : '') +
                '</td><td class="num">' +
                L.n +
                (L.sale ? ' <span class="a">(' + L.sale + ' for sale)</span>' : '') +
                '</td><td class="num">' +
                APP.fmt(x.p, L.kg) +
                '</td><td class="num">' +
                APP.fmt(x.p, L.max) +
                '</td><td>' +
                (e
                  ? e
                      .map(
                        (z) =>
                          APP.esc(z.name) +
                          (window.GL ? window.GL('/building/' + z.id, 'Open this extractor in the game') : '') +
                          ' · ' +
                          (z.busy
                            ? '<span style="color:#4cd04c">working</span>'
                            : '<span style="color:#fab219">idle</span>'),
                      )
                      .join('<br>')
                  : '<span class="a">none</span>') +
                '</td></tr>'
              );
            })
            .join('') +
          '</tbody></table></td></tr>';
    });
    m.innerHTML =
      h +
      '</tbody></table></div><div class="note" style="padding:10px 0 0">Click a resource to see its lots, biggest sample first. Used and part-used samples are left out.</div>';
    wire();
    m.querySelectorAll('tr.prow').forEach((tr) =>
      tr.addEventListener('click', () => {
        APP.sampOpen = APP.sampOpen === tr.dataset.k ? null : tr.dataset.k;
        APP.draw();
      }),
    );
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.X = function (m) {
    drawSamples(m);
  };
})();
