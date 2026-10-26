// Skippy's welcome: a short talking clip (made with Vidnoz) plays once per visit when the site has loaded.
// Tries with sound; if the browser blocks that, plays muted with a "Tap for sound" button.
// Closes by itself at the end, or with ✕ / Esc / a click outside.
(function () {
  var BETA = /[?&]beta=1/.test(location.search);
  var WEL = BETA; // test on ?beta=1 first (plays every time there); set true to go live (once per visit)
  if (!WEL) return;
  var KEY = 'yic-welcome-seen';
  if (!BETA) { try { if (sessionStorage.getItem(KEY)) return; } catch (e) {} }
  var CSS = '#wel{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;' +
    'background:rgba(5,9,16,.72);opacity:0;transition:opacity .4s}' +
    '#wel.on{opacity:1}' +
    '#wel .box{position:relative;width:min(300px,80vw);border-radius:12px;overflow:hidden;' +
    'box-shadow:0 0 0 1px #2b3a50,0 0 28px rgba(143,227,255,.35)}' +
    '#wel video{display:block;width:100%;height:auto;background:#000}' +
    '#wel .x{position:absolute;top:6px;right:6px;width:28px;height:28px;border:0;border-radius:50%;' +
    'background:rgba(0,0,0,.6);color:#fff;font-size:15px;cursor:pointer}' +
    '#wel .snd{position:absolute;left:50%;bottom:14%;transform:translateX(-50%);padding:6px 14px;border:0;border-radius:16px;' +
    'background:rgba(0,0,0,.7);color:#8fe3ff;font-weight:700;font-size:13px;cursor:pointer;display:none}' +
    '@media (prefers-reduced-motion:reduce){#wel{transition:none}}';
  function show() {
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var w = document.createElement('div'); w.id = 'wel';
    w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', "Welcome to Skippy's Command Deck");
    w.innerHTML = '<div class="box"><video playsinline preload="auto" poster="media/skippy-welcome.jpg" src="media/skippy-welcome.mp4"></video>' +
      '<button class="x" aria-label="Close">✕</button><button class="snd">🔊 Tap for sound</button></div>';
    document.body.appendChild(w);
    var v = w.querySelector('video'), snd = w.querySelector('.snd'), done = false;
    function close() {
      if (done) return; done = true;
      w.classList.remove('on'); v.pause();
      document.removeEventListener('keydown', esc);
      setTimeout(function () { w.remove(); st.remove(); }, 450);
    }
    function esc(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', esc);
    w.addEventListener('click', function (e) { if (e.target === w) close(); });
    w.querySelector('.x').addEventListener('click', close);
    snd.addEventListener('click', function () {
      snd.style.display = 'none'; v.muted = false; v.currentTime = 0; v.play().catch(function () {});
    });
    v.addEventListener('ended', function () { if (!v.muted) setTimeout(close, 900); }); // muted: stay so they can tap for sound
    requestAnimationFrame(function () { w.classList.add('on'); });
    v.play().catch(function () {
      v.muted = true; snd.style.display = 'block';
      v.play().catch(function () { snd.textContent = '▶ Play'; });
    });
  }
  // Wait until the site's data has loaded (window.YIC appears), then greet.
  var n = 0, t = setInterval(function () {
    if (window.YIC || ++n > 120) { clearInterval(t); if (window.YIC) setTimeout(show, 400); }
  }, 500);
})();
