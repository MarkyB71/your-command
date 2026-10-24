/* Asteroids › Asteroids – Your Influence Command
   One file per page (started 2026-10-18). A card per asteroid you own or control, with the Adalia system map on top.
   APP = window.YIC: shared data, helpers and page state that still live in app.js
   (Today's Workload and other pages use some of them too). */
(function () {
  'use strict';
  // window.YIC is only set once app.js has loaded your data, so look it up each time
  const APP = new Proxy({}, { get: (_, k) => window.YIC[k], set: (_, k, v) => ((window.YIC[k] = v), true) });

  function drawAsteroids(m) {
    const ai = APP.$('#ast').value,
      an = ai === '' ? null : APP.asts[+ai].name,
      q = APP.$('#q').value.trim().toLowerCase();
    const list = (APP.D.owned || [])
      .map((a) => {
        const c = a.Celestial || {},
          st = c.celestialType,
          sp = APP.SPEC[st] || ['?', []],
          r = c.radius || 0,
          lots = Math.floor(4 * Math.PI * r * r);
        const name = (a.Name && a.Name.name) || a.id + '-' + sp[0].toUpperCase(),
          bon = APP.astBonuses(c.bonuses || 0, st),
          lv = bon.reduce((s, b) => s + b.lv, 0);
        const scanned = (c.scanStatus || 0) >= 4 && c.abundances,
          ab = scanned ? APP.astAbund(c.abundances) : null;
        const owner = (a.Nft && a.Nft.owners && a.Nft.owners.starknet) === APP.D.wallet,
          ctl = (APP.D.crewN || {})[a.Control && a.Control.controller && a.Control.controller.id] || '';
        return {
          id: a.id,
          name,
          sp: sp[0],
          res: sp[1],
          r,
          lots,
          used: a.lotsUsed,
          size: r <= 5 ? 'Small' : r <= 20 ? 'Medium' : r <= 50 ? 'Large' : 'Huge',
          bon,
          rar: lv <= 3 ? APP.RAR[lv] : lv <= 5 ? APP.RAR[4] : APP.RAR[5],
          scanned,
          ab,
          owner,
          ctl,
          orb: a.Orbit || null,
        };
      })
      .filter(
        (x) =>
          (!an || x.name === an) &&
          (!q ||
            [x.name, x.sp + '-type', x.size, x.rar, x.ctl, ...x.res.map(APP.pn)].some((v) =>
              String(v).toLowerCase().includes(q),
            )),
      )
      .sort((a, b) => b.owner - a.owner || a.name.localeCompare(b.name));
    if (!list.length) {
      m.innerHTML =
        '<div class="note">' +
        ((APP.D.owned || []).length
          ? 'Nothing matches.'
          : 'No asteroids are owned by this wallet or controlled by its crews.') +
        '</div>';
      return;
    }
    const pct = (f) => (Math.round(f * 1000) / 10).toLocaleString() + '%';
    let h =
      '<style>.as-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:14px;align-items:start}.as-c{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:12px;display:grid;grid-template-columns:130px 1fr;gap:12px}' +
      '.as-img{display:block;width:130px;height:160px;border-radius:6px;background:#000 no-repeat 50% 45%/180% auto}.as-c h3{margin:0;font-size:16px}.as-c .t{color:var(--muted);font-size:12px;margin:2px 0 6px}' +
      '.as-chip{display:inline-block;font-size:11.5px;border:1px solid var(--line);border-radius:10px;padding:1px 8px;margin:0 4px 4px 0;color:var(--accent)}.as-k{display:flex;justify-content:space-between;font-size:13px;padding:2px 0}.as-k span:first-child{color:var(--muted)}' +
      '.as-res{grid-column:1/-1}.as-r{display:flex;align-items:center;gap:6px;font-size:13px;padding:2px 0}.as-r .nm{width:120px}.as-r .bb{flex:1;height:6px;background:#232b38;border-radius:2px;overflow:hidden}.as-r .bb i{display:block;height:100%;background:var(--accent)}.as-r .v{width:52px;text-align:right;color:var(--muted)}</style>';
    h +=
      '<div class="note" style="padding:0 0 10px">' +
      list.length +
      ' asteroid' +
      (list.length > 1 ? 's' : '') +
      ' you own or control. Click a picture to see it full size (or in 3D once you have added the model).</div><div class="as-grid">';
    list.forEach((x) => {
      const lb = x.used != null && x.lots ? Math.min(1, x.used / x.lots) : null;
      h +=
        '<div class="as-c"><div><a class="as-img" data-id="' +
        +x.id +
        '" data-name="' +
        APP.esc(x.name) +
        '" href="aimg.php?id=' +
        +x.id +
        '" target="_blank" title="Open the picture" style="background-image:url(aimg.php?id=' +
        +x.id +
        '&s=1)"></a><div class="as-3d" data-id="' +
        +x.id +
        '"></div></div><div>' +
        '<h3>' +
        APP.esc(x.name) +
        (window.GL ? window.GL('/asteroids/' + x.id, 'Open this asteroid in the game') : '') +
        '</h3><div class="t">#' +
        +x.id +
        ' · ' +
        APP.esc(x.sp) +
        '-type · ' +
        x.size +
        ' · ' +
        APP.esc(x.rar) +
        '</div>' +
        '<div>' +
        (x.owner ? '<span class="as-chip">Owned</span>' : '') +
        (x.ctl
          ? '<span class="as-chip" style="color:var(--muted)">Controlled by ' + APP.esc(x.ctl) + '</span>'
          : '') +
        '</div>' +
        '<div class="as-k"><span>Radius</span><span>' +
        (Math.round(x.r * 100) / 100).toLocaleString() +
        ' km</span></div>' +
        '<div class="as-k"><span>Lots</span><span>' +
        x.lots.toLocaleString() +
        '</span></div>' +
        '<div class="as-k"><span>Lots in use</span><span>' +
        (x.used == null ? '–' : x.used.toLocaleString() + ' (' + pct(lb) + ')') +
        '</span></div>' +
        (lb != null
          ? '<div style="height:6px;background:#232b38;border-radius:2px;overflow:hidden;margin:2px 0 6px"><div style="height:100%;width:' +
            Math.max(1, Math.round(lb * 100)) +
            '%;background:' +
            (lb >= 0.9 ? '#d03b3b' : lb >= 0.75 ? '#fab219' : '#5fc3e4') +
            '"></div></div>'
          : '') +
        (x.orb && x.orb.a
          ? '<div class="as-k"><span>Orbit</span><span>' +
            (x.orb.a / 149597870.7).toFixed(3) +
            ' AU · ecc ' +
            (+x.orb.ecc).toFixed(3) +
            ' · inc ' +
            ((+x.orb.inc * 180) / Math.PI).toFixed(2) +
            '°</span></div>'
          : '') +
        '<div style="margin-top:6px">' +
        (x.bon.length
          ? x.bon.map((b) => '<span class="as-chip">' + APP.esc(b.n) + ' +' + b.mod + '%</span>').join('')
          : '<span class="as-chip" style="color:var(--muted)">No bonuses</span>') +
        '</div>' +
        '</div><div class="as-res"><h4 style="margin:4px 0 6px">' +
        (x.scanned ? 'Resources (abundance)' : 'Resources it can hold – not resource-scanned yet') +
        '</h4>' +
        (x.scanned
          ? x.res
              .map((r) => [r, x.ab[r] || 0])
              .sort((a, b) => b[1] - a[1])
              .map(
                ([r, v]) =>
                  '<div class="as-r">' +
                  APP.ricon(r, 20) +
                  '<span class="nm">' +
                  APP.esc(APP.pn(r)) +
                  (APP.BONB
                    ? (() => {
                        const m = APP.resBonus(x.bon, r).m;
                        return m > 1.0001
                          ? ' <span style="color:#4cd04c;font-size:12px;font-weight:600">+' +
                              Math.round((m - 1) * 100) +
                              '% faster</span>'
                          : '';
                      })()
                    : '') +
                  '</span><span class="bb"><i style="width:' +
                  Math.round(v * 100) +
                  '%"></i></span><span class="v">' +
                  (v ? pct(v) : '–') +
                  '</span></div>',
              )
              .join('')
          : x.res
              .map(
                (r) =>
                  '<span class="as-chip" style="color:var(--text)">' +
                  APP.ricon(r, 16) +
                  APP.esc(APP.pn(r)) +
                  '</span>',
              )
              .join('')) +
        '</div></div>';
    });
    m.innerHTML =
      h +
      '</div>' +
      (APP.BONB ? APP.bestAstHTML() : '') +
      '<div class="note" style="padding:12px 0 0">Abundance is the asteroid-wide figure from its resource scan; the amount at each lot varies. Lots in use counts every building or construction site on the asteroid, whoever owns it.<br>3D models: in the game, open your asteroid\'s management page and press <b>Download 3D Model</b>, then use <b>Add 3D model</b> here. Models are kept only in this browser.</div>';
    APP.wire3d(m);
  }

  function beltMap(m) {
    const box = document.createElement('div');
    box.style.cssText =
      'position:relative;margin:0 0 16px;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:radial-gradient(ellipse at 50% 50%,#0d1622 0%,#05070a 70%)';
    box.innerHTML =
      '<canvas style="display:block;width:100%;height:clamp(260px,46vw,440px)"></canvas><div class="a" style="position:absolute;left:12px;top:8px;font-size:12px;pointer-events:none">The Adalia system right now · your asteroids in blue · drag to turn</div><div class="bm-load a" style="position:absolute;left:12px;bottom:8px;font-size:12px">Loading orbits…</div>';
    m.prepend(box);
    const cv = box.querySelector('canvas'),
      ctx = cv.getContext('2d');
    const mine = (APP.D.owned || [])
      .filter((a) => a.Orbit && a.Orbit.a)
      .map((a) => ({ id: +a.id, name: (a.Name && a.Name.name) || 'Asteroid #' + a.id, o: a.Orbit }));
    const ids = [];
    for (let i = 1; ids.length < 600; i++) {
      const id = 1 + ((i * 104729) % 249999);
      if (!ids.includes(id)) ids.push(id);
    }
    if (!APP.BELTO && !APP.beltOLoad)
      APP.beltOLoad = Promise.all(
        [0, 200, 400].map((s) =>
          fetch('orbits.php?ids=' + ids.slice(s, s + 200).join(','))
            .then((r) => r.json())
            .then((j) => j.orbits || {})
            .catch(() => ({})),
        ),
      ).then((a) => {
        APP.BELTO = Object.assign({}, ...a);
        return APP.BELTO;
      });
    Promise.all([
      import('../vendor/travel.js?v=' + APP.VER),
      APP.BELTO ? Promise.resolve(APP.BELTO) : APP.beltOLoad,
    ])
      .then(([T, BO]) => {
        if (!box.isConnected) return;
        const t = (Date.now() / 1000 - 1609459200) / 3600,
          AU = 1.495978707e11,
          P = (o) => {
            const p = T.pos(o, t);
            return [p[0] / AU, p[1] / AU, p[2] / AU];
          };
        const belt = Object.values(BO)
          .map((x) => {
            try {
              return P(x.o);
            } catch (e) {
              return null;
            }
          })
          .filter(Boolean);
        const me = mine
          .map((a) => {
            let p = null,
              ring = [];
            try {
              p = P(a.o);
              const am = (a.o.a || 0) * 1000,
                per = (2 * Math.PI * Math.sqrt((am * am * am) / 1.1369e20)) / 86400;
              for (let k = 0; k <= 96; k++) {
                const q = T.pos(a.o, t + (per * k) / 96);
                ring.push([q[0] / AU, q[1] / AU, q[2] / AU]);
              }
            } catch (e) {}
            return { ...a, p, ring };
          })
          .filter((a) => a.p);
        box.querySelector('.bm-load').remove();
        let R = 0;
        belt.concat(me.map((a) => a.p)).forEach((p) => {
          R = Math.max(R, Math.hypot(p[0], p[1]));
        });
        R = R || 4;
        const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
        let az = 0.6,
          tilt = 1.05,
          drag = null,
          W = 0,
          H = 0;
        const dpr = Math.min(devicePixelRatio || 1, 2);
        const size = () => {
          W = cv.clientWidth;
          H = cv.clientHeight;
          cv.width = W * dpr;
          cv.height = H * dpr;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        size();
        const proj = (p) => {
          const s = (Math.min(W, H * 1.6) * 0.46) / R,
            ca = Math.cos(az),
            sa = Math.sin(az),
            x = p[0] * ca - p[1] * sa,
            y = p[0] * sa + p[1] * ca,
            ct = Math.cos(tilt),
            st = Math.sin(tilt);
          return [W / 2 + x * s, H / 2 + (y * ct - p[2] * st) * s, y * st];
        };
        const frame = () => {
          ctx.clearRect(0, 0, W, H);
          const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.12);
          g.addColorStop(0, 'rgba(255,250,235,1)');
          g.addColorStop(0.15, 'rgba(255,235,200,0.85)');
          g.addColorStop(1, 'rgba(255,220,170,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(W / 2, H / 2, Math.min(W, H) * 0.12, 0, 6.283);
          ctx.fill();
          ctx.fillStyle = 'rgba(225,232,245,0.55)';
          belt.forEach((p) => {
            const q = proj(p);
            ctx.fillRect(q[0], q[1], 1.2, 1.2);
          });
          me.forEach((a) => {
            ctx.strokeStyle = 'rgba(95,195,228,0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            a.ring.forEach((p, i) => {
              const q = proj(p);
              i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
            });
            ctx.stroke();
          });
          me.forEach((a) => {
            const q = proj(a.p);
            ctx.fillStyle = '#5fc3e4';
            ctx.save();
            ctx.translate(q[0], q[1]);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-4, -4, 8, 8);
            ctx.restore();
            ctx.fillStyle = '#e6ebf2';
            ctx.font = '12px system-ui,sans-serif';
            ctx.fillText(a.name, q[0] + 8, q[1] - 6);
          });
        };
        let raf = 0;
        const loop = () => {
          if (!box.isConnected) {
            cancelAnimationFrame(raf);
            return;
          }
          raf = requestAnimationFrame(loop);
          if (!drag && !calm) az += 0.0012;
          frame();
        };
        if (calm) frame();
        else loop();
        new ResizeObserver(() => {
          size();
          frame();
        }).observe(cv);
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
        cv.addEventListener('pointerup', () => {
          drag = null;
        });
        cv.style.touchAction = 'none';
        cv.style.cursor = 'grab';
      })
      .catch((e) => {
        const l = box.querySelector('.bm-load');
        if (l) l.textContent = 'Could not draw the map (' + ((e && e.message) || e) + ').';
      });
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.A = function (m) {
    drawAsteroids(m);
    beltMap(m);
  };
})();
