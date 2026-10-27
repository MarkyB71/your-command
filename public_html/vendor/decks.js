/* Ship decks – Skippy's Command Deck
   Test on ?beta=1 first (Mark, 26 Oct 2026). The old header and menu row are hidden;
   a deck bar takes their place: The Bridge · Flight Deck · Crew Quarters · Engineering · Trade Deck.
   Under it, the pages of the deck you are on. It works by clicking the existing (hidden) page buttons,
   so every page and add-on keeps working as before. The deck bar lives inside the old sticky .bar,
   so sticky table headings and the SkippyChain bar still line up. */
(function () {
  'use strict';
  const DK = /[?&]beta=1/.test(location.search);
  window.YICDECKS = DK;
  if (!DK) return;

  const DECKS = [
    { id: 'bridge', name: 'The Bridge', ico: '◉', col: '#8fe3ff', pages: ['N'] },
    { id: 'flight', name: 'Flight Deck', ico: '🚀', col: '#9a6bff', pages: ['S', 'R', 'V', 'J'] },
    { id: 'crew', name: 'Crew Quarters', ico: '👥', col: '#3fd68a', pages: ['C', 'Q'] },
    { id: 'sci', name: 'Science Lab', ico: '🔬', col: '#4f90ff', pages: ['A', 'X', 'F', 'E'] },
    { id: 'eng', name: 'Engineering', ico: '🏭', col: '#e8645a', pages: ['H', 'P', 'U', 'B', 'T', 'L'] },
    { id: 'trade', name: 'Trade Deck', ico: '💰', col: '#ffd24a', pages: ['K', 'Y', 'M'] },
  ];
  window.YICDECKLIST = DECKS;

  const CSS = `
body > header{display:none!important}
.bar[data-mv="1"]{padding:0!important;display:block!important;background:linear-gradient(180deg,rgba(12,17,24,.97),rgba(5,7,10,.95))!important}
.bar[data-mv="1"] > :not(#deckbar){display:none!important}
.toprow[data-mv="1"]{display:none!important}
#deckbar{display:block;padding:8px 16px 0}
#deckbar .dk-row{display:flex;gap:6px;flex-wrap:wrap;align-items:flex-end}
#deckbar .dk{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:8px;padding:9px 18px 8px;font:700 13px/1 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#8b9ab0;background:#0c1118;border:1px solid #243041;border-bottom:0;clip-path:polygon(10px 0,calc(100% - 10px) 0,100% 100%,0 100%);transition:color .15s,background .15s,box-shadow .15s}
#deckbar .dk:hover,#deckbar .dk:focus-visible{color:var(--dc);background:#121a24}
#deckbar .dk.on{color:#05070a;background:var(--dc);box-shadow:0 0 18px var(--dc)}
#deckbar .dk .dl{width:7px;height:7px;border-radius:50%;background:var(--dc);box-shadow:0 0 6px var(--dc)}
#deckbar .dk.on .dl{background:#05070a;box-shadow:none}
#deckbar .dk-sub{display:flex;gap:4px;flex-wrap:wrap;padding:6px 0 8px;border-top:2px solid var(--dcur,#8fe3ff);box-shadow:0 -1px 10px -2px var(--dcur,#8fe3ff)}
#deckbar .dk-sub:empty{padding:0 0 6px}
#deckbar .pg{all:unset;box-sizing:border-box;cursor:pointer;padding:6px 12px;font:600 13px/1.1 system-ui,sans-serif;color:#c4cdd9;border-radius:4px;border:1px solid transparent}
#deckbar .pg:hover,#deckbar .pg:focus-visible{color:var(--dcur);border-color:var(--dcur);box-shadow:0 0 10px -2px var(--dcur)}
#deckbar .pg.on{color:var(--dcur);background:rgba(255,255,255,.05);border-color:var(--dcur)}
/* compact crewmate cards on every deck (Mark, 27 Oct) – Ships crew on board + Crews page */
.cob{min-width:0;padding:5px 7px;margin:1px 0 4px;border-radius:8px}
.cob-h{margin-bottom:4px;gap:8px;font-size:12px}
.cob-f{max-width:50px;height:4px}
.cob-r{gap:4px}
.cob-m{width:34px}
.cob-m img{width:30px;height:38px;border-radius:4px;border-width:1px}
.cob-n{font-size:9.5px;max-width:34px;margin-top:2px}
.cob-c{display:none}
#main div[style*="width:150px"]:has(> img[data-face]){width:96px!important;padding:4px!important;gap:2px!important;font-size:11px;line-height:1.2}
#main div[style*="width:150px"]:has(> img[data-face]) > img[data-face]{width:40px!important;height:52px!important;border-radius:4px!important}
#main div[style*="width:150px"]:has(> img[data-face]) > .a{font-size:10px!important}
#main div[style*="gap:10px"]:has(> div > img[data-face]){gap:6px!important}
@media (max-width:700px){#deckbar{padding:6px 8px 0}#deckbar .dk{padding:8px 10px 7px;letter-spacing:.06em;font-size:11px}}
@media (prefers-reduced-motion:reduce){#deckbar .dk{transition:none}}
`;

  const btn = (k) => document.getElementById('v' + k);
  const label = (k) => {
    const b = btn(k);
    return b ? (b.textContent || '').replace(/[▾▸]/g, '').trim() : '';
  };
  const current = () => {
    const on = [...document.querySelectorAll('[id^="v"].on')].find((b) => /^v[A-Z]$/.test(b.id));
    return on ? on.id.slice(1) : 'N';
  };
  const deckOf = (k) => DECKS.find((d) => d.pages.includes(k)) || DECKS[0];
  const go = (k) => {
    const b = btn(k);
    if (b) {
      b.click();
      scrollTo(0, 0);
    }
  };
  window.YICgoDeck = (id) => {
    const d = DECKS.find((x) => x.id === id);
    if (d) go(d.pages.find((k) => btn(k)) || d.pages[0]);
  };

  // Each deck can add its own scene above the page (window.YICDECKHERO[id](el)) and its own
  // console look (body class dk-<id>). The bridge draws its own scene in pages/workload.js.
  window.YICDECKHERO = window.YICDECKHERO || {};
  function deckLook(d) {
    const b = document.body;
    DECKS.forEach((x) => b.classList.toggle('dk-' + x.id, x === d));
    const main = document.getElementById('main');
    let h = document.getElementById('deckhero');
    const fn = d.id !== 'bridge' && window.YICDECKHERO[d.id];
    if (!fn || !main) {
      if (h) h.remove();
      return;
    }
    if (h && h.dataset.deck === d.id && h.nextElementSibling === main) return;
    if (h) h.remove();
    h = document.createElement('div');
    h.id = 'deckhero';
    h.dataset.deck = d.id;
    main.parentNode.insertBefore(h, main);
    try {
      fn(h);
    } catch (e) {
      h.remove();
    }
  }

  let sig = '';
  function tick() {
    if (!document.getElementById('dk-css')) {
      const s = document.createElement('style');
      s.id = 'dk-css';
      s.textContent = CSS;
      document.head.appendChild(s);
    }
    const bar = document.querySelector('.bar[data-mv="1"]');
    if (!bar || !window.YIC) return;
    let db = document.getElementById('deckbar');
    if (!db) {
      db = document.createElement('div');
      db.id = 'deckbar';
      db.addEventListener('click', (e) => {
        const t = e.target.closest('[data-deck],[data-pg]');
        if (!t) return;
        if (t.dataset.deck) window.YICgoDeck(t.dataset.deck);
        else go(t.dataset.pg);
      });
    }
    if (db.parentNode !== bar) bar.prepend(db);
    const cur = current(),
      d = deckOf(cur);
    deckLook(d);
    const have = d.pages.filter((k) => btn(k)),
      s = cur + '|' + have.join('') + '|' + have.map(label).join(',');
    if (s === sig && db.firstChild) return;
    sig = s;
    db.style.setProperty('--dcur', d.col);
    db.innerHTML =
      '<div class="dk-row">' +
      DECKS.map(
        (x) =>
          '<button type="button" class="dk' + (x === d ? ' on' : '') + '" data-deck="' + x.id + '" style="--dc:' + x.col +
          '"><i class="dl"></i>' + x.name + '</button>',
      ).join('') +
      '</div><div class="dk-sub">' +
      (have.length > 1
        ? have.map((k) => '<button type="button" class="pg' + (k === cur ? ' on' : '') + '" data-pg="' + k + '">' + label(k).replace(/[<>&]/g, '') + '</button>').join('')
        : '') +
      '</div>';
  }
  setInterval(tick, 400);
  document.addEventListener('click', () => setTimeout(tick, 50), true);
})();
