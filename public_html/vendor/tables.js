/* Tables – one look for every table on the site (LIVE 26 Oct 2026, tested on ?beta=1)
   - Headings stay in view under the menu while you scroll down a long table.
   - Soft stripes on alternate rows.
   - Pointer + arrows only on headings you can actually click to sort.
   - Simple tables with no sort of their own can be sorted by clicking a heading
     (numbers, tonnes, times left and dates are sorted as values, not as text).
   Pages are not changed: this file works on the tables after each page draws. */
(function () {
  'use strict';
  var CSS =
    '#main th{cursor:default;position:relative;z-index:3}' +
    '#main th.yic-s{cursor:pointer}' +
    '#main th.yic-s:hover{color:var(--text)}' +
    '#main th.yic-s::after{content:" \\21C5";opacity:.35;font-size:.85em}' +
    '#main th.yic-asc::after{content:" \\25B2";opacity:1;color:#6ec6e6}' +
    '#main th.yic-desc::after{content:" \\25BC";opacity:1;color:#6ec6e6}' +
    '#main tr.yic-z>td{background-image:linear-gradient(rgba(255,255,255,.045),rgba(255,255,255,.045))}' +
    '#main table.yic-stuck thead th{box-shadow:0 2px 0 rgba(110,198,230,.55)}' +
    '.yic-flt{display:flex;align-items:center;gap:10px;margin:0 0 8px}' +
    '.yic-flt input{min-width:0!important;width:260px!important;flex:0 1 260px!important;max-width:100%;padding:6px 10px;font-size:15px;border-radius:8px;border:1px solid #3a4658;background:#0f141c;color:var(--text)}' +
    '.yic-flt input:focus{outline:none;border-color:#6ec6e6;box-shadow:0 0 8px rgba(110,198,230,.5)}' +
    '.yic-flt span{color:var(--muted);font-size:13px}' +
    '.yic-flt button{padding:4px 10px;font-size:13px}';

  // Filter box above long tables (TEST: ?beta=1 only, 26 Oct 2026)
  var FLT = /[?&]beta=1/.test(location.search);
  var FMIN = 8;                 // only tables with at least this many rows get a box
  var ftext = {};               // what was typed, per page + table, kept across redraws

  function addCss() {
    if (document.getElementById('yic-tbl-css')) return;
    var s = document.createElement('style');
    s.id = 'yic-tbl-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  var main = null, busy = false, state = {};

  function view() { try { return (window.YIC && window.YIC.view) || ''; } catch (e) { return ''; } }
  function heads(t) { return t.tHead ? Array.prototype.slice.call(t.tHead.rows[0] ? t.tHead.rows[0].cells : []) : []; }
  function rowsOf(t) { var b = t.tBodies[0]; return b ? Array.prototype.slice.call(b.rows) : []; }

  // A table can be sorted here when it has no sort of its own and every row is a plain data row.
  function canSort(t) {
    if (!t.tHead || t.tHead.rows.length !== 1 || !t.tBodies[0]) return false;
    if (t.classList.contains('nosort') || t.querySelector('th[data-k],th[data-ms]')) return false;
    if (main.querySelector('select[id*="ort"]')) return false;      // the page has its own "Sort by"/"Order by"
    var n = heads(t).length, r = rowsOf(t);
    if (r.length < 2) return false;
    for (var i = 0; i < r.length; i++) {
      if (r[i].cells.length !== n) return false;
      for (var j = 0; j < r[i].cells.length; j++) if (r[i].cells[j].colSpan > 1) return false;
    }
    return true;
  }

  var MON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  var UNIT = { kg: 1, t: 1e3, kt: 1e6, k: 1e3, K: 1e3, M: 1e6 };

  // Value of one cell: {n: number} or {s: text}; null = empty (always last)
  function val(td) {
    if (td.hasAttribute('data-sort')) { var d = td.getAttribute('data-sort'); if (d === '') return null; return isNaN(d) ? { s: d } : { n: +d }; }
    var t = (td.innerText || '').replace(/\s+/g, ' ').trim();
    if (!t || /^[–—-]$/.test(t) || /^none\b/i.test(t)) return null;
    if (/^ready to collect/i.test(t) || /^any moment/i.test(t)) return { n: 0 };
    var m = t.match(/^(?:(\d+)\s*d)?\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?(?:\s|$)/);
    if (m && (m[1] || m[2] || m[3]) && /^\d+\s*[dhm]\b/.test(t)) return { n: (+(m[1] || 0)) * 1440 + (+(m[2] || 0)) * 60 + (+(m[3] || 0)) };
    m = t.match(/^(\d{1,2}) ([A-Z][a-z]{2})(?: (\d{4}))?(?:,? (\d{1,2}):(\d{2}))?/);
    if (m && MON[m[2]] !== undefined) return { n: new Date(+(m[3] || new Date().getFullYear()), MON[m[2]], +m[1], +(m[4] || 0), +(m[5] || 0)).getTime() };
    m = t.match(/^[#~+≈$£]?\s*(-?[\d,]*\.?\d+)\s*(kt|kg|t|k|K|M)?\b/);
    if (m) return { n: parseFloat(m[1].replace(/,/g, '')) * (UNIT[m[2]] || 1) };
    return { s: t.toLowerCase() };
  }

  function sortTable(t, col, dir) {
    var b = t.tBodies[0], r = rowsOf(t);
    var keyed = r.map(function (tr, i) { return { tr: tr, v: val(tr.cells[col]), i: i }; });
    keyed.sort(function (a, c) {
      if (!a.v && !c.v) return a.i - c.i;
      if (!a.v) return 1;
      if (!c.v) return -1;
      var x;
      if (a.v.n !== undefined && c.v.n !== undefined) x = a.v.n - c.v.n;
      else if (a.v.n !== undefined) x = -1;
      else if (c.v.n !== undefined) x = 1;
      else x = a.v.s.localeCompare(c.v.s);
      return x * dir || a.i - c.i;
    });
    var same = keyed.every(function (k, i) { return k.tr === r[i]; });
    if (!same) keyed.forEach(function (k) { b.appendChild(k.tr); });
  }

  function isNumCol(t, col) {
    var r = rowsOf(t), n = 0, num = 0;
    for (var i = 0; i < r.length && n < 30; i++) { var v = val(r[i].cells[col]); if (!v) continue; n++; if (v.n !== undefined) num++; }
    return n && num / n >= 0.8;
  }

  function stripes(t) {
    var z = false;
    rowsOf(t).forEach(function (tr) {
      if (tr.cells.length === 1 && tr.cells[0].colSpan > 1) { tr.classList.remove('yic-z'); return; }  // opened detail rows
      if (tr.style.display === 'none') return;
      tr.classList.toggle('yic-z', z);
      z = !z;
    });
  }

  // Data rows (opened detail rows ride along with the row above them)
  function isDetail(tr) { return tr.cells.length === 1 && tr.cells[0].colSpan > 1; }
  function applyFilter(t, q, info) {
    var words = q.toLowerCase().split(/\s+/).filter(Boolean), shown = 0, total = 0, last = true;
    rowsOf(t).forEach(function (tr) {
      if (isDetail(tr)) { tr.style.display = last ? '' : 'none'; return; }
      total++;
      var txt = (tr.textContent || '').toLowerCase();
      last = words.every(function (w) { return txt.indexOf(w) >= 0; });
      tr.style.display = last ? '' : 'none';
      if (last) shown++;
    });
    if (info) info.textContent = words.length ? shown + ' of ' + total + ' rows' : '';
    stripes(t);
    stick();
  }
  function filterBox(t, key) {
    var n = rowsOf(t).filter(function (tr) { return !isDetail(tr); }).length;
    var before = t.closest('.wrap') || t;
    var box = before.previousElementSibling;
    if (n < FMIN) { if (box && box.classList.contains('yic-flt')) box.remove(); return; }
    if (!box || !box.classList.contains('yic-flt') || box.dataset.key !== key) {
      box = document.createElement('div');
      box.className = 'yic-flt';
      box.dataset.key = key;
      box.innerHTML = '<input type="search" placeholder="Filter this table…" aria-label="Filter this table"><button type="button" hidden>Clear</button><span></span>';
      before.parentNode.insertBefore(box, before);
      var inp = box.querySelector('input'), clr = box.querySelector('button');
      inp.value = ftext[key] || '';
      var tbl = function () { var x = box.nextElementSibling; return x && (x.tagName === 'TABLE' ? x : x.querySelector('table')); };
      inp.addEventListener('input', function () {
        ftext[key] = inp.value;
        clr.hidden = !inp.value;
        if (tbl()) applyFilter(tbl(), inp.value, box.querySelector('span'));
      });
      clr.addEventListener('click', function () { inp.value = ''; ftext[key] = ''; clr.hidden = true; if (tbl()) applyFilter(tbl(), '', box.querySelector('span')); inp.focus(); });
      clr.hidden = !inp.value;
    }
    applyFilter(t, ftext[key] || '', box.querySelector('span'));
  }

  function setup() {
    if (!main) return;
    busy = true;
    var v = view(), list = main.querySelectorAll('table');
    Array.prototype.forEach.call(list, function (t, ti) {
      // Products: arrow from its own sort
      var own = t.querySelectorAll('th[data-k]');
      if (own.length) {
        var Y = window.YIC || {};
        Array.prototype.forEach.call(own, function (th) {
          var k = isNaN(th.dataset.k) ? th.dataset.k : +th.dataset.k;
          th.classList.add('yic-s');
          th.classList.toggle('yic-asc', Y.sortKey === k && Y.sortDir > 0);
          th.classList.toggle('yic-desc', Y.sortKey === k && Y.sortDir < 0);
        });
      }
      // Market: its own arrows are already in the text, just the pointer
      Array.prototype.forEach.call(t.querySelectorAll('th[data-ms]'), function (th) { th.style.cursor = 'pointer'; });

      if (canSort(t)) {
        var hs = heads(t);
        var key = v + '|' + ti + '|' + hs.map(function (h) { return h.textContent.trim(); }).join('/');
        hs.forEach(function (th, ci) {
          th.classList.add('yic-s');
          if (!th.title) th.title = 'Click to sort';
          if (th.__yicS) return;
          th.__yicS = true;
          th.addEventListener('click', function () {
            var s = state[key];
            if (s && s.col === ci) s.dir = -s.dir;
            else s = state[key] = { col: ci, dir: isNumCol(t, ci) ? -1 : 1 };
            busy = true;
            sortTable(t, s.col, s.dir);
            mark(hs, s);
            stripes(t);
            busy = false;
          });
        });
        var s = state[key];
        if (s && s.col < hs.length) sortTable(t, s.col, s.dir);
        mark(hs, s);
      }
      stripes(t);
      if (FLT && t.tHead) filterBox(t, v + '|' + ti + '|' + heads(t).map(function (h) { return h.textContent.trim(); }).join('/'));
    });
    busy = false;
    stick();
  }

  function mark(hs, s) {
    hs.forEach(function (th, ci) {
      th.classList.toggle('yic-asc', !!s && s.col === ci && s.dir > 0);
      th.classList.toggle('yic-desc', !!s && s.col === ci && s.dir < 0);
    });
  }

  // Headings follow you down: moved just under the sticky menu while the table passes under it.
  function topLine() {
    var bar = document.querySelector('.bar[data-mv="1"]') || document.querySelector('header');
    var y = bar ? bar.getBoundingClientRect().bottom : 0;
    return Math.max(0, y);
  }
  var raf = 0;
  function stick() {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      if (!main) return;
      var top = topLine();
      Array.prototype.forEach.call(main.querySelectorAll('table'), function (t) {
        if (!t.tHead) return;
        var r = t.getBoundingClientRect(), h = t.tHead.getBoundingClientRect().height;
        var last = t.tBodies[0] && t.tBodies[0].rows.length ? t.tBodies[0].rows[t.tBodies[0].rows.length - 1].getBoundingClientRect().height : 0;
        var dy = Math.min(Math.max(0, top - r.top), Math.max(0, r.height - h - last));
        var on = dy > 0.5;
        if (t.__yicDy === dy) return;
        t.__yicDy = dy;
        t.classList.toggle('yic-stuck', on);
        Array.prototype.forEach.call(t.tHead.rows, function (tr) {
          Array.prototype.forEach.call(tr.cells, function (th) { th.style.transform = on ? 'translateY(' + dy + 'px)' : ''; });
        });
      });
    });
  }

  window.addEventListener('scroll', stick, { passive: true });
  window.addEventListener('resize', stick);

  var obs = null, pending = 0;
  function tick() {
    addCss();                                   // the site rebuilds <head> while loading
    var m = document.getElementById('main');
    if (m && m !== main) {
      main = m;
      if (obs) obs.disconnect();
      obs = new MutationObserver(function () {
        if (busy || pending) return;
        pending = setTimeout(function () { pending = 0; setup(); }, 60);
      });
      obs.observe(main, { childList: true, subtree: true });
      setup();
    }
  }
  tick();
  setInterval(tick, 700);
})();
