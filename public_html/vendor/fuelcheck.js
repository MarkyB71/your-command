/* Fuel check – Your Influence Command (Mark, 28 Oct 2026) – LIVE 29 Oct
   Engineering console. Pick one of your rocks that can make its own Hydrogen Propellant,
   then see the raw materials the fuel needs there and whether each extractor on that rock
   has at least 2 untouched core samples of them waiting.
   Mark's plan, one step at a time:
     1. extractors have at least 2 samples   <- this step
     2. extractors are extracting
     3. what's still needed
     4. how long to extract
   Uses window.YIC (app.js), window.YICREC (recipes, vendor/buildplan.js) and samples.php. */
(function () {
  'use strict';
  const PROP = '170';   // Hydrogen Propellant
  const MIN = 2;        // samples each extractor should have waiting (Mark)
  const S = { rock: '' };

  const CSS = `.fc-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 12px}
.fc-row label{color:#8b9ab0;font-size:14px;display:flex;gap:8px;align-items:center}
.fc-row select{font-size:15px;padding:6px 10px;min-width:0!important;max-width:280px}
.fc-box{background:#121a26;border:1px solid #2a3648;border-radius:10px;padding:12px 14px;margin:0 0 12px}
.fc-box h3{margin:0 0 8px;font-size:15px;color:#e8645a;font-weight:600}
.fc-note{color:#8b9ab0;font-size:13px;margin:0 0 10px}
.fc-raws{display:flex;gap:10px;flex-wrap:wrap}
.fc-raw{display:flex;gap:8px;align-items:center;background:#0c1320;border:1px solid #223047;border-radius:8px;padding:6px 10px}
.fc-ok{color:#3fd68a;font-weight:600}.fc-mid{color:#ffab3d;font-weight:600}.fc-bad{color:#ff6b6b;font-weight:600}
.fc-dim{color:#8b9ab0;font-size:12px}`;

  function css() {
    if (document.getElementById('fc-css')) return;
    const st = document.createElement('style');
    st.id = 'fc-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  const astOf = (b) => ((((b.Location || {}).locations) || []).find((x) => x.label === 3) || {}).id;
  const lotOf = (b) => ((((b.Location || {}).locations) || []).find((x) => x.label === 4) || {}).id;

  // Can this rock make prod? Raws must be mineable here; every made step needs a working facility here.
  function canMake(Y, D, ast, prod, seen) {
    const R = window.YICREC; if (!R) return false;
    // raws: mined here, or else made from other things (e.g. Hydrogen from Water or Methane – Mark, 29 Oct)
    if (+prod <= 22 && mineable(Y, ast, prod)) return true;
    if (seen[prod]) return false; seen = Object.assign({}, seen, { [prod]: 1 });
    return (R.MK[prod] || []).some(([, pt, inp, , out]) => hasFac(D, ast.id, R.FBT[pt]) &&
      Object.keys(inp).every((k) => (out && out[k]) || canMake(Y, D, ast, k, seen)));
  }
  function mineable(Y, ast, prod) {
    const c = ast.Celestial || {};
    if ((c.scanStatus || 0) >= 4 && c.abundances && Y.astAbund) return (Y.astAbund(c.abundances)[prod] || 0) > 0;
    const sp = (Y.SPEC || {})[c.celestialType]; return !!(sp && sp[1].includes(+prod));
  }
  function hasFac(D, astId, type) {
    return (D.allB || []).some((b) => b.Building && b.Building.buildingType === type && b.Building.status === 3 && astOf(b) === astId);
  }
  // The raw materials the fuel needs on this rock (first recipe at each step that works here).
  function raws(Y, D, ast, prod, seen, out) {
    if (+prod <= 22 && mineable(Y, ast, prod)) { out.add(String(prod)); return; }
    if (seen[prod]) return; seen = Object.assign({}, seen, { [prod]: 1 });
    const R = window.YICREC;
    const r = (R.MK[prod] || []).find(([, pt, inp, , o]) => hasFac(D, ast.id, R.FBT[pt]) &&
      Object.keys(inp).every((k) => (o && o[k]) || canMake(Y, D, ast, k, seen)));
    if (!r) return;
    const [, , inp, , o] = r;
    Object.keys(inp).forEach((k) => { if (!(o && o[k])) raws(Y, D, ast, k, seen, out); });
  }

  // Fuel with some inputs flown in (Mark, 29 Oct): the last step's facility is here and at least one
  // input can be mined/made here. Returns {fly:[inputs to fly in], here:[inputs made/mined here]} or null.
  function partial(Y, D, ast, prod) {
    const R = window.YICREC;
    for (const [, pt, inp, , o] of R.MK[prod] || []) {
      if (!hasFac(D, ast.id, R.FBT[pt])) continue;
      const ks = Object.keys(inp).filter((k) => !(o && o[k]));
      const here = ks.filter((k) => canMake(Y, D, ast, k, { [prod]: 1 }));
      if (here.length) return { fly: ks.filter((k) => !here.includes(k)), here };
    }
    return null;
  }

  function loadSamples(Y) {
    if (Y.SAMP || Y.sampLoad) return;
    Y.sampLoad = fetch('samples.php?wallet=' + encodeURIComponent(Y.D.wallet || ''), { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => { if (j.error) throw new Error(j.error); Y.SAMP = j; })
      .catch((e) => { Y.SAMP = { err: (e && e.message) || 'error' }; })
      .finally(() => { Y.sampLoad = null; if (isOn()) page(document.getElementById('main')); });
  }

  function page(m) {
    css();
    const Y = window.YIC, D = (Y && Y.D) || {}, esc = Y.esc, pn = Y.pn;
    if (!window.YICREC) { m.innerHTML = '<div class="note">Loading recipes…</div>'; setTimeout(() => { if (isOn()) page(m); }, 700); return; }

    // Your rocks (asteroid box list + owned/controlled ones), keeping the full asteroid records
    const rocks = [];
    (Y.asts || []).forEach((a) => { if (a.id) rocks.push({ id: a.id, name: a.name }); });
    (D.owned || []).forEach((a) => { if (a.id && !rocks.some((r) => r.id === a.id)) rocks.push({ id: a.id, name: (a.Name && a.Name.name) || ('Asteroid #' + a.id) }); });
    rocks.forEach((r) => { r.rec = (D.owned || []).find((x) => x.id === r.id) || { id: r.id }; r.ok = canMake(Y, D, r.rec, PROP, {}); if (!r.ok) r.part = partial(Y, D, r.rec, PROP); });
    const good = rocks.filter((r) => r.ok || r.part).sort((a, b) => a.name.localeCompare(b.name));
    const cant = rocks.filter((r) => !r.ok && !r.part).map((r) => r.name).sort();

    let h = '<div class="fc-note">Making your own fuel (Hydrogen Propellant). Step 1: does every extractor have at least ' + MIN + ' untouched core samples of the raw materials the fuel needs?</div>';
    if (!good.length) {
      m.innerHTML = h + '<div class="note">None of your rocks can make Hydrogen Propellant yet – it needs a working Refinery (and the raw materials mined or made there).</div>';
      return;
    }
    if (!good.some((r) => String(r.id) === S.rock)) S.rock = String(good[0].id);
    const rock = good.find((r) => String(r.id) === S.rock);
    h += '<div class="fc-row"><label>Rock <select id="fc-r">' + good.map((r) => '<option value="' + r.id + '"' + (String(r.id) === S.rock ? ' selected' : '') + '>' + esc(r.name) + (r.ok ? '' : ' – fly in ' + esc(r.part.fly.map(pn).join(' + '))) + '</option>').join('') + '</select></label>' +
      (cant.length ? '<span class="fc-dim">Can\'t make fuel: ' + esc(cant.join(', ')) + '</span>' : '') + '</div>';

    const need = new Set();
    if (rock.ok) raws(Y, D, rock.rec, PROP, {}, need);
    else rock.part.here.forEach((k) => raws(Y, D, rock.rec, k, { [PROP]: 1 }, need));
    const needL = [...need].sort((a, b) => pn(a).localeCompare(pn(b)));

    if (!Y.SAMP) { loadSamples(Y); m.innerHTML = h + '<div class="note">Loading your core samples…</div>'; wire(m); return; }
    if (Y.SAMP.err) { m.innerHTML = h + '<div class="note">Couldn\'t load your core samples: ' + esc(Y.SAMP.err) + '</div>'; wire(m); return; }

    // Untouched samples on this rock of the fuel's raw materials, by lot
    const byLot = {}, tot = {};
    (Y.SAMP.rows || []).forEach(([, r, kg, lot, a]) => {
      const p = String(r);
      if (a !== rock.name || !need.has(p)) return;
      (byLot[lot] = byLot[lot] || []).push([p, kg]);
      tot[p] = tot[p] || { n: 0, kg: 0 }; tot[p].n++; tot[p].kg += kg;
    });

    h += '<div class="fc-box"><h3>Raw materials the fuel needs on ' + esc(rock.name) + '</h3><div class="fc-raws">' +
      needL.map((p) => '<div class="fc-raw">' + Y.ricon(p, 28) + '<span><b>' + esc(pn(p)) + '</b><br><span class="fc-dim">' +
        (tot[p] ? tot[p].n + ' untouched sample' + (tot[p].n === 1 ? '' : 's') + ' · ' + Y.fq(p, tot[p].kg) : '<span class="fc-bad">no untouched samples</span>') +
        '</span></span></div>').join('') + '</div>' +
      (rock.ok ? '' : '<div class="fc-note" style="margin:10px 0 0">✈ Fly in: <b>' + esc(rock.part.fly.map(pn).join(', ')) + '</b> – this rock has the Refinery but can\'t make ' + (rock.part.fly.length === 1 ? 'it' : 'them') + '.</div>') +
      '</div>';

    // Extractors on this rock
    const now = Date.now() / 1000;
    const ex = (D.allB || []).filter((b) => b.Building && b.Building.buildingType === 2 && b.Building.status === 3 && astOf(b) === rock.id).map((b) => {
      const lot = lotOf(b), s = byLot[lot] || [];
      const run = (b.Extractors || []).find((x) => x.status === 1);
      return { b, lot, s, run, name: (b.Name && b.Name.name) || ('Extractor #' + b.id) };
    }).sort((a, b) => (a.s.length - b.s.length) || a.name.localeCompare(b.name));
    const short = ex.filter((e) => e.s.length < MIN).length;

    h += '<div class="fc-box"><h3>Extractors on ' + esc(rock.name) + ' – ' + (ex.length ? (short ? '<span class="fc-bad">' + short + ' of ' + ex.length + ' need more samples</span>' : '<span class="fc-ok">all have ' + MIN + '+ samples</span>') : 'none') + '</h3>';
    if (!ex.length) h += '<div class="note">No working extractors on this rock.</div>';
    else {
      h += '<div class="wrap"><table><thead><tr><th>Extractor</th><th>Lot</th><th class="num">Fuel samples waiting</th><th>Which</th><th>Doing now</th></tr></thead><tbody>';
      ex.forEach((e) => {
        const n = e.s.length, cls = n >= MIN ? 'fc-ok' : n ? 'fc-mid' : 'fc-bad';
        const cnt = {}; e.s.forEach(([p]) => { cnt[p] = (cnt[p] || 0) + 1; });
        const which = Object.keys(cnt).map((p) => cnt[p] + ' × ' + esc(pn(p))).join('<br>') || '<span class="fc-dim">–</span>';
        const doing = e.run ? (e.run.finishTime <= now ? 'Extracting ' + esc(pn(String(e.run.outputProduct))) + ' – <b>ready to collect</b>'
          : 'Extracting ' + esc(pn(String(e.run.outputProduct))) + ' <span class="fc-dim">· ' + Y.tLeft(e.run.finishTime, now) + ' left</span>') : '<span class="fc-mid">Idle</span>';
        const gl = window.GL ? window.GL('/building/' + e.b.id, 'Open this extractor in the game') : '';
        h += '<tr><td><b>' + esc(e.name) + '</b>' + gl + '</td><td data-sort="' + Math.floor(e.lot / 4294967296) + '">Lot #' + Math.floor(e.lot / 4294967296) + '</td>' +
          '<td class="num" data-sort="' + n + '"><span class="' + cls + '">' + (n >= MIN ? '✓ ' : n ? '' : '✗ ') + n + '</span></td><td>' + which + '</td><td>' + doing + '</td></tr>';
      });
      h += '</tbody></table></div>';
    }
    h += '</div><div class="note">Only untouched samples count (not part-used ones). Coming next: are the extractors working on fuel, what\'s still needed, and how long it will take.</div>';
    m.innerHTML = h;
    wire(m);
  }
  function wire(m) {
    const s = m.querySelector('#fc-r');
    if (s) s.addEventListener('change', () => { S.rock = s.value; page(m); });
  }

  const isOn = () => { const b = document.getElementById('vG'); return !!(b && b.className === 'on'); };

  // Adds "Fuel check" to the Engineering deck, after Asteroid planner
  const hook = () => {
    const after = document.getElementById('vU') || document.getElementById('vP'), main = document.getElementById('main');
    if (!after || !main || document.getElementById('vG')) return;
    const b = document.createElement('button');
    b.id = 'vG';
    b.textContent = 'Fuel check';
    after.after(b);
    b.addEventListener('click', () => {
      document.querySelectorAll('button.on').forEach((x) => x.classList.remove('on'));
      try { window.YIC.view = 'M'; } catch (e) {} // add-on page showing – app.js leaves #main alone
      b.className = 'on';
      page(main);
    });
  };
  document.addEventListener('click', (e) => {
    const b = document.getElementById('vG'), t = e.target.closest && e.target.closest('button[id^="v"]');
    if (b && t && t !== b) b.className = '';
  }, true);
  setInterval(hook, 700);
})();
