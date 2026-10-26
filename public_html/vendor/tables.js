/* Tables – one look for every table on the site (TEST: ?beta=1 only, 26 Oct 2026)
   - Headings stay in view under the menu while you scroll down a long table.
   - Soft stripes on alternate rows.
   - Pointer + arrows only on headings you can actually click to sort.
   - Simple tables with no sort of their own can be sorted by clicking a heading
     (numbers, tonnes, times left and dates are sorted as values, not as text).
   Pages are not changed: this file works on the tables after each page draws. */
(function () {
  'use strict';
  var TBL = /[?&]beta=1/.test(location.search);
  if (!TBL) return;

  var CSS =
    '#main th{cursor:default;position:relative;z-index:3}' +
    '#main th.yic-s{cursor:pointer}' +
    '#main th.yic-s:hover{color:var(--text)}' +
    '#main th.yic-s::after{content:" \\21C5";opacity:.35;font-size:.85em}' +
    '#main th.yic-asc::after{content:" \\25B2";opacity:1;color:#6ec6e6}' +
    '#main th.yic-desc::after{content:" \\25BC";opacity:1;color:#6ec6e6}' +
    '#main tr.yic-z>td{background-image:linear-gradient(rgba(255,255,255,.045),rgba(255,255,255,.045))}' +
    '#main table.yic-stuck thead th{box-shadow:0 2px 0 rgba(110,198,230,.55)}';

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
    if (td.hasAttribute('data-sort')) { var d = td.getAttribute('data-sort'); return isNaN(d) ? { s: d } : { n: +d }; }
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
      tr.classList.toggle('yic-z', z);
      z = !z;
    });
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
