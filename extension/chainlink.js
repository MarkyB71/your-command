// Skippy's Command Deck – "SkippyChain ↗" button (0.6.7). Runs on game.influenceth.io only.
// When a process is picked in the game's Refine / Manufacture / Bioreactor / Shipyard window,
// a small gold button appears beside PROCESS. Clicking it opens that product in The SkippyChain
// on your Command Deck tab (amount = the runs you've set, on that same recipe, on that rock).
// It reads only the process name, the runs and the rock name from that window, and only
// when you click. It never presses anything in the game.
(() => {
  if (window.top !== window) return;
  chrome.storage.sync.get({ chainLink: true }, o => { if (o.chainLink) start(); });

  function start() {
    const leaf = (root, re) => [...root.querySelectorAll('*')].find(e => !e.children.length && re.test(e.textContent.trim()));
    const SKIP = /^(process|setup time.*|required.*|produced.*|round|max|select.*|\d.*|[^a-z]*)$/i;

    function read(label) {
      // The window: walk up from PROCESS until it also holds "Produced".
      let panel = label;
      while (panel.parentElement && !leaf(panel, /^produced:?/i)) panel = panel.parentElement;
      if (!leaf(panel, /^produced:?/i)) return null;
      // Process name: the first plain text after the PROCESS label.
      const all = [...panel.querySelectorAll('*')].filter(e => !e.children.length && e.textContent.trim());
      const i = all.indexOf(label);
      const nameEl = all.slice(i + 1).find(e => !SKIP.test(e.textContent.trim()) && !e.closest('#yic-pc'));
      const n = nameEl && nameEl.textContent.trim();
      if (!n || n.length > 120) return null;
      // Runs: the "189 SRs" figure.
      const sr = [...panel.querySelectorAll('*')].filter(e => /^\s*[\d,]+\s*SRs\s*$/i.test(e.textContent))
        .sort((a, b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length)[0];
      const r = sr ? +sr.textContent.replace(/[^\d]/g, '') : 1;
      // Rock: the window's "<asteroid> > Lot #23" title, if it's there.
      let a = '', box = panel;
      for (let k = 0; k < 8 && box && !a; k++, box = box.parentElement) {
        const t = [...box.querySelectorAll('*')].find(e => /Lot\s*#\s*\d+\s*$/.test(e.textContent.trim()) && e.textContent.trim().length < 90 && e.children.length < 6);
        if (t) {
          const first = [...t.querySelectorAll('*')].find(e => !e.children.length && e.textContent.trim() && !/lot\s*#/i.test(e.textContent) && !/^>$/.test(e.textContent.trim()));
          a = (first ? first.textContent : t.textContent.replace(/>?\s*Lot\s*#\s*\d+\s*$/, '')).replace(/>\s*$/, '').trim();
        }
      }
      return { n, r: Math.max(1, Math.min(1e7, r || 1)), a: a.slice(0, 60) };
    }

    function check() {
      const labels = [...document.querySelectorAll('*')].filter(e => !e.children.length && /^process$/i.test(e.textContent.trim()));
      for (const label of labels) {
        if (label.parentElement.querySelector('#yic-pc')) continue;
        const d = read(label);
        if (!d) continue;
        const b = document.createElement('span');
        b.id = 'yic-pc';
        b.textContent = 'SkippyChain ↗';
        b.title = 'Open this in The SkippyChain on your Command Deck';
        b.setAttribute('role', 'button');
        b.style.cssText = 'margin-left:10px;padding:1px 7px;border:1px solid #ffd24a;border-radius:4px;color:#ffd24a;' +
          'font-size:11px;cursor:pointer;text-transform:none;letter-spacing:0;white-space:nowrap;display:inline-block';
        b.addEventListener('mouseenter', () => { b.style.boxShadow = '0 0 8px rgba(255,210,74,.8)'; });
        b.addEventListener('mouseleave', () => { b.style.boxShadow = ''; });
        b.addEventListener('click', e => {
          e.preventDefault(); e.stopPropagation();
          const now = read(label); // read again: the process or runs may have changed since
          if (!now) return;
          try { chrome.runtime.sendMessage({ type: 'yic-chain', ...now }); } catch (err) {}
        });
        label.after(b);
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
