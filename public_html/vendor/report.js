// "Report a problem" – button in the support strip (#sup) opens a small box; reports go to report.php
// and are saved privately on the server (never shown on the site).
(function () {
  var REP = /[?&]beta=1/.test(location.search); // TEST on ?beta=1 (26 Oct 2026). true = live for everyone.
  if (!REP) return;
  var CSS =
    '#sup .rep{background:#161d27;color:#8fe3ff;border:1px solid #5b9dff}' +
    '#repb{position:fixed!important;inset:0;z-index:100000!important;background:rgba(0,0,0,.6);display:none}' +
    '#repp{position:fixed!important;z-index:100001!important;left:50%;top:50%;transform:translate(-50%,-50%);' +
    'width:min(480px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;box-sizing:border-box;' +
    'background:#10161f;border:1px solid #5b9dff;border-radius:10px;box-shadow:0 0 24px rgba(91,157,255,.35);' +
    'padding:18px 18px 16px;color:#dfe7f2;font-size:14px;display:none;text-align:left}' +
    '#repp h3{margin:0 0 4px;font-size:18px;color:#8fe3ff}#repp .sub{color:#9aa8bb;margin:0 0 12px}' +
    '#repp label{display:block;margin:10px 0 4px;font-weight:700}' +
    '#repp textarea,#repp input[type=text],#repp select{width:100%!important;min-width:0!important;box-sizing:border-box;' +
    'background:#0b1017;color:#dfe7f2;border:1px solid #2a3442;border-radius:6px;padding:7px 9px;font:inherit}' +
    '#repp textarea{min-height:120px;resize:vertical}' +
    '#repp .row{display:flex;gap:8px;align-items:center;margin-top:10px;color:#9aa8bb}' +
    '#repp .row input{width:auto!important;min-width:0!important}' +
    '#repp .btns{display:flex;gap:10px;justify-content:flex-end;margin-top:14px}' +
    '#repp button{border-radius:6px;padding:7px 14px;font-weight:700;cursor:pointer;border:1px solid #2a3442;background:#161d27;color:#dfe7f2}' +
    '#repp button.go{background:#5b9dff;border-color:#5b9dff;color:#06101d}' +
    '#repp button:disabled{opacity:.6;cursor:default}' +
    '#repp .x{position:absolute;top:8px;right:10px;border:0;background:none;color:#9aa8bb;font-size:18px;padding:2px 6px}' +
    '#repp .msg{margin-top:10px;min-height:1em}#repp .msg.err{color:#ff6b6b}#repp .msg.ok{color:#3fd68a;font-weight:700}';

  function pageName() {
    var h = document.querySelector('h1.brand');
    var t = h ? h.textContent.replace(/\s+/g, ' ').trim() : '';
    return t || document.title || '';
  }
  function version() {
    var m = /Version\s+(\d+)/.exec(document.body ? document.body.textContent : '');
    return m ? 'Version ' + m[1] : '';
  }
  function wallet() {
    var m = /[?&]wallet=(0x[0-9a-fA-F]{1,64})/.exec(location.search);
    if (m) return m[1];
    try { var w = localStorage.getItem('influenceStockWallet'); if (w && /^0x[0-9a-fA-F]{1,64}$/.test(w)) return w; } catch (e) {}
    return '';
  }

  var box, back;
  function build() {
    back = document.createElement('div'); back.id = 'repb';
    box = document.createElement('div'); box.id = 'repp'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    box.innerHTML =
      '<button class="x" type="button" aria-label="Close">✕</button>' +
      '<h3>🐞 Report a problem</h3>' +
      '<p class="sub">Something wrong, or not sure how a page works? Tell Skippy here.</p>' +
      '<label for="repk">What is it?</label>' +
      '<select id="repk"><option value="bug">Something is wrong</option><option value="confusing">Not sure how it works</option></select>' +
      '<label for="repg">Page</label><input id="repg" type="text" maxlength="80">' +
      '<label for="rept">What happened?</label>' +
      '<textarea id="rept" maxlength="2000" placeholder="What did you do, what did you expect, and what did you see?"></textarea>' +
      '<label for="repw">Your name on Discord (optional – so Skippy can reply)</label><input id="repw" type="text" maxlength="80">' +
      '<div class="row"><input id="repa" type="checkbox" checked><label for="repa" style="margin:0;font-weight:400">Include my wallet address (helps us see what you see)</label></div>' +
      '<div class="msg" aria-live="polite"></div>' +
      '<div class="btns"><button type="button" class="cn">Cancel</button><button type="button" class="go">Send report</button></div>';
    document.body.appendChild(back); document.body.appendChild(box);
    back.addEventListener('click', close);
    box.querySelector('.x').addEventListener('click', close);
    box.querySelector('.cn').addEventListener('click', close);
    box.querySelector('.go').addEventListener('click', send);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.style.display === 'block') close(); });
  }
  function open() {
    if (!box) build();
    box.querySelector('#repg').value = pageName();
    box.querySelector('#rept').value = '';
    var w = wallet(), a = box.querySelector('#repa');
    a.parentNode.style.display = w ? '' : 'none';
    try { box.querySelector('#repw').value = localStorage.getItem('yic-report-who') || ''; } catch (e) {}
    var m = box.querySelector('.msg'); m.textContent = ''; m.className = 'msg';
    var g = box.querySelector('.go'); g.disabled = false; g.style.display = '';
    box.querySelector('.cn').textContent = 'Cancel';
    back.style.display = 'block'; box.style.display = 'block';
    box.querySelector('#rept').focus();
  }
  function close() { if (box) { box.style.display = 'none'; back.style.display = 'none'; } }
  function send() {
    var m = box.querySelector('.msg'), g = box.querySelector('.go');
    var text = box.querySelector('#rept').value.trim();
    if (text.length < 5) { m.className = 'msg err'; m.textContent = 'Please say a little about what happened.'; return; }
    var who = box.querySelector('#repw').value.trim();
    try { localStorage.setItem('yic-report-who', who); } catch (e) {}
    var body = {
      kind: box.querySelector('#repk').value, page: box.querySelector('#repg').value.trim(), text: text, who: who,
      wallet: box.querySelector('#repa').checked ? wallet() : '', ver: version()
    };
    g.disabled = true; m.className = 'msg'; m.textContent = 'Sending…';
    fetch('report.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return [r.ok, j]; }); })
      .then(function (x) {
        if (x[0] && x[1].ok) {
          m.className = 'msg ok'; m.textContent = '✓ Thanks! Your report has been sent to Skippy.';
          g.style.display = 'none'; box.querySelector('.cn').textContent = 'Close';
        } else { m.className = 'msg err'; m.textContent = x[1].error || 'Sorry, that did not send. Please try again.'; g.disabled = false; }
      })
      .catch(function () { m.className = 'msg err'; m.textContent = 'Sorry, that did not send. Please try again.'; g.disabled = false; });
  }

  setInterval(function () {
    if (!document.getElementById('rep-css') && document.head) {
      var st = document.createElement('style'); st.id = 'rep-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    var s = document.getElementById('sup');
    if (!s || s.querySelector('.rep')) return;
    var a = document.createElement('a');
    a.className = 'rep'; a.href = '#'; a.setAttribute('role', 'button'); a.textContent = '🐞 Report a problem';
    a.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); open(); });
    s.appendChild(a);
  }, 700);
})();
