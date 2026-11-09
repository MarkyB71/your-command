/* Logistics Bridge – the Logistics Hub's main screen – TEST ONLY (?beta=1) (Mark, 9 Nov 2026)
   Mark: "keep the main site style but with the orange look that defines the hub and game interaction",
   "the same layout as the bridge", keep the hazard stripes, tools open ON the viewscreen
   ("if we can get it to fit … move it to underneath if it does not work").
   Layout like The Bridge (pages/workload.js): viewscreen across the top, consoles below, a chair in the middle.
   Consoles: Make on this rock · Load a ship · Feed crews | chair: what needs doing | Deliveries · Storage tidy (soon) · spare.
   vendor/dock.js calls YICHUBBRIDGE.screen(main, S, render) at the top of render(); it returns the viewscreen
   element that the hub then draws the chosen tool into. Mode 'home' = the chair's "what needs doing" list. */
(function () {
  'use strict';
  if (!/[?&]beta=1\b/.test(location.search)) return; // test only

  const OR = '#ffb03b';
  const CSS = `
#dk-ov #dockpg{font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
#dk-ov #dockpg .card h2{color:#ffd28a}
#dk-ov .lb{position:relative;margin:4px 0 16px;border-radius:14px;overflow:hidden;background:#06050a;border:1px solid #3a2a14;box-shadow:0 0 40px rgba(0,0,0,.6) inset}
#dk-ov .lb-bg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
#dk-ov .lb-vs{position:relative;z-index:1;width:90%;margin:26px auto 0;padding:7px;background:linear-gradient(180deg,#4a3418,#1c140a);clip-path:polygon(2% 0,98% 0,100% 6%,100% 100%,0 100%,0 6%);box-shadow:0 0 30px rgba(255,176,59,.18)}
#dk-ov .lb-plate{position:absolute;z-index:2;left:50%;top:7px;transform:translateX(-50%);padding:3px 22px 4px;background:#140e06;clip-path:polygon(0 0,100% 0,92% 100%,8% 100%);font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.4em;color:${OR};text-shadow:0 0 8px rgba(255,176,59,.7);pointer-events:none;white-space:nowrap}
#dk-ov .lb-scr{position:relative;height:clamp(380px,60vh,900px);overflow:auto;padding:30px 2.5% 14px;clip-path:polygon(2% 0,98% 0,100% 6%,100% 100%,0 100%,0 6%);background:repeating-linear-gradient(0deg,rgba(255,176,59,.025) 0 1px,transparent 1px 3px),radial-gradient(ellipse at 50% 0,#1d150b,#07060a 75%);scrollbar-color:#5a4020 transparent}
#dk-ov .lb-scr .card{background:rgba(20,16,10,.85)!important;box-shadow:0 0 0 1px #3a2c18 inset!important}
#dk-ov .lb-deck{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) minmax(0,.8fr) repeat(3,minmax(0,1fr));gap:10px;align-items:end;padding:20px 4% 0;perspective:1100px}
#dk-ov .lb-st{all:unset;box-sizing:border-box;cursor:pointer;display:block;transform:rotateY(var(--ry)) rotateX(18deg);transform-origin:50% 100%;transition:transform .2s,filter .2s}
#dk-ov .lb-st:hover,#dk-ov .lb-st:focus-visible,#dk-ov .lb-st.on{transform:rotateY(var(--ry)) rotateX(8deg) translateY(-4px);filter:drop-shadow(0 0 14px var(--dc))}
#dk-ov .lb-sc{display:block;position:relative;padding:10px 12px;border-radius:8px 8px 2px 2px;background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(0,0,0,.2)),repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px),#120d07;border:2px solid #3a2c18;border-top:3px solid var(--dc);box-shadow:0 0 16px -6px var(--dc),inset 0 0 22px -10px var(--dc)}
#dk-ov .lb-st.on .lb-sc{border-color:var(--dc);background-color:#1f150a}
#dk-ov .lb-h{display:flex;align-items:center;gap:6px;font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--dc)}
#dk-ov .lb-led{margin-left:auto;width:7px;height:7px;border-radius:50%;background:var(--dc);box-shadow:0 0 8px var(--dc);animation:lbLed 2.6s ease-in-out infinite}
#dk-ov .lb-n{display:block;font:700 28px/1.1 ui-monospace,Menlo,monospace;color:#f2ebe0;margin:8px 0 0;text-shadow:0 0 10px var(--dc)}
#dk-ov .lb-l{display:block;font-size:13px;color:#d9cbb6}
#dk-ov .lb-s{display:block;font-size:12px;color:#a0907a;margin-top:4px;min-height:16px}
#dk-ov .lb-s b{color:#ff7a7a;font-weight:600}
#dk-ov .lb-go{display:block;margin-top:7px;font:700 10px/1 system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:var(--dc)}
#dk-ov .lb-base{display:flex;justify-content:center;gap:5px;height:20px;align-items:center;margin:0 -6px;background:linear-gradient(180deg,#3a2a16,#140e07);clip-path:polygon(0 0,100% 0,94% 100%,6% 100%)}
#dk-ov .lb-base i{width:12px;height:5px;border-radius:2px;background:var(--dc);opacity:.35}
#dk-ov .lb-base i:nth-child(2){opacity:.8;box-shadow:0 0 6px var(--dc)}
#dk-ov .lb-st.off{cursor:default;filter:saturate(.35) brightness(.7)}
#dk-ov .lb-st.off:hover{transform:rotateY(var(--ry)) rotateX(18deg);filter:saturate(.35) brightness(.7)}
#dk-ov .lb-st.off .lb-led{animation:none;opacity:.4}
#dk-ov .lb-chair{all:unset;box-sizing:border-box;cursor:pointer;align-self:end;display:flex;flex-direction:column;align-items:center;gap:2px;transition:filter .2s}
#dk-ov .lb-chair svg{display:block;width:100%;max-width:150px;height:auto}
#dk-ov .lb-chair:hover,#dk-ov .lb-chair:focus-visible,#dk-ov .lb-chair.on{filter:drop-shadow(0 0 12px rgba(255,176,59,.6))}
#dk-ov .lb-cl{font:700 10px/1.2 system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:${OR};opacity:.8;text-align:center}
#dk-ov .lb-floor{height:26px;margin-top:-2px;background:radial-gradient(ellipse at 50% 0,rgba(255,176,59,.16),transparent 70%)}
#dk-ov .lb-todo{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin-top:6px}
#dk-ov .lb-t{all:unset;box-sizing:border-box;cursor:pointer;display:block;padding:12px 14px;border-radius:10px;background:#120d07;border:1px solid #3a2c18}
#dk-ov .lb-t:hover,#dk-ov .lb-t:focus-visible{border-color:${OR};box-shadow:0 0 14px -4px ${OR}}
#dk-ov .lb-t b{display:block;font:700 30px/1.1 ui-monospace,Menlo,monospace;color:#f2ebe0}
#dk-ov .lb-t.hot b{color:#ff7a7a}
#dk-ov .lb-t span{display:block;color:#d9cbb6}
#dk-ov .lb-t i{display:block;font-style:normal;margin-top:6px;font:700 10px/1 system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:${OR}}
@keyframes lbLed{0%,100%{opacity:1}50%{opacity:.35}}
@media (max-width:760px){#dk-ov .lb-deck{grid-template-columns:1fr 1fr;perspective:none}#dk-ov .lb-chair{grid-column:1/-1;order:-1;flex-direction:row;justify-content:center;gap:10px}#dk-ov .lb-chair svg{max-width:60px}#dk-ov .lb-st,#dk-ov .lb-st:hover,#dk-ov .lb-st.on{transform:none}#dk-ov .lb-vs{width:96%}#dk-ov .lb-scr{clip-path:none}}
@media (prefers-reduced-motion:reduce){#dk-ov .lb-led{animation:none}#dk-ov .lb-st{transition:none}}
`;
  const BG =
    '<svg class="lb-bg" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true"><defs>' +
    '<linearGradient id="lbW" x1="0" x2="1"><stop offset="0" stop-color="#140e08"/><stop offset="1" stop-color="#20170c"/></linearGradient>' +
    '<linearGradient id="lbW2" x1="1" x2="0"><stop offset="0" stop-color="#140e08"/><stop offset="1" stop-color="#20170c"/></linearGradient>' +
    '<radialGradient id="lbF" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="#2a1d0e"/><stop offset="1" stop-color="#07060a"/></radialGradient></defs>' +
    '<rect width="1000" height="620" fill="url(#lbF)"/>' +
    '<polygon points="0,0 1000,0 940,18 60,18" fill="#1a130a"/>' +
    '<line x1="100" y1="9" x2="900" y2="9" stroke="#ffb03b" stroke-opacity=".35" stroke-width="2"/>' +
    '<polygon points="0,0 60,18 60,460 0,620" fill="url(#lbW)"/>' +
    '<polygon points="1000,0 940,18 940,460 1000,620" fill="url(#lbW2)"/>' +
    '<path d="M60,460 Q500,500 940,460" stroke="#ffb03b" stroke-opacity=".18" stroke-width="2" fill="none"/></svg>';
  // the logistics officer's chair (same shape as the captain's chair, orange trim)
  const CHAIR =
    '<svg viewBox="0 0 140 150" aria-hidden="true"><defs><linearGradient id="lbC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3820"/><stop offset="1" stop-color="#1c140a"/></linearGradient></defs>' +
    '<path d="M38,10 Q70,0 102,10 L106,86 L34,86 Z" fill="url(#lbC)" stroke="#6b4e24"/>' +
    '<path d="M48,22 Q70,15 92,22 L94,78 L46,78 Z" fill="#140e06" stroke="#ffb03b" stroke-opacity=".3"/>' +
    '<text x="70" y="56" text-anchor="middle" font-size="22">📦</text>' +
    '<rect x="14" y="70" width="26" height="12" rx="5" fill="url(#lbC)" stroke="#6b4e24"/><rect x="100" y="70" width="26" height="12" rx="5" fill="url(#lbC)" stroke="#6b4e24"/>' +
    '<rect x="20" y="73" width="8" height="4" rx="1" fill="#ffb03b" opacity=".8"/><rect x="112" y="73" width="8" height="4" rx="1" fill="#ff8a1f" opacity=".8"/>' +
    '<path d="M30,86 L110,86 L104,104 L36,104 Z" fill="#2a1f12" stroke="#6b4e24"/>' +
    '<rect x="64" y="104" width="12" height="28" fill="#1c140a"/><ellipse cx="70" cy="138" rx="40" ry="8" fill="#1c140a" stroke="#6b4e24"/>' +
    '<ellipse cx="70" cy="138" rx="56" ry="11" fill="none" stroke="#ffb03b" stroke-opacity=".25"/></svg>';

  const D = () => (window.YIC && window.YIC.D) || {};
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function nums(S) {
    const d = D(), now = Date.now() / 1000;
    const ships = d.ships || [], docked = ships.filter((s) => !s.fl).length;
    let idle = 0;
    (d.allB || []).forEach((b) => {
      const B = b.Building || {};
      if (B.status !== 3 || ![3, 4, 5, 6].includes(B.buildingType)) return;
      const busy = [].concat(b.Processors || [], b.DryDocks || []).some((x) => x.status === 1);
      if (!busy) idle++;
    });
    const feed = window.YICFEED && window.YICFEED.count ? window.YICFEED.count() : null;
    const hungry = (d.crewList || []).filter((c) => c.roster && c.roster.length && c.food != null && c.food < 0.5).length;
    const dels = (S.incList || []).length;
    return { idle, docked, ships: ships.length, feed, hungry, dels, now };
  }

  const STATIONS = [
    { m: 'make', name: 'Production', ico: '🏭', col: '#ffb03b', ry: 15 },
    { m: 'ship', name: 'Cargo bay', ico: '🚀', col: '#ff8a1f', ry: 11 },
    { m: 'feed', name: 'Galley', ico: '🍽', col: '#ffc45e', ry: 7 },
    { m: 'home', name: 'Deliveries', ico: '🚚', col: '#ffd28a', ry: -7, k: 'dels' },
    { m: '', name: 'Storage', ico: '🗄', col: '#c98a3a', ry: -11, off: 'Storage tidy moves in here soon' },
    { m: '', name: 'Spare', ico: '·', col: '#8a6a3a', ry: -15, off: 'Kept free for future tools' },
  ];
  const TITLE = { home: 'WHAT NEEDS DOING', make: 'MAKE ON THIS ROCK', ship: 'LOAD A SHIP', feed: 'FEED CREWS' };

  function station(s, N, mode) {
    let n = '', l = '', sub = '', go = 'Open ▸';
    if (s.m === 'make') { n = N.idle; l = N.idle === 1 ? 'idle building' : 'idle buildings'; sub = 'Make on this rock'; }
    else if (s.m === 'ship') { n = N.docked; l = N.docked === 1 ? 'ship docked' : 'ships docked'; sub = 'Load a ship'; }
    else if (s.m === 'feed') { n = N.feed == null ? N.hungry : N.feed; l = n === 1 ? 'crew to feed' : 'crews to feed'; sub = N.hungry ? '<b>' + N.hungry + ' hungry</b>' : 'Feed crews'; }
    else if (s.k === 'dels') { n = N.dels; l = N.dels === 1 ? 'delivery on its way' : 'deliveries on their way'; sub = 'Finish them in the game'; go = 'Show ▸'; }
    else { n = s.ico; l = s.off; sub = ''; go = 'Coming soon'; }
    const on = s.m && s.m === mode && !s.k;
    return `<button type="button" class="lb-st${s.off ? ' off' : ''}${on ? ' on' : ''}"${s.m ? ` data-lb="${s.m}"` : ' tabindex="-1"'} style="--dc:${s.col};--ry:${s.ry}deg" title="${esc(s.off || sub.replace(/<[^>]+>/g, ''))}"><span class="lb-sc"><span class="lb-h">${s.ico} ${esc(s.name)}<i class="lb-led"></i></span><span class="lb-n">${n}</span><span class="lb-l">${esc(l)}</span><span class="lb-s">${sub}</span><span class="lb-go">${go}</span></span><span class="lb-base"><i></i><i></i><i></i><i></i></span></button>`;
  }

  // the chair: what needs doing (Mark's Bridge has today's workload on the captain's chair)
  function home(scr, S, render) {
    const N = nums(S);
    const t = (m, n, l, go, hot) => `<button type="button" class="lb-t${hot ? ' hot' : ''}" data-lb="${m}"><b>${n}</b><span>${esc(l)}</span><i>${go}</i></button>`;
    const del = (S.incList || []).length;
    scr.innerHTML = `<div class="card"><h2><span class="n">◉</span>What needs doing</h2>
<div class="hint" style="margin:0 0 6px">Pick a console below, or one of these.</div><div class="lb-todo">` +
      t('feed', N.feed == null ? N.hungry : N.feed, (N.hungry ? N.hungry + ' hungry · ' : '') + 'crews that could be fed', 'Feed crews ▸', N.hungry > 0) +
      t('make', N.idle, 'idle refineries, factories, bioreactors and shipyards', 'Make on this rock ▸', false) +
      t('ship', N.docked, 'ships docked – ready to load', 'Load a ship ▸', false) +
      `</div></div><div class="card"><h2><span class="n">🚚</span>Deliveries on their way (${del})</h2>` +
      (S.incErr ? `<div class="src" style="color:var(--red)">${esc(S.incErr)}</div>` : del ? '<div class="src">Each one shows up in the game as a Surface Transfer for the crew that sent it. When it says Ready, use <b>Finish All Ready Items</b> on that crew.</div>' : '<div class="src">Nothing on its way right now.</div>') +
      '</div>';
    wire(scr, S, render);
  }

  function wire(root, S, render) {
    root.querySelectorAll('[data-lb]').forEach((b) => b.addEventListener('click', () => {
      S.mode = b.dataset.lb; S.ship = null; render();
      const s = document.querySelector('#dk-ov .lb-scr'); if (s) s.scrollTop = 0;
    }));
  }

  // called at the top of dock.js render(): draws the bridge, returns the viewscreen to draw the tool into
  function screen(main, S, render) {
    if (!document.getElementById('lb-css')) { const st = document.createElement('style'); st.id = 'lb-css'; st.textContent = CSS; document.head.appendChild(st); }
    if (!S.mode) S.mode = 'home';
    const mode = S.mode === 'ship' || S.mode === 'feed' || S.mode === 'home' ? S.mode : 'make';
    let lb = main.querySelector('.lb');
    if (!lb) {
      main.innerHTML = `<div class="lb">${BG}<div class="lb-vs"><div class="lb-scr" id="lb-scr"></div><div class="lb-plate"></div></div><div class="lb-deck"></div><div class="lb-floor"></div></div>`;
      lb = main.querySelector('.lb');
    }
    const N = nums(S);
    const st = STATIONS.map((s) => station(s, N, mode));
    lb.querySelector('.lb-deck').innerHTML = st.slice(0, 3).join('') +
      `<button type="button" class="lb-chair${mode === 'home' ? ' on' : ''}" data-lb="home" title="The logistics officer's chair – what needs doing">${CHAIR}<span class="lb-cl">What needs doing</span></button>` +
      st.slice(3).join('');
    lb.querySelector('.lb-plate').textContent = TITLE[mode];
    wire(lb.querySelector('.lb-deck'), S, render);
    const scr = lb.querySelector('#lb-scr');
    if (mode === 'home') { home(scr, S, render); return null; }
    return scr;
  }

  window.YICHUBBRIDGE = { screen };
})();
