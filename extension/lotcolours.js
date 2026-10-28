// Skippy's Command Deck – lot colours (runs on game.influenceth.io, in the page).
// The game forgets "highlight building categories" every time it loads. Once per load,
// this finds the game's own settings store and switches that one highlight back on –
// exactly what clicking the paint icon in Filter Lots › Building Categories does.
// Works whatever you have selected. Can be switched off in the extension's options. Touches nothing else and sends nothing anywhere.
(() => {
  if (window.top !== window) return;
  const COLOURS = { // the game's own Building Categories colours
    0: '#666666', 1: '#ff8c00', 2: '#d9352b', 3: '#cc3777', 4: '#0a9900', 5: '#b3855c',
    6: '#4848b3', 7: '#19d9ff', 8: '#57ff65', 9: '#ffff00', 14: '#777777', 15: '#ffffff'
  };
  const note = t => { document.documentElement.dataset.yicLotColours = t; };
  function stores() {
    let start = null;
    for (const el of document.querySelectorAll('body *')) {
      const k = Object.keys(el).find(k => k.startsWith('__reactFiber$'));
      if (k) { start = el[k]; break; }
    }
    const found = new Set();
    if (!start) return found;
    let f = start; while (f.return) f = f.return;
    const stack = [f]; let n = 0;
    while (stack.length && n < 300000) {
      const x = stack.pop(); n++;
      let h = x.memoizedState, g = 0;
      while (h && typeof h === 'object' && g < 80) {
        const m = h.memoizedState;
        if (m && typeof m === 'object' && m.current && typeof m.current === 'object'
          && typeof m.current.dispatchHighlightUpdated === 'function') found.add(m.current);
        h = h.next; g++;
      }
      if (x.sibling) stack.push(x.sibling);
      if (x.child) stack.push(x.child);
    }
    return found;
  }
  let tries = 0;
  note('waiting for the game to load');
  const t = setInterval(() => {
    if (++tries > 120) { clearInterval(t); note('gave up – game store not found'); return; }
    try {
      // Wait for game.js to pass on your options; stop if this tweak is switched off.
      const raw = document.documentElement.dataset.yicOpts;
      if (!raw) return;
      if (JSON.parse(raw).lotColours === false) { clearInterval(t); note('switched off in options'); return; }
      const s = [...stores()];
      if (!s.length) return;
      if (!s.some(x => x.assetSearch?.lotsMapped?.highlight?.field === 'category')) {
        s[0].dispatchHighlightUpdated('lotsMapped')({ field: 'category', colorMap: { ...COLOURS } });
      }
      clearInterval(t);
      note('switched on');
    } catch (e) { clearInterval(t); note('error – ' + e.message); }
  }, 1000);
})();
