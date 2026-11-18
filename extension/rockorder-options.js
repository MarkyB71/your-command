// Skippy's Command Deck – options: the order building types are listed in on the Buildings card.
// Saved in your browser (chrome.storage.sync) only.
(() => {
  const DEF = ['Warehouse', 'Tank Farm', 'Extractor', 'Refinery', 'Bioreactor', 'Factory', 'Shipyard', 'Spaceport', 'Marketplace', 'Habitat'];
  const box = document.getElementById('rockOrder');
  const fix = o => { const a = (Array.isArray(o) ? o : []).filter(t => DEF.includes(t)); DEF.forEach(t => { if (!a.includes(t)) a.push(t); }); return a; };
  let order = DEF.slice();
  const saved = () => { const s = document.getElementById('saved'); s.textContent = 'Saved'; clearTimeout(s._t); s._t = setTimeout(() => { s.textContent = ''; }, 1500); };
  const save = () => chrome.storage.sync.set({ rockOrder: order }, saved);
  function draw() {
    box.innerHTML = '';
    order.forEach((t, i) => {
      const row = document.createElement('div'); row.className = 'trow';
      row.innerHTML = '<span style="flex:1">' + (i + 1) + '. ' + t + '</span>';
      [['▲', -1], ['▼', 1]].forEach(([s, d]) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'rm'; b.textContent = s;
        const j = i + d; b.disabled = j < 0 || j >= order.length; if (b.disabled) b.style.opacity = '.3';
        b.onclick = () => { [order[i], order[j]] = [order[j], order[i]]; draw(); save(); };
        row.appendChild(b);
      });
      box.appendChild(row);
    });
  }
  chrome.storage.sync.get({ rockOrder: DEF }, o => { order = fix(o.rockOrder); draw(); });
  document.getElementById('rockOrderReset').onclick = () => { order = DEF.slice(); draw(); save(); };
})();
