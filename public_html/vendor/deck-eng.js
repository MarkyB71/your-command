/* Engineering look – Skippy's Command Deck (test on ?beta=1, 27 Oct 2026)
   A production floor control panel above every Engineering page: one big dial per kind of
   facility (Extractors, Refineries, Factories, Bioreactors, Shipyards) showing how many are
   working out of how many you have, plus fill dials for Warehouses and Tank Farms.
   Follows the asteroid box. Click a dial: production → Status page, storage → Contents page.
   Below it the page sits on an amber console (body.dk-eng). */
(function () {
  'use strict';
  if (!window.YICDECKS) return;
  const COL = '#ffab3d';
  const PROD = [[2, 'Extractors'], [3, 'Refineries'], [5, 'Factories'], [4, 'Bioreactors'], [6, 'Shipyards']];
  const STORE = [[1, 'Warehouses'], [10, 'Tank Farms']];
  const CSS = `
body.dk-eng #main{border:1px solid rgba(255,171,61,.3);border-top:3px solid ${COL};border-radius:0 0 14px 14px;background:linear-gradient(180deg,rgba(255,171,61,.06),rgba(5,7,10,0) 220px),repeating-linear-gradient(90deg,rgba(255,171,61,.03) 0 1px,transparent 1px 48px),#0b0907;box-shadow:inset 0 0 40px -18px ${COL},0 0 26px -14px ${COL};margin:0 16px 20px!important}
body.dk-eng #main h2,body.dk-eng #main th{color:#ffd29a}
#deckhero[data-deck="eng"]{margin:14px 16px 0;position:relative;padding:32px 14px 0;background:linear-gradient(180deg,#221a12,#0e0b08);border:1px solid #3a2c1c;border-bottom:0;border-radius:10px 10px 0 0}
.en-plate{position:absolute;left:50%;top:0;transform:translateX(-50%);padding:3px 24px 4px;background:#0e0b08;clip-path:polygon(0 0,100% 0,92% 100%,8% 100%);font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.4em;color:#ffd29a;text-shadow:0 0 8px rgba(255,171,61,.8);white-space:nowrap}
.en-read{position:absolute;left:16px;top:4px;font:600 11px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.08em;color:#ffd29a;text-transform:uppercase}
.en-read b{color:#e6ebf2}
.en-pick{all:unset;box-sizing:border-box;cursor:pointer;min-width:0!important;width:auto!important;margin-right:8px;padding:3px 22px 3px 8px;border:1px solid #5a4328;border-radius:4px;background:#0e0b08 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23ffab3d'/%3E%3C/svg%3E") no-repeat right 7px center;font:600 11px ui-monospace,Menlo,monospace;letter-spacing:.06em;color:#ffd29a;text-transform:uppercase}
.en-pick:hover,.en-pick:focus-visible{border-color:#ffab3d;box-shadow:0 0 8px -2px #ffab3d}
.en-pick option{background:#0e0b08;color:#e6ebf2;text-transform:none}
.en-hint{position:absolute;right:16px;top:7px;font:11px system-ui,sans-serif;color:#9c8a74}
.en-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;padding:4px 0 12px}
.en-sep{width:2px;align-self:stretch;margin:6px 4px;background:linear-gradient(180deg,transparent,#5a4328,transparent)}
.en-g{all:unset;box-sizing:border-box;cursor:pointer;width:150px;display:flex;flex-direction:column;align-items:center;padding:10px 8px 10px;border:1px solid #3a2c1c;border-radius:12px;background:radial-gradient(circle at 50% 40%,#1e1710,#0b0907 75%);box-shadow:inset 0 0 0 1px rgba(0,0,0,.5);transition:border-color .15s,box-shadow .15s}
.en-g:hover,.en-g:focus-visible{border-color:${COL};box-shadow:0 0 16px -3px ${COL},inset 0 0 0 1px rgba(0,0,0,.5)}
.en-g svg{width:118px;height:84px;display:block}
.en-arc{transition:stroke-dashoffset 1s ease-out}
.en-big{font:700 26px/1 system-ui,sans-serif;fill:#f2ede6}
.en-of{font:12px system-ui,sans-serif;fill:#9c8a74}
.en-n{margin-top:2px;font:700 12px/1.2 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#ffd29a}
.en-s{margin-top:4px;font:12px/1.35 system-ui,sans-serif;color:#b9a68f;text-align:center;min-height:32px}
.en-s b{font-weight:600}
.en-lamp{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px;vertical-align:0;background:var(--l);box-shadow:0 0 6px var(--l)}
.en-floor{height:14px;margin:0 -14px;background:repeating-linear-gradient(-45deg,#2a2014 0 12px,#0e0b08 12px 24px);border-top:2px solid ${COL};box-shadow:0 -2px 14px -2px ${COL}}
@media (max-width:700px){.en-hint,.en-sep{display:none}.en-read{position:static;margin:0 0 6px}.en-g{width:128px}.en-g svg{width:100px;height:72px}}
@media (prefers-reduced-motion:reduce){.en-arc,.en-g{transition:none}}
`;

  function addCss() {
    if (document.getElementById('en-css')) return;
    const s = document.createElement('style');
    s.id = 'en-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // Half-circle dial: value 0–1, colour
  function dial(v, col, big, of) {
    const R = 46, L = Math.PI * R, off = L * (1 - Math.max(0, Math.min(1, v)));
    const ticks = [];
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * (1 - i / 10), x1 = 60 + 52 * Math.cos(a), y1 = 62 - 52 * Math.sin(a), x2 = 60 + 57 * Math.cos(a), y2 = 62 - 57 * Math.sin(a);
      ticks.push('<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="#5a4328" stroke-width="' + (i % 5 ? 1 : 2) + '"/>');
    }
    return '<svg viewBox="0 0 120 84" aria-hidden="true">' + ticks.join('') +
      '<path d="M14 62 A46 46 0 0 1 106 62" fill="none" stroke="#2a2118" stroke-width="10" stroke-linecap="round"/>' +
      '<path class="en-arc" d="M14 62 A46 46 0 0 1 106 62" fill="none" stroke="' + col + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + L.toFixed(1) + '" stroke-dashoffset="' + (v > 0 ? off.toFixed(1) : L.toFixed(1)) + '" style="filter:drop-shadow(0 0 4px ' + col + ')"/>' +
      '<text class="en-big" x="60" y="60" text-anchor="middle">' + big + '</text>' +
      '<text class="en-of" x="60" y="78" text-anchor="middle">' + of + '</text></svg>';
  }

  function hero(el) {
    addCss();
    const Y = window.YIC;
    if (!Y || !Y.D) return;
    const now = Date.now() / 1000;
    const astOf = (b) => {
      const l = ((b.Location && b.Location.locations) || []).find((x) => x.label === 3);
      return (b.meta && b.meta.asteroid && b.meta.asteroid.name) || (l ? 'Asteroid #' + l.id : '?');
    };
    const running = (b) =>
      ['Extractors', 'Processors', 'DryDocks'].some((k) => (b[k] || []).some((x) => x.status === 1));

    function draw() {
      const box = document.getElementById('ast');
      const ai = box ? box.value : '';
      const an = ai === '' || !Y.asts[+ai] ? null : Y.asts[+ai].name;
      const P = {}, S = {};
      PROD.forEach(([t]) => (P[t] = { op: 0, run: 0, done: 0, build: 0 }));
      STORE.forEach(([t]) => (S[t] = { n: 0, mass: 0, cap: 0, f: 0 }));
      (Y.D.allB || []).forEach((b) => {
        const B = b.Building || {}, t = B.buildingType;
        if (an && astOf(b) !== an) return;
        if (P[t]) {
          if (B.status === 2) P[t].build++;
          if (B.status !== 3) return;
          P[t].op++;
          if (running(b)) {
            P[t].run++;
            if (['Extractors', 'Processors', 'DryDocks'].some((k) => (b[k] || []).some((x) => x.status === 1 && x.finishTime <= now))) P[t].done++;
          }
        } else if (S[t] && B.status === 3) {
          const inv = (b.Inventories || []).find((i) => Y.SCAP[i.inventoryType]);
          if (!inv) return;
          const c = Y.SCAP[inv.inventoryType];
          S[t].n++;
          S[t].mass += inv.mass || 0;
          S[t].cap += c[0];
          S[t].f = Math.max(S[t].f, (inv.mass || 0) / c[0], (inv.volume || 0) / c[1]);
        }
      });
      let tot = 0, run = 0, idle = 0;
      const prod = PROD.map(([t, nm]) => {
        const p = P[t];
        tot += p.op;
        run += p.run;
        idle += p.op - p.run;
        const v = p.op ? p.run / p.op : 0;
        const col = !p.op ? '#5a4328' : v >= 0.75 ? '#3fd68a' : v >= 0.4 ? COL : '#ff6b6b';
        const lines = [];
        if (p.op - p.run) lines.push('<span class="en-lamp" style="--l:#ff6b6b"></span><b style="color:#ff8a8a">' + (p.op - p.run) + ' idle</b>');
        if (p.done) lines.push('<span class="en-lamp" style="--l:#3fd68a"></span>' + p.done + ' ready to collect');
        if (p.build) lines.push(p.build + ' being built');
        if (!p.op && !p.build) lines.push('None yet');
        if (p.op && p.op === p.run && !p.done) lines.push('<span class="en-lamp" style="--l:#3fd68a"></span>All working');
        return '<button class="en-g" data-go="T" title="' + Y.esc(nm) + ' – open Building Status">' +
          dial(v, col, p.run, 'working of ' + p.op) + '<span class="en-n">' + Y.esc(nm) + '</span><span class="en-s">' + lines.join('<br>') + '</span></button>';
      }).join('');
      const store = STORE.map(([t, nm]) => {
        const s = S[t], pct = s.cap ? s.mass / s.cap : 0;
        const col = !s.n ? '#5a4328' : s.f >= 0.9 ? '#ff6b6b' : s.f >= 0.75 ? COL : '#5b9dff';
        return '<button class="en-g" data-go="B" title="' + Y.esc(nm) + ' – open Building Contents">' +
          dial(pct, col, s.n ? Math.round(pct * 100) + '%' : '–', s.n ? 'full · ' + s.n + ' building' + (s.n > 1 ? 's' : '') : 'none') +
          '<span class="en-n">' + Y.esc(nm) + '</span><span class="en-s">' +
          (s.n ? 'Fullest ' + Math.round(s.f * 100) + '%' + (s.f >= 0.75 ? ' <span class="en-lamp" style="--l:' + col + '"></span>' : '') : 'None yet') + '</span></button>';
      }).join('');
      el.innerHTML =
        '<div class="en-plate">ENGINEERING</div>' +
        '<div class="en-read"><select class="en-pick" aria-label="Which rock"><option value="">All rocks</option>' +
        (Y.asts || []).map((a, i) => '<option value="' + i + '"' + (String(i) === ai ? ' selected' : '') + '>' + Y.esc(a.name) + '</option>').join('') +
        '</select> <b>' + run + '</b> working · <b style="color:#ff8a8a">' + idle + '</b> idle · of <b>' + tot + '</b></div>' +
        '<div class="en-hint">Click a dial to see those buildings</div>' +
        '<div class="en-row">' + prod + '<span class="en-sep"></span>' + store + '</div><div class="en-floor"></div>';
    }
    draw();
    el.addEventListener('change', (e) => {
      const p = e.target.closest('.en-pick'), box = document.getElementById('ast');
      if (!p || !box) return;
      box.value = p.value;
      box.dispatchEvent(new Event('change'));
    });
    el.addEventListener('click', (e) => {
      const t = e.target.closest('[data-go]');
      const b = t && document.getElementById('v' + t.dataset.go);
      if (b) b.click();
    });
    const box = document.getElementById('ast');
    if (box) box.addEventListener('change', () => el.isConnected && draw());
  }

  window.YICDECKHERO = window.YICDECKHERO || {};
  window.YICDECKHERO.eng = hero;
})();
