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

  // ---- The Bridge (ship command look) – LIVE for everyone 27 Oct 2026 ----
  const DECKS = [
    // colours match the deck tabs / game crew classes (Mark, 27 Oct)
    { k: 'S', id: 'flight', name: 'Flight Deck', role: 'Helm', col: '#9a6bff', ry: 15 },
    { k: 'C', id: 'crew', name: 'Crew Quarters', role: 'Personnel', col: '#3fd68a', ry: 11 },
    { k: 'A', id: 'sci', name: 'Science Lab', role: 'Science', col: '#4f90ff', ry: 7 },
    { k: 'H', id: 'eng', alt: 'P', name: 'Engineering', role: 'Production', col: '#e8645a', ry: -7 },
    { k: 'K', id: 'trade', name: 'Trade Deck', role: 'Commerce', col: '#ffd24a', ry: -11 },
  ];
  // The SkippyChain gets its own gold console in front of the captain's chair (Mark, 29 Oct). Beta test.
  const PCB = /[?&]beta=1/.test(location.search);
  if (PCB) Object.assign(DECKS[3], { k: 'P', alt: '' });
  const PC_CSS = `
.brs-mid{align-self:end;display:flex;flex-direction:column;align-items:center;gap:8px;min-width:0;padding-bottom:22px}
.brs-deck:has(.brs-mid){grid-template-columns:1fr 1fr 1fr .85fr 1fr 1fr 1fr}
.brs-pc{all:unset;box-sizing:border-box;cursor:pointer;display:block;width:100%;min-width:0;padding:8px 6px 9px;text-align:center;border-radius:8px 8px 3px 3px;border:1px solid #6b5a1e;border-top:2px solid #ffd24a;background:linear-gradient(180deg,rgba(255,210,74,.12),rgba(0,0,0,.35));box-shadow:0 0 18px -6px #ffd24a,inset 0 0 22px -10px #ffd24a;transform:perspective(500px) rotateX(18deg);transition:box-shadow .2s,transform .2s}
.brs-pc:hover,.brs-pc:focus-visible{box-shadow:0 0 26px -2px #ffd24a,inset 0 0 26px -8px #ffd24a;transform:perspective(500px) rotateX(10deg) translateY(-2px)}
.brs-pc b{display:block;font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#ffd24a;text-shadow:0 0 8px rgba(255,210,74,.6)}
.brs-pc span{display:block;font-size:12px;color:#c4cdd9;margin-top:3px}
.brs-pc i{display:block;font:normal 700 10px/1 system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#ffd24a;margin-top:6px;opacity:.85}
@media (max-width:760px){.brs-deck:has(.brs-mid){grid-template-columns:1fr 1fr}.brs-mid{grid-column:1/-1;order:5;padding-bottom:0}.brs-pc{max-width:240px}.brs-mid .brs-chair{order:0}}
@media (prefers-reduced-motion:reduce){.brs-pc{transition:none}}
`;
  const BR_CSS = `
.brs{position:relative;margin:0 0 22px;border-radius:14px;overflow:hidden;background:#04060a;border:1px solid #1d2734;box-shadow:0 0 40px rgba(0,0,0,.6) inset}
.brs-bg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.brs-vs{position:relative;z-index:1;width:84%;margin:26px auto 0;padding:7px;background:linear-gradient(180deg,#2a3646,#121a24);clip-path:polygon(3% 0,97% 0,100% 12%,100% 100%,0 100%,0 12%);box-shadow:0 0 30px rgba(91,195,228,.2)}
.brs-vs>div{margin:0!important;border:0!important;border-radius:0!important;clip-path:polygon(3% 0,97% 0,100% 12%,100% 100%,0 100%,0 12%)}
.brs-vs canvas{height:clamp(200px,30vw,340px)!important}
.brs-vs .a{left:50%!important;transform:translateX(-50%);top:auto!important;bottom:6px;white-space:nowrap;opacity:.7}
.brs-plate{position:absolute;z-index:2;left:50%;top:7px;transform:translateX(-50%);padding:3px 22px 4px;background:#0c1118;clip-path:polygon(0 0,100% 0,92% 100%,8% 100%);font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.4em;color:#8fe3ff;text-shadow:0 0 8px rgba(91,195,228,.7);pointer-events:none}
.brs-deck{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr 1fr .7fr 1fr 1fr 1fr;gap:10px;align-items:end;padding:22px 4% 0;perspective:1100px}
.st{all:unset;box-sizing:border-box;cursor:pointer;display:block;transform:rotateY(var(--ry)) rotateX(18deg);transform-origin:50% 100%;transition:transform .2s,filter .2s}
.st:hover,.st:focus-visible{transform:rotateY(var(--ry)) rotateX(8deg) translateY(-4px);filter:drop-shadow(0 0 14px var(--dc))}
.st-scr{display:block;position:relative;padding:10px 12px 10px;border-radius:8px 8px 2px 2px;background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(0,0,0,.2)),repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px),#0a1119;border:2px solid #2a3646;border-top:3px solid var(--dc);box-shadow:0 0 16px -6px var(--dc),inset 0 0 22px -10px var(--dc)}
.st-h{display:flex;align-items:center;gap:6px;font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--dc)}
.st-led{margin-left:auto;width:7px;height:7px;border-radius:50%;background:var(--dc);box-shadow:0 0 8px var(--dc);animation:brLed 2.6s ease-in-out infinite}
.st-r{display:block;font:600 10px/1.2 system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#5d6b7e;margin-top:2px}
.st-n{display:block;font:700 30px/1.1 ui-monospace,Menlo,monospace;color:#e6ebf2;margin:8px 0 0;text-shadow:0 0 10px var(--dc)}
.st-l{display:block;font-size:13px;color:#c4cdd9}
.st-s{display:block;font-size:12px;color:#8b9ab0;margin-top:5px;min-height:16px}
.st-s b{color:#ff7a7a;font-weight:600}
.st-go{display:block;margin-top:8px;font:700 10px/1 system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:var(--dc)}
.st-base{display:flex;justify-content:center;gap:5px;height:22px;align-items:center;margin:0 -6px;background:linear-gradient(180deg,#1f2a38,#0d131b);clip-path:polygon(0 0,100% 0,94% 100%,6% 100%)}
.st-base i{width:12px;height:5px;border-radius:2px;background:var(--dc);opacity:.35}
.st-base i:nth-child(2){opacity:.8;box-shadow:0 0 6px var(--dc)}
.brs-chair{all:unset;box-sizing:border-box;cursor:pointer;align-self:end;display:flex;flex-direction:column;align-items:center;gap:2px;transition:filter .2s}
.brs-chair:hover,.brs-chair:focus-visible,.brs-chair.on{filter:drop-shadow(0 0 12px rgba(143,227,255,.55))}
.brs-cl{font:700 10px/1.2 system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#8fe3ff;opacity:.75;text-align:center}
.brs-chair.on .brs-cl{opacity:1;text-shadow:0 0 8px #8fe3ff}
.brs-log{position:relative;height:clamp(320px,52vh,600px);overflow:auto;padding:30px 16px 14px;clip-path:polygon(3% 0,97% 0,100% 12%,100% 100%,0 100%,0 12%);background:repeating-linear-gradient(0deg,rgba(143,227,255,.03) 0 1px,transparent 1px 3px),radial-gradient(ellipse at 50% 0,#0d1825,#05080d 75%);font-size:13px;scrollbar-color:#2c3a4c transparent}
.brs-log h2{font-size:16px!important;color:#8fe3ff;letter-spacing:.04em}
.brs-log .note{font-size:12px}
.brs-cw{position:relative;display:block;width:100%;max-width:170px}
.brs-sk{position:absolute;left:34.3%;top:14.7%;width:32.9%;height:37.3%;object-fit:cover;border-radius:6px 6px 2px 2px;box-shadow:0 0 10px rgba(143,227,255,.35)}
.brs-chair svg{display:block;width:100%;max-width:170px;height:auto;filter:drop-shadow(0 0 10px rgba(143,227,255,.18))}
.brs-floor{position:relative;z-index:0;height:26px;margin-top:-2px;background:radial-gradient(ellipse at 50% 0,rgba(91,195,228,.18),transparent 70%)}
.st.off{cursor:default;pointer-events:none;filter:saturate(.3) brightness(.7)}
.st.wpn{cursor:default}.st.wpn:hover{transform:rotateY(var(--ry)) rotateX(18deg);filter:none}.st.wpn .st-led{animation:none;opacity:.5}.st.wpn .st-go{opacity:.7}
.st.off .st-scr{box-shadow:none;border-top-color:#2a3646}
.st.off .st-r{margin-top:22px}
@keyframes brLed{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes brBlink{0%,92%,100%{opacity:.25}95%{opacity:1}}
.brs-bg .bl{animation:brBlink 4s infinite}
@media (max-width:760px){.brs-deck{grid-template-columns:1fr 1fr;perspective:none}.brs-chair{grid-column:1/-1;order:5;flex-direction:row;justify-content:center;gap:10px;padding:6px 0}.brs-chair svg,.brs-cw{max-width:70px}.brs-log{clip-path:none}.st,.st:hover{transform:none}.brs-vs{width:94%}}
@media (prefers-reduced-motion:reduce){.st-led,.brs-bg .bl{animation:none}.st{transition:none}}
`;
  const BR_BG =
    '<svg class="brs-bg" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true"><defs>' +
    '<linearGradient id="brW" x1="0" x2="1"><stop offset="0" stop-color="#0d131b"/><stop offset="1" stop-color="#141c26"/></linearGradient>' +
    '<linearGradient id="brW2" x1="1" x2="0"><stop offset="0" stop-color="#0d131b"/><stop offset="1" stop-color="#141c26"/></linearGradient>' +
    '<radialGradient id="brF" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="#132131"/><stop offset="1" stop-color="#05070a"/></radialGradient></defs>' +
    '<rect width="1000" height="620" fill="url(#brF)"/>' +
    '<polygon points="0,0 1000,0 920,18 80,18" fill="#0f1620"/>' +
    '<line x1="120" y1="9" x2="880" y2="9" stroke="#8fe3ff" stroke-opacity=".35" stroke-width="2"/>' +
    '<polygon points="0,0 80,18 80,420 0,620" fill="url(#brW)"/>' +
    '<polygon points="1000,0 920,18 920,420 1000,620" fill="url(#brW2)"/>' +
    [30, 55].map((x) => '<line x1="' + x + '" y1="' + (x * 0.25) + '" x2="' + x + '" y2="' + (620 - x * 2.4) + '" stroke="#243041" stroke-width="2"/>').join('') +
    [945, 970].map((x) => '<line x1="' + x + '" y1="' + ((1000 - x) * 0.25) + '" x2="' + x + '" y2="' + (620 - (1000 - x) * 2.4) + '" stroke="#243041" stroke-width="2"/>').join('') +
    '<rect x="38" y="120" width="10" height="160" rx="3" fill="#9a6bff" opacity=".22"/><rect x="952" y="120" width="10" height="160" rx="3" fill="#ffd24a" opacity=".22"/>' +
    [150, 190, 230].map((y, i) => '<circle class="bl" cx="64" cy="' + y + '" r="3" fill="#3fd68a" style="animation-delay:' + i * 1.3 + 's"/><circle class="bl" cx="936" cy="' + y + '" r="3" fill="#e8645a" style="animation-delay:' + (i * 1.3 + 0.6) + 's"/>').join('') +
    '<path d="M80,420 Q500,470 920,420" stroke="#8fe3ff" stroke-opacity=".18" stroke-width="2" fill="none"/>' +
    '<path d="M0,620 Q500,520 1000,620" stroke="#8fe3ff" stroke-opacity=".12" stroke-width="2" fill="none"/></svg>';
  const CHAIR =
    '<svg viewBox="0 0 140 150" aria-hidden="true"><defs><linearGradient id="brC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c3a4c"/><stop offset="1" stop-color="#121a24"/></linearGradient></defs>' +
    '<path d="M38,10 Q70,0 102,10 L106,86 L34,86 Z" fill="url(#brC)" stroke="#3a4b60"/>' +
    '<path d="M48,22 Q70,15 92,22 L94,78 L46,78 Z" fill="#0c1118" stroke="#8fe3ff" stroke-opacity=".25"/>' +
    '<rect x="14" y="70" width="26" height="12" rx="5" fill="url(#brC)" stroke="#3a4b60"/><rect x="100" y="70" width="26" height="12" rx="5" fill="url(#brC)" stroke="#3a4b60"/>' +
    '<rect x="20" y="73" width="8" height="4" rx="1" fill="#9a6bff" opacity=".8"/><rect x="112" y="73" width="8" height="4" rx="1" fill="#ffd24a" opacity=".8"/>' +
    '<path d="M30,86 L110,86 L104,104 L36,104 Z" fill="#1b2430" stroke="#3a4b60"/>' +
    '<rect x="64" y="104" width="12" height="28" fill="#141c26"/><ellipse cx="70" cy="138" rx="40" ry="8" fill="#141c26" stroke="#3a4b60"/>' +
    '<ellipse cx="70" cy="138" rx="56" ry="11" fill="none" stroke="#8fe3ff" stroke-opacity=".2"/></svg>';
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
    const ords = (D.orders || []).length,
      rocks = (D.owned || []).length;
    const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
    return {
      S: [fly, fly === 1 ? 'ship in flight' : 'ships in flight', pl(ships.length, 'ship') + ' in your fleet', lowP ? pl(lowP, 'ship') + ' low on propellant' : ''],
      C: [crews.length, crews.length === 1 ? 'crew on duty' : 'crews on duty', '', hungry ? hungry + ' hungry' : 'all crews fed'],
      H: [run, run === 1 ? 'job running' : 'jobs running', pl(idle, 'idle building'), ready ? ready + ' ready to collect' : ''],
      K: [ords, ords === 1 ? 'open listing' : 'open listings', 'Market · Trade finder · History', ''],
      A: [rocks, rocks === 1 ? 'rock you run' : 'rocks you run', 'Asteroids · Core Samples · Lot resources', ''],
    };
  }
  let brLog = false,
    brTop = 0;
  function drawBridge(m) {
    if (!document.getElementById('br-css')) {
      const st = document.createElement('style');
      st.id = 'br-css';
      st.textContent = BR_CSS;
      document.head.appendChild(st);
    }
    const N = bridgeNums(),
      br = document.createElement('div');
    br.className = 'brs';
    const station = (d) => {
      const n = N[d.k] || N[d.id === 'eng' ? 'H' : d.k],
        warn = n[3] && /low|hungry|ready/.test(n[3]);
      return (
        '<button type="button" class="st" data-dk="' + d.k + '" data-deck="' + d.id + '"' + (d.alt ? ' data-alt="' + d.alt + '"' : '') +
        ' style="--dc:' + d.col + ';--ry:' + d.ry + 'deg" title="Enter the ' + d.name + '"><span class="st-scr"><span class="st-h">' + APP.esc(d.name) +
        '<i class="st-led"></i></span><span class="st-r">' + d.role + ' station</span><span class="st-n">' + n[0] + '</span><span class="st-l">' + APP.esc(n[1]) +
        '</span><span class="st-s">' + (warn ? '<b>' + APP.esc(n[3]) + '</b>' : APP.esc(n[3])) + (n[2] ? (n[3] ? ' · ' : '') + APP.esc(n[2]) : '') +
        '</span><span class="st-go">Enter deck ▸</span></span><span class="st-base"><i></i><i></i><i></i><i></i></span></button>'
      );
    };
    br.innerHTML =
      BR_BG +
      '<div class="brs-vs"><div class="brs-plate">VIEWSCREEN</div></div>' +
      '<div class="brs-deck">' + station(DECKS[0]) + station(DECKS[1]) + station(DECKS[2]) + (PCB ? '<div class="brs-mid">' : '') + '<button type="button" class="brs-chair" title="The captain\'s chair – today\'s workload on the viewscreen"><span class="brs-cw">' + CHAIR + '<video class="brs-sk" src="media/skippy-chair.mp4" poster="media/skippy-chair.jpg" muted playsinline preload="none" aria-hidden="true"></video></span><span class="brs-cl">Today\'s workload</span></button>' +
      (PCB ? '<button type="button" class="brs-pc" title="The SkippyChain – how everything in the game is made"><b>🔗 SkippyChain</b><span>Full production chain</span><i>Open ▸</i></button></div><style>' + PC_CSS + '</style>' : '') +
      station(DECKS[3]) + station(DECKS[4]) +
      // switched-off console keeps both sides even (Mark, 27 Oct); now the Weapons console, kept for when conflict starts (not linked yet)
      '<div class="st wpn" role="note" title="Weapons – not in the game yet. This console is kept ready for when conflict starts." style="--dc:#ff9a3d;--ry:-15deg"><span class="st-scr"><span class="st-h">Weapons<i class="st-led"></i></span><span class="st-r">Armoury station</span><span class="st-n">⚔</span><span class="st-l">Weapons store</span><span class="st-s">Ready for when conflict starts</span><span class="st-go">Coming soon</span></span><span class="st-base"><i></i><i></i><i></i><i></i></span></div>' +
      '</div><div class="brs-floor"></div>';
    m.prepend(br);
    const pcb = br.querySelector('.brs-pc');
    if (pcb)
      pcb.addEventListener('click', () => {
        const h = document.getElementById('vH');
        if (h) h.click();
      });
    const vs = br.querySelector('.brs-vs');
    if (window.YICbeltMap) {
      window.YICbeltMap(vs);
      const lab = vs.querySelector('canvas + .a');
      if (lab) lab.textContent = 'The Adalia system right now · your rocks in blue · drag to turn';
      vs.appendChild(vs.querySelector('.brs-plate'));
    }
    // The captain's chair swaps the viewscreen between the system map and today's workload
    const chair = br.querySelector('.brs-chair'),
      plate = vs.querySelector('.brs-plate');
    // remember the choice: the page redraws when deliveries finish loading (Mark: workload "loads then goes back")
    const setLog = (on) => {
      brLog = on;
      const map = vs.querySelector(':scope > div:not(.brs-plate):not(.brs-log)');
      let log = vs.querySelector('.brs-log');
      if (!on) {
        if (!log) return;
        log.remove();
        if (map) map.style.display = '';
        plate.textContent = 'VIEWSCREEN';
        chair.classList.remove('on');
        return;
      }
      if (log) return;
      log = document.createElement('div');
      log.className = 'brs-log';
      vs.insertBefore(log, plate);
      if (map) map.style.display = 'none';
      drawAlerts(log);
      animTiles(log);
      log.scrollTop = brTop;
      log.addEventListener('scroll', () => (brTop = log.scrollTop), { passive: true });
      plate.textContent = "TODAY'S WORKLOAD";
      chair.classList.add('on');
    };
    chair.addEventListener('click', () => setLog(!brLog));
    if (brLog) setLog(true);
    br.querySelectorAll('.st').forEach((b) =>
      b.addEventListener('click', () => {
        if (window.YICgoDeck) return window.YICgoDeck(b.dataset.deck);
        const t = document.getElementById('v' + b.dataset.dk) || (b.dataset.alt && document.getElementById('v' + b.dataset.alt));
        if (t) {
          t.click();
          scrollTo(0, 0);
        }
      }),
    );
  }

  // First visit: bridge doors with a "Step onto the bridge" button (a click lets the browser play sound),
  // door swoosh, then Skippy talks big on the viewscreen and shrinks into the chair (Mark, 26 Oct)
  function doorSound() {
    try {
      const A = window.AudioContext || window.webkitAudioContext;
      if (!A) return;
      const ac = new A(),
        t = ac.currentTime,
        len = Math.floor(ac.sampleRate * 1.1),
        buf = ac.createBuffer(1, len, ac.sampleRate),
        d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const n = ac.createBufferSource(),
        f = ac.createBiquadFilter(),
        g = ac.createGain();
      n.buffer = buf;
      f.type = 'bandpass';
      f.Q.value = 1.2;
      f.frequency.setValueAtTime(2400, t);
      f.frequency.exponentialRampToValueAtTime(350, t + 0.8);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
      n.connect(f).connect(g).connect(ac.destination);
      n.start(t);
      n.stop(t + 1.1);
      const o = ac.createOscillator(),
        og = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(55, t + 0.5);
      og.gain.setValueAtTime(0.0001, t);
      og.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(og).connect(ac.destination);
      o.start(t);
      o.stop(t + 0.55);
      setTimeout(() => ac.close(), 1500);
    } catch (e) {}
  }
  function skippyIntro(br) {
    if (window.YICskIntro) return;
    window.YICskIntro = 1;
    // once per visit (sessionStorage)
    const SK_ONCE = true;
    try {
      if (SK_ONCE && sessionStorage.getItem('yic-sk-intro')) return;
      sessionStorage.setItem('yic-sk-intro', '1');
    } catch (e) {}
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const st = document.createElement('style');
    st.textContent =
      '#brdoor{position:fixed!important;inset:0;z-index:10000!important;overflow:hidden}' +
      '#brdoor .dw{position:absolute;top:0;bottom:0;width:50.5%;background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 2px,transparent 2px 60px),linear-gradient(180deg,#1c2633,#0b1017);transition:transform .85s cubic-bezier(.6,0,.3,1)}' +
      '#brdoor .dl{left:0;border-right:3px solid #8fe3ff;box-shadow:inset -14px 0 30px rgba(143,227,255,.12),6px 0 18px rgba(143,227,255,.35)}' +
      '#brdoor .dr{right:0;border-left:3px solid #8fe3ff;box-shadow:inset 14px 0 30px rgba(143,227,255,.12),-6px 0 18px rgba(143,227,255,.35)}' +
      '#brdoor .dl::after,#brdoor .dr::after{content:"";position:absolute;top:50%;width:8px;height:90px;margin-top:-45px;border-radius:4px;background:#5b9dff;box-shadow:0 0 12px #5b9dff}' +
      '#brdoor .dl::after{right:22px}#brdoor .dr::after{left:22px}' +
      '#brdoor.open .dl{transform:translateX(-101%)}#brdoor.open .dr{transform:translateX(101%)}' +
      '#brdoor button{all:unset;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2;cursor:pointer;padding:16px 30px;border:2px solid #8fe3ff;border-radius:8px;background:rgba(5,8,13,.85);color:#8fe3ff;font:700 15px/1 system-ui,sans-serif;letter-spacing:.22em;text-transform:uppercase;text-align:center;box-shadow:0 0 22px rgba(143,227,255,.4);transition:opacity .25s,box-shadow .2s}' +
      '#brdoor button:hover,#brdoor button:focus-visible{box-shadow:0 0 34px rgba(143,227,255,.75)}' +
      '#brdoor button small{display:block;margin-top:8px;font-size:10px;letter-spacing:.15em;opacity:.7}' +
      '#brdoor.open button{opacity:0;pointer-events:none}';
    document.head.appendChild(st);
    const dr = document.createElement('div');
    dr.id = 'brdoor';
    dr.innerHTML = '<div class="dw dl"></div><div class="dw dr"></div><button type="button">Step onto the bridge<small>🔊 sound on</small></button>';
    document.body.appendChild(dr);
    const btn = dr.querySelector('button');
    btn.focus();
    btn.addEventListener('click', () => {
      // Create and unlock the video inside the click, so the browser lets it play with sound
      const v = document.createElement('video');
      v.src = 'media/skippy-intro.mp4';
      v.playsInline = true;
      v.preload = 'auto';
      const un = v.play();
      if (un && un.then) un.then(() => v.pause()).catch(() => {});
      doorSound();
      const sk0 = br.querySelector('.brs-sk');
      if (sk0) sk0.style.opacity = '0';
      dr.classList.add('open');
      setTimeout(() => {
        dr.remove();
        st.remove();
        showSkippy(br, v);
      }, 900);
    });
  }
  function showSkippy(br, v) {
    const vs = br.querySelector('.brs-vs'),
      sk = br.querySelector('.brs-sk');
    if (!vs || !sk || !br.isConnected) {
      if (sk) sk.style.opacity = '';
      return;
    }
    scrollTo(0, 0);
    const r = vs.getBoundingClientRect();
    if (r.width < 50) return;
    const h = Math.min(Math.max(r.height - 30, 220), innerHeight * 0.7),
      w = (h * 668) / 818,
      L = r.left + (r.width - w) / 2,
      T = Math.max(r.top + 15, 10);
    v.title = 'Click to skip';
    v.style.cssText = 'position:fixed!important;z-index:9999!important;left:' + L + 'px;top:' + T + 'px;width:' + w + 'px;height:' + h + 'px;object-fit:cover;border-radius:12px;box-shadow:0 0 30px rgba(143,227,255,.45);transform-origin:0 0;opacity:0;transform:scale(.92);transition:transform .9s ease-in-out,opacity .5s,border-radius .9s;cursor:pointer';
    document.body.appendChild(v);
    sk.style.opacity = '0';
    let done = false;
    const shrink = () => {
      if (done) return;
      done = true;
      const c = sk.getBoundingClientRect();
      v.style.borderRadius = '40px';
      v.style.transform = 'translate(' + (c.left - L) + 'px,' + (c.top - T) + 'px) scale(' + c.width / w + ',' + c.height / h + ')';
      setTimeout(() => {
        sk.style.opacity = '';
        v.remove();
      }, 950);
    };
    v.addEventListener('ended', shrink);
    v.addEventListener('click', shrink);
    setTimeout(shrink, 8000);
    requestAnimationFrame(() => {
      v.style.opacity = '1';
      v.style.transform = 'none';
    });
    v.currentTime = 0;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(shrink);
    });
  }

  // Click Skippy in the chair → he says hello again. The rest of the chair still opens today's workload.
  function skippyClick(br) {
    const sk = br.querySelector('.brs-sk');
    if (!sk) return;
    if (!document.getElementById('skc-css')) {
      const st = document.createElement('style');
      st.id = 'skc-css';
      st.textContent = '.brs-sk.skc{cursor:pointer;transition:box-shadow .2s}.brs-sk.skc:hover,.brs-sk.skc:focus-visible{box-shadow:0 0 18px rgba(143,227,255,.9)}';
      document.head.appendChild(st);
    }
    sk.classList.add('skc');
    sk.title = 'Click Skippy to hear his welcome';
    sk.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (document.querySelector('video[data-skc]')) return;
      const v = document.createElement('video');
      v.src = 'media/skippy-intro.mp4';
      v.playsInline = true;
      v.preload = 'auto';
      v.dataset.skc = '1';
      showSkippy(br, v);
    });
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.N = function (m) {
    // the Bridge; today's workload shows on its viewscreen from the captain's chair
    m.innerHTML = '';
    drawBridge(m);
    skippyIntro(m.querySelector('.brs') || m);
    skippyClick(m.querySelector('.brs') || m);
  };
})();
