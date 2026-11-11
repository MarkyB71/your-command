/* SWAY balance – Skippy's Awesome Command Deck (Mark, 11 Nov 2026) – TEST on ?beta=1
   Shows the loaded wallet's SWAY just left of Deck controls on the decks, to help when buying across the belt.
   Read only: sway.php asks a public Starknet node for balanceOf on the SWAY token. Colours from the game's theme.js
   (backgroundMain #0e2933, brightMain #57d5ff, mainText #cccccc). Click the pill to read it again. */
(function () {
  if (!/[?&]beta=1\b/.test(location.search)) return; // test only
  let wallet = '', sway = null, busy = false, last = 0;

  const st = document.createElement('style');
  st.textContent = '#dktools #swbal{order:-1!important;background:#0e2933!important;color:#cccccc!important;border:1px solid #57d5ff!important;border-radius:8px!important;box-shadow:0 0 8px rgba(87,213,255,.2)!important;font-family:ui-monospace,Menlo,monospace!important;cursor:pointer}' +
    '#dktools #swbal b{color:#57d5ff;font-weight:600}#dktools #swbal:hover,#dktools #swbal:focus-visible{box-shadow:0 0 14px rgba(87,213,255,.45)!important}';
  document.head.appendChild(st);

  const fmt = (n) => n >= 1e6 ? (n / 1e6).toLocaleString('en-GB', { maximumFractionDigits: 2 }) + 'M' : Math.floor(n).toLocaleString('en-GB');

  function load(force) {
    if (!wallet || busy || (!force && Date.now() - last < 300000)) return;
    busy = true;
    fetch('sway.php?wallet=' + encodeURIComponent(wallet)).then((r) => r.json()).then((j) => {
      if (j && typeof j.sway === 'number') sway = j.sway;
    }).catch(() => {}).finally(() => { busy = false; last = Date.now(); draw(); });
  }

  function draw() {
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
    const t = sway === null ? (busy ? '… SWAY' : '– SWAY') : fmt(sway) + ' SWAY';
    if (b.dataset.t !== t) { b.dataset.t = t; b.innerHTML = '<b>◈</b> ' + t; }
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
