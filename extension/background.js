// Your Command – Game Links (test version 0.1.0)
// Finds your open Influence game tab and moves it to a building / lot / ship
// WITHOUT reloading the game. Only accepts simple paths like /building/123.
const GAME = 'https://game.influenceth.io';
const SITE = 'https://your-command.adalia.academy';
const OK = /^\/(building|lot|ship|asteroids|crew|crewmate)\/\d+$/;

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (!msg || msg.type !== 'yic-open' || typeof msg.path !== 'string' || !OK.test(msg.path)) {
    reply({ ok: false, error: 'bad request' }); return;
  }
  // Messages come from our site's page only.
  if (!sender.tab || sender.origin !== SITE) { reply({ ok: false, error: 'not allowed' }); return; }
  openInGame(msg.path).then(reply, e => reply({ ok: false, error: String(e) }));
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
