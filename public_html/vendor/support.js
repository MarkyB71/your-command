// "Enjoying the Command Deck?" strip just above the footer: Buy me a coffee + PayPal.
// The SkipCoin box keeps only the crypto wallets when this is on.
(function () {
  window.YICSUP = true;
  // 6 Nov 2026 TEST (?beta=1): new name in gold with the signature glow
  var NEWN = /[?&]beta=1/.test(location.search);
  var CSS = '#sup{text-align:center;margin:28px auto 6px;padding:12px 16px;color:#9aa8bb;font-size:14px}' +
    '#sup a{display:inline-block;margin:4px 5px;padding:5px 12px;border-radius:6px;font-weight:700;font-size:13px;text-decoration:none}' +
    '#sup .bmc{background:#ffdd00;color:#111}#sup .pp{background:#0070ba;color:#fff}' +
    '#sup .sc{background:#161d27;color:#ffd24a;border:1px solid #ffd24a}' +
    '#don{display:none!important}' + // menu SkipCoin hidden; strip button opens its box
    (NEWN ? '#sup .bmc{background:#161d27;color:#ffdd00;border:1px solid #ffdd00}' : '') +
    '#sup .snm{color:#ffd24a;font-weight:700;text-shadow:0 0 8px rgba(255,210,74,.55),0 0 18px rgba(255,210,74,.3)}' +
    '#sup a:hover,#sup a:focus-visible{filter:brightness(1.12);box-shadow:0 0 10px rgba(143,227,255,.35)}';
  function foot() {
    return [].find.call(document.querySelectorAll('body > div'), function (d) {
      return /^A community tool from Adalia Academy/.test(d.textContent);
    });
  }
  setInterval(function () {
    if (!document.getElementById('sup-css') && document.head) {
      var st = document.createElement('style'); st.id = 'sup-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    var f = foot();
    if (!f) return;
    var s = document.getElementById('sup');
    if (s && s.nextElementSibling === f) return;
    /* the Report-a-problem line (#repl) sits between this strip and the footer – leave it, or the two keep swapping places */
    if (s && s.nextElementSibling && s.nextElementSibling.id === 'repl' && s.nextElementSibling.nextElementSibling === f) return;
    if (!s) {
      s = document.createElement('div'); s.id = 'sup';
      s.innerHTML = (NEWN ? '<span class="snm">Enjoying Skippy&#39;s Awesome Command Deck?</span> ' : 'Enjoying the Command Deck? ') +
        (function () {
          var B = '<a class="bmc" href="https://buymeacoffee.com/skippyinfluence" target="_blank" rel="noopener noreferrer">☕ Buy me a coffee</a>',
            C = '<a class="sc" href="#" role="button" title="Donate crypto (Ethereum or Starknet)">SkipCoin</a>',
            P = '<a class="pp" href="https://paypal.me/SkippyInfluence" target="_blank" rel="noopener noreferrer">PayPal</a>';
          return NEWN ? B + P + C : B + C + P; // TEST: PayPal in the middle breaks up the gold
        })();
      s.querySelector('.sc').addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var d = document.getElementById('don'); if (d) d.click();
      });
    }
    f.parentNode.insertBefore(s, f);
  }, 700);
})();
