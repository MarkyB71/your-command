// "Enjoying the Command Deck?" strip just above the footer: Buy me a coffee + PayPal.
// The SkipCoin box keeps only the crypto wallets when this is on.
(function () {
  var SUP = /[?&]beta=1/.test(location.search); // test – live = true
  window.YICSUP = SUP;
  if (!SUP) return;
  var CSS = '#sup{text-align:center;margin:28px auto 6px;padding:12px 16px;color:#9aa8bb;font-size:14px}' +
    '#sup a{display:inline-block;margin:4px 5px;padding:5px 12px;border-radius:6px;font-weight:700;font-size:13px;text-decoration:none}' +
    '#sup .bmc{background:#ffdd00;color:#111}#sup .pp{background:#0070ba;color:#fff}' +
    '#sup .sc{background:#161d27;color:#ffd24a;border:1px solid #ffd24a}' +
    '#don{display:none!important}' + // menu SkipCoin hidden; strip button opens its box
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
    if (!s) {
      s = document.createElement('div'); s.id = 'sup';
      s.innerHTML = 'Enjoying the Command Deck? ' +
        '<a class="bmc" href="https://buymeacoffee.com/skippyinfluence" target="_blank" rel="noopener noreferrer">☕ Buy me a coffee</a>' +
        '<a class="sc" href="#" role="button" title="Donate crypto (Ethereum or Starknet)">SkipCoin</a>' +
        '<a class="pp" href="https://paypal.me/SkippyInfluence" target="_blank" rel="noopener noreferrer">PayPal</a>';
      s.querySelector('.sc').addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var d = document.getElementById('don'); if (d) d.click();
      });
    }
    f.parentNode.insertBefore(s, f);
  }, 700);
})();
