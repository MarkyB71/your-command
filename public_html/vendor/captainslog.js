/* Captain's log – Skippy's Awesome Command Deck – TEST ONLY (?beta=1), Mark 10 Nov 2026
   "Just be able to add boxes with tasks for now and tick them off when done ... to help me remember
   what I was doing last night." A panel under the SkippyChain on the Bridge; clicking it puts the log
   on the viewscreen (like Deck controls). Saved IN THIS BROWSER ONLY (localStorage) – Mark: "steer clear
   of holding data", so nothing goes to the server. May join the Logistics Hub later.
   Project doc: claude/planning-section-idea-2026-11-10.md */
(function () {
  'use strict';
  if (!/[?&]beta=1\b/.test(location.search)) return; // test only

  const KEY = 'sk_captains_log';
  let on = false;

  const CSS = `
.cl-btn{all:unset;box-sizing:border-box;cursor:pointer;display:block;position:absolute;top:calc(100% + 84px);left:50%;width:min(230px,150%);padding:8px 6px 9px;z-index:2;text-align:center;border-radius:8px 8px 3px 3px;border:1px solid #2a5866;border-top:2px solid #8fe3ff;background:linear-gradient(180deg,rgba(143,227,255,.1),rgba(0,0,0,.35));box-shadow:0 0 18px -6px #8fe3ff,inset 0 0 22px -10px #8fe3ff;transform:translateX(-50%) perspective(500px) rotateX(18deg);transition:box-shadow .2s,transform .2s}
.cl-btn:hover,.cl-btn:focus-visible,.cl-btn.on{box-shadow:0 0 26px -2px #8fe3ff,inset 0 0 26px -8px #8fe3ff;transform:translateX(-50%) perspective(500px) rotateX(10deg) translateY(-2px)}
.cl-btn b{display:block;font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#8fe3ff;text-shadow:0 0 8px rgba(143,227,255,.6)}
.cl-btn span{display:block;font-size:12px;color:#c4cdd9;margin-top:3px}
.brs:has(.cl-btn) .brs-floor{height:166px}
@media (max-width:760px){.cl-btn,.cl-btn:hover,.cl-btn.on{position:static;transform:none;width:100%;max-width:240px}.brs:has(.cl-btn) .brs-floor{height:26px}}
@media (prefers-reduced-motion:reduce){.cl-btn{transition:none}}
.cl-scr{position:relative;display:block;height:clamp(320px,52vh,600px);overflow:auto;padding:34px 16px 16px;clip-path:polygon(3% 0,97% 0,100% 12%,100% 100%,0 100%,0 12%);background:repeating-linear-gradient(0deg,rgba(143,227,255,.03) 0 1px,transparent 1px 3px),radial-gradient(ellipse at 50% 0,#0d1825,#05080d 75%);font-size:14px;line-height:1.45;color:#c4cdd9;scrollbar-color:#2c3a4c transparent}
.cl-scr *{box-sizing:border-box}
.cl-in{max-width:620px;margin:0 auto}
.cl-top{padding:12px 14px;margin:0 0 10px;border:1px solid #2a3646;border-left:3px solid #8fe3ff}
.cl-top b{display:block;color:#fff;font-size:15px}
.cl-top span{display:block;color:#8b9ab0;font-size:12px}
.cl-add{display:flex;gap:8px;margin:0 0 14px}
.cl-add input{flex:1 1 auto;min-width:0;max-width:none;height:36px;margin:0;padding:0 10px;font:inherit;color:#fff;background:#0c1320;border:1px solid #2a3a50;border-radius:6px}
.cl-add input:focus{outline:none;border-color:#8fe3ff}
.cl-add button,.cl-clear{flex:none;min-width:0;height:36px;margin:0;padding:0 16px;font:600 13px system-ui,sans-serif;color:#05080d;background:#8fe3ff;border:0;border-radius:6px;cursor:pointer}
.cl-clear{height:28px;padding:0 10px;font-size:12px;color:#8fe3ff;background:none;border:1px solid #2a5866}
.cl-scr h3{display:flex;align-items:center;gap:10px;margin:16px 0 6px;font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#4fb3ff}
.cl-scr h3 .cl-clear{margin-left:auto;letter-spacing:0;text-transform:none}
.cl-row{display:grid;grid-template-columns:20px minmax(0,1fr) auto 28px;gap:10px;align-items:center;padding:9px 12px;margin:0 0 6px;border:1px solid #1e2a3a;border-radius:8px;background:#0c1320}
.cl-row:hover{border-color:#4fb3ff}
.cl-row input{width:18px;height:18px;margin:0;padding:0;min-width:0;flex:none;accent-color:#3fd68a;cursor:pointer}
.cl-row .t{color:#fff;overflow-wrap:anywhere}
.cl-row .d{color:#8b9ab0;font-size:11px;white-space:nowrap}
.cl-row button{width:28px;height:28px;margin:0;padding:0;min-width:0;font:inherit;color:#8b9ab0;background:none;border:1px solid transparent;border-radius:5px;cursor:pointer}
.cl-row button:hover{color:#ff564d;border-color:#ff564d}
.cl-row.done .t{color:#8b9ab0;text-decoration:line-through}
.cl-none{padding:10px 12px;color:#8b9ab0;font-size:13px}
`;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const load = () => { try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  const save = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} };
  const day = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const left = () => load().filter((x) => !x.done).length;

  function label() {
    const b = document.querySelector('.cl-btn span');
    if (b) { const n = left(); b.textContent = n ? n + ' still to do' : 'Your to-do list'; }
  }

  function draw(scr) {
    const all = load(), todo = all.filter((x) => !x.done), done = all.filter((x) => x.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
    const row = (x) => '<div class="cl-row' + (x.done ? ' done' : '') + '"><input type="checkbox" data-id="' + esc(x.id) + '"' + (x.done ? ' checked' : '') +
      ' title="' + (x.done ? 'Not done after all' : 'Tick when done') + '"><span class="t">' + esc(x.text) + '</span><span class="d">' +
      (x.done ? 'done ' + day(x.doneAt) : 'added ' + day(x.added)) + '</span><button type="button" data-rm="' + esc(x.id) + '" title="Remove">✕</button></div>';
    scr.innerHTML = '<div class="cl-in"><div class="cl-top"><b>📋 Captain\'s log</b><span>Saved in this browser only – nothing is sent anywhere.</span></div>' +
      '<form class="cl-add"><input type="text" maxlength="300" placeholder="e.g. Build a Habitat on TRCS CMS" aria-label="New task"><button type="submit">Add</button></form>' +
      '<h3>To do</h3>' + (todo.length ? todo.map(row).join('') : '<div class="cl-none">Nothing to do – add a task above.</div>') +
      (done.length ? '<h3>Done<button type="button" class="cl-clear">Clear done</button></h3>' + done.map(row).join('') : '') + '</div>';

    const inp = scr.querySelector('.cl-add input');
    scr.querySelector('.cl-add').addEventListener('submit', (e) => {
      e.preventDefault();
      const t = inp.value.trim();
      if (!t) return;
      const a = load();
      a.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text: t, added: Date.now(), done: false });
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

  function addPanel(br) {
    const mid = br.querySelector('.brs-mid');
    if (!mid || !mid.querySelector('.brs-chair') || mid.querySelector('.cl-btn')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cl-btn';
    b.title = "Captain's log – your own to-do list, saved in this browser";
    b.innerHTML = "<b>📋 Captain's log</b><span></span>";
    mid.appendChild(b);
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
