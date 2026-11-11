/* Spectral Type Raws (was Rock types) – Your Influence Command (Mark, 10 Nov 2026) – TEST ONLY on ?beta=1
   Science Lab page: which of the 22 raw materials can be mined on each asteroid type
   (C, Cm, Ci, Cs, Cms, Cis, S, Sm, Si, M, I). Data: app.js SPEC (same as the Supply chain page).
   Layout (Mark, 11 Nov): type buttons on top (pick several), raw materials below in rows by group,
   lit in the game's resource colours when found on the picked types. Click a raw = types that have it get a white ring.
   To go live: remove the BETA line here and in decks.js, add a CHANGELOG line and a Help page entry. */
(function () {
  'use strict';
  const BETA = /[?&]beta=1\b/.test(location.search);
  if (!BETA) return;

  // Game colours (influence-client theme.js resources – same as the Resource map)
  const GROUPS = [
    ['Volatiles', '#5bc0f5', [1, 2, 3, 4, 5, 6, 7, 8]],
    ['Organics', '#68d346', [9, 10, 11]],
    ['Metals', '#f8852c', [12, 13, 14, 18, 19, 20, 21]],
    ['Rare Earth', '#f63637', [16, 17]],
    ['Fissiles', '#8a1aff', [15, 22]],
  ];
  const COL = '#4f90ff'; // Scientist blue – the Science Lab colour
  const S = { sel: new Set(), raw: 0 };

  const CSS = `.rt-h{color:#c9d6e8;font-size:15px;font-weight:600;margin:4px 0 2px}
.rt-note{color:#8b9ab0;font-size:13px;margin:0 0 10px}
.rt-types{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 18px;align-items:center}
.rt-t{all:unset;cursor:pointer;box-sizing:border-box;min-width:64px;padding:8px 10px 6px;border-radius:10px;border:1px solid #2a3648;background:#0d1520;text-align:center;color:#c9d6e8;font-weight:600;font-size:15px}
.rt-t:hover{border-color:${COL}}
.rt-t.on{border-color:${COL};background:rgba(79,144,255,.18);box-shadow:0 0 12px -2px ${COL}}
.rt-t.hit{border-color:#fff;box-shadow:0 0 12px -2px #fff}
.rt-t .d{display:flex;gap:3px;justify-content:center;margin-top:5px}
.rt-t .d i{width:7px;height:7px;border-radius:50%;opacity:.9}
.rt-t small{display:block;font-size:10px;font-weight:400;color:${COL};margin-top:3px;min-height:12px}
.rt-clr{all:unset;cursor:pointer;color:#8b9ab0;font-size:13px;padding:6px 10px;border:1px solid #2a3648;border-radius:8px}
.rt-sum{color:#c9d6e8;font-size:14px;margin:0 0 10px}
.rt-g{display:grid;grid-template-columns:120px 1fr;gap:10px;align-items:center;padding:8px 10px;border-radius:10px;margin:0 0 6px;background:linear-gradient(90deg,color-mix(in srgb,var(--gc) 12%,transparent),transparent 70%)}
.rt-gn{color:color-mix(in srgb,var(--gc) 80%,#fff);font-weight:600;font-size:15px}
.rt-raws{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px}
.rt-r{all:unset;cursor:pointer;box-sizing:border-box;display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:8px;border:1px solid transparent;color:#5d6a7d;font-size:13px}
.rt-r img{opacity:.35}
.rt-r.yes{color:color-mix(in srgb,var(--gc) 75%,#fff);border-color:color-mix(in srgb,var(--gc) 70%,transparent);background:color-mix(in srgb,var(--gc) 10%,transparent)}
.rt-r.yes img{opacity:1}
.rt-r.all{color:#c9d6e8}
.rt-r.all img{opacity:.9}
.rt-r.pick{box-shadow:0 0 0 2px #fff inset}
@media (max-width:700px){.rt-g{grid-template-columns:1fr}}`;

  function css() {
    if (document.getElementById('rt-css')) return;
    const st = document.createElement('style');
    st.id = 'rt-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // your rocks' types (owned / controlled rocks)
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
    const types = Object.keys(SPEC).map((k) => ({ n: SPEC[k][0], r: new Set(SPEC[k][1]) }));
    const my = mine(Y);
    const sel = types.filter((t) => S.sel.has(t.n));
    const has = (p) => sel.some((t) => t.r.has(p));
    let h = '<div class="rt-h">Asteroid types</div><p class="rt-note">Pick one or more types to light up the raw materials that can be mined there. Pick a raw material to see which types have it.</p><div class="rt-types">';
    types.forEach((t) => {
      const tip = my[t.n] ? 'Your rocks: ' + my[t.n].join(', ') : '';
      const hit = S.raw && t.r.has(S.raw);
      h += '<button class="rt-t' + (S.sel.has(t.n) ? ' on' : '') + (hit ? ' hit' : '') + '" data-t="' + t.n + '" title="' + esc(tip) + '">' + t.n + '<span class="d">' +
        GROUPS.filter((g) => g[2].some((p) => t.r.has(p))).map((g) => '<i style="background:' + g[1] + '"></i>').join('') +
        '</span><small>' + (my[t.n] ? my[t.n].length + ' yours' : '') + '</small></button>';
    });
    if (S.sel.size || S.raw) h += '<button class="rt-clr" data-clr>Clear</button>';
    h += '</div>';
    const n = sel.length ? GROUPS.reduce((a, g) => a + g[2].filter(has).length, 0) : 0;
    h += '<div class="rt-h">Raw materials</div><p class="rt-sum">' + (sel.length ? esc(sel.map((t) => t.n).join(' + ')) + ': <b>' + n + ' of 22</b> raw materials can be mined' : 'All 22 raw materials – pick a type above') + '</p>';
    GROUPS.forEach(([g, c, ids]) => {
      h += '<div class="rt-g" style="--gc:' + c + '"><div class="rt-gn">' + g + '</div><div class="rt-raws">';
      ids.slice().sort((a, b) => pn(a).localeCompare(pn(b))).forEach((p) => {
        const cl = sel.length ? (has(p) ? ' yes' : '') : ' all';
        const on = types.filter((t) => t.r.has(p)).map((t) => t.n).join(', ');
        h += '<button class="rt-r' + cl + (S.raw === p ? ' pick' : '') + '" data-r="' + p + '" title="' + esc(pn(p)) + ' – found on ' + on + '">' + Y.ricon(p, 22).replace('margin-right:8px', 'margin-right:0') + esc(pn(p)) + '</button>';
      });
      h += '</div></div>';
    });
    m.innerHTML = h;
    m.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => { const k = b.dataset.t; S.sel.has(k) ? S.sel.delete(k) : S.sel.add(k); page(m); }));
    m.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => { S.raw = S.raw === +b.dataset.r ? 0 : +b.dataset.r; page(m); }));
    const c = m.querySelector('[data-clr]');
    if (c) c.addEventListener('click', () => { S.sel.clear(); S.raw = 0; page(m); });
  }

  // "Spectral type raws" button in the Science Lab, after Resource map
  const hook = () => {
    const after = document.getElementById('vLL') || document.getElementById('vI'), main = document.getElementById('main');
    if (!after || !main || document.getElementById('vRT')) return;
    const b = document.createElement('button');
    b.id = 'vRT'; b.textContent = 'Spectral type raws';
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
