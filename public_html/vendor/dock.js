/* Logistics Hub (was "Loading Dock" – renamed by Mark 8 Nov) – Skippy's Awesome Command Deck – TEST ONLY (?beta=1&dock=1), 8 Nov 2026
   Design: project doc claude/loading-dock-idea-2026-11-08.md (Mark).
   Pick a rock, a warehouse/tank farm, a building and a process; the page works out the inputs, finds them in
   your other storage on that rock, lists what must be flown in, picks a crew (with an option to feed it),
   and lists the deliveries. The Airlock (warning + "I understand") is shown every time.
   THIS TEST VERSION SENDS NOTHING – the Approve button is switched off. Uses the site's own loaded data
   (window.YIC.D) and the recipe list in vendor/chain.js (@influenceth/sdk). Opened from dock.html. */
(function () {
  'use strict';
  // On the normal site: a clearly labelled button in the deck tool row (decks.js moves #dkhub into the tray)
  let linkOn = false;
  function linkLoop() {
    if (linkOn) return; linkOn = true;
    const addLink = () => {
      if (/[?&]dock=1\b/.test(location.search)) return;
      if (document.getElementById('dkhub') || !document.body) return;
      const a = document.createElement('a'); a.id = 'dkhub'; a.textContent = '🚚 Logistics Hub ↗';
      a.title = 'Opens a page that acts in the game – it can send moves and process starts from your wallet, only when you approve them';
      a.href = location.pathname + (location.search ? location.search + '&' : '?') + 'dock=1';
      a.style.cssText = 'display:inline-block;padding:5px 10px;border-radius:8px;border:1px solid #ffb03b;color:#ffd28a;background:#2a1d08;text-decoration:none;font-weight:600;font-size:12px;line-height:1.2;white-space:nowrap;order:8';
      // the deck bar's own Logistics Hub tab replaces it; it showed loose on the page for a moment on load (Mark, 13 Nov – TEST ONLY ?beta=1)
      a.style.display = 'none'; // LIVE 13 Nov 2026 (tested on ?beta=1 – Mark)
      document.body.appendChild(a);
    };
    setInterval(addLink, 1500); addLink();
  }
  if (!/[?&]dock=1\b/.test(location.search)) { linkLoop(); return; }

  const CSS = "#dk-ov{\n  --amber:#ffb03b; --amber2:#ff8a1f; --cyan:#8fe3ff; --steel:#2a3140; --steel2:#3a4356;\n  --ink:#dfe7f2; --dim:#8a96aa; --red:#ff4d4d; --green:#3fd68a;\n}\n#dk-ov *{box-sizing:border-box}\n#dk-ov{position:fixed!important;inset:0;z-index:2147483000!important;overflow:auto;background:#05070c;color:var(--ink);font-family:Rajdhani,system-ui,sans-serif}\n#dk-ov{display:flex;align-items:center;justify-content:center;padding:18px}\n#dk-ov .wrap{display:flex;gap:26px;align-items:center;max-width:1180px;width:100%}\n#dk-ov .chamber{position:relative;flex:1 1 640px;aspect-ratio:16/11;border-radius:18px;overflow:hidden;\n  background:linear-gradient(#141923,#0b0e15 60%,#10141d);box-shadow:0 0 0 2px #1d2330 inset,0 20px 60px #000a}\n#dk-ov .chamber svg.walls{position:absolute;inset:0;width:100%;height:100%}\n#dk-ov .beacon{position:absolute;top:4.5%;width:7%;aspect-ratio:2/1;border-radius:40px 40px 6px 6px;\n  background:radial-gradient(ellipse at 50% 80%,#ffd27a,var(--amber2) 55%,#5a2a00);box-shadow:0 0 18px var(--amber2);opacity:.55}\n#dk-ov .beacon.l{left:9%}\n#dk-ov .beacon.r{right:9%}\n#dk-ov .cycling .beacon{animation:flash .5s infinite alternate}\n@keyframes flash{from{opacity:.25;box-shadow:0 0 4px var(--amber2)}to{opacity:1;box-shadow:0 0 40px 10px var(--amber2)}}\n#dk-ov .sweep{position:absolute;inset:0;pointer-events:none;opacity:0;\n  background:radial-gradient(ellipse at 50% 0%,#ff9a2a55,transparent 60%)}\n#dk-ov .cycling .sweep{animation:sweep .5s infinite alternate}\n@keyframes sweep{from{opacity:0}to{opacity:1}}\n#dk-ov .frame{position:absolute;left:19%;right:19%;top:15%;bottom:9%;border-radius:22px 22px 8px 8px;overflow:hidden;\n  box-shadow:0 0 0 10px #1a202b,0 0 0 13px #3b4558,0 0 0 22px #141922,0 0 0 24px #000}\n#dk-ov .dock{position:absolute;inset:0;transition:transform 2.4s ease}\n#dk-ov .open .dock{transform:scale(1.08)}\n#dk-ov .dock svg{width:100%;height:100%;display:block}\n#dk-ov .door{position:absolute;top:0;bottom:0;width:50.4%;transition:transform 2.2s cubic-bezier(.7,0,.3,1) .3s;\n  --hole:13%;}\n#dk-ov .door.l{left:0;\n  -webkit-mask:radial-gradient(circle at 100% 42%,transparent 9vmin,#000 9.1vmin);\n          mask:radial-gradient(circle at 100% 42%,transparent 9vmin,#000 9.1vmin);\n  background:\n   radial-gradient(circle at 100% 42%,transparent 9vmin,#b7c2d3 9.1vmin,#5d687c 10vmin,#2b3240 10.9vmin,transparent 11vmin),\n   repeating-linear-gradient(135deg,var(--amber) 0 18px,#111 18px 36px) right/22px 100% no-repeat,\n   linear-gradient(90deg,#283041,#3a4458 60%,#2d3546);\n}\n#dk-ov .door.r{right:0;\n  -webkit-mask:radial-gradient(circle at 0% 42%,transparent 9vmin,#000 9.1vmin);\n          mask:radial-gradient(circle at 0% 42%,transparent 9vmin,#000 9.1vmin);\n  background:\n   radial-gradient(circle at 0% 42%,transparent 9vmin,#b7c2d3 9.1vmin,#5d687c 10vmin,#2b3240 10.9vmin,transparent 11vmin),\n   repeating-linear-gradient(45deg,var(--amber) 0 18px,#111 18px 36px) left/22px 100% no-repeat,\n   linear-gradient(270deg,#283041,#3a4458 60%,#2d3546);\n}\n#dk-ov .door::before{content:\"\";position:absolute;left:12%;right:12%;bottom:8%;height:16%;border-radius:4px;\n  background:repeating-linear-gradient(0deg,#1d2330 0 6px,#323b4d 6px 9px);box-shadow:0 0 0 2px #1a1f2a}\n#dk-ov .door::after{content:\"\";position:absolute;left:14%;right:14%;top:7%;height:6%;border-radius:3px;\n  background:linear-gradient(#232a37,#3b4558);box-shadow:0 0 0 2px #151a23}\n#dk-ov .door .lbl{position:absolute;top:66%;font-weight:700;letter-spacing:.12em;font-size:clamp(10px,1.4vw,15px);color:#ffcf7a;opacity:.85}\n#dk-ov .door.l .lbl{right:30%}\n#dk-ov .door.r .lbl{left:30%}\n#dk-ov .open .door.l{transform:translateX(-101%)}\n#dk-ov .open .door.r{transform:translateX(101%)}\n#dk-ov .glass{position:absolute;left:50%;top:42%;width:18vmin;height:18vmin;margin:-9vmin 0 0 -9vmin;border-radius:50%;\n  pointer-events:none;background:radial-gradient(circle at 35% 30%,#ffffff22,transparent 45%);transition:opacity .4s .3s}\n#dk-ov .open .glass{opacity:0}\n#dk-ov .sign{position:absolute;left:50%;top:5.5%;transform:translateX(-50%);padding:4px 16px;border-radius:6px;\n  background:#0c0f15;box-shadow:0 0 0 2px #2c3444;font-weight:700;letter-spacing:.18em;font-size:clamp(11px,1.5vw,16px);\n  color:var(--red);text-shadow:0 0 8px currentColor;white-space:nowrap}\n#dk-ov .sign.amber{color:var(--amber)}\n#dk-ov .sign.green{color:var(--green)}\n#dk-ov .panel{flex:0 0 360px;background:linear-gradient(#141923,#0e121a);border-radius:14px;padding:20px 22px;\n  box-shadow:0 0 0 2px #232a37 inset,0 0 0 1px #000;position:relative;overflow:hidden}\n#dk-ov .panel::before{content:\"\";position:absolute;left:0;right:0;top:0;height:10px;\n  background:repeating-linear-gradient(45deg,var(--amber) 0 12px,#111 12px 24px)}\n#dk-ov h1{margin:6px 0 2px;font-size:26px;letter-spacing:.14em;color:var(--amber)}\n#dk-ov .sub{color:var(--dim);font-size:15px;margin-bottom:14px;letter-spacing:.05em}\n#dk-ov .warn{border-left:4px solid var(--amber);background:#ffb03b12;padding:10px 12px;border-radius:4px;font-size:17px;line-height:1.3}\n#dk-ov .warn b{color:#ffd28a}\n#dk-ov ul{margin:12px 0 14px;padding-left:20px;font-size:16px;line-height:1.35;color:#cdd6e3}\n#dk-ov li{margin:4px 0}\n#dk-ov label{display:flex;gap:10px;align-items:flex-start;font-size:16px;margin:10px 0;cursor:pointer;line-height:1.25}\n#dk-ov input[type=checkbox]{width:20px;height:20px;margin:0;flex:0 0 auto;accent-color:var(--amber)}\n#dk-ov .btn{display:block;width:100%;margin-top:14px;padding:12px;border:0;border-radius:8px;font:700 18px Rajdhani,sans-serif;\n  letter-spacing:.14em;cursor:pointer;color:#1a1000;background:linear-gradient(#ffc45e,var(--amber2));box-shadow:0 0 18px #ff8a1f55}\n#dk-ov .btn:disabled{cursor:not-allowed;color:#6b7383;background:#232a37;box-shadow:none}\n#dk-ov .back{display:inline-block;margin-top:14px;color:var(--cyan);text-decoration:none;font-size:16px}\n#dk-ov .back:hover{text-decoration:underline}\n#dk-ov .bar{height:8px;border-radius:4px;background:#1d2330;margin-top:12px;overflow:hidden;display:none}\n#dk-ov .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--amber2),#ffd27a)}\n#dk-ov .cycling .bar{display:block}\n#dk-ov .cycling .bar i{transition:width 2.6s linear;width:100%}\n#dk-ov .done{display:none;margin-top:12px;color:var(--green);font-size:17px}\n#dk-ov .reset{background:none;border:0;color:var(--dim);font:500 14px Rajdhani,sans-serif;cursor:pointer;margin-top:10px;padding:0;text-decoration:underline}\n#dk-ov .mock{position:absolute;right:12px;bottom:10px;font-size:12px;color:#5c6577;letter-spacing:.1em}\n#dk-ov.indock{display:block;padding:0}\n#dk-ov .wrap{transition:opacity .6s}\n#dk-ov .wrap.gone{opacity:0}\n#dk-ov #dockpg{display:none;max-width:980px;margin:0 auto;padding:0 18px 40px}\n#dk-ov.indock #dockpg{display:block;animation:fadein .6s}\n@keyframes fadein{from{opacity:0}to{opacity:1}}\n#dk-ov .stripe{height:10px;background:repeating-linear-gradient(45deg,var(--amber) 0 12px,#111 12px 24px)}\n#dk-ov .dhead{position:sticky;top:0;z-index:5;background:#05070c;padding-top:0}\n#dk-ov .dhead .in{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0 10px;flex-wrap:wrap}\n#dk-ov .dhead h1{margin:0}\n#dk-ov .live{display:flex;align-items:center;gap:8px;font-weight:700;letter-spacing:.08em;color:#ffd28a;font-size:15px;\n  border:1px solid #ffb03b66;background:#ffb03b14;border-radius:20px;padding:4px 12px}\n#dk-ov .live i{width:9px;height:9px;border-radius:50%;background:var(--amber);box-shadow:0 0 8px var(--amber);animation:flash 1s infinite alternate}\n#dk-ov .card{background:linear-gradient(#141923,#0e121a);border-radius:12px;box-shadow:0 0 0 1px #232a37 inset;padding:14px 18px;margin:14px 0}\n#dk-ov .card h2{margin:0 0 10px;font-size:19px;letter-spacing:.08em;color:var(--ink);display:flex;align-items:center;gap:10px}\n#dk-ov .card h2 .n{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#ffb03b22;color:var(--amber);font-size:15px;box-shadow:0 0 0 1px #ffb03b66 inset}\n#dk-ov .dkp-fold>summary{cursor:pointer;color:var(--cyan);font-weight:600;font-size:16px;margin:4px 0 8px}\n#dk-ov .card.fly{box-shadow:0 0 0 1px #9a6bff66 inset}\n#dk-ov .card.fly h2 .n{background:#9a6bff22;color:#c4a8ff;box-shadow:0 0 0 1px #9a6bff88 inset}\n#dk-ov .row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}\n#dk-ov select,#dk-ov input[type=number]{background:#0b0e14;color:var(--ink);border:1px solid #3a4356;border-radius:6px;padding:7px 10px;font:600 16px Rajdhani,sans-serif;min-width:220px}\n#dk-ov input[type=number]{min-width:0;width:90px}\n#dk-ov .hint{color:var(--dim);font-size:15px;margin-top:6px}\n#dk-ov .cap{flex:1 1 260px}\n#dk-ov .capbar{height:10px;border-radius:5px;background:#1d2330;overflow:hidden;margin-top:4px;position:relative}\n#dk-ov .capbar i{position:absolute;left:0;top:0;bottom:0;background:#4f90ff}\n#dk-ov .capbar b{position:absolute;top:0;bottom:0;background:var(--amber)}\n#dk-ov table{width:100%;border-collapse:collapse;font-size:16px}\n#dk-ov th{text-align:left;color:var(--dim);font-weight:600;padding:6px 8px;border-bottom:1px solid #2a3140;letter-spacing:.04em}\n#dk-ov td{padding:7px 8px;border-bottom:1px solid #1b212c;vertical-align:top}\n#dk-ov td.num,#dk-ov th.num{text-align:right;white-space:nowrap}\n#dk-ov .ok{color:var(--green)}\n#dk-ov .short{color:#c4a8ff}\n#dk-ov .src{color:#cdd6e3;font-size:15px}\n#dk-ov .mv td:first-child{width:28px}\n#dk-ov .fee{color:var(--dim);font-size:15px;margin-top:8px}\n#dk-ov .approve{display:block;width:100%;padding:14px;border:0;border-radius:10px;font:700 20px Rajdhani,sans-serif;letter-spacing:.12em;cursor:pointer;\n  color:#1a1000;background:linear-gradient(#ffc45e,var(--amber2));box-shadow:0 0 22px #ff8a1f55}\n#dk-ov .mocknote{text-align:center;color:#5c6577;font-size:13px;letter-spacing:.1em;margin-top:18px}\n#dk-ov .toast{display:none;margin-top:10px;padding:10px 12px;border-radius:8px;background:#3fd68a18;color:var(--green);border:1px solid #3fd68a55}\n@media (max-width:900px){#dk-ov .wrap{flex-direction:column}\n#dk-ov .panel{flex:none;width:100%}\n#dk-ov .chamber{width:100%;flex:none}\n}\n@media (max-width:560px){#dk-ov .door.l{-webkit-mask:radial-gradient(circle at 100% 42%,transparent 38px,#000 39px);mask:radial-gradient(circle at 100% 42%,transparent 38px,#000 39px)}\n#dk-ov .door.r{-webkit-mask:radial-gradient(circle at 0% 42%,transparent 38px,#000 39px);mask:radial-gradient(circle at 0% 42%,transparent 38px,#000 39px)}\n#dk-ov .glass{width:76px;height:76px;margin:-38px 0 0 -38px}\n\n}\n\n";
  const WRAP = "<div class=\"wrap\" id=\"wrap\">\n\n  <!-- ===== the airlock chamber ===== -->\n  <div class=\"chamber\" id=\"chamber\" aria-label=\"Airlock with a window through to the loading dock\">\n    <svg class=\"walls\" viewBox=\"0 0 1600 1100\" preserveAspectRatio=\"none\" aria-hidden=\"true\">\n      <defs>\n        <linearGradient id=\"wall\" x1=\"0\" x2=\"1\"><stop offset=\"0\" stop-color=\"#0d1118\"/><stop offset=\".5\" stop-color=\"#1a2130\"/><stop offset=\"1\" stop-color=\"#0d1118\"/></linearGradient>\n      </defs>\n      <rect width=\"1600\" height=\"1100\" fill=\"url(#wall)\"/>\n      <!-- side wall panels -->\n      <g fill=\"none\" stroke=\"#2b3345\" stroke-width=\"3\">\n        <path d=\"M40 160 L230 200 L230 960 L40 1040 Z\"/><path d=\"M1560 160 L1370 200 L1370 960 L1560 1040 Z\"/>\n        <path d=\"M70 260 L200 280 M70 420 L200 430 M70 580 L200 585 M70 740 L200 740 M70 900 L200 895\"/>\n        <path d=\"M1530 260 L1400 280 M1530 420 L1400 430 M1530 580 L1400 585 M1530 740 L1400 740 M1530 900 L1400 895\"/>\n      </g>\n      <!-- pressure gauges -->\n      <g transform=\"translate(135 340)\"><circle r=\"44\" fill=\"#0b0e14\" stroke=\"#4a5568\" stroke-width=\"5\"/><path d=\"M-30 18 A34 34 0 1 1 30 18\" fill=\"none\" stroke=\"#3fd68a\" stroke-width=\"5\"/><line x1=\"0\" y1=\"0\" x2=\"-22\" y2=\"-20\" stroke=\"#ffb03b\" stroke-width=\"4\"/><text y=\"34\" text-anchor=\"middle\" fill=\"#8a96aa\" font-size=\"15\" font-family=\"Rajdhani\">kPa</text></g>\n      <g transform=\"translate(1465 340)\"><circle r=\"44\" fill=\"#0b0e14\" stroke=\"#4a5568\" stroke-width=\"5\"/><path d=\"M-30 18 A34 34 0 1 1 30 18\" fill=\"none\" stroke=\"#3fd68a\" stroke-width=\"5\"/><line x1=\"0\" y1=\"0\" x2=\"24\" y2=\"-18\" stroke=\"#ffb03b\" stroke-width=\"4\"/><text y=\"34\" text-anchor=\"middle\" fill=\"#8a96aa\" font-size=\"15\" font-family=\"Rajdhani\">O\u2082</text></g>\n      <!-- pipes -->\n      <g stroke=\"#323b4d\" stroke-width=\"16\" fill=\"none\" stroke-linecap=\"round\"><path d=\"M110 520 V900\"/><path d=\"M160 520 V880\"/><path d=\"M1490 520 V900\"/><path d=\"M1440 520 V880\"/></g>\n      <g fill=\"#ffb03b\"><rect x=\"98\" y=\"640\" width=\"24\" height=\"12\"/><rect x=\"1478\" y=\"700\" width=\"24\" height=\"12\"/></g>\n      <!-- floor -->\n      <path d=\"M0 1010 L1600 1010 L1600 1100 L0 1100 Z\" fill=\"#0a0d13\"/>\n      <g fill=\"#ffb03b\" opacity=\".75\"><path d=\"M300 1030 h1000 v10 h-1000z\"/></g>\n      <g fill=\"#ffb03b22\"><path d=\"M300 1050 L1300 1050 L1360 1100 L240 1100Z\"/></g>\n    </svg>\n    <div class=\"sweep\"></div>\n    <div class=\"beacon l\"></div><div class=\"beacon r\"></div>\n    <div class=\"sign\" id=\"sign\">\u25cf INNER DOOR LOCKED</div>\n\n    <div class=\"frame\">\n      <!-- the loading dock, seen through the porthole -->\n      <div class=\"dock\">\n        <svg viewBox=\"0 0 800 700\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\">\n          <defs>\n            <linearGradient id=\"dkwall\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#1a2232\"/><stop offset=\"1\" stop-color=\"#0f1520\"/></linearGradient>\n            <linearGradient id=\"dkfloor\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#232b3a\"/><stop offset=\"1\" stop-color=\"#121722\"/></linearGradient>\n            <radialGradient id=\"lamp\" cx=\".5\" cy=\"0\" r=\"1\"><stop offset=\"0\" stop-color=\"#ffe2a6\" stop-opacity=\".55\"/><stop offset=\"1\" stop-color=\"#ffe2a6\" stop-opacity=\"0\"/></radialGradient>\n            <linearGradient id=\"space\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#020308\"/><stop offset=\"1\" stop-color=\"#0a1022\"/></linearGradient>\n          </defs>\n          <rect width=\"800\" height=\"700\" fill=\"url(#dkwall)\"/>\n          <!-- big bay door open to space -->\n          <rect x=\"230\" y=\"70\" width=\"340\" height=\"230\" rx=\"6\" fill=\"url(#space)\" stroke=\"#3a4458\" stroke-width=\"8\"/>\n          <g fill=\"#fff\"><circle cx=\"270\" cy=\"110\" r=\"1.4\"/><circle cx=\"330\" cy=\"160\" r=\"1\"/><circle cx=\"400\" cy=\"100\" r=\"1.6\"/><circle cx=\"520\" cy=\"130\" r=\"1.2\"/><circle cx=\"545\" cy=\"240\" r=\"1\"/><circle cx=\"300\" cy=\"250\" r=\"1.3\"/><circle cx=\"460\" cy=\"200\" r=\".9\"/><circle cx=\"360\" cy=\"215\" r=\"1\"/></g>\n          <ellipse cx=\"470\" cy=\"290\" rx=\"150\" ry=\"60\" fill=\"#3b3a44\"/>\n          <ellipse cx=\"440\" cy=\"276\" rx=\"22\" ry=\"7\" fill=\"#2c2b33\"/><ellipse cx=\"520\" cy=\"290\" rx=\"14\" ry=\"5\" fill=\"#2c2b33\"/>\n          <rect x=\"230\" y=\"62\" width=\"340\" height=\"12\" fill=\"#2b3345\"/>\n          <g fill=\"#ffb03b\"><rect x=\"230\" y=\"62\" width=\"20\" height=\"12\"/><rect x=\"270\" y=\"62\" width=\"20\" height=\"12\"/><rect x=\"310\" y=\"62\" width=\"20\" height=\"12\"/><rect x=\"350\" y=\"62\" width=\"20\" height=\"12\"/><rect x=\"390\" y=\"62\" width=\"20\" height=\"12\"/><rect x=\"430\" y=\"62\" width=\"20\" height=\"12\"/><rect x=\"470\" y=\"62\" width=\"20\" height=\"12\"/><rect x=\"510\" y=\"62\" width=\"20\" height=\"12\"/><rect x=\"550\" y=\"62\" width=\"20\" height=\"12\"/></g>\n          <!-- ceiling lamps -->\n          <g><rect x=\"90\" y=\"20\" width=\"90\" height=\"10\" rx=\"3\" fill=\"#ffe2a6\"/><rect x=\"620\" y=\"20\" width=\"90\" height=\"10\" rx=\"3\" fill=\"#ffe2a6\"/>\n          <path d=\"M90 30 L180 30 L260 360 L10 360Z\" fill=\"url(#lamp)\"/><path d=\"M620 30 L710 30 L790 360 L540 360Z\" fill=\"url(#lamp)\"/></g>\n          <!-- floor -->\n          <path d=\"M0 330 L800 330 L800 700 L0 700Z\" fill=\"url(#dkfloor)\"/>\n          <g stroke=\"#ffb03b\" stroke-width=\"5\" opacity=\".7\"><path d=\"M250 330 L120 700\"/><path d=\"M550 330 L680 700\"/></g>\n          <g fill=\"#ffb03b\" opacity=\".18\"><path d=\"M300 420 h200 v70 h-200z\"/></g>\n          <text x=\"400\" y=\"465\" text-anchor=\"middle\" fill=\"#ffb03b\" opacity=\".5\" font-family=\"Rajdhani\" font-weight=\"700\" font-size=\"26\" letter-spacing=\"6\">STAGING</text>\n          <!-- crates left -->\n          <g>\n            <rect x=\"40\" y=\"380\" width=\"120\" height=\"100\" fill=\"#3c5a7a\" stroke=\"#1b2738\" stroke-width=\"4\"/><path d=\"M40 380 L160 480 M160 380 L40 480\" stroke=\"#2a4058\" stroke-width=\"5\"/>\n            <rect x=\"60\" y=\"300\" width=\"90\" height=\"80\" fill=\"#7a5a2e\" stroke=\"#2d2010\" stroke-width=\"4\"/><path d=\"M60 330 h90\" stroke=\"#5b4220\" stroke-width=\"5\"/>\n            <rect x=\"170\" y=\"410\" width=\"80\" height=\"70\" fill=\"#4f6b3a\" stroke=\"#1d2a14\" stroke-width=\"4\"/>\n          </g>\n          <!-- tank right -->\n          <g>\n            <rect x=\"600\" y=\"300\" width=\"110\" height=\"180\" rx=\"40\" fill=\"#576274\" stroke=\"#222a36\" stroke-width=\"5\"/>\n            <rect x=\"600\" y=\"360\" width=\"110\" height=\"18\" fill=\"#ffb03b\" opacity=\".8\"/>\n            <rect x=\"720\" y=\"380\" width=\"70\" height=\"100\" fill=\"#6a3a3a\" stroke=\"#2a1515\" stroke-width=\"4\"/>\n          </g>\n          <!-- cargo loader -->\n          <g transform=\"translate(330 470)\">\n            <rect x=\"0\" y=\"40\" width=\"150\" height=\"60\" rx=\"8\" fill=\"#ffb03b\" stroke=\"#5a3a00\" stroke-width=\"4\"/>\n            <rect x=\"20\" y=\"0\" width=\"70\" height=\"45\" rx=\"6\" fill=\"#2b3345\" stroke=\"#111\" stroke-width=\"3\"/>\n            <rect x=\"28\" y=\"8\" width=\"54\" height=\"24\" rx=\"3\" fill=\"#8fe3ff\" opacity=\".6\"/>\n            <rect x=\"150\" y=\"-30\" width=\"10\" height=\"130\" fill=\"#3a4458\"/><rect x=\"160\" y=\"80\" width=\"60\" height=\"10\" fill=\"#3a4458\"/>\n            <rect x=\"165\" y=\"30\" width=\"55\" height=\"50\" fill=\"#3c5a7a\" stroke=\"#1b2738\" stroke-width=\"3\"/>\n            <circle cx=\"35\" cy=\"105\" r=\"18\" fill=\"#111\" stroke=\"#444\" stroke-width=\"4\"/><circle cx=\"120\" cy=\"105\" r=\"18\" fill=\"#111\" stroke=\"#444\" stroke-width=\"4\"/>\n          </g>\n          <!-- stencil -->\n          <text x=\"400\" y=\"630\" text-anchor=\"middle\" fill=\"#8fe3ff\" opacity=\".35\" font-family=\"Rajdhani\" font-weight=\"700\" font-size=\"34\" letter-spacing=\"10\">LOGISTICS HUB</text>\n        </svg>\n      </div>\n      <div class=\"door l\"><span class=\"lbl\">LOGISTICS</span></div>\n      <div class=\"door r\"><span class=\"lbl\">HUB</span></div>\n      <div class=\"glass\"></div>\n    </div>\n  </div>\n\n  <!-- ===== the control panel ===== -->\n  <div class=\"panel\" id=\"panel\">\n    <h1>AIRLOCK</h1>\n    <div class=\"sub\">Leaving the Command Deck</div>\n    <div class=\"warn\"><b>Past this door, this page acts in the game for you.</b></div>\n    <ul>\n      <li>It moves resources by sending actions from your wallet.</li>\n      <li>Every move is listed first so you can check it.</li>\n      <li>Nothing is sent until you press Approve in your wallet.</li>\n      <li>The game charges a small fee for each action.</li>\n    </ul>\n    <label><input type=\"checkbox\" id=\"ok\"> I understand this page sends game actions from my wallet.</label>\n    <label><input type=\"checkbox\" id=\"skip\"> Remember that I understand on this browser (you still go through the airlock).</label>\n    <button class=\"btn\" id=\"go\" disabled>CYCLE AIRLOCK</button>\n    <div class=\"bar\"><i></i></div>\n        <a class=\"back\" href=\"#\" data-dkback>\u25c2 Back to the Command Deck (read-only)</a><br>\n        <div class=\"mock\">TEST</div>\n  </div>\n</div>";

  // ---- game constants (same as vendor/tidy.js, @influenceth/sdk) ----
  const SLOT = 2, WAREHOUSE = 1, TANK = 10;
  const BTN = { 3: 'Refinery', 4: 'Bioreactor', 5: 'Factory', 6: 'Shipyard' };
  const FBT = { 1: 3, 2: 5, 3: 4, 4: 6, 5: 6 }; // recipe type -> building type (chain.js)
  const OUTFIX = true; // output storage that can take solids, clearer can't-start reasons, one per line – LIVE 9 Nov 2026 (tested on ?beta=1 – Mark)
  const TANKOK = new Set([1, 2, 3, 4, 5, 6, 7, 8, 23, 24, 27, 33, 50, 66, 73, 76, 116, 169, 170, 180, 184, 185, 220]);
  const CAP = { 1: [1.5e12, 75e9], 10: [75e9, 997.5e9] }; // grams, volume
  const FOOD = 129;
  // the game's process ids by name (@influenceth/sdk 2.8.1 Process.TYPES[].i) – chain.js lists recipes in a different order
  // process setup and per-run time in game seconds (@influenceth/sdk Process.TYPES[].setupTime / recipeTime)
  const PT = {"Water Electrolysis":[7200,56.16],"Water Vacuum-evaporation Desalination":[57600,4.536],"Sabatier Process":[86400,3.744],"Olivine Enhanced Weathering":[1209600,464.4],"Bitumen Hydro-cracking":[43200,37.44],"Taenite Electrolytic Refining":[86400,27],"Calcite Calcination":[7200,7.2],"Huels Process":[28800,109.44],"Ammonia Carbonation":[14400,17.28],"Salt Sulfidization and Phosphorization":[7200,0.144],"Basic Food Cooking and Packaging":[144000,86.4],"Troilite Centrifugal Froth Flotation":[43200,14.544],"Silica Fusing":[43200,0.479],"Silica Pultrusion":[108000,0.45],"Copper Wire Drawing":[86400,0.225],"Salty Cement Mixing":[21600,0.297],"Salt Selective Crystallization":[259200,36],"Naphtha Steam-cracking":[36000,0.72],"Steel Alloying":[86400,162],"Silica Carbothermic Reduction":[43200,110.88],"Ostwald Process":[54000,10.8],"Wet Sulfuric Acid Process":[28800,7.2],"Fungal Soilbuilding":[108000,10368000],"Iron Oxide and Silica Carbothermic Reduction":[72000,802.8],"Methane Steam Reforming and Water-gas Shift":[86400,22.032],"Acetylene Oxalic Acid Production":[57600,29.7],"Lead Sulfide Smelting":[64800,1224],"Tin Sulfide Smelting":[79200,59.4],"Iron Sulfide Roasting":[72000,38.16],"Haber-Bosch Process":[50400,78.48],"Molybdenum Disulfide Roasting":[86400,58.68],"Silica Gas Atomization":[28800,0.288],"Solder Manufacturing":[72000,108],"Quartz Filament Drawing and Wrapping":[144000,360],"Steel Beam Rolling":[90000,0.083],"Steel Sheet Rolling":[79200,0.09],"Steel Pipe Rolling":[97200,0.103],"Steel Wire Drawing":[86400,0.36],"Propylene Ammoxidation":[100800,327.24],"Propylene Polymerization":[108000,0.072],"Magnesium Chloride Molten Salt Electrolysis":[172800,378],"Solvay Process":[86400,242.28],"Boria Hydration":[36000,44.64],"Pyroxene Acid Leaching, Digestion, and Ion Exchange":[216000,182.52],"Apatite Acid Extraction":[208800,240.84],"Hydrogen Combustion":[21600,0.324],"Carbon Monoxide Combustion":[28800,2.114],"Borax Acid Extraction":[172800,21.852],"Nitrogen Cryocooling and Fractional Distillation":[18000,216.36],"Olivine Acid Leaching and Calcining":[230400,2041.2],"Anorthite Feldspar Acid Leaching and Carbonation":[302400,125.568],"Sodium Chloralkali Process":[72000,64.8],"Potassium Chloralkali Process":[72000,90.72],"Apatite Acid Re-extraction":[187200,230.04],"Ammonium Carbonate Oxalation":[28800,44.64],"Xenotime Hot Acid Leaching":[93600,446.4],"Merrillite Hot Acid Leaching":[100800,1674],"Ammonia Catalytic Cracking":[79200,97.56],"Uraninite Acid Leaching, Solvent Extraction, and Precipitation":[288000,453.6],"Coffinite Acid Leaching, Solvent Extraction, and Precipitation":[273600,1054.8],"Alumina Forming and Sintering":[64800,0.8],"Austenitic Nichrome Alloying":[50400,2.16],"Copper Wire Insulating":[72000,14.4],"Silicon Czochralski Process and Wafer Slicing":[288000,6480000],"Steel Cable Laying":[72000,0.3],"Acrylonitrile Polymerization":[86400,9.18],"Soybean Growing":[115200,6480000],"Boric Acid Thermal Decomposition":[21600,0.206],"Lithium Carbonate Chlorination":[25200,66.24],"Lithium Sulfate Carbonation":[18000,77.76],"Iron Oxide Direct Reduction":[28800,40.32],"Zinc Oxide Direct Reduction":[43200,11.772],"Nickel Oxide Direct Reduction":[57600,12.24],"Pidgeon Process":[28800,345.6],"Polypropylene Chlorination and Basification":[54000,0.76],"Potato Growing":[129600,7776000],"Rare Earth Sulfates Oxalation and Calcination":[21600,392.4],"Ammonia Chlorination":[28800,0.458],"Hall–Heroult Process":[79200,97.2],"Calcium Chloride Molten Salt Electrolysis":[72000,319.68],"Cement Mixing":[14400,0.36],"Natural Flavorings Growing":[288000,31464000],"Yellowcake Digestion, Solvent Extraction, and Precipitation":[194400,177.48],"Hydrofluoric Acid Cold Electrolysis":[172800,182.52],"Rhabdite Roasting and Acid Extraction":[43200,3506.4],"Ferrite Sintering":[79200,1285.2],"Diode Doping and Assembly":[172800,37800],"Ball Valve Machining":[100800,1.8],"Aluminium Beam Rolling":[108000,0.144],"Aluminium Sheet Rolling":[100800,0.164],"Aluminium Pipe Rolling":[111600,18],"Polyacrylonitrile Weaving":[72000,1.8],"Cold Gas Thruster Printing":[57600,14.4],"Polyacrylonitrile Oxidation and Carbonization":[57600,4.716],"Aluminium Small Propellant Tank Assembly":[64800,7.2],"Borosilicate Glassmaking":[86400,6.624],"Ball Bearing Machining and Assembly":[129600,658.8],"Large Thrust Bearing Machining and Assembly":[144000,450],"Boria Magnesiothermic Reduction":[57600,39.6],"Lithium Chloride Molten Salt Electrolysis":[144000,277.92],"Diepoxy Step Growth Polymerization":[108000,323.64],"Rare Earth Oxides Ion Exchange":[172800,20.124],"Calcium Oxide Aluminothermic Reduction":[50400,57.24],"Sodium Chromate Acidification and Crystallization":[180000,194.4],"Sulfuric Acid Hot Catalytic Reduction":[72000,2.117],"Molybdenum Trioxide Aluminothermic Reduction and Alloying":[54000,3672],"Uranyl Nitrate Redox and Precipitation":[100800,3513.6],"Sodium Tungstate Ion Exchange, Precipitation, and Crystallization":[172800,70.56],"Stainless Steel Alloying":[86400,34.56],"Board Printing":[216000,1198.8],"Ferrite-bead Inductor Winding":[194400,119.88],"Core Drill Bit Milling":[57600,90],"Core Drill Thruster Assembly":[43200,299.88],"Parabolic Dish Assembly":[115200,360],"Photovoltaic Panel Amorphization and Assembly":[115200,180],"LiPo Battery Assembly":[129600,450],"Neodymium Oxide Chlorination":[43200,4.716],"Sodium Dichromate Hot Sulfur Reduction":[108000,36],"Photoresist Epoxy Stoichiometry and Packaging":[57600,3.6],"Ammonium Diuranate Calcination and Hydrogen Reduction":[100800,63.36],"Ammonium Paratungstate Calcination and Hydrogen Reduction":[57600,317.16],"Engine Bell Additive Manufacturing":[345600,61200],"Steel Truss Construction":[151200,43200],"Aluminium Hull Plate Construction":[172800,28800],"Aluminium Truss Construction":[180000,39600],"Cargo Module Construction":[288000,50400],"Aluminium Pressure Vessel Construction":[576000,79200],"Aluminium Propellant Tank Construction":[302400,57600],"Shuttle Hull Construction":[518400,518400],"Light Transport Hull Construction":[691200,691200],"Cargo Ring Construction":[576000,158400],"Heavy Transport Hull Construction":[1728000,1728000],"Tungsten Gas Atomization":[57600,4.5],"Hydrogen Cryocooling and Reactor Consumables Stoichiometry":[28800,72],"Stainless Steel Sheet Rolling":[115200,0.18],"Stainless Steel Pipe Rolling":[115200,0.18],"Silicon Wafer CPU Photolithography, Ball Bonding, and Encapsulation":[302400,3672000],"Core Drill Assembly":[21600,119.88],"Neodymium Trichloride Vacuum Calciothermic Reduction":[64800,248.4],"Neodymium Trichloride Molten Salt Electrolysis":[79200,1112.4],"Chromia Aluminothermic Reduction":[50400,61.92],"Uranium Dioxide Oxidation":[57600,5.04],"Leached Coffinite Froth Flotation, Solvent Extraction, and Precipitation":[129600,84960],"Nd:YAG Czochralski Process":[288000,1947600],"Nichrome Alloying":[93600,0.72],"Magnet Sintering and Magnetization":[86400,119.88],"Uranium Tetrafluoride Oxidation":[129600,1.52],"Uranium Hexafluoride Centrifuge Cascade Enrichment":[432000,6480000],"Nd:YAG Laser Assembly":[180000,2055.6],"Thin-film Resistor Sputtering and Laser-trimming":[158400,299880],"HEUF6 Magnesiothermic Reduction and Fine Division":[180000,759.6],"Spirulina and Chlorella Algae Growing":[86400,306000],"PEDOT Bacteria Culturing":[86400,54000],"BPA Bacteria Culturing":[79200,93600],"Potassium Hydroxide Carbonation":[28800,0.843],"Novolak Bacteria Culturing":[115200,108000],"Ferrochromium Alloying":[86400,0.339],"Potassium Carbonate Oxidation":[36000,0.641],"Rhabdite Slag Acid Leaching":[129600,435.6],"Tantalate-Niobate Liquid-Liquid Extraction and Redox":[86400,698.4],"Carbon Dioxide Ferrocatalysis":[21600,15.84],"Potassium Heptafluorotantalate Sodiothermic Reduction":[108000,493.2],"Rhabdite Carbothermic Reduction":[72000,1368],"Polymer Tantalum Capacitor Assembly":[259200,225000],"Surface Mount Device Reel Assembly":[172800,4.5],"Pick-and-place Board Population":[288000,47.88],"Motor Stator Assembly":[144000,180],"Motor Rotor Assembly":[108000,45],"Brushless Motor Assembly":[86400,7.2],"Landing Leg Assembly":[288000,28800],"Landing Auger Assembly":[108000,7200],"Pump Assembly":[72000,119.88],"Antenna Assembly":[129600,2401.2],"Fiber Optic Gyroscope Assembly":[216000,2998.8],"Star Tracker Assembly":[144000,18000],"Computer Assembly":[72000,7200],"Control Moment Gyroscope Assembly":[259200,18000],"Robotic Arm Assembly":[172800,299.88],"Feldspar Aluminium Hydroxide Calcination":[14400,11.232],"Ferrochromium Roasting and Hot Base Leaching":[72000,5436],"Beryllium Carbonate Calcination":[43200,2.736],"Beryllia Forming and Sintering":[216000,2.002],"Silicon Wafer CCD Photolithography, Ball Bonding, and Packaging":[345600,2250000],"Heat Exchanger Assembly":[252000,25200],"Turbopump Assembly":[576000,720000],"Laser Diode Doping, Amorphization, and Assembly":[216000,5868000],"Separator Centrifuge Assembly":[410400,57600],"Fuel Make-up Tank Assembly":[288000,43200],"Neon Make-up Tank Assembly":[144000,21600],"Lightbulb End Moderators Assembly":[360000,57600],"Cold Gas Torque Thruster Printing":[57600,14.4],"Fused Quartz Lightbulb Additive/Subtractive Assembly":[432000,57600],"Reactor Plumbing Assembly Squared":[900000,201600],"Flow Divider Moderator Assembly":[864000,172800],"Nuclear Lightbulb Assembly":[316800,46800],"Reactor Shell Assembly":[648000,194400],"Closed-cycle Gas Core Nuclear Reactor Engine Assembly":[1296000,432000],"Habitation Module Assembly":[360000,75600],"Mobility Module Assembly":[396000,54000],"Fluids Automation Module Assembly":[518400,36000],"Solids Automation Module Assembly":[576000,43200],"Terrain Interface Module Assembly":[360000,28800],"Avionics Module Assembly":[648000,43200],"Escape Module Assembly":[864000,259200],"Attitude Control Module Assembly":[417600,86400],"Power Module Assembly":[345600,36000],"Thermal Module Assembly":[345600,32400],"Propulsion Module Assembly":[720000,345600],"Sulfur Dioxide Plasma Catalysis":[57600,171.36],"Parkes Process":[79200,1180.8],"Bicarbonate Solvay Process":[93600,321.48],"Solvay-Hou Process":[93600,245.52],"Bicarbonate Solvay-Hou Process":[100800,326.88],"Sodium Bicarbonate Calcination":[10800,9.072],"Epoxy Stoichiometry and Packaging":[43200,1.44],"PEDOT Algae Growing":[93600,378000],"BPA Algae Growing":[79200,414000],"Novolak Algae Growing":[86400,450000],"Hydrochloric Redox":[28800,3.6],"Hydrofluoric Redox":[115200,3.6],"Methane Combustion":[14400,1.8],"Carbon Monoxide Arc Decomposition":[93600,428.4],"Hydrogen Propellant Unbundling":[7200,144],"Sulfur Combustion":[36000,0.36],"Triple Superphosphate Acid Extraction":[259200,7.2],"Shuttle Integration":[1658880,414720],"Light Transport Integration":[2211840,552960],"Heavy Transport Integration":[5529600,1382400],"Warehouse Construction":[1728000,0],"Extractor Construction":[2073600,0],"Refinery Construction":[4147200,0],"Bioreactor Construction":[3456000,0],"Factory Construction":[5184000,0],"Shipyard Construction":[9331200,0],"Spaceport Construction":[9331200,0],"Marketplace Construction":[10368000,0],"Habitat Construction":[14515200,0],"Tank Farm Construction":[3110400,0]};
  const PID = {"Water Electrolysis":23,"Water Vacuum-evaporation Desalination":24,"Sabatier Process":25,"Olivine Enhanced Weathering":26,"Bitumen Hydro-cracking":27,"Taenite Electrolytic Refining":28,"Calcite Calcination":29,"Huels Process":30,"Ammonia Carbonation":31,"Salt Sulfidization and Phosphorization":32,"Basic Food Cooking and Packaging":33,"Troilite Centrifugal Froth Flotation":34,"Silica Fusing":35,"Silica Pultrusion":36,"Copper Wire Drawing":37,"Salty Cement Mixing":38,"Salt Selective Crystallization":39,"Naphtha Steam-cracking":40,"Steel Alloying":41,"Silica Carbothermic Reduction":42,"Ostwald Process":43,"Wet Sulfuric Acid Process":44,"Fungal Soilbuilding":45,"Iron Oxide and Silica Carbothermic Reduction":46,"Methane Steam Reforming and Water-gas Shift":47,"Acetylene Oxalic Acid Production":48,"Lead Sulfide Smelting":49,"Tin Sulfide Smelting":50,"Iron Sulfide Roasting":51,"Haber-Bosch Process":52,"Molybdenum Disulfide Roasting":53,"Silica Gas Atomization":54,"Solder Manufacturing":55,"Quartz Filament Drawing and Wrapping":56,"Steel Beam Rolling":57,"Steel Sheet Rolling":58,"Steel Pipe Rolling":59,"Steel Wire Drawing":60,"Propylene Ammoxidation":61,"Propylene Polymerization":62,"Magnesium Chloride Molten Salt Electrolysis":63,"Solvay Process":64,"Boria Hydration":65,"Pyroxene Acid Leaching, Digestion, and Ion Exchange":66,"Apatite Acid Extraction":67,"Hydrogen Combustion":68,"Carbon Monoxide Combustion":69,"Borax Acid Extraction":70,"Nitrogen Cryocooling and Fractional Distillation":71,"Olivine Acid Leaching and Calcining":72,"Anorthite Feldspar Acid Leaching and Carbonation":73,"Sodium Chloralkali Process":74,"Potassium Chloralkali Process":75,"Apatite Acid Re-extraction":76,"Ammonium Carbonate Oxalation":77,"Xenotime Hot Acid Leaching":78,"Merrillite Hot Acid Leaching":79,"Ammonia Catalytic Cracking":80,"Uraninite Acid Leaching, Solvent Extraction, and Precipitation":81,"Coffinite Acid Leaching, Solvent Extraction, and Precipitation":82,"Alumina Forming and Sintering":83,"Austenitic Nichrome Alloying":84,"Copper Wire Insulating":85,"Silicon Czochralski Process and Wafer Slicing":86,"Steel Cable Laying":87,"Acrylonitrile Polymerization":88,"Soybean Growing":89,"Boric Acid Thermal Decomposition":90,"Lithium Carbonate Chlorination":91,"Lithium Sulfate Carbonation":92,"Iron Oxide Direct Reduction":93,"Zinc Oxide Direct Reduction":94,"Nickel Oxide Direct Reduction":95,"Pidgeon Process":96,"Polypropylene Chlorination and Basification":97,"Potato Growing":98,"Rare Earth Sulfates Oxalation and Calcination":99,"Ammonia Chlorination":100,"Hall–Heroult Process":101,"Calcium Chloride Molten Salt Electrolysis":102,"Cement Mixing":103,"Natural Flavorings Growing":104,"Yellowcake Digestion, Solvent Extraction, and Precipitation":105,"Hydrofluoric Acid Cold Electrolysis":106,"Rhabdite Roasting and Acid Extraction":107,"Ferrite Sintering":108,"Diode Doping and Assembly":109,"Ball Valve Machining":110,"Aluminium Beam Rolling":111,"Aluminium Sheet Rolling":112,"Aluminium Pipe Rolling":113,"Polyacrylonitrile Weaving":114,"Cold Gas Thruster Printing":115,"Polyacrylonitrile Oxidation and Carbonization":116,"Aluminium Small Propellant Tank Assembly":117,"Borosilicate Glassmaking":118,"Ball Bearing Machining and Assembly":119,"Large Thrust Bearing Machining and Assembly":120,"Boria Magnesiothermic Reduction":121,"Lithium Chloride Molten Salt Electrolysis":122,"Diepoxy Step Growth Polymerization":123,"Rare Earth Oxides Ion Exchange":124,"Calcium Oxide Aluminothermic Reduction":125,"Sodium Chromate Acidification and Crystallization":126,"Sulfuric Acid Hot Catalytic Reduction":127,"Molybdenum Trioxide Aluminothermic Reduction and Alloying":128,"Uranyl Nitrate Redox and Precipitation":129,"Sodium Tungstate Ion Exchange, Precipitation, and Crystallization":130,"Stainless Steel Alloying":131,"Board Printing":132,"Ferrite-bead Inductor Winding":133,"Core Drill Bit Milling":134,"Core Drill Thruster Assembly":135,"Parabolic Dish Assembly":136,"Photovoltaic Panel Amorphization and Assembly":137,"LiPo Battery Assembly":138,"Neodymium Oxide Chlorination":139,"Sodium Dichromate Hot Sulfur Reduction":141,"Photoresist Epoxy Stoichiometry and Packaging":142,"Ammonium Diuranate Calcination and Hydrogen Reduction":143,"Ammonium Paratungstate Calcination and Hydrogen Reduction":144,"Engine Bell Additive Manufacturing":145,"Steel Truss Construction":146,"Aluminium Hull Plate Construction":147,"Aluminium Truss Construction":148,"Cargo Module Construction":149,"Aluminium Pressure Vessel Construction":150,"Aluminium Propellant Tank Construction":151,"Shuttle Hull Construction":152,"Light Transport Hull Construction":153,"Cargo Ring Construction":154,"Heavy Transport Hull Construction":155,"Tungsten Gas Atomization":156,"Hydrogen Cryocooling and Reactor Consumables Stoichiometry":157,"Stainless Steel Sheet Rolling":158,"Stainless Steel Pipe Rolling":159,"Silicon Wafer CPU Photolithography, Ball Bonding, and Encapsulation":160,"Core Drill Assembly":161,"Neodymium Trichloride Vacuum Calciothermic Reduction":162,"Neodymium Trichloride Molten Salt Electrolysis":163,"Chromia Aluminothermic Reduction":165,"Uranium Dioxide Oxidation":166,"Leached Coffinite Froth Flotation, Solvent Extraction, and Precipitation":167,"Nd:YAG Czochralski Process":168,"Nichrome Alloying":169,"Magnet Sintering and Magnetization":170,"Uranium Tetrafluoride Oxidation":171,"Uranium Hexafluoride Centrifuge Cascade Enrichment":172,"Nd:YAG Laser Assembly":173,"Thin-film Resistor Sputtering and Laser-trimming":174,"HEUF6 Magnesiothermic Reduction and Fine Division":175,"Spirulina and Chlorella Algae Growing":176,"PEDOT Bacteria Culturing":177,"BPA Bacteria Culturing":178,"Potassium Hydroxide Carbonation":179,"Novolak Bacteria Culturing":180,"Ferrochromium Alloying":181,"Potassium Carbonate Oxidation":182,"Rhabdite Slag Acid Leaching":183,"Tantalate-Niobate Liquid-Liquid Extraction and Redox":184,"Carbon Dioxide Ferrocatalysis":185,"Potassium Heptafluorotantalate Sodiothermic Reduction":186,"Rhabdite Carbothermic Reduction":187,"Polymer Tantalum Capacitor Assembly":188,"Surface Mount Device Reel Assembly":189,"Pick-and-place Board Population":190,"Motor Stator Assembly":191,"Motor Rotor Assembly":192,"Brushless Motor Assembly":193,"Landing Leg Assembly":194,"Landing Auger Assembly":195,"Pump Assembly":196,"Antenna Assembly":197,"Fiber Optic Gyroscope Assembly":198,"Star Tracker Assembly":199,"Computer Assembly":200,"Control Moment Gyroscope Assembly":201,"Robotic Arm Assembly":202,"Feldspar Aluminium Hydroxide Calcination":203,"Ferrochromium Roasting and Hot Base Leaching":204,"Beryllium Carbonate Calcination":205,"Beryllia Forming and Sintering":206,"Silicon Wafer CCD Photolithography, Ball Bonding, and Packaging":207,"Heat Exchanger Assembly":208,"Turbopump Assembly":209,"Laser Diode Doping, Amorphization, and Assembly":210,"Separator Centrifuge Assembly":211,"Fuel Make-up Tank Assembly":212,"Neon Make-up Tank Assembly":213,"Lightbulb End Moderators Assembly":214,"Cold Gas Torque Thruster Printing":215,"Fused Quartz Lightbulb Additive/Subtractive Assembly":216,"Reactor Plumbing Assembly Squared":217,"Flow Divider Moderator Assembly":218,"Nuclear Lightbulb Assembly":219,"Reactor Shell Assembly":220,"Closed-cycle Gas Core Nuclear Reactor Engine Assembly":221,"Habitation Module Assembly":222,"Mobility Module Assembly":223,"Fluids Automation Module Assembly":224,"Solids Automation Module Assembly":225,"Terrain Interface Module Assembly":226,"Avionics Module Assembly":227,"Escape Module Assembly":228,"Attitude Control Module Assembly":229,"Power Module Assembly":230,"Thermal Module Assembly":231,"Propulsion Module Assembly":232,"Sulfur Dioxide Plasma Catalysis":233,"Parkes Process":234,"Bicarbonate Solvay Process":235,"Solvay-Hou Process":236,"Bicarbonate Solvay-Hou Process":237,"Sodium Bicarbonate Calcination":238,"Epoxy Stoichiometry and Packaging":239,"PEDOT Algae Growing":240,"BPA Algae Growing":241,"Novolak Algae Growing":242,"Hydrochloric Redox":243,"Hydrofluoric Redox":244,"Methane Combustion":245,"Carbon Monoxide Arc Decomposition":246,"Hydrogen Propellant Unbundling":247,"Sulfur Combustion":248,"Triple Superphosphate Acid Extraction":249,"Shuttle Integration":250,"Light Transport Integration":251,"Heavy Transport Integration":252,"Warehouse Construction":300,"Extractor Construction":301,"Refinery Construction":302,"Bioreactor Construction":303,"Factory Construction":304,"Shipyard Construction":305,"Spaceport Construction":306,"Marketplace Construction":307,"Habitat Construction":308,"Tank Farm Construction":309};

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const Y = () => window.YIC || {};
  const D = () => Y().D || null;
  const nm = (b) => (b && b.Name && b.Name.name) || (b ? 'Building #' + b.id : '');
  const inv = (b) => (b.Inventories || []).find((x) => x.slot === SLOT && x.status === 1);
  const isStore = (b) => b.Building.buildingType === WAREHOUSE || b.Building.buildingType === TANK;
  const rockOf = (b) => (b.meta && b.meta.asteroid && b.meta.asteroid.name) || '';
  let MV = {}, R = null, NAMES = {}; // product mass/volume, recipes, product names
  const pname = (p) => NAMES[p] || (Y().pn && Y().pn(p)) || '#' + p;
  const grams = (p) => (MV[p] || [1000, 1000])[0];
  const bulk = (p) => grams(p) === 1000;
  const tonnes = (kg) => (kg >= 10000 ? Math.round(kg / 1000).toLocaleString('en-GB') : (+(kg / 1000).toFixed(kg >= 1000 ? 1 : 3)).toLocaleString('en-GB')) + ' t';
  const amt = (p, u) => (bulk(p) ? tonnes(u) : '× ' + Math.ceil(u).toLocaleString('en-GB')); // 1 unit of a bulk product = 1 kg

  // Load a ship (Mark, 9 Nov 2026) – LIVE 9 Nov 2026: vendor/shipload.js fills #dk-ship under "Short on this rock"
  const SHIPS = true; // LIVE 9 Nov 2026
  // 🐞 Report a problem inside the hub (Mark, 10 Nov 2026). Opens the site's report box (vendor/report.js).
  const REPHUB = true; // LIVE 10 Nov 2026 (tested on ?beta=1 – Mark)
  // Hub top bar like the main deck's tab bar (Mark, 10 Nov 2026)
  const TOPBAR = true; // LIVE 10 Nov 2026 (tested on ?beta=1 – Mark)
  const S = { bs: 30, calls: [], msg: '', msgErr: false, busy: false, by: 'out', ok: false, rock: '', dest: 0, bld: 0, proc: -1, runs: 1000, crew: 0, feed: false, ready: false };

  // ---------- overlay + airlock ----------
  function build() {
    if (document.getElementById('dk-ov')) return;
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap'; document.head.appendChild(l);
    const st = document.createElement('style'); st.textContent = CSS + '#dk-ov .dk-top{background:linear-gradient(180deg,rgba(18,13,7,.97),rgba(7,5,3,.96))!important}#dk-ov .dk-top .stripe{height:6px}#dk-ov .dkt-row{display:flex;gap:6px;flex-wrap:wrap;align-items:flex-end;padding:8px 0 0}#dk-ov .dkt{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:8px;margin:0;padding:9px 18px 8px;font:700 13px/1 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#8b9ab0;background:#0c1118;border:1px solid #243041;border-bottom:0;clip-path:polygon(10px 0,calc(100% - 10px) 0,100% 100%,0 100%);transition:color .15s,background .15s}#dk-ov .dkt::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--cyan);box-shadow:0 0 6px var(--cyan)}#dk-ov a.dkt:hover,#dk-ov a.dkt:focus-visible{color:var(--cyan);background:#121a24}#dk-ov .dkt.on{cursor:default;color:#1a1000;background:var(--amber);border-color:var(--amber);box-shadow:0 0 18px var(--amber)}#dk-ov .dkt.on::before{background:#1a1000;box-shadow:none}#dk-ov .dkt-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-left:auto;padding:0 0 6px 10px}#dk-ov .dkt-tools .live{font-size:12px;padding:4px 10px}@media (min-width:1100px){#dk-ov .dkt-row{position:relative}#dk-ov .dkt-tools{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);margin:0;padding:4px 0 0}}#dk-ov .dkt-tools .dk-br{font-size:12px;border-radius:8px;padding:5px 10px;background:#121a26;border-color:#2a3648}#dk-ov .dkt-tools .dk-br:hover,#dk-ov .dkt-tools .dk-br:focus-visible{border-color:var(--cyan)}#dk-ov .dkt-sub{display:flex;justify-content:center;padding:8px 0 10px;border-top:2px solid var(--amber);box-shadow:0 -1px 10px -2px var(--amber)}#dk-ov .dkt-sub .dkp-rc{margin:0;font:700 13px system-ui,sans-serif;padding:6px 16px;color:#ffe2b0;background:#2a1d08;border:1px solid var(--amber);box-shadow:0 0 8px rgba(255,176,59,.8),0 0 22px rgba(255,138,31,.5);text-shadow:0 0 8px rgba(255,176,59,.8)}#dk-ov .dkt-sub .dkp-rc:hover,#dk-ov .dkt-sub .dkp-rc:focus-visible{color:#fff;box-shadow:0 0 14px rgba(255,210,140,1),0 0 36px rgba(255,138,31,.9)}#dk-ov .dkt-sub .dkp-rc:disabled{opacity:.6;box-shadow:none}@media (max-width:700px){#dk-ov .dkt-row{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}#dk-ov .dkt{flex:none}#dk-ov .dkt-tools .live{display:none}}#dk-ov .dk-rep{text-align:center;margin:18px auto 6px;padding-top:12px;border-top:1px solid #4a3416;max-width:640px;color:var(--dim);font-size:14px}#dk-ov .dk-rep a{display:inline-block;margin:4px 5px;padding:5px 12px;border-radius:6px;font-weight:700;font-size:13px;text-decoration:none;background:#2a1d08;color:#ffd28a;border:1px solid var(--amber)}#dk-ov .dk-rep a:hover,#dk-ov .dk-rep a:focus-visible{box-shadow:0 0 10px rgba(255,176,59,.45)}#dk-ov input[type=number]{width:110px!important;flex:none!important}#dk-ov tr,#dk-ov tr:hover td{background:none!important}#dk-ov .card{border:0!important}#dk-ov .dk-bview{width:100%;height:100%;object-fit:cover;display:block;background:#0b0e14}#dk-ov .dkv{position:fixed;inset:0;z-index:5;background:#05070c;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4vmin;animation:fadein .7s;cursor:pointer}#dk-ov .dkv.out{opacity:0;transition:opacity .6s}#dk-ov .dkv-win{position:relative;width:100%;height:100%;border-radius:4vmin;overflow:hidden;box-shadow:0 0 0 1.4vmin #1a202b,0 0 0 1.8vmin #3b4558,0 0 0 3vmin #141922,0 0 60px #000 inset}#dk-ov .dkv-win svg{width:100%;height:100%;display:block}#dk-ov .dkv-r{fill:none;stroke:#8fe3ff;stroke-width:2;opacity:.45;stroke-dasharray:10 8;animation:dkvdash 1.2s linear infinite}@keyframes dkvdash{to{stroke-dashoffset:-36}}#dk-ov .dkv-c{fill:#ffb03b;filter:drop-shadow(0 0 6px #ffb03b)}#dk-ov .dkv-bi{mix-blend-mode:screen}#dk-ov .dkv-bl{animation:dkvbl 1.4s ease-in-out infinite alternate}@keyframes dkvbl{from{opacity:.2}to{opacity:1}}#dk-ov .dkv-sm{animation:dkvsm 2s ease-out infinite}@keyframes dkvsm{from{transform:translateY(0) scale(.6);opacity:.6}to{transform:translateY(-30px) scale(1.6);opacity:0}}#dk-ov .dkv-ship{position:absolute;width:22vmin;height:auto;filter:drop-shadow(0 0 10px #8fe3ff55);pointer-events:none}#dk-ov .dkv-ship.s1{left:4%;top:46%;animation:dkvf1 9s ease-in-out forwards}#dk-ov .dkv-ship.s2{left:72%;top:6%;width:14vmin;animation:dkvf2 9s ease-in-out forwards}#dk-ov .dkv-ship.s3{top:26%;left:60%;width:9vmin;animation:dkvf3 6s ease-in-out forwards}@keyframes dkvf1{0%{transform:translate(0,0) rotate(-8deg) scale(1);opacity:0}12%{opacity:1}100%{transform:translate(18vw,-30vh) rotate(-14deg) scale(.55);opacity:1}}@keyframes dkvf2{0%{transform:translate(0,0) rotate(10deg) scale(.6);opacity:0}15%{opacity:1}100%{transform:translate(-12vw,26vh) rotate(4deg) scale(1);opacity:1}}@keyframes dkvf3{0%{transform:translateY(40px);opacity:0}30%{opacity:1}100%{transform:translateY(-30px) translateX(80px);opacity:1}}#dk-ov .dkv-glass{position:absolute;inset:0;background:linear-gradient(120deg,#ffffff10 0%,transparent 30%,transparent 70%,#ffffff08 100%);pointer-events:none}#dk-ov .dkv-cap{position:absolute;left:0;right:0;top:9%;text-align:center;color:var(--dim);letter-spacing:.2em;font-size:clamp(12px,1.6vmin,20px);text-transform:uppercase}#dk-ov .dkv-cap span{display:block;color:var(--amber);font-size:2.4em;letter-spacing:.25em;font-weight:700;text-shadow:0 0 18px #ff8a1f88}#dk-ov .dkv-warn{display:inline-block;margin-top:1.4em;padding:.55em 1.4em;border-radius:40px;font-weight:700;font-size:1.35em;letter-spacing:.14em;color:#1a1000;background:linear-gradient(#ffc45e,#ff8a1f);box-shadow:0 0 22px #ff8a1f99;animation:dkvwarn 1.2s ease-in-out infinite alternate}@keyframes dkvwarn{from{box-shadow:0 0 10px #ff8a1f66}to{box-shadow:0 0 34px #ff8a1fcc}}#dk-ov .dkv-skip{position:absolute;right:3%;bottom:3%;color:#5c6577;font-size:13px;letter-spacing:.1em}#dk-ov .dkp-sv{display:flex;flex-direction:column;gap:6px}#dk-ov .dkp-svi{display:flex;align-items:center;gap:8px;background:#0b0e14;border:1px solid #232a37;border-radius:10px;padding:8px 12px}#dk-ov .dkp-svi.on{border-color:#ffb03b88}#dk-ov .dkp-svi a{flex:1;color:var(--ink);text-decoration:none}#dk-ov .dkp-svi a span{display:block;color:var(--dim);font-size:.85em}#dk-ov .dkp-svi button{background:none;border:0;color:var(--dim);cursor:pointer;font-size:1.1em}#dk-ov .dkp-rc{margin-top:10px;background:#0d1d26;border:1px solid #8fe3ff66;color:var(--cyan);border-radius:8px;padding:6px 14px;font:600 1em Rajdhani,sans-serif;cursor:pointer}#dk-ov .dkp-sum{display:flex;flex-wrap:wrap;gap:10px;margin:4px 0}#dk-ov .dkp-sum>div{background:#0b0e14;border:1px solid #2a3140;border-radius:10px;padding:8px 14px;color:var(--dim);font-size:.9em;min-width:110px}#dk-ov .dkp-sum b{display:block;font-size:1.7em;color:var(--ink);line-height:1.1}#dk-ov .dkp-sum .good b{color:var(--green)}#dk-ov .dkp-sum .bad b{color:#c4a8ff}#dk-ov .dkp-st{margin:14px 0 4px;border-left:3px solid #ffb03b55;padding-left:12px}#dk-ov .dkp-st.fly{border-left-color:#9a6bff88}#dk-ov .dkp-sh{font-weight:700;letter-spacing:.06em;color:var(--ink);margin-bottom:8px}#dk-ov .dkp-sh span{color:var(--amber);margin-right:10px;text-transform:uppercase;font-size:.85em}#dk-ov .dkp-st.fly .dkp-sh span{color:#c4a8ff}#dk-ov .dkp-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}#dk-ov .dkp-t{display:flex;gap:10px;align-items:flex-start;background:#0b0e14;border:1px solid #232a37;border-radius:10px;padding:10px 12px}#dk-ov .dkp-t.mine{border-color:#3fd68a44}#dk-ov .dkp-t.fin{border-color:#ffb03b88;box-shadow:0 0 14px #ff8a1f22}#dk-ov .dkp-ic{width:44px!important;height:44px!important;object-fit:contain;flex:none;border-radius:6px;background:#141923}#dk-ov .dkp-n{font-weight:700;font-size:1.05em}#dk-ov .dkp-s{color:var(--dim);font-size:.88em;line-height:1.25}#dk-ov .dkp-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}#dk-ov .dkp-chips span{background:#1a2030;border-radius:12px;padding:1px 9px;font-size:.82em;color:#cdd6e3}#dk-ov .dkp-to{margin-top:6px;font-size:.85em;color:#cdd6e3}#dk-ov .dkp-to b{color:var(--amber)}#dk-ov .dkp-ch{margin-top:4px;font-size:.82em;color:var(--dim)}#dk-ov .dkp-ch summary{cursor:pointer}#dk-ov .dkp-ch select{margin-top:4px;min-width:0!important;font-size:1em}#dk-ov input[type=search]{background:#0b0e14!important;color:var(--ink)!important;border:1px solid #3a4356!important;border-radius:6px;padding:7px 10px;font:600 1em Rajdhani,sans-serif;width:auto!important}#dk-ov a.yicg{color:var(--cyan);font-size:.85em;margin-left:8px;white-space:nowrap}#dk-ov .dk-br{color:var(--cyan);text-decoration:none;font-weight:700;letter-spacing:.06em;border:1px solid #8fe3ff66;border-radius:20px;padding:4px 14px}#dk-ov .dk-br:hover{background:#8fe3ff18}#dk-ov:not(.indock){padding:2vmin}#dk-ov .wrap{max-width:none!important;width:100%;height:calc(100vh - 4vmin);gap:2vmin}#dk-ov .chamber{flex:1 1 auto!important;height:100%;aspect-ratio:auto!important}#dk-ov .panel{flex:0 0 clamp(320px,28vw,560px)!important;font-size:clamp(13px,min(1.25vw,2.1vh),22px);padding:2.2vmin 2.4vmin;max-height:100%;overflow:auto}#dk-ov input[type=checkbox]{width:1.25em!important;min-width:0!important;max-width:1.25em!important;height:1.25em!important;flex:0 0 1.25em!important;margin:0!important;padding:0!important}#dk-ov .panel label{width:auto!important}#dk-ov .panel h1{font-size:2em}#dk-ov .panel .sub,#dk-ov .panel ul,#dk-ov .panel label,#dk-ov .panel .warn,#dk-ov .panel .back{font-size:1em}#dk-ov .panel .btn{font-size:1.15em;padding:1.6vmin}#dk-ov .sign{font-size:clamp(12px,1.6vmin,22px)}#dk-ov .door .lbl{font-size:clamp(11px,1.8vmin,24px)}#dk-ov #dockpg{max-width:none!important;padding:0 3vw 40px;font-size:clamp(15px,1.1vw,20px)}#dk-ov .card h2{font-size:1.25em}#dk-ov table{font-size:1em}#dk-ov select{font-size:1em}@media (max-width:900px){#dk-ov .wrap{height:auto}#dk-ov .chamber{height:auto;aspect-ratio:16/11!important}}'; document.head.appendChild(st);
    const ov = document.createElement('div'); ov.id = 'dk-ov';
    ov.innerHTML = WRAP + '<div id="dockpg">' + (TOPBAR
      // Mark (10 Nov, TEST ONLY): the top like the main deck – deck tabs (The Bridge · Logistics Hub) and a tool row under a glowing line
      ? '<div class="dhead dk-top"><div class="stripe"></div><div class="dkt-row"><a href="#" data-dkback class="dkt" title="Return to the Bridge">The Bridge</a><h1 class="dkt on">LOGISTICS HUB</h1>' +
        '<div class="dkt-tools"><div class="live"><i></i>THIS PAGE CAN SEND GAME ACTIONS WHEN APPROVED<i></i></div></div></div>' +
        '<div class="dkt-sub"><button id="dk-hrc" class="dkp-rc" title="Fetch fresh game data">↻ Check the game again</button></div></div>'
      : '<div class="dhead"><div class="stripe"></div><div class="in"><h1>LOGISTICS HUB</h1>' +
      '<div class="live"><i></i>THIS PAGE SENDS GAME ACTIONS FROM YOUR WALLET</div>' + '<button id="dk-hrc" class="dkp-rc" style="margin:0" title="Fetch fresh game data">↻ Check the game again</button>' + '<a href="#" data-dkback class="dk-br">◂ Return to the Bridge</a></div></div>') + '<div id="dk-main"></div>' +
      (REPHUB ? '<div class="dk-rep">Found something not working? <a href="#" id="dk-repb">🐞 Report a problem</a></div>' : '') +
      '<div class="mocknote">Game data, pictures and art © Unstoppable Games (Influence), used with credit under CC BY-NC 4.0 · Not an official Influence site · <a href="#" data-dkback style="color:var(--cyan)">return to the Bridge</a></div></div>';
    // Mark (8 Nov): the airlock window looks out at one of the game's buildings – a different one each time –
    // and opening the doors shows the whole building
    { const pick = [1, 3, 4, 5, 6, 7, 8, 10][Math.floor(Math.random() * 8)], dk = ov.querySelector('.dock');
      if (dk) dk.innerHTML = `<img src="bimg.php?t=${pick}&l=1" alt="" class="dk-bview">`; }
    document.body.appendChild(ov);
    // Hub header pinned to the top (Mark, 9 Nov: it scrolled away in Brave) – fixed, not sticky, lined up with the
    // page column and the page pushed down by its height, so it stays put in every browser.
    const pin = () => {
      const pg = ov.querySelector('#dockpg'), hd = ov.querySelector('.dhead');
      if (!pg || !hd || !ov.classList.contains('indock')) { if (hd) hd.style.position = ''; if (pg) pg.style.paddingTop = ''; return; }
      const r = pg.getBoundingClientRect(), cs = getComputedStyle(pg);
      Object.assign(hd.style, { position: 'fixed', top: '0', left: (r.left + parseFloat(cs.paddingLeft)) + 'px', width: (pg.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) + 'px' });
      pg.style.paddingTop = hd.offsetHeight + 'px';
    };
    try { new ResizeObserver(pin).observe(ov); } catch (x) {}
    window.addEventListener('resize', pin);
    new MutationObserver(pin).observe(ov, { attributes: true, attributeFilter: ['class'] });
    // app.js rewrites <head> and <body> while it loads – keep putting the dock back on top (same scroll place)
    let ovY = 0; ov.addEventListener('scroll', () => { if (ov.isConnected) ovY = ov.scrollTop; }, { passive: true });
    const keep = () => { if (!l.isConnected) document.head.appendChild(l); if (!st.isConnected) document.head.appendChild(st); if (!ov.isConnected) { document.body.appendChild(ov); ov.scrollTop = ovY; } document.documentElement.style.overflow = 'hidden'; };
    // Bridge flash fix (Mark, 8 Nov): app.js rewrites <head>/<body> while loading and on Refresh, which removed the
    // dock until the next 400 ms tick – long enough to see the Bridge. A MutationObserver puts it back straight away,
    // before the browser paints; the timer stays as a back-up.
    const mo = new MutationObserver(() => { if (!ov.isConnected || !st.isConnected || !l.isConnected) keep(); });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    const timer = setInterval(keep, 1000); keep();
    // Return to the Bridge (Mark, 8 Nov): close the dock and go to the Bridge – no reload
    ov.addEventListener('click', (e) => { if (e.target.id === 'dk-repb') { e.preventDefault(); if (window.YICreport) window.YICreport(); } });
    ov.addEventListener('click', (e) => { if (e.target.id === 'dk-hrc' && !e.target.disabled) recheck(null); });
    ov.addEventListener('click', (e) => {
      const a = e.target.closest('[data-dkback]'); if (!a) return; e.preventDefault();
      clearInterval(timer); mo.disconnect(); try { speechSynthesis.cancel(); } catch (x) {}
      ov.remove(); st.remove(); document.documentElement.style.overflow = '';
      try { history.replaceState(history.state, '', location.pathname + location.search.replace(/[?&](dock|feed)=1\b/g, '').replace(/^&/, '?') + location.hash); } catch (x) {}
      linkLoop(); // bring the Logistics Hub button back (Mark, 9 Nov: it was missing after returning to the Bridge)
      if (window.YICgoDeck) window.YICgoDeck('bridge'); else location.reload();
    });
    airlock(ov);
  }
  // SECRET AIRLOCK BYPASS (Mark, 9 Nov – LIVE 9 Nov 2026): the kPa gauge on the left wall is really a knob. Click it
  // to turn it – next time the hub opens straight in, no airlock. Nothing shows it's clickable; Mark tells players who ask.
  // To get the airlock back: double-click LOGISTICS HUB at the top of the hub. Saved only in this browser (localStorage).
  const BYKEY = 'sk_airlock_bypass', BYBETA = true; // LIVE 9 Nov 2026 (tested on ?beta=1 – Mark)
  const bypassOn = () => { try { return BYBETA && localStorage.getItem(BYKEY) === '1'; } catch (e) { return false; } };
  function knob(ov, setSign) {
    const g = ov.querySelector('g[transform="translate(135 340)"]');
    if (!g || !BYBETA) return;
    const needle = g.querySelector('line');
    const show = () => { if (needle) { needle.style.transformOrigin = '0 0'; needle.style.transition = 'transform .5s'; needle.style.transform = bypassOn() ? 'rotate(95deg)' : ''; } };
    show();
    g.style.pointerEvents = 'all';
    g.addEventListener('click', () => {
      try { if (bypassOn()) localStorage.removeItem(BYKEY); else localStorage.setItem(BYKEY, '1'); } catch (e) {}
      show();
      try { const A = new (window.AudioContext || window.webkitAudioContext)(), o = A.createOscillator(), gn = A.createGain(); o.type = 'square'; o.frequency.value = 180; gn.gain.setValueAtTime(0.15, A.currentTime); gn.gain.exponentialRampToValueAtTime(0.001, A.currentTime + 0.08); o.connect(gn); gn.connect(A.destination); o.start(); o.stop(A.currentTime + 0.09); } catch (e) {}
      setSign(bypassOn() ? '● BYPASS ENGAGED – NEXT TIME STRAIGHT IN' : '● BYPASS OFF', bypassOn() ? 'green' : 'amber');
    });
  }
  function airlock(ov) {
    const q = (s) => ov.querySelector(s);
    const ok = q('#ok'), skip = q('#skip'), go = q('#go'), sign = q('#sign'), wrap = q('#wrap'), ch = q('#chamber'), KEY = 'sk_airlock_skip';
    const setSign = (t, c) => { sign.textContent = t; sign.className = 'sign' + (c ? ' ' + c : ''); };
    knob(ov, setSign);
    // bypass turned on: straight into the hub (the wallet still asks before anything is sent)
    if (bypassOn()) { wrap.style.display = 'none'; ov.classList.add('indock'); ov.scrollTop = 0; S.ok = true; render(); }
    // double-click LOGISTICS HUB: airlock back on
    const t = ov.querySelector('.dhead h1');
    if (t) t.addEventListener('dblclick', () => { try { localStorage.removeItem(BYKEY); } catch (e) {} t.textContent = 'LOGISTICS HUB · AIRLOCK BACK ON'; setTimeout(() => { t.textContent = 'LOGISTICS HUB'; }, 2500); });
    ok.addEventListener('change', () => { go.disabled = !ok.checked; setSign(ok.checked ? '● READY TO CYCLE' : '● INNER DOOR LOCKED', ok.checked ? 'amber' : ''); });
    // Remembered: "I understand" is ticked for them, but they still cycle the airlock every time (Mark, 8 Nov)
    let rem = false; try { rem = localStorage.getItem(KEY) === '1'; } catch (e) {}
    if (rem) { ok.checked = true; skip.checked = true; go.disabled = false; setSign('● READY TO CYCLE', 'amber'); }
    go.addEventListener('click', () => {
      try { if (skip.checked) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); } catch (e) {}
      go.disabled = ok.disabled = skip.disabled = true;
      airlockSound();
      wrap.classList.add('cycling'); ch.classList.add('cycling'); setSign('● CYCLING…', 'amber');
      setTimeout(() => {
        // Mark (8 Nov): warning while it cycles → doors open → pause → "Entering the Logistics Hub…" → THEN the next screen
        wrap.classList.remove('cycling'); ch.classList.remove('cycling'); setSign('● DOOR OPEN', 'green'); ch.classList.add('open');
        let gone = false;
        const enter = () => { if (gone) return; gone = true; wrap.classList.add('gone'); setTimeout(() => { wrap.style.display = 'none'; (skip.checked ? (o, f) => f() : viewDeck)(ov, () => { ov.classList.add('indock'); ov.scrollTop = 0; S.ok = true; render(); }); }, 600); };
        setTimeout(enter, 2900); // doors fully open (~2.5 s) – then the viewing deck, which speaks the welcome
      }, 2800);
    });
  }

  // ---------- airlock sound (made in the browser – no sound files) ----------
  // Cycling: two-tone alarm beeps + rising pressure hum; doors: clunk, then a long air hiss.
  function airlockSound() {
    let A; try { A = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const t0 = A.currentTime + 0.05, out = A.createGain(); out.gain.value = 0.5; out.connect(A.destination);
    const tone = (f, a, b, vol, type) => { const o = A.createOscillator(), g = A.createGain(); o.type = type || 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(0, a); g.gain.linearRampToValueAtTime(vol, a + 0.02); g.gain.setValueAtTime(vol, b - 0.04); g.gain.linearRampToValueAtTime(0, b);
      o.connect(g); g.connect(out); o.start(a); o.stop(b + 0.05); };
    // klaxon: three rising whoops
    for (let k = 0; k < 3; k++) { const a = t0 + k * 0.9, o = A.createOscillator(), g = A.createGain(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(420, a); o.frequency.linearRampToValueAtTime(820, a + 0.7);
      g.gain.setValueAtTime(0, a); g.gain.linearRampToValueAtTime(0.13, a + 0.05); g.gain.setValueAtTime(0.13, a + 0.65); g.gain.linearRampToValueAtTime(0, a + 0.75);
      o.connect(g); g.connect(out); o.start(a); o.stop(a + 0.8); }
    // spoken warning (the browser's own voice)
    try { const v = new SpeechSynthesisUtterance('Warning. Airlock cycling. Entering the Logistics Hub.') /* Mark, 13 Nov – LIVE 13 Nov 2026 */; v.rate = 1.1; v.pitch = 0.8; v.volume = 0.9; speechSynthesis.cancel(); setTimeout(() => speechSynthesis.speak(v), 60); } catch (e) {} // starts (almost) at once and is short enough to finish before the doors open (2.8 s)
    // pressure hum rising while it cycles
    const h = A.createOscillator(), hg = A.createGain(); h.type = 'sawtooth'; h.frequency.setValueAtTime(55, t0); h.frequency.linearRampToValueAtTime(110, t0 + 2.7);
    const lp = A.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300;
    hg.gain.setValueAtTime(0, t0); hg.gain.linearRampToValueAtTime(0.18, t0 + 1); hg.gain.linearRampToValueAtTime(0, t0 + 2.8);
    h.connect(lp); lp.connect(hg); hg.connect(out); h.start(t0); h.stop(t0 + 2.9);
    // door: clunk, then hiss of air while the doors slide
    const td = t0 + 2.8;
    const ck = A.createOscillator(), cg = A.createGain(); ck.type = 'sine'; ck.frequency.setValueAtTime(120, td); ck.frequency.exponentialRampToValueAtTime(40, td + 0.25);
    cg.gain.setValueAtTime(0.6, td); cg.gain.exponentialRampToValueAtTime(0.001, td + 0.3); ck.connect(cg); cg.connect(out); ck.start(td); ck.stop(td + 0.35);
    const n = A.createBuffer(1, A.sampleRate * 2.6, A.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const ns = A.createBufferSource(); ns.buffer = n; const bp = A.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.7;
    bp.frequency.setValueAtTime(5000, td + 0.1); bp.frequency.linearRampToValueAtTime(1500, td + 2.6);
    const ng = A.createGain(); ng.gain.setValueAtTime(0, td + 0.1); ng.gain.linearRampToValueAtTime(0.35, td + 0.3); ng.gain.linearRampToValueAtTime(0, td + 2.6);
    ns.connect(bp); bp.connect(ng); ng.connect(out); ns.start(td + 0.1); ns.stop(td + 2.7);
    setTimeout(() => { try { A.close(); } catch (e) {} }, 6500);
  }

  // ---------- viewing deck (Mark, 8 Nov): a short holding screen between the airlock and the hub ----------
  // A big window over a made-up stretch of rock (not the player's real buildings): lit buildings, glowing
  // delivery routes with cargo moving along them, and game ships drifting past. ~4.5 s, click to skip.
  function viewDeck(ov, done) {
    const v = document.createElement('div'); v.className = 'dkv';
    // the game's own building pictures (bimg.php, 160×90 on a dark background) – "screen" blending drops the dark
    // background so they glow on the rock (Mark, 8 Nov: try the game images)
    const BT2 = { ware: 1, ref: 3, tank: 10, port: 7, fac: 5, ext: 2 };
    // feathered edges (mask) so no picture shows as a box
    const B = (x, y, kind) => `<image href="bimg.php?t=${BT2[kind]}" x="${x - 105}" y="${y - 100}" width="210" height="118" class="dkv-bi" mask="url(#dkvM)"/>`;
    const P = [[190, 500, 'ware'], [510, 485, 'tank'], [830, 485, 'port'], [1130, 500, 'ext'], [350, 640, 'ref'], [670, 650, 'fac'], [990, 640, 'ware']];
    const R = [[0, 4], [4, 1], [1, 5], [5, 2], [2, 6], [6, 3], [4, 5], [5, 6]];
    const route = ([a, b], i) => { const A = P[a], C = P[b], mx = (A[0] + C[0]) / 2, my = Math.max(A[1], C[1]) + 18;
      const d = `M${A[0]} ${A[1]} Q${mx} ${my} ${C[0]} ${C[1]}`;
      return `<path d="${d}" class="dkv-r"/><circle r="5" class="dkv-c"><animateMotion dur="${2.4 + (i % 4) * 0.5}s" begin="-${i * 0.37}s" repeatCount="indefinite" path="${d}"/></circle>`; };
    v.innerHTML = `<div class="dkv-win"><svg viewBox="0 0 1300 700" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="dkvS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02040a"/><stop offset="1" stop-color="#0b1426"/></linearGradient>
<radialGradient id="dkvF" cx=".5" cy=".55" r=".5"><stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="dkvM" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#dkvF)"/></mask><radialGradient id="dkvL"><stop offset=".35" stop-color="#ffd27a" stop-opacity=".25"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient><linearGradient id="dkvG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1d24"/><stop offset="1" stop-color="#0b0b10"/></linearGradient></defs>
<rect width="1300" height="700" fill="url(#dkvS)"/>
${Array.from({ length: 70 }, (_, i) => `<circle cx="${(i * 197) % 1300}" cy="${(i * 89) % 380}" r="${(i % 3) * 0.5 + 0.6}" fill="#fff" opacity="${0.3 + (i % 5) * 0.12}"/>`).join('')}
<circle cx="1080" cy="120" r="46" fill="#ffe9b8" opacity=".9"/><circle cx="1080" cy="120" r="110" fill="url(#dkvL)"/>
<path d="M0 420 Q650 340 1300 420 V700 H0 Z" fill="url(#dkvG)"/>

${P.map((p) => B(p[0], p[1], p[2])).join('')}
${R.map(route).join('')}
</svg>
<img src="shipimg.php?t=3&g=1" alt="" class="dkv-ship s1"><img src="shipimg.php?t=2&g=1" alt="" class="dkv-ship s2"><img src="shipimg.php?t=4&g=1" alt="" class="dkv-ship s3">
<div class="dkv-glass"></div><div class="dkv-cap"><span>LOGISTICS HUB</span><b class="dkv-warn">⚠ Live game actions · sent only when you approve</b></div><div class="dkv-skip">click to skip</div></div>
`;
    ov.appendChild(v);
    let fin = false;
    const end = () => { if (fin) return; fin = true; v.classList.add('out'); setTimeout(() => { v.remove(); done(); }, 600); };
    v.addEventListener('click', end);
    // Mark (8 Nov): the welcome is spoken over the view. Stay at least 4.5 s, and until the voice has finished.
    let minDone = false, said = false, spoke = false;
    const maybe = () => { if (minDone && said) end(); };
    setTimeout(() => { minDone = true; maybe(); }, 4500);
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(/[?&]beta=1\b/.test(location.search) ? 'Welcome to the centre where all the moves come together.' : 'Entering the Logistics Hub. The centre where all the moves come together.') /* the airlock now says 'Entering the Logistics Hub' (Mark, 13 Nov – TEST ONLY) */; u.rate = 0.95; u.pitch = 0.8; u.volume = 0.9;
      u.onstart = () => { spoke = true; }; u.onend = () => setTimeout(() => { said = true; maybe(); }, 400); u.onerror = () => { said = true; maybe(); };
      setTimeout(() => speechSynthesis.speak(u), 350); // Chrome/Brave drop a speak() made straight after cancel()
    } catch (e) { said = true; }
    setTimeout(() => { if (!spoke) { said = true; maybe(); } }, 2000); // no voice in this browser
    setTimeout(end, 12000); // safety net
  }

  // ---------- data ----------
  async function loadRecipes() {
    try {
      const t = await fetch('vendor/chain.js', { cache: 'force-cache' }).then((r) => r.text());
      const line = t.split('\n').find((x) => x.startsWith('const DATA='));
      const d = JSON.parse(line.slice('const DATA='.length).replace(/;\s*$/, ''));
      NAMES = d.prods || {};
      R = d.procs.map((p, i) => ({ i, name: p[0], type: p[1], inp: p[2], out: p[3] }));
    } catch (e) { R = []; }
    try {
      const t = await fetch('vendor/tidy.js', { cache: 'force-cache' }).then((r) => r.text());
      const m = /const MV = (\{.*?\});/.exec(t); if (m) MV = JSON.parse(m[1]);
    } catch (e) {}
  }
  const allB = () => ((D() && D().allB) || []).filter((b) => b.Building && b.Building.status === 3);
  const rocks = () => [...new Set(allB().filter(isStore).map(rockOf).filter(Boolean))].sort();
  const onRock = () => allB().filter((b) => rockOf(b) === S.rock);
  const procB = () => onRock().filter((b) => BTN[b.Building.buildingType]).sort((a, b) => a.Building.buildingType - b.Building.buildingType || nm(a).localeCompare(nm(b)));
  // a processor is free only when its status is 0 – a finished one (status 1, time passed) must be collected first
  const freeSlot = (b) => { const x = (b.Processors || []).find((q) => q.status === 0); return x ? (x.slot || 1) : 0; };
  const busyTxt = (b) => {
    const now = Date.now() / 1000;
    if (freeSlot(b)) return 'idle';
    const fin = (b.Processors || []).filter((x) => x.status === 1 && x.finishTime > now).map((x) => x.finishTime);
    if (!fin.length) return 'finished – collect it first';
    const s = Math.min(...fin) - now, h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
    return 'busy ' + (h ? h + 'h ' + m + 'm' : Math.max(1, m) + 'm');
  };
  // ---------- distances (Mark, 8 Nov – "distance … will play a big part on huge rocks") ----------
  // Same maths as @influenceth/sdk 2.8.1 Asteroid.getLotDistance / getLotTravelTime (rules: project doc
  // claude/game-rules-logistics-2026-11-08.md): lots sit on a golden-angle spiral; radius = 375.142 ÷ id^0.475 km;
  // a trip is FREE (instant) when km ÷ speed bonus ≤ 5 km × free-distance bonus, else km ÷ (2.5 km per game hour ×
  // speed bonus); real time = game time ÷ 24 (about 1 real minute per km with no bonuses).
  const GA = Math.PI * (3 - Math.sqrt(5));
  const locOf = (e, label) => { const l = ((e && e.Location && e.Location.locations) || []).find((x) => x.label === label); return l ? l.id : 0; };
  const lotOf = (e) => Math.floor(locOf(e, 4) / 4294967296);
  const rockAst = () => { const b = onRock().find((x) => locOf(x, 3)); return b ? locOf(b, 3) : 0; };
  function lotPos(n, i) { const y = 1 - ((i - 1) / (n - 1)) * 2, rr = Math.sqrt(Math.max(0, 1 - y * y)), th = GA * (i - 1); return [rr * Math.cos(th), y, rr * Math.sin(th)]; }
  function kmBetween(a, b, ast0) {
    const ast = ast0 || rockAst(); if (!ast || !a || !b) return null; if (a === b) return 0;
    const r = 375.142 / Math.pow(ast, 0.475), n = Math.floor(4 * Math.PI * r * r);
    if (a > n || b > n) return null;
    const A = lotPos(n, a), B = lotPos(n, b), d = Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2]));
    return r * Math.acos(d);
  }
  // real seconds for a trip of k km with a crew's bonuses (c = crew from crews(), or none = no bonuses)
  function tripSecs(k, c) {
    if (k == null) return null;
    const tb = (c && c.speed) || 1, db = (c && c.free) || 1;
    if (k / tb <= 5 * db) return 0;
    return Math.ceil(Math.ceil(k / (tb * 2.5 / 3600)) / 24);
  }
  const tripTxt = (sec) => sec == null ? '' : sec === 0 ? 'instant' : sec < 3600 ? '~' + Math.max(1, Math.round(sec / 60)) + ' min' : '~' + Math.floor(sec / 3600) + 'h ' + Math.round((sec % 3600) / 60) + 'm';
  const kmTxt = (k) => k == null ? '' : (k < 10 ? k.toFixed(1) : Math.round(k)) + ' km';
  const lotKm = (e1, e2) => kmBetween(lotOf(e1), lotOf(e2));
  const crewLot = (c) => { const r = ((D() && D().crewsRaw) || []).find((x) => x.id === c.id); return r ? lotOf(r) : 0; };

  function crews(rock) {
    const d = D(), y = Y(), cm = (d && d.crewmates) || {};
    return ((d && d.crewList) || []).filter((c) => c.ast === (rock || S.rock) && (c.roster || []).length && !/in flight|in orbit/i.test(c.place || '')).map((c) => {
      const ms = c.roster.map((id) => cm[id]).filter(Boolean);
      let free = 1, speed = 1;
      try { free = y.crewMult(11, ms); speed = y.crewMult(3, ms) * (y.CBNF && y.CBNF[3] ? 1 : y.habEff(c)); } catch (e) {}
      const food = typeof c.food === 'number' ? Math.max(0, Math.min(1, c.food)) : 1;
      const fm = Math.min(1, Math.max(0.25, food / 0.5)); // SDK Crew.getFoodMultiplier, normal rations
      return { id: c.id, name: c.name, busy: c.busy || '', free: free * fm, speed: speed * fm, rawFree: free, rawSpeed: speed, food, fm, mates: c.roster.length, lot: crewLot(c) };
    }).sort((a, b) => (!!a.busy - !!b.busy) || (b.free - a.free) || (b.rawSpeed - a.rawSpeed));
  }
  // CREW QUEUE (go-live item 4, Mark 8 Nov): a crew can stack jobs while its queue reaches no more than 24 h ahead
  // (SDK Crew.CREW_SCHEDULE_BUFFER = 86,400 s). Starting a process takes crew time = process time ÷ 8 (SDK
  // Time.getCrewLaborDuration) plus the trip to the building. Counted without bonuses – a safe over-estimate.
  const crewReady = (c) => { const r = ((D() && D().crewsRaw) || []).find((x) => x.id === (c && c.id)); return (r && r.Crew && r.Crew.readyAt) || 0; };
  const procSecs = (name, runs) => { const t = PT[name]; return t ? Math.ceil((t[0] + runs * t[1]) / 24) : 0; };
  const laborSecs = (name, runs) => Math.ceil(procSecs(name, runs) / 8);
  // MAX PROCESS TIME (Mark, 13 Nov – Natural Flavorings failed with 'E6049: max process time'): the game refuses a start
  // whose processing time is over SDK Process.MAX_PROCESS_TIME (63,072,000 in-game s). Counted without crew bonuses, so
  // the cap is on the safe side. Bigger jobs start this many runs now and the rest when it finishes.
  const MAXPT = 63072000;
  const maxRuns = (name) => { const t = PT[name]; return t && t[1] > 0 ? Math.floor(MAXPT / t[1]) : Infinity; };
  const capRuns = (c) => { const mx = maxRuns(c.r.name); if (mx < 1) return false; if (c.runs > mx) { c.capTxt = 'game limit: ' + mx.toLocaleString('en-GB') + ' of ' + Math.ceil(c.runs).toLocaleString('en-GB') + ' runs now – start the rest when it finishes'; c.runs = mx; } return true; };
  // the best building of a type on the rock: free first, then nearest to a ready crew
  function pickBld(bt) {
    const cl = crews(), rd = cl.filter((c) => !c.busy), use = rd.length ? rd : cl;
    const ck = (b) => { const ks = use.map((c) => kmBetween(c.lot, lotOf(b))).filter((k) => k != null); return ks.length ? Math.min(...ks) : 1e9; };
    return onRock().filter((b) => b.Building.buildingType === bt).sort((a, b) => (!freeSlot(a) - !freeSlot(b)) || (ck(a) - ck(b)))[0] || null;
  }
  const astId = (name) => ((Y().asts || []).find((a) => a.name === name) || {}).id;

  // Can the picked rock mine or make it itself? (Mark, 8 Nov – checked before suggesting a fly-in)
  // Mine: a raw (id <= 22) the rock has (same test as vendor/sources.js). Make: a recipe for it whose building is on
  // the rock – and its own inputs checked one step back: in storage on the rock, or mineable here (Mark, 8 Nov).
  const GLk = (path, t) => (window.GL ? window.GL(path, t) : '');
  function canMine(p) {
    if (p > 22) return false;
    const y = Y(), d = D() || {}, a = (d.owned || []).find((x) => x.id === astId(S.rock)), c = (a && a.Celestial) || {};
    try { return (c.scanStatus || 0) >= 4 && c.abundances && y.astAbund ? (y.astAbund(c.abundances)[p] || 0) > 0 : !!((y.SPEC || {})[c.celestialType] && y.SPEC[c.celestialType][1].includes(p)); } catch (e) { return false; }
  }
  const rockStock = (p) => onRock().filter(isStore).reduce((t, b) => t + holds(b, p), 0);
  function hereTxt(p, q) {
    const on = onRock();
    if (canMine(p)) {
      const ex = on.find((b) => b.Building.buildingType === 2);
      return ex ? '⛏ mine it here' + GLk('/building/' + ex.id, 'Open an extractor in the game') : '⛏ can be mined here (no extractor yet)';
    }
    const types = new Set(on.map((b) => b.Building.buildingType));
    const opts = R.filter((x) => x.out[p] && !/Unbundling/.test(x.name) && types.has(FBT[x.type])).map((r) => {
      const runs = Math.ceil(q / r.out[p]), miss = [], mine = [];
      Object.keys(r.inp).forEach((ip) => {
        ip = +ip; const need = r.inp[ip] * runs, have = rockStock(ip);
        if (have >= need) return;
        if (canMine(ip)) mine.push(pname(ip)); else miss.push(pname(ip) + ' ' + amt(ip, need - have));
      });
      return { r, miss, mine };
    }).sort((x, z) => x.miss.length - z.miss.length || x.mine.length - z.mine.length);
    const o = opts[0];
    if (!o) return '';
    const bt = FBT[o.r.type], bl = on.filter((b) => b.Building.buildingType === bt).sort((x, z) => (busyTxt(x) !== 'idle') - (busyTxt(z) !== 'idle'))[0];
    let t = '🏭 make it here – ' + esc(o.r.name) + ' (' + BTN[bt].toLowerCase() + ')' + (bl ? GLk('/building/' + bl.id, 'Open ' + nm(bl) + ' in the game') : '');
    if (!o.miss.length && !o.mine.length) t += '<br><span class="ok">✓ its inputs are on this rock</span>';
    else {
      if (o.mine.length) t += '<br><span style="color:var(--amber)">mine first: ' + o.mine.map(esc).join(', ') + '</span>';
      if (o.miss.length) t += '<br><span style="color:var(--red)">✗ short of: ' + o.miss.map(esc).join(', ') + '</span>';
    }
    return { txt: t, ok: !o.miss.length };
  }

  // Full production plan on the rock (Mark, 8 Nov): every short input is broken down into the processes
  // needed to make it here, all the way back – using stock on the rock first, mining what the rock has,
  // and listing only what's left to fly in. Steps come out in the order to do them (deepest first).
  function chainPlan(P) {
    const on = onRock(), types = new Set(on.map((b) => b.Building.buildingType));
    const pool = {};
    on.filter(isStore).forEach((b) => { ((inv(b) || { contents: [] }).contents).forEach((c) => { if (c.amount > 0) pool[c.product] = (pool[c.product] || 0) + c.amount; }); ((S.inc && S.inc[b.id]) || []).forEach((x) => { pool[x[0]] = (pool[x[0]] || 0) + x[1]; }); });
    P.rows.forEach((r) => { pool[r.p] = Math.max(0, (pool[r.p] || 0) - Math.min(r.need, r.there + r.moved)); });
    const steps = [], key = {}, fly = {}, mine = {}, made = {}, byUsed = {}; // made = by-products / surplus of earlier steps (Mark, 8 Nov)
    const recipes = (p) => R.filter((x) => x.out[p] && !/Unbundling/.test(x.name) && types.has(FBT[x.type]));
    function need(p, q, path, depth, to) {
      if (q <= 0) return;
      // BY-PRODUCTS (go-live item 3): use what an earlier step already makes on the side before making or mining more
      if (made[p] > 0) { const u = Math.min(made[p], q); made[p] -= u; q -= u; byUsed[p] = (byUsed[p] || 0) + u; if (q <= 0) return; }
      if (canMine(p)) { (mine[p] = mine[p] || { q: 0, to: new Set() }).q += q; mine[p].to.add(to); return; }
      const rs = recipes(p).filter((r) => !Object.keys(r.inp).some((ip) => path.includes(+ip)));
      if (!rs.length || depth > 8) { fly[p] = (fly[p] || 0) + q; return; }
      // best recipe: p must be a main output (not a small by-product), then fewest inputs that can't be had here,
      // then the least input weight per tonne made
      const share = (r) => { const tot = Object.keys(r.out).reduce((t, o) => t + r.out[o] * grams(+o), 0); return tot ? r.out[p] * grams(p) / tot : 0; };
      const main = rs.filter((r) => share(r) >= 0.25);
      const miss = (r) => Object.keys(r.inp).filter((ip) => !(pool[ip] > 0) && !canMine(+ip) && !recipes(+ip).length).length;
      const cost = (r) => Object.keys(r.inp).reduce((t, ip) => t + r.inp[ip] * grams(+ip), 0) / (r.out[p] * grams(p));
      const r = (main.length ? main : rs).sort((a, b) => miss(a) - miss(b) || cost(a) - cost(b))[0];
      const runs = Math.ceil(q / r.out[p]);
      let st = key[r.i], fresh = false;
      if (!st) { st = key[r.i] = { r, p, runs: 0, use: {}, to: new Set() }; fresh = true; }
      st.runs += runs; st.to.add(to);
      Object.keys(r.inp).forEach((ip) => {
        ip = +ip; const n = r.inp[ip] * runs, take = Math.min(pool[ip] || 0, n);
        pool[ip] = (pool[ip] || 0) - take;
        if (take > 0) st.use[ip] = (st.use[ip] || 0) + take;
        need(ip, n - take, path.concat(p), depth + 1, r.i);
      });
      // the other outputs (and any surplus of p) become available to later needs. Secondary outputs counted at 62.5%
      // (SDK getOutputs: 1 − 0.375 ÷ secondary bonus, bonus 1) – a safe under-estimate.
      Object.keys(r.out).forEach((o) => { const amt2 = +o === p ? r.out[o] * runs - q : Math.floor(r.out[o] * runs * 0.625); if (amt2 > 0) made[o] = (made[o] || 0) + amt2; });
      if (fresh) steps.push(st);
    }
    P.fly.forEach((f) => need(f.p, f.q, [], 0, 'final'));
    return { steps, fly, mine, byUsed };
  }

  // Move everything for the WHOLE chain (Mark, 8 Nov): each step gets its own storage (★ = holds most of that
  // step's stock inputs; the player can change it), stock is shared out once across all steps, and every
  // delivery goes in one list. Things made or mined along the way can't be moved yet – each step says where
  // to send its output so it lands where the next step needs it.
  function chainMoves(P, C) {
    const store = onRock().filter(isStore), byId = (id) => store.find((b) => b.id === id);
    const avail = {}; store.forEach((b) => { avail[b.id] = {}; ((inv(b) || { contents: [] }).contents).forEach((c) => { if (c.amount > 0) avail[b.id][c.product] = (avail[b.id][c.product] || 0) + c.amount; }); });
    // the final step's stock is already spoken for
    P.rows.forEach((r) => { const a = avail[P.dest.id]; if (a) a[r.p] = Math.max(0, (a[r.p] || 0) - Math.max(0, Math.min(r.there, r.need) - r.onway)); r.from.forEach(([b, q]) => { avail[b.id][r.p] -= q; }); });
    const okIn = (b, ip) => b.Building.buildingType !== TANK || TANKOK.has(ip);
    const TANKFIX = true; // LIVE 9 Nov 2026
    const dests = {}, add = {}, dl = {}, incA = {};
    const put = (from, to, ip, q, why) => { const k = from.id + '>' + to.id; (dl[k] = dl[k] || { b: from, to, items: [], why: new Set() }).items.push({ p: ip, a: q }); dl[k].why.add(why);
      add[to.id] = add[to.id] || [0, 0]; add[to.id][0] += q * grams(ip); add[to.id][1] += q * (MV[ip] || [1000, 1000])[1]; };
    C.steps.forEach((st) => {
      // this step's building: free first, then nearest to a ready crew (distance, Mark 8 Nov)
      st.bld = pickBld(FBT[st.r.type]);
      // best storage for this step: an instant trip to its building first, then holds the most of its stock inputs
      const mv = S.moverObj;
      const takesAll = (b) => Object.keys(st.use).every((ip) => okIn(b, +ip));
      const cand = store.map((b) => ({ b, kg: Object.keys(st.use).reduce((t, ip) => okIn(b, +ip) ? t + Math.min(avail[b.id][ip] || 0, st.use[ip]) * grams(+ip) : t, 0), t: st.bld ? (tripSecs(lotKm(b, st.bld), mv) ?? 0) : 0, k: st.bld ? (lotKm(b, st.bld) ?? 0) : 0 }))
        .filter((x) => x.kg > 0 && (!TANKFIX || takesAll(x.b))).sort((x, y) => (x.t > 0) - (y.t > 0) || y.kg - x.kg || x.k - y.k);
      // Mark (9 Nov): a tank farm was picked for Boric Acid although it can't take Hydrochloric Acid – only storage
      // that can take ALL of the step's inputs is picked; if none holds any, the nearest one that can (LIVE 9 Nov 2026)
      const fit = TANKFIX && !cand[0] ? store.filter(takesAll).sort((x, y) => (st.bld ? (lotKm(x, st.bld) ?? 1e9) - (lotKm(y, st.bld) ?? 1e9) : 0))[0] : null;
      st.star = cand[0] ? cand[0].b.id : fit ? fit.id : P.dest.id;
      const d = byId((S.stepDest || {})[st.r.i]) || byId(st.star);
      st.dest = d;
      Object.keys(st.use).forEach((ip) => {
        ip = +ip; let left = st.use[ip];
        if (!okIn(d, ip)) { st.bad = "a tank farm can't take " + pname(ip); return; }
        incA[d.id] = incA[d.id] || {}; if (incA[d.id][ip] == null) incA[d.id][ip] = incoming(d, ip);
        const oi = Math.min(incA[d.id][ip], left); incA[d.id][ip] -= oi; left -= oi;
        const own = Math.min(avail[d.id][ip] || 0, left); avail[d.id][ip] = (avail[d.id][ip] || 0) - own; left -= own;
        st.here = st.here || {}; st.here[ip] = (st.here[ip] || 0) + own;
        store.filter((b) => b.id !== d.id && (avail[b.id][ip] || 0) > 0).sort((a, b) => ((lotKm(a, d) ?? 1e9) - (lotKm(b, d) ?? 1e9)) || (avail[b.id][ip] || 0) - (avail[a.id][ip] || 0)).forEach((b) => {
          if (left <= 0) return; const q = Math.min(avail[b.id][ip] || 0, left); if (q <= 0) return;
          avail[b.id][ip] -= q; left -= q; put(b, d, ip, q, st.r.name);
        });
      });
    });
    // where each step's output (and each mined raw) should be sent
    const keyed = {}; C.steps.forEach((st) => { keyed[st.r.i] = st; });
    const sendTo = (set) => [...set].map((t) => (t === 'final' ? P.dest : (keyed[t] && keyed[t].dest))).filter(Boolean).filter((b, i, a) => a.indexOf(b) === i);
    C.steps.forEach((st) => { st.sendTo = sendTo(st.to); });
    Object.keys(C.mine).forEach((p) => { C.mine[p].sendTo = sendTo(C.mine[p].to); });
    return { deliveries: Object.values(dl), add, byId };
  }

  // ---------- the plan ----------
  function plan() {
    const store = onRock().filter(isStore);
    const dest = store.find((b) => b.id === S.dest);
    const bl = procB().find((b) => b.id === S.bld);
    const rec = R && R[S.proc];
    if (!dest || !bl || !rec) return null;
    const tankDest = dest.Building.buildingType === TANK;
    const di = inv(dest) || { contents: [], mass: 0, volume: 0 };
    const have = (b, p) => ((inv(b) || { contents: [] }).contents.filter((c) => c.product === +p).reduce((s, c) => s + c.amount, 0));
    const rows = [], fly = [], moves = {};
    let addG = 0, addV = 0;
    Object.keys(rec.inp).forEach((p) => {
      p = +p;
      const onway = incoming(dest, p), need = rec.inp[p] * S.runs, there = have(dest, p) + onway, want = Math.max(0, need - there);
      const row = { p, need, there, onway, moved: 0, from: [], short: 0, bad: '' };
      if (want > 0 && tankDest && !TANKOK.has(p)) { row.bad = "can't go in a tank farm"; row.short = want; rows.push(row); return; }
      let left = want;
      store.filter((b) => b.id !== dest.id).map((b) => [b, have(b, p), lotKm(b, dest) ?? 1e9]).filter((x) => x[1] > 0).sort((a, b) => a[2] - b[2] || b[1] - a[1]).forEach(([b, h]) => {
        if (left <= 0) return;
        const q = Math.min(left, h); left -= q; row.from.push([b, q]);
        (moves[b.id] = moves[b.id] || { b, items: [] }).items.push({ p, a: q });
        addG += q * grams(p); addV += q * (MV[p] || [1000, 1000])[1];
      });
      row.moved = want - left; row.short = left;
      if (left > 0) fly.push({ p, q: left, here: hereTxt(p, left), where: (window.YICSRCTXT && window.YICSRCTXT(p, left, astId(S.rock))) || '' });
      rows.push(row);
    });
    const cap = CAP[dest.Building.buildingType];
    const nowG = di.mass + (di.reservedMass || 0), nowV = di.volume + (di.reservedVolume || 0);
    const pctNow = Math.max(nowG / cap[0], nowV / cap[1]) * 100, pctAfter = Math.max((nowG + addG) / cap[0], (nowV + addV) / cap[1]) * 100;
    return { dest, bl, rec, rows, fly, moves: Object.values(moves), pctNow, pctAfter };
  }

  // Deliveries already on their way (Mark, 8 Nov: the page re-suggested moves he had just sent). From the site's
  // deliveries.php (sent = status 2, in transit or ready but not yet finished). Goods heading INTO a building count
  // as already there for that building – but are never moved on from it until they've arrived.
  const incoming = (b, p) => ((S.inc && S.inc[b.id]) || []).filter((x) => x[0] === p).reduce((t, x) => t + x[1], 0);
  const holds = (b, p) => ((inv(b) || { contents: [] }).contents.filter((c) => c.product === p).reduce((t, c) => t + c.amount, 0)) + incoming(b, p);
  async function loadDeliveries() {
    const d = D(); if (!d || !d.wallet) return;
    try {
      const j = await fetch('deliveries.php?wallet=' + encodeURIComponent(d.wallet) + '&t=' + Date.now(), { cache: 'no-store' }).then((r) => r.json());
      const inc = {}, list = [];
      // Mark (9 Nov): every row said "ready" though only a couple needed finishing – the list was taking the 7-day
      // list of FINISHED deliveries (status 2 = complete). Not finished yet = status 4 (sent: on its way, or ready
      // to finish) plus anything still arriving. Finished ones are already in the storage, so no longer counted twice. (LIVE 9 Nov 2026, tested on ?beta=1 – Mark)
      const NEWDEL = true;
      const src = NEWDEL ? (j.pending || []).filter((r) => r[1] === 4).concat(j.transit || []) : (j.transit || []).concat(j.recent || []);
      src.forEach((r) => { if ((NEWDEL ? ![2, 4].includes(r[1]) : r[1] !== 2) || r[4][0] !== 5) return; (inc[r[4][1]] = inc[r[4][1]] || []).push(...r[5]); list.push(r); });
      S.inc = inc; S.incList = list; S.incErr = j.err || null;
    } catch (e) { S.incErr = 'Deliveries on their way could not be loaded.'; }
  }
  // how full a storage building is (the bigger of weight and space, reserved space included)
  const fullPct = (b) => { const i = inv(b) || { mass: 0, volume: 0 }, c = CAP[b.Building.buildingType]; return Math.round(Math.max((i.mass + (i.reservedMass || 0)) / c[0], (i.volume + (i.reservedVolume || 0)) / c[1]) * 100); };

  // process list two ways (Mark, 8 Nov): by what it makes ("Neodymium Magnet – Magnet Sintering and Magnetization")
  // or by the game's process name ("Magnet Sintering and Magnetization → Neodymium Magnet")
  const outsOf = (r) => Object.keys(r.out).map((p) => pname(p));
  function procList(procs) {
    if (S.by === 'proc') return procs.slice().sort((a, b) => a.name.localeCompare(b.name)).map((r) => [r.i, r.name + ' → ' + outsOf(r).join(', ') + ' (' + BTN[FBT[r.type]].toLowerCase() + ')']);
    const rows = [];
    procs.forEach((r) => outsOf(r).forEach((o) => rows.push([r.i, o, r.name + ' (' + BTN[FBT[r.type]].toLowerCase() + ')'])));
    const many = {}; rows.forEach((x) => { many[x[1]] = (many[x[1]] || 0) + 1; });
    return rows.sort((a, b) => a[1].localeCompare(b[1]) || a[2].localeCompare(b[2])).map((x) => [x[0], x[1] + ' – ' + x[2]]);
  }

  // ---------- saved plans (Mark, 8 Nov) ----------
  // Long chains take many visits, so each plan is saved in THIS browser (localStorage, may be missing – try/catch).
  // Coming back through the airlock shows "Continue: <product> on <rock>"; the page always works from the game's
  // current data, so it shows what's finished and what's ready to start now.
  const PKEY = 'sk_dock_plans';
  const plansGet = () => { try { const a = JSON.parse(localStorage.getItem(PKEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  const plansPut = (a) => { try { localStorage.setItem(PKEY, JSON.stringify(a.slice(0, 8))); } catch (e) {} };
  function planSave() {
    if (!(S.proc >= 0) || !S.rock || !R || !R[S.proc]) return;
    const k = S.rock + '|' + S.proc, a = plansGet().filter((x) => x.k !== k);
    a.unshift({ k, rock: S.rock, proc: S.proc, what: Object.keys(R[S.proc].out).map((q) => pname(q)).join(' + '), runs: S.runs, dest: S.dest, destSet: !!S.destSet, stepDest: S.stepDest || {}, by: S.by, start: !!S.start, when: Date.now() });
    plansPut(a);
  }
  function planLoad(k) {
    const x = plansGet().find((y) => y.k === k); if (!x) return;
    Object.assign(S, { rock: x.rock, proc: x.proc, runs: x.runs || 1, dest: x.dest, destSet: x.destSet, stepDest: x.stepDest || {}, by: x.by || 'out', start: !!x.start, bld: 0, crew: 0, feed: false, q: '' });
  }
  function planBar() {
    const a = plansGet(); if (!a.length) return '';
    const cur = S.rock + '|' + S.proc;
    const when = (t) => new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    return `<div class="card dkp-saved"><h2><span class="n">↺</span>Your saved plans</h2><div class="hint" style="margin:0 0 8px">Saved in this browser. Pick one to carry on – it's checked against the game as it is now.</div><div class="dkp-sv">` +
      a.map((x) => `<div class="dkp-svi${x.k === cur ? ' on' : ''}"><a href="#" data-plan="${esc(x.k)}"><b>${esc(x.what)}</b> on ${esc(x.rock)}<span>× ${(+x.runs).toLocaleString('en-GB')} runs · saved ${when(x.when)}</span></a><button data-unplan="${esc(x.k)}" title="Forget this plan">✕</button></div>`).join('') +
      `</div><button id="dk-recheck" class="dkp-rc">↻ Check the game again</button></div>`;
  }

  // ---------- sending (deliveries + feeding only; same path as vendor/tidy.js) ----------
  // Calls checked against @influenceth/sdk 2.8.1 System.getRunSystemCall (as tidy.js, used for real on 6 Nov):
  //   run_system('SendDelivery', [5, fromId, 2, n, (product, amount)×n, 5, toId, 2, 1, crewId])
  //   run_system('ResupplyFood', [5, buildingId, 2, food, 1, crewId])
  const DISPATCHER = '0x0422d33a3638dcc4c62e72e1d6942cd31eb643ef596ccac2351e0e21f6cd4bf4';
  const OWNER = '0x0631acdbf5a79758cbcc84301b387aebfb5c0ec7476aa48a0ceb98662973c5ce'; // Mark's wallet – test only
  const hex = (n) => '0x' + BigInt(n).toString(16);
  const short = (t) => '0x' + [...t].map((ch) => ch.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  const sameAddr = (a, b) => { try { return BigInt(a) === BigInt(b); } catch (e) { return false; } };
  const isOwner = () => !!(D() && D().wallet); // LIVE: any player, for the wallet the page shows (approve() checks the connected wallet matches)
  function wallets() {
    const seen = {}, out = [];
    let keys = ['starknet', 'starknet_argentX', 'starknet_ready', 'starknet_braavos', 'starknet_okxwallet', 'starknet_keplr'];
    try { keys = keys.concat(Object.getOwnPropertyNames(window)); } catch (e) {}
    keys.forEach((k) => {
      if (!/^starknet/.test(k)) return;
      let w; try { w = window[k]; } catch (e) { return; }
      if (!w || typeof w !== 'object' || !w.id || !w.name || seen[w.id]) return;
      if (typeof w.request !== 'function' && typeof w.enable !== 'function') return;
      seen[w.id] = 1; out.push(w);
    });
    return out;
  }
  async function account(w) {
    let a = null;
    if (typeof w.request === 'function') { try { const r = await w.request({ type: 'wallet_requestAccounts' }); if (Array.isArray(r) && r[0]) a = r[0]; } catch (e) { if (typeof w.enable !== 'function') throw e; } }
    if (!a && typeof w.enable === 'function') { const r = await w.enable(); if (Array.isArray(r) && r[0]) a = r[0]; }
    if (!a && w.selectedAddress) a = w.selectedAddress;
    return a;
  }
  // in-game link to a building – through the Game Links extension when it's there, otherwise a plain link
  const bLink = (id, t) => (window.GL && window.GL.on() ? window.GL('/building/' + id, t) : ' <a href="https://game.influenceth.io/building/' + id + '" target="influencegame" rel="noopener" style="color:var(--cyan)" title="' + t + '">in game ↗</a>');
  const crewLink = (c, esc) => c ? ' Finish them with <b>' + esc(c.name) + '</b>' + (window.GL && window.GL.on() ? window.GL('/crew/' + c.id, 'Open this crew in the game') : ' <a href="https://game.influenceth.io/crew/' + c.id + '" target="influencegame" rel="noopener" style="color:var(--cyan)" title="Open this crew in the game">in game ↗</a>') + '.' : '';
  const say = (html, err) => { S.msg = html; S.msgErr = !!err; const e = document.getElementById('dk-msg'); if (e) { e.style.display = 'block'; e.innerHTML = html; e.style.color = err ? '#ffb3ae' : 'var(--ink)'; e.style.borderColor = err ? '#ff4d4d88' : '#8fe3ff55'; } };
  // ProcessProductsStart (@influenceth/sdk 2.8.1, checked with System.getRunSystemCall 8 Nov):
  //   [processor(5,id), processor_slot, process, target_output, recipes (Fixed: mag = n·2^32, sign 0),
  //    origin(5,id), origin_slot, destination(5,id), destination_slot, caller_crew(1,id)]  → 15 values
  function startCall(c) {
    const mag = BigInt(Math.round(c.runs)) * 4294967296n;
    const data = [5, c.b.id, c.slot || 1, PID[c.r.name], c.p, mag, 0, 5, c.from.id, SLOT, 5, c.to.id, SLOT, 1, c.crew || S.mover]; // c.crew: Production's process crew (Mark, 9 Nov – LIVE 9 Nov)
    return { contract_address: DISPATCHER, entry_point: 'run_system', calldata: [short('ProcessProductsStart'), hex(data.length), ...data.map(hex)] };
  }
  // APPROVAL SIZE (go-live item 1, Mark 8 Nov): one failing action cancels the whole approval, so actions go in
  // batches (15 / 30 / 50 / All, like storage tidy) and are checked against the game data just before sending.
  const BATCHES = [15, 30, 50, 'All'];
  function checks(calls) {
    const errs = [], d = D(), now = Date.now();
    if (!S.dataAt || now - S.dataAt > 10 * 60000) errs.push('The game data is over 10 minutes old – press ↻ Check the game again first.');
    const c = S.moverObj;
    if (!c) errs.push('No crew picked.'); else if (crewReady(c) - now / 1000 > 86400) errs.push(c.name + ' already has more than 24 hours of jobs queued.');
    const byId = (id) => onRock().find((b) => b.id === id);
    const left = {};
    (S.batchDel || []).forEach((x) => {
      const f = (S.srcRock ? allB().find((b) => b.id === x.from) : byId(x.from)), t = x.ship ? { Building: { buildingType: 0 } } : byId(x.to);
      if (!f || !t) { errs.push('A building in the moves is no longer on ' + (S.srcRock || S.rock) + '.'); return; }
      if (x.from === x.to) errs.push('A move goes from ' + nm(f) + ' to itself.');
      x.items.forEach(([p, a]) => {
        const k = x.from + ':' + p; if (left[k] == null) left[k] = (inv(f) || { contents: [] }).contents.filter((q) => q.product === p).reduce((s2, q) => s2 + q.amount, 0);
        left[k] -= a; if (left[k] < 0) errs.push(nm(f) + ' no longer holds enough ' + pname(p) + '.');
        if (t.Building.buildingType === TANK && !TANKOK.has(p)) errs.push(nm(t) + ' is a tank farm and can’t take ' + pname(p) + '.');
      });
    });
    (S.batchStart || []).forEach((x) => { if (!freeSlot(x.b)) errs.push(nm(x.b) + ' is no longer free.'); });
    return [...new Set(errs)];
  }
  function buildCalls() {
    const calls = [], n = S.bs === 'All' ? Infinity : (S.bs || 30);
    // S.feedCalls: Production can feed both its crews (Mark, 9 Nov – LIVE 9 Nov); otherwise the one S.feedCall
    (S.feedCalls || (S.feed && S.feedCall ? [S.feedCall] : [])).forEach((f) => calls.push({ contract_address: DISPATCHER, entry_point: 'run_system', calldata: [short('ResupplyFood'), '0x6', '0x5', hex(f.src), hex(SLOT), hex(f.give), '0x1', hex(f.crew)] }));
    S.batchDel = []; S.batchStart = [];
    S.calls.forEach((x) => {
      if (calls.length >= n) return;
      // x.ship: into a ship's cargo hold (Cargo bay, Mark 9 Nov – LIVE 9 Nov): [6, shipId, cargo slot] (SDK 2.8.1, as shipload.js)
      const data = [5, x.from, SLOT, x.items.length, ...x.items.flat(), ...(x.ship ? [6, x.to, x.slot || 2] : [5, x.to, SLOT]), 1, S.mover];
      calls.push({ contract_address: DISPATCHER, entry_point: 'run_system', calldata: [short('SendDelivery'), hex(data.length), ...data.map(hex)] });
      S.batchDel.push(x);
    });
    (S.startList || []).forEach((c) => { if (calls.length >= n || !PID[c.r.name]) return; calls.push(startCall(c)); S.batchStart.push(c); });
    return calls;
  }
  async function approve() {
    if (!isOwner()) return;
    const list = wallets();
    if (!list.length) return say('No Starknet wallet found in this browser. Open this page in the browser that has your wallet.', true);
    const w = list[0];
    S.busy = true; S.msg = ''; render();
    try {
      const a = await account(w);
      if (!a) throw new Error('The wallet did not share an address.');
      if (!sameAddr(a, D().wallet)) throw new Error('That wallet (' + esc(a) + ') is not the one this page is showing. Switch account in your wallet and try again.');
      const calls = buildCalls();
      if (!calls.length) throw new Error('Nothing to send.');
      // SAME ACTIONS TWICE (Mark, 13 Nov – a ship was loaded twice: after Approve the screen stayed the same because the game
      // data hadn't caught up, so he pressed it again). The exact same actions can't be sent again for 15 minutes. TEST ONLY ?beta=1
      const sameKey = JSON.stringify(calls);
      if (/[?&]beta=1\b/.test(location.search) && S.lastSent && S.lastSent.key === sameKey && Date.now() - S.lastSent.at < 15 * 60000)
        throw new Error('Checked just before sending – nothing was sent:<br>• These exact actions were sent ' + Math.max(1, Math.round((Date.now() - S.lastSent.at) / 60000)) + ' min ago. The game data can take a few minutes to catch up – press ↻ Check the game again in a minute or two.');
      const errs = checks(calls);
      if (errs.length) throw new Error('Checked just before sending – nothing was sent:<br>• ' + errs.map(esc).join('<br>• '));
      say('Waiting for your wallet… check the wallet window and approve (or reject) it there.');
      let res;
      if (typeof w.request === 'function') res = await w.request({ type: 'wallet_addInvokeTransaction', params: { calls } });
      else if (w.account && typeof w.account.execute === 'function') res = await w.account.execute(calls.map((c) => ({ contractAddress: c.contract_address, entrypoint: c.entry_point, calldata: c.calldata })));
      else throw new Error('This wallet cannot send transactions from a web page.');
      const h = res && (res.transaction_hash || res.transactionHash);
      S.lastSent = { key: sameKey, at: Date.now() };
      S.sentAt = Date.now(); S.busy = false; render(); setTimeout(() => { loadDeliveries().then(render); }, 150000);
      say('✓ Sent to the game. ' + (h ? `Transaction <a href="https://voyager.online/tx/${esc(h)}" target="_blank" rel="noopener noreferrer" style="color:var(--cyan)">${esc(String(h).slice(0, 10))}…</a>. ` : '') + 'Finish the deliveries in the game with Finish All Ready Items, then press ↻ Check the game again.' +
        // which crew to finish with, with an in-game link (Mark, 9 Nov: hard to find the crew afterwards) – TEST ONLY
        crewLink(S.moverObj, esc));
    } catch (e) {
      const t = String((e && e.message) || e || '');
      S.busy = false; render();
      say(/reject|cancel|abort|denied|User/i.test(t) && !/Checked just before/.test(t) ? 'Cancelled in the wallet – nothing was changed.' : 'Not sent: ' + (/^Checked just before/.test(t) ? t : esc(t)), true);
    }
  }

  // ---------- page ----------
  const opt = (v, t, cur) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(t)}</option>`;
  // Mode buttons at the top. 🍽 Feed crews (Mark, 9 Nov – LIVE 9 Nov, vendor/crewfeed.js) – game actions stay in the hub
  function modeBar(mode) {
    const b = (k, t) => `<button class="dk-shipbtn${mode === k ? ' on' : ''}" data-mode="${k}">${t}</button>`;
    const hint = mode === 'ship' ? 'Pick the rock to make it on and what to make – then load a ship on one of your other rocks with what it needs.'
      : mode === 'feed' ? 'Feed your crews from the Food stored on their own rocks – untick any that don’t need it.'
        : 'Move stock around this rock and start the processes.';
    return `<div class="card"><div class="row" style="gap:8px">${b('make', '🏭 Make on this rock')}${b('ship', '🚀 Load a ship')}${window.YICFEED ? b('feed', '🍽 Feed crews') : ''}</div><div class="hint" style="margin:8px 0 0">${hint}</div></div>`;
  }
  function render() {
    let m = document.getElementById('dk-main');
    if (!m || !S.ok) return;
    if (!S.ready) { m.innerHTML = '<div class="card"><div class="src">Loading your command…</div></div>'; return; }
    // Logistics Bridge (Mark, 9 Nov – LIVE 9 Nov, vendor/hubbridge.js): consoles + viewscreen; the tool is drawn ON the viewscreen
    S.feedCalls = null; S.srcRock = null; // only Production / Cargo bay (prodplan.js) set these, each time they draw
    const LB = window.YICHUBBRIDGE;
    if (LB) { m = LB.screen(m, S, render); if (!m) return; }
    // new Production screen (Mark, 9 Nov – TEST ONLY, vendor/prodplan.js): rock → what to make + amount → what you need → processes
    // 🗄 Storage tidy (Mark, 10 Nov – moved into the hub; still TEST ONLY, vendor/tidy.js loads on ?beta=1 only)
    if (LB && S.mode === 'tidy' && window.YICTIDY) { window.YICTIDY.render(m); return; }
    if (LB && window.YICPROD && S.mode !== 'feed') { window.YICPROD.render(m, S.mode === 'ship' ? 'ship' : 'make'); return; } // Cargo bay uses it too (Mark, 9 Nov)
    if (S.mode === 'feed' && window.YICFEED) {
      m.innerHTML = (LB ? '' : modeBar('feed')) + '<div id="dk-feedpg"></div>';
      m.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { S.mode = b.dataset.mode; S.ship = null; render(); }));
      window.YICFEED.render(document.getElementById('dk-feedpg'));
      return;
    }
    const rl = rocks();
    if (!rl.length) { m.innerHTML = '<div class="card"><div class="src">No warehouses or tank farms found for this wallet. Load your wallet on the Command Deck first.</div></div>'; return; }
    if (!rl.includes(S.rock)) { S.rock = rl[0]; S.dest = 0; S.bld = 0; S.proc = -1; S.crew = 0; }
    const store = onRock().filter(isStore).sort((a, b) => nm(a).localeCompare(nm(b)));
    // Mark (8 Nov): pick WHAT to make first; the building list then fills with the buildings that can do it (idle first)
    const pb = procB();
    const procs = R.filter((r) => FBT[r.type]);
    if (!procs.find((r) => r.i === S.proc)) S.proc = -1;
    const sel0 = R[S.proc];
    // DISTANCE (Mark, 8 Nov): building = free first, then nearest to a ready crew; crew = ready first, then
    // quickest trip to the building; storage ★ = an instant trip to the building first, then holds the most.
    const cl0 = crews(), ready = cl0.filter((c) => !c.busy);
    const crewKm = (b) => { const ks = (ready.length ? ready : cl0).map((c) => kmBetween(c.lot, lotOf(b))).filter((k) => k != null); return ks.length ? Math.min(...ks) : 1e9; };
    const able = sel0 ? pb.filter((b) => b.Building.buildingType === FBT[sel0.type]).sort((a, b) => (!freeSlot(a) - !freeSlot(b)) || (crewKm(a) - crewKm(b))) : [];
    if (!able.find((b) => b.id === S.bld)) S.bld = able[0] ? able[0].id : 0;
    const bld0 = able.find((b) => b.id === S.bld);
    const cl = cl0.slice().sort((a, b) => (!!a.busy - !!b.busy) || ((bld0 ? tripSecs(kmBetween(a.lot, lotOf(bld0)), a) : 0) - (bld0 ? tripSecs(kmBetween(b.lot, lotOf(bld0)), b) : 0)) || (b.free - a.free));
    if (!cl.find((c) => c.id === S.crew)) S.crew = (cl.find((c) => !c.busy) || cl[0] || {}).id || 0;
    const mover = cl.find((c) => c.id === S.crew);
    S.moverObj = mover;
    const toBld = (b) => (bld0 ? tripSecs(lotKm(b, bld0), mover) : null);
    let best = null, bestKg = 0, needKg = 0;
    if (sel0) {
      Object.keys(sel0.inp).forEach((p) => { needKg += sel0.inp[p] * S.runs * grams(+p) / 1000; });
      const scored = store.map((b) => {
        const tank = b.Building.buildingType === TANK;
        const kg = Object.keys(sel0.inp).reduce((t, p) => (tank && !TANKOK.has(+p)) ? t : t + Math.min(holds(b, +p), sel0.inp[p] * S.runs) * grams(+p) / 1000, 0);
        const ok = !tank || Object.keys(sel0.inp).every((p) => TANKOK.has(+p));
        // room (Mark, 8 Nov: ★ went to a 95%-full warehouse): what still has to come in + the output (inputs leave first)
        const i = inv(b) || { mass: 0, volume: 0 }, cp = CAP[b.Building.buildingType];
        const inG = Object.keys(sel0.inp).reduce((t, p) => t + sel0.inp[p] * S.runs * grams(+p), 0), outG = Object.keys(sel0.out).reduce((t, o) => t + sel0.out[o] * S.runs * grams(+o), 0);
        // weight AND space – Skippys Oxides was only 9% full by weight but 95% full by space
        const vol = (o, n) => n * (MV[o] || [1000, 1000])[1];
        const inV = Object.keys(sel0.inp).reduce((t, p) => t + vol(+p, sel0.inp[p] * S.runs), 0), outV = Object.keys(sel0.out).reduce((t, o) => t + vol(+o, sel0.out[o] * S.runs), 0);
        const missV = Object.keys(sel0.inp).reduce((t, p) => t + vol(+p, Math.max(0, sel0.inp[p] * S.runs - holds(b, +p))), 0);
        const after = Math.max((i.mass + (i.reservedMass || 0) + (needKg - kg) * 1000 + Math.max(0, outG - inG)) / cp[0],
          (i.volume + (i.reservedVolume || 0) + missV + Math.max(0, outV - inV)) / cp[1]);
        return { b, kg, ok: ok && after <= 0.9 && fullPct(b) < 90, after, t: toBld(b) ?? 0, k: bld0 ? lotKm(b, bld0) ?? 0 : 0 };
      }).filter((x) => x.ok && x.kg > 0).sort((x, y) => (x.t > 0) - (y.t > 0) || y.kg - x.kg || x.k - y.k);
      if (scored[0]) { best = scored[0].b; bestKg = scored[0].kg; }
    }
    if (!S.destSet && best) S.dest = best.id;
    if (!store.find((b) => b.id === S.dest)) S.dest = store[0] ? store[0].id : 0;
    const P = plan();
    const rec = R[S.proc];
    let CM = null, PC = null;

    // Two modes at the top (Mark, 9 Nov – LIVE 9 Nov): make on this rock (as before) or load a ship on another rock for it
    const shipMode = SHIPS && S.mode === 'ship';
    let h = planBar();
    if (SHIPS && !LB) h += modeBar(shipMode ? 'ship' : 'make');
    h += `<div class="card"><h2><span class="n">1</span>${shipMode ? 'Rock to make it on' : 'Rock'}</h2><select id="dk-rock">${rl.map((r) => opt(r, r, S.rock)).join('')}</select></div>`;
    h += `<div class="card"><h2><span class="n">2</span>What to make</h2><div class="row">
<select id="dk-by">${opt('out', 'Pick by what it makes', S.by)}${opt('proc', 'Pick by process name', S.by)}</select>
<input type="search" id="dk-q" placeholder="🔍 Search…" value="${esc(S.q || '')}" style="min-width:200px">
<select id="dk-proc">${opt(-1, S.by === 'out' ? '— pick what to make —' : '— pick a process —', S.proc)}${procList(procs).map(([i, t]) => opt(i, t, S.proc)).join('')}</select></div>`;
    if (sel0) {
      const bt = FBT[sel0.type];
      h += able.length ? `<div class="row" style="margin-top:10px"><span class="src">Made in:</span><select id="dk-bld">${able.map((b) => opt(b.id, nm(b) + ' – ' + BTN[bt].toLowerCase() + ' (' + busyTxt(b) + ')' + (crewKm(b) < 1e9 ? ' · ' + kmTxt(crewKm(b)) + ' from your nearest ready crew' : ''), S.bld)).join('')}</select>${GLk('/building/' + S.bld, 'Open this building in the game')}</div>`
        : `<div class="hint" style="color:var(--red)">✗ This is made in a ${BTN[bt].toLowerCase()}${sel0.type === 5 ? ' (dry dock)' : ''} – you don't have one on ${esc(S.rock)}.</div>`;
    }
    h += '</div>';
    if (sel0 && !shipMode) {
      h += `<div class="card"><h2><span class="n">3</span>Stage into</h2><div class="row"><select id="dk-dest">${store.map((b) => opt(b.id, nm(b) + ' – ' + (b.Building.buildingType === TANK ? 'tank farm' : 'warehouse') + ' – ' + fullPct(b) + '% full' + (bld0 && lotKm(b, bld0) != null ? ' · ' + kmTxt(lotKm(b, bld0)) + ' to ' + nm(bld0) + ' (' + tripTxt(toBld(b)) + ')' : ''), S.dest)).join('')}</select>`;
      if (P) h += `<div class="cap"><span class="src">${esc(nm(P.dest))}: ${P.pctNow.toFixed(0)}% full now</span><div class="capbar"><i style="width:${Math.min(100, P.pctNow)}%"></i><b style="left:${Math.min(100, P.pctNow)}%;width:${Math.max(0.6, Math.min(100 - P.pctNow, P.pctAfter - P.pctNow))}%"></b></div></div>`;
      h += '</div>';
      // what the picked storage already holds of each input (Mark, 8 Nov) – one per line, updates when the pick changes
      { const d = store.find((b) => b.id === S.dest);
        if (d) h += `<div style="margin-top:10px"><div class="src" style="font-weight:600">Already in ${esc(nm(d))}:${GLk('/building/' + d.id, 'Open ' + nm(d) + ' in the game')}</div><ul style="margin:4px 0 6px;padding-left:20px">` +
          Object.keys(sel0.inp).map((p) => { const need = sel0.inp[p] * S.runs, got = holds(d, +p);
            return `<li>${esc(pname(p))} ${got > 0 ? amt(+p, Math.min(got, need)) + ' of ' + amt(+p, need) + (got >= need ? ' <span class="ok">✓</span>' : '') : '<span style="color:var(--dim)">none</span>'}</li>`; }).join('') + '</ul></div>'; }
      h += best ? `<div class="hint"><span style="color:var(--amber)">Suggested: ${esc(nm(best))}${bld0 && toBld(best) === 0 ? ' is an instant trip to ' + esc(nm(bld0)) + ' and' : bld0 ? ' is ' + kmTxt(lotKm(best, bld0)) + ' from ' + esc(nm(bld0)) + ' and' : ''} holds ${tonnes(bestKg)} of the ${tonnes(needKg)} needed.</span>${S.destSet && S.dest !== best.id ? ' You picked a different one.' : ' Picked for you – you can change it.'}</div>`
        : '<div class="hint">None of your storage on this rock holds any of these inputs yet.</div>';
      h += `<div class="hint">${P && P.dest.Building.buildingType === TANK ? '<span style="color:var(--amber)">Tank farms only take gases and liquids.</span>' : 'Blue = in there now · amber = what this will add.'}</div></div>`;
    }
    if (rec) {
      const outs = Object.keys(rec.out).map((p) => amt(+p, rec.out[p] * S.runs) + ' ' + esc(pname(p))).join(' + ');
      h += `<div class="card"><h2><span class="n">${shipMode ? 3 : 4}</span>How many runs</h2><div class="row"><input type="number" id="dk-runs" min="1" step="1" value="${S.runs}"> <span class="src">× runs</span></div><div class="hint">Makes ${outs}</div></div>`;
    }
    if (P && !shipMode) {
      h += `<div class="card"><h2><span class="n">5</span>Inputs needed</h2><table><thead><tr><th>Input</th><th class="num">Needed</th><th class="num">Already there</th><th class="num">To move</th><th>From</th></tr></thead><tbody>` +
        P.rows.map((r) => `<tr><td>${esc(pname(r.p))}</td><td class="num">${amt(r.p, r.need)}</td><td class="num">${amt(r.p, r.there)}${r.onway > 0 ? '<br><span class="src" style="font-size:.85em">🚚 ' + amt(r.p, r.onway) + ' on its way</span>' : ''}</td><td class="num">${amt(r.p, r.moved)}</td><td class="src">` +
          (r.need - r.there <= 0 ? '<span class="ok">✓ already there</span>' : '') +
          r.from.map(([b, q]) => esc(nm(b)) + ' (' + amt(r.p, q) + ')').join('<br>') +
          (r.bad ? '<span style="color:var(--red)">✗ ' + r.bad + '</span>' : r.short > 0 ? (r.from.length ? '<br>' : '') + '<span class="short">' + amt(r.p, r.short) + ' short – ' + (((P.fly.find((f) => f.p === r.p) || {}).here) ? 'make or mine here' : 'fly in') + '</span>' : '') +
          '</td></tr>').join('') + '</tbody></table></div>';
      // 🚚 already on its way on this rock (Mark, 8 Nov: "can it show already in transit?")
      { const ids = new Set(onRock().filter(isStore).map((b) => b.id)), bn = (id) => nm(onRock().find((b) => b.id === id)) || 'Building #' + id, now = Date.now() / 1000;
        const ow = (S.incList || []).filter((r) => ids.has(r[4][1]));
        // Mark (9 Nov): any crew can receive a delivery – an in-game link to where it's going is all that's needed (LIVE 9 Nov 2026, tested on ?beta=1 – Mark)
        const TOLINK = true;
        if (ow.length) h += `<div class="card"><h2><span class="n">🚚</span>Already on its way on ${esc(S.rock)}</h2><div class="hint" style="margin:0 0 8px">Deliveries you've sent that haven't been finished yet. They count as already there, so they aren't sent again.</div><table><thead><tr><th>From</th><th>Goods</th><th>To</th><th>Status</th></tr></thead><tbody>` +
          ow.map((r) => `<tr><td class="src">${esc(r[3][0] === 5 ? bn(r[3][1]) : 'elsewhere')}</td><td>${r[5].map((x) => esc(pname(x[0])) + ' ' + amt(x[0], x[1])).join('<br>')}</td><td class="src">${esc(bn(r[4][1]))}${TOLINK ? bLink(r[4][1], 'Open ' + bn(r[4][1]) + ' in the game – any crew can finish the delivery there') : ''}</td><td class="src">${r[2] <= now ? '<span class="ok">ready – Finish All Ready Items</span>' : 'arrives in ' + Math.max(1, Math.round((r[2] - now) / 60)) + ' min'}</td></tr>`).join('') +
          `</tbody></table>${S.incErr ? '<div class="hint" style="color:var(--amber)">' + esc(S.incErr) + '</div>' : ''}</div>`; }
      if (P.fly.length) h += `<div class="card fly"><h2><span class="n">✈</span>Short on this rock</h2><div class="hint" style="margin:0 0 8px">Not enough in your storage here. First see if this rock can mine or make it – otherwise fly it in. This page does not fly ships or start processes.</div>
<table><thead><tr><th>Input</th><th class="num">Short by</th><th>Here on ${esc(S.rock)}</th><th>Or fly in from</th>${SHIPS ? '<th></th>' : ''}</tr></thead><tbody>${P.fly.map((f) => `<tr><td>${esc(pname(f.p))}</td><td class="num short">${amt(f.p, f.q)}</td><td class="src">${f.here ? '<span' + (typeof f.here === 'string' || f.here.ok ? ' class="ok"' : '') + '>' + (f.here.txt || f.here) + '</span>' : '<span style="color:var(--dim)">can\'t mine or make it here</span>'}</td><td class="src">${f.where || 'not on your other rocks – try the market'}</td>${SHIPS ? `<td><button class="dk-shipbtn${S.ship && S.ship.p === f.p ? ' on' : ''}" data-ship="${f.p}" data-shipq="${f.q}">🚀 Load a ship</button></td>` : ''}</tr>`).join('')}</tbody></table></div>` + (SHIPS ? '<div id="dk-ship"></div>' : '');
      // full production plan on this rock (Mark, 8 Nov)
      if (P.fly.length) {
        const C = chainPlan(P), on = onRock();
        CM = chainMoves(P, C); PC = C;
        const bIn = (bt) => pickBld(bt);
        const ex = on.find((b) => b.Building.buildingType === 2);
        // Laid out as stages (Mark, 8 Nov: "a lot to take in – make it more appetising"): a summary strip, then
        // stage 1 = mining, each later stage only needs things from the stages before it (so steps in one stage
        // can run side by side). Each step is a small tile; the storage picker hides behind "change".
        const icon = (p) => `<img src="rimg.php?p=${p}" alt="" loading="lazy" class="dkp-ic">`;
        const maker = {}; C.steps.forEach((x) => { maker[x.p] = x; });
        const lvl = (x, seen) => { if (x.lv) return x.lv; seen = seen || new Set(); if (seen.has(x)) return 1; seen.add(x);
          let m = 1; Object.keys(x.r.inp).forEach((ip) => { const y = maker[ip]; if (y && y !== x) m = Math.max(m, lvl(y, seen) + 1); }); return (x.lv = m); };
        C.steps.forEach((x) => lvl(x));
        const mined = Object.keys(C.mine), fl = Object.keys(C.fly);
        const top = Math.max(1, ...C.steps.map((x) => x.lv + (mined.length ? 1 : 0)));
        const stages = []; if (mined.length) stages.push({ t: 'Mine', items: mined.map((p) => ({ mine: +p })) });
        for (let l = 1; l <= Math.max(0, ...C.steps.map((x) => x.lv)); l++) { const it = C.steps.filter((x) => x.lv === l); if (it.length) stages.push({ t: 'Make', items: it }); }
        stages.push({ t: 'Final', items: [{ fin: true }] });
        const bset = new Set(C.steps.map((x) => FBT[x.r.type]));
        const sendTo = (list) => list.length ? `<div class="dkp-to">→ output to <b>${list.map((b) => esc(nm(b))).join(', ')}</b></div>` : '';
        const tile = (x) => {
          if (x.mine) { const m = C.mine[x.mine];
            return `<div class="dkp-t mine">${icon(x.mine)}<div><div class="dkp-n">${amt(x.mine, m.q)} ${esc(pname(x.mine))}</div><div class="dkp-s">⛏ mine it${ex ? GLk('/building/' + ex.id, 'Open an extractor in the game') : ' – <span style="color:var(--amber)">no extractor yet</span>'}</div>${sendTo(m.sendTo)}</div></div>`; }
          if (x.fin) return `<div class="dkp-t fin">${icon(Object.keys(rec.out)[0])}<div><div class="dkp-n">${esc(Object.keys(rec.out).map((q) => pname(q)).join(' + '))}</div><div class="dkp-s">🎯 ${esc(rec.name)}</div><div class="dkp-chips"><span>× ${S.runs.toLocaleString('en-GB')} runs</span><span>${esc(nm(P.bl))}${GLk('/building/' + P.bl.id, 'Open ' + nm(P.bl) + ' in the game')}</span><span>📦 ${esc(nm(P.dest))}</span></div></div></div>`;
          const bt = FBT[x.r.type], b = x.bld || bIn(bt), uses = Object.keys(x.use);
          return `<div class="dkp-t">${icon(x.p)}<div><div class="dkp-n">${amt(x.p, x.runs * x.r.out[x.p])} ${esc(pname(x.p))}</div><div class="dkp-s">${esc(x.r.name)}</div>
<div class="dkp-chips"><span>× ${x.runs.toLocaleString('en-GB')} runs</span><span>${b ? esc(nm(b)) + GLk('/building/' + b.id, 'Open ' + nm(b) + ' in the game') : 'a ' + BTN[bt].toLowerCase()}</span>` +
            (uses.length ? `<span title="${esc(uses.map((ip) => pname(ip) + ' ' + amt(+ip, x.use[ip]).replace(/<[^>]*>/g, '')).join(', '))} from stock">📦 ${esc(nm(x.dest))}${b && lotKm(x.dest, b) != null ? ' · ' + kmTxt(lotKm(x.dest, b)) : ''}</span></div>
<details class="dkp-ch"><summary>stock: ${uses.map((ip) => esc(pname(ip)) + ' ' + amt(+ip, x.use[ip])).join(', ')} · change</summary><select data-sd="${x.r.i}">${onRock().filter(isStore).sort((a2, c2) => nm(a2).localeCompare(nm(c2))).map((sb) => opt(sb.id, nm(sb) + ' – ' + fullPct(sb) + '% full', x.dest.id)).join('')}</select></details>${x.bad ? '<div style="color:var(--red)">✗ ' + esc(x.bad) + '</div>' : ''}` : '</div>') +
            sendTo(x.sendTo) + '</div></div>';
        };
        const nDel = CM ? CM.deliveries.length + P.moves.length : P.moves.length;
        // Mark (9 Nov): the full plan takes a lot of room – stages folded away behind an arrow (LIVE 9 Nov 2026)
        const FOLD = true, nBad = C.steps.filter((x) => x.bad).length;
        h += `<div class="card"><h2><span class="n">🧭</span>Full production plan on ${esc(S.rock)}</h2>
<div class="dkp-sum"><div><b>${C.steps.length + 1}</b>processes</div>${mined.length ? `<div><b>${mined.length}</b>to mine</div>` : ''}<div><b>${bset.size || 1}</b>building type${(bset.size || 1) === 1 ? '' : 's'}</div><div><b>${nDel}</b>deliveries</div><div class="${fl.length ? 'bad' : 'good'}"><b>${fl.length || '✓'}</b>${fl.length ? 'to fly in' : 'all made here'}</div></div>
${Object.keys(C.byUsed || {}).length ? `<div class="hint" style="margin:6px 0 0"><span class="ok">♻ Uses by-products made along the way: ${Object.keys(C.byUsed).map((q) => esc(pname(q)) + ' ' + amt(+q, C.byUsed[q])).join(', ')}</span></div>` : ''}<div class="hint" style="margin:6px 0 10px">Work down the stages. Everything in a stage only needs things from the stages above it. Stock on the rock is moved for you (step 7); things you make or mine – send the output where the tile says.</div>
${FOLD ? `<details class="dkp-fold"${window.YICplanOpen ? ' open' : ''} ontoggle="window.YICplanOpen=this.open"><summary>Show the stages${nBad ? ' <span style="color:var(--red)">· ✗ ' + nBad + ' to fix</span>' : ''}</summary>` : ''}${stages.map((st, i) => `<div class="dkp-st"><div class="dkp-sh"><span>Stage ${i + 1}</span>${st.t === 'Mine' ? 'Mine raw materials' : st.t === 'Final' ? 'The final product' : st.items.length + ' process' + (st.items.length === 1 ? '' : 'es')}</div><div class="dkp-g">${st.items.map(tile).join('')}</div></div>`).join('')}` +
          (FOLD ? '</details>' : '') + (fl.length ? `<div class="dkp-st fly"><div class="dkp-sh"><span>✈</span>Still to fly in – can't mine or make it here</div><div class="dkp-g">${fl.map((p) => { const w = window.YICSRCTXT && window.YICSRCTXT(+p, C.fly[p], astId(S.rock)); return `<div class="dkp-t">${icon(p)}<div><div class="dkp-n">${amt(+p, C.fly[p])} ${esc(pname(p))}</div><div class="dkp-s">${w || 'not on your other rocks – try the market'}</div></div></div>`; }).join('')}</div></div>` : '') + '</div>';
      }
      // crew + feeding
      const c = cl.find((x) => x.id === S.crew);
      h += `<div class="card"><h2><span class="n">6</span>Crew to do the moving</h2>`;
      if (!cl.length) h += '<div class="src" style="color:var(--red)">None of your crews is on this rock – a crew must be on the rock to move goods.</div>';
      else {
        h += `<select id="dk-crew">${cl.map((x) => opt(x.id, x.name + ' – fed ' + Math.round(x.food * 100) + '%' + (x.fm < 1 ? ' (hungry, slower)' : '') + ' · free distance ×' + x.free.toFixed(2) + (bld0 && kmBetween(x.lot, lotOf(bld0)) != null ? ' · ' + kmTxt(kmBetween(x.lot, lotOf(bld0))) + ' to ' + nm(bld0) + ' (' + tripTxt(tripSecs(kmBetween(x.lot, lotOf(bld0)), x)) + ')' : '') + (x.busy ? ' · busy until ' + x.busy : ' · ready now'), S.crew)).join('')}</select>${GLk('/crew/' + S.crew, 'Open this crew in the game')}
<div class="hint">Must be on this rock. Best fed crew with the best transport bonus is picked for you.</div>`;
        S.feedCall = null;
        if (c && c.food < 0.95) {
          const need = Math.max(0, c.mates * 1000 - Math.ceil(c.mates * 1000 * c.food)); // game's sum: max food - current food (client FeedCrew.js)
          const src = onRock().filter(isStore).map((b) => [b, ((inv(b) || { contents: [] }).contents).reduce((s, x) => s + (x.product === FOOD ? x.amount : 0), 0)]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1])[0];
          if (src) S.feedCall = { src: src[0].id, give: Math.min(need, src[1]), crew: c.id };
          h += `<div style="margin-top:10px;padding:10px 12px;border-radius:8px;background:#3fd68a12;border:1px solid #3fd68a55"><div style="color:var(--amber);margin-bottom:6px">${c.fm < 1 ? '⚠ ' + esc(c.name) + ' is hungry – moves will be slower.' : esc(c.name) + ' is ' + Math.round(c.food * 100) + '% fed.'}</div>` +
            (src ? `<label style="margin:0"><input type="checkbox" id="dk-feed"${S.feed ? ' checked' : ''}> Feed ${esc(c.name)} first: ${tonnes(Math.min(need, src[1]))} Food from ${esc(nm(src[0]))}</label>${GLk('/building/' + src[0].id, 'Open ' + nm(src[0]) + ' in the game')}<div class="hint">Feeding goes in the same wallet approval, before the moves.</div>`
              : '<div class="src">No Food stored on this rock to feed it.</div>') + '</div>';
        } else S.feed = false;
      }
      h += '</div>';
      const all = P.moves.map((x) => ({ b: x.b, to: P.dest, items: x.items, why: rec.name + ' (final)' })).concat(CM ? CM.deliveries.map((x) => ({ b: x.b, to: x.to, items: x.items, why: [...x.why].join(', ') })) : []);
      const nmv = all.length;
      S.calls = all.map((x) => ({ from: x.b.id, to: x.to.id, items: x.items.map((it) => [it.p, Math.floor(it.a)]).filter((it) => it[1] > 0) })).filter((x) => x.items.length);
      S.mover = c ? c.id : 0;
      // room in every storage that receives goods
      const addTo = {}; all.forEach((x) => { const a = addTo[x.to.id] = addTo[x.to.id] || { b: x.to, g: 0, v: 0 }; x.items.forEach((it) => { a.g += it.a * grams(it.p); a.v += it.a * (MV[it.p] || [1000, 1000])[1]; }); });
      const room = Object.values(addTo).map((a) => { const i = inv(a.b) || { mass: 0, volume: 0 }, c = CAP[a.b.Building.buildingType];
        const pc = Math.max((i.mass + (i.reservedMass || 0) + a.g) / c[0], (i.volume + (i.reservedVolume || 0) + a.v) / c[1]) * 100;
        return pc > 95 ? '<span style="color:var(--red)">✗ Not enough room – ' + esc(nm(a.b)) + ' would be ' + pc.toFixed(0) + '% full.</span>' : '<span class="ok">✓ ' + esc(nm(a.b)) + ' will be ' + pc.toFixed(0) + '% full.</span>'; });
      h += `<div class="card"><h2><span class="n">7</span>Moves to send</h2><table class="mv"><thead><tr><th></th><th>From</th><th>Goods</th><th>To</th><th>Trip</th><th>For</th></tr></thead><tbody>` +
        (all.map((x) => `<tr><td><input type="checkbox" checked disabled></td><td class="src">${esc(nm(x.b))}${GLk('/building/' + x.b.id, 'Open ' + nm(x.b) + ' in the game')}</td><td>${x.items.map((it) => esc(pname(it.p)) + ' ' + amt(it.p, it.a)).join('<br>')}</td><td class="src">${esc(nm(x.to))}</td><td class="src" style="white-space:nowrap">${kmTxt(lotKm(x.b, x.to))}<br><span class="${tripSecs(lotKm(x.b, x.to), mover) === 0 ? 'ok' : ''}">${tripTxt(tripSecs(lotKm(x.b, x.to), mover))}</span></td><td class="src" style="color:var(--dim)">${esc(x.why)}</td></tr>`).join('') || '<tr><td></td><td colspan="5" class="src">Nothing to move.</td></tr>') +
        `</tbody></table><div class="fee">${room.join('<br>') || '<span class="ok">✓ Room OK</span>'}</div>
<div class="fee">${CM ? 'Covers every step of the full production plan. ' : ''}One delivery per building pair. Game fee: about 1 cent per delivery.</div></div>`;
      // Optional: start the processes that are ready, in the same approval (Mark, 8 Nov – a tick box, off by default,
      // so he can see how it works in beta). Ready = every input comes from stock on the rock (moved by step 7),
      // nothing it needs is still to be made or mined. Each needs its own idle building of the right kind.
      // WIRED (8 Nov) for Mark's wallet only – see startCall().
      {
        const on = onRock(), used = new Set(), ready = [], wait = [], outAdd = {};
        let qEnd = crewReady(S.moverObj);
        const idle = (bt) => on.filter((b) => b.Building.buildingType === bt && freeSlot(b) && !used.has(b.id));
        const cand = [];
        // can start NOW = every input is already in its input storage (not being moved now, not on its way) and a
        // processor is free. Steps that only need this approval's moves start next time, after the moves arrive.
        if (PC) PC.steps.forEach((x) => { const full = Object.keys(x.r.inp).every((ip) => (x.use[ip] || 0) >= x.r.inp[ip] * x.runs);
          const now = full && Object.keys(x.r.inp).every((ip) => ((x.here || {})[ip] || 0) >= x.r.inp[ip] * x.runs);
          cand.push({ r: x.r, runs: x.runs, p: x.p, from: x.dest, to: (x.sendTo || [])[0] || P.dest, full, now, bld: x.bld }); });
        cand.push({ r: rec, runs: S.runs, p: +Object.keys(rec.out)[0], from: P.dest, to: P.dest, full: !P.fly.length, now: !P.fly.length && P.rows.every((r) => r.there - r.onway >= r.need), fin: true, bl: P.bl });
        const after = [];
        cand.forEach((c) => {
          if (!c.full) return;
          if (!c.now) { after.push(c); return; }
          if (!capRuns(c)) { c.why = 'one run takes longer than the game allows for a single process'; wait.push(c); return; }
          // Mark (9 Nov): processes that make a solid (Magnesium, Boric Acid, Ammonium Chloride, Nitric Acid…) were stuck
          // because their output was going to the tank farm where the next step's inputs wait. One output storage takes ALL
          // of a process's outputs, so pick the nearest storage that can take them all and has room (LIVE 9 Nov 2026)
          if (OUTFIX && c.to.Building.buildingType === TANK && Object.keys(c.r.out).some((o) => !TANKOK.has(+o))) {
            const pb = c.fin ? c.bl : c.bld || c.from, tank = c.to;
            const roomFor = (t) => { const i = inv(t) || { mass: 0, volume: 0 }, cp = CAP[t.Building.buildingType], a = addTo[t.id] || { g: 0, v: 0 }, o2 = outAdd[t.id] || [0, 0];
              const og = Object.keys(c.r.out).reduce((x, o) => x + c.r.out[o] * c.runs * grams(+o), 0), ov = Object.keys(c.r.out).reduce((x, o) => x + c.r.out[o] * c.runs * (MV[o] || [1000, 1000])[1], 0);
              return Math.max((i.mass + (i.reservedMass || 0) + a.g + o2[0] + og) / cp[0], (i.volume + (i.reservedVolume || 0) + a.v + o2[1] + ov) / cp[1]) <= 0.95; };
            const alt = on.filter((b) => isStore(b) && Object.keys(c.r.out).every((o) => b.Building.buildingType !== TANK || TANKOK.has(+o)) && roomFor(b))
              .sort((x, y) => (pb ? (lotKm(x, pb) ?? 1e9) - (lotKm(y, pb) ?? 1e9) : 0))[0];
            if (alt) { c.to = alt; c.moved = 'output to ' + nm(alt) + ' – ' + nm(tank) + ' is a tank farm and can’t take ' + Object.keys(c.r.out).filter((o) => !TANKOK.has(+o)).map((o) => pname(+o)).join(', '); }
          }
          if (c.to.Building.buildingType === TANK && Object.keys(c.r.out).some((o) => !TANKOK.has(+o))) { c.why = 'its output can’t go in a tank farm (' + nm(c.to) + ')'; wait.push(c); return; }
          // ROOM FOR OUTPUTS (go-live item 2, Mark 8 Nov): the output storage must have room for everything this process
          // makes (counted in full – a safe over-estimate), on top of this approval's moves and other starts going there
          { const t = c.to, i = inv(t) || { mass: 0, volume: 0 }, cp = CAP[t.Building.buildingType], a = addTo[t.id] || { g: 0, v: 0 };
            const og = Object.keys(c.r.out).reduce((x, o) => x + c.r.out[o] * c.runs * grams(+o), 0), ov = Object.keys(c.r.out).reduce((x, o) => x + c.r.out[o] * c.runs * (MV[o] || [1000, 1000])[1], 0);
            const ig = c.from.id === t.id ? Object.keys(c.r.inp).reduce((x, p2) => x + c.r.inp[p2] * c.runs * grams(+p2), 0) : 0, iv = c.from.id === t.id ? Object.keys(c.r.inp).reduce((x, p2) => x + c.r.inp[p2] * c.runs * (MV[p2] || [1000, 1000])[1], 0) : 0;
            const og2 = (outAdd[t.id] || [0, 0]);
            const pg = (i.mass + (i.reservedMass || 0) + a.g + og2[0] + og - ig) / cp[0], pv = (i.volume + (i.reservedVolume || 0) + a.v + og2[1] + ov - iv) / cp[1];
            if (Math.max(pg, pv) > 0.95) { c.why = 'not enough room in ' + nm(t) + ' for its output (' + Math.round(Math.max(pg, pv) * 100) + '% full afterwards)'; wait.push(c); return; }
            c.outG = og; c.outV = ov; c.inG = ig; c.inV = iv; }
          const bt = FBT[c.r.type];
          const b = c.fin && freeSlot(c.bl) && !used.has(c.bl.id) ? c.bl : c.bld && freeSlot(c.bld) && !used.has(c.bld.id) ? c.bld : idle(bt)[0];
          if (b) {
            const mv = S.moverObj, add = laborSecs(c.r.name, c.runs) + (mv ? (tripSecs(kmBetween(mv.lot, lotOf(b)), mv) || 0) : 0);
            if (mv && Math.max(qEnd, Date.now() / 1000) + add - Date.now() / 1000 > 86400) { c.why = (mv.name || 'the crew') + "'s queue would go past the game's 24-hour limit"; wait.push(c); return; }
            qEnd = Math.max(qEnd, Date.now() / 1000) + add;
          }
          if (b) { used.add(b.id); ready.push(Object.assign(c, { b, slot: freeSlot(b) })); const o2 = outAdd[c.to.id] = outAdd[c.to.id] || [0, 0]; o2[0] += c.outG - c.inG; o2[1] += c.outV - c.inV; } else {
            // Mark (9 Nov): say WHY there's no building – none on the rock, all busy, or the free ones already used by this approval (LIVE 9 Nov 2026)
            if (OUTFIX) { const kind = BTN[bt] || 'building', all = on.filter((x) => x.Building.buildingType === bt && x.Building.status === 3);
              c.why = !all.length ? 'no ' + kind + ' on ' + S.rock : all.some((x) => freeSlot(x)) ? 'the free ' + kind + ' is already taken by another process in this approval' : 'every ' + kind + ' on ' + S.rock + ' is busy'; }
            wait.push(c); }
        });
        S.startList = S.start ? ready : [];
        const later = (PC ? PC.steps.length + 1 : 1) - ready.length - wait.length - after.length;
        h += `<div class="card"><h2><span class="n">7½</span>Start processes too? <span style="font-size:.6em;color:var(--amber);letter-spacing:.1em">OPTIONAL</span></h2>
<label style="margin:0 0 8px"><input type="checkbox" id="dk-start"${S.start ? ' checked' : ''}> Also start the processes that are ready, in the same approval</label>
<div class="hint" style="margin-bottom:8px">This ties up your buildings and uses up the stock. Only processes whose inputs are ALREADY in their storage can start now – the rest start on a later visit, once moves have arrived or earlier steps have finished.</div>` +
          (S.start && ready.length && S.moverObj ? `<div class="hint" style="margin-bottom:8px">${esc(S.moverObj.name)} will be busy until about ${new Date(qEnd * 1000).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })} (the game allows up to 24 hours of queued jobs).</div>` : '') +
          (S.start ? (ready.length ? `<div class="dkp-g">${ready.map((c) => `<div class="dkp-t${c.fin ? ' fin' : ''}"><img src="rimg.php?p=${c.p}" alt="" loading="lazy" class="dkp-ic"><div><div class="dkp-n">▶ ${esc(c.r.name)}</div><div class="dkp-chips"><span>× ${c.runs.toLocaleString('en-GB')} runs</span><span>${esc(nm(c.b))}${GLk('/building/' + c.b.id, 'Open ' + nm(c.b) + ' in the game')}</span></div><div class="dkp-to">inputs from <b>${esc(nm(c.from))}</b> · output to <b>${esc(nm(c.to))}</b></div>${c.moved ? `<div class="dkp-ch">${esc(c.moved)}</div>` : ''}${c.capTxt ? `<div class="dkp-ch">⏱ ${esc(c.capTxt)}</div>` : ''}</div></div>`).join('')}</div>`
            : '<div class="src">Nothing can start right now – no process has all its inputs sitting in its storage yet.</div>') +
            (wait.length ? `<div class="hint" style="color:var(--amber)">${wait.length} more ${wait.length === 1 ? 'is' : 'are'} ready but can't start yet:${OUTFIX ? '<br>' + wait.map((c) => '• ' + esc(c.r.name) + ' – ' + esc(c.why || 'no free building')).join('<br>') : ' ' + wait.map((c) => esc(c.r.name) + ' – ' + esc(c.why || 'no free building')).join('; ') + '.'}</div>` : '') +
            (after.length ? `<div class="hint">${after.length} can start next time, once this approval's moves have arrived:${OUTFIX ? '<br>' + after.map((c) => '• ' + esc(c.r.name)).join('<br>') : ' ' + after.map((c) => esc(c.r.name)).join(', ') + '.'}</div>` : '') +
            (later > 0 ? `<div class="hint">${later} more can start once the steps before them finish.</div>` : '') : '') + '</div>';
        S.nStart = S.start ? ready.length : 0;
      }
      // SENDING (Mark, 8 Nov): switched on for deliveries + feeding ONLY, and ONLY when the page shows Mark's own
      // wallet (OWNER). Everyone else keeps a switched-off button. Process starts are sent too when ticked (8 Nov).
      const mine = isOwner();
      const wait = S.sentAt && Date.now() - S.sentAt < 180000;
      const can = mine && !S.busy && !wait && (S.calls.length || (S.feed && S.feedCall) || (S.startList || []).length) && S.mover;
      const tot = (S.feed && S.feedCall ? 1 : 0) + S.calls.length + (S.startList || []).length, per = S.bs === 'All' ? tot : Math.min(tot, S.bs || 30);
      h += `<div class="card"><h2><span class="n">8</span>Approve</h2>${tot > 15 ? `<div class="row" style="margin-bottom:10px"><span class="src">Actions per approval</span><select id="dk-bs">${BATCHES.map((b) => opt(b, b === 'All' ? 'All (' + tot + ')' : b, S.bs || 30)).join('')}</select><span class="hint" style="margin:0">${tot > per ? 'This approval sends the first ' + per + ' of ' + tot + ' – the rest next time.' : ''} If one action fails, the game cancels the whole approval, so smaller is safer.</span></div>` : ''}<button class="approve" id="dk-appr"${can ? '' : ' disabled style="opacity:.5;cursor:not-allowed"'}>${S.busy ? 'WAITING FOR YOUR WALLET…' : tot > per ? 'APPROVE IN WALLET (' + per + ' of ' + tot + ' actions)' : 'APPROVE IN WALLET (' + nmv + ' deliver' + (nmv === 1 ? 'y' : 'ies') + (S.feed ? ' + feed crew' : '') + ((S.startList || []).length ? ' + start ' + S.startList.length + ' process' + (S.startList.length === 1 ? '' : 'es') : '') + ')'}</button>
<div class="hint">${S.dataAt && Date.now() - S.dataAt > 10 * 60000 ? '<span style="color:var(--amber)">Game data is over 10 minutes old – press ↻ Check the game again before approving.</span> ' : ''}${wait ? '<span style="color:var(--amber)">Just sent – give the game a few minutes to catch up, then press ↻ Check the game again before sending more.</span> ' : ''}${mine ? (S.mover ? 'Your wallet will show every action first. Nothing is sent unless you approve it there.' : 'Pick a crew that is on this rock and ready.') : 'Load your wallet on the Command Deck first.'}</div>
<div id="dk-msg" class="hint" style="display:${S.msg ? 'block' : 'none'};margin-top:10px;padding:10px 12px;border-radius:8px;border:1px solid ${S.msgErr ? '#ff4d4d88' : '#8fe3ff55'};color:${S.msgErr ? '#ffb3ae' : 'var(--ink)'}">${S.msg || ''}</div></div>`;
      h += `<div class="card"><h2><span class="n">9</span>Finish in the game</h2><div class="src">Each delivery shows up for the crew as a ready Surface Transfer. Use "Finish All Ready Items" in the game.</div></div>`;
    }
    // ship mode: what's short on the rock (all its storage, counting deliveries on their way) goes on the ship
    let shipNeed = null;
    if (shipMode && rec) {
      shipNeed = {};
      Object.keys(rec.inp).forEach((p) => { const need = rec.inp[p] * S.runs - rockStock(+p); if (need > 0) shipNeed[p] = Math.ceil(need); });
      h += Object.keys(shipNeed).length ? '<div id="dk-ship"></div>' : `<div class="card"><div class="src"><span class="ok">✓ Everything it needs is already on ${esc(S.rock)}</span> – switch to 🏭 Make on this rock.</div></div>`;
    }
    m.innerHTML = h;
    planSave();
    m.querySelectorAll('[data-ship]').forEach((b) => b.addEventListener('click', () => { const p = +b.dataset.ship; S.ship = S.ship && S.ship.p === p ? null : { p, q: +b.dataset.shipq }; render(); if (S.ship) { const e = document.getElementById('dk-ship'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }));
    m.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { S.mode = b.dataset.mode; S.ship = null; render(); }));
    if (shipMode && window.YICSHIP) { const e = document.getElementById('dk-ship'); if (e) window.YICSHIP.render(e, { items: shipNeed, what: rec.name, runs: S.runs }); }
    else if (SHIPS && window.YICSHIP) { const e = document.getElementById('dk-ship'); if (e) { if (S.ship && !(P && P.fly.find((f) => f.p === S.ship.p))) S.ship = null; window.YICSHIP.render(e, S.ship); } }
    const on = (id, ev, f) => { const e = document.getElementById(id); if (e) e.addEventListener(ev, f); };
    on('dk-rock', 'change', (e) => { S.rock = e.target.value; S.dest = 0; S.destSet = false; S.bld = 0; S.proc = -1; S.crew = 0; S.feed = false; render(); });
    on('dk-dest', 'change', (e) => { S.dest = +e.target.value; S.destSet = true; render(); });
    on('dk-bld', 'change', (e) => { S.bld = +e.target.value; render(); });
    on('dk-proc', 'change', (e) => { S.proc = +e.target.value; S.destSet = false; S.stepDest = {}; S.msg = ''; render(); });
    on('dk-by', 'change', (e) => { S.by = e.target.value; render(); });
    document.querySelectorAll('#dk-main select[data-sd]').forEach((el) => el.addEventListener('change', () => { S.stepDest = S.stepDest || {}; S.stepDest[el.dataset.sd] = +el.value; render(); }));
    // search box (Mark, 8 Nov): filters the What-to-make list as you type – no redraw, so typing isn't interrupted
    const filt = () => {
      const q = (S.q || '').toLowerCase().trim(), sel = document.getElementById('dk-proc'); if (!sel) return;
      let n = 0, first = null;
      [...sel.options].forEach((o) => { const hit = o.value === '-1' || !q || o.text.toLowerCase().includes(q); o.hidden = !hit; if (hit && o.value !== '-1') { n++; if (!first) first = o; } });
      sel.options[0].text = q ? (n ? '— ' + n + ' match' + (n === 1 ? '' : 'es') + ' – pick one —' : '— nothing matches —') : (S.by === 'out' ? '— pick what to make —' : '— pick a process —');
    };
    on('dk-q', 'input', (e) => { S.q = e.target.value; filt(); });
    filt();
    on('dk-runs', 'change', (e) => { S.runs = Math.max(1, Math.floor(+e.target.value || 1)); render(); });
    on('dk-crew', 'change', (e) => { S.crew = +e.target.value; S.feed = false; render(); });
    on('dk-feed', 'change', (e) => { S.feed = e.target.checked; render(); });
    on('dk-start', 'change', (e) => { S.start = e.target.checked; render(); });
    on('dk-bs', 'change', (e) => { S.bs = e.target.value === 'All' ? 'All' : +e.target.value; render(); });
    on('dk-appr', 'click', () => { if (!S.busy) approve(); });
    m.querySelectorAll('[data-plan]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); planLoad(a.dataset.plan); render(); }));
    m.querySelectorAll('[data-unplan]').forEach((b) => b.addEventListener('click', () => { plansPut(plansGet().filter((x) => x.k !== b.dataset.unplan)); if (S.rock + '|' + S.proc === b.dataset.unplan) S.proc = -1; render(); }));
    // ask the site to fetch fresh game data (its own Refresh link), then redraw with it
    on('dk-recheck', 'click', (e) => recheck(e.target));
  }

  // Check the game again – from the card, or the button in the pinned header (Mark, 9 Nov: no scrolling up to refresh)
  function recheck(btn) {
    const rf = document.getElementById('rf'), before = D(), hb = document.getElementById('dk-hrc');
    [btn, hb].forEach((b) => { if (b) { b.textContent = 'Checking…'; b.disabled = true; } });
    if (rf) rf.click();
    let n = 0; const t = setInterval(() => { n++; if ((D() && D() !== before) || n > 40) { clearInterval(t); S.dataAt = Date.now();
      loadDeliveries().then(() => { const h = document.getElementById('dk-hrc'); if (h) { h.textContent = '↻ Check the game again'; h.disabled = false; } render(); }); } }, 500);
  }

  // ---------- start ----------
  function start() {
    if (/[?&]feed=1\b/.test(location.search)) S.mode = 'feed'; // from Crew Quarters' "Feed crews" button
    build();
    loadRecipes().then(() => {
      const wait = setInterval(() => { if (D() && R) { clearInterval(wait); loadDeliveries().then(() => { S.ready = true; S.dataAt = Date.now(); render(); }); } }, 400);
    });
  }
  // for vendor/shipload.js (test only) – the hub's own helpers, so both work the same way
  if (SHIPS) window.YICDOCK = { S, D, esc, nm, inv, isStore, rockOf, allB, pname, amt, grams, bulk, tonnes, astId, lotOf, kmBetween, tripSecs, tripTxt, kmTxt, crews, crewReady,
    holds: (b, p) => holds(b, p), recipes: () => R || [], mv: () => MV, render: () => render(), loadDeliveries: () => loadDeliveries(), wallets, account, sameAddr, isOwner, hex, short, DISPATCHER, SLOT, TANK, BTN, FBT,
    canMine, onRock, procB, freeSlot, busyTxt, rocks, procSecs, capRuns, incoming, GLk, TANKOK,
    approve: () => approve(), PID, BATCHES };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
