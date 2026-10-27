/* Science Lab look – Skippy's Command Deck (test on ?beta=1, 27 Oct 2026)
   A specimen rack above every Science Lab page: each of your rocks in its own glass tube,
   with its picture, spectral type, untouched core samples and a scanned / not scanned light.
   Click a tube to pick that rock in the asteroid box (click again for all asteroids).
   Below it the page sits on a teal lab console (body.dk-sci). */
(function () {
  'use strict';
  if (!window.YICDECKS) return;
  const COL = '#4f90ff';
  const CSS = `
body.dk-sci #main{border:1px solid rgba(79,144,255,.3);border-top:3px solid ${COL};border-radius:0 0 14px 14px;background:linear-gradient(180deg,rgba(79,144,255,.06),rgba(5,7,10,0) 220px),repeating-linear-gradient(90deg,rgba(79,144,255,.03) 0 1px,transparent 1px 48px),#06080e;box-shadow:inset 0 0 40px -18px ${COL},0 0 26px -14px ${COL};margin:0 16px 20px!important}
body.dk-sci #main h2,body.dk-sci #main th{color:#b0cdff}
#deckhero[data-deck="sci"]{margin:14px 16px 0;position:relative;padding:30px 14px 0;background:radial-gradient(ellipse at 50% 0,rgba(79,144,255,.10),rgba(0,0,0,0) 60%),linear-gradient(180deg,#121a2a,#090c14);border:1px solid #212c42;border-bottom:0;border-radius:10px 10px 0 0}
.sl-plate{position:absolute;left:50%;top:0;transform:translateX(-50%);padding:3px 24px 4px;background:#090c14;clip-path:polygon(0 0,100% 0,92% 100%,8% 100%);font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.4em;color:#b0cdff;text-shadow:0 0 8px rgba(79,144,255,.8);white-space:nowrap}
.sl-read{position:absolute;left:16px;top:6px;font:600 11px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.08em;color:#b0cdff;text-transform:uppercase}
.sl-read b{color:#e6ebf2}
.sl-hint{position:absolute;right:16px;top:6px;font:11px system-ui,sans-serif;color:#7f8ea8}
.sl-row{display:flex;gap:22px;justify-content:center;overflow-x:auto;padding:6px 4px 0;scrollbar-width:thin}
.sl-t{all:unset;box-sizing:border-box;cursor:pointer;flex:0 0 150px;display:flex;flex-direction:column;align-items:center;position:relative}
.sl-cap{width:92px;height:16px;border-radius:3px 3px 1px 1px;background:linear-gradient(90deg,#33404f,#5c6a80 45%,#33404f);border:1px solid #1c2436}
.sl-glass{position:relative;width:84px;height:176px;margin-top:-1px;border:1px solid rgba(176,205,255,.35);border-top:0;border-radius:0 0 42px 42px;background:linear-gradient(90deg,rgba(255,255,255,.07),rgba(255,255,255,0) 35%,rgba(255,255,255,0) 70%,rgba(255,255,255,.05)),#05070c;overflow:hidden;transition:box-shadow .2s,border-color .2s}
.sl-liq{position:absolute;left:0;right:0;bottom:0;height:52%;background:linear-gradient(180deg,rgba(79,144,255,.10),rgba(79,144,255,.35));border-top:1px solid rgba(176,205,255,.55)}
.sl-rock{position:absolute;left:50%;top:50%;width:96px;height:96px;transform:translate(-50%,-50%);background:#000 no-repeat 50% 50%/cover;border-radius:50%;mix-blend-mode:screen;-webkit-mask:radial-gradient(circle,#000 55%,transparent 72%);mask:radial-gradient(circle,#000 55%,transparent 72%);animation:slBob 6s ease-in-out infinite}
.sl-t:nth-child(2n) .sl-rock{animation-delay:-2s}.sl-t:nth-child(3n) .sl-rock{animation-delay:-4s}
@keyframes slBob{50%{transform:translate(-50%,-56%)}}
.sl-bub{position:absolute;bottom:4px;width:4px;height:4px;border-radius:50%;background:rgba(176,205,255,.6);animation:slUp 4s linear infinite}
@keyframes slUp{to{transform:translateY(-88px);opacity:0}}
.sl-led{position:absolute;top:22px;right:7px;width:10px;height:10px;border-radius:50%;background:var(--led);box-shadow:0 0 8px var(--led)}
.sl-t:hover .sl-glass,.sl-t:focus-visible .sl-glass{border-color:${COL};box-shadow:0 0 16px -2px ${COL}}
.sl-t.on .sl-glass{border-color:${COL};box-shadow:0 0 22px 0 ${COL}}
.sl-t.on .sl-cap{background:${COL}}
.sl-lb{margin-top:6px;max-width:150px;text-align:center;font:600 14px/1.3 system-ui,sans-serif;color:#d9e6ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sl-t.on .sl-lb{color:${COL}}
.sl-sp{display:inline-block;margin-top:3px;padding:1px 7px;border:1px solid rgba(79,144,255,.45);border-radius:9px;font:600 12px system-ui,sans-serif;color:#b0cdff}
.sl-sm{margin-top:3px;font:12.5px system-ui,sans-serif;color:#8c9bb5;white-space:nowrap}
.sl-shelf{height:14px;margin:8px -14px 0;background:linear-gradient(180deg,#1d263a,#090c14);border-top:2px solid ${COL};box-shadow:0 -2px 14px -2px ${COL}}
@media (max-width:700px){.sl-hint,.sl-read{display:none}.sl-row{justify-content:flex-start}}
@media (prefers-reduced-motion:reduce){.sl-rock,.sl-bub{animation:none}.sl-bub{display:none}.sl-glass{transition:none}}
`;

  function addCss() {
    if (document.getElementById('sl-css')) return;
    const s = document.createElement('style');
    s.id = 'sl-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // Your rocks: every asteroid in the asteroid box, plus owned/controlled ones not in it
  function rocks(Y) {
    const D = Y.D, own = {};
    (D.owned || []).forEach((a) => (own[+a.id] = a));
    const list = (Y.asts || []).map((a, i) => ({ id: +a.id, name: a.name, i }));
    (D.owned || []).forEach((a) => {
      if (!list.some((x) => x.id === +a.id)) list.push({ id: +a.id, name: (a.Name && a.Name.name) || 'Asteroid #' + a.id, i: -1 });
    });
    list.forEach((x) => {
      const c = own[x.id] && own[x.id].Celestial;
      x.sp = c && Y.SPEC && Y.SPEC[c.celestialType] ? Y.SPEC[c.celestialType][0] : x.id === 1 ? 'Home' : '';
      x.scan = c ? (c.scanStatus || 0) >= 4 : null;
    });
    return list;
  }

  function hero(el) {
    addCss();
    const Y = window.YIC;
    if (!Y || !Y.D) return;
    const esc = Y.esc;
    const list = rocks(Y);
    let counts = null;

    function draw() {
      const box = document.getElementById('ast');
      const sel = box ? box.value : '';
      if (Y.SAMP && Y.SAMP.rows) {
        counts = {};
        Y.SAMP.rows.forEach((r) => (counts[r[4]] = (counts[r[4]] || 0) + 1));
      }
      const scanned = list.filter((x) => x.scan).length;
      const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : null;
      el.innerHTML =
        '<div class="sl-plate">SCIENCE LAB</div>' +
        '<div class="sl-read"><b>' + list.length + '</b> rocks · <b>' + scanned + '</b> scanned' +
        (total != null ? ' · <b>' + total.toLocaleString() + '</b> untouched samples' : '') + '</div>' +
        '<div class="sl-hint">Click a tube to pick that rock</div>' +
        '<div class="sl-row">' +
        list.map((x, n) => {
          const on = x.i >= 0 && String(x.i) === sel;
          const led = x.scan == null ? '#5b6677' : x.scan ? COL : '#ffab3d';
          const sm = counts ? (counts[x.name] || 0) : null;
          return '<button class="sl-t' + (on ? ' on' : '') + '" data-i="' + x.i + '" title="' + esc(x.name) +
            (x.scan == null ? '' : x.scan ? ' – scanned' : ' – not scanned yet') + (x.i < 0 ? ' (nothing of yours here yet)' : '') + '">' +
            '<span class="sl-cap"></span><span class="sl-glass"><span class="sl-liq"></span>' +
            '<span class="sl-rock" style="background-image:url(aimg.php?id=' + x.id + '&s=1)"></span>' +
            '<span class="sl-bub" style="left:' + (20 + (n * 13) % 42) + 'px;animation-delay:-' + (n % 4) + 's"></span>' +
            '<span class="sl-led" style="--led:' + led + '"></span></span>' +
            '<span class="sl-lb">' + esc(x.name) + '</span>' +
            (x.sp ? '<span class="sl-sp">' + esc(x.sp) + '</span>' : '') +
            '<span class="sl-sm">' + (sm == null ? '&nbsp;' : sm.toLocaleString() + ' sample' + (sm === 1 ? '' : 's')) + '</span>' +
            '</button>';
        }).join('') +
        '</div><div class="sl-shelf"></div>';
    }
    draw();

    el.addEventListener('click', (e) => {
      const t = e.target.closest('[data-i]');
      const box = document.getElementById('ast');
      if (!t || !box || +t.dataset.i < 0) return;
      box.value = box.value === t.dataset.i ? '' : t.dataset.i;
      box.dispatchEvent(new Event('change'));
      draw();
    });
    const box = document.getElementById('ast');
    if (box) box.addEventListener('change', () => el.isConnected && draw());

    // Untouched core samples per rock (same loader as the Core Samples page)
    if (!Y.SAMP && Y.D.wallet) {
      if (!Y.sampLoad)
        Y.sampLoad = fetch('samples.php?wallet=' + encodeURIComponent(Y.D.wallet), { cache: 'no-store' })
          .then((r) => r.json())
          .then((j) => {
            if (j.error) throw new Error(j.error);
            Y.SAMP = j;
          })
          .catch((e) => (Y.SAMP = { err: (e && e.message) || 'error' }))
          .finally(() => {
            Y.sampLoad = null;
            if (Y.view === 'X') Y.draw();
          });
      Y.sampLoad.then(() => el.isConnected && draw());
    }
  }

  window.YICDECKHERO = window.YICDECKHERO || {};
  window.YICDECKHERO.sci = hero;
})();
