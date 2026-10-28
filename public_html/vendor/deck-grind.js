/* The Daily Grind – Skippy's Command Deck (TEST on ?beta=1, 28 Oct 2026)
   A deck for the everyday workload. Its viewscreen shows a duty board: one card per
   routine check (Fuel check first), with empty slots for the routines still to come.
   Click a card → opens that check on the viewscreen. Below it a teal console (body.dk-grind). */
(function () {
  'use strict';
  if (!window.YICDECKS || !/[?&]beta=1/.test(location.search)) return;
  const COL = '#36d6c3';
  // routines on the board – add a row here for each new check (page letter, name, what it does)
  const JOBS = [
    ['G', 'Fuel check', 'Extractors have samples waiting for the fuel raws'],
  ];
  const SLOTS = 3; // empty "coming soon" slots shown after the real ones
  const CSS = `
body.dk-grind #main{border:1px solid rgba(54,214,195,.3);border-top:3px solid ${COL};border-radius:0 0 14px 14px;background:linear-gradient(180deg,rgba(54,214,195,.05),rgba(5,7,10,0) 220px),#060b0b;box-shadow:inset 0 0 40px -18px ${COL},0 0 26px -14px ${COL};margin:0 16px 20px!important}
#deckhero[data-deck="grind"]{position:relative;padding:34px 16px 6px;background:linear-gradient(180deg,#0e1c1b,#060b0b)}
.dg-plate{position:absolute;left:50%;top:0;transform:translateX(-50%);padding:3px 24px 4px;background:#060b0b;clip-path:polygon(0 0,100% 0,92% 100%,8% 100%);font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.4em;color:#9ff3e8;text-shadow:0 0 8px rgba(54,214,195,.8);white-space:nowrap}
.dg-board{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;max-width:980px;margin:0 auto}
.dg-job{all:unset;box-sizing:border-box;cursor:pointer;display:block;padding:12px 14px;border-radius:8px;background:#0a1414;border:1px solid #21403c;border-left:4px solid ${COL};box-shadow:0 0 14px -8px ${COL}}
.dg-job:hover,.dg-job:focus-visible{box-shadow:0 0 18px -4px ${COL};background:#0d1a1a}
.dg-job b{display:block;font:700 15px/1.2 system-ui,sans-serif;color:#9ff3e8}
.dg-job span{display:block;margin-top:5px;font-size:12.5px;color:#8b9ab0}
.dg-job i{display:block;margin-top:8px;font:700 10px/1 system-ui,sans-serif;font-style:normal;letter-spacing:.2em;text-transform:uppercase;color:${COL}}
.dg-slot{padding:12px 14px;border-radius:8px;border:1px dashed #21403c;color:#4a5f5c;font:600 11px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.15em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;min-height:84px}
`;
  const addCss = () => {
    if (document.getElementById('dg-css')) return;
    const st = document.createElement('style');
    st.id = 'dg-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  };
  window.YICDECKHERO = window.YICDECKHERO || {};
  window.YICDECKHERO.grind = (el) => {
    addCss();
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    el.innerHTML =
      '<span class="dg-plate">DUTY BOARD</span><div class="dg-board">' +
      JOBS.map((j) => '<button type="button" class="dg-job" data-pg="' + j[0] + '"><b>' + esc(j[1]) + '</b><span>' + esc(j[2]) + '</span><i>Open ▸</i></button>').join('') +
      Array.from({ length: SLOTS }, () => '<div class="dg-slot">Routine slot · coming</div>').join('') +
      '</div>';
    el.addEventListener('click', (e) => {
      const j = e.target.closest('.dg-job');
      if (!j) return;
      // same as clicking that page's console in the room, so it opens on the viewscreen
      const st = document.querySelector('#deckroom .dkr-st[data-pg="' + j.dataset.pg + '"]');
      if (st) st.click();
    });
  };
  addCss();
})();
