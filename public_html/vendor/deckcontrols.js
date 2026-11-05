// Deck controls – the Command Deck extension's settings, on the Bridge (Mark, 4 Nov 2026).
// A holo-panel hangs above the captain's chair; clicking it puts the extension's settings on the
// viewscreen. Settings stay saved INSIDE the extension (so it still works if the site is down) –
// the site only asks the extension for them and sends changes back (needs extension 0.6.3+).
// LIVE 5 Nov 2026 (tested on ?beta=1, once extension 0.6.3 was approved). Skippy (welcome) and the chair (today's workload) keep their clicks.
(function () {

  const CSS = `
.dc-holo{all:unset;box-sizing:border-box;cursor:pointer;position:relative;display:grid;grid-template-columns:auto auto;align-items:center;gap:12px;margin:0 auto 34px;padding:10px 14px;border:1.5px solid #8fe3ff;border-radius:7px;background:#101a26;box-shadow:0 0 14px -4px rgba(143,227,255,.6);transition:box-shadow .2s}
.dc-holo::after{content:'';position:absolute;left:50%;top:calc(100% + 1px);width:130%;height:32px;transform:translateX(-50%);background:linear-gradient(180deg,rgba(143,227,255,.16),rgba(143,227,255,.03));clip-path:polygon(38% 0,62% 0,100% 100%,0 100%);pointer-events:none}
.dc-holo:hover,.dc-holo:focus-visible,.dc-holo.on{box-shadow:0 0 22px -2px rgba(143,227,255,.9)}
.dc-led{display:grid;grid-template-columns:repeat(3,10px);gap:4px}
.dc-led i{height:6px;border-radius:1px}
.dc-led i:nth-child(1){background:#3fd68a}.dc-led i:nth-child(2){background:#e8645a}.dc-led i:nth-child(3){background:#4f90ff}
.dc-led i:nth-child(4){grid-column:1/-1;height:5px;background:#9a6bff;opacity:.85}
.dc-holo b{font:700 11px/1.3 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#8fe3ff;text-align:center}
.dc-scr{position:relative;height:clamp(320px,52vh,600px);overflow:auto;padding:34px 16px 16px;clip-path:polygon(3% 0,97% 0,100% 12%,100% 100%,0 100%,0 12%);background:repeating-linear-gradient(0deg,rgba(143,227,255,.03) 0 1px,transparent 1px 3px),radial-gradient(ellipse at 50% 0,#0d1825,#05080d 75%);font-size:13px;line-height:1.45;color:#c4cdd9;scrollbar-color:#2c3a4c transparent}
.dc-scr *{box-sizing:border-box}
.dc-scr input,.dc-scr select,.dc-scr button{min-width:0;max-width:none;flex:none;margin:0}
.dc-in{max-width:620px;margin:0 auto}
.dc-top{display:flex;align-items:center;gap:12px;padding:12px 14px;margin:0 0 4px;border:1px solid #2a3646;border-left:3px solid #8fe3ff;border-radius:0}
.dc-top .s{display:grid;place-items:center;width:34px;height:34px;flex:none;border-radius:8px;background:#0d2933;color:#ffd24a;font:700 18px/1 system-ui,sans-serif}
.dc-top b{display:block;color:#fff;font-size:14px}
.dc-top span{display:block;color:#8b9ab0;font-size:12px}
.dc-ok{margin-left:auto;color:#3fd68a;font-weight:600;white-space:nowrap}
.dc-scr h3{margin:18px 0 6px;font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#4fb3ff}
.dc-row{padding:10px 12px;margin:0 0 6px;border:1px solid #1e2a3a;border-radius:8px;background:#0c1320}
.dc-row:hover{border-color:#4fb3ff}
.dc-row>label{display:grid;grid-template-columns:18px minmax(0,1fr);gap:12px;align-items:start;cursor:pointer}
.dc-row input[type=checkbox]{width:18px;height:18px;padding:0;margin-top:1px;accent-color:#4fb3ff}
.dc-row b{display:block;color:#fff;font-weight:600}
.dc-row label span{display:block;color:#9fb0c4;font-size:12px}
.dc-cols{display:flex;flex-wrap:wrap;gap:16px;margin:8px 0 0 30px}
.dc-cols label{display:flex;align-items:center;gap:6px;font-size:12px;color:#c3d2e2;cursor:pointer}
.dc-cols input[type=color]{width:28px;height:20px;padding:0;border:1px solid #2a3a50;border-radius:4px;background:none;cursor:pointer}
.dc-tags{padding:8px 12px;border:1px solid #1e2a3a;border-radius:8px;background:#0a101b}
.dc-t{display:grid;grid-template-columns:minmax(0,1fr) 110px 30px;gap:8px;align-items:center;padding:4px 0}
.dc-t .n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#e6ebf2}
.dc-t select,.dc-t button{width:100%;height:28px;font:inherit;font-size:12px;background:#0d2933;color:#fff;border:1px solid #2a3a50;border-radius:5px;padding:0 6px;cursor:pointer}
.dc-t button:hover{border-color:#ff564d}
.dc-msg{padding:14px;border:1px solid #2a3646;border-radius:8px;background:#0c1320;margin-top:10px}
.dc-get{display:inline-block;margin-top:10px;padding:7px 14px;border:1px solid #8fe3ff;border-radius:6px;color:#8fe3ff;text-decoration:none;font-weight:600}
.dc-get:hover{background:rgba(143,227,255,.12)}
@media (prefers-reduced-motion:reduce){.dc-holo{transition:none}}
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
    let h = '<div class="dc-in"><div class="dc-top"><span class="s" aria-hidden="true">S</span><div><b>Skippy\'s Command Deck – browser extension</b><span>These are the extension\'s own settings' + (ver ? ' (version ' + esc(ver) + ')' : '') + '. They\'re saved in the extension in this browser.</span></div><span class="dc-ok"></span></div>';
    if (!ver) {
      h += '<div class="dc-msg"><b>Skippy\'s Command Deck isn\'t installed in this browser.</b><br>These are its settings – install it from the Chrome Web Store, then come back here.<br><a class="dc-get" href="https://chromewebstore.google.com/detail/pbiobnkpgohjcpednldpopbkedlhgpcd" target="_blank" rel="noopener">Get it from the Chrome Web Store</a></div>';
    } else if (!data && waiting) {
      h += '<div class="dc-msg">Asking the extension for its settings…</div>';
    } else if (!data) {
      h += '<div class="dc-msg"><b>Your extension (version ' + esc(ver) + ') can\'t show its settings here yet.</b><br>This arrives in the next extension update. Until then, right-click the crowned-S icon in your toolbar and choose Options.</div>';
    } else {
      const o = data.opts;
      OPTS.forEach((r) => {
        if (r.length === 1) { h += '<h3>' + r[0] + '</h3>'; return; }
        h += '<div class="dc-row"><label><input type="checkbox" data-k="' + r[0] + '"' + (o[r[0]] !== false ? ' checked' : '') + '><span><b>' + r[1] + '</b>' + r[2] + '</span></label>';
        if (r[3]) h += '<div class="dc-cols">' + Object.keys(TAGS).map((t) => '<label><input type="color" data-k="tagCol_' + t + '" value="' + esc(o['tagCol_' + t] || '#ffffff') + '">' + TAGS[t] + ' ring</label>').join('') + '</div>';
        h += '</div>';
      });
      const ids = Object.keys(data.tags).filter((id) => data.tags[id] && (data.tags[id].tag || data.tags[id].name));
      h += '<h3>Your tagged players</h3><div class="dc-tags">';
      if (!ids.length) h += '<span>No one tagged yet. Click an asteroid on the game\'s belt map to tag its owner.</span>';
      ids.sort((a, b) => String(data.tags[a].name || a).localeCompare(String(data.tags[b].name || b))).forEach((id) => {
        const t = data.tags[id] || {};
        h += '<div class="dc-t"><span class="n" title="' + esc(id) + '">' + esc(t.name || id.slice(0, 6) + '…' + id.slice(-4)) + '</span><select data-id="' + esc(id) + '">' +
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
    // Keep the viewscreen the same size as the map, so it doesn't jump when the controls open (Mark, 4 Nov).
    // The controls scroll inside it if they don't fit.
    const h = map && map.style.display !== 'none' ? map.offsetHeight : 0;
    if (h > 0) scr.style.height = h + 'px';
    if (map) map.style.display = 'none';
    plate.textContent = 'DECK CONTROLS · EXTENSION';
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
    b.title = "Deck controls – settings for Skippy's Command Deck browser extension";
    b.innerHTML = '<span class="dc-led" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b>Deck<br>controls</b>';
    mid.insertBefore(b, chair);
    b.addEventListener('click', () => setOn(br, !on));
    // The chair (today's workload) takes the viewscreen back from the controls. Skippy's own click stops before this.
    chair.addEventListener('click', (e) => { if (on && !(e.target.closest && e.target.closest('.brs-sk'))) setOn(br, false); }, true);
    if (on) setOn(br, true);
  }

  // The Bridge is redrawn when data refreshes – put the panel back each time.
  const check = () => {
    // The site rebuilds <head> as it starts, so (re)add our styles whenever they are missing.
    if (!document.getElementById('dc-css') && document.head) {
      const st = document.createElement('style');
      st.id = 'dc-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    const br = document.querySelector('.brs');
    if (br && !br.querySelector('.dc-holo')) addPanel(br);
  };
  new MutationObserver(check).observe(document.documentElement, { childList: true, subtree: true });
  check();
})();
