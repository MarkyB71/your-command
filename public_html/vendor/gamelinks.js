// Game links – "in game ↗" links next to buildings, crews, ships and lots.
// They only appear when the "Your Command – Game Links" browser extension is
// installed (it marks the page with data-yic-game-ext). Clicking one asks the
// extension to move the player's open game tab there, without a reload.
// While testing, links also need ?beta=1 in the address.
(function () {
  var TEST = /[?&]beta=1/.test(location.search);
  var GAME = 'https://game.influenceth.io';
  var OK = /^\/(building|lot|ship|asteroids|crew|crewmate)\/\d+$/;

  function on() {
    return TEST && !!document.documentElement.dataset.yicGameExt;
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
  setInterval(function () {
    if (!on() || document.getElementById('yicg-css')) return;
    var s = document.createElement('style');
    s.id = 'yicg-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }, 500);
})();
