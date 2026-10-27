/* Trade Deck look – Skippy's Command Deck (test on ?beta=1, 27 Oct 2026)
   An exchange board above every Trade Deck page, like an old split-flap station board:
   the belt's busiest products with the best price to buy (lowest for sale) and to sell
   (highest wanted), a ticker of recent trades along the bottom, and a light for your own
   open orders. Click a product to open it on Market › Whole belt.
   Below it the page sits on a gold console (body.dk-trade). */
(function () {
  'use strict';
  if (!window.YICDECKS) return;
  const COL = '#ffd24a';
  const ROWS = 8;
  const CSS = `
body.dk-trade #main{border:1px solid rgba(255,210,74,.3);border-top:3px solid ${COL};border-radius:0 0 14px 14px;background:linear-gradient(180deg,rgba(255,210,74,.05),rgba(5,7,10,0) 220px),repeating-linear-gradient(90deg,rgba(255,210,74,.03) 0 1px,transparent 1px 48px),#0b0a06;box-shadow:inset 0 0 40px -18px ${COL},0 0 26px -14px ${COL};margin:0 16px 20px!important}
body.dk-trade #main h2,body.dk-trade #main th{color:#ffe39a}
#deckhero[data-deck="trade"]{margin:14px 16px 0;position:relative;padding:32px 14px 0;background:linear-gradient(180deg,#201b0e,#0d0b06);border:1px solid #3a321a;border-bottom:0;border-radius:10px 10px 0 0}
.tb-plate{position:absolute;left:50%;top:0;transform:translateX(-50%);padding:3px 24px 4px;background:#0d0b06;clip-path:polygon(0 0,100% 0,92% 100%,8% 100%);font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.4em;color:#ffe39a;text-shadow:0 0 8px rgba(255,210,74,.8);white-space:nowrap}
.tb-read{position:absolute;left:16px;top:7px;font:600 11px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.08em;color:#ffe39a;text-transform:uppercase}
.tb-read b{color:#e6ebf2}
.tb-mine{position:absolute;right:16px;top:6px;font:600 11px/1.4 system-ui,sans-serif;color:#c9b98a;letter-spacing:.06em;text-transform:uppercase}
.tb-lamp{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:-1px;background:var(--l);box-shadow:0 0 8px var(--l)}
.tb-board{max-width:980px;margin:0 auto;padding:8px;background:#050504;border:2px solid #2c2614;border-radius:6px;box-shadow:inset 0 0 18px rgba(0,0,0,.9)}
.tb-head,.tb-r{display:grid;grid-template-columns:minmax(0,2.4fr) minmax(0,1.3fr) minmax(0,1.3fr) 70px;gap:6px;align-items:center}
.tb-head{padding:0 6px 6px;font:700 10.5px system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#8a7a4c}
.tb-head span:not(:first-child),.tb-r > span:not(:first-child){text-align:right}
.tb-r{all:unset;box-sizing:border-box;display:grid;grid-template-columns:minmax(0,2.4fr) minmax(0,1.3fr) minmax(0,1.3fr) 70px;gap:6px;align-items:center;width:100%;cursor:pointer;padding:3px 6px;border-radius:3px}
.tb-r:hover,.tb-r:focus-visible{background:rgba(255,210,74,.08);box-shadow:inset 0 0 0 1px rgba(255,210,74,.5)}
.tb-cell{display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;padding:4px 7px;background:linear-gradient(180deg,#17150f 0 49%,#0a0907 50% 100%);border-radius:3px;font:700 14px/1.2 ui-monospace,Menlo,monospace;color:${COL};text-shadow:0 0 6px rgba(255,210,74,.45);position:relative;animation:tbFlip .5s ease-out both;animation-delay:var(--d)}
.tb-cell img{width:18px;height:18px;vertical-align:-4px;margin-right:6px}
.tb-cell small{font:11px ui-monospace,Menlo,monospace;color:#a8975f;text-shadow:none}
.tb-buy{color:#7ef0a4;text-shadow:0 0 6px rgba(63,214,138,.45)}
@keyframes tbFlip{0%{transform:rotateX(90deg);opacity:.2}60%{transform:rotateX(-12deg);opacity:1}100%{transform:none}}
.tb-tick{margin:8px -14px 0;overflow:hidden;white-space:nowrap;background:#050504;border-top:2px solid ${COL};box-shadow:0 -2px 14px -2px ${COL};font:600 12.5px/26px ui-monospace,Menlo,monospace;color:#e8d9a8}
.tb-tick span.run{display:inline-block;padding-left:100%;animation:tbRun var(--t,90s) linear infinite}
.tb-tick:hover span.run{animation-play-state:paused}
.tb-tick i{font-style:normal;color:${COL};margin:0 18px}
.tb-tick b{color:#7ef0a4;font-weight:600}
.tb-tick em{font-style:normal;color:#ff9a7a}
@keyframes tbRun{to{transform:translateX(-100%)}}
.tb-load{padding:24px;text-align:center;color:#a8975f;font:13px system-ui,sans-serif}
@media (max-width:700px){.tb-mine,.tb-read{position:static;display:block;margin:0 0 4px}.tb-head,.tb-r{grid-template-columns:minmax(0,2fr) minmax(0,1.2fr) minmax(0,1.2fr)}.tb-head span:last-child,.tb-r > span:last-child{display:none}}
@media (prefers-reduced-motion:reduce){.tb-cell{animation:none}.tb-tick span.run{animation:none;padding-left:16px}}
`;

  function addCss() {
    if (document.getElementById('tb-css')) return;
    const s = document.createElement('style');
    s.id = 'tb-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  let TR = null, trLoad = null; // recent trades, fetched once per visit
  const num = (v) => (+v.toFixed(v < 1 ? 4 : v < 100 ? 2 : 0)).toLocaleString();

  function hero(el) {
    addCss();
    const Y = window.YIC;
    if (!Y || !Y.D) return;
    const esc = Y.esc;
    const unit = (p) => (Y.PR[p] && Y.PR[p][2]) || 1000;
    // price as shown in the game: per kg for bulk, each for items
    const price = (p, raw) => Y.isAt(p) ? num(raw / 1e6) + '<small> each</small>' : num(raw / 1e6 * 1000 / unit(p)) + '<small> /kg</small>';
    const amount = (p, a) => Y.isAt(p) ? a.toLocaleString() : Y.fmtT(Y.kg(p, a) / 1000);
    const ago = (t) => {
      const s = Date.now() / 1000 - t;
      return s < 3600 ? Math.max(1, Math.round(s / 60)) + 'm ago' : s < 86400 ? Math.round(s / 3600) + 'h ago' : Math.round(s / 86400) + 'd ago';
    };

    function draw() {
      if (!el.isConnected) return;
      const BD = window.BELTDATA;
      const BELT = BD && BD.get(draw);
      if (!BELT && BD && BD.loading) BD.loading.then(() => setTimeout(draw, 0));
      const mine = (Y.D.orders || []).length;
      let h = '<div class="tb-plate">TRADE DECK</div>' +
        '<div class="tb-mine"><span class="tb-lamp" style="--l:' + (mine ? '#7ef0a4' : '#5a5236') + '"></span>' +
        (mine ? 'Your open orders: <b style="color:#e6ebf2">' + mine + '</b>' : 'No open orders of yours') + '</div>';
      if (!BELT || BELT.err) {
        el.innerHTML = h + '<div class="tb-load">' + (BELT && BELT.err ? 'The exchange board could not load.' : 'Loading the exchange board…') + '</div>';
        return;
      }
      const g = {};
      (BELT.orders || []).forEach((o) => {
        if (!(o[2] > 0 && o[3] > 0)) return;
        const x = (g[o[0]] = g[o[0]] || { p: o[0], n: 0, sell: Infinity, buy: 0, amt: 0 });
        if (o[1] === 2) {
          x.n++;
          x.amt += o[2];
          x.sell = Math.min(x.sell, o[3]);
        } else x.buy = Math.max(x.buy, o[3]);
      });
      const list = Object.values(g).filter((x) => x.n).sort((a, b) => b.n - a.n).slice(0, ROWS);
      const sells = (BELT.orders || []).filter((o) => o[1] === 2).length, buys = (BELT.orders || []).filter((o) => o[1] === 1).length;
      h += '<div class="tb-read"><b>' + sells.toLocaleString() + '</b> for sale · <b>' + buys.toLocaleString() + '</b> wanted</div>' +
        '<div class="tb-board"><div class="tb-head"><span>Busiest products</span><span>Buy from</span><span>Sell to</span><span>Listings</span></div>' +
        list.map((x, i) => {
          const d = '--d:' + (i * 0.06).toFixed(2) + 's';
          return '<button class="tb-r" data-p="' + x.p + '" title="' + esc(Y.pn(x.p)) + ' – ' + amount(x.p, x.amt) + ' for sale. Open on the Market page">' +
            '<span class="tb-cell" style="' + d + '">' + Y.ricon(x.p, 18) + esc(Y.pn(x.p)) + '</span>' +
            '<span class="tb-cell" style="' + d + '">' + price(x.p, x.sell) + '</span>' +
            '<span class="tb-cell tb-buy" style="' + d + '">' + (x.buy ? price(x.p, x.buy) : '<small>no offers</small>') + '</span>' +
            '<span class="tb-cell" style="' + d + '">' + x.n + '</span></button>';
        }).join('') + '</div>';
      // Ticker of recent trades (markethist.php, server-cached; one request per visit)
      let tick = '';
      if (TR && TR.length) {
        const mk = BELT.markets || {};
        tick = TR.slice(0, 30).map((t) => {
          const m = mk[t[5]];
          return esc(Y.pn(t[2])) + ' ' + amount(t[2], t[3]) + ' @ ' + price(t[2], +t[4]).replace(/<\/?small>/g, '') +
            (t[1] === 'S' ? ' <b>bought</b>' : ' <em>sold</em>') + (m && m.ast ? ' · ' + esc(m.ast) : '') + ' · ' + ago(t[0]);
        }).join('<i>◆</i>');
      }
      h += '<div class="tb-tick">' + (tick
        ? '<span class="run" style="--t:' + Math.max(40, Math.min(30, TR.length) * 6) + 's">' + tick + '</span>'
        : '<span class="run" style="--t:30s">' + (trLoad ? 'Fetching recent trades…' : 'Recent trades will appear here') + '</span>') + '</div>';
      el.innerHTML = h;
    }

    if (!TR && !trLoad)
      trLoad = fetch('markethist.php?range=100', { cache: 'no-store' })
        .then((r) => r.json())
        .then((j) => (TR = j.trades || []))
        .catch(() => (TR = []))
        .finally(() => {
          trLoad = null;
          draw();
        });
    draw();

    el.addEventListener('click', (e) => {
      const r = e.target.closest('[data-p]');
      if (!r) return;
      if (window.YICmarketOpen) window.YICmarketOpen(r.dataset.p);
      const b = document.getElementById('vK');
      if (b && !b.classList.contains('on')) b.click();
      else Y.draw();
      let n = 0;
      const find = () => {
        const row = document.querySelector('#main tr.prow[data-p="' + r.dataset.p + '"]');
        if (row) row.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
        else if (n++ < 30) setTimeout(find, 200);
      };
      find();
    });
  }

  window.YICDECKHERO = window.YICDECKHERO || {};
  window.YICDECKHERO.trade = hero;
})();
