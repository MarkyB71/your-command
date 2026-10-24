// Skippy's Command Deck – runs on your-command.adalia.academy only (top page, not frames).
// Tells the site the extension is installed, and passes "open in game" link clicks
// to the extension. It reads nothing else from the page and sends nothing anywhere.
document.documentElement.dataset.yicGameExt = chrome.runtime.getManifest().version;
window.addEventListener('message', e => {
  if (e.source !== window || e.origin !== location.origin) return;
  const d = e.data;
  if (!d || d.type !== 'yic-open' || typeof d.path !== 'string') return;
  chrome.runtime.sendMessage({ type: 'yic-open', path: d.path }, r => {
    window.postMessage({ type: 'yic-open-result', path: d.path, result: r || null }, location.origin);
  });
});
