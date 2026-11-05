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

// Deck controls on the Command Deck's Bridge (0.6.3): the site can show these settings and the
// friend / foe tags, and send back changes. Only the known settings are accepted; nothing else
// on the page is read, and everything stays saved in this browser only.
(() => {
  const DEFAULTS = { sideButton: true, lotColours: true, hideUsedDeposits: true, autoSample: true, statusDots: true, crewFood: true, shipProp: true, mapTags: true, mapMarkets: true, mapFlights: true, flightsFriendly: true, flightsNeutral: true, flightsHostile: true, flightsOther: true, tagCol_friendly: '#88e675', tagCol_neutral: '#ffd94f', tagCol_hostile: '#ff564d' };
  const TAG = { friendly: 1, neutral: 1, hostile: 1 };
  const alive = () => { try { return !!(chrome.runtime && chrome.runtime.id); } catch (e) { return false; } };
  const reply = () => {
    if (!alive()) return;
    chrome.storage.sync.get(DEFAULTS, opts => chrome.storage.local.get({ mapTags: {} }, o =>
      window.postMessage({ type: 'yic-opts', opts, tags: o.mapTags || {} }, location.origin)));
  };
  window.addEventListener('message', e => {
    if (e.source !== window || e.origin !== location.origin || !alive()) return;
    const d = e.data;
    if (!d || typeof d.type !== 'string') return;
    if (d.type === 'yic-opts-get') reply();
    else if (d.type === 'yic-opts-set') {
      const k = d.key, v = d.value;
      if (!Object.prototype.hasOwnProperty.call(DEFAULTS, k)) return;
      const ok = typeof DEFAULTS[k] === 'boolean' ? typeof v === 'boolean' : (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v));
      if (ok) chrome.storage.sync.set({ [k]: v });
    } else if (d.type === 'yic-tags-set') {
      const t = d.tags, clean = {};
      if (!t || typeof t !== 'object' || Array.isArray(t)) return;
      Object.keys(t).slice(0, 2000).forEach(a => {
        const x = t[a];
        if (!/^0x[0-9a-f]{1,64}$/i.test(a) || !x || typeof x !== 'object') return;
        clean[a] = { tag: TAG[x.tag] ? x.tag : '', name: typeof x.name === 'string' ? x.name.slice(0, 40) : '' };
      });
      chrome.storage.local.set({ mapTags: clean });
    }
  });
})();
