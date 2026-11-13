/* Crew Quarters look – Skippy's Command Deck (LIVE, 27 Oct 2026)
   A row of crew lockers above every Crew Quarters page. Each crew has its own locker:
   name plate, a window with the crewmates' faces (class colour borders), food bar,
   where they are, and a light on the door (green ready, amber busy, red hungry).
   Click a locker to open that crew on the Crews page.
   Below it the page sits on a green console (body.dk-crew). */
(function () {
  'use strict';
  if (!window.YICDECKS) return;
  // Crew Quarters in Habitat yellow on ?beta=1 (decks by crew + building – Mark trying it, 13 Nov 2026)
  const BLD = /[?&]beta=1\b/.test(location.search);
  const COL = BLD ? '#ffff00' : '#3fd68a';
  const P = BLD
    ? { rgb: '255,255,0', lite: '#fff59a', pale: '#fffbd0', mute: '#a8a68a', d1: '#21200f', d2: '#110f06', d3: '#16150a', d4: '#38361f', d5: '#3d3b24', d6: '#2c2a17', d7: '#1c1b0e' }
    : { rgb: '63,214,138', lite: '#9be8bf', pale: '#c8f5dc', mute: '#8fa79a', d1: '#16211c', d2: '#0b110e', d3: '#0e1512', d4: '#24382d', d5: '#2c3d35', d6: '#1f2c26', d7: '#141c19' };
  const CLASS_COL = { 1: '#884fff', 2: '#e0282e', 3: '#ff8c1a', 4: '#ffd94f', 5: '#4f90ff' };
  const CSS = `
body.dk-crew #main{border:1px solid rgba(${P.rgb},.3);border-top:3px solid ${COL};border-radius:0 0 14px 14px;background:linear-gradient(180deg,rgba(${P.rgb},.06),rgba(5,7,10,0) 220px),repeating-linear-gradient(90deg,rgba(${P.rgb},.03) 0 1px,transparent 1px 48px),#070b0d;box-shadow:inset 0 0 40px -18px ${COL},0 0 26px -14px ${COL};margin:0 16px 20px!important}
body.dk-crew #main h2,body.dk-crew #main th{color:${P.lite}}
#deckhero[data-deck="crew"]{margin:14px 16px 0;position:relative;padding:30px 14px 0;background:linear-gradient(180deg,${P.d1},${P.d2});border:1px solid ${P.d4};border-bottom:0;border-radius:10px 10px 0 0}
.cq-plate{position:absolute;left:50%;top:0;transform:translateX(-50%);padding:3px 24px 4px;background:${P.d2};clip-path:polygon(0 0,100% 0,92% 100%,8% 100%);font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.4em;color:${P.lite};text-shadow:0 0 8px rgba(${P.rgb},.8);white-space:nowrap}
.cq-read{position:absolute;left:16px;top:6px;font:600 11px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.08em;color:${P.lite};text-transform:uppercase}
.cq-read b{color:#e6ebf2}
.cq-row{display:flex;gap:10px;overflow-x:auto;padding:4px 2px 0;scrollbar-width:thin}
.cq-lk{all:unset;box-sizing:border-box;cursor:pointer;flex:0 0 172px;width:172px!important;min-width:0!important;max-width:172px!important;position:relative;display:flex;flex-direction:column;padding:8px 9px 10px;border:1px solid ${P.d5};border-bottom:0;border-radius:6px 6px 0 0;background:linear-gradient(90deg,${P.d7},#1b2621 45%,${P.d7});box-shadow:inset 0 0 0 1px rgba(0,0,0,.4);transition:border-color .15s,box-shadow .15s,transform .15s}
.cq-lk:hover,.cq-lk:focus-visible{border-color:${COL};box-shadow:0 0 14px -3px ${COL},inset 0 0 0 1px rgba(0,0,0,.4);transform:translateY(-2px)}
.cq-vent{height:14px;margin:0 18px 7px 0;background:repeating-linear-gradient(180deg,#0a0f0d 0 2px,#26332d 2px 4px);border-radius:2px}
.cq-led{position:absolute;top:10px;right:10px;width:9px;height:9px;border-radius:50%;background:var(--led);box-shadow:0 0 8px var(--led)}
.cq-led.hot{animation:cqPulse 1.6s ease-in-out infinite}
@keyframes cqPulse{50%{opacity:.35}}
.cq-name{background:${P.d3};border:1px solid rgba(${P.rgb},.35);border-radius:3px;padding:3px 6px;font:600 11px/1.3 system-ui,sans-serif;color:${P.pale};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cq-win{display:flex;flex-wrap:wrap;gap:3px;justify-content:center;align-content:center;min-height:52px;margin:7px 0;padding:5px;background:#060a08;border:1px solid #22302a;border-radius:4px;box-shadow:inset 0 0 10px rgba(0,0,0,.8)}
.cq-win img{width:22px;height:28px;object-fit:cover;object-position:50% 0;border-radius:3px;border:1.5px solid;background:#000}
.cq-lb{font:11px/1.35 system-ui,sans-serif;color:${P.mute};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cq-bar{height:5px;margin:2px 0 5px;background:#232b38;border-radius:3px;overflow:hidden}
.cq-bar i{display:block;height:100%}
.cq-ft{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:5px}
.cq-st{font:600 11px system-ui,sans-serif}
.cq-hd{width:24px;height:5px;border-radius:3px;background:#3a4a43}
.cq-bench{height:14px;margin:0 -14px;background:linear-gradient(180deg,${P.d6},${P.d2});border-top:2px solid ${COL};box-shadow:0 -2px 14px -2px ${COL}}
.cq-none{padding:20px;text-align:center;color:${P.mute};font-size:13px}
.cq-showone .cq-row,.cq-showone .cq-read{display:none!important}
.cq-one{position:relative;padding:4px 3% 10px;max-height:clamp(260px,46vh,560px);overflow:auto;scrollbar-color:${P.d4} transparent}
.cq-back{all:unset;box-sizing:border-box;cursor:pointer;display:inline-block;margin:0 0 8px;padding:3px 12px 4px;border:1px solid ${COL};border-radius:4px;background:${P.d2};font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${COL}}
.cq-back:hover,.cq-back:focus-visible{background:${COL};color:#05070a;box-shadow:0 0 12px ${COL}}
.cq-card .crewcard{margin:0!important;box-shadow:0 0 18px -6px ${COL}}
/* Crew Quarters: no crews list under the lockers (Mark, 27 Oct) */
#deckroom[data-deck="crew"]:not(.scr) + #main{display:none!important}
/* LIVE 9 Nov 2026 (tested on ?beta=1 – Mark): Galley-style crew cards with bigger crewmate pictures; click = all its members */
.cqg{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;max-height:clamp(260px,46vh,560px);overflow:auto;padding:2px 2px 10px;scrollbar-color:${P.d4} transparent}
.cqg-c{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;gap:3px;padding:10px 12px;border:1px solid ${P.d5};border-radius:10px;background:${P.d3};transition:border-color .15s,box-shadow .15s}
.cqg-c:hover,.cqg-c:focus-visible{border-color:${COL};box-shadow:0 0 14px -4px ${COL}}
.cqg-h{display:flex;align-items:center;gap:8px;font:700 14px system-ui,sans-serif;color:#e6ebf2}
.cqg-h .cq-led{position:static;margin-left:auto}
.cqg-s{font:12px/1.35 system-ui,sans-serif;color:${P.mute}}
.cqg-f{display:flex;flex-wrap:wrap;gap:5px;margin-top:4px}
.cqg-f img{width:38px;height:48px;object-fit:cover;object-position:50% 0;border-radius:5px;border:2px solid;background:#000}
.cq-one .cq-back{position:sticky;top:0;z-index:3;box-shadow:0 4px 12px #000}
.cq-mem h3{margin:0 0 10px;font:700 16px system-ui,sans-serif;color:${P.pale}}
.cq-mem .cq-more{all:unset;cursor:pointer;margin-left:10px;color:${COL};font:600 12px system-ui,sans-serif;text-decoration:underline}
@media (max-width:700px){.cq-lk{flex-basis:138px;width:138px!important;max-width:138px!important}.cq-read{display:none}}
@media (prefers-reduced-motion:reduce){.cq-lk{transition:none}.cq-lk:hover{transform:none}.cq-led.hot{animation:none}}
`;

  function addCss() {
    if (document.getElementById('cq-css')) return;
    const s = document.createElement('style');
    s.id = 'cq-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function left(sec) {
    if (sec <= 0) return 'any moment';
    const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
    return d ? d + 'd ' + h + 'h' : h ? h + 'h ' + m + 'm' : m + 'm';
  }

  function locker(c, raw, Y) {
    const esc = Y.esc, cms = Y.D.crewmates || {};
    const now = Date.now() / 1000;
    const ready = raw && raw.Crew && raw.Crew.readyAt;
    const busy = ready && ready > now;
    const hungry = c.food != null && c.food < 0.5;
    const led = hungry ? '#ff6b6b' : busy ? '#ffab3d' : COL;
    const pct = Math.round((c.food || 0) * 100);
    const fcol = c.food == null ? '#5b6677' : c.food >= 0.65 ? COL : c.food >= 0.5 ? '#ffab3d' : '#ff6b6b';
    const faces = c.roster.map((id) => {
      const x = cms[id] || {}, col = CLASS_COL[x.class] || '#6b7a90';
      const nm = (c.mn && c.mn[id]) || 'Crewmate #' + id;
      return '<img data-face="' + id + '" src="cimg.php?id=' + id + '&s=1" alt="" loading="lazy" title="' + esc(nm) + '" style="border-color:' + col + '">';
    }).join('');
    const where = c.place && /^Aboard|^In flight/.test(c.place) ? c.place.split(' · ')[0] : c.ast || c.place || '–';
    return '<button class="cq-lk" data-crew="' + esc(c.id) + '" title="' + esc(c.name + ' – ' + (c.place || '')) + '">' +
      '<span class="cq-led' + (hungry ? ' hot' : '') + '" style="--led:' + led + '"></span><span class="cq-vent"></span>' +
      '<span class="cq-name">' + esc(c.name) + '</span>' +
      '<span class="cq-win">' + faces + '</span>' +
      '<span class="cq-lb">Food ' + (c.food == null ? '–' : pct + '%') + (hungry ? ' · hungry' : '') + '</span>' +
      '<span class="cq-bar"><i style="width:' + pct + '%;background:' + fcol + '"></i></span>' +
      '<span class="cq-lb">' + esc(where) + '</span>' +
      '<span class="cq-ft"><span class="cq-st" style="color:' + (busy ? '#ffab3d' : COL) + '">' + (busy ? 'Busy · ' + left(ready - now) : 'Ready') + '</span><span class="cq-hd"></span></span>' +
      '</button>';
  }

  const BETA = true; // crew cards LIVE 9 Nov 2026 (were test only)
  function card(c, raw, Y) {
    const esc = Y.esc, cms = Y.D.crewmates || {}, now = Date.now() / 1000;
    const ready = raw && raw.Crew && raw.Crew.readyAt, busy = ready && ready > now;
    const hungry = c.food != null && c.food < 0.5, pct = Math.round((c.food || 0) * 100);
    const led = hungry ? '#ff6b6b' : busy ? '#ffab3d' : COL;
    const fcol = c.food == null ? '#5b6677' : c.food >= 0.65 ? COL : c.food >= 0.5 ? '#ffab3d' : '#ff6b6b';
    const where = c.place && /^Aboard|^In flight/.test(c.place) ? c.place.split(' · ')[0] : c.ast || c.place || '–';
    const faces = c.roster.map((id) => '<img data-face="' + id + '" src="cimg.php?id=' + id + '&s=1" alt="" loading="lazy" title="' + esc((c.mn && c.mn[id]) || 'Crewmate #' + id) + '" style="border-color:' + (CLASS_COL[(cms[id] || {}).class] || '#6b7a90') + '">').join('');
    return '<button type="button" class="cqg-c" data-crew="' + esc(c.id) + '"><span class="cqg-h">' + esc(c.name) + '<i class="cq-led' + (hungry ? ' hot' : '') + '" style="--led:' + led + '"></i></span>' +
      '<span class="cqg-s">' + esc(where) + ' · ' + (busy ? '<span style="color:#ffab3d">busy ' + left(ready - now) + '</span>' : '<span style="color:' + COL + '">ready</span>') + '</span>' +
      '<span class="cqg-s">Food ' + (c.food == null ? '–' : pct + '%') + (hungry ? ' · hungry' : '') + '</span><span class="cq-bar"><i style="width:' + pct + '%;background:' + fcol + '"></i></span>' +
      '<span class="cqg-f">' + faces + '</span></button>';
  }
  // all the crew's members on the viewscreen: big pictures, name, class, traits (Mark, 9 Nov)
  function openMembers(id, el) {
    const Y = window.YIC, c = ((Y.D && Y.D.crewList) || []).find((x) => String(x.id) === String(id));
    if (!c) return;
    let one = el.querySelector('.cq-one');
    if (!one) { one = document.createElement('div'); one.className = 'cq-one'; el.appendChild(one); }
    one.scrollTop = 0;
    one.innerHTML = '<button type="button" class="cq-back">◂ All crews</button><div class="cq-mem"><h3>' + Y.esc(c.name) + ' <span style="font-weight:400;color:#8fa79a;font-size:13px">· ' + c.roster.length + ' crewmate' + (c.roster.length === 1 ? '' : 's') + ' · ' + Y.esc(c.place || c.ast || '') + '</span><button type="button" class="cq-more" data-full="' + Y.esc(c.id) + '">Full crew details ▸</button></h3>' + (Y.crewTraits ? Y.crewTraits(c) : '') + '</div>';
    el.classList.add('cq-showone');
    if (Y.fillFacesIn) Y.fillFacesIn(one);
  }

  // Show that crew's card on the viewscreen in place of the lockers (Mark, 27 Oct)
  function openCrew(id, el) {
    const b = document.getElementById('vC');
    if (b && !b.classList.contains('on')) b.click();
    let n = 0;
    const find = () => {
      if (!el.isConnected) return;
      const card = [...document.querySelectorAll('#main .crewcard')].find((c) => (c.textContent || '').includes('#' + id));
      if (!card) {
        // the crew may be hidden by the rock filter – show all rocks and look again
        const box = document.getElementById('ast');
        if (n === 4 && box && box.value) {
          box.value = '';
          box.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return n++ < 25 && setTimeout(find, 150);
      }
      let one = el.querySelector('.cq-one');
      if (!one) {
        one = document.createElement('div');
        one.className = 'cq-one';
        el.appendChild(one);
      }
      one.innerHTML = '<button type="button" class="cq-back">◂ All lockers</button><div class="cq-card"></div>';
      one.lastChild.appendChild(card.cloneNode(true));
      el.classList.add('cq-showone');
      if (window.YIC && window.YIC.fillFacesIn) window.YIC.fillFacesIn(one);
    };
    find();
  }

  function hero(el) {
    addCss();
    el.classList.remove('cq-showone'); // a redraw always starts on all crews (Mark, 9 Nov: couldn't get back)
    const Y = window.YIC;
    if (!Y || !Y.D) return;
    const D = Y.D;
    const raw = {};
    (D.crewsRaw || []).forEach((c) => (raw[c.id] = c));
    const crews = (D.crewList || []).filter((c) => c.roster && c.roster.length)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const now = Date.now() / 1000;
    const busyN = crews.filter((c) => { const r = raw[c.id]; return r && r.Crew && r.Crew.readyAt > now; }).length;
    const hungryN = crews.filter((c) => c.food != null && c.food < 0.5).length;
    const mates = crews.reduce((s, c) => s + c.roster.length, 0);
    el.innerHTML =
      '<div class="cq-plate">CREW QUARTERS</div>' +
      '<div class="cq-read"><b>' + crews.length + '</b> crews · <b>' + mates + '</b> crewmates · ' +
      '<b style="color:#ffab3d">' + busyN + '</b> busy' + (hungryN ? ' · <b style="color:#ff6b6b">' + hungryN + '</b> hungry' : '') + '</div>' +
      (crews.length ? (BETA ? '<div class="cq-row cqg">' + crews.map((c) => card(c, raw[c.id], Y)).join('') + '</div>' : '<div class="cq-row">' + crews.map((c) => locker(c, raw[c.id], Y)).join('') + '</div>') : '<div class="cq-none">No crews yet</div>') +
      '<div class="cq-bench"></div>';
    el.addEventListener('click', (e) => {
      if (e.target.closest('.cq-back')) {
        el.classList.remove('cq-showone');
        const one = el.querySelector('.cq-one');
        if (one) one.remove();
        return;
      }
      const full = e.target.closest('[data-full]');
      if (full) { openCrew(full.dataset.full, el); return; }
      const t = e.target.closest('[data-crew]');
      if (t) (BETA ? openMembers : openCrew)(t.dataset.crew, el);
    });
    if (Y.fillFacesIn) Y.fillFacesIn(el);
  }

  // back to all crews from anywhere: the deck's seat / deck tabs, or Escape (Mark, 9 Nov: "i can't go back")
  const allCrews = () => { const h = document.getElementById('deckhero'); if (!h) return; h.classList.remove('cq-showone'); const o = h.querySelector('.cq-one'); if (o) o.remove(); };
  document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('.dkr-home, button[data-deck], .dkr-st')) allCrews(); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') allCrews(); });
  window.YICDECKHERO = window.YICDECKHERO || {};
  window.YICDECKHERO.crew = hero;
})();
