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

  const CSS = "#dk-ov{\n  --amber:#ffb03b; --amber2:#ff8a1f; --cyan:#8fe3ff; --steel:#2a3140; --steel2:#3a4356;\n  --ink:#dfe7f2; --dim:#8a96aa; --red:#ff4d4d; --green:#3fd68a;\n}\n#dk-ov *{box-sizing:border-box}\n#dk-ov{position:fixed!important;inset:0;z-index:2147483000!important;overflow:auto;background:#05070c;color:var(--ink);font-family:Rajdhani,system-ui,sans-serif}\n#dk-ov{display:flex;align-items:center;justify-content:center;padding:18px}\n#dk-ov .wrap{display:flex;gap:26px;align-items:center;max-width:1180px;width:100%}\n#dk-ov .chamber{position:relative;flex:1 1 640px;aspect-ratio:16/11;border-radius:18px;overflow:hidden;\n  background:linear-gradient(#141923,#0b0e15 60%,#10141d);box-shadow:0 0 0 2px #1d2330 inset,0 20px 60px #000a}\n#dk-ov .chamber svg.walls{position:absolute;inset:0;width:100%;height:100%}\n#dk-ov .beacon{position:absolute;top:4.5%;width:7%;aspect-ratio:2/1;border-radius:40px 40px 6px 6px;\n  background:radial-gradient(ellipse at 50% 80%,#ffd27a,var(--amber2) 55%,#5a2a00);box-shadow:0 0 18px var(--amber2);opacity:.55}\n#dk-ov .beacon.l{left:9%}\n#dk-ov .beacon.r{right:9%}\n#dk-ov .cycling .beacon{animation:flash .5s infinite alternate}\n@keyframes flash{from{opacity:.25;box-shadow:0 0 4px var(--amber2)}to{opacity:1;box-shadow:0 0 40px 10px var(--amber2)}}\n#dk-ov .sweep{position:absolute;inset:0;pointer-events:none;opacity:0;\n  background:radial-gradient(ellipse at 50% 0%,#ff9a2a55,transparent 60%)}\n#dk-ov .cycling .sweep{animation:sweep .5s infinite alternate}\n@keyframes sweep{from{opacity:0}to{opacity:1}}\n#dk-ov .frame{position:absolute;left:19%;right:19%;top:15%;bottom:9%;border-radius:22px 22px 8px 8px;overflow:hidden;\n  box-shadow:0 0 0 10px #1a202b,0 0 0 13px #3b4558,0 0 0 22px #141922,0 0 0 24px #000}\n#dk-ov .dock{position:absolute;inset:0;transition:transform 2.4s ease}\n#dk-ov .open .dock{transform:scale(1.08)}\n#dk-ov .dock svg{width:100%;height:100%;display:block}\n#dk-ov .door{position:absolute;top:0;bottom:0;width:50.4%;transition:transform 2.2s cubic-bezier(.7,0,.3,1) .3s;\n  --hole:13%;}\n#dk-ov .door.l{left:0;\n  -webkit-mask:radial-gradient(circle at 100% 42%,transparent 62px,#000 63px);\n          mask:radial-gradient(circle at 100% 42%,transparent 62px,#000 63px);\n  background:\n   radial-gradient(circle at 100% 42%,transparent 62px,#b7c2d3 63px,#5d687c 70px,#2b3240 76px,transparent 77px),\n   repeating-linear-gradient(135deg,var(--amber) 0 18px,#111 18px 36px) right/22px 100% no-repeat,\n   linear-gradient(90deg,#283041,#3a4458 60%,#2d3546);\n}\n#dk-ov .door.r{right:0;\n  -webkit-mask:radial-gradient(circle at 0% 42%,transparent 62px,#000 63px);\n          mask:radial-gradient(circle at 0% 42%,transparent 62px,#000 63px);\n  background:\n   radial-gradient(circle at 0% 42%,transparent 62px,#b7c2d3 63px,#5d687c 70px,#2b3240 76px,transparent 77px),\n   repeating-linear-gradient(45deg,var(--amber) 0 18px,#111 18px 36px) left/22px 100% no-repeat,\n   linear-gradient(270deg,#283041,#3a4458 60%,#2d3546);\n}\n#dk-ov .door::before{content:\"\";position:absolute;left:12%;right:12%;bottom:8%;height:16%;border-radius:4px;\n  background:repeating-linear-gradient(0deg,#1d2330 0 6px,#323b4d 6px 9px);box-shadow:0 0 0 2px #1a1f2a}\n#dk-ov .door::after{content:\"\";position:absolute;left:14%;right:14%;top:7%;height:6%;border-radius:3px;\n  background:linear-gradient(#232a37,#3b4558);box-shadow:0 0 0 2px #151a23}\n#dk-ov .door .lbl{position:absolute;top:66%;font-weight:700;letter-spacing:.12em;font-size:clamp(10px,1.4vw,15px);color:#ffcf7a;opacity:.85}\n#dk-ov .door.l .lbl{right:30%}\n#dk-ov .door.r .lbl{left:30%}\n#dk-ov .open .door.l{transform:translateX(-101%)}\n#dk-ov .open .door.r{transform:translateX(101%)}\n#dk-ov .glass{position:absolute;left:50%;top:42%;width:124px;height:124px;margin:-62px 0 0 -62px;border-radius:50%;\n  pointer-events:none;background:radial-gradient(circle at 35% 30%,#ffffff22,transparent 45%);transition:opacity .4s .3s}\n#dk-ov .open .glass{opacity:0}\n#dk-ov .sign{position:absolute;left:50%;top:5.5%;transform:translateX(-50%);padding:4px 16px;border-radius:6px;\n  background:#0c0f15;box-shadow:0 0 0 2px #2c3444;font-weight:700;letter-spacing:.18em;font-size:clamp(11px,1.5vw,16px);\n  color:var(--red);text-shadow:0 0 8px currentColor;white-space:nowrap}\n#dk-ov .sign.amber{color:var(--amber)}\n#dk-ov .sign.green{color:var(--green)}\n#dk-ov .panel{flex:0 0 360px;background:linear-gradient(#141923,#0e121a);border-radius:14px;padding:20px 22px;\n  box-shadow:0 0 0 2px #232a37 inset,0 0 0 1px #000;position:relative;overflow:hidden}\n#dk-ov .panel::before{content:\"\";position:absolute;left:0;right:0;top:0;height:10px;\n  background:repeating-linear-gradient(45deg,var(--amber) 0 12px,#111 12px 24px)}\n#dk-ov h1{margin:6px 0 2px;font-size:26px;letter-spacing:.14em;color:var(--amber)}\n#dk-ov .sub{color:var(--dim);font-size:15px;margin-bottom:14px;letter-spacing:.05em}\n#dk-ov .warn{border-left:4px solid var(--amber);background:#ffb03b12;padding:10px 12px;border-radius:4px;font-size:17px;line-height:1.3}\n#dk-ov .warn b{color:#ffd28a}\n#dk-ov ul{margin:12px 0 14px;padding-left:20px;font-size:16px;line-height:1.35;color:#cdd6e3}\n#dk-ov li{margin:4px 0}\n#dk-ov label{display:flex;gap:10px;align-items:flex-start;font-size:16px;margin:10px 0;cursor:pointer;line-height:1.25}\n#dk-ov input[type=checkbox]{width:20px;height:20px;margin:0;flex:0 0 auto;accent-color:var(--amber)}\n#dk-ov .btn{display:block;width:100%;margin-top:14px;padding:12px;border:0;border-radius:8px;font:700 18px Rajdhani,sans-serif;\n  letter-spacing:.14em;cursor:pointer;color:#1a1000;background:linear-gradient(#ffc45e,var(--amber2));box-shadow:0 0 18px #ff8a1f55}\n#dk-ov .btn:disabled{cursor:not-allowed;color:#6b7383;background:#232a37;box-shadow:none}\n#dk-ov .back{display:inline-block;margin-top:14px;color:var(--cyan);text-decoration:none;font-size:16px}\n#dk-ov .back:hover{text-decoration:underline}\n#dk-ov .bar{height:8px;border-radius:4px;background:#1d2330;margin-top:12px;overflow:hidden;display:none}\n#dk-ov .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--amber2),#ffd27a)}\n#dk-ov .cycling .bar{display:block}\n#dk-ov .cycling .bar i{transition:width 2.6s linear;width:100%}\n#dk-ov .done{display:none;margin-top:12px;color:var(--green);font-size:17px}\n#dk-ov .reset{background:none;border:0;color:var(--dim);font:500 14px Rajdhani,sans-serif;cursor:pointer;margin-top:10px;padding:0;text-decoration:underline}\n#dk-ov .mock{position:absolute;right:12px;bottom:10px;font-size:12px;color:#5c6577;letter-spacing:.1em}\n#dk-ov.indock{display:block;padding:0}\n#dk-ov .wrap{transition:opacity .6s}\n#dk-ov .wrap.gone{opacity:0}\n#dk-ov #dockpg{display:none;max-width:980px;margin:0 auto;padding:0 18px 40px}\n#dk-ov.indock #dockpg{display:block;animation:fadein .6s}\n@keyframes fadein{from{opacity:0}to{opacity:1}}\n#dk-ov .stripe{height:10px;background:repeating-linear-gradient(45deg,var(--amber) 0 12px,#111 12px 24px)}\n#dk-ov .dhead{position:sticky;top:0;z-index:5;background:#05070c;padding-top:0}\n#dk-ov .dhead .in{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0 10px;flex-wrap:wrap}\n#dk-ov .dhead h1{margin:0}\n#dk-ov .live{display:flex;align-items:center;gap:8px;font-weight:700;letter-spacing:.08em;color:#ffd28a;font-size:15px;\n  border:1px solid #ffb03b66;background:#ffb03b14;border-radius:20px;padding:4px 12px}\n#dk-ov .live i{width:9px;height:9px;border-radius:50%;background:var(--amber);box-shadow:0 0 8px var(--amber);animation:flash 1s infinite alternate}\n#dk-ov .card{background:linear-gradient(#141923,#0e121a);border-radius:12px;box-shadow:0 0 0 1px #232a37 inset;padding:14px 18px;margin:14px 0}\n#dk-ov .card h2{margin:0 0 10px;font-size:19px;letter-spacing:.08em;color:var(--ink);display:flex;align-items:center;gap:10px}\n#dk-ov .card h2 .n{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#ffb03b22;color:var(--amber);font-size:15px;box-shadow:0 0 0 1px #ffb03b66 inset}\n#dk-ov .card.fly{box-shadow:0 0 0 1px #9a6bff66 inset}\n#dk-ov .card.fly h2 .n{background:#9a6bff22;color:#c4a8ff;box-shadow:0 0 0 1px #9a6bff88 inset}\n#dk-ov .row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}\n#dk-ov select,#dk-ov input[type=number]{background:#0b0e14;color:var(--ink);border:1px solid #3a4356;border-radius:6px;padding:7px 10px;font:600 16px Rajdhani,sans-serif;min-width:220px}\n#dk-ov input[type=number]{min-width:0;width:90px}\n#dk-ov .hint{color:var(--dim);font-size:15px;margin-top:6px}\n#dk-ov .cap{flex:1 1 260px}\n#dk-ov .capbar{height:10px;border-radius:5px;background:#1d2330;overflow:hidden;margin-top:4px;position:relative}\n#dk-ov .capbar i{position:absolute;left:0;top:0;bottom:0;background:#4f90ff}\n#dk-ov .capbar b{position:absolute;top:0;bottom:0;background:var(--amber)}\n#dk-ov table{width:100%;border-collapse:collapse;font-size:16px}\n#dk-ov th{text-align:left;color:var(--dim);font-weight:600;padding:6px 8px;border-bottom:1px solid #2a3140;letter-spacing:.04em}\n#dk-ov td{padding:7px 8px;border-bottom:1px solid #1b212c;vertical-align:top}\n#dk-ov td.num,#dk-ov th.num{text-align:right;white-space:nowrap}\n#dk-ov .ok{color:var(--green)}\n#dk-ov .short{color:#c4a8ff}\n#dk-ov .src{color:#cdd6e3;font-size:15px}\n#dk-ov .mv td:first-child{width:28px}\n#dk-ov .fee{color:var(--dim);font-size:15px;margin-top:8px}\n#dk-ov .approve{display:block;width:100%;padding:14px;border:0;border-radius:10px;font:700 20px Rajdhani,sans-serif;letter-spacing:.12em;cursor:pointer;\n  color:#1a1000;background:linear-gradient(#ffc45e,var(--amber2));box-shadow:0 0 22px #ff8a1f55}\n#dk-ov .mocknote{text-align:center;color:#5c6577;font-size:13px;letter-spacing:.1em;margin-top:18px}\n#dk-ov .toast{display:none;margin-top:10px;padding:10px 12px;border-radius:8px;background:#3fd68a18;color:var(--green);border:1px solid #3fd68a55}\n@media (max-width:900px){#dk-ov .wrap{flex-direction:column}\n#dk-ov .panel{flex:none;width:100%}\n#dk-ov .chamber{width:100%;flex:none}\n}\n@media (max-width:560px){#dk-ov .door.l{-webkit-mask:radial-gradient(circle at 100% 42%,transparent 38px,#000 39px);mask:radial-gradient(circle at 100% 42%,transparent 38px,#000 39px)}\n#dk-ov .door.r{-webkit-mask:radial-gradient(circle at 0% 42%,transparent 38px,#000 39px);mask:radial-gradient(circle at 0% 42%,transparent 38px,#000 39px)}\n#dk-ov .glass{width:76px;height:76px;margin:-38px 0 0 -38px}\n\n}\n\n";
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

  const S = { ok: false, rock: '', dest: 0, bld: 0, proc: -1, runs: 1000, crew: 0, feed: false, ready: false };

  // ---------- overlay + airlock ----------
  function build() {
    if (document.getElementById('dk-ov')) return;
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap'; document.head.appendChild(l);
    const st = document.createElement('style'); st.textContent = CSS + '#dk-ov input[type=number]{width:110px!important;flex:none!important}#dk-ov tr,#dk-ov tr:hover td{background:none!important}#dk-ov .card{border:0!important}'; document.head.appendChild(st);
    const ov = document.createElement('div'); ov.id = 'dk-ov';
    ov.innerHTML = WRAP + '<div id="dockpg"><div class="dhead"><div class="stripe"></div><div class="in"><h1>LOADING DOCK</h1>' +
      '<div class="live"><i></i>THIS PAGE SENDS GAME ACTIONS FROM YOUR WALLET</div></div></div><div id="dk-main"></div>' +
      '<div class="mocknote">TEST VERSION · SENDING IS SWITCHED OFF · <a href="#" data-dkback style="color:var(--cyan)">back to the Command Deck</a></div></div>';
    document.body.appendChild(ov);
    // app.js rewrites <head> and <body> while it loads – keep putting the dock back on top
    const keep = () => { if (!l.isConnected) document.head.appendChild(l); if (!st.isConnected) document.head.appendChild(st); if (!ov.isConnected) document.body.appendChild(ov); document.documentElement.style.overflow = 'hidden'; };
    keep(); setInterval(keep, 400);
    ov.addEventListener('click', (e) => { const a = e.target.closest('[data-dkback]'); if (a) { e.preventDefault(); location.href = location.pathname + location.search.replace(/[?&]dock=1\b/, '').replace(/^&/, '?'); } });
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
      wrap.classList.add('cycling'); ch.classList.add('cycling'); setSign('● CYCLING…', 'amber');
      setTimeout(() => {
        wrap.classList.remove('cycling'); ch.classList.remove('cycling'); setSign('● DOOR OPEN', 'green'); ch.classList.add('open');
        setTimeout(() => wrap.classList.add('gone'), 2300);
        setTimeout(() => { wrap.style.display = 'none'; ov.classList.add('indock'); ov.scrollTop = 0; S.ok = true; render(); }, 2900);
      }, 2800);
    });
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
      if (left > 0) fly.push({ p, q: left, where: (window.YICSRCTXT && window.YICSRCTXT(p, left, astId(S.rock))) || '' });
      rows.push(row);
    });
    const cap = CAP[dest.Building.buildingType];
    const nowG = di.mass + (di.reservedMass || 0), nowV = di.volume + (di.reservedVolume || 0);
    const pctNow = Math.max(nowG / cap[0], nowV / cap[1]) * 100, pctAfter = Math.max((nowG + addG) / cap[0], (nowV + addV) / cap[1]) * 100;
    return { dest, bl, rec, rows, fly, moves: Object.values(moves), pctNow, pctAfter };
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
    if (!store.find((b) => b.id === S.dest)) S.dest = store[0] ? store[0].id : 0;
    const pb = procB();
    if (!pb.find((b) => b.id === S.bld)) { S.bld = pb[0] ? pb[0].id : 0; S.proc = -1; }
    const bl = pb.find((b) => b.id === S.bld);
    const procs = bl ? R.filter((r) => FBT[r.type] === bl.Building.buildingType).sort((a, b) => a.name.localeCompare(b.name)) : [];
    if (!procs.find((r) => r.i === S.proc)) S.proc = procs[0] ? procs[0].i : -1;
    const cl = crews();
    if (!cl.find((c) => c.id === S.crew)) S.crew = (cl.find((c) => !c.busy) || cl[0] || {}).id || 0;
    const P = plan();
    const rec = R[S.proc];

    let h = '';
    h += `<div class="card"><h2><span class="n">1</span>Rock</h2><select id="dk-rock">${rl.map((r) => opt(r, r, S.rock)).join('')}</select></div>`;
    h += `<div class="card"><h2><span class="n">2</span>Stage into</h2><div class="row"><select id="dk-dest">${store.map((b) => opt(b.id, nm(b) + ' – ' + (b.Building.buildingType === TANK ? 'tank farm' : 'warehouse'), S.dest)).join('')}</select>`;
    if (P) h += `<div class="cap"><span class="src">${esc(nm(P.dest))}: ${P.pctNow.toFixed(0)}% full now</span><div class="capbar"><i style="width:${Math.min(100, P.pctNow)}%"></i><b style="left:${Math.min(100, P.pctNow)}%;width:${Math.max(0.6, Math.min(100 - P.pctNow, P.pctAfter - P.pctNow))}%"></b></div></div>`;
    h += `</div><div class="hint">${P && P.dest.Building.buildingType === TANK ? '<span style="color:var(--amber)">Tank farms only take gases and liquids.</span>' : 'Blue = in there now · amber = what this will add.'}</div></div>`;
    h += `<div class="card"><h2><span class="n">3</span>Building and process</h2>`;
    if (!pb.length) h += '<div class="src">No refinery, factory, bioreactor or shipyard on this rock.</div>';
    else h += `<div class="row"><select id="dk-bld">${pb.map((b) => opt(b.id, nm(b) + ' – ' + BTN[b.Building.buildingType].toLowerCase() + ' (' + busyTxt(b) + ')', S.bld)).join('')}</select>
<select id="dk-proc">${procs.map((r) => opt(r.i, r.name, S.proc)).join('')}</select></div>`;
    h += '</div>';
    if (rec) {
      const outs = Object.keys(rec.out).map((p) => amt(+p, rec.out[p] * S.runs) + ' ' + esc(pname(p))).join(' + ');
      h += `<div class="card"><h2><span class="n">4</span>How many runs</h2><div class="row"><input type="number" id="dk-runs" min="1" step="1" value="${S.runs}"> <span class="src">× runs</span></div><div class="hint">Makes ${outs}</div></div>`;
    }
    if (P) {
      h += `<div class="card"><h2><span class="n">5</span>Inputs needed</h2><table><thead><tr><th>Input</th><th class="num">Needed</th><th class="num">Already there</th><th class="num">To move</th><th>From</th></tr></thead><tbody>` +
        P.rows.map((r) => `<tr><td>${esc(pname(r.p))}</td><td class="num">${amt(r.p, r.need)}</td><td class="num">${amt(r.p, r.there)}</td><td class="num">${amt(r.p, r.moved)}</td><td class="src">` +
          (r.need - r.there <= 0 ? '<span class="ok">✓ already there</span>' : '') +
          r.from.map(([b, q]) => esc(nm(b)) + ' (' + amt(r.p, q) + ')').join('<br>') +
          (r.bad ? '<span style="color:var(--red)">✗ ' + r.bad + '</span>' : r.short > 0 ? (r.from.length ? '<br>' : '') + '<span class="short">' + amt(r.p, r.short) + ' short – fly in</span>' : '') +
          '</td></tr>').join('') + '</tbody></table></div>';
      if (P.fly.length) h += `<div class="card fly"><h2><span class="n">✈</span>Fly in yourself</h2><div class="hint" style="margin:0 0 8px">Not enough on this rock. This page does not fly ships – bring these in, then come back.</div>
<table><thead><tr><th>Input</th><th class="num">Short by</th><th>Where from</th></tr></thead><tbody>${P.fly.map((f) => `<tr><td>${esc(pname(f.p))}</td><td class="num short">${amt(f.p, f.q)}</td><td class="src">${f.where || 'not on your other rocks – try the market'}</td></tr>`).join('')}</tbody></table></div>`;
      // crew + feeding
      const c = cl.find((x) => x.id === S.crew);
      h += `<div class="card"><h2><span class="n">6</span>Crew to do the moving</h2>`;
      if (!cl.length) h += '<div class="src" style="color:var(--red)">None of your crews is on this rock – a crew must be on the rock to move goods.</div>';
      else {
        h += `<select id="dk-crew">${cl.map((x) => opt(x.id, x.name + ' – fed ' + Math.round(x.food * 100) + '%' + (x.fm < 1 ? ' (hungry, slower)' : '') + ' · free distance ×' + x.free.toFixed(2) + (x.busy ? ' · busy until ' + x.busy : ' · ready now'), S.crew)).join('')}</select>
<div class="hint">Must be on this rock. Best fed crew with the best transport bonus is picked for you.</div>`;
        if (c && c.food < 0.95) {
          const yrs = Math.min(1, c.food >= 0.5 ? 1 - c.food : (0.75 - c.food) / 0.5), need = Math.floor(c.mates * 1000 * yrs);
          const src = onRock().filter(isStore).map((b) => [b, ((inv(b) || { contents: [] }).contents).reduce((s, x) => s + (x.product === FOOD ? x.amount : 0), 0)]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1])[0];
          h += `<div style="margin-top:10px;padding:10px 12px;border-radius:8px;background:#3fd68a12;border:1px solid #3fd68a55"><div style="color:var(--amber);margin-bottom:6px">${c.fm < 1 ? '⚠ ' + esc(c.name) + ' is hungry – moves will be slower.' : esc(c.name) + ' is ' + Math.round(c.food * 100) + '% fed.'}</div>` +
            (src ? `<label style="margin:0"><input type="checkbox" id="dk-feed"${S.feed ? ' checked' : ''}> Feed ${esc(c.name)} first: ${tonnes(Math.min(need, src[1]))} Food from ${esc(nm(src[0]))}</label><div class="hint">Feeding goes in the same wallet approval, before the moves.</div>`
              : '<div class="src">No Food stored on this rock to feed it.</div>') + '</div>';
        } else S.feed = false;
      }
      h += '</div>';
      const nmv = P.moves.length;
      h += `<div class="card"><h2><span class="n">7</span>Moves to send</h2><table class="mv"><thead><tr><th></th><th>From</th><th>Goods</th><th>To</th></tr></thead><tbody>` +
        (P.moves.map((x) => `<tr><td><input type="checkbox" checked disabled></td><td class="src">${esc(nm(x.b))}</td><td>${x.items.map((it) => esc(pname(it.p)) + ' ' + amt(it.p, it.a)).join('<br>')}</td><td class="src">${esc(nm(P.dest))}</td></tr>`).join('') || '<tr><td></td><td colspan="3" class="src">Nothing to move.</td></tr>') +
        `</tbody></table><div class="fee">${P.pctAfter > 95 ? '<span style="color:var(--red)">✗ Not enough room – ' + esc(nm(P.dest)) + ' would be ' + P.pctAfter.toFixed(0) + '% full.</span>' : '<span class="ok">✓ Room OK – ' + esc(nm(P.dest)) + ' will be ' + P.pctAfter.toFixed(0) + '% full.</span>'}</div>
<div class="fee">One delivery per building it comes from. Game fee: about 1 cent per delivery.</div></div>`;
      h += `<div class="card"><h2><span class="n">8</span>Approve</h2><button class="approve" disabled style="opacity:.5;cursor:not-allowed">APPROVE IN WALLET (${nmv} deliver${nmv === 1 ? 'y' : 'ies'}${S.feed ? ' + feed crew' : ''})</button>
<div class="hint">Test version: sending is switched off, so nothing can be sent yet.</div></div>`;
      h += `<div class="card"><h2><span class="n">9</span>Finish in the game</h2><div class="src">Each delivery shows up for the crew as a ready Surface Transfer. Use "Finish All Ready Items" in the game.</div></div>`;
    }
    m.innerHTML = h;
    const on = (id, ev, f) => { const e = document.getElementById(id); if (e) e.addEventListener(ev, f); };
    on('dk-rock', 'change', (e) => { S.rock = e.target.value; S.dest = 0; S.bld = 0; S.proc = -1; S.crew = 0; S.feed = false; render(); });
    on('dk-dest', 'change', (e) => { S.dest = +e.target.value; render(); });
    on('dk-bld', 'change', (e) => { S.bld = +e.target.value; S.proc = -1; render(); });
    on('dk-proc', 'change', (e) => { S.proc = +e.target.value; render(); });
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
