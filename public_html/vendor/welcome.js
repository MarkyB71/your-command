// Skippy's welcome: a short talking clip (made with Vidnoz) plays once per visit when the site has loaded.
// Plays with sound. If the browser won't allow sound before the player has clicked anything,
// it waits for their first click / tap / key and greets them then.
// Sits at the top of the page in a dark box; closes by itself at the end, or with ✕ / Esc / a click outside.
(function () {
  var BETA = /[?&]beta=1/.test(location.search);
  var WEL = BETA; // test on ?beta=1 first (plays every time there); set true to go live (once per visit)
  if (!WEL) return;
  var KEY = 'yic-welcome-seen';
  if (!BETA) { try { if (sessionStorage.getItem(KEY)) return; } catch (e) {} }
  // !important: the site's body > :not(...) rule sets position:relative on body's children.
  var CSS = '#wel{position:fixed!important;inset:0;z-index:9999!important;display:flex;align-items:flex-start;justify-content:center;' +
    'padding-top:16px;background:rgba(5,9,16,.6);opacity:0;transition:opacity .4s;pointer-events:none}' +
    '#wel.on{opacity:1;pointer-events:auto}' +
    '#wel .box{position:relative;width:min(260px,72vw);padding:10px 10px 8px;border-radius:12px;' +
    'background:var(--bg,#0f141c);border:1px solid #2b3a50;box-shadow:0 0 28px rgba(143,227,255,.3)}' +
    '#wel video{display:block;width:100%;height:auto;border-radius:6px;background:#0f141c}' +
    '#wel .cap{margin-top:8px;text-align:center;color:#8fe3ff;font-weight:700;font-size:14px}' +
    '#wel .cred{margin-top:2px;text-align:center;color:#6b7788;font-size:10px}' +
    '#wel .x{position:absolute;top:14px;right:14px;width:26px;height:26px;border:0;border-radius:50%;' +
    'background:rgba(0,0,0,.6);color:#fff;font-size:14px;cursor:pointer}' +
    '#wel .snd{position:absolute;left:50%;top:40%;transform:translateX(-50%);padding:8px 16px;border:1px solid #8fe3ff;border-radius:18px;' +
    'background:rgba(0,0,0,.75);color:#8fe3ff;font-weight:700;font-size:14px;cursor:pointer;display:none}' +
  '@media (prefers-reduced-motion:reduce){#wel{transition:none}}';
  var st, w, v, snd, done = false, hold = false;
  function build() {
    st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    w = document.createElement('div'); w.id = 'wel';
    w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', "Welcome to Skippy's Command Deck");
    w.innerHTML = '<div class="box"><video playsinline preload="auto" poster="media/skippy-welcome.jpg" src="media/skippy-welcome.mp4"></video>' +
      '<div class="cap">Welcome to Skippy’s Command Deck</div><div class="cred">Made with Vidnoz</div>' +
      '<button class="x" aria-label="Close">✕</button><button class="snd">▶ Hear Skippy</button></div>';
    document.body.appendChild(w);
    v = w.querySelector('video'); snd = w.querySelector('.snd');
    document.addEventListener('keydown', esc);
    w.addEventListener('click', function (e) { if (e.target === w && !hold) close(); });
    w.querySelector('.x').addEventListener('click', close);
    v.addEventListener('ended', function () { setTimeout(close, 900); });
  }
  function close() {
    if (done) return; done = true;
    w.classList.remove('on'); v.pause();
    document.removeEventListener('keydown', esc);
    setTimeout(function () { w.remove(); st.remove(); }, 450);
  }
  function esc(e) { if (e.key === 'Escape') close(); }
  function play() {
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    v.muted = false; v.currentTime = 0;
    w.classList.add('on');
    return v.play();
  }
  function start() {
    build();
    play().catch(function () {
      // Sound blocked until the player interacts: keep Skippy showing (paused) with a play button;
      // their first click / tap / key anywhere starts him with sound.
      w.classList.add('on'); snd.style.display = 'block';
      function go(e) {
        ['pointerdown', 'keydown'].forEach(function (t) { document.removeEventListener(t, go, true); });
        if (done || (e && e.key === 'Escape')) return;
        snd.style.display = 'none';
        hold = true; setTimeout(function () { hold = false; }, 600); // that first click only starts him
        play().catch(close);
      }
      ['pointerdown', 'keydown'].forEach(function (t) { document.addEventListener(t, go, true); });
    });
  }
  // Wait until the site's data has loaded (window.YIC appears), then greet.
  var n = 0, t = setInterval(function () {
    if (window.YIC || ++n > 120) { clearInterval(t); if (window.YIC) setTimeout(start, 400); }
  }, 500);
})();
