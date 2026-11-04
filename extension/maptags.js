// Skippy's Command Deck – friend / foe tags on the system map (runs on game.influenceth.io, in the page).
// Click an asteroid on the belt map and a small box lets you tag its OWNER as friendly, neutral or
// hostile (and give them a name). Every asteroid that owner has on the map then gets a coloured ring.
// Tags follow the owner: if a rock is sold, its ring follows the new owner.
// Tags are kept in this browser only (the extension's own storage, so the options page can list, share
// and clear them – game.js passes them back and forth). It only READS what the game has
// already loaded (no requests of its own), never clicks or changes anything in the game, and stops
// quietly if a game update moves things. Can be switched off in the extension's options.
// Also marks asteroids with open marketplaces (a small diamond), from the Command Deck's belt-wide market
// list (your-command.adalia.academy, refreshed every 5 minutes – game.js fetches it via the background).
(() => {
  if (window.top !== window) return;
  const root = document.documentElement;
  const note = t => { if (root) root.dataset.yicMapTags = t; };

  // ---- 1. The order of the dots on the map ---------------------------------------------------
  // The game hands its list of map asteroids to a helper (web worker) to work out where they are,
  // as a list of ids. The dots on the map are in that same order, so we keep a copy of the list.
  // (Has to be here at page start, before the game sends it.)
  let order = [];
  try {
    const send = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (msg, ...rest) {
      try {
        if (msg && msg.topic === 'updateAsteroidPositions' && msg.asteroids && typeof msg.asteroids.key === 'string') {
          order = msg.asteroids.key.split(',').map(Number);
        }
      } catch (e) {}
      return send.call(this, msg, ...rest);
    };
  } catch (e) {}

  // ---- settings ---------------------------------------------------------------------------
  const TAGS = ['friendly', 'neutral', 'hostile'];
  const LABEL = { friendly: 'Friendly', neutral: 'Neutral', hostile: 'Hostile' };
  // The game's own green, yellow and red (theme.js) – can be changed in the extension's options.
  let COL = { friendly: '#88e675', neutral: '#ffd94f', hostile: '#ff564d' };
  const KEY = 'yicMapTags';
  const std = a => { try { return '0x' + BigInt(a).toString(16); } catch (e) { return null; } };
  const short = a => a ? a.slice(0, 6) + '…' + a.slice(-4) : '';
  let tags = {}; // owner address -> { tag, name }
  let tagsOn = true;
  let hidden = false; try { hidden = localStorage.getItem(KEY + 'Hidden') === '1'; } catch (e) {}
  // Tags live in the extension's storage; game.js sends them in here and saves what we send out.
  const save = () => { window.postMessage({ yic: 'tags-save', tags }, location.origin); dirty = true; };
  window.addEventListener('message', e => {
    if (e.source !== window || !e.data || e.data.yic !== 'tags' || typeof e.data.tags !== 'object') return;
    tags = e.data.tags || {};
    // first time: move any tags saved by the first test build (game site's own storage) across
    try {
      const old = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (old && typeof old === 'object') {
        localStorage.removeItem(KEY);
        let added = false;
        for (const a in old) if (!tags[a]) { tags[a] = old[a]; added = true; }
        if (added) save();
      }
    } catch (err) {}
    dirty = true; showPill();
    if (shownId) showBox(shownId);
  });
  // Open marketplaces per asteroid: id -> [[marketplace name, for sale, buy orders], ...]
  let markets = new Map(), marketsOn = false, mktHidden = false, mktFetched = 0;
  try { mktHidden = localStorage.getItem(KEY + 'MktHidden') === '1'; } catch (e) {}
  const MKT = '#57ff65'; // the game's own Trade colour (Filter Lots › Building Categories)
  window.addEventListener('message', e => {
    if (e.source !== window || !e.data || e.data.yic !== 'markets' || !e.data.data || typeof e.data.data !== 'object') return;
    const m = new Map();
    for (const k in e.data.data) if (Array.isArray(e.data.data[k])) m.set(Number(k), e.data.data[k]);
    markets = m; mktFetched = e.data.fetched || 0; dirty = true; showPill();
    if (shownId) showBox(shownId);
  });
  const mktLine = list => {
    let s = 0, b = 0; list.forEach(x => { s += x[1] || 0; b += x[2] || 0; });
    return list.length + ' marketplace' + (list.length === 1 ? '' : 's') + ' · ' + s + ' for sale · ' + b + ' buy order' + (b === 1 ? '' : 's');
  };
  const rgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

  // ---- 2. Asteroid names and owners, from what the game has already loaded --------------------
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
  let info = new Map(); // asteroid id -> { name, owner }
  function readAsteroids() {
    if (!qc) qc = findQueryClient();
    if (!qc) return;
    const out = new Map();
    const take = a => {
      if (!a || typeof a !== 'object' || !a.Celestial || !a.id) return;
      const owner = a.Nft && a.Nft.owner ? std(a.Nft.owner) : null;
      const name = (a.Name && a.Name.name) || '';
      const old = out.get(Number(a.id));
      out.set(Number(a.id), { name: name || (old && old.name) || '', owner: owner || (old && old.owner) || null, known: true });
    };
    qc.getQueryCache().getAll().forEach(q => {
      const d = q.state && q.state.data;
      if (!d) return;
      if (Array.isArray(d)) d.forEach(take);
      else if (Array.isArray(d.hits)) d.hits.forEach(take);
      else take(d);
    });
    info = out; dirty = true;
  }

  // ---- 3. The game's map dots, and our rings on top -------------------------------------------
  let store = null;
  function gamePoints(scene) {
    let pts = null;
    scene.traverse(o => {
      if (!pts && o.isPoints && o !== rings && o !== diamonds && o.geometry && o.geometry.attributes && o.geometry.attributes.highlightColor) pts = o;
    });
    return pts;
  }
  let rings = null, diamonds = null, dirty = true, lastPos = null;
  const RING_VERT = `
    attribute vec3 highlightColor;
    varying vec3 vColor;
    void main() {
      vColor = highlightColor;
      gl_PointSize = SIZE;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;
  const RING_FRAG = `
    varying vec3 vColor;
    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5 || d < 0.32) discard;
      gl_FragColor = vec4(vColor, 1.0);
    }`;
  // Marketplace diamond: a bold outline with a faint glow inside, bigger than the tag rings so it stands out.
  // Sizes are in screen points; multiplied by the screen's pixel ratio (Retina / high-res screens
  // have 2 pixels per point, so without this everything came out half size).
  const RING_PT = 14, DIA_PT = 16;
  const DIA_FRAG = `
    varying vec3 vColor;
    void main() {
      vec2 c = abs(gl_PointCoord - vec2(0.5));
      float d = c.x + c.y;
      if (d > 0.5) discard;
      float a = d > 0.36 ? 1.0 : 0.22;
      gl_FragColor = vec4(vColor, a);
    }`;
  function makeRings(pts, vert, frag, name) {
    const geom = new pts.geometry.constructor();
    const mat = pts.material.clone();
    const dpr = (store && store.getState().gl && store.getState().gl.getPixelRatio && store.getState().gl.getPixelRatio()) || window.devicePixelRatio || 1;
    const size = ((vert === 'dia' ? DIA_PT : RING_PT) * dpr).toFixed(1);
    mat.vertexShader = RING_VERT.replace('SIZE', size); mat.fragmentShader = frag || RING_FRAG; mat.uniforms = {};
    mat.depthWrite = false; mat.transparent = true; mat.needsUpdate = true;
    const r = new pts.constructor(geom, mat);
    r.name = name || 'yic-map-tags';
    r.raycast = () => {};      // never gets in the way of your clicks
    r.frustumCulled = false;
    r.renderOrder = 10;
    return r;
  }
  function updateRings() {
    if (!store) store = window.__yicR3f || null;
    if (!store) return;
    const st = store.getState();
    const pts = gamePoints(st.scene);
    if (!pts) { if (rings) rings.visible = false; if (diamonds) diamonds.visible = false; note('waiting for the belt map'); return; }
    if (!rings) rings = makeRings(pts);
    if (!diamonds) diamonds = makeRings(pts, 'dia', DIA_FRAG, 'yic-map-markets');
    for (const o of [rings, diamonds]) if (o.parent !== pts.parent) { if (o.parent) o.parent.remove(o); pts.parent.add(o); dirty = true; }
    // Only on the zoomed-out belt map (the game dims its dots when you're at an asteroid).
    const u = pts.material.uniforms && pts.material.uniforms.uOpacity;
    const out = !u || u.value >= 1;
    const pos = pts.geometry.attributes.position.array;
    showPill(out && pts.visible);
    if (!out || !pts.visible || order.length * 3 !== pos.length) { rings.visible = false; diamonds.visible = false; return; }
    if (!dirty && lastPos === pos && pts.geometry.attributes.position.version === rings.userData.v) {
      rings.visible = tagsOn && !hidden && rings.userData.n > 0;
      diamonds.visible = marketsOn && !mktHidden && diamonds.userData.n > 0;
      return;
    }
    const P = [], C = [], MP = [], MC = [], mc = rgb(MKT);
    let n = 0, m = 0;
    for (let i = 0; i < order.length; i++) {
      const id = order[i];
      if (marketsOn && markets.has(id)) { MP.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); MC.push(...mc); m++; }
      if (!tagsOn) continue;
      const a = info.get(id); if (!a || !a.owner) continue;
      const t = tags[a.owner]; if (!t || !COL[t.tag]) continue;
      P.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      C.push(...rgb(COL[t.tag])); n++;
    }
    const A = pts.geometry.attributes.position.constructor;
    const fill = (o, p, c, k) => {
      o.geometry.setAttribute('position', new A(new Float32Array(p), 3));
      o.geometry.setAttribute('highlightColor', new A(new Float32Array(c), 3));
      o.geometry.computeBoundingSphere();
      o.userData.n = k;
    };
    fill(rings, P, C, n); fill(diamonds, MP, MC, m);
    rings.visible = tagsOn && !hidden && n > 0;
    diamonds.visible = marketsOn && !mktHidden && m > 0;
    rings.userData.v = pts.geometry.attributes.position.version;
    lastPos = pos; dirty = false;
    note(n + ' tagged, ' + m + ' with marketplaces on the map');
  }

  // ---- 4. Click an asteroid → tag box -------------------------------------------------------
  // Works out which dot you clicked the same way the game does (its own raycaster), then shows the box.
  let host = null, box = null, shownId = null;
  function makeBox() {
    host = document.createElement('div');
    host.id = 'yic-map-tags';
    host.style.cssText = 'position:fixed;top:76px;left:50%;transform:translateX(-50%);z-index:2147483000;display:none';
    const sh = host.attachShadow({ mode: 'closed' });
    sh.innerHTML = `<style>
      .b{font:13px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;color:#d7e6f5;background:rgba(8,14,24,.92);
        border:1px solid #36a7cd;box-shadow:0 0 10px rgba(54,167,205,.45);padding:10px 12px;min-width:260px;
        clip-path:polygon(0 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%)}
      .t{display:flex;justify-content:space-between;align-items:center;gap:10px;color:#fff;font-weight:600}
      .x{cursor:pointer;color:#8b9ab0;background:none;border:0;font-size:16px;padding:0 2px}
      .x:hover{color:#fff}
      .o{color:#9fb0c4;margin:2px 0 8px}
      .r{display:flex;gap:6px;margin-bottom:8px}
      .r button{flex:1;cursor:pointer;font:inherit;padding:4px 6px;background:rgba(255,255,255,.04);color:#d7e6f5;
        border:1px solid #2a3a50}
      .r button.on{color:#000;font-weight:600}
      input{width:100%;box-sizing:border-box;font:inherit;padding:4px 6px;background:#0d2933;color:#fff;border:1px solid #2a3a50}
      .s{font-size:11px;color:#8b9ab0;margin-top:6px}
      .m{margin:0 0 8px;padding:6px 8px;border-left:3px solid ${MKT};background:rgba(87,255,101,.05)}
      .m b{color:#fff;font-weight:600}
      .m ul{margin:4px 0 0;padding-left:16px;max-height:140px;overflow:auto}
      .m li{color:#c3d2e2}
      .m small{display:block;color:#8b9ab0;font-size:11px;margin-top:3px}
    </style><div class="b"><div class="t"><span id="n"></span><button class="x" id="x" title="Close">✕</button></div>
      <div class="o" id="o"></div><div class="m" id="m"></div><div id="tg"><div class="r" id="r"></div>
      <input id="nm" placeholder="Name this player (optional)" maxlength="40">
      <div class="s">Skippy's Command Deck · tags are saved in this browser only</div></div></div>`;
    box = {
      n: sh.getElementById('n'), o: sh.getElementById('o'), tg: sh.getElementById('tg'),
      r: sh.getElementById('r'), nm: sh.getElementById('nm'), m: sh.getElementById('m')
    };
    sh.getElementById('x').addEventListener('click', hideBox);
    // keep your typing out of the game's keyboard shortcuts
    ['keydown', 'keyup', 'keypress'].forEach(t => host.addEventListener(t, e => e.stopPropagation()));
    ['pointerdown', 'pointerup', 'click', 'wheel'].forEach(t => host.addEventListener(t, e => e.stopPropagation()));
    box.nm.addEventListener('input', () => {
      const a = info.get(shownId); if (!a || !a.owner) return;
      const t = tags[a.owner] || (tags[a.owner] = { tag: '', name: '' });
      t.name = box.nm.value.trim();
      if (!t.tag && !t.name) delete tags[a.owner];
      save(); fillOwner(a);
    });
    (document.body || root).appendChild(host);
  }
  function hideBox() { if (host) host.style.display = 'none'; shownId = null; }
  function fillOwner(a) {
    const t = a.owner && tags[a.owner];
    box.o.textContent = !a.owner ? 'Unowned – no one to tag' : 'Owner: ' + ((t && t.name) ? t.name + ' (' + short(a.owner) + ')' : short(a.owner));
  }
  function showBox(id) {
    if (!host || !host.isConnected) makeBox();
    shownId = id;
    const a = info.get(id) || { name: '', owner: null };
    box.n.textContent = (a.name || 'Asteroid') + ' #' + id.toLocaleString();
    fillOwner(a);
    box.tg.style.display = a.owner && tagsOn ? '' : 'none';
    if (!tagsOn) box.o.style.display = 'none';
    const ml = marketsOn && markets.get(id);
    box.m.style.display = ml ? '' : 'none';
    if (ml) {
      box.m.textContent = '';
      const h = document.createElement('b'); h.textContent = '🛒 ' + mktLine(ml); box.m.appendChild(h);
      const ul = document.createElement('ul');
      ml.forEach(x => { const li = document.createElement('li'); li.textContent = (x[0] || 'Marketplace') + ' – ' + (x[1] || 0) + ' for sale, ' + (x[2] || 0) + ' buy'; ul.appendChild(li); });
      box.m.appendChild(ul);
      const sm = document.createElement('small');
      sm.textContent = 'Open orders from the Command Deck' + (mktFetched ? ', as of ' + new Date(mktFetched * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '') + ' (updates every 5 min)';
      box.m.appendChild(sm);
    }
    if (!tagsOn && !ml) { hideBox(); return; }
    const cur = a.owner && tags[a.owner] ? tags[a.owner].tag : '';
    box.nm.value = a.owner && tags[a.owner] ? (tags[a.owner].name || '') : '';
    box.r.textContent = '';
    [...TAGS, ''].forEach(tag => {
      const b = document.createElement('button');
      b.textContent = tag ? LABEL[tag] : 'Clear';
      if (tag) b.style.borderColor = COL[tag];
      if (tag && tag === cur) { b.className = 'on'; b.style.background = COL[tag]; }
      b.addEventListener('click', () => {
        if (!a.owner) return;
        const t = tags[a.owner] || (tags[a.owner] = { tag: '', name: '' });
        t.tag = tag;
        if (!t.tag && !t.name) delete tags[a.owner];
        save(); updateRings(); showBox(id);
      });
      box.r.appendChild(b);
    });
    host.style.display = '';
  }
  // ---- 5. Hover a ringed asteroid → owner's name by the pointer ------------------------------
  let tip = null;
  function showTip(e, id) {
    const a = id && info.get(id), t = tagsOn && !hidden && a && a.owner && tags[a.owner];
    const ml = id && marketsOn && !mktHidden && markets.get(id);
    if ((!t || !t.tag) && !ml) { if (tip) tip.style.display = 'none'; return; }
    if (!tip || !tip.isConnected) {
      tip = document.createElement('div');
      tip.style.cssText = 'position:fixed;z-index:2147483000;pointer-events:none;font:12px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif;'
        + 'color:#fff;background:rgba(8,14,24,.9);padding:3px 7px;border-left:3px solid;white-space:nowrap';
      (document.body || root).appendChild(tip);
    }
    tip.textContent = '';
    if (t && t.tag) { const d = document.createElement('div'); d.textContent = (t.name || short(a.owner)) + ' · ' + LABEL[t.tag]; tip.appendChild(d); }
    if (ml) { const d = document.createElement('div'); d.textContent = '🛒 ' + mktLine(ml); tip.appendChild(d); }
    tip.style.borderLeftColor = t && t.tag ? COL[t.tag] : MKT;
    tip.style.left = (e.clientX + 16) + 'px'; tip.style.top = (e.clientY + 14) + 'px';
    tip.style.display = '';
  }

  // ---- 6. Small switches on the belt map to hide / show the rings and the marketplace diamonds ----
  let bar = null, pillWanted = false;
  function showPill(onMap) {
    if (onMap !== undefined) pillWanted = onMap;
    const anyTags = tagsOn && Object.values(tags).some(t => t && t.tag);
    const anyMkts = marketsOn && markets.size > 0;
    if (!bar || !bar.isConnected) {
      bar = document.createElement('div');
      bar.style.cssText = 'position:fixed;top:44px;left:50%;transform:translateX(-50%);z-index:2147483000;display:none;gap:6px';
      const mk = (title, fn) => {
        const b = document.createElement('button'); b.type = 'button'; b.title = title;
        b.style.cssText = 'cursor:pointer;font:12px/1 system-ui,-apple-system,"Segoe UI",sans-serif;padding:5px 10px;color:#d7e6f5;'
          + 'background:rgba(8,14,24,.85);border:1px solid #36a7cd';
        ['pointerdown', 'pointerup'].forEach(t => b.addEventListener(t, e => e.stopPropagation()));
        b.addEventListener('click', e => { e.stopPropagation(); fn(); dirty = true; updateRings(); showPill(); });
        bar.appendChild(b); return b;
      };
      bar.tags = mk("Skippy's Command Deck – show or hide your friend / foe rings", () => {
        hidden = !hidden; try { localStorage.setItem(KEY + 'Hidden', hidden ? '1' : '0'); } catch (err) {}
      });
      bar.mkts = mk("Skippy's Command Deck – show or hide asteroids with open marketplaces", () => {
        mktHidden = !mktHidden; try { localStorage.setItem(KEY + 'MktHidden', mktHidden ? '1' : '0'); } catch (err) {}
      });
      (document.body || root).appendChild(bar);
    }
    bar.tags.textContent = hidden ? '◎ Tags: hidden' : '◉ Tags: shown';
    bar.tags.style.opacity = hidden ? '.6' : '1';
    bar.tags.style.display = anyTags ? '' : 'none';
    bar.mkts.textContent = mktHidden ? '◇ Markets: hidden' : '◆ Markets: shown';
    bar.mkts.style.opacity = mktHidden ? '.6' : '1';
    bar.mkts.style.borderColor = MKT;
    bar.mkts.style.display = anyMkts ? '' : 'none';
    bar.style.display = pillWanted && (anyTags || anyMkts) ? 'flex' : 'none';
  }

  function clickedAsteroid(e) {
    if (!store) store = window.__yicR3f || null;
    if (!store) return null;
    const st = store.getState(), canvas = st.gl && st.gl.domElement;
    if (!canvas || e.target !== canvas) return undefined;
    const pts = gamePoints(st.scene);
    if (!pts || !pts.visible) return null;
    const u = pts.material.uniforms && pts.material.uniforms.uOpacity;
    if (u && u.value < 1) return undefined; // at an asteroid, not the belt map
    if (e.type === 'pointermove' && !(tagsOn && Object.keys(tags).length) && !(marketsOn && markets.size)) return null;
    if (order.length * 3 !== pts.geometry.attributes.position.array.length) return null;
    const r = canvas.getBoundingClientRect();
    const p = st.pointer.clone().set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    st.raycaster.setFromCamera(p, st.camera);
    const hits = st.raycaster.intersectObject(pts, false);
    if (!hits.length) return null;
    const i = hits.sort((a, b) => a.distanceToRay - b.distanceToRay)[0].index;
    return order[i] || null;
  }
  let down = null, lastMove = 0;
  function listen() {
    window.addEventListener('pointermove', e => {
      const t = performance.now(); if (t - lastMove < 100) return; lastMove = t;
      try { const id = clickedAsteroid(e); showTip(e, id || null); } catch (err) {}
    }, true);
    window.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; }, true);
    window.addEventListener('pointerup', e => {
      if (!down || e.button !== 0) return;
      const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]); down = null;
      if (moved > 5) return; // a drag to turn the map, not a click
      // let the game handle its click first, then look
      setTimeout(() => {
        try {
          const id = clickedAsteroid(e);
          if (id === undefined) return;
          if (id && (tagsOn || (marketsOn && markets.has(id)))) { readAsteroids(); showBox(id); } else hideBox();
        } catch (err) { note('click – ' + err.message); }
      }, 0);
    }, true);
  }

  // ---- start: wait for your options, then run ---------------------------------------------
  note('starting');
  let waited = 0;
  const go = setInterval(() => {
    const raw = root.dataset.yicOpts;
    if (!raw) { if (++waited > 60) { clearInterval(go); note('options not found'); } return; }
    clearInterval(go);
    let o = {}; try { o = JSON.parse(raw); } catch (e) {}
    tagsOn = o.mapTags !== false; marketsOn = o.mapMarkets !== false;
    if (!tagsOn && !marketsOn) { note('switched off in options'); return; }
    TAGS.forEach(t => { const c = o['tagCol_' + t]; if (/^#[0-9a-f]{6}$/i.test(c || '')) COL[t] = c; });
    listen();
    const tick = () => { try { readAsteroids(); updateRings(); } catch (e) { if (rings) rings.visible = false; if (diamonds) diamonds.visible = false; note('paused – ' + e.message); } };
    tick(); setInterval(tick, 2000);
    // keep the rings moving with the dots between ticks
    setInterval(() => { try { updateRings(); } catch (e) {} }, 500);
  }, 1000);
})();
