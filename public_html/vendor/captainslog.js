/* Captain's log – Skippy's Awesome Command Deck – TEST ONLY (?beta=1), Mark 10 Nov 2026
   "Just be able to add boxes with tasks for now and tick them off when done ... to help me remember
   what I was doing last night." A console on the Bridge in the Weapons console's place; clicking it puts the log
   on the viewscreen (like Deck controls). Saved IN THIS BROWSER ONLY (localStorage) – Mark: "steer clear
   of holding data", so nothing goes to the server. May join the Logistics Hub later.
   Project doc: claude/planning-section-idea-2026-11-10.md */
(function () {
  'use strict';
  if (!/[?&]beta=1\b/.test(location.search)) return; // test only

  const KEY = 'sk_captains_log';
  let on = false, tab = 'notes', sdTick = 0; // tab: 'notes' (sticky notes) or 'log' (everything done in the game)

  const CSS = `
.cl-scr{position:relative;display:flex;flex-direction:column;height:clamp(320px,52vh,600px);padding:30px 16px 14px;clip-path:polygon(3% 0,97% 0,100% 12%,100% 100%,0 100%,0 12%);background:repeating-linear-gradient(0deg,rgba(143,227,255,.03) 0 1px,transparent 1px 3px),radial-gradient(ellipse at 50% 0,#0d1825,#05080d 75%);font-size:14px;line-height:1.4;color:#c4cdd9}
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
.cl-board{position:relative;flex:1 1 auto;min-height:0;overflow:hidden;border-top:1px dashed #1e2a3a}
.cl-none{position:absolute;inset:0;display:grid;place-items:center;color:#8b9ab0;font-size:13px;pointer-events:none}
.cl-note{position:absolute;width:150px;min-height:120px;padding:10px 10px 26px;background:linear-gradient(180deg,#132433,#0c1622);border:1px solid #2a5866;border-top:3px solid #8fe3ff;border-radius:2px 2px 2px 14px;box-shadow:3px 5px 14px rgba(0,0,0,.55),0 0 14px -6px #8fe3ff;transform:rotate(var(--rot,0deg));cursor:grab;touch-action:none;user-select:none;transition:box-shadow .15s}
.cl-note::before{content:'';position:absolute;left:50%;top:-9px;width:44px;height:14px;transform:translateX(-50%) rotate(-3deg);background:rgba(143,227,255,.18);border:1px solid rgba(143,227,255,.25)}
.cl-note:hover{box-shadow:4px 7px 18px rgba(0,0,0,.6),0 0 18px -4px #8fe3ff}
.cl-note.drag{cursor:grabbing;z-index:5;transform:rotate(0deg) scale(1.04);box-shadow:8px 12px 24px rgba(0,0,0,.7),0 0 22px -2px #8fe3ff;transition:none}
.cl-note .t{display:block;color:#fff;font-size:13.5px;overflow-wrap:anywhere}
.cl-note .d{position:absolute;left:10px;bottom:6px;color:#8b9ab0;font-size:10.5px}
.cl-note input{position:absolute;right:30px;bottom:5px;width:16px;height:16px;margin:0;padding:0;min-width:0;accent-color:#3fd68a;cursor:pointer}
.cl-note button{position:absolute;right:5px;bottom:3px;width:20px;height:20px;margin:0;padding:0;min-width:0;font:12px/1 system-ui,sans-serif;color:#8b9ab0;background:none;border:1px solid transparent;border-radius:4px;cursor:pointer}
.cl-note button:hover{color:#ff564d;border-color:#ff564d}
.cl-note.done{opacity:.6;border-top-color:#3fd68a}
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
.cl-logv .note{color:#9fb0c4;font-size:13px}
@media (prefers-reduced-motion:reduce){.cl-note{transition:none}}
`;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const load = () => {
    let a = [];
    try { a = JSON.parse(localStorage.getItem(KEY) || '[]'); if (!Array.isArray(a)) a = []; } catch (e) {}
    // notes from the first (list) version have no place on the board yet – give them one
    if (a.some((n) => n.x == null)) { const b = a.filter((n) => n.x != null); a.forEach((n) => { if (n.x == null) { const p = spot(b); n.x = p.x; n.y = p.y; n.rot = 0; b.push(n); } }); save(a); }
    return a;
  };
  const save = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} };
  const day = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const left = () => load().filter((x) => !x.done).length;

  function label() {
    const b = document.querySelector('.cl-btn');
    if (!b) return;
    const n = left();
    b.querySelector('.st-n').textContent = n;
    b.querySelector('.st-l').textContent = n === 1 ? 'task to do' : 'tasks to do';
  }

  // A new note goes in the next free spot of a loose grid (as % of the board, so it fits any screen size)
  const spot = (a) => {
    for (let i = 0; i < 40; i++) {
      const x = 2 + (i % 5) * 19.5, y = 4 + Math.floor(i / 5) * 32;
      if (!a.some((n) => Math.abs((n.x || 0) - x) < 8 && Math.abs((n.y || 0) - y) < 12)) return { x, y };
    }
    return { x: 2 + Math.random() * 70, y: 4 + Math.random() * 50 };
  };

  const tabs = (scr) => scr.querySelectorAll('.cl-tabs button').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; draw(scr); }));

  function draw(scr) {
    // 📜 Log – everything your crews have done in the game, from the game's own records (same as the Activity log page)
    if (tab === 'log') {
      scr.innerHTML = '<div class="cl-bar"><div class="h"><b>📋 Captain\'s log</b><span>Adalia Stardate <b class="cl-sdnow">' + (window.YICstardate ? window.YICstardate(Date.now() / 1000, 2) : '') + '</b> · from the game\'s records</span></div>' + '<div class="cl-tabs"><button type="button" data-tab="notes"' + (tab === 'notes' ? ' class="on"' : '') + '>📌 Notes</button><button type="button" data-tab="log"' + (tab === 'log' ? ' class="on"' : '') + '>📜 Log</button></div>' + '</div><div class="cl-logv"></div>';
      tabs(scr);
      // the stardate ticks on: 1 Adalian day is 1 real hour, so 0.01 is 36 seconds
      clearInterval(sdTick);
      sdTick = setInterval(() => { const n = scr.querySelector('.cl-sdnow'); if (!n || !n.isConnected) return clearInterval(sdTick); if (window.YICstardate) n.textContent = window.YICstardate(Date.now() / 1000, 2); }, 6000);
      const v = scr.querySelector('.cl-logv');
      if (window.YICdrawHistory) window.YICdrawHistory(v, { into: true, noTitle: true, stardate: true });
      else v.innerHTML = '<div class="note">Still loading – try again in a moment.</div>';
      return;
    }
    const all = load(), done = all.filter((x) => x.done).length;
    const note = (x) => '<div class="cl-note' + (x.done ? ' done' : '') + '" data-n="' + esc(x.id) + '" style="left:' + (x.x || 0) + '%;top:' + (x.y || 0) + '%;--rot:' + (x.rot || 0) + 'deg">' +
      '<span class="t">' + esc(x.text) + '</span><span class="d">' + (x.done ? 'done ' + day(x.doneAt) : day(x.added)) + '</span>' +
      '<input type="checkbox" data-id="' + esc(x.id) + '"' + (x.done ? ' checked' : '') + ' title="' + (x.done ? 'Not done after all' : 'Tick when done') + '">' +
      '<button type="button" data-rm="' + esc(x.id) + '" title="Remove this note">✕</button></div>';
    scr.innerHTML = '<div class="cl-bar"><div class="h"><b>📋 Captain\'s log</b><span>Saved in this browser only · drag notes around</span></div>' + '<div class="cl-tabs"><button type="button" data-tab="notes"' + (tab === 'notes' ? ' class="on"' : '') + '>📌 Notes</button><button type="button" data-tab="log"' + (tab === 'log' ? ' class="on"' : '') + '>📜 Log</button></div>' +
      '<form class="cl-add"><input type="text" maxlength="200" placeholder="e.g. Build a Habitat on TRCS CMS" aria-label="New note"><button type="submit">Add</button></form>' +
      (done ? '<button type="button" class="cl-clear">Clear done (' + done + ')</button>' : '') + '</div>' +
      '<div class="cl-board">' + (all.length ? all.map(note).join('') : '<div class="cl-none">No notes yet – add one above.</div>') + '</div>';

    tabs(scr);
    scr.querySelector('.cl-add').addEventListener('submit', (e) => {
      e.preventDefault();
      const t = scr.querySelector('.cl-add input').value.trim();
      if (!t) return;
      const a = load(), p = spot(a);
      a.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text: t, added: Date.now(), done: false, x: p.x, y: p.y, rot: +(Math.random() * 4 - 2).toFixed(1) });
      save(a); draw(scr); label();
      scr.querySelector('.cl-add input').focus();
    });
    scr.querySelectorAll('input[data-id]').forEach((c) => c.addEventListener('change', () => {
      const a = load(), x = a.find((y) => y.id === c.dataset.id);
      if (x) { x.done = c.checked; x.doneAt = c.checked ? Date.now() : null; save(a); }
      draw(scr); label();
    }));
    scr.querySelectorAll('button[data-rm]').forEach((b) => b.addEventListener('click', () => {
      save(load().filter((y) => y.id !== b.dataset.rm)); draw(scr); label();
    }));
    const clr = scr.querySelector('.cl-clear');
    if (clr) clr.addEventListener('click', () => { save(load().filter((y) => !y.done)); draw(scr); label(); });

    // Drag a note around the board; where you drop it is saved
    const board = scr.querySelector('.cl-board');
    board.querySelectorAll('.cl-note').forEach((el) => el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('input,button')) return;
      e.preventDefault();
      const bw = board.clientWidth, bh = board.clientHeight, sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop;
      el.classList.add('drag'); el.setPointerCapture(e.pointerId);
      const pos = (ev) => [
        Math.max(0, Math.min(bw - el.offsetWidth, ox + ev.clientX - sx)) / bw * 100,
        Math.max(0, Math.min(bh - el.offsetHeight, oy + ev.clientY - sy)) / bh * 100,
      ];
      const move = (ev) => { const [x, y] = pos(ev); el.style.left = x + '%'; el.style.top = y + '%'; };
      const up = (ev) => {
        el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
        el.classList.remove('drag');
        const [x, y] = pos(ev), a = load(), n = a.find((q) => q.id === el.dataset.n);
        if (n) { n.x = +x.toFixed(2); n.y = +y.toFixed(2); save(a); }
        board.appendChild(el); // last moved sits on top
      };
      el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    }));
  }

  const mapOf = (vs) => vs.querySelector(':scope > div:not(.brs-plate):not(.brs-log):not(.dc-scr)');

  function setOn(br, want) {
    const vs = br.querySelector('.brs-vs'), plate = vs && vs.querySelector('.brs-plate'), btn = br.querySelector('.cl-btn');
    if (!vs || !plate) return;
    let scr = vs.querySelector('.cl-scr');
    const map = mapOf(vs);
    if (!want) {
      on = false;
      if (scr) scr.remove();
      if (map && !vs.querySelector('.brs-log') && !vs.querySelector('.dc-scr')) { map.style.display = ''; plate.textContent = 'VIEWSCREEN'; }
      if (btn) btn.classList.remove('on');
      return;
    }
    // close today's workload or Deck controls first, so only one thing is on the viewscreen
    const chair = br.querySelector('.brs-chair'), holo = br.querySelector('.dc-holo.on');
    if (vs.querySelector('.brs-log') && chair) chair.click();
    if (holo) holo.click();
    on = true;
    if (!scr) { scr = document.createElement('section'); scr.className = 'cl-scr'; vs.insertBefore(scr, plate); }
    const h = map && map.style.display !== 'none' ? map.offsetHeight : 0;
    if (h > 0) scr.style.height = h + 'px';
    if (map) map.style.display = 'none';
    plate.textContent = "CAPTAIN'S LOG";
    if (btn) btn.classList.add('on');
    draw(scr);
  }

  // Takes the Weapons console's place for now (Mark, 10 Nov: "remove the Weapons button for now and look
  // to see where it goes when we get to conflict"). The Weapons console comes back from pages/workload.js
  // if this file is not loaded.
  function addPanel(br) {
    const wpn = br.querySelector('.st.wpn'), mid = br.querySelector('.brs-mid');
    if (!wpn || !mid || br.querySelector('.cl-btn')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'st cl-btn';
    b.style.cssText = '--dc:#8fe3ff;--ry:-15deg';
    b.title = "Captain's log – your own to-do list, saved in this browser";
    b.innerHTML = '<span class="st-scr"><span class="st-h">Captain\'s log<i class="st-led"></i></span><span class="st-r">Log station</span>' +
      '<span class="st-n"></span><span class="st-l"></span><span class="st-s">Your own to-do list</span><span class="st-go">Open log ▸</span></span>' +
      '<span class="st-base"><i></i><i></i><i></i><i></i></span>';
    wpn.replaceWith(b);
    label();
    b.addEventListener('click', () => setOn(br, !on));
    // the chair (today's workload) and Deck controls take the viewscreen back
    mid.addEventListener('click', (e) => {
      const t = e.target.closest && e.target.closest('.brs-chair,.dc-holo');
      if (on && t && !(e.target.closest('.brs-sk'))) setOn(br, false);
    }, true);
    if (on) setOn(br, true);
  }

  // The Bridge is redrawn when data refreshes – put the panel back each time.
  const check = () => {
    if (!document.getElementById('cl-css') && document.head) {
      const st = document.createElement('style'); st.id = 'cl-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const br = document.querySelector('.brs');
    if (br && !br.querySelector('.cl-btn')) addPanel(br);
  };
  new MutationObserver(check).observe(document.documentElement, { childList: true, subtree: true });
  check();
})();
