// Skippy's Command Deck – options: your friend / foe tags (kept in chrome.storage.local, this browser only).
(() => {
  const LABEL = { friendly: 'Friendly', neutral: 'Neutral', hostile: 'Hostile' };
  const ORDER = { hostile: 0, friendly: 1, neutral: 2, '': 3 };
  const list = document.getElementById('tagList'), count = document.getElementById('tagCount');
  const short = a => a.slice(0, 6) + '…' + a.slice(-4);
  const std = a => { try { return '0x' + BigInt(a).toString(16); } catch (e) { return null; } };
  let tags = {};
  const saved = t => { const s = document.getElementById('saved'); s.textContent = t || 'Saved'; clearTimeout(s._t); s._t = setTimeout(() => { s.textContent = ''; }, 2000); };
  const put = (msg) => chrome.storage.local.set({ mapTags: tags }, () => saved(msg));

  function draw() {
    const rows = Object.entries(tags).filter(([, t]) => t && (t.tag || t.name))
      .sort((a, b) => (ORDER[a[1].tag || ''] - ORDER[b[1].tag || '']) || (a[1].name || a[0]).localeCompare(b[1].name || b[0]));
    count.textContent = rows.length ? rows.length + ' player' + (rows.length === 1 ? '' : 's') + ' tagged' : 'No one tagged yet – click an asteroid on the game’s belt map to start.';
    list.textContent = '';
    rows.forEach(([addr, t]) => {
      const r = document.createElement('div'); r.className = 'trow';
      const nm = document.createElement('input'); nm.type = 'text'; nm.value = t.name || ''; nm.placeholder = 'Name'; nm.maxLength = 40;
      nm.addEventListener('change', () => { tags[addr].name = nm.value.trim(); put(); });
      const w = document.createElement('code'); w.textContent = short(addr); w.title = addr;
      const sel = document.createElement('select');
      Object.keys(LABEL).forEach(k => { const o = document.createElement('option'); o.value = k; o.textContent = LABEL[k]; sel.appendChild(o); });
      sel.value = t.tag || 'neutral';
      sel.addEventListener('change', () => { tags[addr].tag = sel.value; put(); draw(); });
      const x = document.createElement('button'); x.type = 'button'; x.className = 'rm'; x.textContent = '✕'; x.title = 'Remove this tag';
      x.addEventListener('click', () => { delete tags[addr]; put('Removed'); draw(); });
      r.append(nm, w, sel, x); list.appendChild(r);
    });
  }
  chrome.storage.local.get({ mapTags: {} }, o => { tags = o.mapTags || {}; draw(); });
  chrome.storage.onChanged.addListener((ch, area) => { if (area === 'local' && ch.mapTags) { tags = ch.mapTags.newValue || {}; draw(); } });

  // Share: save your list as a file a friend can import.
  document.getElementById('tagExport').addEventListener('click', () => {
    const data = JSON.stringify({ skippyTags: 1, exported: new Date().toISOString(), tags }, null, 1);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.download = 'skippy-tags.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });
  // Import: adds a friend's list to yours. Where you both tagged the same player, the imported tag is used.
  const file = document.getElementById('tagFile');
  document.getElementById('tagImport').addEventListener('click', () => file.click());
  file.addEventListener('change', () => {
    const f = file.files[0]; file.value = ''; if (!f) return;
    f.text().then(txt => {
      let d; try { d = JSON.parse(txt); } catch (e) { return saved('Not a tags file'); }
      const src = d && d.tags && typeof d.tags === 'object' ? d.tags : null;
      if (!src) return saved('Not a tags file');
      let n = 0;
      for (const a in src) {
        const k = std(a), t = src[a];
        if (!k || !t || typeof t !== 'object' || !(t.tag in LABEL || t.tag === '')) continue;
        const name = typeof t.name === 'string' ? t.name.slice(0, 40) : '';
        tags[k] = { tag: t.tag, name: name || (tags[k] && tags[k].name) || '' }; n++;
      }
      put('Imported ' + n); draw();
    });
  });
  // Clear all – asks first.
  document.getElementById('tagClear').addEventListener('click', () => {
    if (!Object.keys(tags).length) return;
    if (!confirm('Remove ALL your friend / foe tags? This can’t be undone (export them first if you might want them back).')) return;
    tags = {}; put('All tags cleared'); draw();
  });
})();
