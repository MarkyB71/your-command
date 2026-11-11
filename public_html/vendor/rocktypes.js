/* Rock types – Your Influence Command (Mark, 10 Nov 2026) – TEST ONLY on ?beta=1
   Science Lab page: which of the 22 raw materials can be mined on each asteroid type
   (C, Cm, Ci, Cs, Cms, Cis, S, Sm, Si, M, I). Data: app.js SPEC (same as the Supply chain page).
   Rows are grouped like the game's extraction bonuses (Volatile, Organic, Metal, Rare Earth, Fissile).
   The types of your own rocks are lit; click a type (or a raw material) to highlight it.
   To go live: remove the BETA line here and in decks.js, add a CHANGELOG line and a Help page entry. */
(function () {
  'use strict';
  const BETA = /[?&]beta=1\b/.test(location.search);
  if (!BETA) return;

  const COL = '#4f90ff'; // Scientist blue (game theme) – the Science Lab colour
  const GROUPS = [
    ['Volatile', [1, 2, 3, 4, 5, 6, 7, 8]],
    ['Organic', [9, 10, 11]],
    ['Metal', [12, 13, 14, 18, 19, 20, 21]],
    ['Rare Earth', [16, 17]],
    ['Fissile', [15, 22]],
  ];
  const S = { col: '', row: 0 };

  const CSS = `.rt-note{color:#8b9ab0;font-size:13px;margin:0 0 10px}
.rt-wrap{overflow-x:auto;background:#0d1520;border:1px solid #23324a;border-radius:10px}
.rt{border-collapse:collapse;width:100%;font-size:14px}
.rt th,.rt td{padding:6px 8px;text-align:center;border-bottom:1px solid #1a2433;white-space:nowrap}
.rt th:first-child,.rt td:first-child{text-align:left;position:sticky;left:0;background:#0d1520;z-index:1}
.rt thead th{color:#c9d6e8;font-weight:600;cursor:pointer;user-select:none}
.rt thead th small{display:block;font-weight:400;font-size:11px;color:#8b9ab0}
.rt .rt-g td{color:${COL};font-weight:600;font-size:12px;letter-spacing:.06em;text-transform:uppercase;background:#0a111a;text-align:left}
.rt .rt-g td:first-child{background:#0a111a}
.rt tbody tr.rt-r{cursor:pointer}
.rt .rt-y{color:${COL};font-size:16px}
.rt .rt-n{color:#3a4658}
.rt .rt-mine{background:rgba(79,144,255,.08)}
.rt th.rt-mine{color:${COL}}
.rt .rt-sel{background:rgba(79,144,255,.22)!important}
.rt tr.rt-on td{background:rgba(79,144,255,.14)}
.rt tr.rt-on td:first-child{background:#13233a}
.rt td.rt-cnt{color:#8b9ab0}
.rt-key{display:flex;gap:16px;flex-wrap:wrap;color:#8b9ab0;font-size:12px;margin:8px 2px 0}
.rt-key b{color:${COL}}`;

  function css() {
    if (document.getElementById('rt-css')) return;
    const st = document.createElement('style');
    st.id = 'rt-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // your rocks' types: asteroid box + owned/controlled rocks
  function mine(Y) {
    const out = {};
    (Y.D && Y.D.owned || []).forEach((a) => {
      const c = a.Celestial, sp = c && Y.SPEC[c.celestialType];
      if (!sp) return;
      (out[sp[0]] = out[sp[0]] || []).push((a.Name && a.Name.name) || ('Asteroid #' + a.id));
    });
    return out;
  }

  function page(m) {
    css();
    const Y = window.YIC, esc = Y.esc, pn = Y.pn, SPEC = Y.SPEC;
    const types = Object.keys(SPEC).map((k) => ({ k: +k, n: SPEC[k][0], r: new Set(SPEC[k][1]) }));
    const my = mine(Y);
    let h = '<p class="rt-note">Which raw materials can be mined on each asteroid type. ' +
      '<span style="color:' + COL + '">●</span> = found on that type. Your rocks\' types are lit. Click a type or a material to highlight it.</p>';
    h += '<div class="rt-wrap"><table class="rt"><thead><tr><th>Raw material</th>';
    types.forEach((t) => {
      const c = (my[t.n] ? ' rt-mine' : '') + (S.col === t.n ? ' rt-sel' : '');
      const tip = my[t.n] ? 'Your rocks: ' + my[t.n].join(', ') : 'None of your rocks';
      h += '<th class="' + c.trim() + '" data-c="' + t.n + '" title="' + esc(tip) + '">' + t.n +
        '<small>' + (my[t.n] ? my[t.n].length + ' yours' : '&nbsp;') + '</small></th>';
    });
    h += '<th title="How many types have it">Types</th></tr></thead><tbody>';
    GROUPS.forEach(([g, ids]) => {
      h += '<tr class="rt-g"><td colspan="' + (types.length + 2) + '">' + g + '</td></tr>';
      ids.forEach((p) => {
        const n = types.filter((t) => t.r.has(p)).length;
        h += '<tr class="rt-r' + (S.row === p ? ' rt-on' : '') + '" data-r="' + p + '"><td>' + Y.ricon(p, 22) + esc(pn(p)) + '</td>';
        types.forEach((t) => {
          const y = t.r.has(p), c = (my[t.n] ? ' rt-mine' : '') + (S.col === t.n ? ' rt-sel' : '');
          h += '<td class="' + (y ? 'rt-y' : 'rt-n') + c + '" title="' + esc(pn(p)) + (y ? ' – yes on ' : ' – not on ') + t.n + '">' + (y ? '●' : '·') + '</td>';
        });
        h += '<td class="rt-cnt">' + n + '</td></tr>';
      });
    });
    h += '<tr class="rt-g"><td>Total</td>';
    types.forEach((t) => (h += '<td style="color:#c9d6e8">' + t.r.size + '</td>'));
    h += '<td></td></tr></tbody></table></div>';
    h += '<div class="rt-key"><span><b>Cms</b> and <b>Cis</b> hold the most (18 and 17)</span><span><b>I</b> holds volatiles only</span></div>';
    m.innerHTML = h;
    m.querySelectorAll('th[data-c]').forEach((th) => th.addEventListener('click', () => { S.col = S.col === th.dataset.c ? '' : th.dataset.c; page(m); }));
    m.querySelectorAll('tr[data-r]').forEach((tr) => tr.addEventListener('click', () => { S.row = S.row === +tr.dataset.r ? 0 : +tr.dataset.r; page(m); }));
  }

  // "Rock types" button in the Science Lab, after Resource map
  const hook = () => {
    const after = document.getElementById('vLL') || document.getElementById('vI'), main = document.getElementById('main');
    if (!after || !main || document.getElementById('vRT')) return;
    const b = document.createElement('button');
    b.id = 'vRT'; b.textContent = 'Rock types';
    after.after(b);
    b.addEventListener('click', () => {
      document.querySelectorAll('button.on').forEach((x) => x.classList.remove('on'));
      try { window.YIC.view = 'M'; } catch (e) {} // add-on page – app.js leaves #main alone
      b.className = 'on';
      page(main);
    });
  };
  document.addEventListener('click', (e) => {
    const b = document.getElementById('vRT'), t = e.target.closest && e.target.closest('button[id^="v"]');
    if (b && t && t !== b) b.className = '';
  }, true);
  setInterval(hook, 700);
})();
