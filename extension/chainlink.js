// Skippy's Command Deck – "SkippyChain ↗" button (0.6.7). Runs on game.influenceth.io only.
// When a process is picked in the game's Refine / Manufacture / Bioreactor / Shipyard window,
// a small gold button appears beside PROCESS. Clicking it opens that product in The SkippyChain
// on your Command Deck tab (amount = the runs you've set, on that same recipe, on that rock).
// It reads only the process name, the runs and the rock name from that window, and only
// when you click. It never presses anything in the game.
(() => {
  if (window.top !== window) return;
  const LOG = (...a) => console.log('[SkippyChain]', ...a); // test build only – remove before release
  LOG('loaded');
  chrome.storage.sync.get({ chainLink: true }, o => { LOG('option', o.chainLink); if (o.chainLink) start(); });

  function start() {
    // Works on the page's text pieces (not whole elements), so labels like "Produced: <b>1 products</b>" still match.
    const texts = root => {
      const out = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) { const v = n.nodeValue.trim(); if (v && !(n.parentElement && n.parentElement.closest('#yic-pc'))) out.push(n); }
      return out;
    };
    const has = (root, re) => texts(root).some(n => re.test(n.nodeValue.trim()));
    const SKIP = /^(process|setup time.*|required.*|produced.*|round|max|select.*|\d.*|[^a-z]*)$/i;

    function read(label) {
      // The window: walk up from PROCESS until it also holds "Produced".
      let panel = label.parentElement;
      while (panel.parentElement && !has(panel, /^produced\b/i)) panel = panel.parentElement;
      if (!has(panel, /^produced\b/i)) return null;
      // Process name: the first plain text after the PROCESS label.
      const all = texts(panel), i = all.indexOf(label);
      const nm = all.slice(i + 1).find(n => !SKIP.test(n.nodeValue.trim()));
      const n = nm && nm.nodeValue.trim();
      if (!n || n.length > 120) return null;
      // Runs: the number just before "SRs" (or "189 SRs" in one piece).
      let r = 1;
      for (let k = 0; k < all.length; k++) {
        const v = all[k].nodeValue.trim(), m = v.match(/^([\d,]+)\s*SRs$/i);
        if (m) { r = +m[1].replace(/,/g, ''); break; }
        if (/^SRs$/i.test(v) && k && /^[\d,]+$/.test(all[k - 1].nodeValue.trim())) { r = +all[k - 1].nodeValue.trim().replace(/,/g, ''); break; }
      }
      // Rock: the text just before "Lot #23" in the window's title, if it's there.
      let a = '', box = panel;
      for (let k = 0; k < 8 && box && !a; k++, box = box.parentElement) {
        const tx = texts(box), j = tx.findIndex(n => /lot\s*#\s*\d+$/i.test(n.nodeValue.trim()));
        if (j < 0) continue;
        const v = tx[j].nodeValue.trim().replace(/>?\s*lot\s*#\s*\d+$/i, '').replace(/>\s*$/, '').trim();
        a = v || (j && tx[j - 1].nodeValue.trim().replace(/>\s*$/, '').trim()) || '';
      }
      return { n, r: Math.max(1, Math.min(1e7, r || 1)), a: a.slice(0, 60) };
    }

    function check() {
      const labels = texts(document.body).filter(n => /^process$/i.test(n.nodeValue.trim()));
      for (const label of labels) {
        const host = label.parentElement;
        if (!host || host.querySelector('#yic-pc')) continue;
        let d = null;
        try { d = read(label); } catch (err) { LOG('read error', err); }
        LOG('label found, read:', JSON.stringify(d));
        if (!d) continue;
        const b = document.createElement('span');
        b.id = 'yic-pc';
        b.textContent = 'SkippyChain ↗';
        b.title = 'Open this in The SkippyChain on your Command Deck';
        b.setAttribute('role', 'button');
        b.style.cssText = 'margin-left:10px;padding:1px 7px;border:1px solid #ffd24a;border-radius:4px;color:#ffd24a;' +
          'font-size:11px;cursor:pointer;text-transform:none;letter-spacing:0;white-space:nowrap;display:inline-block;pointer-events:auto';
        b.addEventListener('mouseenter', () => { b.style.boxShadow = '0 0 8px rgba(255,210,74,.8)'; });
        b.addEventListener('mouseleave', () => { b.style.boxShadow = ''; });
        b.addEventListener('click', e => {
          e.preventDefault(); e.stopPropagation();
          const now = read(label); // read again: the process or runs may have changed since
          if (!now) return;
          try { chrome.runtime.sendMessage({ type: 'yic-chain', ...now }); } catch (err) {}
        });
        label.after(b);
        LOG('button added', !!document.getElementById('yic-pc'));
      }
    }

    let t = null;
    const run = () => { t = null; check(); };
    const go = () => {
      new MutationObserver(() => { if (!t) t = setTimeout(run, 300); }).observe(document.body, { childList: true, subtree: true });
      check();
    };
    if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
  }
})();
