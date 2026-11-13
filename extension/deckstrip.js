// Skippy's Command Deck – slim deck strip at the bottom of the game (0.6.8 testing).
// Shows the Bridge's station consoles in the empty space between the game's
// action buttons and the clock, in the Command Deck's own look. Numbers come from your Command
// Deck tab (saved in this browser); until then each console shows "–". Clicking a console opens
// that deck on your Command Deck. It reads nothing from the game page and never presses anything.
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
@keyframes yicLed{0%,100%{opacity:1}50%{opacity:.35}}
@media (prefers-reduced-motion:reduce){#yic-strip .led{animation:none}#yic-strip .st,#yic-strip .pc{transition:none}}`;
  let on = true, bar = null, data = {};

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
    bar.style.display = 'none'; // shown by fit() once it has found the game's buttons
    document.body.appendChild(bar);
    draw(); fit();
  }
  function remove() { if (bar) { bar.remove(); bar = null; } }

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
    for (const el of document.querySelectorAll('body *')) {
      if (bar && bar.contains(el)) continue;
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
    chrome.storage.local.get({ deckSummary: {} }, x => { data = x.deckSummary || {}; build(); });
  });
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area === 'sync' && ch.deckStrip) { on = ch.deckStrip.newValue !== false; on ? build() : remove(); }
    if (area === 'local' && ch.deckSummary) { data = ch.deckSummary.newValue || {}; draw(); }
  });
  if (!document.body) document.addEventListener('DOMContentLoaded', build);
})();
