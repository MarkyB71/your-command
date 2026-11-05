// Skippy's Command Deck – crew food % (runs on game.influenceth.io, in the page).
// Adds a small food bar beside each crew's name in the game's My Crews list along the bottom of each crew's card.
// Same maths as the game's sdk (getCurrentFoodRatio) and the Command Deck site.
//   bar fades red (50% and under, hungry) -> yellow (75%) -> green (full)
// It only READS what the game has already loaded (no requests of its own), checks every 5 s,
// never clicks or changes anything, and switches itself off quietly if a game update moves things.
(() => {
  if (window.top !== window) return;
  const root = document.documentElement;
  const note = t => { if (root) root.dataset.yicCrewFood = t; };
  const COL = { green: '#57ff65', yellow: '#ffd94f', red: '#ff564d' }; // the game's own colours
  const YEAR = 31536000, ACCEL = 24;

  let qc = null;
  function findQueryClient() {
    let start = null;
    for (const el of document.querySelectorAll('body *')) {
      const k = Object.keys(el).find(k => k.startsWith('__reactFiber$'));
      if (k) { start = el[k]; break; }
    }
    if (!start) return null;
    let f = start; while (f.return) f = f.return;
    const stack = [f]; let n = 0;
    while (stack.length && n < 300000) {
      const x = stack.pop(); n++;
      const p = x.memoizedProps;
      if (p && p.client && typeof p.client.getQueryCache === 'function') return p.client;
      if (x.sibling) stack.push(x.sibling);
      if (x.child) stack.push(x.child);
    }
    return null;
  }

  const foodOf = lastFed => {
    if (!lastFed) return null;
    const ys = Math.max(0, Date.now() / 1000 - lastFed) * ACCEL / YEAR;
    return Math.round(Math.min(Math.max(0, 1 - ys, 0.75 - 0.5 * ys), 1) * 100);
  };
  const nameOf = c => (c.Name && c.Name.name) || ('Crew #' + Number(c.id).toLocaleString('en-US'));

  // name -> food %, from every crew the game has loaded
  function readCrews() {
    if (!qc) qc = findQueryClient();
    if (!qc) return null;
    const out = new Map();
    const take = c => { if (c && c.label === 1 && c.Crew && c.Crew.lastFed) out.set(nameOf(c), foodOf(c.Crew.lastFed)); };
    qc.getQueryCache().getAll().forEach(q => {
      const k = q.queryKey, d = q.state && q.state.data;
      if (!k || (k[0] !== 'entities' && k[0] !== 'entity') || k[1] !== 1 || !d) return;
      Array.isArray(d) ? d.forEach(take) : take(d);
    });
    return out;
  }

  // colour fades red (50% and under, hungry) -> yellow (75%) -> green (100%), using the game's own colours
  const mix = (a, b, t) => '#' + [0, 2, 4].map(i => Math.round(parseInt(a.substr(1 + i, 2), 16) * (1 - t) + parseInt(b.substr(1 + i, 2), 16) * t).toString(16).padStart(2, '0')).join('');
  function colour(pct) {
    const t = Math.min(Math.max((pct - 50) / 50, 0), 1);
    return t < 0.5 ? mix(COL.red, COL.yellow, t * 2) : mix(COL.yellow, COL.green, (t - 0.5) * 2);
  }
  // One strip over the bottom of the crew's card: "Food  [bar]  75%"
  function tag(pct) {
    const c = colour(pct);
    const r = document.createElement('div');
    r.className = 'yic-food';
    r.dataset.pct = pct;
    r.title = 'Food ' + pct + '% (Skippy\'s Command Deck)';
    // laid over the card's bottom edge so it adds no height (a taller card made the crew list scroll inside itself)
    r.style.cssText = 'position:absolute;left:0;right:0;bottom:0;z-index:2;display:flex;align-items:center;gap:8px;box-sizing:border-box;'
      + 'padding:3px 6px;font-size:11px;line-height:1;color:#aaa;letter-spacing:.03em;background:rgba(0,0,0,.6)';
    const l = document.createElement('span');
    l.textContent = 'Food';
    const bar = document.createElement('span');
    bar.style.cssText = 'flex:1;height:5px;border:1px solid rgba(255,255,255,.25);border-radius:3px;background:rgba(0,0,0,.45);overflow:hidden';
    const f = document.createElement('span');
    f.style.cssText = 'display:block;height:100%;width:' + pct + '%;background:' + c + ';box-shadow:0 0 4px ' + c;
    bar.appendChild(f);
    const n = document.createElement('span');
    n.textContent = pct + '%';
    n.style.cssText = 'min-width:32px;text-align:right;font-weight:600;color:' + c;
    r.append(l, bar, n);
    return r;
  }
  // the crew's card = the first box above the name that also holds the crewmate faces
  function cardOf(el) {
    for (let x = el.parentElement, i = 0; x && x !== document.body && i < 8; x = x.parentElement, i++)
      if (x.querySelector('img')) return x;
    return null;
  }

  // the My Crews list = the first box above its "My Crews" heading that also holds a crew name.
  // Only a heading you can see, and never a box as big as the whole screen – otherwise a hidden
  // "My Crews" label could climb up to the game's top-left crew panel and put a bar there.
  function myCrewsPanel(crews) {
    const names = [...crews.keys()];
    const vw = innerWidth, vh = innerHeight;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let t = w.nextNode(); t; t = w.nextNode()) {
      if (!/^my crews$/i.test(t.nodeValue.trim())) continue;
      const h = t.parentElement, hr = h && h.getBoundingClientRect();
      if (!hr || !hr.width || !hr.height) continue;
      for (let x = h.parentElement, i = 0; x && x !== document.body && i < 10; x = x.parentElement, i++) {
        const r = x.getBoundingClientRect();
        if (x.querySelector('canvas') || r.width * r.height > vw * vh * 0.6) break;
        if (names.some(nm => x.textContent.includes(nm))) return x;
      }
    }
    return null;
  }

  function refresh() {
    const crews = readCrews();
    if (!crews) { note('waiting for the game'); return; }
    if (!crews.size) { note('no crews loaded yet'); return; }
    let n = 0;
    // only inside the game's My Crews list – the crew panel at the top left already shows food
    const panel = myCrewsPanel(crews);
    if (!panel) { document.querySelectorAll('.yic-food').forEach(b => b.remove()); note('My Crews list not open'); return; }
    const w = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
    const hits = [];
    for (let t = w.nextNode(); t; t = w.nextNode()) {
      const s = t.nodeValue.trim();
      if (s && crews.has(s) && t.parentElement && !t.parentElement.closest('.yic-food,#yic-dots')) hits.push([t.parentElement, crews.get(s)]);
    }
    // tidy any bar left outside the list (e.g. the top-left crew panel)
    document.querySelectorAll('.yic-food').forEach(b => { if (!panel.contains(b)) b.remove(); });
    for (const [el, pct] of hits) {
      const card = cardOf(el); if (!card) continue;
      const old = card.querySelector(':scope > .yic-food');
      if (old && old.dataset.pct === String(pct)) { n++; continue; }
      if (old) old.remove();
      if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
      card.appendChild(tag(pct)); n++;
    }
    note(n + ' crews labelled');
  }

  note('starting');
  let waited = 0;
  const go = setInterval(() => {
    const raw = root.dataset.yicOpts;
    if (!raw) { if (++waited > 60) { clearInterval(go); note('options not found'); } return; }
    clearInterval(go);
    let on = true; try { on = JSON.parse(raw).crewFood !== false; } catch (e) {}
    if (!on) { note('switched off in options'); return; }
    const tick = () => { try { refresh(); } catch (e) { note('paused – ' + e.message); } };
    tick(); setInterval(tick, 5000);
  }, 1000);
})();
