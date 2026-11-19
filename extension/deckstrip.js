// Skippy's Command Deck – slim deck strip at the bottom of the game (0.6.8 testing).
// Shows the Bridge's station consoles in the empty space between the game's
// action buttons and the clock, in the Command Deck's own look. Numbers come from your Command
// Deck tab (saved in this browser); until then each console shows "–". Clicking a console opens
// that deck on your Command Deck. A separate card at the top of the screen, "On this rock", lists your buildings on the rock
// on screen (passed on by the status-dots script) – pick one and the game opens it, the same as the
// game's own building link. It never presses anything in the game.
(() => {
  if (window.top !== window) return;
  // [deck id, name, colour, tilt, default line] – colours and tilts as on the Bridge
  const ST = [ // same order and colours as the Command Deck's new decks (13 Nov 2026)
    ['crew', 'Crew Quarters|Crew', '#ffff00', 12, 'crews on duty'],
    ['flight', 'Flight Deck|Flight', '#9a6bff', 8, 'ships in flight'],
    ['mine', 'Mining|Mining', '#ff8c1a', 4, 'extractors running'],
    ['eng', 'Engineering|Eng', '#e8645a', -4, 'jobs running'],
    ['sci', 'Science Lab|Science', '#4f90ff', -8, 'rocks you run'],
    ['trade', 'Trade Deck|Trade', '#57ff65', -12, 'open listings']
  ];
  const CSS = `
#yic-strip{position:fixed;left:640px;right:300px;bottom:38px;height:82px;z-index:50;display:flex;gap:8px;align-items:flex-end;pointer-events:none;perspective:700px;font-family:system-ui,sans-serif}
#yic-strip .st{flex:1;min-width:0;cursor:pointer;pointer-events:auto;transform:rotateX(10deg);transform-origin:50% 100%;transition:transform .2s,filter .2s}
#yic-strip .st:hover{transform:rotateX(2deg) translateY(-3px);filter:drop-shadow(0 0 10px var(--dc))}
#yic-strip .scr{position:relative;box-sizing:border-box;height:68px;padding:4px 7px;border-radius:6px 6px 2px 2px;overflow:hidden;
 background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(0,0,0,.2)),repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px),#0a1119;
 border:1px solid #2a3646;border-top:2px solid var(--dc);box-shadow:0 0 12px -5px var(--dc),inset 0 0 18px -9px var(--dc)}
#yic-strip .h{display:flex;align-items:center;gap:4px;font:700 10px/1.2 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--dc);white-space:nowrap;overflow:hidden}
#yic-strip .led{margin-left:auto;flex:0 0 6px;height:6px;border-radius:50%;background:var(--dc);box-shadow:0 0 6px var(--dc);animation:yicLed 2.6s ease-in-out infinite}
#yic-strip .n{display:flex;align-items:baseline;justify-content:space-between;gap:6px;font:700 17px/1.1 ui-monospace,Menlo,monospace;color:#e6ebf2;text-shadow:0 0 8px var(--dc);margin-top:2px}
#yic-strip .l{padding-right:2px;font-size:11px;color:#c4cdd9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#yic-strip .w{font-size:11px;font-weight:600;color:#ff7a7a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#yic-strip .go{font:700 9px/1 system-ui,sans-serif;letter-spacing:.18em;color:var(--dc);text-shadow:none;white-space:nowrap}
#yic-strip .base{display:flex;justify-content:center;gap:4px;height:9px;align-items:center;margin:0 -4px;background:linear-gradient(180deg,#1f2a38,#0d131b);clip-path:polygon(0 0,100% 0,94% 100%,6% 100%)}
#yic-strip .base i{width:9px;height:3px;border-radius:2px;background:var(--dc);opacity:.35}
#yic-strip .base i:nth-child(2){opacity:.8;box-shadow:0 0 5px var(--dc)}
#yic-strip .wpn{cursor:default}#yic-strip .wpn:hover{transform:rotateX(10deg);filter:none}
#yic-strip .wpn .scr{opacity:.75}#yic-strip .wpn .led{animation:none;opacity:.5}
#yic-strip .pc{flex:0 0 104px;align-self:flex-start;margin-top:2px;cursor:pointer;pointer-events:auto;box-sizing:border-box;height:62px;padding:6px;text-align:center;border-radius:6px;
 background:linear-gradient(180deg,rgba(255,210,74,.14),rgba(20,16,4,.95));border:1px solid #ffd24a;box-shadow:0 0 12px -2px rgba(255,210,74,.6),inset 0 0 14px -6px #ffd24a;transition:filter .2s,transform .2s}
#yic-strip .pc:hover{filter:drop-shadow(0 0 10px #ffd24a);transform:translateY(-2px)}
#yic-strip .pc b{display:block;font:700 10px/1.2 system-ui,sans-serif;letter-spacing:.14em;color:#ffd24a}
#yic-strip .pc span{display:block;font-size:11px;color:#f3e2b0;margin:4px 0 5px}
#yic-strip .pc i{font:normal 700 9px/1 system-ui,sans-serif;letter-spacing:.18em;color:#ffd24a}
#yic-strip .sn{display:none}#yic-strip.narrow .fn{display:none}#yic-strip.narrow .sn{display:inline}
#yic-rocktop{position:fixed;top:10px;right:250px;width:230px;z-index:50;font-family:system-ui,sans-serif;cursor:pointer}
#yic-rocktop .scr{box-sizing:border-box;height:62px;padding:4px 8px;border-radius:2px 2px 6px 6px;overflow:hidden;background:linear-gradient(0deg,rgba(255,255,255,.03),rgba(0,0,0,.2)),repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px),#0a1119;
 border:1px solid #2a3646;border-bottom:2px solid var(--dc);box-shadow:0 0 12px -5px var(--dc),inset 0 0 18px -9px var(--dc);transition:filter .2s,transform .2s}
#yic-rocktop:hover .scr{filter:drop-shadow(0 0 10px var(--dc));transform:translateY(2px)}
#yic-rocktop .h{display:flex;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;align-items:center;gap:4px;font:700 10px/1.2 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--dc)}
#yic-rocktop .led{margin-left:auto;flex:0 0 6px;height:6px;border-radius:50%;background:var(--dc);box-shadow:0 0 6px var(--dc);animation:yicLed 2.6s ease-in-out infinite}
#yic-rocktop .n{position:relative;display:block!important;text-align:center!important;padding:0 46px;font:700 14px/1.2 ui-monospace,Menlo,monospace;color:#e6ebf2;text-shadow:0 0 8px var(--dc);margin-top:3px}
#yic-rocktop .n span:first-child{display:block;text-align:center!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#yic-rocktop .go{position:absolute;right:0;bottom:2px;font:700 9px/1 system-ui,sans-serif;letter-spacing:.18em;color:var(--dc);text-shadow:none;white-space:nowrap}
#yic-rocktop .l{font-size:11px;color:#c4cdd9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
#yic-pop{position:fixed;z-index:51;width:330px;max-height:min(460px,60vh);display:flex;flex-direction:column;box-sizing:border-box;padding:8px;border-radius:6px;font:12px/1.35 system-ui,sans-serif;color:#e6ebf2;
 background:#0a1119;border:1px solid #2a3646;border-top:2px solid #57d5ff;box-shadow:0 0 16px -4px #57d5ff}
#yic-pop{max-height:min(460px,calc(100vh - 110px))}
#yic-pop .t{display:flex;align-items:center;gap:6px;font:700 10px/1.2 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#57d5ff;margin-bottom:6px}
#yic-pop .t b{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#yic-pop .x{cursor:pointer;color:#c4cdd9;font-size:14px;padding:0 4px}
#yic-pop input[type=search]{box-sizing:border-box;width:100%;margin-bottom:6px;padding:4px 6px;border-radius:4px;border:1px solid #2a3646;background:#05090e;color:#e6ebf2;font:12px system-ui,sans-serif}
#yic-pop .hp{display:flex;align-items:center;gap:6px;margin:0 0 6px;font-size:12px;color:#c4cdd9;cursor:pointer}
#yic-pop .hp input{width:auto;margin:0;padding:0;accent-color:#57d5ff}
#yic-pop .ls{overflow-y:auto;flex:1}
#yic-pop .g{margin:6px 0 2px;font:700 10px/1.2 system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#8a96a6}
#yic-pop .b{display:flex;align-items:center;gap:6px;padding:3px 5px;border-radius:3px;cursor:pointer}
#yic-pop .b:hover{background:rgba(87,213,255,.14)}
#yic-pop .b i{flex:0 0 7px;height:7px;border-radius:50%;background:#2a3646}
#yic-pop .b span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#yic-pop .b em{font-style:normal;color:#8a96a6;font-size:11px}
#yic-pop .none{color:#8a96a6;padding:6px}
#yic-rocktop.ah .scr{opacity:0;transform:translateY(-20px);transition:opacity .25s,transform .25s}
#yic-rocktop.ah:hover .scr,#yic-rocktop.ah.open .scr{opacity:1;transform:none}
#yic-rocktop.ah::before{content:'BUILDINGS';position:absolute;top:-10px;left:50%;transform:translateX(-50%);padding:4px 18px 5px;font:700 9px/1 system-ui,sans-serif;letter-spacing:.18em;color:#57d5ff;text-shadow:0 0 6px #57d5ff;white-space:nowrap;
 background:linear-gradient(0deg,#1f2a38,#0d131b);border-bottom:2px solid #57d5ff;box-shadow:0 3px 8px -4px #57d5ff;clip-path:polygon(0 0,100% 0,92% 100%,8% 100%);transition:opacity .25s}
#yic-rocktop.ah:hover::before,#yic-rocktop.ah.open::before{opacity:0}
#yic-strip.ah{pointer-events:auto}
#yic-strip.ah .st .scr{opacity:0;transform:translateY(40px);transition:opacity .25s,transform .25s}
#yic-strip.ah:hover .st .scr{opacity:1;transform:none}
#yic-strip.ah .st .base{opacity:0;transition:opacity .25s}
#yic-strip.ah:hover .st .base{opacity:1}
#yic-strip.ah::after{content:'COMMAND DECK';position:absolute;bottom:0;left:50%;transform:translateX(-50%);padding:5px 22px 4px;font:700 9px/1 system-ui,sans-serif;letter-spacing:.18em;color:#57d5ff;text-shadow:0 0 6px #57d5ff;white-space:nowrap;
 background:linear-gradient(180deg,#1f2a38,#0d131b);border-top:2px solid #57d5ff;box-shadow:0 -3px 8px -4px #57d5ff;clip-path:polygon(0 0,100% 0,92% 100%,8% 100%);pointer-events:none;transition:opacity .25s}
#yic-strip.ah:hover::after{opacity:0}
@keyframes yicLed{0%,100%{opacity:1}50%{opacity:.35}}
@media (prefers-reduced-motion:reduce){#yic-strip .led{animation:none}#yic-strip .st,#yic-strip .pc{transition:none}}`;
  // Auto-hide (option, off by default): only the strip's base lights show until you hover over it (Mark, 18 Nov).
  let autoHide = false;
  chrome.storage.sync.get({ deckAutoHide: false }, o => { autoHide = !!o.deckAutoHide; if (bar) bar.classList.toggle('ah', autoHide); if (top) top.classList.toggle('ah', autoHide); });
  let on = true, bar = null, data = {}, rock = null, pop = null, q = '';
  // Order of building types in the list – set in the extension's options (storage first by default).
  let order = ['Warehouse', 'Tank Farm', 'Extractor', 'Refinery', 'Bioreactor', 'Factory', 'Shipyard', 'Spaceport', 'Marketplace', 'Habitat'];
  chrome.storage.sync.get({ rockOrder: order }, o => { if (Array.isArray(o.rockOrder)) order = o.rockOrder; });
  // "Hide planned sites" tick box in the list – remembered in this browser (Mark, 18 Nov).
  let hidePlanned = false;
  chrome.storage.sync.get({ rockHidePlanned: false }, o => { hidePlanned = !!o.rockHidePlanned; drawTop(); listPop(); });
  const shownB = () => rock ? rock.b.filter(b => !(hidePlanned && b.st === 1)) : [];
  // Your buildings on the rock on screen – the status-dots script (in the page) leaves it on <html> for us.
  const DOT = { green: '#57ff65', yellow: '#ffd94f', red: '#ff564d' };
  const STATE = { 0: 'empty', 1: 'planned', 2: 'being built', 3: '' };
  function readRock() {
    let r = null; try { r = JSON.parse(document.documentElement.dataset.yicRock || 'null'); } catch (e) {}
    const was = rock ? rock.ast + ':' + rock.b.length + rock.name : '', now = r ? r.ast + ':' + r.b.length + r.name : '';
    rock = r;
    if (was !== now) drawTop();
    if (pop) { if (!rock) closePop(); else listPop(); }
  }
  new MutationObserver(readRock).observe(document.documentElement, { attributes: true, attributeFilter: ['data-yic-rock'] });
  const label = b => b.n || (b.t + ' – lot ' + b.lot.toLocaleString());
  function closePop() { if (pop) { pop.remove(); pop = null; } if (top) top.classList.remove('open'); }
  function openPop(card) {
    if (pop) { closePop(); return; }
    pop = document.createElement('div'); pop.id = 'yic-pop'; card.classList.add('open');
    pop.innerHTML = '<div class="t"><b></b><span class="x" title="Close">✕</span></div><input type="search" placeholder="Find a building…"><label class="hp"><input type="checkbox"> Hide planned sites</label><div class="ls"></div>';
    document.body.appendChild(pop);
    const r = card.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(innerWidth - 338, r.left + r.width / 2 - 165)) + 'px';
    pop.style.top = Math.round(r.bottom + 8) + 'px';
    pop.querySelector('.x').onclick = closePop;
    const inp = pop.querySelector('input[type=search]'); inp.value = q;
    const hp = pop.querySelector('.hp input'); hp.checked = hidePlanned;
    hp.addEventListener('change', () => { hidePlanned = hp.checked; chrome.storage.sync.set({ rockHidePlanned: hidePlanned }); drawTop(); listPop(); });
    // keep typing out of the game's own keyboard shortcuts
    ['keydown', 'keyup', 'keypress'].forEach(k => inp.addEventListener(k, e => { e.stopPropagation(); if (k === 'keydown' && e.key === 'Escape') closePop(); }));
    inp.addEventListener('input', () => { q = inp.value; listPop(); });
    pop.addEventListener('click', e => {
      const row = e.target.closest('[data-id]'); if (!row) return;
      window.postMessage({ type: 'yic-goto-building', id: Number(row.dataset.id) }, location.origin);
      closePop();
    });
    listPop(); inp.focus();
  }
  function listPop() {
    if (!pop || !rock) return;
    pop.querySelector('.t b').textContent = rock.name + ' – ' + shownB().length + ' buildings';
    const f = q.trim().toLowerCase(), groups = {};
    shownB().filter(b => !f || (label(b) + ' ' + b.t).toLowerCase().includes(f))
      .forEach(b => (groups[b.t] = groups[b.t] || []).push(b));
    const rank = t => { const i = order.indexOf(t); return i < 0 ? 99 : i; };
    const html = Object.keys(groups).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)).map(t => '<div class="g">' + esc(t) + ' (' + groups[t].length + ')</div>' +
      groups[t].sort((a, b) => label(a).localeCompare(label(b), undefined, { numeric: true })).map(b =>
        '<div class="b" data-id="' + b.id + '" title="Open in the game"><i' + (DOT[b.c] ? ' style="background:' + DOT[b.c] + '"' : '') + '></i><span>' + esc(label(b)) + '</span>' +
        (STATE[b.st] ? '<em>' + STATE[b.st] + '</em>' : '') + '</div>').join('')).join('');
    pop.querySelector('.ls').innerHTML = html || '<div class="none">No buildings match.</div>';
  }
  addEventListener('mousedown', e => { if (pop && !pop.contains(e.target) && !(top && top.contains(e.target))) closePop(); }, true);

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const go = id => { try { chrome.runtime.sendMessage({ type: 'yic-deck', id }); } catch (e) {} };

  function build() {
    if (bar || !on || !document.body) return;
    if (!document.getElementById('yic-strip-css')) {
      const st = document.createElement('style');
      st.id = 'yic-strip-css'; st.textContent = CSS;
      (document.head || document.documentElement).appendChild(st);
    }
    bar = document.createElement('div');
    bar.id = 'yic-strip';
    bar.classList.toggle('ah', autoHide);
    bar.style.display = 'none'; // shown by fit() once it has found the game's buttons
    document.body.appendChild(bar);
    draw(); fit();
  }
  function remove() { closePop(); if (top) { top.remove(); top = null; } if (bar) { bar.remove(); bar = null; } }
  // "On this rock" sits on its own top right, left of the SWAY balance (Mark, 18 Nov: too many cards along the bottom; the game's pop-ups covered it top centre).
  let top = null;
  function drawTop() {
    if (!rock || !on) { if (top) { top.remove(); top = null; } return; }
    if (!top) {
      top = document.createElement('div'); top.id = 'yic-rocktop';
      top.classList.toggle('ah', autoHide);
      top.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); openPop(top); });
      document.body.appendChild(top);
    }
    top.innerHTML = '<div class="st rk" style="--dc:#57d5ff" title="Your buildings on this rock – pick one to jump to it"><div class="scr">' +
      '<div class="h"><span>' + esc(rock.name) + '</span><i class="led"></i></div>' +
      '<div class="n"><span>Buildings</span><span class="go">PICK ▾</span></div>' +
      '<div class="l">' + shownB().length + ' of your buildings</div></div></div>';
  }

  function draw() {
    if (!bar) return;
    bar.innerHTML = ST.map(s => {
      const [k, nm, col, ry, sub] = s, d = data[k] || {}, wpn = k === 'weapons', [name, short] = nm.split('|');
      return '<div class="st' + (wpn ? ' wpn' : '') + '" data-k="' + k + '" style="--dc:' + col + ';--ry:' + ry + 'deg" title="' +
        (wpn ? 'Weapons – ready for when conflict starts' : 'Enter the ' + name) + '"><div class="scr">' +
        '<div class="h"><span class="fn">' + name + '</span><span class="sn">' + (short || name) + '</span><i class="led"></i></div>' +
        '<div class="n"><span>' + (wpn ? '⚔' : esc(d.v != null ? d.v : '–')) + '</span>' + (wpn ? '' : '<span class="go">ENTER ▸</span>') + '</div>' +
        '<div class="l">' + esc(wpn ? sub : (d.s || sub)) + '</div>' +
        (d.w ? '<div class="w">' + esc(d.w) + '</div>' : '') +
        '</div><div class="base"><i></i><i></i><i></i><i></i></div></div>';
    }).join('');
    drawTop();
    bar.querySelectorAll('[data-k]').forEach(t => {
      if (t.dataset.k === 'weapons') return;
      t.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); go(t.dataset.k); });
    });
  }

  // Starts just right of the game's action buttons (how many there are changes with what you have
  // selected), and hides if there isn't room – so it never covers the game's own buttons (Mark, 13 Nov).
  function gameEdges() {
    let L = 0, R = innerWidth;
    const H = innerHeight, half = innerWidth / 2;
    const all = document.querySelectorAll('body *');
    // Skip anything inside a scrolling panel (e.g. My Crews) – its cards slide past the bottom
    // as you scroll and made the strip jump about (Mark, 16 Nov).
    const scrollers = [];
    for (const el of all) {
      if (el.scrollHeight > el.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(el).overflowY)) scrollers.push(el);
    }
    for (const el of all) {
      if (bar && bar.contains(el)) continue;
      if (scrollers.some(s => s !== el && s.contains(el))) continue;
      const r = el.getBoundingClientRect();
      if (r.top < H - 160 || r.bottom > H - 10 || r.height < 18 || r.height > 90) continue;
      // left: the action buttons; right: the clock, timeline controls and orbit button (they grow when the timeline opens)
      if (r.left < half && r.width >= 36 && r.width <= 90) L = Math.max(L, r.right);
      else if (r.left > half && r.width >= 18 && r.width <= 260 && getComputedStyle(el).visibility !== 'hidden') R = Math.min(R, r.left);
    }
    return [L, R];
  }
  // While the game swaps its action buttons (e.g. just after clicking a building) they're briefly
  // missing – stay hidden then instead of jumping over the game menu bottom left (Mark, 13 Nov).
  // Only if they stay missing for ~1.5 s do we fall back to the old 300 px start.
  let miss = 0;
  function fit() {
    if (!bar) return;
    const [L, R] = gameEdges();
    if (L === 0 && ++miss < 4) { bar.style.display = 'none'; return; }
    if (L > 0) miss = 0;
    const left = Math.max(300, Math.round(L + 14)), right = Math.max(20, Math.round(innerWidth - R + 14));
    bar.style.left = left + 'px';
    bar.style.right = right + 'px';
    const w = innerWidth - right - left;
    bar.style.display = w < 420 ? 'none' : 'flex';
    bar.classList.toggle('narrow', w / 6 < 135); // squeezed: short names (Crew, Flight, Eng…) – Mark, 13 Nov
  }
  addEventListener('resize', fit);
  // a click in the game can change the buttons – check again just after it
  addEventListener('click', e => { if (bar && !bar.contains(e.target)) { setTimeout(fit, 60); setTimeout(fit, 250); } }, true);
  setInterval(fit, 500);

  chrome.storage.sync.get({ deckStrip: true }, o => {
    on = o.deckStrip !== false;
    chrome.storage.local.get({ deckSummary: {} }, x => { data = x.deckSummary || {}; build(); readRock(); });
  });
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area === 'sync' && ch.deckStrip) { on = ch.deckStrip.newValue !== false; on ? build() : remove(); }
    if (area === 'sync' && ch.deckAutoHide) { autoHide = !!ch.deckAutoHide.newValue; if (bar) bar.classList.toggle('ah', autoHide); if (top) top.classList.toggle('ah', autoHide); }
    if (area === 'sync' && ch.rockHidePlanned) { hidePlanned = !!ch.rockHidePlanned.newValue; drawTop(); listPop(); }
    if (area === 'sync' && ch.rockOrder && Array.isArray(ch.rockOrder.newValue)) { order = ch.rockOrder.newValue; listPop(); }
    if (area === 'local' && ch.deckSummary) { data = ch.deckSummary.newValue || {}; draw(); }
  });
  if (!document.body) document.addEventListener('DOMContentLoaded', build);
})();
