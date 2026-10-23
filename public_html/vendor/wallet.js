/* Connect wallet – adds a "Connect wallet" button to the wallet page.
   Lists every Starknet wallet the browser has (Braavos, Ready/Argent X, …),
   the player picks one, and we only READ the address. Nothing is ever signed or sent.
   Test only: shows with ?beta=1 (remembered for this browser tab). */
(function () {
  var BETA = false;
  try {
    if (/[?&]beta=1/.test(location.search)) sessionStorage.setItem('yicBeta', '1');
    BETA = sessionStorage.getItem('yicBeta') === '1';
  } catch (e) { BETA = /[?&]beta=1/.test(location.search); }
  if (!BETA) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Starknet wallets put themselves on window as starknet, starknet_braavos, starknet_argentX, …
  function wallets() {
    var seen = {}, out = [], keys = ['starknet', 'starknet_argentX', 'starknet_ready', 'starknet_braavos', 'starknet_okxwallet', 'starknet_keplr'];
    try { keys = keys.concat(Object.getOwnPropertyNames(window)); } catch (e) {}
    keys.forEach(function (k) {
      if (!/^starknet/.test(k)) return;
      var w;
      try { w = window[k]; } catch (e) { return; }
      if (!w || typeof w !== 'object' || !w.id || !w.name) return;
      if (typeof w.request !== 'function' && typeof w.enable !== 'function') return;
      if (seen[w.id]) return;
      seen[w.id] = 1;
      out.push(w);
    });
    return out.sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
  }

  function iconOf(w) {
    var i = w.icon;
    if (i && typeof i === 'object') i = i.dark || i.light;
    if (typeof i !== 'string') return '';
    if (/^<svg/i.test(i.trim())) i = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(i)));
    return /^data:image\//.test(i) ? i : '';
  }

  async function getAddress(w) {
    var a = null;
    if (typeof w.request === 'function') {
      try {
        var r = await w.request({ type: 'wallet_requestAccounts' });
        if (Array.isArray(r) && r[0]) a = r[0];
      } catch (e) {
        if (typeof w.enable !== 'function') throw e;
      }
    }
    if (!a && typeof w.enable === 'function') {
      var r2 = await w.enable();
      if (Array.isArray(r2) && r2[0]) a = r2[0];
    }
    if (!a && w.selectedAddress) a = w.selectedAddress;
    if (!a && w.account && w.account.address) a = w.account.address;
    return a ? String(a) : null;
  }

  function setErr(t) {
    var e = document.getElementById('err');
    if (e) e.textContent = t;
  }

  function closeList() {
    var p = document.getElementById('wc-list');
    if (p) p.remove();
  }

  async function pick(w) {
    closeList();
    setErr('');
    var b = document.getElementById('wc-btn');
    if (b) { b.disabled = true; b.textContent = 'Waiting for ' + w.name + '…'; }
    try {
      var a = await getAddress(w);
      if (!a || !/^0x[0-9a-fA-F]{1,64}$/.test(a)) throw new Error('No address');
      var inp = document.getElementById('w'), go = document.getElementById('go');
      if (!inp || !go) return;
      inp.value = a;
      go.click();
    } catch (e) {
      setErr(w.name + ' did not share an address. Check the wallet is unlocked and try again, or paste your address below.');
      if (b) { b.disabled = false; b.textContent = 'Connect wallet'; }
    }
  }

  function showList(btn) {
    closeList();
    var ws = wallets();
    var p = document.createElement('div');
    p.id = 'wc-list';
    p.style.cssText = 'margin-top:10px;background:#131821;border:1px solid #232b38;border-radius:8px;padding:10px';
    if (!ws.length) {
      p.innerHTML = '<div style="font-size:14px">No Starknet wallet found in this browser.<br>Install Braavos or Ready (Argent X) in your browser, ' +
        'or paste your address below.</div>';
    } else {
      p.innerHTML = '<div style="font-size:13px;margin:0 0 8px;color:#8b9ab0">Choose your wallet:</div>' +
        ws.map(function (w, i) {
          var ic = iconOf(w);
          return '<button type="button" data-wi="' + i + '" style="display:flex;align-items:center;gap:10px;width:100%;margin:6px 0 0;' +
            'background:#1b2330;color:#e6ebf2;border:1px solid #2a3442;text-align:left">' +
            (ic ? '<img src="' + esc(ic) + '" alt="" style="width:24px;height:24px;border-radius:5px">' : '') +
            '<span>' + esc(w.name) + '</span></button>';
        }).join('');
      p.querySelectorAll('[data-wi]').forEach(function (el) {
        el.onclick = function () { pick(ws[+el.getAttribute('data-wi')]); };
      });
    }
    btn.insertAdjacentElement('afterend', p);
  }

  function addButton() {
    var lab = document.querySelector('label[for="w"]');
    if (!lab || document.getElementById('wc-btn')) return;
    var wrap = document.createElement('div');
    wrap.style.cssText = 'margin:0 0 18px';
    wrap.innerHTML = '<button type="button" id="wc-btn" style="margin-top:0">Connect wallet</button>' +
      '<div style="font-size:12px;color:#8b9ab0;margin-top:6px">Only reads your address – never asks to sign or send anything.</div>' +
      '<div style="font-size:13px;color:#8b9ab0;margin-top:14px">Or paste it:</div>';
    lab.parentNode.insertBefore(wrap, lab);
    var btn = document.getElementById('wc-btn');
    btn.onclick = function () {
      if (document.getElementById('wc-list')) closeList();
      else showList(btn);
    };
  }

  setInterval(addButton, 300);
})();
