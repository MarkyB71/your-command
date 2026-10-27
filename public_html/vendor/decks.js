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
#deckbar .dk-sub{align-items:center}
#dktools{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-left:auto;padding-left:10px}
#dktools > *{margin:0!important}
#dktools button{position:static!important;font-size:12px!important;padding:5px 10px!important;line-height:1.2!important;white-space:nowrap}
#dktools #wc-top{order:9}
#dktools [data-srch="2"]{padding:0!important}
#dktools [data-srch="2"] input{width:170px!important;min-width:0!important;padding:5px 9px!important;font-size:12px!important}
/* phones (Mark asked for a phone check, 27 Oct): menu not sticky so it doesn't eat the screen, deck tabs on one swipe row, screen full width */
@media (max-width:700px){.bar[data-mv="1"]{position:static!important}#deckbar .dk-row{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}#deckbar .dk{flex:none}#dktools #cdx{display:none!important}#deckroom{margin:8px 4px 0!important}#deckroom.scr .dkr-vs{width:98%}#deckroom .en-row{gap:6px}#deckroom .en-g:not(.en-raw){width:calc(33.3% - 4px);padding:6px 2px}#deckroom .en-g:not(.en-raw) svg{width:100%;height:auto}#deckroom .en-g:not(.en-raw) :is(.en-n,.en-s){font-size:10px;letter-spacing:.04em;min-height:0}.dkr-pg{padding:38px 6px 10px!important}.dkr-plate{display:none!important}}
@media (max-width:700px){#dktools{margin-left:0;padding:6px 0 0;width:100%}#dktools [data-srch="2"]{flex:1 1 100%}#dktools [data-srch="2"] input{width:100%!important}}
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

  let scr = false; // true = the chosen page is on the viewscreen (Mark, 27 Oct)
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
    scr = false;
    const d = DECKS.find((x) => x.id === id);
    if (d) go(d.pages.find((k) => btn(k)) || d.pages[0]);
  };

  // Each deck is a room like the Bridge (Mark, 27 Oct): same viewscreen + consoles, its own walls,
  // props and colour. The deck's own piece (window.YICDECKHERO[id](el)) goes on the viewscreen;
  // the consoles are the deck's pages. The bridge draws its own scene in pages/workload.js.
  window.YICDECKHERO = window.YICDECKHERO || {};
  const ROOM = /[?&]beta=1/.test(location.search);
  const DESC = {
    S: 'Your fleet', R: 'Trip times · launch windows', V: 'In · out · on the way', J: 'What your crews did',
    C: 'Who is on duty', Q: 'Swap crewmates around', A: 'Your rocks', X: 'Untouched samples', F: 'Richest lots',
    E: 'Who can mine what', H: 'How things are made', P: 'Stock by product', U: 'What to build where',
    B: "What's in storage", T: 'Jobs running', L: 'Lease end dates', K: 'Listings on the belt',
    Y: 'Buy low · sell high', M: 'Recent trades',
  };
  const PIECE = { flight: 'Navigation', crew: 'Lockers', sci: 'Specimen rack', eng: 'Control panel', trade: 'Exchange board' };
  const SEAT = { flight: "Pilot's seat", crew: 'Mess table', sci: 'Lab bench', eng: 'Reactor core', trade: 'Trading counter' };
  const ROOM_CSS = `
#deckroom{position:relative;margin:14px 16px 0;border-radius:14px;overflow:hidden;background:#04060a;border:1px solid #1d2734;box-shadow:0 0 40px rgba(0,0,0,.6) inset}
.dkr-bg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.dkr-vs{position:relative;z-index:1;width:84%;margin:26px auto 0;padding:7px;background:linear-gradient(180deg,#2a3646,#121a24);clip-path:polygon(3% 0,97% 0,100% 8%,100% 100%,0 100%,0 8%);box-shadow:0 0 30px color-mix(in srgb,var(--dc) 25%,transparent)}
#deckroom #deckhero{margin:0!important;border:0!important;border-radius:0!important;clip-path:polygon(3% 0,97% 0,100% 8%,100% 100%,0 100%,0 8%)!important;padding-bottom:12px!important}
.dkr-deck{position:relative;z-index:1;display:grid;gap:10px;align-items:end;padding:14px 4% 0;perspective:1100px}
.dkr-st{all:unset;box-sizing:border-box;cursor:pointer;display:block;min-width:0;transform:rotateY(var(--ry)) rotateX(18deg);transform-origin:50% 100%;transition:transform .2s,filter .2s}
.dkr-st:hover,.dkr-st:focus-visible{transform:rotateY(var(--ry)) rotateX(8deg) translateY(-4px);filter:drop-shadow(0 0 14px var(--dc))}
.dkr-scr{display:block;position:relative;padding:10px 12px;border-radius:8px 8px 2px 2px;background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(0,0,0,.2)),repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px),#0a1119;border:2px solid #2a3646;border-top:3px solid var(--dc);box-shadow:0 0 16px -6px var(--dc),inset 0 0 22px -10px var(--dc)}
.dkr-off{cursor:default;pointer-events:none;filter:saturate(.3) brightness(.7)}
.dkr-off .dkr-scr{box-shadow:none;border-top-color:#2a3646}
.dkr-off .dkr-d{color:#4a5768;font-family:ui-monospace,Menlo,monospace;letter-spacing:.2em;text-transform:uppercase;font-size:10px}
.dkr-st.on .dkr-scr{border-color:var(--dc);box-shadow:0 0 22px -4px var(--dc),inset 0 0 30px -8px var(--dc)}
.dkr-h{display:flex;align-items:center;gap:6px;font:700 12px/1.2 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--dc)}
.dkr-led{margin-left:auto;flex:none;width:7px;height:7px;border-radius:50%;background:var(--dc);opacity:.35}
.dkr-st.on .dkr-led{opacity:1;box-shadow:0 0 8px var(--dc);animation:dkrLed 2.6s ease-in-out infinite}
.dkr-d{display:block;font-size:12px;color:#8b9ab0;margin-top:5px}
.dkr-go{display:block;margin-top:7px;font:700 10px/1 system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:var(--dc)}
.dkr-st.on .dkr-go{color:#e6ebf2}
.dkr-base{display:flex;justify-content:center;gap:5px;height:20px;align-items:center;margin:0 -6px;background:linear-gradient(180deg,#1f2a38,#0d131b);clip-path:polygon(0 0,100% 0,94% 100%,6% 100%)}
.dkr-base i{width:12px;height:5px;border-radius:2px;background:var(--dc);opacity:.35}
.dkr-st.on .dkr-base i:nth-child(2){opacity:.9;box-shadow:0 0 6px var(--dc)}
.dkr-seat{align-self:end;display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none}
.dkr-seat svg{display:block;width:100%;max-width:150px;height:auto;filter:drop-shadow(0 0 10px color-mix(in srgb,var(--dc) 30%,transparent))}
.dkr-home{all:unset;box-sizing:border-box;align-self:end;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;pointer-events:auto;transition:filter .2s}
.dkr-home:hover,.dkr-home:focus-visible{filter:drop-shadow(0 0 12px var(--dc))}
.dkr-home:hover .dkr-sl,.dkr-home:focus-visible .dkr-sl{opacity:1;text-shadow:0 0 8px var(--dc)}
.dkr-sl{font:700 10px/1.2 system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:var(--dc);opacity:.75;text-align:center}
.dkr-floor{position:relative;height:24px;margin-top:-2px;background:radial-gradient(ellipse at 50% 0,color-mix(in srgb,var(--dc) 22%,transparent),transparent 70%)}
.dkr-bg .bl{animation:dkrBlink 4s infinite}
.dkr-bg .pu{animation:dkrLed 3s ease-in-out infinite}
/* deck pieces sitting on the viewscreen (Mark, 27 Oct) */
#deckroom :is(.cq-read,.sl-read,.en-read,.tb-read){left:4.5%!important}
#deckroom :is(.sl-hint,.en-hint,.tb-mine){right:4.5%!important}
#deckroom #deckhero[data-deck="flight"]{padding:0!important;background:none!important}
#deckroom .fh-win{clip-path:none!important}
#deckroom .sl-row{justify-content:safe center;padding-left:3%;padding-right:3%}
#deckroom .cq-row{padding-left:3%;padding-right:3%}
#deckroom .en-g:not(.en-raw){width:134px}
#deckroom .en-g:not(.en-raw) svg{width:106px;height:76px}
#deckroom .en-row{gap:10px}
.dkr-back{all:unset;box-sizing:border-box;position:absolute;z-index:3;left:4.5%;top:7px;display:none;cursor:pointer;padding:3px 12px 4px;border:1px solid var(--dc);border-radius:4px;background:#0c1118;font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--dc)}
.dkr-back:hover,.dkr-back:focus-visible{background:var(--dc);color:#05070a;box-shadow:0 0 12px var(--dc)}
.dkr-plate{position:absolute;z-index:2;left:50%;top:7px;transform:translateX(-50%);display:none;padding:3px 24px 4px;background:#0c1118;clip-path:polygon(0 0,100% 0,92% 100%,8% 100%);font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.35em;text-transform:uppercase;color:var(--dc);text-shadow:0 0 8px var(--dc);white-space:nowrap;pointer-events:none}
/* deck view: nothing under the room – pages open on the screen (Mark, 27 Oct; may come back for pages too big for the screen) */
#deckroom:not(.scr) + #main{display:none!important}
#deckroom.scr .dkr-back,#deckroom.scr .dkr-plate,#deckroom.scr .dkr-ast{display:block}
.dkr-ast{all:unset;box-sizing:border-box;position:absolute;z-index:3;right:4.5%;top:7px;display:none;cursor:pointer;min-width:0!important;width:auto!important;max-width:220px;padding:3px 24px 4px 10px;border:1px solid var(--dc);border-radius:4px;background:#0c1118 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238b9ab0'/%3E%3C/svg%3E") no-repeat right 8px center;font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--dc)}
.dkr-ast option{background:#0c1118;color:#e6ebf2;text-transform:none}
#deckroom.scr .dkr-vs{width:93%}
.dkr-pg{position:relative;height:clamp(380px,66vh,860px);overflow:auto;padding:36px 18px 16px;clip-path:polygon(3% 0,97% 0,100% 5%,100% 100%,0 100%,0 5%);background:repeating-linear-gradient(0deg,rgba(255,255,255,.02) 0 1px,transparent 1px 3px),radial-gradient(ellipse at 50% 0,#0d1825,#05080d 75%);scrollbar-color:#2c3a4c transparent}
#deckroom .dkr-pg > #main{margin:0!important;padding:0!important;max-width:none!important;background:none!important;border:0!important;box-shadow:none!important}
#deckroom .dkr-pg th{transform:none!important}
#deckroom .dkr-pg .pc-bar.stick{top:0!important}
@keyframes dkrLed{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes dkrBlink{0%,92%,100%{opacity:.25}95%{opacity:1}}
@media (max-width:760px){#deckroom{margin:10px 8px 0}.dkr-deck{grid-template-columns:1fr 1fr!important;perspective:none}.dkr-seat{display:none}.dkr-st,.dkr-st:hover{transform:none}.dkr-vs{width:94%}#deckroom #deckhero{clip-path:none!important}.dkr-pg{clip-path:none;height:70vh;padding:40px 8px 12px}}
@media (prefers-reduced-motion:reduce){.dkr-bg .bl,.dkr-bg .pu,.dkr-st.on .dkr-led{animation:none}.dkr-st{transition:none}}
`;
  // wall props, drawn on the left wall and mirrored onto the right
  function wall(id, c) {
    const L = [],
      R = (x, y, w, h, a) => L.push(['r', x, y, w, h, a || '']),
      E = (x, y, rx, ry, a) => L.push(['e', x, y, rx, ry, a || '']),
      P = (d, a) => L.push(['p', d, a || '']);
    if (id === 'flight') {
      [130, 250].forEach((y) => {
        E(44, y, 17, 24, 'fill="#05040c" stroke="#3b3060" stroke-width="4"');
        [[38, -10], [50, 4], [42, 12], [53, -14], [35, 6]].forEach(([x, dy]) => E(x, y + dy, 0.9, 1.1, 'fill="#fff" opacity=".8"'));
      });
      [60, 340, 400].forEach((y) => P('M8,' + y + ' Q44,' + (y - 14) + ' 76,' + y, 'stroke="#2c2448" stroke-width="3" fill="none"'));
      R(30, 300, 28, 6, 'fill="' + c + '" opacity=".5" class="pu"');
    } else if (id === 'crew') {
      [16, 46].forEach((x, i) => {
        R(x, 90, 26, 250, 'fill="#101a15" stroke="#24382d" stroke-width="2"');
        [104, 112, 120].forEach((y) => R(x + 6, y, 14, 2, 'fill="#24382d"'));
        R(x + 18, 210, 3, 16, 'fill="#3a5446"');
        E(x + 13, 320, 2.5, 2.5, 'fill="' + c + '" class="bl" style="animation-delay:' + i * 1.7 + 's"');
      });
      R(12, 360, 64, 8, 'fill="#1a2a21" stroke="#24382d"');
    } else if (id === 'sci') {
      [120, 200, 280].forEach((y, j) => {
        R(10, y, 66, 4, 'fill="#22304a"');
        [16, 30, 44, 58].forEach((x, i) => {
          const h = 18 + ((i + j) % 3) * 8,
            col = ['#4f90ff', '#3fd68a', '#b388ff', '#8fe3ff'][(i + j) % 4];
          R(x, y - h, 8, h, 'fill="#0b1220" stroke="#33466a"');
          R(x + 1, y - h * 0.55, 6, h * 0.55, 'fill="' + col + '" opacity=".55"' + ((i + j) % 3 === 0 ? ' class="pu"' : ''));
        });
      });
    } else if (id === 'eng') {
      [28, 58].forEach((x) => {
        R(x - 6, 20, 12, 430, 'fill="#2a1916" stroke="#4a2a25"');
        [90, 210, 330].forEach((y) => R(x - 8, y, 16, 8, 'fill="#4a2a25"'));
      });
      E(28, 150, 14, 14, 'fill="none" stroke="' + c + '" stroke-width="3" opacity=".7"');
      E(58, 270, 12, 12, 'fill="none" stroke="#ffab3d" stroke-width="3" opacity=".6"');
      for (let i = 0; i < 4; i++) P('M' + (8 + i * 18) + ',420 l10,0 l-14,20 l-10,0 z', 'fill="#ffab3d" opacity=".35"');
      E(44, 380, 3, 3, 'fill="' + c + '" class="bl"');
    } else if (id === 'trade') {
      R(14, 96, 60, 44, 'fill="#0d0b06" stroke="#3a321a" stroke-width="2"');
      [106, 116, 126].forEach((y, i) => R(20, y, 30 + ((i * 13) % 20), 3, 'fill="' + c + '" opacity=".55"' + (i === 1 ? ' class="pu"' : '')));
      [[12, 300], [44, 300], [24, 256], [16, 360], [48, 360]].forEach(([x, y]) => {
        R(x, y, 30, 40, 'fill="#211b0c" stroke="#4a3f1e" stroke-width="2"');
        P('M' + x + ',' + y + ' l30,40 M' + (x + 30) + ',' + y + ' l-30,40', 'stroke="#4a3f1e" stroke-width="1.5"');
      });
    }
    const draw = (m) =>
      L.map((o) => {
        if (o[0] === 'r') return '<rect x="' + (m ? 1000 - o[1] - o[3] : o[1]) + '" y="' + o[2] + '" width="' + o[3] + '" height="' + o[4] + '" ' + o[5] + '/>';
        if (o[0] === 'e') return '<ellipse cx="' + (m ? 1000 - o[1] : o[1]) + '" cy="' + o[2] + '" rx="' + o[3] + '" ry="' + o[4] + '" ' + o[5] + '/>';
        return '<path d="' + o[1] + '" ' + o[2] + (m ? ' transform="translate(1000 0) scale(-1 1)"' : '') + '/>';
      }).join('');
    return draw(false) + draw(true);
  }
  function roomBg(d) {
    const c = d.col;
    return (
      '<svg class="dkr-bg" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true"><defs>' +
      '<linearGradient id="dkrW" x1="0" x2="1"><stop offset="0" stop-color="#0d131b"/><stop offset="1" stop-color="#141c26"/></linearGradient>' +
      '<linearGradient id="dkrW2" x1="1" x2="0"><stop offset="0" stop-color="#0d131b"/><stop offset="1" stop-color="#141c26"/></linearGradient>' +
      '<radialGradient id="dkrF" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="' + c + '" stop-opacity=".16"/><stop offset="1" stop-color="#05070a" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="1000" height="620" fill="#05070a"/><rect width="1000" height="620" fill="url(#dkrF)"/>' +
      '<polygon points="0,0 1000,0 920,18 80,18" fill="#0f1620"/>' +
      '<line x1="120" y1="9" x2="880" y2="9" stroke="' + c + '" stroke-opacity=".4" stroke-width="2"/>' +
      '<polygon points="0,0 80,18 80,460 0,620" fill="url(#dkrW)"/>' +
      '<polygon points="1000,0 920,18 920,460 1000,620" fill="url(#dkrW2)"/>' +
      wall(d.id, c) +
      '<path d="M80,460 Q500,500 920,460" stroke="' + c + '" stroke-opacity=".22" stroke-width="2" fill="none"/>' +
      '<path d="M0,620 Q500,540 1000,620" stroke="' + c + '" stroke-opacity=".14" stroke-width="2" fill="none"/></svg>'
    );
  }
  // the thing in the middle of each room (the Bridge has the captain's chair)
  function seat(id, c) {
    const g = '<defs><linearGradient id="dkrC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c3a4c"/><stop offset="1" stop-color="#121a24"/></linearGradient></defs>';
    const base = '<ellipse cx="70" cy="138" rx="56" ry="11" fill="none" stroke="' + c + '" stroke-opacity=".25"/>';
    let b = '';
    if (id === 'flight')
      b = '<path d="M42,14 Q70,4 98,14 L102,86 L38,86 Z" fill="url(#dkrC)" stroke="#3a4b60"/><path d="M50,24 Q70,18 90,24 L92,78 L48,78 Z" fill="#0c1118" stroke="' + c + '" stroke-opacity=".4"/>' +
        '<path d="M30,86 L110,86 L104,102 L36,102 Z" fill="#1b2430" stroke="#3a4b60"/><rect x="64" y="102" width="12" height="30" fill="#141c26"/><ellipse cx="70" cy="138" rx="38" ry="8" fill="#141c26" stroke="#3a4b60"/>' +
        '<path d="M14,62 h22 v8 h-22 z M104,62 h22 v8 h-22 z" fill="#1b2430" stroke="#3a4b60"/><rect x="18" y="64" width="8" height="4" fill="' + c + '"/><rect x="114" y="64" width="8" height="4" fill="' + c + '"/>';
    else if (id === 'crew')
      b = '<ellipse cx="70" cy="80" rx="58" ry="14" fill="url(#dkrC)" stroke="#3a4b60"/><rect x="62" y="86" width="16" height="44" fill="#141c26"/><ellipse cx="70" cy="136" rx="34" ry="7" fill="#141c26" stroke="#3a4b60"/>' +
        '<rect x="40" y="62" width="12" height="14" rx="2" fill="#0c1118" stroke="' + c + '"/><rect x="86" y="64" width="12" height="12" rx="2" fill="#0c1118" stroke="' + c + '"/><path d="M46,58 q3,-6 0,-12 M92,60 q3,-6 0,-12" stroke="#8b9ab0" stroke-opacity=".5" fill="none"/>' +
        '<rect x="8" y="104" width="30" height="8" rx="3" fill="#1b2430" stroke="#3a4b60"/><rect x="102" y="104" width="30" height="8" rx="3" fill="#1b2430" stroke="#3a4b60"/>';
    else if (id === 'sci')
      b = '<rect x="14" y="96" width="112" height="10" rx="2" fill="url(#dkrC)" stroke="#3a4b60"/><rect x="22" y="106" width="8" height="30" fill="#141c26"/><rect x="110" y="106" width="8" height="30" fill="#141c26"/>' +
        '<rect x="56" y="86" width="40" height="10" rx="2" fill="#1b2430" stroke="#3a4b60"/><path d="M84,86 L84,40 L66,22" stroke="#3a4b60" stroke-width="10" fill="none" stroke-linecap="round"/><rect x="58" y="12" width="14" height="22" rx="3" transform="rotate(-45 65 23)" fill="#2c3a4c" stroke="#3a4b60"/>' +
        '<rect x="70" y="56" width="8" height="18" fill="#2c3a4c"/><circle cx="74" cy="80" r="4" fill="' + c + '" class="pu"/>' +
        '<rect x="26" y="74" width="8" height="22" rx="2" fill="#0b1220" stroke="#33466a"/><rect x="27" y="84" width="6" height="12" fill="#3fd68a" opacity=".6"/><rect x="38" y="80" width="8" height="16" rx="2" fill="#0b1220" stroke="#33466a"/><rect x="39" y="86" width="6" height="10" fill="' + c + '" opacity=".6"/>';
    else if (id === 'eng')
      b = '<ellipse cx="70" cy="132" rx="44" ry="10" fill="#141c26" stroke="#3a4b60"/><rect x="40" y="20" width="60" height="112" fill="url(#dkrC)" stroke="#3a4b60"/><ellipse cx="70" cy="20" rx="30" ry="7" fill="#2c3a4c" stroke="#3a4b60"/>' +
        '<rect x="56" y="30" width="28" height="96" rx="6" fill="#0c1118" stroke="' + c + '" stroke-opacity=".6"/><rect x="60" y="34" width="20" height="88" rx="4" fill="' + c + '" opacity=".45" class="pu"/>' +
        [50, 74, 98].map((y) => '<rect x="38" y="' + y + '" width="64" height="4" fill="#3a4b60"/>').join('');
    else if (id === 'trade')
      b = '<path d="M10,84 L130,84 L124,132 L16,132 Z" fill="url(#dkrC)" stroke="#3a4b60"/><rect x="6" y="78" width="128" height="8" rx="2" fill="#2c3a4c" stroke="#3a4b60"/><rect x="24" y="100" width="92" height="3" fill="' + c + '" opacity=".4"/>' +
        [[30, 4], [46, 6], [92, 5]].map(([x, n]) => Array.from({ length: n }, (_, i) => '<ellipse cx="' + (x + 6) + '" cy="' + (74 - i * 5) + '" rx="9" ry="3" fill="' + c + '" stroke="#8a6d1c" stroke-width=".8"/>').join('')).join('') +
        '<rect x="64" y="50" width="20" height="26" rx="2" fill="#0d0b06" stroke="' + c + '" stroke-opacity=".6"/><path d="M67,70 l4,-6 l4,3 l6,-10" stroke="#3fd68a" stroke-width="1.5" fill="none"/>';
    return '<svg viewBox="0 0 140 150" aria-hidden="true">' + g + b + base + '</svg>';
  }
  function deckLook(d) {
    const b = document.body;
    DECKS.forEach((x) => b.classList.toggle('dk-' + x.id, x === d));
    const main = document.getElementById('main');
    const fn = d.id !== 'bridge' && window.YICDECKHERO[d.id];
    let room = document.getElementById('deckroom'),
      h = document.getElementById('deckhero');
    if (!fn || !main) {
      scr = false;
      mainBack();
      if (room) room.remove();
      if (h) h.remove();
      return;
    }
    if (ROOM) {
      const nx = room && room.nextElementSibling;
      if (room && room.dataset.deck === d.id && (nx === main || (nx && nx.id === 'dkr-slot')) && h && room.contains(h)) return markRoom(room);
      mainBack();
      if (room) room.remove();
      if (h) h.remove();
      const pages = d.pages.filter((k) => btn(k)),
        nl = Math.ceil(pages.length / 2),
        nr = pages.length - nl + (pages.length % 2),
        cols = pages.slice(0, nl).map(() => '1fr').concat(['.75fr'], Array.from({ length: nr }, () => '1fr'));
      const st = (k, i) => {
        const off = i < nl ? nl - i : -(i - nl + 1),
          ry = Math.max(-16, Math.min(16, off * 7));
        return (
          '<button type="button" class="dkr-st" data-pg="' + k + '" style="--ry:' + ry + 'deg" title="Open ' + label(k).replace(/["<>&]/g, '') + '"><span class="dkr-scr"><span class="dkr-h">' +
          label(k).replace(/[<>&]/g, '') + '<i class="dkr-led"></i></span><span class="dkr-d">' + (DESC[k] || '') + '</span><span class="dkr-go">Open ▸</span></span><span class="dkr-base"><i></i><i></i><i></i><i></i></span></button>'
        );
      };
      room = document.createElement('div');
      room.id = 'deckroom';
      room.dataset.deck = d.id;
      room.style.setProperty('--dc', d.col);
      room.innerHTML =
        roomBg(d) + '<div class="dkr-vs"><button type="button" class="dkr-back" title="Back to the ' + (PIECE[d.id] || 'deck view').toLowerCase() + '">◂ ' + (PIECE[d.id] || 'Deck view') + '</button><span class="dkr-plate"></span><select class="dkr-ast" title="Which rock this page shows"></select></div><div class="dkr-deck" style="grid-template-columns:' + cols.join(' ') + '">' +
        pages.slice(0, nl).map((k, i) => st(k, i)).join('') +
        // the centre piece takes you back to the deck's starting view (Mark, 27 Oct)
        '<button type="button" class="dkr-seat dkr-home" title="Back to the ' + d.name + ' start">' + seat(d.id, d.col) + '<span class="dkr-sl">' + (SEAT[d.id] || '') + '</span></button>' +
        pages.slice(nl).map((k, i) => st(k, i + nl)).join('') +
        // odd number of pages: a switched-off console keeps both sides even (Mark, 27 Oct)
        (pages.length % 2 ? '<div class="dkr-st dkr-off" aria-hidden="true" style="--ry:' + Math.max(-16, -nr * 7) + 'deg"><span class="dkr-scr"><span class="dkr-h">&nbsp;<i class="dkr-led"></i></span><span class="dkr-d">Standby</span><span class="dkr-go">&nbsp;</span></span><span class="dkr-base"><i></i><i></i><i></i><i></i></span></div>' : '') +
        '</div><div class="dkr-floor"></div>';
      room.addEventListener('click', (e) => {
        if (e.target.closest('.dkr-home')) return window.YICgoDeck(d.id);
        if (e.target.closest('.dkr-back')) {
          scr = false;
          return markRoom(room);
        }
        const t = e.target.closest('.dkr-st');
        if (t) {
          scr = true;
          go(t.dataset.pg);
          markRoom(room);
        }
      });
      main.parentNode.insertBefore(room, main);
      h = document.createElement('div');
      h.id = 'deckhero';
      h.dataset.deck = d.id;
      room.querySelector('.dkr-vs').appendChild(h);
      try {
        fn(h);
      } catch (e) {
        h.remove();
      }
      return markRoom(room);
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
  let lastPg = '';
  function markRoom(room) {
    const cur = current();
    room.querySelectorAll('.dkr-st').forEach((s) => s.classList.toggle('on', s.dataset.pg === cur));
    const main = document.getElementById('main'),
      vs = room.querySelector('.dkr-vs'),
      h = document.getElementById('deckhero');
    if (!main || !vs) return;
    if (scr) {
      let slot = document.getElementById('dkr-slot');
      if (!slot) {
        slot = document.createElement('div');
        slot.id = 'dkr-slot';
        main.parentNode.insertBefore(slot, main);
      }
      let pg = vs.querySelector('.dkr-pg');
      if (!pg) {
        pg = document.createElement('div');
        pg.className = 'dkr-pg';
        vs.appendChild(pg);
      }
      if (main.parentNode !== pg) pg.appendChild(main);
      if (h) h.style.display = 'none';
      room.classList.add('scr');
      const pl = vs.querySelector('.dkr-plate');
      const q = document.getElementById('gq');
      if (pl) pl.textContent = q && q.value.trim() ? 'Search results' : label(cur);
      syncAst(vs);
      if (cur !== lastPg) pg.scrollTop = 0;
      lastPg = cur;
    } else {
      mainBack();
      if (h) h.style.display = '';
      room.classList.remove('scr');
      lastPg = '';
    }
  }
  // the menu's asteroid box is hidden on the decks, so the screen gets its own (Mark, 27 Oct)
  function syncAst(vs) {
    const box = document.getElementById('ast'),
      sel = vs.querySelector('.dkr-ast');
    if (!sel) return;
    if (!box || box.tagName !== 'SELECT') return (sel.style.display = 'none');
    const opts = [...box.options].map((o) => o.value + '\u0001' + o.text).join('\u0002');
    if (sel.dataset.o !== opts) {
      sel.dataset.o = opts;
      sel.innerHTML = [...box.options].map((o) => '<option value="' + o.value.replace(/"/g, '&quot;') + '">' + (o.value === '' ? 'All rocks' : o.text).replace(/[<>&]/g, '') + '</option>').join('');
    }
    if (sel.value !== box.value) sel.value = box.value;
    if (!sel.dataset.w) {
      sel.dataset.w = '1';
      sel.addEventListener('change', () => {
        const b = document.getElementById('ast');
        if (!b) return;
        b.value = sel.value;
        b.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  }
  function mainBack() {
    const slot = document.getElementById('dkr-slot'),
      main = document.getElementById('main');
    if (slot && main) slot.parentNode.insertBefore(main, slot);
    if (slot) slot.remove();
    const pg = document.querySelector('#deckroom .dkr-pg');
    if (pg) pg.remove();
  }
  // a deck piece can ask for its own view back on the screen (e.g. Flight Deck ship details)
  window.YICdeckScreen = (mode) => {
    scr = mode === 'page';
    const room = document.getElementById('deckroom');
    if (room) markRoom(room);
  };

  let sig = '';
  function tick() {
    if (!document.getElementById('dk-css')) {
      const s = document.createElement('style');
      s.id = 'dk-css';
      s.textContent = CSS;
      document.head.appendChild(s);
    }
    if (ROOM && !document.getElementById('dkr-css')) {
      const s = document.createElement('style');
      s.id = 'dkr-css';
      s.textContent = ROOM_CSS;
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
        else {
          scr = true;
          go(t.dataset.pg);
        }
      });
    }
    if (db.parentNode !== bar) bar.prepend(db);
    const cur = current(),
      d = deckOf(cur);
    // search results go on the viewscreen
    const q = document.getElementById('gq');
    if (q && q.value.trim()) scr = true;
    deckLook(d);
    tools(db);
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
  // Search, Connect wallet, Play, Command Deck extension and Download live at the right of the
  // page row (the old header and menu row are hidden on the decks) – Mark, 27 Oct
  let tray = null;
  function tools(db) {
    if (!tray) {
      tray = document.createElement('div');
      tray.id = 'dktools';
    }
    const sub = db.querySelector('.dk-sub');
    if (sub && tray.parentNode !== sub) sub.appendChild(tray);
    const want = [document.querySelector('[data-srch="2"]'), document.getElementById('play'), document.getElementById('cdx'), document.getElementById('csv'), document.getElementById('wc-top')];
    want.forEach((el) => {
      if (el && el.parentNode !== tray) tray.appendChild(el);
    });
  }
  setInterval(tick, 400);
  document.addEventListener('click', () => setTimeout(tick, 50), true);
})();
