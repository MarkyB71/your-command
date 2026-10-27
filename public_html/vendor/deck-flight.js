/* Flight Deck look – Skippy's Command Deck (test on ?beta=1, 26 Oct 2026)
   A navigation window above every Flight Deck page: the star, your rocks and their orbits,
   every ship docked at its rock and every ship in flight on its way (straight-line course from
   where it left to where it lands, placed by how far through the trip it is).
   Below it the page sits on a blue pilot's console (body.dk-flight). */
(function () {
  'use strict';
  if (!window.YICDECKS) return;
  const COL = '#5b9dff',
    AU = 1.495978707e11,
    EPOCH = 1609459200;
  const CSS = `
body.dk-flight #main{border:1px solid rgba(91,157,255,.35);border-top:3px solid ${COL};border-radius:0 0 14px 14px;background:linear-gradient(180deg,rgba(91,157,255,.07),rgba(5,7,10,0) 220px),repeating-linear-gradient(90deg,rgba(91,157,255,.035) 0 1px,transparent 1px 48px),repeating-linear-gradient(0deg,rgba(91,157,255,.035) 0 1px,transparent 1px 48px),#070b11;box-shadow:inset 0 0 40px -18px ${COL},0 0 26px -14px ${COL};margin:0 16px 20px!important}
body.dk-flight #main h2{color:#9cc3ff}
body.dk-flight #main th{color:#9cc3ff}
#deckhero[data-deck="flight"]{margin:14px 16px 0;padding:9px 9px 0;background:linear-gradient(180deg,#1d2a3c,#0d141e);clip-path:polygon(4% 0,96% 0,100% 18%,100% 100%,0 100%,0 18%);position:relative}
.fh-win{position:relative;clip-path:polygon(4% 0,96% 0,100% 18%,100% 100%,0 100%,0 18%);background:radial-gradient(ellipse at 50% 50%,#0b1524,#03060a 72%)}
.fh-win canvas{display:block;width:100%;height:clamp(220px,28vw,330px)}
.fh-glass{position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,rgba(255,255,255,.06),rgba(255,255,255,0) 30%,rgba(255,255,255,0) 72%,rgba(255,255,255,.03))}
.fh-plate{position:absolute;left:50%;top:0;transform:translateX(-50%);padding:3px 24px 4px;background:#0d141e;clip-path:polygon(0 0,100% 0,92% 100%,8% 100%);font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.4em;color:#9cc3ff;text-shadow:0 0 8px rgba(91,157,255,.8);z-index:2}
.fh-read{position:absolute;left:5%;top:30px;font:600 11px/1.6 ui-monospace,Menlo,monospace;letter-spacing:.08em;color:#9cc3ff;text-transform:uppercase;pointer-events:none}
.fh-read b{color:#e6ebf2;font-size:15px}
.fh-key{position:absolute;right:5%;top:30px;font:11px/1.6 system-ui,sans-serif;color:#8b9ab0;text-align:right;pointer-events:none}
.fh-key i{display:inline-block;width:9px;height:9px;margin-right:5px;vertical-align:-1px}
.fh-load{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);font-size:12px;color:#8b9ab0}
.fh-lip{height:12px;margin:0 -9px;background:linear-gradient(180deg,#1d2a3c,#0a1018);border-top:2px solid ${COL};box-shadow:0 -2px 14px -2px ${COL}}
body.dk-flight .cob{min-width:0;padding:5px 7px;margin:1px 0 4px;border-radius:8px}
body.dk-flight .cob-h{margin-bottom:4px;gap:8px;font-size:12px}
body.dk-flight .cob-f{max-width:50px;height:4px}
body.dk-flight .cob-r{gap:4px}
body.dk-flight .cob-m{width:34px}
body.dk-flight .cob-m img{width:30px;height:38px;border-radius:4px;border-width:1px}
body.dk-flight .cob-n{font-size:9.5px;max-width:34px;margin-top:2px}
body.dk-flight .cob-c{display:none}
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

  function hero(el) {
    addCss();
    const Y = window.YIC;
    if (!Y || !Y.D) return;
    const D = Y.D,
      ships = D.ships || [];
    const owned = (D.owned || []).map((a) => +a.id),
      fly = ships.filter((s) => s.fl),
      dock = ships.filter((s) => !s.fl);
    el.innerHTML =
      '<div class="fh-win"><canvas></canvas><div class="fh-glass"></div>' +
      '<div class="fh-read">In flight <b>' + fly.length + '</b><br>Docked <b>' + dock.length + '</b></div>' +
      '<div class="fh-key"><i style="background:' + COL + ';clip-path:polygon(0 50%,100% 0,70% 50%,100% 100%)"></i>ship in flight<br>' +
      '<i style="border-top:1px dashed ' + COL + ';height:0"></i>course<br><i style="background:#c4cdd9;border-radius:50%"></i>your rock<br><span style="opacity:.7">drag to turn</span></div>' +
      '<div class="fh-load">Plotting courses…</div></div><div class="fh-plate">NAVIGATION</div><div class="fh-lip"></div>';
    const cv = el.querySelector('canvas'),
      ctx = cv.getContext('2d');
    const ids = [...new Set(owned.concat(ships.map((s) => s.dId), fly.map((s) => s.oId)))].filter(Boolean);
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
          drag = null;
        const proj = (p) => {
          const s = (Math.min(W * 0.92, H * 1.9) * 0.5) / R,
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
        let ph = 0;
        const frame = () => {
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
          ctx.strokeStyle = 'rgba(91,157,255,.08)';
          ctx.lineWidth = 1;
          [0.33, 0.66, 1].forEach((k) => {
            ctx.beginPath();
            ctx.ellipse(c[0], c[1], (Math.min(W * 0.92, H * 1.9) * 0.5) * k, (Math.min(W * 0.92, H * 1.9) * 0.5) * k * Math.cos(tilt) * 0.92, 0, 0, 6.283);
            ctx.stroke();
          });
          rocks.forEach((r) => {
            if (!r.ring.length) return;
            ctx.strokeStyle = 'rgba(196,205,217,.13)';
            ctx.beginPath();
            r.ring.forEach((p, i) => {
              const q = proj(p);
              i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
            });
            ctx.stroke();
          });
          trips.forEach((t) => {
            const A = proj(t.a),
              B = proj(t.b),
              C = curve(A, B),
              P = qb(A, C, B, t.f),
              P2 = qb(A, C, B, Math.min(1, t.f + 0.02));
            ctx.setLineDash([5, 6]);
            ctx.strokeStyle = 'rgba(91,157,255,.55)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(A[0], A[1]);
            ctx.quadraticCurveTo(C[0], C[1], B[0], B[1]);
            ctx.stroke();
            ctx.setLineDash([]);
            // travelled part
            ctx.strokeStyle = 'rgba(156,195,255,.85)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let k = 0; k <= 30; k++) {
              const q = qb(A, C, B, (t.f * k) / 30);
              k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
            }
            ctx.stroke();
            // landing marker
            ctx.strokeStyle = 'rgba(91,157,255,.7)';
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
            ctx.fillStyle = '#cfe0ff';
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(-6, -5);
            ctx.lineTo(-3, 0);
            ctx.lineTo(-6, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            ctx.fillStyle = '#e6ebf2';
            ctx.font = '600 12px system-ui,sans-serif';
            ctx.fillText(t.s.name, P[0] + 10, P[1] - 8);
            ctx.fillStyle = '#9cc3ff';
            ctx.font = '11px system-ui,sans-serif';
            ctx.fillText('→ ' + nm(t.s.dId) + ' · lands in ' + left(t.left), P[0] + 10, P[1] + 6);
          });
          rocks.forEach((r) => {
            const q = proj(r.p);
            ctx.fillStyle = r.mine ? '#c4cdd9' : '#7d8899';
            ctx.beginPath();
            ctx.arc(q[0], q[1], r.mine ? 4 : 3, 0, 6.283);
            ctx.fill();
            ctx.fillStyle = r.mine ? '#c4cdd9' : '#8b9ab0';
            ctx.font = '11px system-ui,sans-serif';
            ctx.fillText(r.name, q[0] + 7, q[1] + 14);
            if (r.n) {
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
              ctx.fillStyle = '#9cc3ff';
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
          if (!drag) az += 0.0012;
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
          az = drag.az + (e.clientX - drag.x) * 0.008;
          tilt = Math.max(0.15, Math.min(1.45, drag.tilt + (e.clientY - drag.y) * 0.006));
          if (calm) frame();
        });
        cv.addEventListener('pointerup', () => (drag = null));
      })
      .catch(() => {
        const l = el.querySelector('.fh-load');
        if (l) l.textContent = 'Could not plot the courses just now.';
      });
  }

  window.YICDECKHERO = window.YICDECKHERO || {};
  window.YICDECKHERO.flight = hero;
})();
