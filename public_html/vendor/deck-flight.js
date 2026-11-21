/* Flight Deck look – Skippy's Command Deck (LIVE, 26 Oct 2026)
   A navigation window above every Flight Deck page: the star, your rocks and their orbits,
   every ship docked at its rock and every ship in flight on its way (straight-line course from
   where it left to where it lands, placed by how far through the trip it is).
   Below it the page sits on a blue pilot's console (body.dk-flight). */
(function () {
  'use strict';
  if (!window.YICDECKS) return;
  const COL = '#9a6bff',
    AU = 1.495978707e11,
    EPOCH = 1609459200;
  const CSS = `
body.dk-flight #main{border:1px solid rgba(154,107,255,.35);border-top:3px solid ${COL};border-radius:0 0 14px 14px;background:linear-gradient(180deg,rgba(154,107,255,.07),rgba(5,7,10,0) 220px),repeating-linear-gradient(90deg,rgba(154,107,255,.035) 0 1px,transparent 1px 48px),repeating-linear-gradient(0deg,rgba(154,107,255,.035) 0 1px,transparent 1px 48px),#0b0711;box-shadow:inset 0 0 40px -18px ${COL},0 0 26px -14px ${COL};margin:0 16px 20px!important}
body.dk-flight #main h2{color:#c4adff}
body.dk-flight #main th{color:#c4adff}
#deckhero[data-deck="flight"]{margin:14px 16px 0;padding:9px 9px 0;background:linear-gradient(180deg,#251d3c,#120d1e);clip-path:polygon(4% 0,96% 0,100% 18%,100% 100%,0 100%,0 18%);position:relative}
.fh-win{position:relative;clip-path:polygon(4% 0,96% 0,100% 18%,100% 100%,0 100%,0 18%);background:radial-gradient(ellipse at 50% 50%,#140b24,#03060a 72%)}
.fh-win canvas{display:block;width:100%;height:clamp(220px,28vw,330px)}
.fh-glass{position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,rgba(255,255,255,.06),rgba(255,255,255,0) 30%,rgba(255,255,255,0) 72%,rgba(255,255,255,.03))}
.fh-plate{position:absolute;left:50%;top:0;transform:translateX(-50%);padding:3px 24px 4px;background:#120d1e;clip-path:polygon(0 0,100% 0,92% 100%,8% 100%);font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.4em;color:#c4adff;text-shadow:0 0 8px rgba(154,107,255,.8);z-index:2}
.fh-read{position:absolute;left:5%;top:30px;font:600 11px/1.6 ui-monospace,Menlo,monospace;letter-spacing:.08em;color:#c4adff;text-transform:uppercase;pointer-events:none}
.fh-read b{color:#e6ebf2;font-size:15px}
.fh-key{position:absolute;right:5%;top:30px;font:11px/1.6 system-ui,sans-serif;color:#8b9ab0;text-align:right;pointer-events:none}
.fh-key i{display:inline-block;width:9px;height:9px;margin-right:5px;vertical-align:-1px}
.fh-load{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);font-size:12px;color:#8b9ab0}
.fh-ship{position:absolute;inset:0;z-index:3;display:flex;align-items:center;justify-content:center;gap:4%;padding:30px 6% 14px;background:radial-gradient(ellipse at 40% 50%,rgba(154,107,255,.18),rgba(154,107,255,0) 60%),rgba(3,6,10,.95);cursor:pointer;animation:fhIn .35s ease-out}
.fh-ship .fh-pic{flex:0 0 auto;width:min(52%,520px);height:92%;background:#000 no-repeat 50% 42%/170% auto;mix-blend-mode:screen;-webkit-mask:radial-gradient(ellipse 50% 50% at 50% 50%,#000 55%,transparent 100%);mask:radial-gradient(ellipse 50% 50% at 50% 50%,#000 55%,transparent 100%)}
.fh-ship .fh-si{max-width:38%;font:13px/1.5 system-ui,sans-serif;color:#c4cdd9}
.fh-ship .fh-si b{display:block;font-size:20px;color:#e6ebf2;text-shadow:0 0 10px ${COL};margin-bottom:2px}
.fh-ship .fh-si i{display:block;font-style:normal;color:#c4adff;letter-spacing:.14em;text-transform:uppercase;font-size:11px;margin-bottom:8px}
.fh-ship .fh-x{position:absolute;right:6%;top:30px;font:700 12px system-ui;color:#c4adff;letter-spacing:.1em}
@keyframes fhIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.fh-ship{animation:none}}
@media (max-width:700px){.fh-ship{flex-direction:column;padding:26px 12px 10px}.fh-ship .fh-pic{width:90%;height:55%}.fh-ship .fh-si{max-width:100%;text-align:center}}
.fh-lip{height:12px;margin:0 -9px;background:linear-gradient(180deg,#251d3c,#100a18);border-top:2px solid ${COL};box-shadow:0 -2px 14px -2px ${COL}}
/* map controls (community idea, 15 Nov 2026 – TEST ONLY, ?beta=1) */
.fh-ctl{position:absolute;right:5%;bottom:10px;display:flex;gap:5px;z-index:2}
.fh-ctl button{all:unset;box-sizing:border-box;cursor:pointer;min-width:30px;height:28px;padding:0 7px;text-align:center;font:bold 15px/28px system-ui,sans-serif;color:#c4adff;background:rgba(18,13,30,.88);border:1px solid ${COL};border-radius:6px}
.fh-ctl button:hover,.fh-ctl button:focus-visible{background:#251d3c;box-shadow:0 0 10px -2px ${COL}}
.fh-ctl label{display:flex;align-items:center;gap:5px;height:28px;padding:0 9px;font:bold 13px system-ui,sans-serif;color:#c4adff;background:rgba(18,13,30,.88);border:1px solid ${COL};border-radius:6px;cursor:pointer;white-space:nowrap}
.fh-card{position:absolute;left:5%;top:82px;z-index:2;min-width:190px;max-width:260px;padding:9px 30px 10px 12px;font:13px/1.45 system-ui,sans-serif;color:#e6ebf2;background:rgba(18,13,30,.92);border:1px solid ${COL};border-radius:8px;box-shadow:0 0 18px -6px ${COL}}
.fh-card b{color:#c4adff;font-size:14px}.fh-card a{color:#c4adff}
.fh-card .fh-cx{all:unset;cursor:pointer;position:absolute;right:8px;top:5px;color:#8b9ab0;font-size:15px}.fh-card .fh-cx:hover{color:#fff}
.fh-win:fullscreen{clip-path:none!important;background:#03060a}
.fh-win:fullscreen canvas{height:100vh}
.fh-win:fullscreen .fh-ctl{right:16px;bottom:16px}
.fh-one .bm-box{margin:0!important;border:0!important;border-radius:0!important;background:transparent!important}
.fh-one .bm-box>.a{left:50%!important;transform:translateX(-50%);top:auto!important;bottom:6px;white-space:nowrap;opacity:.7}
.fh-one .fh-read{top:auto;bottom:28px}
.fh-win.fh-one:fullscreen canvas{height:100vh!important}
.fh-rl{position:absolute;right:5%;bottom:46px;z-index:3;min-width:200px;max-height:60%;overflow:auto;padding:8px 10px;background:rgba(18,13,30,.95);border:1px solid ${COL};border-radius:8px;font:13px system-ui,sans-serif;color:#e6ebf2}
.fh-win:fullscreen .fh-rl{right:16px;bottom:52px}
.fh-rl label{display:flex;align-items:center;gap:7px;padding:2px 0;cursor:pointer;white-space:nowrap}
.fh-rl input[type=checkbox]{flex:none;width:auto;min-width:0;max-width:none;margin:0}
.fh-rl i{flex:none;width:18px;height:3px;border-radius:2px}.fh-rl .fh-rb{display:flex;gap:6px;margin-top:6px}
.fh-rl .fh-rb button{all:unset;cursor:pointer;padding:2px 8px;font:bold 12px system-ui,sans-serif;color:#c4adff;border:1px solid ${COL};border-radius:5px}
@media (max-width:700px){.fh-key{display:none}#deckhero[data-deck="flight"],.fh-win{clip-path:none}}
`;

  function addCss() {
    if (document.getElementById('fh-css')) return;
    const s = document.createElement('style');
    s.id = 'fh-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  let ORB = null; // id -> {o, n}
  function orbitsFor(ids) {
    const need = ids.filter((i) => i && !(ORB && ORB[i]));
    if (!need.length) return Promise.resolve(ORB || {});
    const parts = [];
    for (let i = 0; i < need.length; i += 200) parts.push(need.slice(i, i + 200));
    return Promise.all(
      parts.map((p) =>
        fetch('orbits.php?ids=' + p.join(','))
          .then((r) => r.json())
          .then((j) => j.orbits || {})
          .catch(() => ({})),
      ),
    ).then((a) => (ORB = Object.assign(ORB || {}, ...a)));
  }

  // Map controls, select and Adalia Prime – same as the Bridge viewscreen (Mark, 15 Nov 2026 – TEST ONLY, ?beta=1)
  const ONE = /[?&]beta=1\b/.test(location.search);
  const MC = true; // LIVE 15 Nov 2026 (tested on ?beta=1 – Mark)
  const APK = 'yic-travel-ap';
  // FOC (Mark 21 Nov 2026 – TEST ONLY, ?beta=1): same as the Bridge map – each of your rocks has its own orbit colour (same
  // colours as the Bridge), and a Rocks ▾ list (Adalia Prime at the top) shows or hides each one. Hidden rocks are shared
  // with the Bridge map ('yic-map-hide'). Mark: any change to the Bridge viewscreen map goes on this map too.
  const FOC = /[?&]beta=1\b/.test(location.search);
  const OCOL = ['#5fc3e4', '#ffb84a', '#7be07b', '#ff7ab6', '#b48cff', '#ffe66b', '#ff8a5c', '#5ce1c4', '#9fb4ff', '#e0e0e0'];
  const HK = 'yic-map-hide';
  const hidL = () => { try { return JSON.parse(localStorage.getItem(HK)) || []; } catch (e) { return []; } };
  const hidS = (a) => { try { localStorage.setItem(HK, JSON.stringify(a)); } catch (e) {} };
  const apOn = () => { try { return localStorage.getItem(APK) === '1'; } catch (e) { return false; } };

  function hero(el) {
    addCss();
    const Y = window.YIC;
    if (!Y || !Y.D) return;
    const D = Y.D,
      ships = D.ships || [];
    const owned = (D.owned || []).map((a) => +a.id),
      fly = ships.filter((s) => s.fl),
      dock = ships.filter((s) => !s.fl);
    // ONE VIEWSCREEN (Mark 21 Nov 2026 – TEST ONLY, ?beta=1): the Bridge's map (window.YICbeltMap, pages/asteroids.js) with the
    // ships switched on and the Flight Deck's purple – one map for both, buttons at the top. The old drawing below stays for now.
    if (ONE && window.YICbeltMap) {
      el.innerHTML = '<div class="fh-win fh-one"><div class="fh-glass"></div><div class="fh-read">In flight <b>' + fly.length + '</b><br>Docked <b>' + dock.length + '</b></div></div>' +
        '<div class="fh-plate">NAVIGATION</div><div class="fh-lip"></div>';
      const win = el.querySelector('.fh-win');
      window.YICbeltMap(win, { ships: true, theme: 'flight', onShip: showShip, fsEl: win, h: 'clamp(220px,28vw,330px)', label: 'Ships in flight · courses · docked ships · drag to turn' });
      return;
    }
    el.innerHTML =
      '<div class="fh-win"><canvas></canvas><div class="fh-glass"></div>' +
      '<div class="fh-read">In flight <b>' + fly.length + '</b><br>Docked <b>' + dock.length + '</b></div>' +
      '<div class="fh-key"><i style="background:' + COL + ';clip-path:polygon(0 50%,100% 0,70% 50%,100% 100%)"></i>ship in flight<br>' +
      '<i style="border-top:1px dashed ' + COL + ';height:0"></i>course<br><i style="background:#c4cdd9;border-radius:50%"></i>your rock<br><span style="opacity:.7">drag to turn</span></div>' +
      '<div class="fh-load">Plotting courses…</div>' +
      (MC ? '<div class="fh-ctl">' + (FOC ? '<button type="button" data-fh="rocks" title="Show or hide each of your asteroids" aria-expanded="false" style="font-size:13px">Rocks ▴</button>' : '<label title="Show Adalia Prime on the map (same setting as Navigation)"><input type="checkbox" data-fh="ap"> Adalia Prime</label>') +
        '<button type="button" data-fh="out" title="Zoom out">−</button><button type="button" data-fh="in" title="Zoom in">+</button>' +
        '<button type="button" data-fh="pause" title="Pause the turning">⏸</button><button type="button" data-fh="fs" title="Full screen">⛶</button></div>' +
        '<div class="fh-card" hidden></div>' : '') + '</div><div class="fh-plate">NAVIGATION</div><div class="fh-lip"></div>';
    const cv = el.querySelector('canvas'),
      ctx = cv.getContext('2d');
    const ocol = {}; // rock id → its colour, in the same order as the Bridge map
    (D.owned || []).filter((a) => a.Orbit && a.Orbit.a).forEach((a, i) => { ocol[+a.id] = OCOL[i % OCOL.length]; });
    let hid = FOC ? hidL() : [];
    const shown = (r) => !(r.mine && hid.includes(r.id));
    const ids = [...new Set(owned.concat(ships.map((s) => s.dId), fly.map((s) => s.oId), MC ? [1] : []))].filter(Boolean);
    Promise.all([import('./travel.js?v=' + (Y.VER || 1)), orbitsFor(ids)])
      .then(([T, O]) => {
        if (!el.isConnected) return;
        const l = el.querySelector('.fh-load');
        if (l) l.remove();
        const at = (id, unix) => {
          const o = O[id] && O[id].o;
          if (!o) return null;
          try {
            const p = T.pos(o, (unix - EPOCH) / 3600);
            return [p[0] / AU, p[1] / AU, p[2] / AU];
          } catch (e) {
            return null;
          }
        };
        const nm = (id) => (O[id] && O[id].n) || 'Asteroid #' + id;
        const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
        let W = 0,
          H = 0,
          R = 1,
          rocks = [],
          trips = [];
        const dpr = Math.min(devicePixelRatio || 1, 2);
        // turns slowly like the bridge viewscreen; drag to turn and tilt
        let tilt = 0.55,
          az = 0,
          drag = null,
          zf = 1,
          paused = false,
          sel = null;
        const proj = (p) => {
          const s = ((Math.min(W * 0.92, H * 1.9) * 0.5) / R) * zf,
            ca = Math.cos(az),
            sa = Math.sin(az),
            x = p[0] * ca - p[1] * sa,
            y = p[0] * sa + p[1] * ca;
          return [W / 2 + x * s, H / 2 + (y * Math.cos(tilt) - p[2] * Math.sin(tilt)) * s * 0.92];
        };
        const plan = () => {
          const now = Date.now() / 1000;
          const rockIds = [...new Set(owned.concat(dock.map((s) => s.dId), fly.map((s) => s.dId), fly.map((s) => s.oId)))].filter((i) => O[i]);
          rocks = rockIds
            .map((id) => {
              const p = at(id, now);
              if (!p) return null;
              const ring = [];
              if (owned.includes(id)) {
                const am = (O[id].o.a || 0) * 1000,
                  per = (2 * Math.PI * Math.sqrt((am * am * am) / 1.1369e20)) / 86400; // adays = real hours
                for (let k = 0; k <= 72; k++) {
                  const q = at(id, now + (per * 3600 * k) / 72);
                  if (q) ring.push(q);
                }
              }
              return { id, p, ring, name: nm(id), mine: owned.includes(id), n: dock.filter((s) => s.dId === id).length };
            })
            .filter(Boolean);
          // Adalia Prime when ticked (white diamond); it's still drawn as a plain rock when ships are docked there
          if (MC && apOn() && O[1]) {
            let r = rocks.find((x) => x.id === 1);
            if (!r) { const p = at(1, now); if (p) rocks.push((r = { id: 1, p, ring: [], name: 'Adalia Prime', mine: false, n: 0 })); }
            if (r) { r.ap = true; r.name = 'Adalia Prime'; }
          }
          trips = fly
            .map((s) => {
              const dep = s.depT || now,
                arr = s.arrT || now,
                a = at(s.oId, dep),
                b = at(s.dId, arr);
              if (!a || !b) return null;
              const f = arr > dep ? Math.max(0, Math.min(1, (now - dep) / (arr - dep))) : 1;
              return { s, a, b, f, left: Math.max(0, arr - now) };
            })
            .filter(Boolean);
          R = 0.5;
          rocks.forEach((r) => r.ring.concat([r.p]).forEach((p) => (R = Math.max(R, Math.hypot(p[0], p[1])))));
          trips.forEach((t) => [t.a, t.b].forEach((p) => (R = Math.max(R, Math.hypot(p[0], p[1])))));
          R *= 1.08;
        };
        const left = (sec) => {
          const h = sec / 3600;
          return h < 1 ? Math.max(1, Math.round(h * 60)) + ' m' : h < 48 ? Math.round(h) + ' h' : Math.round(h / 24) + ' d';
        };
        const size = () => {
          W = cv.clientWidth;
          H = cv.clientHeight;
          cv.width = W * dpr;
          cv.height = H * dpr;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        const curve = (A, B) => {
          // gentle arc so courses read as flight paths, bowed away from the star
          const mx = (A[0] + B[0]) / 2,
            my = (A[1] + B[1]) / 2,
            dx = B[0] - A[0],
            dy = B[1] - A[1],
            L = Math.hypot(dx, dy) || 1;
          let nx = -dy / L,
            ny = dx / L;
          if (nx * (mx - W / 2) + ny * (my - H / 2) < 0) {
            nx = -nx;
            ny = -ny;
          }
          return [mx + nx * L * 0.18, my + ny * L * 0.18];
        };
        const qb = (A, C, B, t) => [
          (1 - t) * (1 - t) * A[0] + 2 * (1 - t) * t * C[0] + t * t * B[0],
          (1 - t) * (1 - t) * A[1] + 2 * (1 - t) * t * C[1] + t * t * B[1],
        ];
        let ph = 0,
          hits = [];
        const frame = () => {
          hits = [];
          ctx.clearRect(0, 0, W, H);
          const c = [W / 2, H / 2],
            sr = Math.min(W, H) * 0.09,
            g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], sr);
          g.addColorStop(0, 'rgba(255,250,235,1)');
          g.addColorStop(0.2, 'rgba(255,235,200,.8)');
          g.addColorStop(1, 'rgba(255,220,170,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(c[0], c[1], sr, 0, 6.283);
          ctx.fill();
          // range rings, like a nav plot
          ctx.strokeStyle = 'rgba(154,107,255,.08)';
          ctx.lineWidth = 1;
          [0.33, 0.66, 1].forEach((k) => {
            ctx.beginPath();
            ctx.ellipse(c[0], c[1], (Math.min(W * 0.92, H * 1.9) * 0.5) * k * zf, (Math.min(W * 0.92, H * 1.9) * 0.5) * k * zf * Math.cos(tilt) * 0.92, 0, 0, 6.283);
            ctx.stroke();
          });
          rocks.forEach((r) => {
            if (!r.ring.length || !shown(r)) return;
            ctx.strokeStyle = FOC && ocol[r.id] ? ocol[r.id] : 'rgba(196,205,217,.13)';
            ctx.globalAlpha = FOC && ocol[r.id] ? 0.55 : 1;
            ctx.beginPath();
            r.ring.forEach((p, i) => {
              const q = proj(p);
              i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
            });
            ctx.stroke();
            ctx.globalAlpha = 1;
          });
          trips.forEach((t) => {
            const A = proj(t.a),
              B = proj(t.b),
              C = curve(A, B),
              P = qb(A, C, B, t.f),
              P2 = qb(A, C, B, Math.min(1, t.f + 0.02));
            ctx.setLineDash([5, 6]);
            ctx.strokeStyle = 'rgba(154,107,255,.55)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(A[0], A[1]);
            ctx.quadraticCurveTo(C[0], C[1], B[0], B[1]);
            ctx.stroke();
            ctx.setLineDash([]);
            // travelled part
            ctx.strokeStyle = 'rgba(196,173,255,.85)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let k = 0; k <= 30; k++) {
              const q = qb(A, C, B, (t.f * k) / 30);
              k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
            }
            ctx.stroke();
            // landing marker
            ctx.strokeStyle = 'rgba(154,107,255,.7)';
            ctx.beginPath();
            ctx.arc(B[0], B[1], 7, 0, 6.283);
            ctx.stroke();
            // the ship
            const ang = Math.atan2(P2[1] - P[1], P2[0] - P[0]) || 0,
              glow = calm ? 0.5 : 0.5 + 0.5 * Math.sin(ph);
            ctx.save();
            ctx.translate(P[0], P[1]);
            ctx.shadowColor = COL;
            ctx.shadowBlur = 8 + glow * 10;
            ctx.rotate(ang);
            ctx.fillStyle = '#e0d4ff';
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(-6, -5);
            ctx.lineTo(-3, 0);
            ctx.lineTo(-6, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            hits.push([P[0], P[1], t.s]);
            ctx.fillStyle = '#e6ebf2';
            ctx.font = '600 12px system-ui,sans-serif';
            ctx.fillText(t.s.name, P[0] + 10, P[1] - 8);
            ctx.fillStyle = '#c4adff';
            ctx.font = '11px system-ui,sans-serif';
            ctx.fillText('→ ' + nm(t.s.dId) + ' · lands in ' + left(t.left), P[0] + 10, P[1] + 6);
          });
          rocks.forEach((r) => {
            if (!shown(r)) return;
            const q = proj(r.p);
            if (sel === r.id) {
              ctx.strokeStyle = '#ffd24a';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(q[0], q[1], 10, 0, 6.283);
              ctx.stroke();
            }
            if (r.ap) {
              ctx.fillStyle = '#ffffff';
              ctx.save();
              ctx.translate(q[0], q[1]);
              ctx.rotate(Math.PI / 4);
              ctx.fillRect(-5, -5, 10, 10);
              ctx.restore();
            } else {
              ctx.fillStyle = r.mine ? (FOC && ocol[r.id]) || '#c4cdd9' : '#7d8899';
              ctx.beginPath();
              ctx.arc(q[0], q[1], r.mine ? 4 : 3, 0, 6.283);
              ctx.fill();
            }
            ctx.fillStyle = r.ap ? '#ffffff' : r.mine ? '#c4cdd9' : '#8b9ab0';
            ctx.font = (r.ap ? 'bold ' : '') + '11px system-ui,sans-serif';
            ctx.fillText(r.name, q[0] + 7, q[1] + 14);
            if (r.n) {
              dock.filter((s) => s.dId === r.id).forEach((s) => hits.push([q[0] - 12, q[1] - 9, s]));
              // docked ships: small blue chevrons beside the rock
              for (let i = 0; i < Math.min(r.n, 5); i++) {
                ctx.fillStyle = COL;
                ctx.beginPath();
                const x = q[0] - 8 - i * 7,
                  y = q[1] - 9;
                ctx.moveTo(x, y - 4);
                ctx.lineTo(x + 4, y + 3);
                ctx.lineTo(x - 4, y + 3);
                ctx.closePath();
                ctx.fill();
              }
              ctx.fillStyle = '#c4adff';
              ctx.font = '10px system-ui,sans-serif';
              ctx.fillText(r.n + ' docked', q[0] + 7, q[1] - 6);
            }
          });
        };
        plan();
        size();
        frame();
        new ResizeObserver(() => {
          size();
          frame();
        }).observe(cv);
        let last = Date.now();
        const loop = () => {
          if (!cv.isConnected) return;
          ph += 0.05;
          if (!drag && !paused) az += 0.0012;
          if (Date.now() - last > 60000) {
            last = Date.now();
            plan();
          }
          frame();
          requestAnimationFrame(loop);
        };
        if (!calm) requestAnimationFrame(loop);
        cv.style.touchAction = 'none';
        cv.style.cursor = 'grab';
        cv.addEventListener('pointerdown', (e) => {
          drag = { x: e.clientX, y: e.clientY, az, tilt };
          cv.setPointerCapture(e.pointerId);
        });
        cv.addEventListener('pointermove', (e) => {
          if (!drag) return;
          az = drag.az - (e.clientX - drag.x) * 0.008; // same way as the Bridge viewscreen (Mark, 12 Nov)
          tilt = Math.max(0.15, Math.min(1.45, drag.tilt - (e.clientY - drag.y) * 0.006));
          if (calm) frame();
        });
        cv.addEventListener('pointerup', (e) => {
          const moved = drag && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4;
          drag = null;
          if (moved) return;
          const b = cv.getBoundingClientRect(),
            x = e.clientX - b.left,
            y = e.clientY - b.top;
          let best = null,
            bd = 16;
          hits.forEach((h) => {
            const d = Math.hypot(h[0] - x, h[1] - y);
            if (d < bd) {
              bd = d;
              best = h[2];
            }
          });
          if (best) showShip(best);
          else if (MC) {
            // no ship there: a rock? (your rocks and Adalia Prime) → small card; empty space closes it
            let rk = null,
              rd = 14;
            rocks.forEach((r) => {
              if ((!r.mine && !r.ap) || !shown(r)) return;
              const q = proj(r.p),
                d = Math.hypot(q[0] - x, q[1] - y);
              if (d < rd) {
                rd = d;
                rk = r;
              }
            });
            pick(rk);
          }
        });
        const card = el.querySelector('.fh-card');
        const pick = (r) => {
          sel = r ? r.id : null;
          if (!r) { card.hidden = true; frame(); return; }
          const esc = Y.esc || ((x) => String(x));
          const gl = (window.GL && window.GL('/asteroids/' + r.id, 'Open this asteroid in the game')) ||
            ' <a href="https://game.influenceth.io/asteroids/' + r.id + '" target="influencegame" rel="noopener">Open in the game ↗</a>';
          card.innerHTML = '<button type="button" class="fh-cx" title="Close">✕</button><b>' + esc(r.name) + '</b><br>' +
            Math.hypot(r.p[0], r.p[1], r.p[2]).toFixed(2) + ' AU from the Adalia Star' +
            (r.n ? '<br>' + r.n + ' of your ships docked' : '') + '<br>' + gl;
          card.querySelector('.fh-cx').onclick = () => pick(null);
          card.hidden = false;
          frame();
        };
        if (MC) {
          const win = el.querySelector('.fh-win'),
            zoom = (k) => { zf = Math.max(1, Math.min(12, zf * k)); frame(); },
            pb = el.querySelector('[data-fh="pause"]'),
            fb = el.querySelector('[data-fh="fs"]'),
            apcb = el.querySelector('[data-fh="ap"]');
          el.querySelector('[data-fh="in"]').onclick = () => zoom(1.3);
          el.querySelector('[data-fh="out"]').onclick = () => zoom(1 / 1.3);
          pb.onclick = () => {
            paused = !paused;
            pb.textContent = paused ? '▶' : '⏸';
            pb.title = paused ? 'Start the turning again' : 'Pause the turning';
          };
          fb.onclick = () => {
            if (document.fullscreenElement === win) document.exitFullscreen();
            else if (win.requestFullscreen) win.requestFullscreen().catch(() => {});
          };
          document.addEventListener('fullscreenchange', () => {
            if (!win.isConnected) return;
            fb.title = document.fullscreenElement === win ? 'Leave full screen (or press Esc)' : 'Full screen';
            requestAnimationFrame(() => { size(); frame(); });
          });
          cv.addEventListener('wheel', (e) => {
            if (document.fullscreenElement !== win) return; // normal page scrolling when not full screen
            e.preventDefault();
            zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15);
          }, { passive: false });
          if (FOC) {
            const rb = el.querySelector('[data-fh="rocks"]'), rl = document.createElement('div');
            rl.className = 'fh-rl'; rl.hidden = true; win.appendChild(rl);
            const mineL = (D.owned || []).filter((a) => a.Orbit && a.Orbit.a).map((a) => ({ id: +a.id, name: nm(+a.id) }));
            const list = () => {
              rl.innerHTML = '<label title="Same setting as Navigation"><input type="checkbox" data-rap' + (apOn() ? ' checked' : '') + '><i style="background:#fff"></i>Adalia Prime</label>' +
                mineL.map((a) => '<label><input type="checkbox" data-rk="' + a.id + '"' + (hid.includes(a.id) ? '' : ' checked') + '><i style="background:' + ocol[a.id] + '"></i>' + (Y.esc ? Y.esc(a.name) : a.name) + '</label>').join('') +
                '<div class="fh-rb"><button type="button" data-ra="all">Show all</button><button type="button" data-ra="none">Hide all</button></div>';
            };
            const setAP = (on) => { try { localStorage.setItem(APK, on ? '1' : '0'); } catch (e) {} if (!on && sel === 1) pick(null); plan(); };
            const set = (h) => { hid = h; hidS(hid); if (sel && hid.includes(sel)) pick(null); list(); frame(); };
            rb.onclick = () => { rl.hidden = !rl.hidden; rb.setAttribute('aria-expanded', String(!rl.hidden)); if (!rl.hidden) list(); };
            rl.addEventListener('change', (e) => { if ('rap' in e.target.dataset) { setAP(e.target.checked); frame(); return; } const id = +e.target.dataset.rk; if (!id) return; set(e.target.checked ? hid.filter((x) => x !== id) : hid.concat([id])); });
            rl.addEventListener('click', (e) => { const w = e.target.dataset.ra; if (w === 'all') { setAP(true); set([]); } else if (w === 'none') { setAP(false); set(mineL.map((a) => a.id)); } });
          }
          if (apcb) apcb.checked = apOn();
          if (apcb) apcb.onchange = () => {
            try { localStorage.setItem(APK, apcb.checked ? '1' : '0'); } catch (e) {}
            if (!apcb.checked && sel === 1) pick(null);
            plan();
            frame();
          };
        }
      })
      .catch(() => {
        const l = el.querySelector('.fh-load');
        if (l) l.textContent = 'Could not plot the courses just now.';
      });
  }

  // Show a ship's picture on the navigation screen (click a ship on the screen, or its picture in the Ships table)
  function showShip(s) {
    if (window.YICdeckScreen) window.YICdeckScreen('hero'); // ship details need the navigation window on the screen
    const win = document.querySelector('#deckhero[data-deck="flight"] .fh-win');
    if (!win || !s) return;
    const Y = window.YIC,
      // backup cleaner escapes HTML too (security check, LIVE 9 Nov 2026, tested on ?beta=1 – Mark)
      esc = (Y && Y.esc) || ((x) => String(x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]));
    let o = win.querySelector('.fh-ship');
    if (o) o.remove();
    const crew = (Y && Y.D && Y.D.crewN && Y.D.crewN[s.crewId]) || '';
    o = document.createElement('div');
    o.className = 'fh-ship';
    o.title = 'Click to go back to the navigation view';
    o.innerHTML =
      '<span class="fh-pic" style="background-image:url(shipimg.php?t=' + (+s.st || 0) + '&v=' + (+s.sv || 1) + ')"></span>' +
      '<div class="fh-si"><i>' + esc(s.type || 'Ship') + '</i><b>' + esc(s.name || 'Ship') + '</b>' +
      esc(s.fl ? s.place || s.route || 'In flight' : (s.place || (s.ast ? 'At ' + s.ast : ''))) +
      (s.carry ? '<br>Carrying ' + esc(s.carry) : '') +
      (s.prop != null ? '<br>Propellant ' + esc((Y && Y.fmtT ? Y.fmtT(s.prop) : s.prop + ' t')) : '') +
      (crew ? '<br>Crew: ' + esc(crew) : '') +
      '</div><span class="fh-x">✕ BACK</span>';
    o.addEventListener('click', () => o.remove());
    win.appendChild(o);
    const h = document.getElementById('deckhero');
    if (h && h.getBoundingClientRect().top < 0) h.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  document.addEventListener(
    'click',
    (e) => {
      if (!document.body.classList.contains('dk-flight')) return;
      const a = e.target.closest && e.target.closest('#main a[href^="shipimg.php"]');
      if (!a) return;
      const tr = a.closest('tr'),
        Y = window.YIC,
        ships = (Y && Y.D && Y.D.ships) || [],
        txt = tr ? tr.textContent : '';
      // the row shows the ship's name and #id
      const cells = tr ? [...tr.cells].map((c) => c.textContent.trim()) : [];
      const s = ships.find((x) => cells.includes(String(x.id))) || ships.find((x) => x.name && txt.includes(x.name));
      if (!s) return;
      e.preventDefault();
      e.stopPropagation();
      showShip(s);
    },
    true,
  );

  window.YICDECKHERO = window.YICDECKHERO || {};
  window.YICDECKHERO.flight = hero;
})();
