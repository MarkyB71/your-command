// Skippy's Command Deck – runs on game.influenceth.io only (isolated from the game's code).
// - Reads your choices from the extension's options and passes them to lotcolours.js.
// - Command Deck button: a crowned S at the bottom of the game's right-hand side bar.
// - Hide used deposits: unticks "Show Used Deposits" once each time the core sample picker opens.
// - Marketplaces on the map: fetches the Command Deck's market list (via the background) for maptags.js.
// - Friend / foe tags: passes your map tags between the extension's storage and maptags.js.
// - Auto-pick core sample: when the Extract window opens with no deposit chosen, picks the top one.
// It reads nothing from the game beyond what it needs to place the button / find that tick box,
// and sends nothing anywhere.
(() => {
  if (window.top !== window || document.getElementById('yic-s')) return;
  const DEFAULTS = { sideButton: true, lotColours: true, hideUsedDeposits: true, autoSample: true, statusDots: true, crewFood: true, shipProp: true, mapTags: true, mapMarkets: true, tagCol_friendly: '#88e675', tagCol_neutral: '#ffd94f', tagCol_hostile: '#ff564d' };

  chrome.storage.sync.get(DEFAULTS, opts => {
    // Hand the choices to the page-side script (lotcolours.js) through a page attribute.
    document.documentElement.dataset.yicOpts = JSON.stringify(opts);
    if (opts.sideButton) sideButton();
    if (opts.hideUsedDeposits) hideUsed();
    if (opts.autoSample) autoSample();
    if (opts.mapTags !== false) tagBridge();
    if (opts.mapMarkets !== false) marketBridge();
  });

  function marketBridge() {
    // Open marketplaces for the system map: asks the extension's background for the Command Deck's
    // belt-wide market list (refreshed every 5 minutes) and passes it to maptags.js in the page.
    const get = () => chrome.runtime.sendMessage({ type: 'yic-markets' }, r => {
      if (chrome.runtime.lastError || !r || !r.ok) return;
      window.postMessage({ yic: 'markets', data: r.data, fetched: r.fetched }, location.origin);
    });
    get(); setInterval(get, 300000);
  }

  function tagBridge() {
    // Friend / foe tags: kept in the extension's own storage (so the options page can list, share and
    // clear them). Passes them to maptags.js in the page, and saves the changes it sends back.
    const send = t => window.postMessage({ yic: 'tags', tags: t || {} }, location.origin);
    chrome.storage.local.get({ mapTags: {} }, o => send(o.mapTags));
    chrome.storage.onChanged.addListener((ch, area) => { if (area === 'local' && ch.mapTags) send(ch.mapTags.newValue); });
    window.addEventListener('message', e => {
      if (e.source !== window || !e.data || e.data.yic !== 'tags-save') return;
      const t = e.data.tags;
      if (t && typeof t === 'object' && !Array.isArray(t)) chrome.storage.local.set({ mapTags: t });
    });
  }

  function sideButton() {
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
      // Only the side bar column itself: panels like Ship Inventory reuse the same tooltip id
      // on their own items, so keep just the right-most column of visible buttons.
      const all = [...document.querySelectorAll('[data-tooltip-id="hudMenuTooltip"]')]
        .filter(b => b !== s)
        .map(b => ({ b, r: b.getBoundingClientRect() }))
        .filter(o => o.r.width > 0 && o.r.height > 0);
      const edge = Math.max(...all.map(o => o.r.left));
      const btns = all.filter(o => Math.abs(o.r.left - edge) < 8)
        .sort((a, c) => a.r.top - c.r.top).map(o => o.b);
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
  }

  function hideUsed() {
    // The picker always opens with "Show Used Deposits" ticked. Each time a new picker
    // appears, click that tick box once – the same as you doing it. Never touches it again,
    // so you can tick it back on yourself.
    const seen = new WeakSet();
    const X = "//*[text()[normalize-space()='Show Used Deposits']]";
    function check() {
      const r = document.evaluate(X, document.body, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      for (let i = 0; i < r.snapshotLength; i++) {
        const el = r.snapshotItem(i);
        if (seen.has(el)) continue;
        seen.add(el);
        el.click();
      }
    }
    setInterval(check, 150);
  }
  function autoSample() {
    // When the game's Extract Resource window opens and its Deposit box still says "Select",
    // open the sample list, click the top sample and press Done – the same clicks you'd make.
    // Once per window, so you can still change it. It never presses Extract.
    const done = new WeakSet();
    const leaf = (root, re) => [...root.querySelectorAll('*')].find(e => !e.children.length && re.test(e.textContent.trim()));
    const wait = ms => new Promise(r => setTimeout(r, ms));
    let busy = false;
    async function pick(slot) {
      busy = true;
      try {
        slot.click();
        let table = null;
        for (let i = 0; i < 40 && !table; i++) {
          await wait(50);
          table = [...document.querySelectorAll('table')].find(t => /Used Status/i.test(t.innerText));
        }
        if (!table) return;
        await wait(300); // let "Hide used deposits" untick first
        table = [...document.querySelectorAll('table')].find(t => /Used Status/i.test(t.innerText));
        if (!table) return;
        let box = table; while (box.parentElement && !leaf(box, /^(done|cancel)$/i)) box = box.parentElement;
        const row = table.querySelector('tbody tr');
        const btn = re => { const e = leaf(box, re); return e && (e.closest('button') || e); };
        if (!row) { const c = btn(/^cancel$/i); if (c) c.click(); return; }
        row.click();
        await wait(80);
        const d = btn(/^done$/i); if (d) d.click();
      } finally { busy = false; }
    }
    function check() {
      if (busy) return;
      const h = [...document.querySelectorAll('h1')].find(e => /^extract resource$/i.test(e.textContent.trim()));
      if (!h) return;
      let panel = h; while (panel.parentElement && !leaf(panel, /^deposit$/i)) panel = panel.parentElement;
      const label = leaf(panel, /^deposit$/i), slot = label && label.nextElementSibling;
      if (!slot || done.has(slot)) return;
      done.add(slot);
      if (/^select\b/i.test(slot.innerText.trim())) pick(slot);
    }
    setInterval(check, 150);
  }
})();
