// Skippy's Command Deck – runs on your-command.adalia.academy only (top page, not frames).
// Tells the site the extension is installed, and passes "open in game" link clicks
// to the extension. It reads nothing else from the page and sends nothing anywhere.
document.documentElement.dataset.yicGameExt = chrome.runtime.getManifest().version;
window.addEventListener('message', e => {
  if (e.source !== window || e.origin !== location.origin) return;
  const d = e.data;
  if (!d || d.type !== 'yic-open' || typeof d.path !== 'string') return;
  const reply = result => window.postMessage({ type: 'yic-open-result', path: d.path, result }, location.origin);
  // After the extension updates or reloads, this old copy loses its link to it (until the page is
  // refreshed). Tell the site straight away so it can ask the player to refresh (0.6.1).
  try {
    if (!chrome.runtime || !chrome.runtime.id) throw new Error('gone');
    chrome.runtime.sendMessage({ type: 'yic-open', path: d.path }, r => {
      if (chrome.runtime.lastError) { reply({ ok: false, error: 'reconnect' }); return; }
      reply(r || null);
    });
  } catch (err) {
    reply({ ok: false, error: 'reconnect' });
  }
});
