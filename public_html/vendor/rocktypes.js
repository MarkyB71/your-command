/* Spectral Type Raws (was Rock types) – Your Influence Command (Mark, 10 Nov 2026) – LIVE 11 Nov 2026 (tested on ?beta=1 – Mark)
   Science Lab page: which of the 22 raw materials can be mined on each asteroid type
   (C, Cm, Ci, Cs, Cms, Cis, S, Sm, Si, M, I). Data: app.js SPEC (same as the Supply chain page).
   Layout (Mark, 11 Nov): type buttons on top (pick several), raw materials below in rows by group,
   lit in the game's resource colours when found on the picked types. Click a raw = types that have it get a white ring.
 */
(function () {
  'use strict';
  // LIVE 11 Nov 2026 (tested on ?beta=1 – Mark)

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
.rt-types{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 18px;align-items:center}
.rt-t{all:unset;cursor:pointer;box-sizing:border-box;width:76px;display:flex;flex-direction:column;align-items:center;color:#c9d6e8;font-weight:600;font-size:14px;text-align:center}
.rt-t svg{display:block;width:70px;height:78px;overflow:visible;transition:filter .2s,transform .2s}
.rt-t:hover svg{transform:translateY(-3px)}
.rt-dome{fill:rgba(140,170,210,.06);stroke:rgba(160,185,215,.35);stroke-width:1.5}
.rt-shine{fill:none;stroke:rgba(255,255,255,.35);stroke-width:2;stroke-linecap:round}
.rt-base{fill:#2a3646}.rt-plate{fill:#121a26;stroke:#3a4658}
.rt-lab{fill:#c9d6e8;font:600 12px system-ui,sans-serif;text-anchor:middle}
.rt-rock{transform-origin:35px 36px}
.rt-t.on .rt-dome{fill:rgba(79,144,255,.16);stroke:${COL}}
.rt-t.on svg{filter:drop-shadow(0 0 8px ${COL})}
.rt-t.on .rt-plate{stroke:${COL}}.rt-t.on .rt-lab{fill:#fff}
.rt-t.on .rt-rock{animation:rtspin 14s linear infinite}
.rt-t.hit .rt-dome{stroke:#fff;stroke-width:2.5}
.rt-t.hit svg{filter:drop-shadow(0 0 8px rgba(255,255,255,.7))}
@keyframes rtspin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.rt-t.on .rt-rock{animation:none}}
.rt-t small{display:block;font-size:10px;font-weight:400;color:${COL};margin-top:2px;min-height:12px}
.rt-clr{all:unset;cursor:pointer;color:#8b9ab0;font-size:13px;padding:6px 10px;border:1px solid #2a3648;border-radius:8px}
.rt-sum{color:#c9d6e8;font-size:14px;margin:0 0 10px}
.rt-g{display:grid;grid-template-columns:110px 1fr;gap:10px;align-items:center;padding:8px 10px;border-radius:10px;margin:0 0 6px;background:linear-gradient(90deg,color-mix(in srgb,var(--gc) 12%,transparent),transparent 70%)}
.rt-gn{color:color-mix(in srgb,var(--gc) 80%,#fff);font-weight:600;font-size:15px}
.rt-raws{display:flex;flex-wrap:wrap;gap:6px 4px;align-items:flex-start}
.rt-r{all:unset;cursor:pointer;box-sizing:border-box;width:86px;display:flex;flex-direction:column;align-items:center;gap:4px;padding:4px 2px;border-radius:8px;color:#5d6a7d;font-size:12px;text-align:center;line-height:1.2}
.rt-r:hover{background:rgba(255,255,255,.04)}
.rt-tube{position:relative;width:30px;height:78px}
.rt-cap{position:absolute;left:-3px;right:-3px;top:0;height:8px;border-radius:3px;background:linear-gradient(180deg,#56657a,#2a3646)}
.rt-glass{position:absolute;left:0;right:0;top:7px;bottom:0;border:2px solid rgba(160,185,215,.28);border-top:0;border-radius:0 0 15px 15px;overflow:hidden;background:linear-gradient(90deg,rgba(255,255,255,.07),transparent 40%,rgba(255,255,255,.04))}
.rt-liq{position:absolute;left:0;right:0;bottom:0;height:0;transition:height .5s ease;background:linear-gradient(90deg,color-mix(in srgb,var(--gc) 75%,#000),var(--gc) 45%,color-mix(in srgb,var(--gc) 70%,#000));box-shadow:0 0 14px var(--gc)}
.rt-liq::before{content:'';position:absolute;left:0;right:0;top:0;height:3px;background:color-mix(in srgb,var(--gc) 50%,#fff);opacity:.8}
.rt-liq i{position:absolute;bottom:-6px;width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.6);animation:rtbub 2.6s infinite ease-in}
.rt-liq i:nth-child(2){left:16px;animation-delay:1.1s;width:3px;height:3px}
.rt-liq i:nth-child(3){left:8px;animation-delay:1.9s}
.rt-liq i:nth-child(1){left:5px}
@keyframes rtbub{0%{transform:translateY(0);opacity:0}15%{opacity:.8}100%{transform:translateY(-50px);opacity:0}}
@media (prefers-reduced-motion:reduce){.rt-liq i{animation:none;display:none}.rt-liq{transition:none}}
.rt-ico{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);z-index:1}
.rt-ico img{width:20px;height:20px;opacity:.3;filter:grayscale(1)}
.rt-r.yes,.rt-r.all{color:#c9d6e8}
.rt-r.yes{color:color-mix(in srgb,var(--gc) 70%,#fff)}
.rt-r.yes .rt-liq{height:72%}
.rt-r.all .rt-liq{height:40%;opacity:.55;box-shadow:none}
.rt-r.yes .rt-ico img,.rt-r.all .rt-ico img{opacity:1;filter:drop-shadow(0 0 2px #000)}
.rt-r.yes .rt-glass{border-color:color-mix(in srgb,var(--gc) 60%,transparent)}
.rt-r.pick .rt-glass{border-color:#fff;box-shadow:0 0 10px rgba(255,255,255,.5)}
.rt-r.pick{color:#fff}
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

  // a lumpy rock under a glass dome, with mineral flecks in the colours of the groups found on that type
  function jar(t, i) {
    let seed = 7 + i * 131;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const pts = [];
    for (let k = 0; k < 11; k++) {
      const a = (k / 11) * Math.PI * 2, r = 13 + rnd() * 6;
      pts.push((35 + Math.cos(a) * r).toFixed(1) + ',' + (36 + Math.sin(a) * r * 0.85).toFixed(1));
    }
    const cols = GROUPS.filter((g) => g[2].some((p) => t.r.has(p))).map((g) => g[1]);
    let fl = '';
    for (let k = 0; k < 12; k++) {
      const a = rnd() * Math.PI * 2, r = rnd() * 10;
      fl += '<circle cx="' + (35 + Math.cos(a) * r).toFixed(1) + '" cy="' + (36 + Math.sin(a) * r * 0.8).toFixed(1) + '" r="' + (1.3 + rnd() * 1.3).toFixed(1) + '" fill="' + cols[k % cols.length] + '"/>';
    }
    return '<svg viewBox="0 0 70 78" aria-hidden="true"><defs><radialGradient id="rtg' + i + '" cx=".35" cy=".3"><stop offset="0" stop-color="#7d7268"/><stop offset="1" stop-color="#2e2924"/></radialGradient></defs>' +
      '<path class="rt-dome" d="M8 58 V34 A27 27 0 0 1 62 34 V58 Z"/>' +
      '<g class="rt-rock"><polygon points="' + pts.join(' ') + '" fill="url(#rtg' + i + ')" stroke="#1a1612"/>' + fl + '</g>' +
      '<path class="rt-shine" d="M15 30 A21 21 0 0 1 27 14"/>' +
      '<rect class="rt-base" x="4" y="57" width="62" height="5" rx="2"/><rect class="rt-plate" x="14" y="63" width="42" height="15" rx="3"/>' +
      '<text class="rt-lab" x="35" y="74.5">' + t.n + '</text></svg>';
  }

  function page(m) {
    css();
    const Y = window.YIC, esc = Y.esc, pn = Y.pn, SPEC = Y.SPEC;
    const types = Object.keys(SPEC).map((k) => ({ n: SPEC[k][0], r: new Set(SPEC[k][1]) }));
    const my = mine(Y);
    const sel = types.filter((t) => S.sel.has(t.n));
    const has = (p) => sel.some((t) => t.r.has(p));
    let h = '<div class="rt-h">Asteroid types</div><p class="rt-note">Pick one or more types to light up the raw materials that can be mined there. Pick a raw material to see which types have it.</p><div class="rt-types">';
    types.forEach((t, i) => {
      const tip = my[t.n] ? 'Your rocks: ' + my[t.n].join(', ') : '';
      const hit = S.raw && t.r.has(S.raw);
      h += '<button class="rt-t' + (S.sel.has(t.n) ? ' on' : '') + (hit ? ' hit' : '') + '" data-t="' + t.n + '" title="' + esc(t.n + '-type' + (tip ? ' – ' + tip : '')) + '">' + jar(t, i) +
        '<small>' + (my[t.n] ? my[t.n].length + ' yours' : '') + '</small></button>';
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
        h += '<button class="rt-r' + cl + (S.raw === p ? ' pick' : '') + '" data-r="' + p + '" title="' + esc(pn(p)) + ' – found on ' + on + '">' +
          '<span class="rt-tube"><span class="rt-cap"></span><span class="rt-glass"><span class="rt-liq"><i></i><i></i><i></i></span></span><span class="rt-ico">' + Y.ricon(p, 20).replace('margin-right:8px;', '') + '</span></span>' +
          '<span>' + esc(pn(p)) + '</span></button>';
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
