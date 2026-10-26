// "Community tools" line just above the "Enjoying the Command Deck?" strip.
// Links to other players' sites and tools; each opens in a new tab.
(function () {
  var COM = /[?&]beta=1/.test(location.search); // test on ?beta=1 first (26 Oct 2026)
  if (!COM) return;
  var LINKS = [
    ['🎓', 'Adalia Academy', 'https://adalia.academy', 'Guides and news for Influence players'],
    ['💱', 'Adalia Exchange', 'https://adalia.exchange', 'Community marketplace'],
    ['⛏', 'Elerium tools', 'https://influence.elerium.dev/', 'What each asteroid type can mine, plus planning tools'],
    ['🧩', 'Influence Tools', 'https://chromewebstore.google.com/detail/influence-tools/kopdkjlnbfiegpdjiebogkakjfppfglj', 'Chrome extension by Elerium: shopping list and market prices inside the game']
  ];
  var CSS = '#comm{text-align:center;margin:28px auto 0;padding:12px 16px 4px;color:#9aa8bb;font-size:14px}' +
    '#comm .ct{display:block;margin-bottom:10px;font-family:Rye,serif;font-weight:400;font-size:24px;letter-spacing:.5px;color:#8fe3ff;text-shadow:0 0 10px rgba(143,227,255,.45)}' +
    '#comm a{display:inline-block;margin:4px 5px;padding:5px 12px;border-radius:6px;font-weight:700;font-size:13px;' +
    'text-decoration:none;background:#161d27;color:#cfe3f5;border:1px solid #2a3442}' +
    '#comm a:hover,#comm a:focus-visible{border-color:#5b9dff;box-shadow:0 0 10px rgba(143,227,255,.35)}' +
    '#comm + #sup{margin-top:6px}';
  setInterval(function () {
    if (!document.getElementById('comm-css') && document.head) {
      var st = document.createElement('style'); st.id = 'comm-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    var s = document.getElementById('sup');
    if (!s) return;
    var c = document.getElementById('comm');
    if (c && c.nextElementSibling === s) return;
    if (!c) {
      c = document.createElement('div'); c.id = 'comm';
      var h = '<span class="ct">Community tools</span>';
      LINKS.forEach(function (l) {
        h += '<a href="' + l[2] + '" target="_blank" rel="noopener noreferrer" title="' + l[3] + '">' + l[0] + ' ' + l[1] + '</a>';
      });
      c.innerHTML = h;
    }
    s.parentNode.insertBefore(c, s);
  }, 700);
})();
