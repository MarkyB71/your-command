/* Load a ship – Logistics Hub, Skippy's Awesome Command Deck – TEST ONLY (?beta=1), 9 Nov 2026 (Mark)
   Under "✈ Short on this rock" each short item gets a 🚀 Load a ship button. This fills #dk-ship with:
   1. What to send – the item as it is, or its ingredients (one or two steps back), with the size of each load.
      Big finished things (e.g. Habitation Modules) can be a much bigger load than what they're made from, so the
      page shows both and the PLAYER chooses (Mark: "let the player choose").
   2. From which of your other rocks (how much of the load is in stock there).
   3. Ships on that rock, or heading to it (Mark). Ships still in flight / in orbit can't be loaded until they're
      down – shown with when they arrive. Several ships can be ticked and the load is split across them (Mark).
   4. A crew on that rock to do the moves, then Approve.
   It ONLY loads the ship (Mark: "just load please") – flying and unloading are left to the player in the game
   ("I don't want to automate the whole game"). One SendDelivery per storage → ship:
     run_system('SendDelivery', [5, fromId, 2, n, (product, amount)×n, 6, shipId, 2, 1, crewId])
   (destination = the ship entity, label 6, its cargo slot 2 – checked with @influenceth/sdk 2.8.1
   System.getRunSystemCall 9 Nov). Uses the hub's own helpers (window.YICDOCK, from vendor/dock.js). */
(function () {
  'use strict';
  if (!/[?&]beta=1\b/.test(location.search) || !/[?&]dock=1\b/.test(location.search)) return;
  const K = () => window.YICDOCK;
  const CARGO = { 2: 2, 3: 2, 4: 2 }; // ship type → cargo slot (Light Transport, Heavy Transport, Shuttle)
  const SS = { key: '', opt: 0, src: '', picked: null, crew: 0, msg: '', msgErr: false, busy: false, sentAt: 0 };
  let host = null, cur = null;

  const css = document.createElement('style');
  css.textContent = '#dk-ov .dk-shipbtn{padding:4px 9px;border-radius:7px;border:1px solid var(--cyan);background:#0c1a24;color:var(--cyan);font:600 12px Rajdhani,sans-serif;cursor:pointer;white-space:nowrap}' +
    '#dk-ov .dk-shipbtn.on{background:var(--cyan);color:#06121a}' +
    '#dk-ov .sl-opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin:6px 0 4px}' +
    '#dk-ov .sl-opt{border:1px solid var(--steel2);border-radius:10px;padding:10px 12px;cursor:pointer;background:#0b0f17}' +
    '#dk-ov .sl-opt.on{border-color:var(--cyan);box-shadow:0 0 0 1px var(--cyan) inset}' +
    '#dk-ov .sl-opt h3{margin:0 0 4px;font-size:15px;color:var(--ink)}' +
    '#dk-ov .sl-opt .big{font-size:18px;font-weight:700;color:var(--cyan)}' +
    '#dk-ov .sl-opt .sm{font-size:12px;color:var(--dim);line-height:1.45}' +
    '#dk-ov .sl-tag{display:inline-block;margin-left:6px;padding:1px 6px;border-radius:6px;font-size:11px;background:#14301f;color:var(--green)}' +
    '#dk-ov .sl-ship{display:flex;gap:8px;align-items:flex-start;padding:6px 0;border-top:1px solid #ffffff10}' +
    '#dk-ov .sl-ship:first-child{border-top:0}' +
    '#dk-ov .sl-bar{height:6px;border-radius:3px;background:#ffffff14;overflow:hidden;margin-top:4px;width:220px;max-width:100%}' +
    '#dk-ov .sl-bar i{display:block;height:100%;background:var(--cyan)}';
  document.head.appendChild(css);

  const vol = (p) => ((K().mv()[p] || [1000, 1000])[1]); // cm³ per unit
  const m3 = (cm3) => { const v = cm3 / 1e6; return (v >= 100 ? Math.round(v).toLocaleString('en-GB') : (+v.toFixed(v >= 10 ? 1 : 2)).toLocaleString('en-GB')) + ' m³'; };
  const loadG = (items) => Object.keys(items).reduce((t, p) => t + items[p] * K().grams(+p), 0);
  const loadV = (items) => Object.keys(items).reduce((t, p) => t + items[p] * vol(+p), 0);
  const isRaw = (p) => +p <= 22;

  // the usual recipe for a product (not an unbundling; the one where it is the only / main output)
  function recipeFor(p) {
    const rs = K().recipes().filter((r) => r.out[p] && !/Unbundling/i.test(r.name));
    rs.sort((a, b) => Object.keys(a.out).length - Object.keys(b.out).length);
    return rs[0] || null;
  }
  // one step back: everything that isn't raw is swapped for what it's made from
  function stepBack(items, used) {
    const out = {}; let changed = false;
    Object.keys(items).forEach((p) => {
      const r = isRaw(p) ? null : recipeFor(+p);
      if (!r) { out[p] = (out[p] || 0) + items[p]; return; }
      changed = true; used.add(r);
      const runs = Math.ceil(items[p] / r.out[p]);
      Object.keys(r.inp).forEach((ip) => { out[ip] = (out[ip] || 0) + r.inp[ip] * runs; });
    });
    return changed ? out : null;
  }
  function options(pick) {
    const first = {};
    if (pick.items) Object.keys(pick.items).forEach((p) => { first[p] = Math.ceil(pick.items[p]); }); else first[pick.p] = Math.ceil(pick.q);
    const L = pick.items ? ['The inputs', 'One step back', 'Two steps back'] : ['As it is', 'Its ingredients', 'Two steps back'];
    const opts = [{ t: L[0], items: first, recs: [] }];
    let items = first, recs = new Set();
    for (let d = 1; d <= 2; d++) {
      const used = new Set(recs), nx = stepBack(items, used);
      if (!nx) break;
      recs = used; items = nx;
      opts.push({ t: L[d], items: nx, recs: [...used] });
    }
    return opts;
  }

  const storesOn = (rock) => K().allB().filter((b) => K().isStore(b) && K().rockOf(b) === rock);
  const have = (b, p) => ((K().inv(b) || { contents: [] }).contents.filter((c) => c.product === +p).reduce((t, c) => t + c.amount, 0));
  const rockHas = (rock, p) => storesOn(rock).reduce((t, b) => t + have(b, p), 0);
  // share of the load (by weight) that's in stock on a rock
  function cover(rock, items) {
    const tot = loadG(items) || 1;
    return Object.keys(items).reduce((t, p) => t + Math.min(items[p], rockHas(rock, p)) * K().grams(+p), 0) / tot;
  }
  const otherRocks = () => { const k = K(), all = [...new Set(k.allB().filter(k.isStore).map(k.rockOf).filter(Boolean))]; return all.filter((r) => r !== k.S.rock).sort(); };

  // your ships at / heading to a rock
  function shipsFor(rock) {
    const k = K(), d = k.D() || {}, ast = k.astId(rock), now = Date.now() / 1000;
    return (d.ships || []).filter((s) => s.dId === ast && CARGO[s.st] && s.capM).map((s) => {
      const down = s.sst === 'd', freeG = Math.max(0, s.capM - s.useM), freeV = Math.max(0, s.capV - s.useV);
      let why = '';
      if (s.sst === 'f') why = s.arrT > now ? 'in flight – arrives ' + new Date(s.arrT * 1000).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + ', load it then' : 'arrived – land or dock it first';
      else if (s.sst === 'o') why = 'in orbit – land or dock it first';
      else if (!s.lot) why = "can't tell where it is on the rock";
      return { s, down, ok: down && !why, why, freeG, freeV };
    }).sort((a, b) => (b.ok - a.ok) || (b.freeV - a.freeV));
  }

  // split the load across the picked ships; each item comes from the nearest storage that has it
  function fill(rock, items, ships) {
    const k = K(), ast = k.astId(rock), stores = storesOn(rock), left = Object.assign({}, items), taken = {};
    const loads = []; // {ship, items:{p:n}}
    const order = Object.keys(left).sort((a, b) => left[b] * vol(+b) - left[a] * vol(+a));
    ships.forEach((x) => {
      let g = x.freeG * 0.995, v = x.freeV * 0.995; const it = {};
      order.forEach((p) => {
        if (left[p] <= 0) return;
        const pg = k.grams(+p), pv = vol(+p);
        const n = Math.min(left[p], Math.floor(g / pg), Math.floor(v / pv));
        if (n <= 0) return;
        it[p] = n; left[p] -= n; g -= n * pg; v -= n * pv;
      });
      if (Object.keys(it).length) loads.push({ x, items: it });
    });
    // storage → ship moves
    const moves = {}; const short = {};
    loads.forEach((L) => {
      Object.keys(L.items).forEach((p) => {
        let need = L.items[p];
        stores.map((b) => [b, have(b, p) - (taken[b.id + ':' + p] || 0), k.kmBetween(k.lotOf(b), L.x.s.lot, ast) ?? 1e9]).filter((z) => z[1] > 0).sort((a, b) => a[2] - b[2] || b[1] - a[1]).forEach(([b, h, km]) => {
          if (need <= 0) return;
          const n = Math.min(need, h); need -= n; taken[b.id + ':' + p] = (taken[b.id + ':' + p] || 0) + n;
          const key = b.id + '>' + L.x.s.id;
          (moves[key] = moves[key] || { b, ship: L.x.s, km, items: {} }).items[p] = (moves[key].items[p] || 0) + n;
        });
        if (need > 0) { short[p] = (short[p] || 0) + need; L.items[p] -= need; }
      });
    });
    Object.keys(left).forEach((p) => { if (left[p] <= 0) delete left[p]; });
    return { loads, moves: Object.values(moves), left, short };
  }

  // 🛒 Markets around the belt (Mark, 9 Nov): for the chosen "What to send", which asteroids' marketplaces
  // sell it – per asteroid, cheapest listings first: how much of the load is for sale there and what it costs
  // (price + the market's taker fee). Read-only – buying stays in the game. Your own listings are left out.
  function belt(items) {
    const k = K(), esc = k.esc, B = window.BELTDATA && window.BELTDATA.get(() => { if (host) render(host, cur); });
    if (!B) return '<div class="src">🛒 Loading the belt markets…</div>';
    if (B.err) { window.BELTDATA.data = null; return '<div class="src">🛒 Could not load the belt markets just now.</div>'; }
    const mk = B.markets || {}, mine = new Set(Object.keys((window.YIC && window.YIC.D && window.YIC.D.crewN) || {}).map(Number));
    const fee = (id) => { const x = mk[id] && mk[id].ex; return x ? (x.takerFee || 0) / 10000 : 0; };
    const by = {};
    (B.orders || []).forEach((o) => {
      if (o[1] !== 2 || o[2] <= 0 || o[3] <= 0 || mine.has(o[6]) || !items[o[0]]) return;
      (by[o[5]] = by[o[5]] || []).push(o);
    });
    const tot = loadG(items) || 1;
    const rows = Object.keys(by).map((a) => {
      const got = {}; let cost = 0, g = 0;
      by[a].sort((x, y) => x[3] * (1 + fee(x[4])) - y[3] * (1 + fee(y[4]))).forEach((o) => {
        const p = o[0], n = Math.min(o[2], items[p] - (got[p] || 0));
        if (n <= 0) return;
        got[p] = (got[p] || 0) + n; cost += n * o[3] / 1e6 * (1 + fee(o[4])); g += n * k.grams(p);
      });
      const m0 = by[a][0][4];
      return { name: (mk[m0] && mk[m0].ast) || ('Asteroid #' + a), got, cost, c: g / tot,
        mkts: [...new Set(by[a].filter((o) => got[o[0]]).map((o) => o[4]))] };
    }).sort((x, y) => (y.name === k.S.rock) - (x.name === k.S.rock) || y.c - x.c || x.cost - y.cost).slice(0, 8);
    // in-game link to the marketplace: through the Game Links extension when it's there (moves the open game tab), otherwise a plain link
    const link = (id) => (window.GL && window.GL.on() ? window.GL('/building/' + id, 'Open this marketplace in the game')
      : ' <a href="https://game.influenceth.io/building/' + id + '" target="influencegame" rel="noopener" style="color:var(--cyan)" title="Open this marketplace in the game">in game ↗</a>');
    const sway = (v) => (v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : v >= 1e4 ? (v / 1e3).toFixed(1) + 'k' : Math.round(v).toLocaleString('en-GB')) + ' SWAY';
    let h = '<div class="src" style="margin:12px 0 4px"><b>🛒 Or buy it on the belt</b> – marketplaces selling this load, best cover first. Buying and flying stay with you in the game.</div>';
    if (!rows.length) return h + '<div class="src" style="color:var(--amber)">Nobody on the belt is selling any of it right now.</div>';
    h += '<table><thead><tr><th>Asteroid</th><th>Of the load</th><th>For sale there</th><th>Cost</th></tr></thead><tbody>' + rows.map((r) => {
      const left = Object.keys(items).filter((p) => (r.got[p] || 0) < items[p]);
      return `<tr><td><b>${esc(r.name)}</b>${r.name === k.S.rock ? ' <span class="sl-tag">on this rock – no flight</span>' : ''}<div class="src">${r.mkts.slice(0, 4).map((id) => esc((mk[id] && mk[id].name) || ('Marketplace #' + id)) + link(id)).join('<br>')}${r.mkts.length > 4 ? '<br>+ ' + (r.mkts.length - 4) + ' more' : ''}</div></td>
<td>${r.c >= 0.999 ? '<span class="ok">✓ all</span>' : Math.round(r.c * 100) + '%'}</td>
<td class="src">${Object.keys(r.got).map((p) => esc(k.pname(+p)) + ' ' + k.amt(+p, r.got[p])).join('<br>')}${left.length && r.c < 0.999 ? '<br><span style="color:var(--amber)">short: ' + left.map((p) => esc(k.pname(+p))).slice(0, 3).join(', ') + (left.length > 3 ? ' +' + (left.length - 3) : '') + '</span>' : ''}</td>
<td>${sway(r.cost)}</td></tr>`;
    }).join('') + '</tbody></table><div class="hint">Prices include the market fee. Flight times and propellant: Trade Deck › Where to buy.</div>';
    return h;
  }

  function render(el, pick) {
    host = el; cur = pick;
    const k = K();
    if (!k || !pick) { el.innerHTML = ''; return; }
    const key = k.S.rock + '|' + (pick.items ? JSON.stringify(pick.items) : pick.p);
    const esc = k.esc, opts = options(pick), rocks = otherRocks();
    // first look: the option best in stock on one of your other rocks, then the smallest load (the player can change it)
    if (SS.key !== key) {
      SS.key = key; SS.src = ''; SS.picked = null; SS.msg = '';
      const sc = opts.map((o, i) => [i, Math.max(0, ...rocks.map((r) => cover(r, o.items))), loadV(o.items)]);
      sc.sort((a, b) => (b[1] >= 0.999) - (a[1] >= 0.999) || b[1] - a[1] || a[2] - b[2]); SS.opt = sc[0][0];
    }
    if (SS.opt >= opts.length) SS.opt = 0;
    const destTypes = new Set(k.allB().filter((b) => k.rockOf(b) === k.S.rock).map((b) => b.Building.buildingType));
    let h = `<div class="card"><h2><span class="n">🚀</span>Load a ship ${pick.items ? 'for ' + esc(pick.what) + ' × ' + (+pick.runs).toLocaleString('en-GB') + (+pick.runs === 1 ? ' run' : ' runs') + ' on ' + esc(k.S.rock) : 'with ' + esc(k.pname(pick.p)) + ' for ' + esc(k.S.rock)}</h2>
<div class="hint" style="margin:0 0 8px">This only <b>loads</b> the ship. You fly it to ${esc(k.S.rock)} and unload it yourself in the game.</div>
<div class="src" style="margin-bottom:4px"><b>1 · What to send</b> – pick one. Sending what it's made from can be a smaller load.</div><div class="sl-opts">`;
    const smallest = opts.reduce((b, o, i) => (loadV(o.items) < loadV(opts[b].items) ? i : b), 0);
    opts.forEach((o, i) => {
      const best = rocks.map((r) => [r, cover(r, o.items)]).sort((a, b) => b[1] - a[1])[0];
      const noB = o.recs.filter((r) => !destTypes.has(k.FBT[r.type])).map((r) => k.BTN[k.FBT[r.type]] || 'building');
      const list = Object.keys(o.items).map((p) => esc(k.pname(+p)) + ' ' + k.amt(+p, o.items[p]));
      h += `<div class="sl-opt${SS.opt === i ? ' on' : ''}" data-slopt="${i}"><h3>${SS.opt === i ? '◉' : '○'} ${esc(o.t)}${i === smallest && opts.length > 1 ? '<span class="sl-tag">smallest load</span>' : ''}</h3>
<div class="big">${m3(loadV(o.items))} · ${k.tonnes(loadG(o.items) / 1000)}</div>
<div class="sm">${list.slice(0, 6).join('<br>')}${list.length > 6 ? '<br>+ ' + (list.length - 6) + ' more' : ''}</div>
<div class="sm" style="margin-top:4px">${best ? (best[1] >= 0.999 ? '<span class="ok">✓ all in stock on ' + esc(best[0]) + '</span>' : best[1] > 0 ? Math.round(best[1] * 100) + '% in stock on ' + esc(best[0]) : '<span style="color:var(--red)">✗ not in stock on your other rocks</span>') : ''}</div>
${o.recs.length ? `<div class="sm" style="margin-top:4px">Then make it on ${esc(k.S.rock)}: ${[...new Set(o.recs.map((r) => esc(r.name)))].slice(0, 4).join(', ')}${noB.length ? '<br><span style="color:var(--amber)">⚠ needs a ' + esc([...new Set(noB)].join(', ').toLowerCase()) + ' there – none on ' + esc(k.S.rock) + '</span>' : ''}</div>` : ''}</div>`;
    });
    h += '</div>';
    const O = opts[SS.opt];
    h += belt(O.items);
    if (!rocks.length) { el.innerHTML = h + '<div class="src">You have no storage on another rock to load from.</div></div>'; wire(el); return; }
    if (!rocks.includes(SS.src)) SS.src = rocks.map((r) => [r, cover(r, O.items), shipsFor(r).some((x) => x.ok)]).sort((a, b) => b[1] - a[1] || b[2] - a[2])[0][0];
    h += `<div class="src" style="margin:12px 0 4px"><b>2 · Load it on</b></div><select id="sl-src">${rocks.map((r) => [r, cover(r, O.items), shipsFor(r).filter((x) => x.ok).length]).sort((a, b) => b[1] - a[1] || b[2] - a[2]).map(([r, c, n]) => `<option value="${esc(r)}"${r === SS.src ? ' selected' : ''}>${esc(r)} – ${Math.round(c * 100)}% in stock · ${n ? n + ' ship' + (n === 1 ? '' : 's') + ' ready' : 'no ship ready'}</option>`).join('')}</select>`;

    // 3 ships
    const sl = shipsFor(SS.src);
    if (!SS.picked) SS.picked = new Set(sl.filter((x) => x.ok).map((x) => x.s.id));
    h += `<div class="src" style="margin:12px 0 4px"><b>3 · Ships on or heading to ${esc(SS.src)}</b> – tick the ones to load. The load is split across them.</div>`;
    if (!sl.length) h += `<div class="src" style="color:var(--amber)">None of your cargo ships are on ${esc(SS.src)} or on their way there.</div>`;
    else h += '<div>' + sl.map((x) => {
      const pf = Math.min(1, Math.max(x.s.useM / x.s.capM, x.s.useV / x.s.capV));
      return `<label class="sl-ship"><input type="checkbox" data-slship="${x.s.id}"${x.ok ? '' : ' disabled'}${x.ok && SS.picked.has(x.s.id) ? ' checked' : ''}><span><b>${esc(x.s.name)}</b> <span class="src">${esc(x.s.type)} · ${esc(x.ok ? x.s.place : x.why)}</span>
<div class="sl-bar"><i style="width:${Math.round(pf * 100)}%"></i></div><span class="src">room for ${m3(x.freeV)} · ${k.tonnes(x.freeG / 1000)}</span></span></label>`;
    }).join('') + '</div>';

    const ships = sl.filter((x) => x.ok && SS.picked.has(x.s.id));
    const F = fill(SS.src, O.items, ships);
    SS.F = F;
    if (ships.length) {
      h += F.loads.map((L) => `<div class="hint" style="margin-top:6px">→ <b>${esc(L.x.s.name)}</b>: ${Object.keys(L.items).filter((p) => L.items[p] > 0).map((p) => esc(k.pname(+p)) + ' ' + k.amt(+p, L.items[p])).join(', ')}</div>`).join('');
      const lo = Object.keys(F.left), sh = Object.keys(F.short);
      if (lo.length) h += `<div class="hint" style="color:var(--amber)">Won't fit in the ticked ships: ${lo.map((p) => esc(k.pname(+p)) + ' ' + k.amt(+p, F.left[p])).join(', ')} – tick another ship or send it on a second trip.</div>`;
      if (sh.length) h += `<div class="hint" style="color:var(--amber)">Not in stock on ${esc(SS.src)}: ${sh.map((p) => esc(k.pname(+p)) + ' ' + k.amt(+p, F.short[p])).join(', ')}.</div>`;
    }

    // 4 crew + moves
    const cl = k.crews(SS.src);
    if (!cl.find((c) => c.id === SS.crew)) SS.crew = (cl.find((c) => !c.busy) || cl[0] || {}).id || 0;
    const crew = cl.find((c) => c.id === SS.crew);
    h += `<div class="src" style="margin:12px 0 4px"><b>4 · Crew on ${esc(SS.src)} to do the moves</b></div>`;
    h += cl.length ? `<select id="sl-crew">${cl.map((c) => `<option value="${c.id}"${c.id === SS.crew ? ' selected' : ''}>${esc(c.name)}${c.busy ? ' – busy' : ' – ready'}</option>`).join('')}</select>` : `<div class="src" style="color:var(--amber)">No crew on ${esc(SS.src)} – a crew there has to send the moves.</div>`;
    if (F.moves.length) h += `<table style="margin-top:8px"><thead><tr><th>From</th><th>Goods</th><th>To ship</th><th>Trip</th></tr></thead><tbody>${F.moves.map((mv) => `<tr><td class="src">${esc(k.nm(mv.b))}</td><td>${Object.keys(mv.items).map((p) => esc(k.pname(+p)) + ' ' + k.amt(+p, mv.items[p])).join('<br>')}</td><td class="src">${esc(mv.ship.name)}</td><td class="src">${mv.km < 1e9 ? k.kmTxt(mv.km) + ' · ' + k.tripTxt(k.tripSecs(mv.km, crew)) : ''}</td></tr>`).join('')}</tbody></table>`;

    // approve
    const wait = SS.sentAt && Date.now() - SS.sentAt < 180000;
    const n = Math.min(F.moves.length, 30);
    const can = k.isOwner() && !SS.busy && !wait && F.moves.length && crew;
    h += `<div style="margin-top:12px"><button id="sl-go" class="dkp-rc" style="border-color:var(--amber);color:#ffd28a"${can ? '' : ' disabled'}>🚀 Approve – load ${n} move${n === 1 ? '' : 's'} into ${F.loads.length > 1 ? F.loads.length + ' ships' : 'the ship'}</button></div>
${F.moves.length > 30 ? '<div class="hint">The first 30 moves go in this approval – press again for the rest.</div>' : ''}
<div class="hint">${wait ? '<span style="color:var(--amber)">Just sent – wait a moment, then ↻ Check the game again.</span> ' : ''}Nothing is sent until you approve it in your wallet. Then finish the moves in the game ("Finish All Ready Items") and fly the ship yourself.</div>
<div id="sl-msg" class="hint" style="display:${SS.msg ? 'block' : 'none'};margin-top:8px;padding:10px 12px;border-radius:8px;border:1px solid ${SS.msgErr ? '#ff4d4d88' : '#8fe3ff55'};color:${SS.msgErr ? '#ffb3ae' : 'var(--ink)'}">${SS.msg || ''}</div></div>`;
    el.innerHTML = h;
    wire(el);
  }

  function wire(el) {
    const again = () => render(host, cur);
    el.querySelectorAll('[data-slopt]').forEach((d) => d.addEventListener('click', () => { SS.opt = +d.dataset.slopt; SS.src = ''; SS.msg = ''; again(); }));
    const s = el.querySelector('#sl-src'); if (s) s.addEventListener('change', () => { SS.src = s.value; SS.picked = null; SS.crew = 0; SS.msg = ''; again(); });
    el.querySelectorAll('[data-slship]').forEach((c) => c.addEventListener('change', () => { const id = +c.dataset.slship; if (c.checked) SS.picked.add(id); else SS.picked.delete(id); again(); }));
    const c = el.querySelector('#sl-crew'); if (c) c.addEventListener('change', () => { SS.crew = +c.value; again(); });
    const g = el.querySelector('#sl-go'); if (g) g.addEventListener('click', () => { if (!SS.busy) send(); });
  }

  const crewLink = (c, esc) => c ? ' Finish them with <b>' + esc(c.name) + '</b>' + (window.GL && window.GL.on() ? window.GL('/crew/' + c.id, 'Open this crew in the game') : ' <a href="https://game.influenceth.io/crew/' + c.id + '" target="influencegame" rel="noopener" style="color:var(--cyan)" title="Open this crew in the game">in game ↗</a>') + '.' : '';
  const say = (html, err) => { SS.msg = html; SS.msgErr = !!err; const e = document.getElementById('sl-msg'); if (e) { e.style.display = 'block'; e.innerHTML = html; e.style.color = err ? '#ffb3ae' : 'var(--ink)'; e.style.borderColor = err ? '#ff4d4d88' : '#8fe3ff55'; } };

  function calls(list) {
    const k = K();
    return list.map((mv) => {
      const it = Object.keys(mv.items).filter((p) => mv.items[p] > 0).map((p) => [+p, Math.floor(mv.items[p])]);
      const data = [5, mv.b.id, k.SLOT, it.length, ...it.flat(), 6, mv.ship.id, CARGO[mv.ship.st], 1, SS.crew];
      return { contract_address: k.DISPATCHER, entry_point: 'run_system', calldata: [k.short('SendDelivery'), k.hex(data.length), ...data.map(k.hex)] };
    });
  }
  // checked against the page's game data just before sending (one failing action cancels the whole approval)
  function checks(list) {
    const k = K(), errs = [];
    if (!k.S.dataAt || Date.now() - k.S.dataAt > 10 * 60000) errs.push('The game data is over 10 minutes old – press ↻ Check the game again first.');
    const crew = k.crews(SS.src).find((c) => c.id === SS.crew);
    if (!crew) errs.push('No crew on ' + SS.src + ' picked.'); else if (k.crewReady(crew) - Date.now() / 1000 > 86400) errs.push(crew.name + ' already has more than 24 hours of jobs queued.');
    const left = {}, room = {};
    list.forEach((mv) => {
      const b = k.allB().find((x) => x.id === mv.b.id), sx = shipsFor(SS.src).find((x) => x.s.id === mv.ship.id);
      if (!b) errs.push('A storage in the moves is no longer there.');
      if (!sx || !sx.ok) errs.push(mv.ship.name + ' is no longer down on ' + SS.src + '.');
      Object.keys(mv.items).forEach((p) => {
        const kk = mv.b.id + ':' + p; if (left[kk] == null) left[kk] = b ? have(b, p) : 0;
        left[kk] -= mv.items[p]; if (left[kk] < 0) errs.push(k.nm(mv.b) + ' no longer holds enough ' + k.pname(+p) + '.');
        if (sx) { const r = room[sx.s.id] = room[sx.s.id] || [sx.freeG, sx.freeV]; r[0] -= mv.items[p] * k.grams(+p); r[1] -= mv.items[p] * vol(+p); if (r[0] < 0 || r[1] < 0) errs.push(sx.s.name + ' has no room left for all of it.'); }
      });
    });
    return [...new Set(errs)];
  }
  async function send() {
    const k = K();
    if (!k.isOwner() || !SS.F) return;
    const ws = k.wallets();
    if (!ws.length) return say('No Starknet wallet found in this browser. Open this page in the browser that has your wallet.', true);
    const w = ws[0], list = SS.F.moves.slice(0, 30);
    SS.busy = true; SS.msg = ''; render(host, cur);
    try {
      const a = await k.account(w);
      if (!a) throw new Error('The wallet did not share an address.');
      if (!k.sameAddr(a, k.D().wallet)) throw new Error('That wallet (' + k.esc(a) + ') is not the one this page is showing. Switch account in your wallet and try again.');
      const errs = checks(list);
      if (errs.length) throw new Error('Checked just before sending – nothing was sent:<br>• ' + errs.map(k.esc).join('<br>• '));
      const cs = calls(list);
      say('Waiting for your wallet… check the wallet window and approve (or reject) it there.');
      let res;
      if (typeof w.request === 'function') res = await w.request({ type: 'wallet_addInvokeTransaction', params: { calls: cs } });
      else if (w.account && typeof w.account.execute === 'function') res = await w.account.execute(cs.map((c) => ({ contractAddress: c.contract_address, entrypoint: c.entry_point, calldata: c.calldata })));
      else throw new Error('This wallet cannot send transactions from a web page.');
      const hsh = res && (res.transaction_hash || res.transactionHash);
      SS.sentAt = Date.now(); SS.busy = false;
      SS.msg = '✓ Sent to the game. ' + (hsh ? `Transaction <a href="https://voyager.online/tx/${k.esc(hsh)}" target="_blank" rel="noopener noreferrer" style="color:var(--cyan)">${k.esc(String(hsh).slice(0, 10))}…</a>. ` : '') + 'Finish the moves in the game with Finish All Ready Items – then the ship is yours to fly to ' + k.esc(k.S.rock) + '.' +
        crewLink(k.crews(SS.src).find((c) => c.id === SS.crew), k.esc); // Mark, 9 Nov: which crew to finish with
      SS.msgErr = false; render(host, cur);
      setTimeout(() => { k.loadDeliveries().then(k.render); }, 150000);
    } catch (e) {
      const t = String((e && e.message) || e || '');
      SS.busy = false; render(host, cur);
      say(/reject|cancel|abort|denied|User/i.test(t) && !/Checked just before/.test(t) ? 'Cancelled in the wallet – nothing was changed.' : 'Not sent: ' + (/^Checked just before/.test(t) ? t : k.esc(t)), true);
    }
  }

  window.YICSHIP = { render, _test: { options, fill, shipsFor, belt, calls: (l) => calls(l), SS } };
})();
