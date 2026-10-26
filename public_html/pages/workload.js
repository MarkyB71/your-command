/* Today's Workload – Your Influence Command
   One file per page (started 2026-10-18). The landing page: tiles with counts, then sections for things that need you
   (ready to collect, materials at risk, waiting to accept, leases, construction, idle buildings,
   storage nearly full, hungry crews, ships low on propellant). Tiles count up and red ones pulse.
   APP = window.YIC: shared data, helpers and page state that still live in app.js
   (Today's Workload and other pages use some of them too). */
(function () {
  'use strict';
  // window.YIC is only set once app.js has loaded your data, so look it up each time
  const APP = new Proxy({}, { get: (_, k) => window.YIC[k], set: (_, k, v) => ((window.YIC[k] = v), true) });

  function drawAlerts(m) {
    const ai = APP.$('#ast').value,
      an = ai === '' ? null : APP.asts[+ai].name,
      q = APP.$('#q').value.trim().toLowerCase(),
      now = Date.now() / 1000;
    const when = (t) =>
      new Date(t * 1000).toLocaleString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    const astOf = (b) => {
      const l = ((b.Location && b.Location.locations) || []).find((x) => x.label === 3);
      return (b.meta && b.meta.asteroid && b.meta.asteroid.name) || (l ? 'Asteroid #' + l.id : '?');
    };
    const okA = (a) => !an || a === an,
      okQ = (...t) =>
        !q ||
        t.some((v) =>
          String(v || '')
            .toLowerCase()
            .includes(q),
        );
    const S = {
      collect: [],
      risk: [],
      accept: [],
      lease: [],
      build: [],
      idle: [],
      store: [],
      food: [],
      prop: [],
    };
    const plan = {};
    let planX = 0;
    const add = (k, r) => {
      if (okA(r.a) && okQ(r.name, r.type, r.crew, r.a, r.what)) S[k].push(r);
    };
    (APP.D.allB || []).forEach((b) => {
      const B = b.Building || {},
        st = B.status,
        a = astOf(b),
        bt = B.buildingType,
        type = APP.BT[bt] || 'Building',
        name = (b.Name && b.Name.name) || type + ' #' + b.id,
        crew = (APP.D.crewN || {})[b.Control && b.Control.controller && b.Control.controller.id] || '';
      const r = (lvl, what, t) => ({ lvl, what, t: t || 0, a, name, type, crew, pic: type, gp: '/building/' + b.id });
      if (st === 2) {
        if (B.finishTime && B.finishTime <= now)
          add('build', r(2, 'Construction finished – ready to complete', B.finishTime));
        else
          add(
            'build',
            r(
              0,
              'Being built – done ' +
                (B.finishTime ? when(B.finishTime) + ' (' + APP.tLeft(B.finishTime, now) + ')' : 'soon'),
              B.finishTime,
            ),
          );
        return;
      }
      if (st === 1) {
        const xp = B.plannedAt && B.plannedAt + 172800 <= now;
        if (okA(a) && okQ(name, type, crew, a, 'planned')) {
          plan[a] = (plan[a] || 0) + 1;
          if (xp) planX++;
        }
        if (xp) {
          const c = [];
          (b.Inventories || []).forEach((i) =>
            (i.contents || []).forEach((x) => {
              if (x && x.amount > 0)
                c.push(APP.pn(String(x.product)) + ' ' + APP.fq(String(x.product), x.amount));
            }),
          );
          if (c.length)
            add(
              'risk',
              r(2, c.join(', ') + ' – reservation ran out ' + when(B.plannedAt + 172800), B.plannedAt),
            );
        }
        return;
      }
      if (st !== 3) return;
      if ([2, 3, 4, 5, 6].includes(bt)) {
        let busy = false;
        (b.Extractors || []).forEach((e) => {
          if (e.status !== 1) return;
          busy = true;
          if (e.finishTime <= now)
            add('collect', r(2, 'Extracting ' + APP.pn(e.outputProduct) + ' – finished', e.finishTime));
        });
        (b.Processors || []).forEach((p) => {
          if (p.status !== 1) return;
          busy = true;
          if (p.finishTime <= now) {
            const pr = APP.PROCN[p.runningProcess];
            add('collect', r(2, (pr ? pr[0] : 'Process') + ' – finished', p.finishTime));
          }
        });
        (b.DryDocks || []).forEach((d) => {
          if (d.status !== 1) return;
          busy = true;
          if (d.finishTime <= now) add('collect', r(2, 'Ship assembly – finished', d.finishTime));
        });
        if (!busy) add('idle', r(1, 'Nothing running'));
      } else if ([1, 10].includes(bt)) {
        const inv = (b.Inventories || []).find((i) => APP.SCAP[i.inventoryType]);
        if (!inv) return;
        const c = APP.SCAP[inv.inventoryType],
          f = Math.max((inv.mass || 0) / c[0], (inv.volume || 0) / c[1]);
        if (f >= 0.75)
          add(
            'store',
            r(
              f >= 0.9 ? 2 : 1,
              Math.round(f * 100) +
                '% full – ' +
                APP.fmtT((inv.mass || 0) / 1e6) +
                ' of ' +
                APP.fmtT(c[0] / 1e6),
              f,
            ),
          );
      }
    });
    (APP.D.crewList || []).forEach((c) => {
      if (!c.mates || c.food == null || c.food >= 0.65) return;
      add('food', {
        lvl: c.food < 0.5 ? 2 : 1,
        what: 'Food at ' + Math.round(c.food * 100) + '%' + (c.food < 0.5 ? ' – crew is slowed down' : ''),
        t: -c.food,
        a: c.ast,
        name: c.name,
        type: 'Crew',
        gp: '/crew/' + c.id,
        crew: c.mates + ' crewmate' + (c.mates > 1 ? 's' : ''),
      });
    });
    {
      const g = {};
      S.idle.forEach((x) => {
        const k = x.a + '|' + x.type;
        (g[k] = g[k] || { lvl: 1, t: 0, a: x.a, type: x.type, n: [], gp: [], crew: new Set() }).n.push(x.name);
        g[k].gp.push(x.gp);
        if (x.crew) g[k].crew.add(x.crew);
      });
      // Each idle building gets its own "in game" link (beta first)
      const one = (x, i) => APP.esc(x.n[i]) + (x.gp[i] && window.GL ? window.GL(x.gp[i], 'Open in the game') : '');
      S.idle = Object.values(g).map((x) => ({
        lvl: 1,
        t: -x.n.length,
        a: x.a,
        type: x.type,
        pic: x.type,
        what: x.n.length + ' ' + x.type + (x.n.length > 1 ? 's' : '') + ' with nothing running',
        name: x.type,
        html:
          x.n.length > 1
            ? '<details><summary style="cursor:pointer">' +
              x.n.length +
              ' ' +
              APP.esc(x.type) +
              's</summary><div class="a" style="white-space:normal;max-width:420px">' +
              x.n.map((_, i) => '<div>' + one(x, i) + '</div>').join('') +
              '</div></details>'
            : one(x, 0),
        crew: [...x.crew].join(', '),
        cnt: x.n.length,
      }));
      // One row per asteroid, click to open types, then buildings
      {
        const A = {};
        Object.values(g).forEach((x) => (A[x.a] = A[x.a] || []).push(x));
        S.idle = Object.entries(A).map(([a, L]) => {
          L.sort((x, y) => y.n.length - x.n.length);
          const n = L.reduce((k, x) => k + x.n.length, 0),
            pl = (x) => x.n.length + ' ' + APP.esc(x.type) + (x.n.length > 1 ? 's' : ''),
            crew = new Set();
          L.forEach((x) => x.crew.forEach((c) => crew.add(c)));
          return {
            lvl: 1,
            t: -n,
            a,
            type: '',
            what: n + ' building' + (n > 1 ? 's' : '') + ' with nothing running',
            name: a,
            html:
              '<details><summary style="cursor:pointer;white-space:normal">' +
              L.map(pl).join(' · ') +
              '</summary><div style="padding:6px 0 0 14px">' +
              L.map(
                (x) =>
                  '<details style="margin:4px 0"><summary style="cursor:pointer">' +
                  APP.bthumb(x.type, 32, 24) +
                  ' ' +
                  pl(x) +
                  '</summary><div class="a" style="white-space:normal;max-width:420px;padding-left:18px">' +
                  x.n.map((_, i) => '<div>' + one(x, i) + '</div>').join('') +
                  '</div></details>',
              ).join('') +
              '</div></details>',
            crew: [...crew].join(', '),
            cnt: n,
          };
        });
      }
    }
    // Storage nearly full – one row per asteroid, click to see the buildings
    if (S.store.length) {
      const A = {};
      S.store.forEach((x) => (A[x.a] = A[x.a] || []).push(x));
      S.store = Object.entries(A).map(([a, L]) => {
        L.sort((x, y) => y.t - x.t);
        const n = L.length,
          red = L.filter((x) => x.lvl === 2).length,
          crew = new Set(L.map((x) => x.crew).filter(Boolean));
        return {
          lvl: red ? 2 : 1,
          t: -n,
          a,
          type: '',
          what:
            n +
            ' storage building' +
            (n > 1 ? 's' : '') +
            ' 75% full or more' +
            (red ? ' (' + red + ' over 90%)' : ''),
          name: a,
          html:
            '<details><summary style="cursor:pointer">' +
            n +
            ' building' +
            (n > 1 ? 's' : '') +
            '</summary><div style="padding:6px 0 0 14px">' +
            L.map(
              (x) =>
                '<div style="margin:4px 0">' +
                (x.pic ? APP.bthumb(x.pic, 32, 24) + ' ' : '') +
                APP.esc(x.name || '') +
                (x.gp && window.GL ? window.GL(x.gp, 'Open in the game') : '') +
                ' <span class="a">· ' +
                APP.esc(x.what) +
                '</span></div>',
            ).join('') +
            '</div></details>',
          crew: [...crew].join(', '),
          cnt: n,
        };
      });
    }
    APP.leaseInfo().forEach((x) => {
      if (x.st === 'ok') return;
      add('lease', {
        lvl: x.st === 'soon' ? 1 : 2,
        what:
          x.st === 'none'
            ? 'No lease – owner can seize it'
            : x.left <= 0
              ? 'Lease ended ' + Math.floor(-x.left / 86400) + ' days ago – owner can seize it'
              : 'Lease ends in ' + APP.tLeft(x.end, Date.now() / 1000),
        t: x.end,
        a: x.a,
        name:
          'Lot #' + x.lot.toLocaleString() + (x.b.length ? ' · ' + x.b.map((b) => b.name).join(', ') : ''),
        type: 'Lot',
        crew: x.crew,
        gp: '/lot/' + x.id,
      });
    });
    
    {
      if (!APP.DLV && !APP.dlvLoad)
        APP.dlvLoad = fetch('deliveries.php?wallet=' + encodeURIComponent(APP.D.wallet || ''), {
          cache: 'no-store',
        })
          .then((r) => r.json())
          .then((j) => {
            if (j.error) throw new Error(j.error);
            APP.DLV = j;
          })
          .catch((e) => {
            APP.DLV = { err0: (e && e.message) || 'error' };
          })
          .finally(() => {
            APP.dlvLoad = null;
            if (APP.view === 'N' || APP.view === 'V') APP.draw();
          });
      if (APP.DLV && !APP.DLV.err0) {
        const bI = {};
        (APP.D.allB || []).forEach((b) => {
          bI[b.id] = b;
        });
        const sI = {};
        (APP.D.ships || []).forEach((s) => {
          sI[s.id] = s;
        });
        const nm = (e) => {
          if (e[0] === 5) {
            const b = bI[e[1]];
            if (!b) return ['Building #' + e[1], '', 'Building'];
            const ty = APP.BT[b.Building && b.Building.buildingType] || 'Building';
            return [(b.Name && b.Name.name) || ty + ' #' + e[1], astOf(b), ty];
          }
          const s = sI[e[1]];
          return s ? [s.name, s.ast || '', 'Ship'] : ['Ship #' + e[1], '', 'Ship'];
        };
        (APP.DLV.pending || []).forEach((r) => {
          if (!r[4][3]) return;
          const [n, a, ty] = nm(r[4]);
          add('accept', {
            lvl: 1,
            what:
              (r[5] || []).map(([p, x]) => APP.pn(String(p)) + ' ' + APP.fq(String(p), x)).join(', ') ||
              'Delivery',
            t: r[2] || 0,
            a,
            name: n,
            type: ty,
            crew: r[3][3] ? 'You (' + nm(r[3])[0] + ')' : 'Another player',
            pic: ty === 'Ship' ? '' : ty,
            ship: ty === 'Ship' ? 1 : 0,
            gp: (r[4][0] === 6 ? '/ship/' : '/building/') + r[4][1],
          });
        });
      }
    }
    const TANK = { 2: 4000, 3: 24000, 4: 2000 };
    (APP.D.ships || []).forEach((s) => {
      const tk = TANK[s.st];
      if (!tk) return;
      const f = (s.prop || 0) / tk;
      if (f >= 0.25) return;
      add('prop', {
        lvl: f < 0.1 ? 2 : 1,
        what:
          'Propellant ' + APP.fmtT(s.prop || 0) + ' of ' + APP.fmtT(tk) + ' (' + Math.round(f * 100) + '%)',
        t: f,
        a: s.ast || '',
        name: s.name,
        type: s.type,
        crew: (APP.D.crewN || {})[s.crewId] || '',
        ship: 1,
        gp: '/ship/' + s.id,
      });
    });
    const SEC = [
      ['collect', 'Ready to collect', 'Finished jobs waiting for you to collect the output.'],
      [
        'risk',
        'Materials at risk',
        'Planned building sites whose 2-day reservation has run out, with materials still on them. The game makes materials on an expired site public. Start construction or move them out.',
      ],
      ...[
            [
              'accept',
              'Waiting to accept',
              'Deliveries sent to you. Accept them in the game so the goods go into storage.',
            ],
          ],
      [
        'lease',
        'Leases with less than 30 days',
        'Lots under your buildings where the lease has ended or ends within 30 days. If a lease runs out, the asteroid owner can seize the building and its stock.',
      ],
      ['build', 'Construction', 'Buildings being built, or finished and waiting for you to complete them.'],
      [
        'idle',
        'Idle buildings',
        'Production buildings with nothing running, one row per asteroid. Click a row to see the types, then click a type to see the buildings.',
      ],
      ['store', 'Storage nearly full', 'Warehouses and tank farms 75% full or more.'],
      [
        'food',
        'Crews low on food',
        'Crews with crewmates whose food is under 65%. Below 50% they work more slowly.',
      ],
      ['prop', 'Ships low on propellant', 'Ships with less than a quarter of a tank.'],
    ];
    // Idle buildings: count buildings (not groups) + asteroids (beta first)
    const cnt = (k) => S[k].reduce((n, x) => n + (x.cnt || 1), 0);
    const COL = { 2: '#ff7a7a', 1: '#fab219', 0: '#5fc3e4' },
      dot = (l) =>
        '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' +
        COL[l] +
        ';margin-right:7px;vertical-align:middle"></span>';
    const total = SEC.reduce((n, [k]) => n + S[k].length, 0),
      pk = Object.keys(plan).sort(),
      pn_ = pk.reduce((n, k) => n + plan[k], 0);
    const planH = pn_
      ? '<div class="note" style="padding:14px 0 0">Not counted above: ' +
        pn_ +
        ' planned building site' +
        (pn_ > 1 ? 's' : '') +
        ' not started yet' +
        (planX ? ' (' + planX + ' past the 2-day reservation)' : '') +
        ' – ' +
        pk.map((k) => APP.esc(k) + ' ' + plan[k]).join(', ') +
        '.</div>'
      : '';
    let h =
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px">' +
      SEC.map(([k, t]) => {
        const n = cnt(k),
          hi = S[k].some((x) => x.lvl === 2);
        return (
          '<a href="#al-' +
          k +
          '" style="text-decoration:none;flex:1 1 140px;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:#0f141c;color:inherit"><div style="font-size:22px;font-weight:600;color:' +
          (n ? (hi ? COL[2] : COL[1]) : '#4cd04c') +
          '">' +
          n +
          '</div><div class="a" style="font-size:12px">' +
          t +
          '</div></a>'
        );
      }).join('') +
      '</div>';
    if (!total) {
      m.innerHTML = h + '<div class="note">Nothing needs your attention right now.</div>' + planH;
      return;
    }
    SEC.forEach(([k, t, d]) => {
      const L = S[k];
      if (!L.length) return;
      L.sort(
        (x, y) =>
          y.lvl - x.lvl ||
          x.t - y.t ||
          x.a.localeCompare(y.a) ||
          String(x.name).localeCompare(String(y.name)),
      );
      h +=
        '<h2 id="al-' +
        k +
        '">' +
        t +
        ' <span class="a" style="font-size:14px;font-weight:400">(' +
        (k === 'idle'
          ? cnt(k) +
            ' on ' +
            new Set(L.map((x) => x.a)).size +
            ' asteroid' +
            (new Set(L.map((x) => x.a)).size > 1 ? 's' : '')
          : cnt(k)) +
        ')</span></h2><div class="note" style="padding:0 0 8px">' +
        d +
        '</div><div class="wrap"><table><thead><tr><th>' +
        ({
          collect: 'Resource',
          risk: 'Materials on site',
          accept: 'Resource',
          lease: 'Lease',
          build: 'Progress',
          idle: 'Type',
          store: 'Space used',
          food: 'Food level',
          prop: 'Propellant left',
        }[k] || 'What') +
        '</th><th>' +
        (k === 'food'
          ? 'Crew'
          : k === 'risk'
            ? 'Site'
            : k === 'accept'
              ? 'Delivered to'
              : k === 'prop'
                ? 'Ship'
                : k === 'lease'
                  ? 'Lot'
                  : 'Building') +
        '</th><th>Asteroid</th><th>' +
        (k === 'food'
          ? 'Size'
          : k === 'accept'
            ? 'Sent by'
            : k === 'lease'
              ? 'Leased by'
              : k === 'prop'
                ? 'Ship owner'
                : 'Building owner') +
        '</th></tr></thead><tbody>' +
        L.map(
          (x) =>
            '<tr><td style="white-space:normal">' +
            dot(x.lvl) +
            APP.esc(x.what) +
            '</td><td>' +
            (x.pic ? APP.bthumb(x.pic, 48, 36) : '') +
            (x.html ||
              APP.esc(x.name || '') +
                (x.pic || x.ship ? ' <span class="a">· ' + APP.esc(x.type) + '</span>' : '')) +
            (x.gp && window.GL ? window.GL(x.gp, 'Open in the game') : '') +
            '</td><td class="cls">' +
            APP.esc(x.a || '') +
            '</td><td class="cls">' +
            APP.esc(x.crew || '') +
            '</td></tr>',
        ).join('') +
        '</tbody></table></div>';
    });
    h +=
      '<div class="note" style="padding:14px 0 0">Red = act now, amber = soon, blue = for information. Storage uses the standard sizes; crew bonuses aren\'t included. Food uses the same estimate as the Crews page.</div>';
    m.innerHTML = h + planH;
  }

  function animTiles(m) {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!document.getElementById('al-anim-css')) {
      const s = document.createElement('style');
      s.id = 'al-anim-css';
      s.textContent =
        '@keyframes alPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,122,122,0)}50%{box-shadow:0 0 16px 2px rgba(255,122,122,.35)}}.al-hot{animation:alPulse 2.4s ease-in-out infinite;border-color:rgba(255,122,122,.55)!important}';
      document.head.appendChild(s);
    }
    const tiles = [...m.querySelectorAll('a[href^="#al-"]')],
      t0 = performance.now(),
      dur = 900;
    const nums = tiles.map((a) => {
      const d = a.firstElementChild,
        n = +d.textContent || 0;
      if (getComputedStyle(d).color === 'rgb(255, 122, 122)') a.classList.add('al-hot');
      d.textContent = '0';
      return [d, n];
    });
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur),
        e = 1 - Math.pow(1 - k, 3);
      nums.forEach(([d, n]) => {
        if (d.isConnected) d.textContent = String(Math.round(n * e));
      });
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ---- The Bridge (ship command look) – test on ?beta=1 first ----
  const BRG = /[?&]beta=1/.test(location.search);
  const DECKS = [
    { k: 'S', name: 'Flight Deck', ico: '🚀', col: '#5b9dff' },
    { k: 'C', name: 'Crew Quarters', ico: '👥', col: '#3fd68a' },
    { k: 'H', alt: 'P', name: 'Engineering', ico: '🏭', col: '#ffab3d' },
    { k: 'K', name: 'Trade Deck', ico: '💰', col: '#ffd24a' },
  ];
  const BR_CSS = `
.br{margin:0 0 18px}
.br-vp{position:relative;border-radius:18px;padding:10px;background:linear-gradient(180deg,#1b2430,#0c1118);border:1px solid #2c3a4c;box-shadow:inset 0 0 0 2px #070a0f,0 0 24px rgba(91,157,255,.12)}
.br-vp>div{border-radius:12px!important;border-color:#26364a!important;margin:0!important}
.br-vp canvas{height:clamp(220px,34vw,360px)!important}
.br-glass{position:absolute;inset:10px;border-radius:12px;pointer-events:none;background:linear-gradient(115deg,rgba(255,255,255,.07) 0%,rgba(255,255,255,0) 28%,rgba(255,255,255,0) 70%,rgba(255,255,255,.04) 100%)}
.br-strut{position:absolute;top:10px;bottom:10px;width:6px;background:linear-gradient(90deg,#0a0e14,#1e2836,#0a0e14);pointer-events:none;box-shadow:0 0 6px rgba(0,0,0,.6)}
.br-plate{position:absolute;left:50%;top:-1px;transform:translateX(-50%);padding:3px 18px 4px;background:#0c1118;border:1px solid #2c3a4c;border-top:0;border-radius:0 0 10px 10px;font:600 12px/1.2 system-ui,sans-serif;letter-spacing:.32em;color:#8fe3ff;text-shadow:0 0 8px rgba(91,195,228,.6);pointer-events:none;z-index:2}
.br-rv{position:absolute;width:6px;height:6px;border-radius:50%;background:#2c3a4c;box-shadow:inset 0 1px 1px rgba(255,255,255,.15)}
.br-con{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:-6px;padding:0 6px}
.br-p{all:unset;box-sizing:border-box;cursor:pointer;position:relative;display:block;padding:14px 14px 12px;border-radius:0 0 12px 12px;background:linear-gradient(180deg,#141c26,#0b1017);border:1px solid #243041;border-top:3px solid var(--dc);box-shadow:0 -6px 18px -8px var(--dc),inset 0 1px 0 rgba(255,255,255,.04);transition:transform .15s,box-shadow .15s}
.br-p:hover,.br-p:focus-visible{transform:translateY(-2px);box-shadow:0 -8px 26px -6px var(--dc),0 0 18px -4px var(--dc),inset 0 1px 0 rgba(255,255,255,.06)}
.br-h{display:flex;align-items:center;gap:8px;font:700 13px/1.2 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--dc)}
.br-led{margin-left:auto;width:8px;height:8px;border-radius:50%;background:var(--dc);box-shadow:0 0 8px var(--dc);animation:brLed 2.6s ease-in-out infinite}
.br-n{font:700 34px/1.1 ui-monospace,Menlo,monospace;color:#e6ebf2;margin:10px 0 2px;text-shadow:0 0 12px rgba(230,235,242,.15)}
.br-l{font-size:14px;color:#c4cdd9}
.br-s{font-size:13px;color:#8b9ab0;margin-top:6px;min-height:18px}
.br-s b{color:#ff7a7a;font-weight:600}
.br-go{margin-top:10px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--dc);opacity:.85}
@keyframes brLed{0%,100%{opacity:1}50%{opacity:.35}}
@media (prefers-reduced-motion:reduce){.br-led{animation:none}.br-p{transition:none}}
`;
  function bridgeNums() {
    const D = APP.D || {},
      now = Date.now() / 1000;
    const ships = D.ships || [],
      TANK = { 2: 4000, 3: 24000, 4: 2000 };
    const fly = ships.filter((s) => s.fl).length,
      lowP = ships.filter((s) => TANK[s.st] && (s.prop || 0) / TANK[s.st] < 0.25).length;
    const crews = (D.crewList || []).filter((c) => c.mates),
      hungry = crews.filter((c) => c.food != null && c.food < 0.5).length;
    let run = 0,
      ready = 0,
      idle = 0;
    (D.allB || []).forEach((b) => {
      const B = b.Building || {};
      if (B.status !== 3 || ![2, 3, 4, 5, 6].includes(B.buildingType)) return;
      let busy = false;
      [].concat(b.Extractors || [], b.Processors || [], b.DryDocks || []).forEach((x) => {
        if (x.status !== 1) return;
        busy = true;
        if (x.finishTime <= now) ready++;
        else run++;
      });
      if (!busy) idle++;
    });
    const ords = (D.orders || []).length;
    const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
    return {
      S: [fly, fly === 1 ? 'ship in flight' : 'ships in flight', pl(ships.length, 'ship') + ' in your fleet', lowP ? pl(lowP, 'ship') + ' low on propellant' : ''],
      C: [crews.length, crews.length === 1 ? 'crew on duty' : 'crews on duty', '', hungry ? hungry + ' hungry' : 'all crews fed'],
      H: [run, run === 1 ? 'job running' : 'jobs running', pl(idle, 'idle building'), ready ? ready + ' ready to collect' : ''],
      K: [ords, ords === 1 ? 'open listing' : 'open listings', 'Market · Trade finder · History', ''],
    };
  }
  function drawBridge(m) {
    if (!document.getElementById('br-css')) {
      const st = document.createElement('style');
      st.id = 'br-css';
      st.textContent = BR_CSS;
      document.head.appendChild(st);
    }
    const N = bridgeNums(),
      br = document.createElement('div');
    br.className = 'br';
    br.innerHTML =
      '<div class="br-vp"><div class="br-plate">THE BRIDGE</div><div class="br-glass"></div>' +
      '<div class="br-strut" style="left:33%"></div><div class="br-strut" style="left:67%"></div>' +
      '<i class="br-rv" style="left:4px;top:4px"></i><i class="br-rv" style="right:4px;top:4px"></i><i class="br-rv" style="left:4px;bottom:4px"></i><i class="br-rv" style="right:4px;bottom:4px"></i></div>' +
      '<div class="br-con">' +
      DECKS.map((d) => {
        const n = N[d.k];
        return (
          '<button type="button" class="br-p" data-dk="' + d.k + '"' + (d.alt ? ' data-alt="' + d.alt + '"' : '') +
          ' style="--dc:' + d.col + '"><div class="br-h"><span>' + d.ico + '</span>' + APP.esc(d.name) + '<i class="br-led"></i></div>' +
          '<div class="br-n">' + n[0] + '</div><div class="br-l">' + APP.esc(n[1]) + '</div>' +
          '<div class="br-s">' + (n[3] && /low|hungry|ready/.test(n[3]) && !/all crews/.test(n[3]) ? '<b>' + APP.esc(n[3]) + '</b>' : APP.esc(n[3])) +
          (n[2] ? (n[3] ? ' · ' : '') + APP.esc(n[2]) : '') + '</div><div class="br-go">Enter deck ▸</div></button>'
        );
      }).join('') +
      '</div>';
    m.prepend(br);
    const vp = br.querySelector('.br-vp');
    if (window.YICbeltMap) {
      window.YICbeltMap(vp);
      const lab = vp.querySelector('canvas + .a');
      if (lab) lab.textContent = 'Viewport · the Adalia system right now · your rocks in blue · drag to turn';
      // keep the frame bits on top of the map
      vp.querySelectorAll('.br-glass,.br-strut,.br-plate,.br-rv').forEach((e) => vp.appendChild(e));
    }
    br.querySelectorAll('.br-p').forEach((b) =>
      b.addEventListener('click', () => {
        const t = document.getElementById('v' + b.dataset.dk) || (b.dataset.alt && document.getElementById('v' + b.dataset.alt));
        if (t) {
          t.click();
          scrollTo(0, 0);
        }
      }),
    );
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.N = function (m) {
    drawAlerts(m);
    animTiles(m);
    if (BRG) drawBridge(m);
  };
})();
