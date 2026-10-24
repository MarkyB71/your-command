// Runs on your-command.adalia.academy only. Lets the site know the extension
// is installed, and passes "open in game" requests to the extension.
document.documentElement.dataset.yicGameExt = '0.1.0';
window.addEventListener('message', e => {
  if (e.source !== window || e.origin !== location.origin) return;
  const d = e.data;
  if (!d || d.type !== 'yic-open' || typeof d.path !== 'string') return;
  chrome.runtime.sendMessage({ type: 'yic-open', path: d.path }, r => {
    window.postMessage({ type: 'yic-open-result', path: d.path, result: r || null }, location.origin);
  });
});
