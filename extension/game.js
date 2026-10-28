// Skippy's Command Deck – runs on game.influenceth.io only.
// Adds one small "Command Deck" button to the game page. Clicking it switches to
// your Command Deck tab (or opens it). It reads nothing from the game and sends nothing anywhere.
(() => {
  if (window.top !== window || document.getElementById('yic-deck-host')) return;
  const host = document.createElement('div');
  host.id = 'yic-deck-host';
  host.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483647;';
  const root = host.attachShadow({ mode: 'closed' });
  const icon = chrome.runtime.getURL('icons/icon48.png');
  root.innerHTML = `<style>
    button{display:flex;align-items:center;gap:7px;padding:6px 12px 6px 6px;border-radius:20px;
      border:1px solid #4fb3ff;background:rgba(8,14,24,.85);color:#bfe6ff;font:600 13px system-ui,sans-serif;
      cursor:pointer;opacity:.75;box-shadow:0 0 8px rgba(79,179,255,.45);transition:opacity .2s,box-shadow .2s}
    button:hover,button:focus-visible{opacity:1;box-shadow:0 0 14px rgba(79,179,255,.9);outline:none}
    img{width:22px;height:22px}
  </style><button type="button" title="Back to Skippy's Command Deck"><img src="${icon}" alt="">Command Deck</button>`;
  root.querySelector('button').addEventListener('click', () => chrome.runtime.sendMessage({ type: 'yic-deck' }));
  (document.body || document.documentElement).appendChild(host);
})();
