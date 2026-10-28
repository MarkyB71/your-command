// Skippy's Command Deck – runs on game.influenceth.io only.
// Adds one small crowned-S button under the game's right-hand side bar. Clicking it
// switches to your Command Deck tab (or opens it). It reads nothing from the game
// except where the side bar ends on screen, and sends nothing anywhere.
(() => {
  if (window.top !== window || document.getElementById('yic-deck-host')) return;
  const host = document.createElement('div');
  host.id = 'yic-deck-host';
  host.style.cssText = 'position:fixed;right:15px;bottom:120px;z-index:2147483647;';
  const root = host.attachShadow({ mode: 'closed' });
  const icon = chrome.runtime.getURL('icons/icon48.png');
  root.innerHTML = `<style>
    button{width:40px;height:40px;padding:5px;border-radius:6px;border:1px solid rgba(79,179,255,.45);
      background:rgba(8,14,24,.85);cursor:pointer;box-shadow:0 0 6px rgba(79,179,255,.35);
      transition:box-shadow .2s,border-color .2s}
    button:hover,button:focus-visible{border-color:#4fb3ff;box-shadow:0 0 14px rgba(79,179,255,.9);outline:none}
    img{width:28px;height:28px;display:block;margin:auto}
  </style><button type="button" title="Back to Skippy's Command Deck"><img src="${icon}" alt="Command Deck"></button>`;
  root.querySelector('button').addEventListener('click', () => chrome.runtime.sendMessage({ type: 'yic-deck' }));
  (document.body || document.documentElement).appendChild(host);

  // Find the bottom of the side bar: scan up the icon column from near the bottom
  // until we hit something that isn't the 3D scene, then sit just below it.
  const BG = /^(CANVAS|BODY|HTML)$/;
  function place() {
    const x = window.innerWidth - 35;
    for (let y = window.innerHeight - 95; y > window.innerHeight * 0.4; y -= 4) {
      const hit = document.elementsFromPoint(x, y).find(el => el !== host);
      if (hit && !BG.test(hit.tagName)) {
        host.style.bottom = '';
        host.style.top = Math.round(y + 10) + 'px';
        return;
      }
    }
    host.style.top = ''; host.style.bottom = '120px';
  }
  place();
  setInterval(place, 1500);
  window.addEventListener('resize', place);
})();
