/* Buildings › Status – Your Influence Command
   One file per page (started 2026-10-18). Production buildings per asteroid:
   working / finished / idle, what each is doing, output, finish time and time left.
   Shared data and helpers come from window.YIC (set up in app.js). */
(function () {
  'use strict';

  const PRODUCTION_TYPES = [2, 3, 4, 5, 6];   // extractor, refinery, bioreactor, factory, shipyard
  const STATE = { run: ['#0ca30c', 'Working'], done: ['#fab219', 'Finished – collect'], idle: ['#d03b3b', 'Idle'] };
  const RANK = { idle: 0, done: 1, run: 2 };
  const when = t => new Date(t * 1000).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const dot = s => '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + STATE[s][0] +
    ';margin-right:7px;vertical-align:middle"></span>' + STATE[s][1];

  function drawStatus(m) {
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
      if (st === 1 || st === 2) { sites[a] = (sites[a] || 0) + 1; return; }   // planned / being built
      if (st !== 3) return;

      const bt = b.Building.buildingType;
      const name = (b.Name && b.Name.name) || ((BT[bt] || 'Building') + ' #' + b.id);
      const crew = (D.crewN || {})[b.Control && b.Control.controller && b.Control.controller.id] || '';
      const g = groups[a] = groups[a] || { prod: [], other: {} };

      if (!PRODUCTION_TYPES.includes(bt)) { g.other[BT[bt]] = (g.other[BT[bt]] || 0) + 1; return; }

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

    const aKeys = Object.keys(groups).sort();
    if (!aKeys.length) { m.innerHTML = '<div class="note">Nothing matches.</div>'; return; }

    let h = '';
    aKeys.forEach(a => {
      const g = groups[a];
      g.prod.sort((x, y) => RANK[x.s] - RANK[y.s] || x.type.localeCompare(y.type) || x.fin - y.fin || x.name.localeCompare(y.name));
      const n = k => g.prod.filter(x => x.s === k).length;

      h += '<h2>' + esc(a) + '</h2><div class="note" style="padding:0 0 10px">' + g.prod.length + ' production buildings · ' +
        '<b style="color:#4cd04c">' + n('run') + ' working</b> · <b style="color:#ff7a7a">' + n('idle') + ' idle</b>' +
        (n('done') ? ' · <b style="color:#fab219">' + n('done') + ' finished, waiting to collect</b>' : '') + '</div>';

      if (g.prod.length) h += '<div class="wrap"><table><thead><tr><th>Status</th><th>Building</th><th>Type</th><th>Crew</th>' +
        '<th>Doing</th><th>Output</th><th>Finishes</th><th>Time left</th></tr></thead><tbody>' +
        g.prod.map(x => row(x, Y, now)).join('') + '</tbody></table></div>';

      const o = Object.entries(g.other).map(([k, v]) => v + ' ' + k + (v > 1 ? 's' : '')).join(', ');
      if (o || sites[a]) h += '<div class="note" style="padding:8px 0 0">' + (o ? 'Also here: ' + esc(o) + '. ' : '') +
        (sites[a] ? sites[a] + ' unfinished construction site' + (sites[a] > 1 ? 's' : '') + ' not shown.' : '') + '</div>';
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
      '<td class="cls">' + js.map(j => j.fin ? (j.s === 'done' ? 'Done ' + esc(when(j.fin)) : esc(when(j.fin))) : '').join('<br>') + '</td>' +
      '<td>' + js.map(j => j.fin ? (j.s === 'done' ? '<span style="color:#fab219">Ready to collect</span>'
        : '<b data-fin="' + j.fin + '">' + Y.tLeft(j.fin, now) + '</b>') : '').join('<br>') + '</td></tr>';
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.T = drawStatus;
})();
