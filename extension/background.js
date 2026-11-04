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
  if (msg && msg.type === 'yic-markets') return; // answered by the marketplaces listener below
  // "Command Deck" button on the game page: jump back to the site.
  if (msg && msg.type === 'yic-deck' && sender.tab && sender.origin === GAME) {
    goDeck().then(() => reply({ ok: true }), () => reply({ ok: false })); return true;
  }
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
chrome.action.onClicked.addListener(goDeck);
async function goDeck() {
  const tabs = await chrome.tabs.query({ url: SITE + '/*' });
  if (!tabs.length) { await chrome.tabs.create({ url: SITE + '/' }); return; }
  const t = tabs.find(x => x.active) || tabs[0];
  await chrome.tabs.update(t.id, { active: true });
  await chrome.windows.update(t.windowId, { focused: true });
}

// Open marketplaces for the system map (maptags.js), from the Command Deck's belt-wide market list.
// Only the game tab may ask; the list is kept for 5 minutes (the server rebuilds it every 5 minutes too).
let mkt = null, mktAt = 0, mktBusy = null;
async function marketSummary() {
  if (mkt && Date.now() - mktAt < 300000) return mkt;
  if (mktBusy) return mktBusy;
  mktBusy = (async () => {
    const r = await fetch(SITE + '/market.php', { credentials: 'omit', cache: 'no-store' });
    if (!r.ok) throw new Error('market ' + r.status);
    const j = await r.json();
    // orders: [product, type (1 buy / 2 sell), amount, price, marketplace id, asteroid id, crew id, fee]
    const per = {};
    for (const o of (j.orders || [])) {
      const ast = +o[5], m = +o[4]; if (!ast || !m) continue;
      const a = per[ast] || (per[ast] = {});
      const x = a[m] || (a[m] = [((j.markets || {})[m] || {}).name || ('Marketplace #' + m), 0, 0]);
      if (+o[1] === 2) x[1]++; else if (+o[1] === 1) x[2]++;
    }
    const data = {};
    for (const ast in per) data[ast] = Object.values(per[ast]).sort((p, q) => (q[1] + q[2]) - (p[1] + p[2]));
    mkt = { data, fetched: +j.fetched || Math.floor(Date.now() / 1000) }; mktAt = Date.now();
    return mkt;
  })();
  try { return await mktBusy; } finally { mktBusy = null; }
}
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (!msg || msg.type !== 'yic-markets' || !sender.tab || sender.origin !== GAME) return;
  marketSummary().then(m => reply({ ok: true, ...m }), e => reply({ ok: false, error: String(e && e.message || e) }));
  return true;
});
