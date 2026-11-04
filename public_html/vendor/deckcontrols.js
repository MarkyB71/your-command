// Deck controls – the Command Deck extension's settings, on the Bridge (Mark, 4 Nov 2026).
// A holo-panel hangs above the captain's chair; clicking it puts the extension's settings on the
// viewscreen. Settings stay saved INSIDE the extension (so it still works if the site is down) –
// the site only asks the extension for them and sends changes back (needs extension 0.6.3+).
// Test only for now (?beta=1). Skippy (welcome) and the chair (today's workload) keep their clicks.
(function () {
  if (!/[?&]beta=1/.test(location.search)) return;

  const CSS = `
.dc-holo{all:unset;box-sizing:border-box;cursor:pointer;position:relative;display:flex;align-items:center;gap:10px;margin:0 auto 18px;padding:7px 12px;border:1px solid #8fe3ff;border-radius:6px;background:rgba(16,26,38,.92);box-shadow:0 0 14px -4px rgba(143,227,255,.6),inset 0 0 16px -8px #8fe3ff;transition:box-shadow .2s,transform .2s;animation:dcHover 4s ease-in-out infinite}
.dc-holo::after{content:'';position:absolute;left:50%;top:100%;width:56%;height:18px;transform:translateX(-50%);background:linear-gradient(180deg,rgba(143,227,255,.18),transparent);clip-path:polygon(30% 0,70% 0,100% 100%,0 100%);pointer-events:none}
.dc-holo:hover,.dc-holo:focus-visible,.dc-holo.on{box-shadow:0 0 22px -2px rgba(143,227,255,.9),inset 0 0 20px -6px #8fe3ff}
.dc-led{display:grid;grid-template-columns:repeat(3,7px);gap:3px}
.dc-led i{height:5px;border-radius:1px}
.dc-led i:nth-child(1){background:#3fd68a}.dc-led i:nth-child(2){background:#e8645a}.dc-led i:nth-child(3){background:#4f90ff}
.dc-led i:nth-child(4){grid-column:1/-1;background:#9a6bff;opacity:.8}
.dc-holo b{font:700 10px/1.25 system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#8fe3ff;text-shadow:0 0 8px rgba(143,227,255,.6);text-align:left}
@keyframes dcHover{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.dc-scr{position:relative;height:clamp(320px,52vh,600px);overflow:auto;padding:30px 16px 14px;clip-path:polygon(3% 0,97% 0,100% 12%,100% 100%,0 100%,0 12%);background:repeating-linear-gradient(0deg,rgba(143,227,255,.03) 0 1px,transparent 1px 3px),radial-gradient(ellipse at 50% 0,#0d1825,#05080d 75%);font-size:13px;color:#c4cdd9;scrollbar-color:#2c3a4c transparent}
.dc-in{max-width:640px;margin:0 auto}
.dc-scr h3{margin:16px 0 6px;font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#4fb3ff}
.dc-row{display:flex;gap:12px;align-items:flex-start;padding:9px 12px;margin:0 0 6px;border:1px solid #1e2a3a;border-radius:8px;background:#0c1320;cursor:pointer}
.dc-row:hover{border-color:#4fb3ff}
.dc-row input[type=checkbox]{width:18px;height:18px;margin:1px 0 0;accent-color:#4fb3ff;flex:none}
.dc-row b{display:block;color:#fff;font-weight:600}
.dc-row span{color:#9fb0c4;font-size:12px}
.dc-cols{display:flex;flex-wrap:wrap;gap:14px;margin-top:6px}
.dc-cols label{display:flex;align-items:center;gap:6px;color:#c3d2e2}
.dc-cols input[type=color]{width:26px;height:20px;padding:0;border:1px solid #2a3a50;background:none;cursor:pointer}
.dc-tags{padding:10px 12px;border:1px solid #1e2a3a;border-radius:8px;background:#0a101b}
.dc-t{display:flex;gap:8px;align-items:center;margin:0 0 5px}
.dc-t .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#e6ebf2}
.dc-t select,.dc-t button{font:inherit;font-size:12px;background:#0d2933;color:#fff;border:1px solid #2a3a50;border-radius:5px;padding:3px 6px;cursor:pointer}
.dc-t button:hover{border-color:#ff564d}
.dc-msg{padding:14px;border:1px solid #2a3646;border-radius:8px;background:#0c1320;line-height:1.5}
.dc-msg a{color:#4fb3ff}
.dc-ok{color:#3fd68a;font-weight:600;margin-left:8px}
@media (prefers-reduced-motion:reduce){.dc-holo{animation:none;transition:none}}
`;

  // Same list and wording as the extension's own Options page (extension/options.html).
  const OPTS = [
    ['In the game'],
    ['statusDots', 'Building status dots', 'A tiny dot beside each of your buildings on the asteroid view: green ready, yellow under 3 hours left, red busy.'],
    ['crewFood', 'Crew food %', "A food bar on each crew's card in My Crews."],
    ['shipProp', 'Ship propellant %', 'A propellant bar on each ship in My Assets › Ships.'],
    ['lotColours', 'Keep lot colours on', 'Switches on Building Categories colours each time the game loads.'],
    ['hideUsedDeposits', 'Hide used deposits', 'Only untouched core samples show when you pick one to extract from.'],
    ['autoSample', 'Auto-pick core sample', 'The top sample is picked for you. You still press Extract yourself.'],
    ['sideButton', 'Command Deck button in the game', "The crowned S at the bottom of the game's side bar."],
    ['System map'],
    ['mapTags', 'Friend / foe tags', "Click an asteroid on the belt map to tag its owner. All of that owner's asteroids get a coloured ring.", true],
    ['mapMarkets', 'Open marketplaces', 'A small green diamond on each asteroid with open market orders (updates every 5 minutes).'],
  ];
  const TAGS = { friendly: 'Friendly', neutral: 'Neutral', hostile: 'Hostile' };

  let on = false, data = null, waiting = null;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const send = (msg) => window.postMessage(msg, location.origin);

  // Replies from the extension (site.js, 0.6.3+)
  window.addEventListener('message', (e) => {
    if (e.source !== window || e.origin !== location.origin) return;
    const d = e.data;
    if (!d || d.type !== 'yic-opts') return;
    data = { opts: d.opts || {}, tags: d.tags || {} };
    if (waiting) { clearTimeout(waiting); waiting = null; }
    const scr = document.querySelector('.dc-scr');
    if (scr) draw(scr);
  });

  function ask() {
    data = null;
    send({ type: 'yic-opts-get' });
    clearTimeout(waiting);
    waiting = setTimeout(() => { waiting = null; const scr = document.querySelector('.dc-scr'); if (scr) draw(scr); }, 1200);
  }

  function saved() {
    const s = document.querySelector('.dc-ok');
    if (!s) return;
    s.textContent = 'Saved';
    clearTimeout(s._t);
    s._t = setTimeout(() => (s.textContent = ''), 1500);
  }

  function draw(scr) {
    const ver = document.documentElement.dataset.yicGameExt;
    let h = '<div class="dc-in">';
    if (!ver) {
      h += '<div class="dc-msg"><b>Skippy\'s Command Deck isn\'t installed in this browser.</b><br>These are its settings – install it from the Chrome Web Store with the Command Deck button at the top of the page, then come back here.</div>';
    } else if (!data && waiting) {
      h += '<div class="dc-msg">Asking the extension for its settings…</div>';
    } else if (!data) {
      h += '<div class="dc-msg"><b>Your extension (version ' + esc(ver) + ') can\'t show its settings here yet.</b><br>This arrives in the next extension update. Until then, right-click the crowned-S icon in your toolbar and choose Options.</div>';
    } else {
      const o = data.opts;
      h += '<div style="color:#8b9ab0">Choose which game tweaks you want. Saved in the extension in this browser.<span class="dc-ok"></span></div>';
      OPTS.forEach((r) => {
        if (r.length === 1) { h += '<h3>' + r[0] + '</h3>'; return; }
        h += '<label class="dc-row"><input type="checkbox" data-k="' + r[0] + '"' + (o[r[0]] !== false ? ' checked' : '') + '><span><b>' + r[1] + '</b>' + r[2];
        if (r[3]) h += '<span class="dc-cols">' + Object.keys(TAGS).map((t) => '<label><input type="color" data-k="tagCol_' + t + '" value="' + esc(o['tagCol_' + t] || '#ffffff') + '"> ' + TAGS[t] + '</label>').join('') + '</span>';
        h += '</span></label>';
      });
      const ids = Object.keys(data.tags).filter((id) => data.tags[id] && (data.tags[id].tag || data.tags[id].name));
      h += '<h3>Your tagged players</h3><div class="dc-tags">';
      if (!ids.length) h += '<span>No one tagged yet. Click an asteroid on the game\'s belt map to tag its owner.</span>';
      ids.sort((a, b) => String(data.tags[a].name || a).localeCompare(String(data.tags[b].name || b))).forEach((id) => {
        const t = data.tags[id] || {};
        h += '<div class="dc-t"><span class="n" title="' + esc(id) + '">' + esc(t.name || id) + '</span><select data-id="' + esc(id) + '">' +
          Object.keys(TAGS).map((k) => '<option value="' + k + '"' + (t.tag === k ? ' selected' : '') + '>' + TAGS[k] + '</option>').join('') +
          '</select><button type="button" data-rm="' + esc(id) + '" title="Remove this tag">✕</button></div>';
      });
      h += '</div>';
    }
    scr.innerHTML = h + '</div>';
    scr.querySelectorAll('input[data-k]').forEach((i) =>
      i.addEventListener('change', () => {
        const v = i.type === 'checkbox' ? i.checked : i.value;
        data.opts[i.dataset.k] = v;
        send({ type: 'yic-opts-set', key: i.dataset.k, value: v });
        saved();
      }),
    );
    const putTags = () => { send({ type: 'yic-tags-set', tags: data.tags }); saved(); };
    scr.querySelectorAll('select[data-id]').forEach((s) =>
      s.addEventListener('change', () => { data.tags[s.dataset.id] = Object.assign({}, data.tags[s.dataset.id], { tag: s.value }); putTags(); }),
    );
    scr.querySelectorAll('button[data-rm]').forEach((b) =>
      b.addEventListener('click', () => { delete data.tags[b.dataset.rm]; putTags(); draw(scr); }),
    );
  }

  function setOn(br, want) {
    const vs = br.querySelector('.brs-vs'),
      plate = vs && vs.querySelector('.brs-plate'),
      holo = br.querySelector('.dc-holo');
    if (!vs || !plate) return;
    let scr = vs.querySelector('.dc-scr');
    const map = vs.querySelector(':scope > div:not(.brs-plate):not(.brs-log):not(.dc-scr)');
    if (!want) {
      on = false;
      if (scr) scr.remove();
      if (map && !vs.querySelector('.brs-log')) map.style.display = '';
      if (!vs.querySelector('.brs-log')) plate.textContent = 'VIEWSCREEN';
      if (holo) holo.classList.remove('on');
      return;
    }
    const chair = br.querySelector('.brs-chair');
    if (vs.querySelector('.brs-log') && chair) chair.click(); // close today's workload first
    on = true;
    if (!scr) {
      scr = document.createElement('div');
      scr.className = 'dc-scr';
      vs.insertBefore(scr, plate);
    }
    if (map) map.style.display = 'none';
    plate.textContent = 'DECK CONTROLS';
    if (holo) holo.classList.add('on');
    ask();
    draw(scr);
  }

  function addPanel(br) {
    const mid = br.querySelector('.brs-mid'),
      chair = mid && mid.querySelector('.brs-chair');
    if (!chair || mid.querySelector('.dc-holo')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dc-holo';
    b.title = "Deck controls – the Command Deck extension's settings";
    b.innerHTML = '<span class="dc-led" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b>Deck<br>controls</b>';
    mid.insertBefore(b, chair);
    b.addEventListener('click', () => setOn(br, !on));
    // The chair (today's workload) takes the viewscreen back from the controls. Skippy's own click stops before this.
    chair.addEventListener('click', (e) => { if (on && !(e.target.closest && e.target.closest('.brs-sk'))) setOn(br, false); }, true);
    if (on) setOn(br, true);
  }

  if (!document.getElementById('dc-css')) {
    const st = document.createElement('style');
    st.id = 'dc-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  // The Bridge is redrawn when data refreshes – put the panel back each time.
  new MutationObserver(() => {
    const br = document.querySelector('.brs');
    if (br && !br.querySelector('.dc-holo')) addPanel(br);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
