// Skippy's Command Deck – runs on game.influenceth.io only.
// Adds a crowned-S button to the bottom of the game's right-hand side bar (or, if the
// side bar isn't showing, a small floating one). Clicking it switches to your Command
// Deck tab (or opens it). It reads nothing from the game and sends nothing anywhere.
(() => {
  if (window.top !== window || document.getElementById('yic-s')) return;
  const icon = chrome.runtime.getURL('icons/icon48.png');
  const go = e => { e.preventDefault(); e.stopPropagation(); chrome.runtime.sendMessage({ type: 'yic-deck' }); };
  const TIP = "Skippy's Command Deck";

  // Side bar button – borrows the game's own button look and tooltip.
  const s = document.createElement('div');
  s.id = 'yic-s';
  s.setAttribute('data-tooltip-id', 'hudMenuTooltip');
  s.setAttribute('data-tooltip-place', 'left');
  s.setAttribute('data-tooltip-content', TIP);
  s.setAttribute('role', 'button');
  s.innerHTML = `<img src="${icon}" alt="${TIP}" style="width:28px;height:28px;display:block;pointer-events:none">`;
  s.addEventListener('click', go);

  // Floating fallback when there is no side bar.
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;right:15px;bottom:120px;z-index:2147483647;display:none';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `<style>
    button{width:40px;height:40px;padding:5px;border-radius:6px;border:1px solid rgba(79,179,255,.45);
      background:rgba(8,14,24,.85);cursor:pointer;box-shadow:0 0 6px rgba(79,179,255,.35)}
    button:hover{border-color:#4fb3ff;box-shadow:0 0 14px rgba(79,179,255,.9)}
    img{width:28px;height:28px;display:block;margin:auto}
  </style><button type="button" title="${TIP}"><img src="${icon}" alt=""></button>`;
  root.querySelector('button').addEventListener('click', go);

  function dock() {
    if (!host.isConnected) (document.body || document.documentElement).appendChild(host);
    const btns = [...document.querySelectorAll('[data-tooltip-id="hudMenuTooltip"]')].filter(b => b !== s);
    if (!btns.length) { if (s.isConnected) s.remove(); host.style.display = ''; return; }
    host.style.display = 'none';
    // Most common class = the game's normal (not selected) side bar button.
    const n = {}; btns.forEach(b => { n[b.className] = (n[b.className] || 0) + 1; });
    const cls = Object.keys(n).sort((a, b) => n[b] - n[a])[0];
    if (s.className !== cls) s.className = cls;
    const last = btns[btns.length - 1];
    if (s.previousElementSibling !== last) last.after(s);
  }
  dock();
  setInterval(dock, 1000);
})();
