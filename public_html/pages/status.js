/* Buildings › Status – Your Influence Command
   One file per page (started 2026-10-18). Production buildings per asteroid:
   working / finished / idle, what each is doing, output, finish time and time left.
   Shared data and helpers come from window.YIC (set up in app.js). */
(function () {
  'use strict';

  const PRODUCTION_TYPES = [2, 3, 4, 5, 6];   // extractor, refinery, bioreactor, factory, shipyard
  const STATE = { run: ['#0ca30c', 'Working'], done: ['#fab219', 'Finished – collect'], idle: ['#d03b3b', 'Idle'],
    build: ['#36a7cd', 'Being built'], built: ['#fab219', 'Built – ready to finish'] };
  const RANK = { idle: 0, done: 1, built: 1, run: 2, build: 3 };
  // Buildings under construction listed with their time left (LIVE 2 Nov 2026, tested on ?beta=1 – Mark)
  const when = t => new Date(t * 1000).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const dot = s => '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + STATE[s][0] +
    ';margin-right:7px;vertical-align:middle"></span>' + STATE[s][1];

  // types = which building types to list; label = what to call them (Mining status: extractors only – ?beta=1, Mark 12 Nov)
  function drawStatus(m, types, label) {
    types = types || PRODUCTION_TYPES;
    label = label || 'production buildings';
    const Y = window.YIC, D = Y.D, esc = Y.esc, pn = Y.pn, fmt = Y.pfmt, BT = Y.BT, PROCN = Y.PROCN;
    const ai = document.querySelector('#ast').value;
    const an = ai === '' ? null : Y.asts[+ai].name;
    const q = (document.querySelector('#q') || { value: '' }).value.trim().toLowerCase();
    const now = Date.now() / 1000;
    const okQ = (...t) => !q || t.some(v => String(v || '').toLowerCase().includes(q));
    const astOf = b => {
      const l = ((b.Location && b.Location.locations) || []).find(x => x.label === 3);
      return (b.meta && b.meta.asteroid && b.meta.asteroid.name) || (l ? 'Asteroid #' + l.id : '?');
    };

    // Group buildings by asteroid
    const groups = {}, sites = {};
    (D.allB || []).forEach(b => {
      const st = b.Building && b.Building.status, a = astOf(b);
      if (an && a !== an) return;
      if (st === 2) {   // being built: one row with its construction finish time
        const bt2 = b.Building.buildingType, f = b.Building.finishTime || 0;
        if (types !== PRODUCTION_TYPES && !types.includes(bt2)) return;
        const nm2 = (b.Name && b.Name.name) || ((BT[bt2] || 'Building') + ' #' + b.id);
        const cr2 = (D.crewN || {})[b.Control && b.Control.controller && b.Control.controller.id] || '';
        const s2 = f && f <= now ? 'built' : 'build';
        const g2 = groups[a] = groups[a] || { prod: [], other: {} };
        if (okQ(nm2, BT[bt2], cr2, 'construction', STATE[s2][1]))
          g2.prod.push({ id: b.id, name: nm2, type: BT[bt2] || 'Building', crew: cr2, s: s2, jobs: [{ s: s2, what: 'Under construction', out: '', fin: f }], fin: f || Infinity });
        return;
      }
      if (st === 1 || st === 2) { sites[a] = (sites[a] || 0) + 1; return; }   // planned / being built
      if (st !== 3) return;

      const bt = b.Building.buildingType;
      const name = (b.Name && b.Name.name) || ((BT[bt] || 'Building') + ' #' + b.id);
      const crew = (D.crewN || {})[b.Control && b.Control.controller && b.Control.controller.id] || '';
      const g = groups[a] = groups[a] || { prod: [], other: {} };

      if (!types.includes(bt)) { if (types === PRODUCTION_TYPES || !PRODUCTION_TYPES.includes(bt)) g.other[BT[bt]] = (g.other[BT[bt]] || 0) + 1; return; }

      // Each extractor / processor / dry dock is one job
      const jobs = [];
      (b.Extractors || []).forEach(e => jobs.push(e.status === 1
        ? { s: e.finishTime <= now ? 'done' : 'run', what: 'Extracting ' + pn(e.outputProduct), out: fmt(e.outputProduct, e.yield), fin: e.finishTime }
        : { s: 'idle', what: '' }));
      (b.Processors || []).forEach(p => {
        if (p.status !== 1) { jobs.push({ s: 'idle', what: bt === 6 ? 'Ship parts: idle' : '' }); return; }
        const pr = PROCN[p.runningProcess], o = p.outputProduct;
        const amt = pr && pr[1][o] ? Math.round(p.recipes * pr[1][o]) : 0;
        jobs.push({ s: p.finishTime <= now ? 'done' : 'run', what: pr ? pr[0] : 'Process ' + p.runningProcess,
          out: o ? (amt ? fmt(o, amt) + ' ' : '') + pn(o) : '', fin: p.finishTime });
      });
      (b.DryDocks || []).forEach(d => jobs.push(d.status === 1
        ? { s: d.finishTime <= now ? 'done' : 'run', what: 'Dry dock: assembling ship', out: '', fin: d.finishTime }
        : { s: 'idle', what: 'Dry dock: idle' }));

      const s = jobs.some(j => j.s === 'run') ? 'run' : jobs.some(j => j.s === 'done') ? 'done' : 'idle';
      const fin = Math.min(...jobs.filter(j => j.fin).map(j => j.fin), Infinity);
      if (okQ(name, BT[bt], crew, ...jobs.map(j => j.what + ' ' + j.out), STATE[s][1])) g.prod.push({ id: b.id, name, type: BT[bt], crew, s, jobs, fin });
    });

    // Own-building pages (Extractor / Bioreactor status): only rocks that have one; a picture when there are none
    const sub = types !== PRODUCTION_TYPES;
    const aKeys = Object.keys(groups).filter((a) => !sub || groups[a].prod.length).sort();
    if (!aKeys.length) {
      m.innerHTML = sub
        ? '<div class="note" style="display:flex;align-items:center;padding:20px 0">' + types.map((t) => Y.bthumb(BT[t], 96, 72)).join('') +
          (q || an ? 'No ' + esc(label) + ' match.' : 'You have no ' + esc(label) + ' yet.') + '</div>'
        : '<div class="note">Nothing matches.</div>';
      return;
    }

    let h = '';
    aKeys.forEach(a => {
      const g = groups[a];
      g.prod.sort((x, y) => RANK[x.s] - RANK[y.s] || x.type.localeCompare(y.type) || x.fin - y.fin || x.name.localeCompare(y.name));
      const n = k => g.prod.filter(x => x.s === k).length;

      h += '<h2>' + esc(a) + '</h2><div class="note" style="padding:0 0 10px">' + g.prod.length + ' ' + label + ' · ' +
        '<b style="color:#4cd04c">' + n('run') + ' working</b> · <b style="color:#ff7a7a">' + n('idle') + ' idle</b>' +
        (n('done') ? ' · <b style="color:#fab219">' + n('done') + ' finished, waiting to collect</b>' : '') +
        (n('build') + n('built') ? ' · <b style="color:#36a7cd">' + (n('build') + n('built')) + ' being built</b>' : '') + '</div>';

      if (g.prod.length) h += '<div class="wrap"><table><thead><tr><th>Status</th><th>Building</th><th>Type</th><th>Crew</th>' +
        '<th>Doing</th><th>Output</th><th>Finishes</th><th>Time left</th></tr></thead><tbody>' +
        g.prod.map(x => row(x, Y, now)).join('') + '</tbody></table></div>';

      const o = Object.entries(g.other).map(([k, v]) => v + ' ' + k + (v > 1 ? 's' : '')).join(', ');
      if (!sub && (o || sites[a])) h += '<div class="note" style="padding:8px 0 0">' + (o ? 'Also here: ' + esc(o) + '. ' : '') +
        (sites[a] ? sites[a] + ' planned site' + (sites[a] > 1 ? 's' : '') + ' not shown.' : '') + '</div>';
    });

    h += '<div class="note" style="padding:14px 0 0">Shipyard output amounts and secondary refinery outputs aren\'t shown. ' +
      'Warehouses and tank farms that are nearly full show on Today\'s Workload.</div>';
    m.innerHTML = h;
  }

  function row(x, Y, now) {
    const esc = Y.esc;
    const js = x.jobs.filter(j => j.s !== 'idle' || j.what);
    return '<tr><td>' + dot(x.s) + '</td><td>' + Y.bthumb(x.type, 56, 42) + esc(x.name) + (window.GL ? window.GL('/building/' + x.id, 'Open this building in the game') : '') + '</td>' +
      '<td class="cls">' + esc(x.type) + '</td><td class="cls">' + esc(x.crew) + '</td>' +
      '<td style="white-space:normal">' + (js.map(j => esc(j.what)).join('<br>') || '–') + '</td>' +
      '<td class="cls" style="white-space:normal">' + js.map(j => esc(j.out || '')).join('<br>') + '</td>' +
      '<td class="cls">' + js.map(j => j.fin ? (j.s === 'done' || j.s === 'built' ? 'Done ' + esc(when(j.fin)) : esc(when(j.fin))) : '').join('<br>') + '</td>' +
      '<td>' + js.map(j => j.fin ? (j.s === 'built' ? '<span style="color:#fab219">Ready to finish</span>' : j.s === 'done' ? '<span style="color:#fab219">Ready to collect</span>'
        : '<b data-fin="' + j.fin + '">' + Y.tLeft(j.fin, now) + '</b>') : '').join('<br>') + '</td></tr>';
  }

  // Decks by crew + building (?beta=1 test): each deck gets a status page for its own buildings –
  // Mining: extractors, Science Lab: bioreactors, Engineering's Status: refinery, factory, shipyard (Mark, 12 Nov).
  const BLD = /[?&]beta=1\b/.test(location.search);
  window.PAGES = window.PAGES || {};
  window.PAGES.T = BLD ? (m) => drawStatus(m, [3, 5, 6]) : drawStatus;
  if (BLD) {
    const EXTRA = [
      { id: 'vXS', after: ['vE'], text: 'Extractor status', types: [2], label: 'extractors' },
      { id: 'vBS', after: ['vRT', 'vA'], text: 'Bioreactor status', types: [4], label: 'bioreactors' },
    ];
    const hook = () => {
      const main = document.getElementById('main');
      if (!main) return;
      EXTRA.forEach((x) => {
        const after = x.after.map((i) => document.getElementById(i)).find(Boolean);
        if (!after || document.getElementById(x.id)) return;
        const b = document.createElement('button');
        b.id = x.id; b.textContent = x.text;
        after.after(b);
        b.addEventListener('click', () => {
          document.querySelectorAll('button.on').forEach((y) => y.classList.remove('on'));
          try { window.YIC.view = 'M'; } catch (e) {} // add-on page – app.js leaves #main alone
          b.className = 'on';
          drawStatus(main, x.types, x.label);
        });
      });
    };
    document.addEventListener('click', (e) => {
      const t = e.target.closest && e.target.closest('button[id^="v"]');
      if (!t) return;
      EXTRA.forEach((x) => { const b = document.getElementById(x.id); if (b && t !== b) b.className = ''; });
    }, true);
    setInterval(hook, 700);
  }
})();
