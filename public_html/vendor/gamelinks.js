// Game links – "in game ↗" links next to buildings, crews, ships and lots.
// They only appear when the "Your Command – Game Links" browser extension is
// installed (it marks the page with data-yic-game-ext). Clicking one asks the
// extension to move the player's open game tab there, without a reload.
// While testing, links also need ?beta=1 in the address.
(function () {
  var GAME = 'https://game.influenceth.io';
  var OK = /^\/(building|lot|ship|asteroids|crew|crewmate)\/\d+$/;

  function on() {
    return !!document.documentElement.dataset.yicGameExt;
  }

  // GL('/building/123', 'Open this building in the game') → small link HTML, or ''.
  function GL(path, title) {
    if (!on() || !OK.test(path)) return '';
    return ' <a class="yicg" href="' + GAME + path + '" data-yicg="' + path +
      '" target="influencegame" title="' + (title || 'Open in the game') +
      ' (moves your open game tab, no reload)">in game ↗</a>';
  }
  GL.on = on;
  window.GL = GL;

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-yicg]');
    if (!a || !document.documentElement.dataset.yicGameExt) return;
    e.preventDefault();
    e.stopPropagation();
    window.postMessage({ type: 'yic-open', path: a.dataset.yicg }, location.origin);
  }, true);

  // Style (re-added if the site rebuilds <head>).
  var CSS = 'a.yicg{display:inline-block;white-space:nowrap;font-size:12px;font-weight:normal;' +
    'color:#8fe3ff;border:1px solid #2b5a72;border-radius:10px;padding:0 7px;margin-left:6px;' +
    'line-height:18px;text-decoration:none;vertical-align:middle}' +
    'a.yicg:hover{background:#12384a;color:#fff;box-shadow:0 0 8px #3fb8ff}';
  // Install button + panel (test: ?beta=1). Sits just after "Play Influence".
  var BCSS = '#cdx{color:#d8f7ff!important;font-weight:700;border-color:#8fe3ff!important;' +
    'box-shadow:0 0 8px rgba(143,227,255,.95),0 0 22px rgba(91,157,255,.75);' +
    'text-shadow:0 0 8px rgba(143,227,255,.9);animation:playGlow 2.4s ease-in-out infinite}' +
    '#cdx:hover,#cdx:focus-visible{color:#fff!important;animation:none;' +
    'box-shadow:0 0 14px rgba(200,245,255,1),0 0 40px rgba(91,157,255,1)!important;text-shadow:0 0 10px #fff}' +
    '@media (prefers-reduced-motion:reduce){#cdx{animation:none}}' +
    '#cdxp{display:none;position:fixed!important;z-index:99999!important;left:50%;top:50%;transform:translate(-50%,-50%);' +
    'width:min(460px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;background:#0d1520;' +
    'border:1px solid #2b5a72;border-radius:12px;padding:18px 20px;box-shadow:0 0 30px rgba(63,184,255,.35);color:#dbe7f5;font-size:15px;line-height:1.5}' +
    '#cdxp h3{margin:0 0 8px;color:#8fe3ff;font-size:18px;padding-right:24px}' +
    '#cdxp ol{margin:8px 0 10px 20px;padding:0}#cdxp li{margin:4px 0}' +
    '#cdxp code{background:#161d27;padding:1px 6px;border-radius:5px;color:#ffd24a}' +
    '#cdxp .x{position:absolute;top:8px;right:12px;background:none;border:0;color:#9aa8bb;font-size:20px;cursor:pointer}' +
    '#cdxp .dl{display:inline-block;margin:6px 0;padding:8px 14px;border-radius:8px;background:#1f6feb;color:#fff;font-weight:700;text-decoration:none}' +
    '#cdxp .ok{color:#4cd04c;font-weight:700}#cdxp .s{color:#9aa8bb;font-size:13px}';
  var STORE_URL = 'https://chromewebstore.google.com/detail/pbiobnkpgohjcpednldpopbkedlhgpcd';
  function panelStore(have) {
    return '<button class="x" type="button" title="Close">✕</button>' +
      '<h3>Skippy\'s Command Deck extension</h3>' +
      (have ? '<div class="ok">✓ Installed – the "in game ↗" links are switched on.</div>' : '') +
      '<p>Adds <b>in game ↗</b> links to this site. Click one and your open Influence game tab jumps straight to that building, lot, ship, crew or asteroid – <b>no reload, no PLAY screen</b>.</p>' +
      '<p class="s">It only works on this site and the game site, only moves the game\'s view, and never touches your wallet. Checked and published on the Chrome Web Store. <a href="https://github.com/MarkyB71/your-command/tree/main/extension" target="_blank" rel="noopener" style="color:#8fe3ff">Read the code and safety notes on GitHub ↗</a></p>' +
      '<a class="dl" href="' + STORE_URL + '" target="_blank" rel="noopener">⬇ Get it from the Chrome Web Store</a>' +
      '<p><b>To install</b> (Chrome, Brave or Edge on a computer):</p><ol>' +
      '<li>Click the button above.</li>' +
      '<li>Click <b>Add to Chrome</b> (Brave says the same; Edge: allow extensions from other stores first).</li>' +
      '<li>Reload this page.</li></ol>' +
      '<p class="s">Updates arrive automatically.</p>';
  }
  function panel() {
    var have = !!document.documentElement.dataset.yicGameExt;
    return panelStore(have);
  }
  function installTick() {
    if (!document.getElementById('cdx-css') && document.head) {
      var st = document.createElement('style'); st.id = 'cdx-css'; st.textContent = BCSS; document.head.appendChild(st);
    }
    var play = document.getElementById('play');
    if (play && !document.getElementById('cdx')) {
      var b = document.createElement('button');
      b.id = 'cdx'; b.type = 'button';
      b.title = 'Install the extension that opens things in your game without reloading';
      var p = document.createElement('div'); p.id = 'cdxp';
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        p.innerHTML = panel();
        p.style.display = p.style.display === 'block' ? 'none' : 'block';
      });
      p.addEventListener('click', function (e) {
        if (e.target.classList.contains('x')) p.style.display = 'none';
        e.stopPropagation();
      });
      document.addEventListener('click', function () { p.style.display = 'none'; });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') p.style.display = 'none'; });
      play.after(b);
      document.body.appendChild(p);
    }
    var bt = document.getElementById('cdx');
    if (bt) {
      var t = document.documentElement.dataset.yicGameExt ? 'Command Deck ✓' : 'Command Deck';
      if (bt.dataset.t !== t) {
        bt.dataset.t = t;
        bt.innerHTML = '<img src="favicon.svg" alt="" style="width:18px;height:18px;vertical-align:-4px;margin-right:6px;border-radius:4px">' + t;
      }
    }
  }
  setInterval(installTick, 700);

  setInterval(function () {
    if (!on() || document.getElementById('yicg-css')) return;
    var s = document.createElement('style');
    s.id = 'yicg-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }, 500);
})();
