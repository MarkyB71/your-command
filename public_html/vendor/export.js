// Full download: stock + buildings + crews + ships in ONE file, as a spreadsheet (CSV) or a styled PDF.
// The PDF is a print-ready page in the site's look; the browser's print window saves it as PDF.
(function () {
  const Y = () => window.YIC;
  const STAT = { 1: 'Planned', 2: 'Being built', 3: 'Operational' };
  const pad = (x) => String(x).padStart(2, '0');
  const stamp = () => { const n = new Date(); return n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate()) + '_' + pad(n.getHours()) + '-' + pad(n.getMinutes()); };
  const t3 = (t) => +(+t).toFixed(3);

  // ---- gather everything once, plain values ----
  function gather() {
    const A = Y(), D = A.D, asts = A.asts, tot = A.tot;
    // Stock: every asteroid, every product
    const prods = new Set(); tot.forEach((t) => Object.keys(t).forEach((p) => { if (t[p] > 0) prods.add(p); }));
    const unit = (p) => (A.isAt(p) ? 'units' : 'tonnes');
    const val = (p, a) => (A.isAt(p) ? a : t3(A.kg(p, a) / 1000));
    const stock = [...prods].map((p) => { const v = tot.map((t) => t[p] || 0); return { name: A.pn(p), type: A.pc(p), unit: unit(p), v: v.map((x) => val(p, x)), total: val(p, v.reduce((a, b) => a + b, 0)) }; })
      .sort((a, b) => a.name.localeCompare(b.name));
    // Buildings: every building he has (planned, being built, operational)
    const now = Date.now() / 1000, crewN = D.crewN || {};
    const astOf = (b) => { const l = ((b.Location && b.Location.locations) || []).find((x) => x.label === 3); return (b.meta && b.meta.asteroid && b.meta.asteroid.name) || (l ? 'Asteroid #' + l.id : ''); };
    const lotOf = (b) => { const l = ((b.Location && b.Location.locations) || []).find((x) => x.label === 4); return l ? Math.floor(l.id / 4294967296) : ''; };
    const blds = (D.allB || []).filter((b) => ((b.Building || {}).status || 0) >= 1).map((b) => {
      const B = b.Building || {}, type = A.BT[B.buildingType] || 'Building';
      let st = STAT[B.status] || 'Other';
      if (B.status === 1 && B.plannedAt && B.plannedAt + 172800 < now) st = 'Planned (expired)';
      return { ast: astOf(b), lot: lotOf(b), name: (b.Name && b.Name.name) || type + ' #' + b.id, type, status: st, crew: crewN[b.Control && b.Control.controller && b.Control.controller.id] || '' };
    }).sort((a, b) => a.ast.localeCompare(b.ast) || a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
    // Crews
    const CMC = A.CMC || {}, cm = D.crewmates || {};
    const crews = (D.crewList || []).filter((c) => c.mates > 0).map((c) => ({
      name: c.name, ast: c.ast || '', place: c.place || '', n: c.mates,
      mates: (c.roster || []).map((id) => { const m = cm[id] || {}, cl = CMC[m.class] || ''; return (c.mn[id] || 'Crewmate #' + id) + (cl ? ' (' + cl + ')' : ''); }).join(', '),
      food: c.food == null ? '' : Math.round(c.food * 100) + '%', busy: c.busy || '',
    })).sort((a, b) => a.ast.localeCompare(b.ast) || a.name.localeCompare(b.name));
    // Ships
    const ships = (D.ships || []).map((s) => ({
      name: s.name, id: s.id, type: s.type, ast: s.ast || '', place: s.place || '', crew: crewN[s.crewId] || '',
      prop: t3(s.prop || 0), cargo: s.capM ? t3(s.useM / 1e6) + ' of ' + t3(s.capM / 1e6) + ' t' : '', carry: s.carry || '',
    })).sort((a, b) => a.ast.localeCompare(b.ast) || a.name.localeCompare(b.name));
    return { wallet: D.wallet || '', when: D.when || '', astNames: asts.map((a) => a.name), stock, blds, crews, ships };
  }

  // ---- CSV: sections one after another in one file ----
  function csvOut(G) {
    const c = (v) => { let t = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; };
    const row = (a) => a.map((x) => (typeof x === 'number' ? x : c(x))).join(',') + '\n';
    let s = row(["Quartermaster Skippy's Command Deck – full list"]) + row(['Wallet', G.wallet]) + row(['Game data from', G.when]) + '\n';
    s += row(['STOCK']) + row(['Product', 'Type', 'Unit', ...G.astNames, 'Total']);
    G.stock.forEach((x) => { s += row([x.name, x.type, x.unit, ...x.v, x.total]); });
    s += '\n' + row(['BUILDINGS']) + row(['Asteroid', 'Lot', 'Name', 'Type', 'Status', 'Crew']);
    G.blds.forEach((x) => { s += row([x.ast, x.lot, x.name, x.type, x.status, x.crew]); });
    s += '\n' + row(['CREWS']) + row(['Crew', 'Asteroid', 'Where', 'Crewmates', 'Who', 'Food', 'Busy until']);
    G.crews.forEach((x) => { s += row([x.name, x.ast, x.place, x.n, x.mates, x.food, x.busy]); });
    s += '\n' + row(['SHIPS']) + row(['Ship', 'ID', 'Type', 'Asteroid', 'Where', 'Crew', 'Propellant (t)', 'Cargo hold', 'Carrying']);
    G.ships.forEach((x) => { s += row([x.name, x.id, x.type, x.ast, x.place, x.crew, x.prop, x.cargo, x.carry]); });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + s], { type: 'text/csv' }));
    a.download = 'influence-command_' + stamp() + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
  }

  // ---- PDF: styled page in the game's look, printed to PDF ----
  function pdfOut(G) {
    const e = Y().esc, n = (x) => (typeof x === 'number' ? (x ? x.toLocaleString('en-GB', { maximumFractionDigits: 3 }) : '–') : e(x));
    const tbl = (head, rows, numCols) => '<table><thead><tr class="sp"><td colspan="' + head.length + '"></td></tr><tr>' + head.map((h, i) => '<th' + (numCols.includes(i) ? ' class="r"' : '') + '>' + e(h) + '</th>').join('') + '</tr></thead><tbody>' +
      (rows.length ? rows.map((r) => '<tr>' + r.map((x, i) => '<td' + (numCols.includes(i) ? ' class="r"' : '') + '>' + n(x) + '</td>').join('') + '</tr>').join('') : '<tr><td colspan="' + head.length + '" class="none">None</td></tr>') + '</tbody><tfoot><tr class="sp"><td colspan="' + head.length + '"></td></tr></tfoot></table>';
    const astCols = G.astNames.map((_, i) => 3 + i);
    const sec = (icon, title, count, body) => '<section><h2><span class="ic">' + icon + '</span>' + e(title) + ' <span class="ct">' + count + '</span></h2>' + body + '</section>';
    const html = '<!doctype html><html><head><meta charset="utf-8"><title>Command Deck – full list</title>' +
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rye&display=block"><style>' +
      '@page{size:A4 landscape;margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      'html,body{margin:0;background:#05070a;color:#d7e0ea;font:9.5pt/1.35 -apple-system,"Segoe UI",Helvetica,Arial,sans-serif}' +
      'body{padding:12mm 12mm 6mm}' +
      'header{text-align:center;padding-bottom:5mm;margin-bottom:5mm;border-bottom:1px solid #5fc3e4;box-shadow:0 1px 10px rgba(95,195,228,.6)}' +
      'h1{font-family:Rye,Georgia,serif;font-weight:400;text-transform:uppercase;font-size:24pt;margin:0;color:#e6f6fc;text-shadow:0 0 8px rgba(95,195,228,.8)}h1 b{font-weight:400;color:#5fc3e4}' +
      '.sub{color:#8b9ab0;font-size:9pt;margin-top:2mm}.sub b{color:#d7e0ea;font-weight:600}' +
      'section{margin-bottom:7mm}section+section{break-before:page;padding-top:2mm}' +
      'h2{font-size:13pt;letter-spacing:.12em;text-transform:uppercase;color:#5fc3e4;margin:0 0 3mm;padding:2mm 3mm;border-left:3px solid #5fc3e4;background:linear-gradient(90deg,rgba(95,195,228,.16),rgba(95,195,228,0))}' +
      'h2 .ic{margin-right:2mm}h2 .ct{color:#8b9ab0;font-size:9pt;letter-spacing:0;text-transform:none}' +
      'table{width:100%;border-collapse:collapse}tr.sp td{height:8mm;padding:0;border:0;background:none!important}tfoot{display:table-footer-group}thead{display:table-header-group}tr{break-inside:avoid}' +
      'th{background:#0f1a26;color:#8fe3ff;font-weight:600;text-align:left;padding:1.6mm 2mm;border-bottom:1px solid #5fc3e4;font-size:8.5pt}' +
      'td{padding:1.2mm 2mm;border-bottom:1px solid #1a212c;vertical-align:top}tbody tr:nth-child(even) td{background:#0b1017}' +
      '.r{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}td.r:last-child{color:#e6f6fc;font-weight:600}.none{color:#5b6677;text-align:center}' +
      'footer{color:#5b6677;font-size:8pt;text-align:center;margin-top:4mm}' +
      '</style></head><body>' +
      '<header><h1>Quartermaster Skippy\'s <b>Command Deck</b></h1><div class="sub">Full list for wallet <b>' + e(G.wallet) + '</b> · game data from <b>' + e(G.when) + '</b></div></header>' +
      sec('📦', 'Stock', G.stock.length + ' products', tbl(['Product', 'Type', 'Unit', ...G.astNames, 'Total'], G.stock.map((x) => [x.name, x.type, x.unit, ...x.v, x.total]), [...astCols, 3 + G.astNames.length])) +
      sec('🏭', 'Buildings', G.blds.length + ' buildings', tbl(['Asteroid', 'Lot', 'Name', 'Type', 'Status', 'Crew'], G.blds.map((x) => [x.ast, x.lot === '' ? '' : '#' + x.lot, x.name, x.type, x.status, x.crew]), [])) +
      sec('👥', 'Crews', G.crews.length + ' crews', tbl(['Crew', 'Asteroid', 'Where', 'Crewmates', 'Food', 'Busy until'], G.crews.map((x) => [x.name, x.ast, x.place, x.mates, x.food, x.busy]), [4])) +
      sec('🚀', 'Ships', G.ships.length + ' ships', tbl(['Ship', 'Type', 'Asteroid', 'Where', 'Crew', 'Propellant (t)', 'Cargo hold', 'Carrying'], G.ships.map((x) => [x.name + ' #' + x.id, x.type, x.ast, x.place, x.crew, x.prop, x.cargo, x.carry]), [5])) +
      '<footer>A community tool from Adalia Academy · your-command.adalia.academy · not an official Influence site</footer></body></html>';
    const old = document.getElementById('yic-print'); if (old) old.remove();
    const f = document.createElement('iframe');
    f.id = 'yic-print'; f.setAttribute('aria-hidden', 'true');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    f.onload = () => {
      const w = f.contentWindow, go = () => { try { w.focus(); w.print(); } catch (x) {} };
      const fr = w.document.fonts; (fr && fr.ready ? Promise.race([fr.ready, new Promise((r) => setTimeout(r, 2500))]) : Promise.resolve()).then(() => setTimeout(go, 150));
    };
    f.srcdoc = html;
    document.body.appendChild(f);
    window.__yicPdfHTML = html; // for testing
  }

  // ---- small choice panel under the download button ----
  function panel(btn) {
    let p = document.getElementById('dlp');
    if (p) { p.remove(); return; }
    if (!document.getElementById('dlp-css')) {
      const st = document.createElement('style'); st.id = 'dlp-css';
      st.textContent = '#dlp{position:fixed;z-index:60;background:var(--panel,#0f141c);border:1px solid #5fc3e4;border-radius:8px;padding:10px;box-shadow:0 0 16px rgba(95,195,228,.35),0 8px 20px rgba(0,0,0,.6);display:flex;flex-direction:column;gap:8px;min-width:230px}' +
        '#dlp .t{color:#8fe3ff;font-weight:600;font-size:13px}#dlp .s{color:#8b9ab0;font-size:12px;margin-top:-4px}#dlp button{text-align:left;padding:8px 10px}#dlp button small{display:block;color:#8b9ab0;font-size:11px}';
      document.head.appendChild(st);
    }
    p = document.createElement('div'); p.id = 'dlp';
    p.innerHTML = '<div class="t">Download your full list</div><div class="s">Stock, buildings, crews and ships</div>' +
      '<button data-dl="csv">📊 Spreadsheet (CSV)<small>Opens in Numbers or Excel</small></button>' +
      '<button data-dl="pdf">📄 PDF<small>Choose "Save as PDF" in the print window</small></button>';
    document.body.appendChild(p);
    const r = btn.getBoundingClientRect();
    p.style.top = r.bottom + 6 + 'px';
    p.style.left = Math.max(8, Math.min(r.right - p.offsetWidth, innerWidth - p.offsetWidth - 8)) + 'px';
    p.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-dl]'); if (!b) return;
      ev.stopPropagation(); p.remove();
      const G = gather(); b.dataset.dl === 'csv' ? csvOut(G) : pdfOut(G);
    });
    setTimeout(() => {
      const off = (ev) => { if (!p.contains(ev.target) && ev.target !== btn) { p.remove(); document.removeEventListener('click', off); } };
      document.addEventListener('click', off);
    }, 0);
    document.addEventListener('keydown', function esc(ev) { if (ev.key === 'Escape') { p.remove(); document.removeEventListener('keydown', esc); } });
  }

  window.YICX = panel;
  window.YICX_gather = gather; window.YICX_pdf = pdfOut; window.YICX_csv = csvOut;
})();
