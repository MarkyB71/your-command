/* Loading Dock – Skippy's Awesome Command Deck – TEST ONLY (?beta=1&dock=1), 8 Nov 2026
   Design: project doc claude/loading-dock-idea-2026-11-08.md (Mark).
   Pick a rock, a warehouse/tank farm, a building and a process; the page works out the inputs, finds them in
   your other storage on that rock, lists what must be flown in, picks a crew (with an option to feed it),
   and lists the deliveries. The Airlock (warning + "I understand") is shown every time.
   THIS TEST VERSION SENDS NOTHING – the Approve button is switched off. Uses the site's own loaded data
   (window.YIC.D) and the recipe list in vendor/chain.js (@influenceth/sdk). Opened from dock.html. */
(function () {
  'use strict';
  if (!/[?&]beta=1\b/.test(location.search) || !/[?&]dock=1\b/.test(location.search)) return;

  const CSS = "#dk-ov{\n  --amber:#ffb03b; --amber2:#ff8a1f; --cyan:#8fe3ff; --steel:#2a3140; --steel2:#3a4356;\n  --ink:#dfe7f2; --dim:#8a96aa; --red:#ff4d4d; --green:#3fd68a;\n}\n#dk-ov *{box-sizing:border-box}\n#dk-ov{position:fixed!important;inset:0;z-index:2147483000!important;overflow:auto;background:#05070c;color:var(--ink);font-family:Rajdhani,system-ui,sans-serif}\n#dk-ov{display:flex;align-items:center;justify-content:center;padding:18px}\n#dk-ov .wrap{display:flex;gap:26px;align-items:center;max-width:1180px;width:100%}\n#dk-ov .chamber{position:relative;flex:1 1 640px;aspect-ratio:16/11;border-radius:18px;overflow:hidden;\n  background:linear-gradient(#141923,#0b0e15 60%,#10141d);box-shadow:0 0 0 2px #1d2330 inset,0 20px 60px #000a}\n#dk-ov .chamber svg.walls{position:absolute;inset:0;width:100%;height:100%}\n#dk-ov .beacon{position:absolute;top:4.5%;width:7%;aspect-ratio:2/1;border-radius:40px 40px 6px 6px;\n  background:radial-gradient(ellipse at 50% 80%,#ffd27a,var(--amber2) 55%,#5a2a00);box-shadow:0 0 18px var(--amber2);opacity:.55}\n#dk-ov .beacon.l{left:9%}\n#dk-ov .beacon.r{right:9%}\n#dk-ov .cycling .beacon{animation:flash .5s infinite alternate}\n@keyframes flash{from{opacity:.25;box-shadow:0 0 4px var(--amber2)}to{opacity:1;box-shadow:0 0 40px 10px var(--amber2)}}\n#dk-ov .sweep{position:absolute;inset:0;pointer-events:none;opacity:0;\n  background:radial-gradient(ellipse at 50% 0%,#ff9a2a55,transparent 60%)}\n#dk-ov .cycling .sweep{animation:sweep .5s infinite alternate}\n@keyframes sweep{from{opacity:0}to{opacity:1}}\n#dk-ov .frame{position:absolute;left:19%;right:19%;top:15%;bottom:9%;border-radius:22px 22px 8px 8px;overflow:hidden;\n  box-shadow:0 0 0 10px #1a202b,0 0 0 13px #3b4558,0 0 0 22px #141922,0 0 0 24px #000}\n#dk-ov .dock{position:absolute;inset:0;transition:transform 2.4s ease}\n#dk-ov .open .dock{transform:scale(1.08)}\n#dk-ov .dock svg{width:100%;height:100%;display:block}\n#dk-ov .door{position:absolute;top:0;bottom:0;width:50.4%;transition:transform 2.2s cubic-bezier(.7,0,.3,1) .3s;\n  --hole:13%;}\n#dk-ov .door.l{left:0;\n  -webkit-mask:radial-gradient(circle at 100% 42%,transparent 9vmin,#000 9.1vmin);\n          mask:radial-gradient(circle at 100% 42%,transparent 9vmin,#000 9.1vmin);\n  background:\n   radial-gradient(circle at 100% 42%,transparent 9vmin,#b7c2d3 9.1vmin,#5d687c 10vmin,#2b3240 10.9vmin,transparent 11vmin),\n   repeating-linear-gradient(135deg,var(--amber) 0 18px,#111 18px 36px) right/22px 100% no-repeat,\n   linear-gradient(90deg,#283041,#3a4458 60%,#2d3546);\n}\n#dk-ov .door.r{right:0;\n  -webkit-mask:radial-gradient(circle at 0% 42%,transparent 9vmin,#000 9.1vmin);\n          mask:radial-gradient(circle at 0% 42%,transparent 9vmin,#000 9.1vmin);\n  background:\n   radial-gradient(circle at 0% 42%,transparent 9vmin,#b7c2d3 9.1vmin,#5d687c 10vmin,#2b3240 10.9vmin,transparent 11vmin),\n   repeating-linear-gradient(45deg,var(--amber) 0 18px,#111 18px 36px) left/22px 100% no-repeat,\n   linear-gradient(270deg,#283041,#3a4458 60%,#2d3546);\n}\n#dk-ov .door::before{content:\"\";position:absolute;left:12%;right:12%;bottom:8%;height:16%;border-radius:4px;\n  background:repeating-linear-gradient(0deg,#1d2330 0 6px,#323b4d 6px 9px);box-shadow:0 0 0 2px #1a1f2a}\n#dk-ov .door::after{content:\"\";position:absolute;left:14%;right:14%;top:7%;height:6%;border-radius:3px;\n  background:linear-gradient(#232a37,#3b4558);box-shadow:0 0 0 2px #151a23}\n#dk-ov .door .lbl{position:absolute;top:66%;font-weight:700;letter-spacing:.12em;font-size:clamp(10px,1.4vw,15px);color:#ffcf7a;opacity:.85}\n#dk-ov .door.l .lbl{right:30%}\n#dk-ov .door.r .lbl{left:30%}\n#dk-ov .open .door.l{transform:translateX(-101%)}\n#dk-ov .open .door.r{transform:translateX(101%)}\n#dk-ov .glass{position:absolute;left:50%;top:42%;width:18vmin;height:18vmin;margin:-9vmin 0 0 -9vmin;border-radius:50%;\n  pointer-events:none;background:radial-gradient(circle at 35% 30%,#ffffff22,transparent 45%);transition:opacity .4s .3s}\n#dk-ov .open .glass{opacity:0}\n#dk-ov .sign{position:absolute;left:50%;top:5.5%;transform:translateX(-50%);padding:4px 16px;border-radius:6px;\n  background:#0c0f15;box-shadow:0 0 0 2px #2c3444;font-weight:700;letter-spacing:.18em;font-size:clamp(11px,1.5vw,16px);\n  color:var(--red);text-shadow:0 0 8px currentColor;white-space:nowrap}\n#dk-ov .sign.amber{color:var(--amber)}\n#dk-ov .sign.green{color:var(--green)}\n#dk-ov .panel{flex:0 0 360px;background:linear-gradient(#141923,#0e121a);border-radius:14px;padding:20px 22px;\n  box-shadow:0 0 0 2px #232a37 inset,0 0 0 1px #000;position:relative;overflow:hidden}\n#dk-ov .panel::before{content:\"\";position:absolute;left:0;right:0;top:0;height:10px;\n  background:repeating-linear-gradient(45deg,var(--amber) 0 12px,#111 12px 24px)}\n#dk-ov h1{margin:6px 0 2px;font-size:26px;letter-spacing:.14em;color:var(--amber)}\n#dk-ov .sub{color:var(--dim);font-size:15px;margin-bottom:14px;letter-spacing:.05em}\n#dk-ov .warn{border-left:4px solid var(--amber);background:#ffb03b12;padding:10px 12px;border-radius:4px;font-size:17px;line-height:1.3}\n#dk-ov .warn b{color:#ffd28a}\n#dk-ov ul{margin:12px 0 14px;padding-left:20px;font-size:16px;line-height:1.35;color:#cdd6e3}\n#dk-ov li{margin:4px 0}\n#dk-ov label{display:flex;gap:10px;align-items:flex-start;font-size:16px;margin:10px 0;cursor:pointer;line-height:1.25}\n#dk-ov input[type=checkbox]{width:20px;height:20px;margin:0;flex:0 0 auto;accent-color:var(--amber)}\n#dk-ov .btn{display:block;width:100%;margin-top:14px;padding:12px;border:0;border-radius:8px;font:700 18px Rajdhani,sans-serif;\n  letter-spacing:.14em;cursor:pointer;color:#1a1000;background:linear-gradient(#ffc45e,var(--amber2));box-shadow:0 0 18px #ff8a1f55}\n#dk-ov .btn:disabled{cursor:not-allowed;color:#6b7383;background:#232a37;box-shadow:none}\n#dk-ov .back{display:inline-block;margin-top:14px;color:var(--cyan);text-decoration:none;font-size:16px}\n#dk-ov .back:hover{text-decoration:underline}\n#dk-ov .bar{height:8px;border-radius:4px;background:#1d2330;margin-top:12px;overflow:hidden;display:none}\n#dk-ov .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--amber2),#ffd27a)}\n#dk-ov .cycling .bar{display:block}\n#dk-ov .cycling .bar i{transition:width 2.6s linear;width:100%}\n#dk-ov .done{display:none;margin-top:12px;color:var(--green);font-size:17px}\n#dk-ov .reset{background:none;border:0;color:var(--dim);font:500 14px Rajdhani,sans-serif;cursor:pointer;margin-top:10px;padding:0;text-decoration:underline}\n#dk-ov .mock{position:absolute;right:12px;bottom:10px;font-size:12px;color:#5c6577;letter-spacing:.1em}\n#dk-ov.indock{display:block;padding:0}\n#dk-ov .wrap{transition:opacity .6s}\n#dk-ov .wrap.gone{opacity:0}\n#dk-ov #dockpg{display:none;max-width:980px;margin:0 auto;padding:0 18px 40px}\n#dk-ov.indock #dockpg{display:block;animation:fadein .6s}\n@keyframes fadein{from{opacity:0}to{opacity:1}}\n#dk-ov .stripe{height:10px;background:repeating-linear-gradient(45deg,var(--amber) 0 12px,#111 12px 24px)}\n#dk-ov .dhead{position:sticky;top:0;z-index:5;background:#05070c;padding-top:0}\n#dk-ov .dhead .in{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0 10px;flex-wrap:wrap}\n#dk-ov .dhead h1{margin:0}\n#dk-ov .live{display:flex;align-items:center;gap:8px;font-weight:700;letter-spacing:.08em;color:#ffd28a;font-size:15px;\n  border:1px solid #ffb03b66;background:#ffb03b14;border-radius:20px;padding:4px 12px}\n#dk-ov .live i{width:9px;height:9px;border-radius:50%;background:var(--amber);box-shadow:0 0 8px var(--amber);animation:flash 1s infinite alternate}\n#dk-ov .card{background:linear-gradient(#141923,#0e121a);border-radius:12px;box-shadow:0 0 0 1px #232a37 inset;padding:14px 18px;margin:14px 0}\n#dk-ov .card h2{margin:0 0 10px;font-size:19px;letter-spacing:.08em;color:var(--ink);display:flex;align-items:center;gap:10px}\n#dk-ov .card h2 .n{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#ffb03b22;color:var(--amber);font-size:15px;box-shadow:0 0 0 1px #ffb03b66 inset}\n#dk-ov .card.fly{box-shadow:0 0 0 1px #9a6bff66 inset}\n#dk-ov .card.fly h2 .n{background:#9a6bff22;color:#c4a8ff;box-shadow:0 0 0 1px #9a6bff88 inset}\n#dk-ov .row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}\n#dk-ov select,#dk-ov input[type=number]{background:#0b0e14;color:var(--ink);border:1px solid #3a4356;border-radius:6px;padding:7px 10px;font:600 16px Rajdhani,sans-serif;min-width:220px}\n#dk-ov input[type=number]{min-width:0;width:90px}\n#dk-ov .hint{color:var(--dim);font-size:15px;margin-top:6px}\n#dk-ov .cap{flex:1 1 260px}\n#dk-ov .capbar{height:10px;border-radius:5px;background:#1d2330;overflow:hidden;margin-top:4px;position:relative}\n#dk-ov .capbar i{position:absolute;left:0;top:0;bottom:0;background:#4f90ff}\n#dk-ov .capbar b{position:absolute;top:0;bottom:0;background:var(--amber)}\n#dk-ov table{width:100%;border-collapse:collapse;font-size:16px}\n#dk-ov th{text-align:left;color:var(--dim);font-weight:600;padding:6px 8px;border-bottom:1px solid #2a3140;letter-spacing:.04em}\n#dk-ov td{padding:7px 8px;border-bottom:1px solid #1b212c;vertical-align:top}\n#dk-ov td.num,#dk-ov th.num{text-align:right;white-space:nowrap}\n#dk-ov .ok{color:var(--green)}\n#dk-ov .short{color:#c4a8ff}\n#dk-ov .src{color:#cdd6e3;font-size:15px}\n#dk-ov .mv td:first-child{width:28px}\n#dk-ov .fee{color:var(--dim);font-size:15px;margin-top:8px}\n#dk-ov .approve{display:block;width:100%;padding:14px;border:0;border-radius:10px;font:700 20px Rajdhani,sans-serif;letter-spacing:.12em;cursor:pointer;\n  color:#1a1000;background:linear-gradient(#ffc45e,var(--amber2));box-shadow:0 0 22px #ff8a1f55}\n#dk-ov .mocknote{text-align:center;color:#5c6577;font-size:13px;letter-spacing:.1em;margin-top:18px}\n#dk-ov .toast{display:none;margin-top:10px;padding:10px 12px;border-radius:8px;background:#3fd68a18;color:var(--green);border:1px solid #3fd68a55}\n@media (max-width:900px){#dk-ov .wrap{flex-direction:column}\n#dk-ov .panel{flex:none;width:100%}\n#dk-ov .chamber{width:100%;flex:none}\n}\n@media (max-width:560px){#dk-ov .door.l{-webkit-mask:radial-gradient(circle at 100% 42%,transparent 38px,#000 39px);mask:radial-gradient(circle at 100% 42%,transparent 38px,#000 39px)}\n#dk-ov .door.r{-webkit-mask:radial-gradient(circle at 0% 42%,transparent 38px,#000 39px);mask:radial-gradient(circle at 0% 42%,transparent 38px,#000 39px)}\n#dk-ov .glass{width:76px;height:76px;margin:-38px 0 0 -38px}\n\n}\n\n";
  const WRAP = "<div class=\"wrap\" id=\"wrap\">\n\n  <!-- ===== the airlock chamber ===== -->\n  <div class=\"chamber\" id=\"chamber\" aria-label=\"Airlock with a window through to the loading dock\">\n    <svg class=\"walls\" viewBox=\"0 0 1600 1100\" preserveAspectRatio=\"none\" aria-hidden=\"true\">\n      <defs>\n        <linearGradient id=\"wall\" x1=\"0\" x2=\"1\"><stop offset=\"0\" stop-color=\"#0d1118\"/><stop offset=\".5\" stop-color=\"#1a2130\"/><stop offset=\"1\" stop-color=\"#0d1118\"/></linearGradient>\n      </defs>\n      <rect width=\"1600\" height=\"1100\" fill=\"url(#wall)\"/>\n      <!-- side wall panels -->\n      <g fill=\"none\" stroke=\"#2b3345\" stroke-width=\"3\">\n        <path d=\"M40 160 L230 200 L230 960 L40 1040 Z\"/><path d=\"M1560 160 L1370 200 L1370 960 L1560 1040 Z\"/>\n        <path d=\"M70 260 L200 280 M70 420 L200 430 M70 580 L200 585 M70 740 L200 740 M70 900 L200 895\"/>\n        <path d=\"M1530 260 L1400 280 M1530 420 L1400 430 M1530 580 L1400 585 M1530 740 L1400 740 M1530 900 L1400 895\"/>\n      </g>\n      <!-- pressure gauges -->\n      <g transform=\"translate(135 340)\"><circle r=\"44\" fill=\"#0b0e14\" stroke=\"#4a5568\" stroke-width=\"5\"/><path d=\"M-30 18 A34 34 0 1 1 30 18\" fill=\"none\" stroke=\"#3fd68a\" stroke-width=\"5\"/><line x1=\"0\" y1=\"0\" x2=\"-22\" y2=\"-20\" stroke=\"#ffb03b\" stroke-width=\"4\"/><text y=\"34\" text-anchor=\"middle\" fill=\"#8a96aa\" font-size=\"15\" font-family=\"Rajdhani\">kPa</text></g>\n      <g transform=\"translate(1465 340)\"><circle r=\"44\" fill=\"#0b0e14\" stroke=\"#4a5568\" stroke-width=\"5\"/><path d=\"M-30 18 A34 34 0 1 1 30 18\" fill=\"none\" stroke=\"#3fd68a\" stroke-width=\"5\"/><line x1=\"0\" y1=\"0\" x2=\"24\" y2=\"-18\" stroke=\"#ffb03b\" stroke-width=\"4\"/><text y=\"34\" text-anchor=\"middle\" fill=\"#8a96aa\" font-size=\"15\" font-family=\"Rajdhani\">O\u2082</text></g>\n      <!-- pipes -->\n      <g stroke=\"#323b4d\" stroke-width=\"16\" fill=\"none\" stroke-linecap=\"round\"><path d=\"M110 520 V900\"/><path d=\"M160 520 V880\"/><path d=\"M1490 520 V900\"/><path d=\"M1440 520 V880\"/></g>\n      <g fill=\"#ffb03b\"><rect x=\"98\" y=\"640\" width=\"24\" height=\"12\"/><rect x=\"1478\" y=\"700\" width=\"24\" height=\"12\"/></g>\n      <!-- floor -->\n      <path d=\"M0 1010 L1600 1010 L1600 1100 L0 1100 Z\" fill=\"#0a0d13\"/>\n      <g fill=\"#ffb03b\" opacity=\".75\"><path d=\"M300 1030 h1000 v10 h-1000z\"/></g>\n      <g fill=\"#ffb03b22\"><path d=\"M300 1050 L1300 1050 L1360 1100 L240 1100Z\"/></g>\n    </svg>\n    <div class=\"sweep\"></div>\n    <div class=\"beacon l\"></div><div class=\"beacon r\"></div>\n    <div class=\"sign\" id=\"sign\">\u25cf INNER DOOR LOCKED</div>\n\n    <div class=\"frame\">\n      <!-- the loading dock, seen through the porthole -->\n      <div class=\"dock\">\n        <svg viewBox=\"0 0 800 700\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\">\n          <defs>\n            <linearGradient id=\"dkwall\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#1a2232\"/><stop offset=\"1\" stop-color=\"#0f1520\"/></linearGradient>\n            <linearGradient id=\"dkfloor\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#232b3a\"/><stop offset=\"1\" stop-color=\"#121722\"/></linearGradient>\n            <radialGradient id=\"lamp\" cx=\".5\" cy=\"0\" r=\"1\"><stop offset=\"0\" stop-color=\"#ffe2a6\" stop-opacity=\".55\"/><stop offset=\"1\" stop-color=\"#ffe2a6\" stop-opacity=\"0\"/></radialGradient>\n            <linearGradient id=\"space\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#020308\"/><stop offset=\"1\" stop-color=\"#0a1022\"/></linearGradient>\n          </defs>\n          <rect width=\"800\" height=\"700\" fill=\"url(#dkwall)\"/>\n          <!-- big bay door open to space -->\n          <rect x=\"230\" y=\"70\" width=\"340\" height=\"230\" rx=\"6\" fill=\"url(#space)\" stroke=\"#3a4458\" stroke-width=\"8\"/>\n          <g fill=\"#fff\"><circle cx=\"270\" cy=\"110\" r=\"1.4\"/><circle cx=\"330\" cy=\"160\" r=\"1\"/><circle cx=\"400\" cy=\"100\" r=\"1.6\"/><circle cx=\"520\" cy=\"130\" r=\"1.2\"/><circle cx=\"545\" cy=\"240\" r=\"1\"/><circle cx=\"300\" cy=\"250\" r=\"1.3\"/><circle cx=\"460\" cy=\"200\" r=\".9\"/><circle cx=\"360\" cy=\"215\" r=\"1\"/></g>\n          <ellipse cx=\"470\" cy=\"290\" rx=\"150\" ry=\"60\" fill=\"#3b3a44\"/>\n          <ellipse cx=\"440\" cy=\"276\" rx=\"22\" ry=\"7\" fill=\"#2c2b33\"/><ellipse cx=\"520\" cy=\"290\" rx=\"14\" ry=\"5\" fill=\"#2c2b33\"/>\n          <rect x=\"230\" y=\"62\" width=\"340\" height=\"12\" fill=\"#2b3345\"/>\n          <g fill=\"#ffb03b\"><rect x=\"230\" y=\"62\" width=\"20\" height=\"12\"/><rect x=\"270\" y=\"62\" width=\"20\" height=\"12\"/><rect x=\"310\" y=\"62\" width=\"20\" height=\"12\"/><rect x=\"350\" y=\"62\" width=\"20\" height=\"12\"/><rect x=\"390\" y=\"62\" width=\"20\" height=\"12\"/><rect x=\"430\" y=\"62\" width=\"20\" height=\"12\"/><rect x=\"470\" y=\"62\" width=\"20\" height=\"12\"/><rect x=\"510\" y=\"62\" width=\"20\" height=\"12\"/><rect x=\"550\" y=\"62\" width=\"20\" height=\"12\"/></g>\n          <!-- ceiling lamps -->\n          <g><rect x=\"90\" y=\"20\" width=\"90\" height=\"10\" rx=\"3\" fill=\"#ffe2a6\"/><rect x=\"620\" y=\"20\" width=\"90\" height=\"10\" rx=\"3\" fill=\"#ffe2a6\"/>\n          <path d=\"M90 30 L180 30 L260 360 L10 360Z\" fill=\"url(#lamp)\"/><path d=\"M620 30 L710 30 L790 360 L540 360Z\" fill=\"url(#lamp)\"/></g>\n          <!-- floor -->\n          <path d=\"M0 330 L800 330 L800 700 L0 700Z\" fill=\"url(#dkfloor)\"/>\n          <g stroke=\"#ffb03b\" stroke-width=\"5\" opacity=\".7\"><path d=\"M250 330 L120 700\"/><path d=\"M550 330 L680 700\"/></g>\n          <g fill=\"#ffb03b\" opacity=\".18\"><path d=\"M300 420 h200 v70 h-200z\"/></g>\n          <text x=\"400\" y=\"465\" text-anchor=\"middle\" fill=\"#ffb03b\" opacity=\".5\" font-family=\"Rajdhani\" font-weight=\"700\" font-size=\"26\" letter-spacing=\"6\">STAGING</text>\n          <!-- crates left -->\n          <g>\n            <rect x=\"40\" y=\"380\" width=\"120\" height=\"100\" fill=\"#3c5a7a\" stroke=\"#1b2738\" stroke-width=\"4\"/><path d=\"M40 380 L160 480 M160 380 L40 480\" stroke=\"#2a4058\" stroke-width=\"5\"/>\n            <rect x=\"60\" y=\"300\" width=\"90\" height=\"80\" fill=\"#7a5a2e\" stroke=\"#2d2010\" stroke-width=\"4\"/><path d=\"M60 330 h90\" stroke=\"#5b4220\" stroke-width=\"5\"/>\n            <rect x=\"170\" y=\"410\" width=\"80\" height=\"70\" fill=\"#4f6b3a\" stroke=\"#1d2a14\" stroke-width=\"4\"/>\n          </g>\n          <!-- tank right -->\n          <g>\n            <rect x=\"600\" y=\"300\" width=\"110\" height=\"180\" rx=\"40\" fill=\"#576274\" stroke=\"#222a36\" stroke-width=\"5\"/>\n            <rect x=\"600\" y=\"360\" width=\"110\" height=\"18\" fill=\"#ffb03b\" opacity=\".8\"/>\n            <rect x=\"720\" y=\"380\" width=\"70\" height=\"100\" fill=\"#6a3a3a\" stroke=\"#2a1515\" stroke-width=\"4\"/>\n          </g>\n          <!-- cargo loader -->\n          <g transform=\"translate(330 470)\">\n            <rect x=\"0\" y=\"40\" width=\"150\" height=\"60\" rx=\"8\" fill=\"#ffb03b\" stroke=\"#5a3a00\" stroke-width=\"4\"/>\n            <rect x=\"20\" y=\"0\" width=\"70\" height=\"45\" rx=\"6\" fill=\"#2b3345\" stroke=\"#111\" stroke-width=\"3\"/>\n            <rect x=\"28\" y=\"8\" width=\"54\" height=\"24\" rx=\"3\" fill=\"#8fe3ff\" opacity=\".6\"/>\n            <rect x=\"150\" y=\"-30\" width=\"10\" height=\"130\" fill=\"#3a4458\"/><rect x=\"160\" y=\"80\" width=\"60\" height=\"10\" fill=\"#3a4458\"/>\n            <rect x=\"165\" y=\"30\" width=\"55\" height=\"50\" fill=\"#3c5a7a\" stroke=\"#1b2738\" stroke-width=\"3\"/>\n            <circle cx=\"35\" cy=\"105\" r=\"18\" fill=\"#111\" stroke=\"#444\" stroke-width=\"4\"/><circle cx=\"120\" cy=\"105\" r=\"18\" fill=\"#111\" stroke=\"#444\" stroke-width=\"4\"/>\n          </g>\n          <!-- stencil -->\n          <text x=\"400\" y=\"630\" text-anchor=\"middle\" fill=\"#8fe3ff\" opacity=\".35\" font-family=\"Rajdhani\" font-weight=\"700\" font-size=\"34\" letter-spacing=\"10\">LOADING DOCK</text>\n        </svg>\n      </div>\n      <div class=\"door l\"><span class=\"lbl\">LOADING</span></div>\n      <div class=\"door r\"><span class=\"lbl\">DOCK</span></div>\n      <div class=\"glass\"></div>\n    </div>\n  </div>\n\n  <!-- ===== the control panel ===== -->\n  <div class=\"panel\" id=\"panel\">\n    <h1>AIRLOCK</h1>\n    <div class=\"sub\">Leaving the Command Deck</div>\n    <div class=\"warn\"><b>Past this door, this page acts in the game for you.</b></div>\n    <ul>\n      <li>It moves resources by sending actions from your wallet.</li>\n      <li>Every move is listed first so you can check it.</li>\n      <li>Nothing is sent until you press Approve in your wallet.</li>\n      <li>The game charges a small fee for each action.</li>\n    </ul>\n    <label><input type=\"checkbox\" id=\"ok\"> I understand this page sends game actions from my wallet.</label>\n    <label><input type=\"checkbox\" id=\"skip\"> Remember that I understand on this browser (you still go through the airlock).</label>\n    <button class=\"btn\" id=\"go\" disabled>CYCLE AIRLOCK</button>\n    <div class=\"bar\"><i></i></div>\n        <a class=\"back\" href=\"#\" data-dkback>\u25c2 Back to the Command Deck (read-only)</a><br>\n        <div class=\"mock\">TEST</div>\n  </div>\n</div>";

  // ---- game constants (same as vendor/tidy.js, @influenceth/sdk) ----
  const SLOT = 2, WAREHOUSE = 1, TANK = 10;
  const BTN = { 3: 'Refinery', 4: 'Bioreactor', 5: 'Factory', 6: 'Shipyard' };
  const FBT = { 1: 3, 2: 5, 3: 4, 4: 6, 5: 6 }; // recipe type -> building type (chain.js)
  const TANKOK = new Set([1, 2, 3, 4, 5, 6, 7, 8, 23, 24, 27, 33, 50, 66, 73, 76, 116, 169, 170, 180, 184, 185, 220]);
  const CAP = { 1: [1.5e12, 75e9], 10: [75e9, 997.5e9] }; // grams, volume
  const FOOD = 129;

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

  const S = { by: 'out', ok: false, rock: '', dest: 0, bld: 0, proc: -1, runs: 1000, crew: 0, feed: false, ready: false };

  // ---------- overlay + airlock ----------
  function build() {
    if (document.getElementById('dk-ov')) return;
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap'; document.head.appendChild(l);
    const st = document.createElement('style'); st.textContent = CSS + '#dk-ov input[type=number]{width:110px!important;flex:none!important}#dk-ov tr,#dk-ov tr:hover td{background:none!important}#dk-ov .card{border:0!important}#dk-ov .dkp-sum{display:flex;flex-wrap:wrap;gap:10px;margin:4px 0}#dk-ov .dkp-sum>div{background:#0b0e14;border:1px solid #2a3140;border-radius:10px;padding:8px 14px;color:var(--dim);font-size:.9em;min-width:110px}#dk-ov .dkp-sum b{display:block;font-size:1.7em;color:var(--ink);line-height:1.1}#dk-ov .dkp-sum .good b{color:var(--green)}#dk-ov .dkp-sum .bad b{color:#c4a8ff}#dk-ov .dkp-st{margin:14px 0 4px;border-left:3px solid #ffb03b55;padding-left:12px}#dk-ov .dkp-st.fly{border-left-color:#9a6bff88}#dk-ov .dkp-sh{font-weight:700;letter-spacing:.06em;color:var(--ink);margin-bottom:8px}#dk-ov .dkp-sh span{color:var(--amber);margin-right:10px;text-transform:uppercase;font-size:.85em}#dk-ov .dkp-st.fly .dkp-sh span{color:#c4a8ff}#dk-ov .dkp-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}#dk-ov .dkp-t{display:flex;gap:10px;align-items:flex-start;background:#0b0e14;border:1px solid #232a37;border-radius:10px;padding:10px 12px}#dk-ov .dkp-t.mine{border-color:#3fd68a44}#dk-ov .dkp-t.fin{border-color:#ffb03b88;box-shadow:0 0 14px #ff8a1f22}#dk-ov .dkp-ic{width:44px!important;height:44px!important;object-fit:contain;flex:none;border-radius:6px;background:#141923}#dk-ov .dkp-n{font-weight:700;font-size:1.05em}#dk-ov .dkp-s{color:var(--dim);font-size:.88em;line-height:1.25}#dk-ov .dkp-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}#dk-ov .dkp-chips span{background:#1a2030;border-radius:12px;padding:1px 9px;font-size:.82em;color:#cdd6e3}#dk-ov .dkp-to{margin-top:6px;font-size:.85em;color:#cdd6e3}#dk-ov .dkp-to b{color:var(--amber)}#dk-ov .dkp-ch{margin-top:4px;font-size:.82em;color:var(--dim)}#dk-ov .dkp-ch summary{cursor:pointer}#dk-ov .dkp-ch select{margin-top:4px;min-width:0!important;font-size:1em}#dk-ov input[type=search]{background:#0b0e14!important;color:var(--ink)!important;border:1px solid #3a4356!important;border-radius:6px;padding:7px 10px;font:600 1em Rajdhani,sans-serif;width:auto!important}#dk-ov a.yicg{color:var(--cyan);font-size:.85em;margin-left:8px;white-space:nowrap}#dk-ov .dk-br{color:var(--cyan);text-decoration:none;font-weight:700;letter-spacing:.06em;border:1px solid #8fe3ff66;border-radius:20px;padding:4px 14px}#dk-ov .dk-br:hover{background:#8fe3ff18}#dk-ov:not(.indock){padding:2vmin}#dk-ov .wrap{max-width:none!important;width:100%;height:calc(100vh - 4vmin);gap:2vmin}#dk-ov .chamber{flex:1 1 auto!important;height:100%;aspect-ratio:auto!important}#dk-ov .panel{flex:0 0 clamp(320px,28vw,560px)!important;font-size:clamp(13px,min(1.25vw,2.1vh),22px);padding:2.2vmin 2.4vmin;max-height:100%;overflow:auto}#dk-ov input[type=checkbox]{width:1.25em!important;min-width:0!important;max-width:1.25em!important;height:1.25em!important;flex:0 0 1.25em!important;margin:0!important;padding:0!important}#dk-ov .panel label{width:auto!important}#dk-ov .panel h1{font-size:2em}#dk-ov .panel .sub,#dk-ov .panel ul,#dk-ov .panel label,#dk-ov .panel .warn,#dk-ov .panel .back{font-size:1em}#dk-ov .panel .btn{font-size:1.15em;padding:1.6vmin}#dk-ov .sign{font-size:clamp(12px,1.6vmin,22px)}#dk-ov .door .lbl{font-size:clamp(11px,1.8vmin,24px)}#dk-ov #dockpg{max-width:none!important;padding:0 3vw 40px;font-size:clamp(15px,1.1vw,20px)}#dk-ov .card h2{font-size:1.25em}#dk-ov table{font-size:1em}#dk-ov select{font-size:1em}@media (max-width:900px){#dk-ov .wrap{height:auto}#dk-ov .chamber{height:auto;aspect-ratio:16/11!important}}'; document.head.appendChild(st);
    const ov = document.createElement('div'); ov.id = 'dk-ov';
    ov.innerHTML = WRAP + '<div id="dockpg"><div class="dhead"><div class="stripe"></div><div class="in"><h1>LOADING DOCK</h1>' +
      '<div class="live"><i></i>THIS PAGE SENDS GAME ACTIONS FROM YOUR WALLET</div><a href="#" data-dkback class="dk-br">◂ Return to the Bridge</a></div></div><div id="dk-main"></div>' +
      '<div class="mocknote">TEST VERSION · SENDING IS SWITCHED OFF · <a href="#" data-dkback style="color:var(--cyan)">return to the Bridge</a></div></div>';
    document.body.appendChild(ov);
    // app.js rewrites <head> and <body> while it loads – keep putting the dock back on top
    const keep = () => { if (!l.isConnected) document.head.appendChild(l); if (!st.isConnected) document.head.appendChild(st); if (!ov.isConnected) document.body.appendChild(ov); document.documentElement.style.overflow = 'hidden'; };
    const timer = setInterval(keep, 400); keep();
    // Return to the Bridge (Mark, 8 Nov): close the dock and go to the Bridge – no reload
    ov.addEventListener('click', (e) => {
      const a = e.target.closest('[data-dkback]'); if (!a) return; e.preventDefault();
      clearInterval(timer); try { speechSynthesis.cancel(); } catch (x) {}
      ov.remove(); st.remove(); document.documentElement.style.overflow = '';
      try { history.replaceState(history.state, '', location.pathname + location.search.replace(/[?&]dock=1\b/, '').replace(/^&/, '?') + location.hash); } catch (x) {}
      if (window.YICgoDeck) window.YICgoDeck('bridge'); else location.reload();
    });
    airlock(ov);
  }
  function airlock(ov) {
    const q = (s) => ov.querySelector(s);
    const ok = q('#ok'), skip = q('#skip'), go = q('#go'), sign = q('#sign'), wrap = q('#wrap'), ch = q('#chamber'), KEY = 'sk_airlock_skip';
    const setSign = (t, c) => { sign.textContent = t; sign.className = 'sign' + (c ? ' ' + c : ''); };
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
        wrap.classList.remove('cycling'); ch.classList.remove('cycling'); setSign('● DOOR OPEN', 'green'); ch.classList.add('open');
        setTimeout(() => wrap.classList.add('gone'), 2300);
        setTimeout(() => { wrap.style.display = 'none'; ov.classList.add('indock'); ov.scrollTop = 0; S.ok = true; render(); }, 2900);
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
    try { const v = new SpeechSynthesisUtterance('Warning. Airlock cycling. Stand clear of the doors.'); v.rate = 0.95; v.pitch = 0.8; v.volume = 0.9; speechSynthesis.cancel(); setTimeout(() => speechSynthesis.speak(v), 300); } catch (e) {}
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
  const busyTxt = (b) => {
    const now = Date.now() / 1000;
    const fin = (b.Processors || []).filter((x) => x.status === 1 && x.finishTime > now).map((x) => x.finishTime);
    if (!fin.length) return 'idle';
    const s = Math.min(...fin) - now, h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
    return 'busy ' + (h ? h + 'h ' + m + 'm' : Math.max(1, m) + 'm');
  };
  function crews() {
    const d = D(), y = Y(), cm = (d && d.crewmates) || {};
    return ((d && d.crewList) || []).filter((c) => c.ast === S.rock && (c.roster || []).length && !/in flight|in orbit/i.test(c.place || '')).map((c) => {
      const ms = c.roster.map((id) => cm[id]).filter(Boolean);
      let free = 1, speed = 1;
      try { free = y.crewMult(11, ms); speed = y.crewMult(3, ms) * (y.CBNF && y.CBNF[3] ? 1 : y.habEff(c)); } catch (e) {}
      const food = typeof c.food === 'number' ? Math.max(0, Math.min(1, c.food)) : 1;
      const fm = Math.min(1, Math.max(0.25, food / 0.5)); // SDK Crew.getFoodMultiplier, normal rations
      return { id: c.id, name: c.name, busy: c.busy || '', free: free * fm, rawFree: free, rawSpeed: speed, food, fm, mates: c.roster.length };
    }).sort((a, b) => (!!a.busy - !!b.busy) || (b.free - a.free) || (b.rawSpeed - a.rawSpeed));
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
    on.filter(isStore).forEach((b) => ((inv(b) || { contents: [] }).contents).forEach((c) => { if (c.amount > 0) pool[c.product] = (pool[c.product] || 0) + c.amount; }));
    P.rows.forEach((r) => { pool[r.p] = Math.max(0, (pool[r.p] || 0) - Math.min(r.need, r.there + r.moved)); });
    const steps = [], key = {}, fly = {}, mine = {};
    const recipes = (p) => R.filter((x) => x.out[p] && !/Unbundling/.test(x.name) && types.has(FBT[x.type]));
    function need(p, q, path, depth, to) {
      if (q <= 0) return;
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
      if (fresh) steps.push(st);
    }
    P.fly.forEach((f) => need(f.p, f.q, [], 0, 'final'));
    return { steps, fly, mine };
  }

  // Move everything for the WHOLE chain (Mark, 8 Nov): each step gets its own storage (★ = holds most of that
  // step's stock inputs; the player can change it), stock is shared out once across all steps, and every
  // delivery goes in one list. Things made or mined along the way can't be moved yet – each step says where
  // to send its output so it lands where the next step needs it.
  function chainMoves(P, C) {
    const store = onRock().filter(isStore), byId = (id) => store.find((b) => b.id === id);
    const avail = {}; store.forEach((b) => { avail[b.id] = {}; ((inv(b) || { contents: [] }).contents).forEach((c) => { if (c.amount > 0) avail[b.id][c.product] = (avail[b.id][c.product] || 0) + c.amount; }); });
    // the final step's stock is already spoken for
    P.rows.forEach((r) => { const a = avail[P.dest.id]; if (a) a[r.p] = Math.max(0, (a[r.p] || 0) - Math.min(r.there, r.need)); r.from.forEach(([b, q]) => { avail[b.id][r.p] -= q; }); });
    const okIn = (b, ip) => b.Building.buildingType !== TANK || TANKOK.has(ip);
    const dests = {}, add = {}, dl = {};
    const put = (from, to, ip, q, why) => { const k = from.id + '>' + to.id; (dl[k] = dl[k] || { b: from, to, items: [], why: new Set() }).items.push({ p: ip, a: q }); dl[k].why.add(why);
      add[to.id] = add[to.id] || [0, 0]; add[to.id][0] += q * grams(ip); add[to.id][1] += q * (MV[ip] || [1000, 1000])[1]; };
    C.steps.forEach((st) => {
      // best storage for this step: holds most of its stock inputs by weight; else the main staging storage
      let best = null, bk = 0;
      store.forEach((b) => { const kg = Object.keys(st.use).reduce((t, ip) => okIn(b, +ip) ? t + Math.min(avail[b.id][ip] || 0, st.use[ip]) * grams(+ip) : t, 0); if (kg > bk) { bk = kg; best = b; } });
      st.star = best ? best.id : P.dest.id;
      const d = byId((S.stepDest || {})[st.r.i]) || byId(st.star);
      st.dest = d;
      Object.keys(st.use).forEach((ip) => {
        ip = +ip; let left = st.use[ip];
        if (!okIn(d, ip)) { st.bad = "a tank farm can't take " + pname(ip); return; }
        const own = Math.min(avail[d.id][ip] || 0, left); avail[d.id][ip] = (avail[d.id][ip] || 0) - own; left -= own;
        store.filter((b) => b.id !== d.id).sort((a, b) => (avail[b.id][ip] || 0) - (avail[a.id][ip] || 0)).forEach((b) => {
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
      const need = rec.inp[p] * S.runs, there = have(dest, p), want = Math.max(0, need - there);
      const row = { p, need, there, moved: 0, from: [], short: 0, bad: '' };
      if (want > 0 && tankDest && !TANKOK.has(p)) { row.bad = "can't go in a tank farm"; row.short = want; rows.push(row); return; }
      let left = want;
      store.filter((b) => b.id !== dest.id).map((b) => [b, have(b, p)]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]).forEach(([b, h]) => {
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

  const holds = (b, p) => ((inv(b) || { contents: [] }).contents.filter((c) => c.product === p).reduce((t, c) => t + c.amount, 0));
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

  // ---------- page ----------
  const opt = (v, t, cur) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(t)}</option>`;
  function render() {
    const m = document.getElementById('dk-main');
    if (!m || !S.ok) return;
    if (!S.ready) { m.innerHTML = '<div class="card"><div class="src">Loading your command…</div></div>'; return; }
    const rl = rocks();
    if (!rl.length) { m.innerHTML = '<div class="card"><div class="src">No warehouses or tank farms found for this wallet. Load your wallet on the Command Deck first.</div></div>'; return; }
    if (!rl.includes(S.rock)) { S.rock = rl[0]; S.dest = 0; S.bld = 0; S.proc = -1; S.crew = 0; }
    const store = onRock().filter(isStore).sort((a, b) => nm(a).localeCompare(nm(b)));
    // Mark (8 Nov): pick WHAT to make first; the building list then fills with the buildings that can do it (idle first)
    const pb = procB();
    const procs = R.filter((r) => FBT[r.type]);
    if (!procs.find((r) => r.i === S.proc)) S.proc = -1;
    const sel0 = R[S.proc];
    const able = sel0 ? pb.filter((b) => b.Building.buildingType === FBT[sel0.type]).sort((a, b) => (busyTxt(a) !== 'idle') - (busyTxt(b) !== 'idle')) : [];
    if (!able.find((b) => b.id === S.bld)) S.bld = able[0] ? able[0].id : 0;
    // Mark (8 Nov): suggest the storage that already holds the most of the inputs (by weight) – the player can change it
    let best = null, bestKg = 0, needKg = 0;
    if (sel0) {
      Object.keys(sel0.inp).forEach((p) => { needKg += sel0.inp[p] * S.runs * grams(+p) / 1000; });
      store.forEach((b) => {
        const tank = b.Building.buildingType === TANK;
        const kg = Object.keys(sel0.inp).reduce((t, p) => (tank && !TANKOK.has(+p)) ? t : t + Math.min(holds(b, +p), sel0.inp[p] * S.runs) * grams(+p) / 1000, 0);
        if (kg > bestKg) { best = b; bestKg = kg; }
      });
    }
    if (!S.destSet && best) S.dest = best.id;
    if (!store.find((b) => b.id === S.dest)) S.dest = store[0] ? store[0].id : 0;
    const cl = crews();
    if (!cl.find((c) => c.id === S.crew)) S.crew = (cl.find((c) => !c.busy) || cl[0] || {}).id || 0;
    const P = plan();
    const rec = R[S.proc];
    let CM = null;

    let h = '';
    h += `<div class="card"><h2><span class="n">1</span>Rock</h2><select id="dk-rock">${rl.map((r) => opt(r, r, S.rock)).join('')}</select></div>`;
    h += `<div class="card"><h2><span class="n">2</span>What to make</h2><div class="row">
<select id="dk-by">${opt('out', 'Pick by what it makes', S.by)}${opt('proc', 'Pick by process name', S.by)}</select>
<input type="search" id="dk-q" placeholder="🔍 Search…" value="${esc(S.q || '')}" style="min-width:200px">
<select id="dk-proc">${opt(-1, S.by === 'out' ? '— pick what to make —' : '— pick a process —', S.proc)}${procList(procs).map(([i, t]) => opt(i, t, S.proc)).join('')}</select></div>`;
    if (sel0) {
      const bt = FBT[sel0.type];
      h += able.length ? `<div class="row" style="margin-top:10px"><span class="src">Made in:</span><select id="dk-bld">${able.map((b) => opt(b.id, nm(b) + ' – ' + BTN[bt].toLowerCase() + ' (' + busyTxt(b) + ')', S.bld)).join('')}</select>${GLk('/building/' + S.bld, 'Open this building in the game')}</div>`
        : `<div class="hint" style="color:var(--red)">✗ This is made in a ${BTN[bt].toLowerCase()}${sel0.type === 5 ? ' (dry dock)' : ''} – you don't have one on ${esc(S.rock)}.</div>`;
    }
    h += '</div>';
    if (sel0) {
      h += `<div class="card"><h2><span class="n">3</span>Stage into</h2><div class="row"><select id="dk-dest">${store.map((b) => opt(b.id, (best && b.id === best.id ? '★ ' : '') + nm(b) + ' – ' + (b.Building.buildingType === TANK ? 'tank farm' : 'warehouse') + ' – ' + fullPct(b) + '% full', S.dest)).join('')}</select>`;
      if (P) h += `<div class="cap"><span class="src">${esc(nm(P.dest))}: ${P.pctNow.toFixed(0)}% full now</span><div class="capbar"><i style="width:${Math.min(100, P.pctNow)}%"></i><b style="left:${Math.min(100, P.pctNow)}%;width:${Math.max(0.6, Math.min(100 - P.pctNow, P.pctAfter - P.pctNow))}%"></b></div></div>`;
      h += '</div>';
      // what the picked storage already holds of each input (Mark, 8 Nov) – one per line, updates when the pick changes
      { const d = store.find((b) => b.id === S.dest);
        if (d) h += `<div style="margin-top:10px"><div class="src" style="font-weight:600">Already in ${esc(nm(d))}:${GLk('/building/' + d.id, 'Open ' + nm(d) + ' in the game')}</div><ul style="margin:4px 0 6px;padding-left:20px">` +
          Object.keys(sel0.inp).map((p) => { const need = sel0.inp[p] * S.runs, got = holds(d, +p);
            return `<li>${esc(pname(p))} ${got > 0 ? amt(+p, Math.min(got, need)) + ' of ' + amt(+p, need) + (got >= need ? ' <span class="ok">✓</span>' : '') : '<span style="color:var(--dim)">none</span>'}</li>`; }).join('') + '</ul></div>'; }
      h += best ? `<div class="hint"><span style="color:var(--amber)">★ ${esc(nm(best))} already holds the most of these inputs (${tonnes(bestKg)} of ${tonnes(needKg)}).</span>${S.destSet && S.dest !== best.id ? ' You picked a different one.' : ' Picked for you – you can change it.'}</div>`
        : '<div class="hint">None of your storage on this rock holds any of these inputs yet.</div>';
      h += `<div class="hint">${P && P.dest.Building.buildingType === TANK ? '<span style="color:var(--amber)">Tank farms only take gases and liquids.</span>' : 'Blue = in there now · amber = what this will add.'}</div></div>`;
    }
    if (rec) {
      const outs = Object.keys(rec.out).map((p) => amt(+p, rec.out[p] * S.runs) + ' ' + esc(pname(p))).join(' + ');
      h += `<div class="card"><h2><span class="n">4</span>How many runs</h2><div class="row"><input type="number" id="dk-runs" min="1" step="1" value="${S.runs}"> <span class="src">× runs</span></div><div class="hint">Makes ${outs}</div></div>`;
    }
    if (P) {
      h += `<div class="card"><h2><span class="n">5</span>Inputs needed</h2><table><thead><tr><th>Input</th><th class="num">Needed</th><th class="num">Already there</th><th class="num">To move</th><th>From</th></tr></thead><tbody>` +
        P.rows.map((r) => `<tr><td>${esc(pname(r.p))}</td><td class="num">${amt(r.p, r.need)}</td><td class="num">${amt(r.p, r.there)}</td><td class="num">${amt(r.p, r.moved)}</td><td class="src">` +
          (r.need - r.there <= 0 ? '<span class="ok">✓ already there</span>' : '') +
          r.from.map(([b, q]) => esc(nm(b)) + ' (' + amt(r.p, q) + ')').join('<br>') +
          (r.bad ? '<span style="color:var(--red)">✗ ' + r.bad + '</span>' : r.short > 0 ? (r.from.length ? '<br>' : '') + '<span class="short">' + amt(r.p, r.short) + ' short – ' + (((P.fly.find((f) => f.p === r.p) || {}).here) ? 'make or mine here' : 'fly in') + '</span>' : '') +
          '</td></tr>').join('') + '</tbody></table></div>';
      if (P.fly.length) h += `<div class="card fly"><h2><span class="n">✈</span>Short on this rock</h2><div class="hint" style="margin:0 0 8px">Not enough in your storage here. First see if this rock can mine or make it – otherwise fly it in. This page does not fly ships or start processes.</div>
<table><thead><tr><th>Input</th><th class="num">Short by</th><th>Here on ${esc(S.rock)}</th><th>Or fly in from</th></tr></thead><tbody>${P.fly.map((f) => `<tr><td>${esc(pname(f.p))}</td><td class="num short">${amt(f.p, f.q)}</td><td class="src">${f.here ? '<span' + (typeof f.here === 'string' || f.here.ok ? ' class="ok"' : '') + '>' + (f.here.txt || f.here) + '</span>' : '<span style="color:var(--dim)">can\'t mine or make it here</span>'}</td><td class="src">${f.where || 'not on your other rocks – try the market'}</td></tr>`).join('')}</tbody></table></div>`;
      // full production plan on this rock (Mark, 8 Nov)
      if (P.fly.length) {
        const C = chainPlan(P), on = onRock();
        CM = chainMoves(P, C);
        const bIn = (bt) => on.filter((b) => b.Building.buildingType === bt).sort((x, z) => (busyTxt(x) !== 'idle') - (busyTxt(z) !== 'idle'))[0];
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
          const bt = FBT[x.r.type], b = bIn(bt), uses = Object.keys(x.use);
          return `<div class="dkp-t">${icon(x.p)}<div><div class="dkp-n">${amt(x.p, x.runs * x.r.out[x.p])} ${esc(pname(x.p))}</div><div class="dkp-s">${esc(x.r.name)}</div>
<div class="dkp-chips"><span>× ${x.runs.toLocaleString('en-GB')} runs</span><span>${b ? esc(nm(b)) + GLk('/building/' + b.id, 'Open ' + nm(b) + ' in the game') : 'a ' + BTN[bt].toLowerCase()}</span>` +
            (uses.length ? `<span title="${esc(uses.map((ip) => pname(ip) + ' ' + amt(+ip, x.use[ip]).replace(/<[^>]*>/g, '')).join(', '))} from stock">📦 ${esc(nm(x.dest))}${x.dest.id === x.star ? ' ★' : ''}</span></div>
<details class="dkp-ch"><summary>stock: ${uses.map((ip) => esc(pname(ip)) + ' ' + amt(+ip, x.use[ip])).join(', ')} · change</summary><select data-sd="${x.r.i}">${onRock().filter(isStore).sort((a2, c2) => nm(a2).localeCompare(nm(c2))).map((sb) => opt(sb.id, (sb.id === x.star ? '★ ' : '') + nm(sb) + ' – ' + fullPct(sb) + '% full', x.dest.id)).join('')}</select></details>${x.bad ? '<div style="color:var(--red)">✗ ' + esc(x.bad) + '</div>' : ''}` : '</div>') +
            sendTo(x.sendTo) + '</div></div>';
        };
        const nDel = CM ? CM.deliveries.length + P.moves.length : P.moves.length;
        h += `<div class="card"><h2><span class="n">🧭</span>Full production plan on ${esc(S.rock)}</h2>
<div class="dkp-sum"><div><b>${C.steps.length + 1}</b>processes</div>${mined.length ? `<div><b>${mined.length}</b>to mine</div>` : ''}<div><b>${bset.size || 1}</b>building type${(bset.size || 1) === 1 ? '' : 's'}</div><div><b>${nDel}</b>deliveries</div><div class="${fl.length ? 'bad' : 'good'}"><b>${fl.length || '✓'}</b>${fl.length ? 'to fly in' : 'all made here'}</div></div>
<div class="hint" style="margin:6px 0 10px">Work down the stages. Everything in a stage only needs things from the stages above it. Stock on the rock is moved for you (step 7); things you make or mine – send the output where the tile says.</div>
${stages.map((st, i) => `<div class="dkp-st"><div class="dkp-sh"><span>Stage ${i + 1}</span>${st.t === 'Mine' ? 'Mine raw materials' : st.t === 'Final' ? 'The final product' : st.items.length + ' process' + (st.items.length === 1 ? '' : 'es')}</div><div class="dkp-g">${st.items.map(tile).join('')}</div></div>`).join('')}` +
          (fl.length ? `<div class="dkp-st fly"><div class="dkp-sh"><span>✈</span>Still to fly in – can't mine or make it here</div><div class="dkp-g">${fl.map((p) => { const w = window.YICSRCTXT && window.YICSRCTXT(+p, C.fly[p], astId(S.rock)); return `<div class="dkp-t">${icon(p)}<div><div class="dkp-n">${amt(+p, C.fly[p])} ${esc(pname(p))}</div><div class="dkp-s">${w || 'not on your other rocks – try the market'}</div></div></div>`; }).join('')}</div></div>` : '') + '</div>';
      }
      // crew + feeding
      const c = cl.find((x) => x.id === S.crew);
      h += `<div class="card"><h2><span class="n">6</span>Crew to do the moving</h2>`;
      if (!cl.length) h += '<div class="src" style="color:var(--red)">None of your crews is on this rock – a crew must be on the rock to move goods.</div>';
      else {
        h += `<select id="dk-crew">${cl.map((x) => opt(x.id, x.name + ' – fed ' + Math.round(x.food * 100) + '%' + (x.fm < 1 ? ' (hungry, slower)' : '') + ' · free distance ×' + x.free.toFixed(2) + (x.busy ? ' · busy until ' + x.busy : ' · ready now'), S.crew)).join('')}</select>${GLk('/crew/' + S.crew, 'Open this crew in the game')}
<div class="hint">Must be on this rock. Best fed crew with the best transport bonus is picked for you.</div>`;
        if (c && c.food < 0.95) {
          const yrs = Math.min(1, c.food >= 0.5 ? 1 - c.food : (0.75 - c.food) / 0.5), need = Math.floor(c.mates * 1000 * yrs);
          const src = onRock().filter(isStore).map((b) => [b, ((inv(b) || { contents: [] }).contents).reduce((s, x) => s + (x.product === FOOD ? x.amount : 0), 0)]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1])[0];
          h += `<div style="margin-top:10px;padding:10px 12px;border-radius:8px;background:#3fd68a12;border:1px solid #3fd68a55"><div style="color:var(--amber);margin-bottom:6px">${c.fm < 1 ? '⚠ ' + esc(c.name) + ' is hungry – moves will be slower.' : esc(c.name) + ' is ' + Math.round(c.food * 100) + '% fed.'}</div>` +
            (src ? `<label style="margin:0"><input type="checkbox" id="dk-feed"${S.feed ? ' checked' : ''}> Feed ${esc(c.name)} first: ${tonnes(Math.min(need, src[1]))} Food from ${esc(nm(src[0]))}</label>${GLk('/building/' + src[0].id, 'Open ' + nm(src[0]) + ' in the game')}<div class="hint">Feeding goes in the same wallet approval, before the moves.</div>`
              : '<div class="src">No Food stored on this rock to feed it.</div>') + '</div>';
        } else S.feed = false;
      }
      h += '</div>';
      const all = P.moves.map((x) => ({ b: x.b, to: P.dest, items: x.items, why: rec.name + ' (final)' })).concat(CM ? CM.deliveries.map((x) => ({ b: x.b, to: x.to, items: x.items, why: [...x.why].join(', ') })) : []);
      const nmv = all.length;
      // room in every storage that receives goods
      const addTo = {}; all.forEach((x) => { const a = addTo[x.to.id] = addTo[x.to.id] || { b: x.to, g: 0, v: 0 }; x.items.forEach((it) => { a.g += it.a * grams(it.p); a.v += it.a * (MV[it.p] || [1000, 1000])[1]; }); });
      const room = Object.values(addTo).map((a) => { const i = inv(a.b) || { mass: 0, volume: 0 }, c = CAP[a.b.Building.buildingType];
        const pc = Math.max((i.mass + (i.reservedMass || 0) + a.g) / c[0], (i.volume + (i.reservedVolume || 0) + a.v) / c[1]) * 100;
        return pc > 95 ? '<span style="color:var(--red)">✗ Not enough room – ' + esc(nm(a.b)) + ' would be ' + pc.toFixed(0) + '% full.</span>' : '<span class="ok">✓ ' + esc(nm(a.b)) + ' will be ' + pc.toFixed(0) + '% full.</span>'; });
      h += `<div class="card"><h2><span class="n">7</span>Moves to send</h2><table class="mv"><thead><tr><th></th><th>From</th><th>Goods</th><th>To</th><th>For</th></tr></thead><tbody>` +
        (all.map((x) => `<tr><td><input type="checkbox" checked disabled></td><td class="src">${esc(nm(x.b))}${GLk('/building/' + x.b.id, 'Open ' + nm(x.b) + ' in the game')}</td><td>${x.items.map((it) => esc(pname(it.p)) + ' ' + amt(it.p, it.a)).join('<br>')}</td><td class="src">${esc(nm(x.to))}</td><td class="src" style="color:var(--dim)">${esc(x.why)}</td></tr>`).join('') || '<tr><td></td><td colspan="4" class="src">Nothing to move.</td></tr>') +
        `</tbody></table><div class="fee">${room.join('<br>') || '<span class="ok">✓ Room OK</span>'}</div>
<div class="fee">${CM ? 'Covers every step of the full production plan. ' : ''}One delivery per building pair. Game fee: about 1 cent per delivery.</div></div>`;
      h += `<div class="card"><h2><span class="n">8</span>Approve</h2><button class="approve" disabled style="opacity:.5;cursor:not-allowed">APPROVE IN WALLET (${nmv} deliver${nmv === 1 ? 'y' : 'ies'}${S.feed ? ' + feed crew' : ''})</button>
<div class="hint">Test version: sending is switched off, so nothing can be sent yet.</div></div>`;
      h += `<div class="card"><h2><span class="n">9</span>Finish in the game</h2><div class="src">Each delivery shows up for the crew as a ready Surface Transfer. Use "Finish All Ready Items" in the game.</div></div>`;
    }
    m.innerHTML = h;
    const on = (id, ev, f) => { const e = document.getElementById(id); if (e) e.addEventListener(ev, f); };
    on('dk-rock', 'change', (e) => { S.rock = e.target.value; S.dest = 0; S.destSet = false; S.bld = 0; S.proc = -1; S.crew = 0; S.feed = false; render(); });
    on('dk-dest', 'change', (e) => { S.dest = +e.target.value; S.destSet = true; render(); });
    on('dk-bld', 'change', (e) => { S.bld = +e.target.value; render(); });
    on('dk-proc', 'change', (e) => { S.proc = +e.target.value; S.destSet = false; S.stepDest = {}; render(); });
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
  }

  // ---------- start ----------
  function start() {
    build();
    loadRecipes().then(() => {
      const wait = setInterval(() => { if (D() && R) { clearInterval(wait); S.ready = true; render(); } }, 400);
    });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
