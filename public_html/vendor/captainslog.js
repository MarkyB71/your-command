/* Captain's log – Skippy's Awesome Command Deck – LIVE 10 Nov 2026 (tested on ?beta=1 – Mark)
   "Just be able to add boxes with tasks for now and tick them off when done ... to help me remember
   what I was doing last night." A console on the Bridge in the Weapons console's place; clicking it puts the log
   on the viewscreen (like Deck controls). Saved IN THIS BROWSER ONLY (localStorage) – Mark: "steer clear
   of holding data", so nothing goes to the server. May join the Logistics Hub later.
   Project doc: claude/planning-section-idea-2026-11-10.md */
(function () {
  'use strict';
  // LIVE 10 Nov 2026 (tested on ?beta=1 – Mark)

  const KEY = 'sk_captains_log', LKEY = 'sk_captains_log_links';
  let on = false, tab = 'today', sdTick = 0, lastRock = null, scrollY = 0, rolled = false, passChair = false, todayTop = 0, todayAst = ''; // todayAst: Today tab's own rock ('' = all) // tab: 'notes' (sticky notes) or 'log' (everything done in the game)

  const CSS = `
.cl-scr{box-sizing:border-box;position:relative;display:flex;flex-direction:column;height:clamp(320px,52vh,600px);padding:30px 16px 14px;clip-path:polygon(3% 0,97% 0,100% 12%,100% 100%,0 100%,0 12%);background:repeating-linear-gradient(0deg,rgba(143,227,255,.03) 0 1px,transparent 1px 3px),radial-gradient(ellipse at 50% 0,#0d1825,#05080d 75%);font-size:14px;line-height:1.4;color:#c4cdd9}
.cl-scr *{box-sizing:border-box}
.cl-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;max-width:760px;width:100%;margin:0 auto 10px}
.cl-bar .h{flex:none;margin-right:6px}
.cl-bar .h b{display:block;color:#fff;font-size:15px}
.cl-bar .h span{display:block;color:#8b9ab0;font-size:11px}
.cl-add{display:flex;gap:8px;flex:1 1 260px;margin:0}
.cl-add input{flex:1 1 auto;min-width:0;max-width:none;height:34px;margin:0;padding:0 10px;font:inherit;color:#fff;background:#0c1320;border:1px solid #2a3a50;border-radius:6px}
.cl-add input:focus{outline:none;border-color:#8fe3ff}
.cl-add button,.cl-clear{flex:none;min-width:0;height:34px;margin:0;padding:0 16px;font:600 13px system-ui,sans-serif;color:#05080d;background:#8fe3ff;border:0;border-radius:6px;cursor:pointer}
.cl-clear{padding:0 10px;font-size:12px;color:#8fe3ff;background:none;border:1px solid #2a5866}
.cl-board{position:relative;flex:1 1 auto;min-height:0;overflow-x:hidden;overflow-y:auto;border-top:1px dashed #1e2a3a;scrollbar-color:#2c3a4c transparent}
.cl-cv{position:relative;min-height:100%}
.cl-none{position:absolute;inset:0;display:grid;place-items:center;color:#8b9ab0;font-size:13px;pointer-events:none}
.cl-note{--rc:#8fe3ff;position:absolute;z-index:1;width:150px;min-height:120px;padding:10px 10px 30px;background:linear-gradient(180deg,color-mix(in srgb,var(--rc) 9%,#0f1d2a),#0c1622);border:1px solid color-mix(in srgb,var(--rc) 35%,#1e2a3a);border-top:3px solid var(--rc);border-radius:2px 2px 2px 14px;box-shadow:3px 5px 14px rgba(0,0,0,.55),0 0 14px -6px #8fe3ff;transform:rotate(var(--rot,0deg));cursor:grab;touch-action:none;user-select:none;transition:box-shadow .15s}
.cl-note::before{content:'';position:absolute;left:50%;top:-9px;width:44px;height:14px;transform:translateX(-50%) rotate(-3deg);background:rgba(143,227,255,.18);border:1px solid rgba(143,227,255,.25)}
.cl-note:hover{box-shadow:4px 7px 18px rgba(0,0,0,.6),0 0 18px -4px #8fe3ff}
.cl-note.drag{cursor:grabbing;z-index:5;transform:rotate(0deg) scale(1.04);box-shadow:8px 12px 24px rgba(0,0,0,.7),0 0 22px -2px #8fe3ff;transition:none}
.cl-note .t{display:block;color:#fff;font-size:13.5px;overflow-wrap:anywhere}
.cl-note .rk{display:block;margin:-3px 0 4px;color:var(--rc);font:700 9.5px/1.2 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;opacity:.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cl-note .ft{position:absolute;left:6px;right:5px;bottom:5px;display:flex;align-items:center;gap:4px}
.cl-note select{flex:1 1 auto;min-width:0;max-width:none;height:20px;margin:0;padding:0 2px;font:10.5px system-ui,sans-serif;color:#8b9ab0;background:transparent;border:1px solid transparent;border-radius:4px;cursor:pointer}
.cl-note select:hover,.cl-note select:focus{border-color:#2a3a50;color:#c4cdd9;outline:none}
.cl-note select option{background:#0c1320;color:#e6ebf2}
.cl-note input{flex:none;width:15px;height:15px;margin:0 2px;padding:0;min-width:0;accent-color:#3fd68a;cursor:pointer}
.cl-note .ft button{flex:none;width:20px;height:20px;margin:0;padding:0;min-width:0;font:11px/1 system-ui,sans-serif;color:#8b9ab0;background:none;border:1px solid transparent;border-radius:4px;cursor:pointer}
.cl-note .ft .rm:hover{color:#ff564d;border-color:#ff564d}
.cl-note .ft .ln:hover,.cl-note.linking .ln{color:#8fe3ff;border-color:#8fe3ff}
.cl-note.linking{box-shadow:0 0 0 2px #8fe3ff,0 0 24px -2px #8fe3ff}
.cl-board.linkmode .cl-note:not(.linking){cursor:crosshair}
.cl-lines{position:absolute;inset:0;width:100%;height:100%;z-index:0;overflow:visible}
.cl-lines line.v{stroke-width:2;stroke-dasharray:6 5;opacity:.55;pointer-events:none}
.cl-lines line.h{stroke:transparent;stroke-width:14;pointer-events:stroke;cursor:pointer}
.cl-lines g:hover line.v{opacity:1;stroke:#ff564d}
.cl-hint{flex:1 1 100%;color:#8fe3ff;font-size:12px}
.cl-add select{flex:0 1 150px;min-width:0;max-width:none;height:34px;margin:0;padding:0 6px;font:inherit;font-size:13px;color:#c4cdd9;background:#0c1320;border:1px solid #2a3a50;border-radius:6px}
.cl-note.done{opacity:.6}
.cl-note.done .t{color:#8b9ab0;text-decoration:line-through}
.cl-tabs{display:flex;gap:4px;flex:none}
.cl-tabs button{min-width:0;height:34px;margin:0;padding:0 12px;font:600 13px system-ui,sans-serif;color:#c4cdd9;background:#0c1320;border:1px solid #2a3a50;border-radius:6px;cursor:pointer}
.cl-tabs button.on{color:#05080d;background:#8fe3ff;border-color:#8fe3ff}
.cl-logv{flex:1 1 auto;min-height:0;overflow:auto;max-width:900px;width:100%;margin:0 auto;padding:0 4px;scrollbar-color:#2c3a4c transparent}
.cl-logv .hl-day{color:#8fe3ff;border-bottom-color:#1e3a48;letter-spacing:.06em}
.cl-logv .hl-row{font-size:14px;border-bottom-color:#122030}
.cl-logv .hl-row:hover{background:rgba(143,227,255,.05)}
.cl-logv .hl-row{grid-template-columns:92px 28px minmax(0,1fr) minmax(110px,200px)}
.cl-logv .hl-sd{display:block;color:#8fe3ff;font-weight:600;font-size:13px}
.cl-logv .hl-real{display:block;color:#6b7a90;font-size:11px}
.cl-logv .hl-day .hl-real{display:inline;font-size:12px;letter-spacing:0;color:#8b9ab0}
.cl-bar .h .cl-sdnow{display:inline;color:#8fe3ff;font-size:11px}
.cl-today h2{font-size:16px!important;color:#8fe3ff;letter-spacing:.04em}
.cl-today .note{font-size:12px}
.cl-logv .note{color:#9fb0c4;font-size:13px}
.cl-head{flex:none}
.cl-head .cl-bar{max-height:220px;transition:max-height .3s ease,opacity .25s ease,margin .3s ease}
.cl-roll{max-height:0;overflow:hidden;opacity:0;text-align:center;font:700 10px/1 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#8fe3ff;transition:max-height .3s ease,opacity .25s ease}
.cl-scr.rolled .cl-head:not(:hover):not(:focus-within) .cl-bar{max-height:0;opacity:0;margin-bottom:0;overflow:hidden}
.cl-scr.rolled .cl-head:not(:hover):not(:focus-within) .cl-roll{max-height:20px;opacity:.75;padding:2px 0 6px}
.cl-dh{display:none}
.brs.cl-deckup:not(.cl-deckshow) .cl-dh{display:block;position:relative;z-index:3;margin:6px auto 0;width:min(320px,60%);padding:5px 0 7px;text-align:center;font:700 10px/1 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#8fe3ff;opacity:.75;border-top:1px solid #2a5866;cursor:default}
.brs.cl-deckup .brs-deck,.brs.cl-deckup .brs-floor{transition:max-height .35s ease,opacity .3s ease}
.brs.cl-deckup:not(.cl-deckshow) .brs-deck{max-height:0;opacity:0;overflow:hidden;pointer-events:none}
.brs.cl-deckup:not(.cl-deckshow) .brs-floor{max-height:0;opacity:0;overflow:hidden}
.brs.cl-deckup .brs-deck{max-height:600px}
.brs.cl-deckup .brs-floor{max-height:200px}
.cl-scr{transition:height .35s ease}
@media (prefers-reduced-motion:reduce){.brs.cl-deckup .brs-deck,.brs.cl-deckup .brs-floor,.cl-scr{transition:none}}
@media (prefers-reduced-motion:reduce){.cl-head .cl-bar,.cl-roll{transition:none}}
/* Deck controls moves to the far left of the top tool row (Mark, 10 Nov 22:06); the holo-panel above the chair is hidden */
.brs .dc-holo{display:none!important}
#dktools #cl-dc{order:-1;display:inline-flex;align-items:center;gap:7px;background:#121a26;color:#8fe3ff;border:1px solid #2a3648;border-radius:8px;cursor:pointer;font:inherit}
#dktools #cl-dc:hover,#dktools #cl-dc:focus-visible,#dktools #cl-dc.on{border-color:#8fe3ff;box-shadow:0 0 10px -2px #8fe3ff}
#cl-dc .l{display:grid;grid-template-columns:repeat(3,6px);gap:2px}
#cl-dc .l i{height:4px;border-radius:1px}
#cl-dc .l i:nth-child(1){background:#3fd68a}#cl-dc .l i:nth-child(2){background:#e8645a}#cl-dc .l i:nth-child(3){background:#4f90ff}
#cl-dc .l i:nth-child(4){grid-column:1/-1;height:3px;background:#9a6bff}
/* SkippyChain moves up above the chair, where the Deck controls panel was (Mark, 10 Nov 22:09) */
.brs .brs-mid .brs-pc.cl-up,.brs .brs-mid .brs-pc.cl-up:hover{position:relative;top:auto;left:auto;width:min(230px,100%);margin:0 auto 34px;transform:perspective(500px) rotateX(10deg)}
.brs .brs-mid .brs-pc.cl-up:hover{transform:perspective(500px) rotateX(4deg) translateY(-2px)}
.brs .brs-mid .brs-pc.cl-up::after{content:'';position:absolute;left:50%;top:calc(100% + 1px);width:110%;height:32px;transform:translateX(-50%);background:linear-gradient(180deg,rgba(255,210,74,.14),rgba(255,210,74,.02));clip-path:polygon(38% 0,62% 0,100% 100%,0 100%);pointer-events:none}
.brs.brs:has(.brs-pc.cl-up) .brs-floor{height:26px}
/* Weapons console on standby until conflict arrives – dimmed so the live stations stand out (Mark, 10 Nov 22:11) */
.brs .st.wpn{filter:saturate(.35) brightness(.62)}
.brs .st.wpn:hover{filter:saturate(.5) brightness(.75)}
.brs .st.wpn .st-scr{box-shadow:none}
.brs .st.wpn .st-led{opacity:.3}
.cl-cols{flex:1 1 100%;display:grid;gap:4px;padding:8px 10px;border:1px solid #1e2a3a;border-radius:8px;background:#0a101b}
.cl-crow{display:flex;align-items:center;gap:5px}
.cl-crow .n{flex:0 0 170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:600}
.cl-crow .sw{flex:none;width:18px;height:18px;min-width:0;margin:0;padding:0;border:2px solid transparent;border-radius:50%;cursor:pointer;opacity:.8}
.cl-crow .sw:hover{opacity:1}
.cl-crow .sw.on{border-color:#fff;opacity:1}
.cl-tast{flex:0 1 200px;min-width:0;max-width:none;height:34px;margin:0;padding:0 8px;font:inherit;font-size:13px;color:#c4cdd9;background:#0c1320;border:1px solid #2a3a50;border-radius:6px}
@media (prefers-reduced-motion:reduce){.cl-note{transition:none}}
`;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const load = () => {
    let a = [];
    try { a = JSON.parse(localStorage.getItem(KEY) || '[]'); if (!Array.isArray(a)) a = []; } catch (e) {}
    // notes from the first (list) version have no place on the board yet – give them one
    if (a.some((n) => n.x == null)) { const b = a.filter((n) => n.x != null); a.forEach((n) => { if (n.x == null) { const p = spot(b); n.x = p.x; n.py = p.py; n.rot = 0; b.push(n); } }); save(a); }
    return a;
  };
  const save = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} };
  const loadL = () => { try { const a = JSON.parse(localStorage.getItem(LKEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  const saveL = (a) => { try { localStorage.setItem(LKEY, JSON.stringify(a)); } catch (e) {} };
  // Rock colours – 10 from the game's own palette (influence-client theme.js, as already used on the site:
  // main blue, Scientist blue, Pilot purple, Engineer red, Miner orange, light orange, yellow, green, soft green, grey).
  // The game gives asteroids no colour of their own, so each player picks one per rock (🎨 Rock colours, Mark 10 Nov);
  // until then rocks get them in rock-number order. Saved in this browser only.
  const RC = ['#36a7cd', '#4f90ff', '#884fff', '#e0282e', '#ff8c1a', '#faaf42', '#ffd94f', '#57ff65', '#88e675', '#8b9ab0'];
  const CKEY = 'sk_captains_log_rockcols';
  const loadC = () => { try { return JSON.parse(localStorage.getItem(CKEY) || '{}') || {}; } catch (e) { return {}; } };
  const saveC = (o) => { try { localStorage.setItem(CKEY, JSON.stringify(o)); } catch (e) {} };
  let colPanel = false;
  const rocks = () => { try { return ((window.YIC.D && window.YIC.D.owned) || []).map((a) => ({ id: a.id, name: (a.Name && a.Name.name) || 'Asteroid #' + a.id })).sort((a, b) => a.id - b.id); } catch (e) { return []; } };
  const rockCol = (id, R) => { const c = loadC()[id]; if (c && RC.includes(c)) return c; const i = R.findIndex((r) => r.id === id); return i < 0 ? '#8b9ab0' : RC[i % RC.length]; };
  let linkFrom = null; // note waiting for its link partner
  const day = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const left = () => load().filter((x) => !x.done).length;

  // The chair's label: "Captain's log · 3 to do"
  function label() {
    const b = document.querySelector('.brs-chair.cl-chair .brs-cl');
    if (!b) return;
    const n = left();
    b.textContent = "Captain's log" + (n ? ' · ' + n + ' to do' : '');
  }

  // A new note goes in the next free spot of a loose grid, starting where you have scrolled to.
  // Across: % of the board (fits any screen width). Down: pixels (py), so the board can scroll down as far as you need.
  const spot = (a, top) => {
    top = top || 0;
    for (let i = 0; i < 60; i++) {
      const x = 2 + (i % 5) * 19.5, py = top + 10 + Math.floor(i / 5) * 140;
      if (!a.some((n) => n.py != null && Math.abs((n.x || 0) - x) < 8 && Math.abs(n.py - py) < 80)) return { x, py };
    }
    return { x: 2 + Math.random() * 70, py: top + 10 + Math.random() * 200 };
  };

  const TABS = () => '<div class="cl-tabs">' + [['today', '🗓 Today'], ['notes', '📌 Notes'], ['log', '📜 Log']].map((t) => '<button type="button" data-tab="' + t[0] + '"' + (tab === t[0] ? ' class="on"' : '') + '>' + t[1] + '</button>').join('') + '</div>';
  const tabs = (scr) => scr.querySelectorAll('.cl-tabs button').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; draw(scr); }));

  function draw(scr) {
    // 📜 Log – everything your crews have done in the game, from the game's own records (same as the Activity log page)
    // 🗓 Today – today's workload (was the chair's own view), drawn by pages/workload.js
    if (tab === 'today') {
      let AS = []; try { AS = (window.YIC && window.YIC.asts) || []; } catch (e) {}
      const pick = '<select class="cl-tast" aria-label="Which rock"><option value="">All rocks</option>' + AS.map((a, i) => '<option value="' + i + '"' + (String(i) === todayAst ? ' selected' : '') + '>' + esc(a.name) + '</option>').join('') + '</select>';
      scr.innerHTML = '<div class="cl-bar"><div class="h"><b>📋 Captain\'s log</b><span>Today\'s workload</span></div>' + TABS() + (AS.length > 1 ? pick : '') + '</div><div class="cl-logv cl-today"></div>';
      const ts = scr.querySelector('.cl-tast');
      if (ts) ts.addEventListener('change', () => { todayAst = ts.value; todayTop = 0; draw(scr); });
      tabs(scr);
      scr.classList.remove('rolled');
      deckUp(scr, false);
      const v = scr.querySelector('.cl-today');
      if (window.YICdrawToday) { window.YICdrawToday(v, todayAst); v.scrollTop = todayTop; v.addEventListener('scroll', () => (todayTop = v.scrollTop), { passive: true }); }
      else v.innerHTML = '<div class="note">Still loading – try again in a moment.</div>';
      return;
    }
    if (tab === 'log') {
      scr.innerHTML = '<div class="cl-bar"><div class="h"><b>📋 Captain\'s log</b><span>Adalia Stardate <b class="cl-sdnow">' + (window.YICstardate ? window.YICstardate(Date.now() / 1000, 2) : '') + '</b> · from the game\'s records</span></div>' + TABS() + '</div><div class="cl-logv"></div>';
      tabs(scr);
      scr.classList.remove('rolled');
      deckUp(scr, false);
      // the stardate ticks on: 1 Adalian day is 1 real hour, so 0.01 is 36 seconds
      clearInterval(sdTick);
      sdTick = setInterval(() => { const n = scr.querySelector('.cl-sdnow'); if (!n || !n.isConnected) return clearInterval(sdTick); if (window.YICstardate) n.textContent = window.YICstardate(Date.now() / 1000, 2); }, 6000);
      const v = scr.querySelector('.cl-logv');
      if (window.YICdrawHistory) window.YICdrawHistory(v, { into: true, noTitle: true, stardate: true });
      else v.innerHTML = '<div class="note">Still loading – try again in a moment.</div>';
      return;
    }
    const ob = scr.querySelector('.cl-board'); if (ob) scrollY = ob.scrollTop;
    const all = load(), done = all.filter((x) => x.done).length;
    const R = rocks(), opts = (sel) => '<option value="">No rock</option>' + R.map((r) => '<option value="' + r.id + '"' + (sel === r.id ? ' selected' : '') + '>' + esc(r.name) + '</option>').join('');
    const note = (x) => '<div class="cl-note' + (x.done ? ' done' : '') + (linkFrom === x.id ? ' linking' : '') + '" data-n="' + esc(x.id) + '" title="' + (x.done ? 'Done ' + day(x.doneAt) : 'Added ' + day(x.added)) + '" style="left:' + (x.x || 0) + '%;top:' + (x.py != null ? x.py + 'px' : (x.y || 0) + '%') + ';--rot:' + (x.rot || 0) + 'deg' + (x.rock ? ';--rc:' + rockCol(x.rock, R) : '') + '">' +
      (x.rock ? '<span class="rk">' + esc((R.find((r) => r.id === x.rock) || {}).name || x.rockName || 'Asteroid #' + x.rock) + '</span>' : '') +
      '<span class="t">' + esc(x.text) + '</span><span class="ft">' +
      (R.length ? '<select data-rock="' + esc(x.id) + '" title="Which rock is this for?">' + opts(x.rock || null) + '</select>' : '<span style="flex:1"></span>') +
      '<input type="checkbox" data-id="' + esc(x.id) + '"' + (x.done ? ' checked' : '') + ' title="' + (x.done ? 'Not done after all' : 'Tick when done') + '">' +
      '<button type="button" class="ln" data-ln="' + esc(x.id) + '" title="Link to another note – then click the other note">🔗</button>' +
      '<button type="button" class="rm" data-rm="' + esc(x.id) + '" title="Remove this note">✕</button></span></div>';
    scr.innerHTML = '<div class="cl-head"><div class="cl-roll">📋 Captain\'s log ▾</div><div class="cl-bar"><div class="h"><b>📋 Captain\'s log</b><span>Saved in this browser only · drag notes around · scroll down for more room</span></div>' + TABS() +
      '<form class="cl-add"><input type="text" maxlength="200" placeholder="e.g. Build a Habitat on TRCS CMS" aria-label="New note">' + (R.length ? '<select aria-label="Rock">' + opts(lastRock) + '</select>' : '') + '<button type="submit">Add</button></form>' +
      (done ? '<button type="button" class="cl-clear">Clear done (' + done + ')</button>' : '') +
      (R.length ? '<button type="button" class="cl-clear cl-colbtn">🎨 Rock colours</button>' : '') +
      (colPanel && R.length ? '<div class="cl-cols">' + R.map((r) => { const cur = rockCol(r.id, R); return '<div class="cl-crow"><span class="n" style="color:' + cur + '">' + esc(r.name) + '</span>' +
        RC.map((c) => '<button type="button" class="sw' + (c === cur ? ' on' : '') + '" data-rc="' + r.id + '" data-c="' + c + '" style="background:' + c + '" title="Use this colour for ' + esc(r.name) + '"></button>').join('') + '</div>'; }).join('') + '</div>' : '') +
      (linkFrom ? '<span class="cl-hint">🔗 Click another note to link it (click a linked one again to unlink) – or 🔗 again / Esc to cancel</span>' : '') + '</div></div>' +
      '<div class="cl-board' + (linkFrom ? ' linkmode' : '') + '"><div class="cl-cv"><svg class="cl-lines"></svg>' + (all.length ? all.map(note).join('') : '<div class="cl-none">No notes yet – add one above.</div>') + '</div></div>';

    tabs(scr);
    scr.querySelector('.cl-add').addEventListener('submit', (e) => {
      e.preventDefault();
      const t = scr.querySelector('.cl-add input').value.trim();
      if (!t) return;
      const a = load(), p = spot(a, scr.querySelector('.cl-board').scrollTop), rs = scr.querySelector('.cl-add select'), rk = rs && rs.value ? +rs.value : null;
      lastRock = rk;
      const rn = rk ? (R.find((r) => r.id === rk) || {}).name : null;
      a.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text: t, added: Date.now(), done: false, x: p.x, py: p.py, rot: +(Math.random() * 4 - 2).toFixed(1), rock: rk, rockName: rn });
      save(a); draw(scr); label();
      scr.querySelector('.cl-add input').focus();
    });
    scr.querySelectorAll('input[data-id]').forEach((c) => c.addEventListener('change', () => {
      const a = load(), x = a.find((y) => y.id === c.dataset.id);
      if (x) { x.done = c.checked; x.doneAt = c.checked ? Date.now() : null; save(a); }
      draw(scr); label();
    }));
    scr.querySelectorAll('button[data-rm]').forEach((b) => b.addEventListener('click', () => {
      save(load().filter((y) => y.id !== b.dataset.rm)); saveL(loadL().filter((l) => !l.includes(b.dataset.rm))); if (linkFrom === b.dataset.rm) linkFrom = null; draw(scr); label();
    }));
    const clr = scr.querySelector('.cl-clear');
    if (clr) clr.addEventListener('click', () => { const keep = load().filter((y) => !y.done), ids = new Set(keep.map((y) => y.id)); save(keep); saveL(loadL().filter((l) => ids.has(l[0]) && ids.has(l[1]))); draw(scr); label(); });
    // 🎨 Rock colours: pick one of the 10 game colours for each rock
    const cb = scr.querySelector('.cl-colbtn');
    if (cb) cb.addEventListener('click', () => { colPanel = !colPanel; draw(scr); });
    scr.querySelectorAll('.cl-cols .sw').forEach((b) => b.addEventListener('click', () => { const o = loadC(); o[b.dataset.rc] = b.dataset.c; saveC(o); draw(scr); }));
    // rock picker on each note
    scr.querySelectorAll('select[data-rock]').forEach((sl) => sl.addEventListener('change', () => {
      const a = load(), x = a.find((y) => y.id === sl.dataset.rock), rk = sl.value ? +sl.value : null;
      if (x) { x.rock = rk; x.rockName = rk ? (R.find((r) => r.id === rk) || {}).name : null; save(a); }
      draw(scr);
    }));
    // 🔗 start / cancel linking
    scr.querySelectorAll('button[data-ln]').forEach((b) => b.addEventListener('click', () => { linkFrom = linkFrom === b.dataset.ln ? null : b.dataset.ln; draw(scr); }));

    // Drag a note around the board; where you drop it is saved
    const board = scr.querySelector('.cl-board'), cv = board.querySelector('.cl-cv');
    // notes from before scrolling was added were placed as % of the screen height – fix them to pixels once
    { const a = load(); let ch = false;
      cv.querySelectorAll('.cl-note').forEach((el) => { const n = a.find((q) => q.id === el.dataset.n); if (n && n.py == null) { n.py = el.offsetTop; ch = true; el.style.top = n.py + 'px'; } });
      if (ch) save(a); }
    // the board fits the notes: just one note's room below the lowest (Mark, 10 Nov – no big gap left after moving notes back up); dragging near the bottom edge makes more
    const fit = (extra) => {
      let lo = 0;
      cv.querySelectorAll('.cl-note').forEach((el) => { lo = Math.max(lo, el.offsetTop + el.offsetHeight); });
      cv.style.height = Math.max(board.clientHeight, lo + 150, extra || 0) + 'px';
    };
    fit();
    board.scrollTop = scrollY;
    // The header rolls up while you work on the notes and rolls back down when you hover over it (Mark, 10 Nov)
    scr.classList.remove('rolled'); // header always pinned at the top
    board.addEventListener('pointerleave', () => { if (!board.querySelector('.cl-note.drag')) showDeck(scr); });
    board.addEventListener('pointerenter', () => { if (linkFrom) return; /* header stays pinned (Mark, 10 Nov 22:02 – roll-up removed) */ const br = scr.closest('.brs'); if (!br || !br.classList.contains('cl-deckup') || br.classList.contains('cl-deckshow')) deckUp(scr, true); });
    if (false) { const br = scr.closest('.brs'); if (!br || !br.classList.contains('cl-deckup') || br.classList.contains('cl-deckshow')) deckUp(scr, true); }
    cv.querySelectorAll('.cl-note').forEach((el) => el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('input,button,select')) return;
      e.preventDefault();
      if (linkFrom && linkFrom !== el.dataset.n) { // second click in link mode: link (or unlink) the two notes
        const A = linkFrom, B = el.dataset.n, L = loadL(), i = L.findIndex((l) => l.includes(A) && l.includes(B));
        if (i >= 0) L.splice(i, 1); else L.push([A, B]);
        saveL(L); linkFrom = null; draw(scr); return;
      }
      const bw = cv.clientWidth, sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop, st0 = board.scrollTop;
      el.classList.add('drag'); el.setPointerCapture(e.pointerId);
      const pos = (ev) => [
        Math.max(0, Math.min(bw - el.offsetWidth, ox + ev.clientX - sx)) / bw * 100,
        Math.max(0, oy + ev.clientY - sy + board.scrollTop - st0),
      ];
      const move = (ev) => {
        // drag near the bottom (or top) edge and the board scrolls with you
        const r = board.getBoundingClientRect();
        if (ev.clientY > r.bottom - 36) { fit(board.scrollTop + board.clientHeight + 60); board.scrollTop += 14; }
        else if (ev.clientY < r.top + 36) board.scrollTop -= 14;
        const [x, y] = pos(ev); el.style.left = x + '%'; el.style.top = y + 'px'; lines();
      };
      const up = (ev) => {
        el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
        el.classList.remove('drag');
        const [x, y] = pos(ev), a = load(), n = a.find((q) => q.id === el.dataset.n);
        if (n) { n.x = +x.toFixed(2); n.py = Math.round(y); save(a); }
        cv.appendChild(el); // last moved sits on top
        fit(); lines();
      };
      el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    }));

    // Lines between linked notes, centre to centre; click a line to remove the link
    function lines() {
      const svg = cv.querySelector('.cl-lines'), L = loadL(), col = {};
      all.forEach((x) => { col[x.id] = x.rock ? rockCol(x.rock, R) : '#8fe3ff'; });
      const mid = (id) => { const n = cv.querySelector('.cl-note[data-n="' + id + '"]'); return n ? [n.offsetLeft + n.offsetWidth / 2, n.offsetTop + n.offsetHeight / 2] : null; };
      svg.innerHTML = L.map((l, i) => {
        const a = mid(l[0]), b = mid(l[1]);
        if (!a || !b) return '';
        const c = col[l[0]] === col[l[1]] ? col[l[0]] : '#8fe3ff', xy = 'x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"';
        return '<g data-l="' + i + '"><title>Click to remove this link</title><line class="v" ' + xy + ' stroke="' + c + '"/><line class="h" ' + xy + '/></g>';
      }).join('');
      svg.querySelectorAll('g').forEach((g) => g.addEventListener('click', () => { const L2 = loadL(); L2.splice(+g.dataset.l, 1); saveL(L2); lines(); }));
    }
    lines();
  }

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && linkFrom) { linkFrom = null; const sc = document.querySelector('.cl-scr'); if (sc) draw(sc); } });

  const mapOf = (vs) => vs.querySelector(':scope > div:not(.brs-plate):not(.brs-log):not(.dc-scr)');

  // The Bridge consoles below the viewscreen roll up too, and the viewscreen fills the window down to
  // a thin "Bridge consoles" strip – no gap, nothing off the bottom (Mark, 10 Nov).
  // Hover the strip: the consoles come back and the viewscreen goes back to its normal size.
  // Move back onto the notes: they roll up again.
  // Consoles back, viewscreen back to its normal size (hovering the strip, or moving off the notes – Mark, 10 Nov 22:04)
  function showDeck(scr) {
    const br = scr.closest('.brs');
    if (!br || !br.classList.contains('cl-deckup') || br.classList.contains('cl-deckshow')) return;
    br.classList.add('cl-deckshow');
    if (scr.dataset.base) scr.style.height = scr.dataset.base + 'px';
  }

  function deckUp(scr, up) {
    const br = scr.closest('.brs'), deck = br && br.querySelector('.brs-deck');
    if (!br || !deck) return;
    if (!scr.dataset.base) scr.dataset.base = scr.offsetHeight;
    const base = +scr.dataset.base;
    if (!br.querySelector('.cl-dh')) {
      const d = document.createElement('div'); d.className = 'cl-dh'; d.textContent = '▴ Bridge consoles ▴'; deck.before(d);
      d.addEventListener('mouseenter', () => showDeck(scr));
    }
    if (up) {
      br.classList.add('cl-deckup'); br.classList.remove('cl-deckshow');
      const top = scr.getBoundingClientRect().top, fill = Math.round(window.innerHeight - Math.max(0, top) - 48);
      scr.style.height = Math.max(base, fill) + 'px';
    } else {
      br.classList.remove('cl-deckup', 'cl-deckshow');
      scr.style.height = base + 'px';
    }
  }

  function setOn(br, want) {
    const vs = br.querySelector('.brs-vs'), plate = vs && vs.querySelector('.brs-plate'), btn = br.querySelector('.brs-chair');
    if (!vs || !plate) return;
    let scr = vs.querySelector('.cl-scr');
    const map = mapOf(vs);
    if (!want) {
      on = false;
      if (scr) deckUp(scr, false);
      if (scr) scr.remove();
      if (map && !vs.querySelector('.brs-log') && !vs.querySelector('.dc-scr')) { map.style.display = ''; plate.textContent = 'VIEWSCREEN'; }
      if (btn) btn.classList.remove('on');
      return;
    }
    // close today's workload or Deck controls first, so only one thing is on the viewscreen
    const chair = br.querySelector('.brs-chair'), holo = br.querySelector('.dc-holo.on');
    if (vs.querySelector('.brs-log') && chair) { passChair = true; chair.click(); passChair = false; }
    if (holo) holo.click();
    on = true;
    if (!scr) { scr = document.createElement('section'); scr.className = 'cl-scr'; vs.insertBefore(scr, plate); }
    const h = map && map.style.display !== 'none' ? map.offsetHeight : 0;
    if (h > 0) scr.style.height = h + 'px';
    if (map) map.style.display = 'none';
    rolled = false; // header starts rolled down each time the log opens
    plate.textContent = "CAPTAIN'S LOG";
    if (btn) btn.classList.add('on');
    draw(scr);
  }

  // The captain's chair opens the Captain's log (Mark, 10 Nov 2026: "consolidate Today's workload and Captain's log"):
  // Today's workload is now the log's first tab. The Weapons console is back in its place, ready for conflict.
  function addPanel(br) {
    const mid = br.querySelector('.brs-mid'), chair = mid && mid.querySelector('.brs-chair');
    if (!chair || chair.classList.contains('cl-chair')) return;
    chair.classList.add('cl-chair');
    const pc = mid.querySelector('.brs-pc');
    if (pc) { pc.classList.add('cl-up'); mid.insertBefore(pc, chair); }
    chair.title = "The captain's chair – your Captain's log: today's workload, notes and the game log";
    label();
    // The chair, Deck controls and the log share the viewscreen. Skippy's own click (welcome clip) is left alone.
    mid.addEventListener('click', (e) => {
      if (passChair || !e.target.closest || e.target.closest('.brs-sk')) return;
      if (e.target.closest('.brs-chair')) {
        e.stopPropagation(); e.preventDefault(); // the old Today's workload view is not used any more
        if (on && tab === 'today') setOn(br, false);
        else { tab = 'today'; setOn(br, true); }
        return;
      }
      if (on && e.target.closest('.dc-holo')) setOn(br, false);
    }, true);
    if (on) setOn(br, true);
  }

  // The Bridge is redrawn when data refreshes – put the panel back each time.
  const check = () => {
    if (!document.getElementById('cl-css') && document.head) {
      const st = document.createElement('style'); st.id = 'cl-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const br = document.querySelector('.brs');
    if (br && !br.querySelector('.cl-chair')) addPanel(br);
  };
  // Deck controls button at the far left of the tool row (search / Play / Command Deck…). It opens the same
  // Deck controls on the Bridge viewscreen (vendor/deckcontrols.js) – from another deck it goes to the Bridge first.
  const dcBtn = () => {
    const tray = document.getElementById('dktools');
    if (!tray) return;
    let b = document.getElementById('cl-dc');
    if (!b) {
      b = document.createElement('button');
      b.type = 'button'; b.id = 'cl-dc';
      b.title = "Deck controls – settings for Skippy's Command Deck browser extension";
      b.innerHTML = '<span class="l" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Deck controls';
      b.addEventListener('click', () => {
        const h = document.querySelector('.brs .dc-holo');
        if (h) { h.click(); return; }
        if (window.YICgoDeck) window.YICgoDeck('bridge');
        let n = 0; const t = setInterval(() => { const x = document.querySelector('.brs .dc-holo'); if (x) { clearInterval(t); if (!x.classList.contains('on')) x.click(); } else if (++n > 40) clearInterval(t); }, 100);
      });
    }
    if (b.parentNode !== tray) tray.prepend(b);
    const h = document.querySelector('.brs .dc-holo');
    b.classList.toggle('on', !!(h && h.classList.contains('on')));
  };
  new MutationObserver(dcBtn).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  dcBtn();
  new MutationObserver(check).observe(document.documentElement, { childList: true, subtree: true });
  check();
})();
