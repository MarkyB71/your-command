/* SWAY balance – Skippy's Awesome Command Deck (Mark, 11 Nov 2026) – LIVE 11 Nov 2026 (tested on ?beta=1 – Mark)
   Shows the loaded wallet's SWAY just left of Deck controls on the decks, to help when buying across the belt.
   Read only: sway.php asks a public Starknet node for balanceOf on the SWAY token. Colours from the game's theme.js
   (backgroundMain #0e2933, brightMain #57d5ff, mainText #cccccc). Click the pill to read it again. */
(function () {
  let wallet = '', sway = null, busy = false, last = 0;

  const st = document.createElement('style');
  st.id = 'sw-css'; // app.js rewrites <head> after loading, so draw() puts this back if it goes
  st.textContent = '#dktools #swbal{order:-1!important;background:#0e2933!important;color:#cccccc!important;border:1px solid #57d5ff!important;border-radius:8px!important;box-shadow:0 0 8px rgba(87,213,255,.2)!important;font-family:ui-monospace,Menlo,monospace!important;cursor:pointer}' +
    '#dktools #swbal b{color:#57d5ff;font-weight:600}#dktools #swbal:hover,#dktools #swbal:focus-visible{box-shadow:0 0 14px rgba(87,213,255,.45)!important}';

  // the game's own SWAY icon (influence-client src/assets/icons/SwayIcon.svg)
  const ICON = '<svg viewBox="0 0 64 64" width="15" height="15" aria-hidden="true" style="vertical-align:-3px;margin-right:4px"><path fill="currentColor" d="M47.84,26.11l-7.39-7.39v4.89l4.95,4.95c.94,.94,1.46,2.2,1.46,3.53s-.52,2.59-1.46,3.53l-21.81,21.81v4.89l24.25-24.25c1.6-1.6,2.47-3.72,2.47-5.97s-.88-4.38-2.47-5.97Z"/><path fill="currentColor" d="M23.58,40.46l-4.98-4.98c-.94-.94-1.46-2.2-1.46-3.53s.52-2.59,1.46-3.53L40.44,6.58V1.69L16.16,25.98c-1.6,1.6-2.47,3.72-2.47,5.97s.88,4.38,2.47,5.97l7.42,7.42v-4.89Z"/><path fill="currentColor" d="M26.56,24.47h13.02v13.02c0,1.08-.87,1.95-1.95,1.95h-13.02v-13.02c0-1.08,.87-1.95,1.95-1.95Z" transform="translate(-13.19 32.05) rotate(-45)"/><path fill="#36a7cd" d="M41.3,33.33l-4.6,4.6-4.6,4.6-4.6-4.6-4.6-4.6c-.38-.38-.57-.88-.57-1.38s.19-1,.57-1.38l4.6-4.6,4.6-4.6,4.6,4.6,4.6,4.6c.38,.38,.57,.88,.57,1.38s-.19,1-.57,1.38Z"/></svg>';
  const fmt = (n) => n >= 1e6 ? (n / 1e6).toLocaleString('en-GB', { maximumFractionDigits: 2 }) + 'M' : Math.floor(n).toLocaleString('en-GB');

  function load(force) {
    if (!wallet || busy || (!force && Date.now() - last < 300000)) return;
    busy = true;
    fetch('sway.php?wallet=' + encodeURIComponent(wallet)).then((r) => r.json()).then((j) => {
      if (j && typeof j.sway === 'number') sway = j.sway;
    }).catch(() => {}).finally(() => { busy = false; last = Date.now(); draw(); });
  }

  function draw() {
    if (!document.getElementById('sw-css')) document.head.appendChild(st);
    const tray = document.getElementById('dktools'), wc = document.getElementById('wc-top');
    let b = document.getElementById('swbal');
    if (!tray || !wc || !wallet) { if (b) b.remove(); return; }
    if (!b) {
      b = document.createElement('button');
      b.id = 'swbal';
      b.type = 'button';
      b.onclick = (e) => { e.stopPropagation(); sway = null; draw(); load(true); };
    }
    const dc = document.getElementById('cl-dc'); // just left of Deck controls – Mark 11 Nov (same order, placed before it)
    if (dc && dc.parentNode === tray) { if (b.nextElementSibling !== dc) tray.insertBefore(b, dc); } else if (b.parentNode !== tray) tray.prepend(b);
    // Deck controls in the middle of the bar, SWAY just to its left (Mark 11 Nov). The tool row is right-aligned,
    // so a gap after Deck controls slides both left; only when the row is on one line and there is room.
    if (dc && dc.parentNode === tray) {
      const bar = tray.parentNode.getBoundingClientRect(), pg = [...tray.parentNode.children].filter((c) => c !== tray && c.offsetParent).pop();
      const cur = parseFloat(dc.style.marginRight) || 0, r = dc.getBoundingClientRect();
      let want = Math.max(0, cur + (r.left + r.width / 2) - (bar.left + bar.width / 2));
      const oneLine = !pg || Math.abs(tray.getBoundingClientRect().top - pg.getBoundingClientRect().top) < 20;
      if (!oneLine) want = 0;
      else if (pg) want = Math.min(want, cur + b.getBoundingClientRect().left - pg.getBoundingClientRect().right - 16);
      want = Math.max(0, Math.round(want));
      if (Math.abs(want - cur) > 1) dc.style.setProperty('margin-right', want + 'px', 'important');
    }
    const t = sway === null ? (busy ? '… SWAY' : '– SWAY') : fmt(sway) + ' SWAY';
    if (b.dataset.t !== t) { b.dataset.t = t; b.innerHTML = ICON + t; }
    b.title = sway === null ? 'SWAY balance (click to read again)' : 'SWAY in this wallet: ' + sway.toLocaleString('en-GB', { maximumFractionDigits: 6 }) + ' – click to read again';
  }

  setInterval(() => {
    const w = String((window.YIC && window.YIC.D && window.YIC.D.wallet) || '').toLowerCase();
    if (!/^0x[0-9a-f]{6,}$/.test(w)) { wallet = ''; draw(); return; }
    if (w !== wallet) { wallet = w; sway = null; last = 0; }
    load(false); // every 5 minutes
    draw();
  }, 1000);
})();
