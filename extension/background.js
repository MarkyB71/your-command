// Skippy's Command Deck – browser extension (background).
// Finds your open Influence game tab and moves it to a building / lot / ship /
// crew / asteroid WITHOUT reloading the game. It only ever accepts simple paths
// like /building/123 – nothing else can be sent to the game.
const GAME = 'https://game.influenceth.io';
const SITE = 'https://your-command.adalia.academy';
const OK = /^\/(building|lot|ship|asteroids|crew|crewmate)\/\d{1,20}$/;
// At most one jump every 0.7 s, so a page can't keep pulling the game tab to the front.
let last = 0;

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (!msg || msg.type !== 'yic-open' || typeof msg.path !== 'string' || !OK.test(msg.path)) {
    reply({ ok: false, error: 'bad request' }); return;
  }
  // Messages come from our site's page only.
  if (!sender.tab || sender.origin !== SITE) { reply({ ok: false, error: 'not allowed' }); return; }
  const now = Date.now();
  if (now - last < 700) { reply({ ok: false, error: 'too fast' }); return; }
  last = now;
  openInGame(msg.path).then(reply, () => reply({ ok: false, error: 'could not reach the game tab' }));
  return true; // reply later
});

async function openInGame(path) {
  const tabs = await chrome.tabs.query({ url: GAME + '/*' });
  if (!tabs.length) {
    await chrome.tabs.create({ url: GAME + path }); // no game open: normal deep link
    return { ok: true, mode: 'new-tab' };
  }
  const t = tabs.find(x => x.active) || tabs[0];
  await chrome.tabs.update(t.id, { active: true });
  await chrome.windows.update(t.windowId, { focused: true });
  await chrome.scripting.executeScript({
    target: { tabId: t.id },
    world: 'MAIN',
    func: p => {
      history.pushState({}, '', p);
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    },
    args: [path]
  });
  return { ok: true, mode: 'same-tab' };
}

// Toolbar icon: jump back to the Command Deck tab (or open it if none).
chrome.action.onClicked.addListener(async () => {
  const tabs = await chrome.tabs.query({ url: SITE + '/*' });
  if (!tabs.length) { await chrome.tabs.create({ url: SITE + '/' }); return; }
  const t = tabs.find(x => x.active) || tabs[0];
  await chrome.tabs.update(t.id, { active: true });
  await chrome.windows.update(t.windowId, { focused: true });
});
