/* Asteroids › Asteroids – Your Influence Command
   One file per page (started 2026-10-18). A card per asteroid you own or control, with the Adalia system map on top.
   APP = window.YIC: shared data, helpers and page state that still live in app.js
   (Today's Workload and other pages use some of them too). */
(function () {
  'use strict';
  // window.YIC is only set once app.js has loaded your data, so look it up each time
  const APP = new Proxy({}, { get: (_, k) => window.YIC[k], set: (_, k, v) => ((window.YIC[k] = v), true) });


  // Who can supply who (LIVE, 26 Oct 2026): grid of raw resources × your rocks – which rocks can MINE each one
  let supAll = false;
  try { supAll = localStorage.getItem('yic-sup-all') === '1'; } catch (e) {}
  function supplyHTML() {
    const rocks = (APP.D.owned || [])
      .map((a) => {
        const c = a.Celestial || {},
          sp = APP.SPEC[c.celestialType] || ['?', []],
          scanned = (c.scanStatus || 0) >= 4 && c.abundances,
          ab = scanned ? APP.astAbund(c.abundances) : null,
          can = {};
        for (let r = 1; r <= 22; r++) {
          if (ab) {
            if (ab[r] > 0) can[r] = ab[r];
          } else if (sp[1].includes(r)) can[r] = -1; // type can hold it, not scanned yet
        }
        return { id: a.id, nm: (a.Name && a.Name.name) || 'Asteroid #' + a.id, can, scanned: !!ab };
      })
      .sort((x, y) => x.nm.localeCompare(y.nm));
    if (rocks.length < 2) return '';
    const res = [];
    for (let r = 1; r <= 22; r++) {
      const has = rocks.filter((k) => k.can[r] !== undefined);
      if (!has.length) continue;
      const gap = has.length < rocks.length;
      if (!supAll && !gap) continue;
      res.push({ r, has, gap });
    }
    res.sort((x, y) => APP.pn(x.r).localeCompare(APP.pn(y.r)));
    const cell = (k, x) => {
      const v = k.can[x.r];
      if (v === undefined) {
        const from = x.has.map((h) => h.nm).join(', ');
        return '<td class="sup-no" title="' + APP.esc(k.nm + " can't mine " + APP.pn(x.r) + ' – fly it in from ' + from) + '"' + ' data-to="' + k.id + '" data-from="' + x.has.map((h) => h.id).join(',') + '"' + '>✗ needs' + '<br><span class="sup-ft">…</span>' + '</td>';
      }
      return '<td class="sup-ok" data-sort="' + (v < 0 ? 0 : v) + '" title="' + APP.esc(k.nm + ' can mine ' + APP.pn(x.r)) + '">' + (v < 0 ? '✓' : (v * 100).toFixed(1) + '%') + '</td>';
    };
    return (
      '<style>.sup td.sup-ok{color:#4cd04c;font-weight:600;text-align:center}.sup td.sup-no{color:#ff6b6b;text-align:center;background:rgba(255,107,107,.08)}.sup th.rk{text-align:center;white-space:normal;min-width:70px}.sup td .sup-ft{display:block;font-size:12px;color:#c8d3e0;white-space:nowrap}.sup-sw{margin:0 0 8px;display:flex;gap:8px;align-items:center;font-size:14px}</style>' +
      '<div class="note" style="padding:0 0 8px">Which of your rocks can <b>mine</b> each raw resource. <span style="color:#4cd04c">Green</span> = can mine it here (abundance from the resource scan; ✓ = not scanned yet, but the rock type can hold it). <span style="color:#ff6b6b">✗ needs</span> = can\'t mine it here – the green rocks in that row can supply it. Hover a cell for details.' + ' Under each ✗: the quickest rock to fly it from, leaving now (standard Light Transport, full tank, 2,000 t cargo).' + '</div>' +
      '<label class="sup-sw"><input type="checkbox" id="supAll"' + (supAll ? ' checked' : '') + '> Show every resource (not just ones some rocks are missing)</label>' +
      (res.length
        ? '<div class="wrap"><table class="sup"><thead><tr><th>Resource</th>' + rocks.map((k) => '<th class="rk">' + APP.esc(k.nm) + '</th>').join('') + '<th class="num">Rocks that can mine it</th></tr></thead><tbody>' +
          res.map((x) => '<tr><td>' + APP.ricon(x.r, 20) + APP.esc(APP.pn(x.r)) + '</td>' + rocks.map((k) => cell(k, x)).join('') + '<td class="num">' + x.has.length + ' of ' + rocks.length + '</td></tr>').join('') +
          '</tbody></table></div>'
        : '<div class="note">Every one of your rocks can mine every resource any of them can.</div>')
    );
  }
  // Flight times on the red cells: nearest rock that can supply it, fastest trip leaving now,
  // standard Light Transport, full tank, full 2,000 t cargo (same as Trade finder)
  const ftMemo = {};
  let ftRun = 0;
  function supplyTimes(m) {
    const tds = [...m.querySelectorAll('td[data-to]')];
    if (!tds.length) return;
    const ids = [...new Set(tds.flatMap((td) => [td.dataset.to, ...td.dataset.from.split(',')]))];
    const me = ++ftRun,
      names = {};
    (APP.D.owned || []).forEach((a) => (names[a.id] = (a.Name && a.Name.name) || 'Asteroid #' + a.id));
    Promise.all([fetch('orbits.php?ids=' + ids.join(',')).then((r) => r.json()), import('../vendor/travel.js?v=' + APP.VER)])
      .then(async ([j, T]) => {
        const O = j.orbits || {},
          ship = T.SHIPS[2],
          dv = T.maxDeltaV(2, 1, 1, 2e6, ship[2] / 1000),
          now = (Date.now() / 1000 - 1609459200) / 3600,
          hr = Math.floor(now);
        const trip = async (f, t) => {
          const k = f + '>' + t + '>' + hr;
          if (!(k in ftMemo)) {
            const a = O[f], b = O[t];
            const r = a && b ? await T.fastest(a.o, b.o, now, dv) : null;
            ftMemo[k] = r ? r.tof : 0;
            await new Promise((z) => setTimeout(z, 0));
          }
          return ftMemo[k];
        };
        for (const td of tds) {
          if (me !== ftRun || !td.isConnected) return;
          let best = null;
          for (const f of td.dataset.from.split(',')) {
            const h = await trip(f, td.dataset.to);
            if (h && (!best || h < best.h)) best = { f, h };
          }
          const sp = td.querySelector('.sup-ft');
          if (!sp) continue;
          if (best) {
            sp.textContent = names[best.f] + ' ' + (best.h >= 48 ? (best.h / 24).toFixed(1) + ' d' : best.h + ' h');
            td.dataset.sort = best.h;
            td.title += '\nQuickest now: from ' + names[best.f] + ', ' + best.h + ' h (Light Transport, full tank, 2,000 t cargo)';
          } else sp.textContent = 'out of range';
        }
      })
      .catch(() => tds.forEach((td) => { const sp = td.querySelector('.sup-ft'); if (sp) sp.textContent = '?'; }));
  }
  function wireSupply(m) {
    supplyTimes(m);
    const b = m.querySelector('#supAll');
    if (b)
      b.onchange = () => {
        supAll = b.checked;
        try { localStorage.setItem('yic-sup-all', supAll ? '1' : '0'); } catch (e) {}
        APP.draw();
      };
  }

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
    // Map controls (community idea, Mark 15 Nov 2026 – TEST ONLY, ?beta=1): full screen, pause the turning, zoom
    // (buttons, or the mouse wheel while full screen so the page still scrolls normally).
    const MC = /[?&]beta=1\b/.test(location.search);
    if (MC) {
      box.classList.add('bm-box');
      if (!document.getElementById('bm-css')) {
        const st = document.createElement('style'); st.id = 'bm-css';
        st.textContent = '.bm-ctl{position:absolute;top:10px;right:6%;display:flex;gap:5px;z-index:3}' +
          '.bm-ctl button{all:unset;box-sizing:border-box;cursor:pointer;min-width:30px;height:28px;padding:0 7px;text-align:center;' +
          'font:bold 15px/28px system-ui,sans-serif;color:#8fe3ff;background:rgba(20,32,44,.85);border:1px solid #5fc3e4;border-radius:6px}' +
          '.bm-ctl button:hover,.bm-ctl button:focus-visible{background:#1d3346;box-shadow:0 0 10px -2px #5fc3e4}' +
          '.bm-ctl label{display:flex;align-items:center;gap:5px;height:28px;padding:0 9px;font:bold 13px system-ui,sans-serif;color:#8fe3ff;' +
          'background:rgba(20,32,44,.85);border:1px solid #5fc3e4;border-radius:6px;cursor:pointer;white-space:nowrap}' +
          '.bm-box:fullscreen{clip-path:none!important;border:0!important;border-radius:0!important;background:#05070a}' +
          '.bm-box:fullscreen canvas{height:100vh!important}.bm-box:fullscreen .bm-ctl{right:16px;top:14px}' +
          '.bm-card{position:absolute;left:6%;top:46px;z-index:3;min-width:190px;max-width:260px;padding:9px 30px 10px 12px;font-size:13px;line-height:1.45;' +
          'color:#e6ebf2;background:rgba(14,24,34,.92);border:1px solid #5fc3e4;border-radius:8px;box-shadow:0 0 18px -6px #5fc3e4}' +
          '.bm-card b{color:#8fe3ff;font-size:14px}.bm-card .bm-x{all:unset;cursor:pointer;position:absolute;right:8px;top:5px;color:#9aa8bb;font-size:15px}' +
          '.bm-card .bm-x:hover{color:#fff}.bm-card a{color:#8fe3ff}.bm-box:fullscreen .bm-card{left:16px;top:16px}';
        document.head.appendChild(st);
      }
      const c = document.createElement('div'); c.className = 'bm-ctl';
      c.innerHTML = '<label title="Show Adalia Prime on the map (same setting as Navigation)"><input type="checkbox" data-bm="ap"> Adalia Prime</label>' +
        '<button type="button" data-bm="out" title="Zoom out">−</button><button type="button" data-bm="in" title="Zoom in">+</button>' +
        '<button type="button" data-bm="pause" title="Pause the turning">⏸</button><button type="button" data-bm="fs" title="Full screen">⛶</button>';
      box.appendChild(c);
      const cd = document.createElement('div'); cd.className = 'bm-card'; cd.hidden = true;
      box.appendChild(cd);
    }
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
        let apL = [],
          sel = null,
          zf = 1,
          paused = false,
          az = 0.6,
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
          const s = ((Math.min(W, H * 1.6) * 0.46) / R) * zf,
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
          apL.forEach((a) => {
            const q = proj(a.p);
            if (sel === a.id) {
              ctx.strokeStyle = '#ffd24a';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(q[0], q[1], 11, 0, 6.283);
              ctx.stroke();
            }
            ctx.fillStyle = '#ffffff';
            ctx.save();
            ctx.translate(q[0], q[1]);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-5, -5, 10, 10);
            ctx.restore();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px system-ui,sans-serif';
            ctx.fillText(a.name, q[0] + 9, q[1] - 7);
          });
          me.forEach((a) => {
            const q = proj(a.p);
            if (sel === a.id) {
              ctx.strokeStyle = '#ffd24a';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(q[0], q[1], 10, 0, 6.283);
              ctx.stroke();
            }
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
          if (!drag && !calm && !paused) az += 0.0012;
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
          // drag the same way as the game (LIVE 4 Nov 2026, tested on ?beta=1 – Mark)
          az = drag.az - (e.clientX - drag.x) * 0.008;
          tilt = Math.max(0.15, Math.min(1.45, drag.tilt - (e.clientY - drag.y) * 0.006));
          if (calm) frame();
        });
        cv.addEventListener('pointerup', () => {
          drag = null;
        });
        cv.style.touchAction = 'none';
        cv.style.cursor = 'grab';
        if (MC) {
          const zoom = (k) => { zf = Math.max(1, Math.min(12, zf * k)); frame(); };
          const pb = box.querySelector('[data-bm="pause"]'), fb = box.querySelector('[data-bm="fs"]');
          box.querySelector('[data-bm="in"]').onclick = () => zoom(1.3);
          box.querySelector('[data-bm="out"]').onclick = () => zoom(1 / 1.3);
          pb.onclick = () => {
            paused = !paused;
            pb.textContent = paused ? '▶' : '⏸';
            pb.title = paused ? 'Start the turning again' : 'Pause the turning';
          };
          fb.onclick = () => {
            if (document.fullscreenElement === box) document.exitFullscreen();
            else if (box.requestFullscreen) box.requestFullscreen().catch(() => {});
          };
          document.addEventListener('fullscreenchange', () => {
            const on = document.fullscreenElement === box;
            fb.title = on ? 'Leave full screen (or press Esc)' : 'Full screen';
            requestAnimationFrame(() => { size(); frame(); });
          });
          cv.addEventListener('wheel', (e) => {
            if (document.fullscreenElement !== box) return;   // normal page scrolling when not full screen
            e.preventDefault();
            zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15);
          }, { passive: false });
          // Adalia Prime on the map (Mark, 15 Nov): a tick box, shared with Navigation's "Include Adalia Prime" (same saved setting)
          const APK = 'yic-travel-ap', apcb = box.querySelector('[data-bm="ap"]');
          const apOn = () => { try { return localStorage.getItem(APK) === '1'; } catch (e) { return false; } };
          const apDraw = () => {
            if (!apcb.checked) { apL = []; if (sel === 1) show(null); frame(); return; }
            (APP.apOrb ? Promise.resolve(APP.apOrb) : fetch('orbits.php?ids=1').then((r) => r.json())
              .then((j) => (APP.apOrb = j && j.orbits && j.orbits[1] && j.orbits[1].o))).then((o) => {
              if (!o || !apcb.checked) return;
              try { apL = [{ id: 1, name: 'Adalia Prime', p: P(o) }]; } catch (e) { apL = []; }
              frame();
            }).catch(() => {});
          };
          apcb.checked = apOn();
          apcb.onchange = () => { try { localStorage.setItem(APK, apcb.checked ? '1' : '0'); } catch (e) {} apDraw(); };
          // Select (Mark, 15 Nov): click one of your rocks → a small card; click empty space or ✕ to close.
          const card = box.querySelector('.bm-card');
          const show = (a) => {
            sel = a ? a.id : null;
            if (!a) { card.hidden = true; frame(); return; }
            const au = Math.hypot(a.p[0], a.p[1], a.p[2]);
            const gl = (window.GL && window.GL('/asteroids/' + a.id, 'Open this asteroid in the game')) ||
              ' <a href="https://game.influenceth.io/asteroids/' + a.id + '" target="influencegame" rel="noopener">Open in the game ↗</a>';
            card.innerHTML = '<button type="button" class="bm-x" title="Close">✕</button><b>' + APP.esc(a.name) + '</b><br>' +
              au.toFixed(2) + ' AU from the Adalia Star<br>' + gl;
            card.querySelector('.bm-x').onclick = () => show(null);
            card.hidden = false;
            frame();
          };
          let down = null;
          cv.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
          cv.addEventListener('pointerup', (e) => {
            if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) { down = null; return; }   // that was a drag
            down = null;
            const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
            let hit = null, bd = 14;
            me.concat(apL).forEach((a) => { const q = proj(a.p), d = Math.hypot(q[0] - x, q[1] - y); if (d < bd) { bd = d; hit = a; } });
            show(hit);
          });
          apDraw();
        }
      })
      .catch((e) => {
        const l = box.querySelector('.bm-load');
        if (l) l.textContent = 'Could not draw the map (' + ((e && e.message) || e) + ').';
      });
  }

  // Shared with The Bridge (Today's Workload) for its viewport
  window.YICbeltMap = beltMap;

  window.PAGES = window.PAGES || {};
  // Asteroids › Supply chain (view 'E') – own page
  window.PAGES.E = function (m) {
    const h = supplyHTML();
    m.innerHTML = h || '<div class="note">You need at least two asteroids to compare.</div>';
    wireSupply(m);
  };
  window.PAGES.A = function (m) {
    drawAsteroids(m);
    if (!window.YICDECKS) beltMap(m); // decks: the Science Lab rack replaces the system map
  };
})();
