/* Storage tidy – Skippy's Awesome Command Deck (Mark, 6 Nov 2026) – TEST ONLY (?beta=1)
   Step 1 of the "move all X to X on X" plan (claude/storage-tidy-plan-2026-11-06.md): rename storage
   buildings to the "Skippys X" standard. The page shows exactly what will happen; nothing is sent
   until the player presses Approve AND approves again in their own wallet.
   Only the game's ChangeName and SendDelivery systems are ever called, only on buildings the wallet's crews control,
   and the connected wallet must be the one the page is showing. No pasted code, no other actions.
   Step 2 (6 Nov 2026): move goods with the game's SendDelivery, all in one approval.
   Call formats checked against @influenceth/sdk 2.8.1 System.getRunSystemCall:
   run_system('ChangeName', [5, buildingId, name, 1, crewId])
   run_system('SendDelivery', [5, fromId, slot, n, (product, amount)×n, 5, toId, slot, 1, crewId]). */
(function () {
  'use strict';
  if (!/[?&]beta=1\b/.test(location.search)) return; // test only

  const DISPATCHER = '0x0422d33a3638dcc4c62e72e1d6942cd31eb643ef596ccac2351e0e21f6cd4bf4';
  // Newark plan, agreed by Mark 6 Nov 2026 (building id, name now, new name)
  const PLANS = [{
    rock: 'Newark',
    renames: [
      [40805, 'Skippys Iron', "Skippys Troilite"],
      [41334, 'Skippys Raw Metals', "Skippys Taenite"],
      [41429, 'Skippys Supply Co Ltd', "Skippys Steel"],
      [34498, 'Skippys Propellent Processin', "Skippys Gases"],
      [24646, 'Skippys Newark Warehouse', "Skippys Supplies"],
    ],
    // Step 2 – moves (from building, to building, product ids). Each move sends the FULL amount the
    // "from" building holds right now (read live), out of and into the main storage slot.
    moves: [
      [40805, 41334, [20]],          // Troilite → Taenite: Taenite
      [41334, 34498, [7, 6, 23]],    // Taenite → Gases: Carbon Monoxide, Carbon Dioxide, Oxygen
      [41334, 41429, [31, 19]],      // Taenite → Steel: Nickel, Graphite
      [41334, 24646, [18, 37]],      // Taenite → Supplies: Rhabdite, Iron Sulfide
      [24646, 34498, [5]],           // Supplies → Gases: Sulfur Dioxide
      [34498, 24646, [66, 169]],     // Gases → Supplies: Silica Powder, Tungsten Powder
      [41438, 24646, [25]],          // Water → Supplies: Raw Salts
    ],
  }, {
    // TRCS Leisure Potato – Mark's first rock, fully built, home of the Den of Iniquity (agreed 6 Nov 2026).
    // Kept as they are: Skippys Moonshine, Hydrogen, Nitrogen, Oxygen, Ammonia, Sulfur Dioxide, Burgers,
    // Building Supplies, Ship Parts, Modules, HT Assembly, Supply Co LTD. Moves come later.
    rock: 'TRCS Leisure Potato',
    renames: [
      [31376, 'Skippys HydroNitro Tank Farm', 'Skippys Nitrogen 2'],
      [32085, 'Skippys Water Store', 'Skippys Water'],
      [31889, 'Skippys Fuel Tank Farm', 'Skippys Fuel'],
      [37870, 'Skippys Oxides', 'Skippys Carbon Gases'],
      [31649, 'Skippys Acid', 'Skippys Spare Tank 1'],
      [32661, 'Skippys Deliveries', 'Skippys Spare Tank 2'],
      [32779, 'Skippys Sulfur Dioxide 1', 'Skippys Spare Tank 3'],
      [32778, 'Skippys Sulfur Dioxide 3', 'Skippys Spare Tank 4'],
      [39277, 'Skippys Hydrogen II', 'Skippys Spare Tank 5'],
      [32305, 'Skippys Bare Rocks', 'Skippys Rocks'],
      [32307, 'Skippys Pyroxene Olivine', 'Skippys Rocks 2'],
      [30437, 'Skippys Farts', 'Skippys Oxides'],
      [25462, 'Skippys Store', 'Skippys Oxides 2'],
      [30438, 'Skippys Rock Storage', 'Skippys Salts'],
      [4723, 'Skippys Steel Production', 'Skippys Metals'],
      [22598, 'Skippys Ship Building', 'Skippys Glass and Fibre'],
      [41854, 'Skippys Barrels', 'Skippys Acids'],
      [4623, 'Skippys Mixing WH1', 'Skippys Mixing'],
    ],
    moves: [],
    extractors: true,
    // Moves by rule (agreed 6 Nov 2026): every product goes to the building for its type (groups below,
    // first building first, then the next one once it would pass 95% full). Goods already in a building of
    // their own group stay put. Supply Co LTD is left alone. Any of the wallet's crews on the rock may send
    // (same wallet = "shared delegate" in the game's permission rules), so one mover crew does it all:
    // Skippys Sales Crew – best free transport distance (x1.5) on the rock (Mark's choice).
    rules: {
      mover: 7694,
      stay: ['Skippys Supply Co LTD'],
      groups: {
        H: ['Moonshine', 'Hydrogen'], W: ['Water'], N: ['Nitrogen', 'Nitrogen 2'], O: ['Oxygen'], S: ['Sulfur Dioxide'],
        C: ['Carbon Gases'], A: ['Ammonia'], F: ['Fuel'], R: ['Rocks', 'Rocks 2'], X: ['Oxides', 'Oxides 2'], L: ['Salts'],
        Q: ['Acids'], M: ['Metals'], G: ['Glass and Fibre'], B: ['Building Supplies'], P: ['Ship Parts', 'HT Assembly'],
        U: ['Modules'], K: ['Burgers'], Z: ['Mixing'],
      },
    },
  }];
  // product id -> [grams per unit, volume per unit] (@influenceth/sdk 2.8.1 Product.TYPES)
  const MV = {"1":[1000,971],"2":[1000,14100],"3":[1000,1370],"4":[1000,1240],"5":[1000,684],"6":[1000,801],"7":[1000,1250],"8":[1000,2220],"9":[1000,521],"10":[1000,1600],"11":[1000,615],"12":[1000,606],"13":[1000,617],"14":[1000,476],"15":[1000,327],"16":[1000,521],"17":[1000,358],"18":[1000,233],"19":[1000,737],"20":[1000,208],"21":[1000,362],"22":[1000,156],"23":[1000,876],"24":[1000,1000],"25":[1000,775],"26":[1000,629],"27":[1000,1300],"28":[1000,909],"29":[1000,140],"30":[1000,123],"31":[1000,161],"32":[1000,599],"33":[1000,1440],"34":[1000,1330],"35":[1000,870],"36":[1000,595],"37":[1000,344],"38":[1000,219],"39":[1000,319],"40":[1000,329],"41":[1000,415],"42":[1000,1260],"43":[1000,123],"44":[1000,1130],"45":[1000,1410],"46":[1000,842],"47":[1000,963],"48":[1000,948],"49":[1000,718],"50":[1000,2040],"51":[1000,805],"52":[1000,159],"53":[1000,715],"54":[1000,893],"55":[1000,687],"56":[1000,714],"57":[1000,271],"58":[1000,521],"59":[1000,1050],"60":[1000,119],"61":[1000,65],"62":[1000,171],"63":[1000,387],"64":[1000,2500],"65":[1000,426],"66":[1000,755],"67":[1000,148],"68":[1000,886],"69":[1000,1100],"70":[1000,150],"71":[1000,1200],"72":[1000,150],"73":[1000,1230],"74":[1000,1570],"75":[1000,632],"76":[1000,4020],"77":[1000,787],"78":[1000,775],"79":[1000,739],"80":[1000,751],"81":[1000,1040],"82":[1000,1090],"83":[1000,694],"84":[1000,1390],"85":[1000,357],"86":[1000,300],"87":[1000,559],"88":[1000,460],"89":[1000,671],"90":[1000,674],"91":[1000,1530],"92":[1000,1520],"93":[1000,1110],"94":[1000,681],"95":[1000,222],"96":[1000,172],"97":[1000,316],"98":[1000,135],"99":[1000,152],"100":[1000,472],"101":[1000,182],"102":[1000,1210],"103":[1000,1820],"104":[1000,58],"105":[1000,805],"106":[1000,175],"107":[1000,1060],"108":[1000,1040],"109":[1000,272],"110":[1000,1090],"111":[1000,463],"112":[1000,1290],"113":[1000,617],"114":[1000,333],"115":[1000,593],"116":[1000,1520],"117":[1000,435],"118":[1000,220],"119":[1000,800],"120":[1000,800],"121":[1000,1480],"122":[1000,3190],"123":[1000,436],"124":[1000,3190],"125":[1000,2820],"126":[3000,1725],"127":[3000,1725],"128":[1000,1750],"129":[1000,1250],"130":[6000,87000],"131":[1000,595],"132":[1000,212],"133":[2000000,8640000],"134":[1000,543],"135":[1000,3770],"136":[1000,1680],"137":[1000,251],"138":[1000,363],"139":[1000,661],"140":[1000,1020],"141":[1000,168],"142":[1000,370],"143":[1000,435],"144":[300000,570000],"145":[1500000,21000000],"146":[600000,50520000],"147":[1000000,21100000],"148":[5000000,347500000],"149":[1850000,262700000],"150":[3500000,511000000],"151":[1000,140],"152":[1000,417],"153":[1000,228],"154":[2000,17260],"155":[10000,100000],"156":[72000,11808000],"157":[8000,52640],"158":[5000,3160],"159":[1000,404],"161":[1000,348],"162":[1000,1670],"163":[1000,165],"164":[1000,65],"165":[44600000,16011400000],"166":[74200000,35987000000],"167":[10000000,1550000000],"168":[480400000,60530400000],"169":[1000,104],"170":[1000,13300],"171":[1000,150],"172":[1000,1200],"173":[1000,84],"174":[1000,79],"175":[30000,107100],"176":[1000,178],"178":[1000,174],"179":[1000,271],"180":[1000,1240],"181":[1000,242],"182":[1000,143],"183":[1000,142],"184":[1000,327],"185":[1000,327],"186":[1000,385],"187":[1000,179],"188":[1000,96],"189":[1000,689],"190":[1000,321],"191":[1000,561],"192":[1000,686],"193":[1000,397],"194":[1000,110],"195":[1000,672],"196":[1000,365],"197":[1000,833],"199":[1000,75],"200":[1000,989],"201":[1000,256],"202":[5000,8550],"203":[1000,500],"204":[3000,906],"205":[3000,1308],"206":[6000,1572],"207":[816000,1876800],"208":[144000,982080],"209":[8000,6624],"210":[75000,12150000],"211":[2000,118],"212":[2000,94200],"213":[1000,333],"214":[160000,808000],"215":[300000,3600000],"217":[1000,833],"218":[1000,509],"219":[1000,414],"220":[1000,7410],"221":[40000,25440],"222":[290000,220110],"224":[190000,63460],"225":[100000,23400],"226":[250000,116750],"227":[130000,112580],"229":[50000,396000],"230":[1942000,6991200],"231":[18700000,18139000],"232":[180000,583200],"233":[6000000,51600000],"234":[30000000,54600000],"235":[2200000,264000000],"236":[2000000,4860000],"237":[3600000,301320000],"238":[3600000,11736000],"239":[960000,2976000],"240":[500000,12200000],"241":[6665000,339915000],"242":[660000,2976600],"243":[1000000,3800000],"244":[1000000,399000],"245":[32000000,106560000]};
  // product id -> group letter (see groups above): gases/liquids by name, then by product category
  const GRP = {};
  '1W;2H;3A;4N;5S;6C;7C;8C;9R;10R;11R;12R;13R;14R;15R;16R;17R;18R;19R;20R;21R;22R;23O;24W;25L;26X;27G;28L;29M;30M;31M;32X;33G;34L;35L;36L;37L;38L;39L;40L;41G;42G;43B;44B;45L;46L;47L;48L;49L;50G;51M;52M;53M;54Q;55Q;56K;57M;58Z;59Q;60M;61M;62M;63X;64K;65X;66Z;67P;68G;69B;70B;71B;72B;73G;74G;75M;76A;77L;78L;79X;80L;81Q;82Q;83Q;84Q;85X;86X;87X;88X;89L;90L;91K;92K;93L;94L;95M;96X;97G;98M;99P;100G;101B;102G;103K;104M;105L;106M;107G;108G;109X;110L;111M;112M;113L;114Z;115L;116A;117L;118M;119P;120P;121P;122B;123B;124B;125G;126P;127P;128G;129K;130P;131G;132P;133P;134M;135M;136G;137X;138X;139L;140G;141M;142L;143L;144P;145P;146P;147P;148P;149P;150P;151M;152P;153P;154P;155P;156P;157P;158P;159L;161X;162G;163X;164M;165P;166P;167P;168P;169Z;170F;171B;172B;173P;174P;175B;176M;178M;179L;180N;181G;182M;183P;184L;185L;186P;187P;188M;189Z;190Z;191Z;192L;193L;194M;195L;196L;197G;199M;200G;201P;202P;203P;204P;205P;206P;207P;208P;209P;210P;211P;212P;213P;214P;215P;217L;218X;219G;220Z;221P;222P;224P;225P;226P;227P;229P;230P;231P;232P;233P;234P;235U;236U;237U;238U;239U;240U;241U;242U;243U;244U;245U'.split(';').forEach((t) => { GRP[+t.slice(0, -1)] = t.slice(-1); });
  const CAP = { 1: [1.5e12, 75e9], 10: [75e9, 997.5e9] }; // warehouse / tank farm: grams, volume
  const BATCH = 30; // deliveries ticked at a time (15 worked on 6 Nov; Mark: "lets try some more in one go")
  let PLAN = PLANS[1];
  const PN = { 5: 'Sulfur Dioxide', 6: 'Carbon Dioxide', 7: 'Carbon Monoxide', 18: 'Rhabdite', 19: 'Graphite', 20: 'Taenite', 23: 'Oxygen', 25: 'Raw Salts', 31: 'Nickel', 37: 'Iron Sulfide', 66: 'Silica Powder', 169: 'Tungsten Powder' };
  const SLOT = 2; // warehouse / tank farm main storage (inventoryType 10 / 19)
  // renames are done (6 Nov); step 2 goes all at once (Mark: "lets go for all at once this time")
  const S = { tick: {}, mtick: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }, sent: {}, busy: false, msg: '', tx: '' };
  PLANS[1].renames.forEach(([id]) => { S.tick[id] = true; }); // Leisure Potato: all renames ticked

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const D = () => (window.YIC && window.YIC.D) || null;
  const hex = (n) => '0x' + BigInt(n).toString(16);
  // Starknet short string (max 31 plain ASCII characters) → felt
  const short = (s) => {
    if (!/^[\x20-\x7e]{1,31}$/.test(s)) throw new Error('Name must be plain letters, numbers and symbols (max 31).');
    return '0x' + [...s].map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  };
  // the game's building-name rules (@influenceth/sdk Name.TYPES[BUILDING]): 4–28 characters, single spaces
  const nameErr = (s) => {
    if (s.length < 4 || s.length > 28) return 'must be 4 to 28 characters';
    if (!/^(\S+\s)*\S+$/.test(s)) return 'single spaces only, none at the ends';
    // the contract is stricter than the SDK: "Skippy's Troilite" failed with E6013 name invalid (6 Nov 2026)
    if (!/^[A-Za-z0-9 ]+$/.test(s)) return 'letters, numbers and spaces only';
    return '';
  };
  const sameAddr = (a, b) => { try { return BigInt(a) === BigInt(b); } catch (e) { return false; } };

  // all of the wallet's buildings on the rock this plan is for
  const onRock = (all) => all.filter((b) => b.meta && b.meta.asteroid && b.meta.asteroid.name === PLAN.rock);
  const lotIdx = (b) => { const l = ((b.Location && b.Location.locations) || []).find((x) => x.label === 4); return l ? Math.floor(l.id / 4294967296) : 0; };

  function rows() {
    const d = D(), all = (d && d.allB) || [];
    let list = PLAN.renames.slice();
    // blanket extractor names (Mark, 6 Nov 2026): "Skippys Extractor 1, 2, 3…" on each rock, numbered by lot.
    // Working extractors only; they go FIRST so a name an extractor is using (e.g. "Skippys Water") is freed up
    // before a storage building takes it in the same approval.
    if (PLAN.extractors) {
      const ex = onRock(all).filter((b) => b.Building.buildingType === 2 && b.Building.status === 3).sort((a, b) => lotIdx(a) - lotIdx(b));
      const xs = ex.map((b, k) => [b.id, (b.Name && b.Name.name) || '', 'Skippys Extractor ' + (k + 1), 1]);
      if (!S.xinit) { S.xinit = true; xs.forEach(([id]) => { S.tick[id] = true; }); }
      list = xs.concat(list);
    }
    const out = list.map(([id, was, to, isEx]) => {
      const b = all.find((x) => x.id === id);
      const now = b && b.Name && b.Name.name;
      const crew = b && b.Control && b.Control.controller && b.Control.controller.id;
      const crewName = (crew && d.crewN && d.crewN[crew]) || (crew ? 'Crew #' + crew : '');
      let state = 'ok', note = isEx ? 'Ready (extractor)' : 'Ready';
      if (!b) { state = 'no'; note = 'Not found in your buildings'; }
      else if (now === to) { state = 'done'; note = 'Already done ✓'; }
      else if (now !== was) { state = 'no'; note = 'Name has changed since the plan – skipped'; }
      else if (nameErr(to)) { state = 'no'; note = 'New name ' + nameErr(to); }
      return { id, was, to, now: now || (isEx ? '(no name)' : ''), crew, crewName, state, note, isEx };
    });
    // names must be unique on each rock (E6014: not unique) – play the ticked renames through in order
    const held = {};
    onRock(all).forEach((b) => { if (b.Name && b.Name.name) held[b.Name.name.toLowerCase()] = b.id; });
    out.forEach((x) => {
      if (x.state !== 'ok' || !S.tick[x.id]) return;
      const k = x.to.toLowerCase(), who = held[k];
      if (who && who !== x.id) {
        const ob = all.find((b) => b.id === who);
        x.state = 'no'; x.note = 'Name already used on this rock by ' + ((ob && ob.Name && ob.Name.name) ? 'another building' : 'building #' + who) + ' – skipped';
        return;
      }
      if (x.now) delete held[x.now.toLowerCase()];
      held[k] = x.id;
    });
    return out;
  }

  function css() {
    if (document.getElementById('st-css')) return;
    const s = document.createElement('style');
    s.id = 'st-css';
    s.textContent = `
#st-wrap{max-width:980px;margin:18px auto;padding:0 16px;color:#dbe7f5}
#st-wrap h2{margin:0 0 4px;color:#8fe3ff;font-size:22px}
#st-wrap .st-test{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:6px;background:#3a2a00;color:#ffd24a;font-size:12px;vertical-align:middle}
#st-wrap p{color:#b7c3d4;line-height:1.5;margin:8px 0}
#st-wrap table{width:100%;border-collapse:collapse;margin:14px 0;font-size:15px}
#st-wrap th,#st-wrap td{padding:9px 10px;border-bottom:1px solid #1d2734;text-align:left}
#st-wrap th{color:#8b9ab0;font-weight:600;font-size:13px}
#st-wrap td.st-to{color:#ffd24a;font-weight:700}
#st-wrap tr.st-off td{opacity:.55}
#st-wrap input[type=checkbox]{width:18px;height:18px;cursor:pointer}
#st-wrap .st-go{font:700 16px system-ui,sans-serif;padding:12px 22px;border-radius:10px;border:1px solid #57ff65;background:#0f2a14;color:#57ff65;cursor:pointer}
#st-wrap .st-go:disabled{opacity:.4;cursor:default}
#st-msg{margin-top:12px;padding:10px 12px;border-radius:8px;background:#0d1520;border:1px solid #2b5a72;display:none}
#st-msg.err{border-color:#ff564d;color:#ffb3ae}
#st-wrap .st-w{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
#st-wrap .st-w button{padding:8px 14px;border-radius:8px;border:1px solid #2b5a72;background:#131821;color:#e6ebf2;cursor:pointer}
#st-wrap a{color:#8fe3ff}`;
    document.head.appendChild(s);
  }

  function mrows() {
    const d = D(), all = (d && d.allB) || [];
    const byId = (id) => all.find((x) => x.id === id);
    const nm = (b, id) => (b && b.Name && b.Name.name) || 'Building #' + id;
    const crewOf = (b) => b && b.Control && b.Control.controller && b.Control.controller.id;
    if (PLAN.rules) return ruleRows(d, all);
    return PLAN.moves.map(([from, to, prods], i) => {
      const o = byId(from), t = byId(to);
      const inv = o && (o.Inventories || []).find((x) => x.slot === SLOT && x.status === 1);
      const items = prods.map((p) => ({ p, a: ((inv && inv.contents) || []).reduce((s, c) => s + (c.product === p ? c.amount : 0), 0) })).filter((x) => x.a > 0);
      const crew = crewOf(o), tcrew = crewOf(t);
      let state = 'ok', note = tcrew === crew ? 'Arrives on its own' : 'Needs accepting';
      if (!o || !t) { state = 'no'; note = 'Building not found'; }
      else if (!inv) { state = 'no'; note = 'No storage found'; }
      else if (!items.length) { state = 'done'; note = 'Nothing left to move ✓'; }
      return { i, key: String(i), from, to, fromN: nm(o, from), toN: nm(t, to), items, crew, crewName: (crew && d.crewN && d.crewN[crew]) || (crew ? 'Crew #' + crew : ''), state, note };
    });
  }

  function ruleRows(d, all) {
    const R = PLAN.rules, on = onRock(all).filter((b) => (b.Building.buildingType === 1 || b.Building.buildingType === 10) && b.Building.status === 3);
    const byName = (n) => on.find((b) => b.Name && b.Name.name === 'Skippys ' + n);
    const gid = {};
    Object.keys(R.groups).forEach((g) => { gid[g] = R.groups[g].map((n) => byName(n)).filter(Boolean).map((b) => b.id); });
    const inv = (b) => (b.Inventories || []).find((x) => x.slot === SLOT && x.status === 1);
    const used = {};
    on.forEach((b) => { const i = inv(b); used[b.id] = i ? [i.mass + (i.reservedMass || 0), i.volume + (i.reservedVolume || 0)] : [0, 0]; });
    const fits = (id, g, v) => { const b = on.find((x) => x.id === id), c = CAP[b.Building.buildingType]; return used[id][0] + g <= c[0] * 0.95 && used[id][1] + v <= c[1] * 0.95; };
    const out = {}, order = [];
    on.forEach((b) => {
      if (R.stay.includes(b.Name && b.Name.name)) return;
      const i = inv(b);
      if (!i) return;
      i.contents.forEach((c) => {
        if (!(c.amount > 0)) return;
        const g = GRP[c.product], list = gid[g] || [];
        if (!list.length || list.includes(b.id)) return; // no rule, or already in its place
        const mv = MV[c.product] || [1000, 1000], gr = c.amount * mv[0], vo = c.amount * mv[1];
        let to = list.find((id) => fits(id, gr, vo)), full = false;
        if (!to) { to = list[list.length - 1]; full = true; }
        if (!full) { used[to][0] += gr; used[to][1] += vo; used[b.id][0] -= gr; used[b.id][1] -= vo; }
        const k = b.id + '>' + to + (full ? '!' : '');
        if (!out[k]) { out[k] = { from: b.id, to, items: [], full }; order.push(k); }
        out[k].items.push({ p: c.product, a: c.amount });
      });
    });
    const mover = (d.crewList || []).find((c) => c.id === R.mover);
    const moverName = (d.crewN && d.crewN[R.mover]) || 'Crew #' + R.mover;
    const moverOk = mover && mover.ast === PLAN.rock && !mover.busy;
    const nm = (id) => { const b = on.find((x) => x.id === id); return (b && b.Name && b.Name.name) || 'Building #' + id; };
    const rows = order.map((k, i) => {
      const x = out[k];
      let state = 'ok', note = 'Ready';
      if (x.full) { state = 'no'; note = 'Not enough space - skipped'; }
      else if (!moverOk) { state = 'no'; note = moverName + (mover ? (mover.ast !== PLAN.rock ? ' is not on this rock' : ' is busy until ' + mover.busy) : ' not found'); }
      return { i, key: k, from: x.from, to: x.to, fromN: nm(x.from), toN: nm(x.to), items: x.items, crew: R.mover, crewName: moverName, state, note };
    });
    if (!S.rinit) { S.rinit = true; rows.filter((x) => x.state === 'ok').slice(0, BATCH).forEach((x) => { S.mtick[x.key] = 1; }); }
    return rows;
  }
  const pname = (p) => { try { return (window.YIC && window.YIC.pn && window.YIC.pn(p)) || '#' + p; } catch (e) { return '#' + p; } };
  const amt = (it) => { const g = (MV[it.p] || [1000])[0]; return g === 1000 ? tonnes(it.a) : 'x ' + it.a.toLocaleString('en-GB'); };
  const tonnes = (kg) => (kg >= 10000 ? Math.round(kg / 1000).toLocaleString('en-GB') : (kg / 1000).toLocaleString('en-GB', { maximumFractionDigits: 1 })) + ' t';

  function page(m) {
    css();
    const r = rows(), mv = mrows();
    const picked = r.filter((x) => x.state === 'ok' && S.tick[x.id]);
    const mpicked = mv.filter((x) => x.state === 'ok' && S.mtick[x.key]);
    const allDone = r.every((x) => x.state === 'done');
    m.innerHTML = `<div id="st-wrap">
<h2>Storage tidy – ${esc(PLAN.rock)} <span class="st-test">TEST</span></h2>
<div class="st-w">${PLANS.map((p, i) => `<button data-rock="${i}"${p === PLAN ? ' style="border-color:#8fe3ff;color:#8fe3ff"' : ''}>${esc(p.rock)}</button>`).join('')}</div>
<p>Nothing happens unless you press Approve <b>and</b> approve again in your wallet.</p>
<h3 style="color:#8fe3ff;margin:18px 0 0">Step 1 of 3: renames${allDone ? ' – done ✓' : ''}</h3>
<table><thead><tr><th></th><th>Name now</th><th>New name</th><th>Crew</th><th>Check</th></tr></thead><tbody>
${r.map((x) => `<tr class="${x.state === 'ok' ? '' : 'st-off'}"><td>${x.state === 'ok' ? `<input type="checkbox" data-id="${x.id}"${S.tick[x.id] ? ' checked' : ''}>` : ''}</td>
<td>${esc(x.now || x.was)}</td><td class="st-to">${esc(x.to)}</td><td>${esc(x.crewName)}</td><td>${esc(x.note)}</td></tr>`).join('')}
</tbody></table>
${allDone ? '' : `<button class="st-go" id="st-go"${picked.length && !S.busy ? '' : ' disabled'}>Approve ${picked.length} rename${picked.length === 1 ? '' : 's'}</button>`}
${mv.length ? `<h3 style="color:#8fe3ff;margin:26px 0 0">Step 2 of 3: move goods</h3>
<p>Each delivery sends everything of those products that the building holds right now.${PLAN.rules ? ` ${mv.length} deliveries in all; ${BATCH} are ticked at a time to keep each approval a sensible size.` : ''}</p>
${PLAN.rules ? `<div class="st-w"><button id="st-next">Tick the next ${BATCH}</button><button id="st-none">Untick all</button></div>` : ''}
<table><thead><tr><th></th><th>From</th><th>To</th><th>Goods</th><th>Sent by</th><th>Check</th></tr></thead><tbody>
${mv.map((x) => `<tr class="${x.state === 'ok' ? '' : 'st-off'}"><td>${x.state === 'ok' ? `<input type="checkbox" data-mi="${esc(x.key)}"${S.mtick[x.key] ? ' checked' : ''}>` : ''}</td>
<td>${esc(x.fromN)}</td><td class="st-to">${esc(x.toN)}</td><td>${x.items.map((it) => esc(PN[it.p] || pname(it.p)) + ' ' + amt(it)).join('<br>') || '–'}</td><td>${esc(x.crewName)}</td><td>${esc(x.note)}</td></tr>`).join('')}
</tbody></table>
<button class="st-go" id="st-mgo"${mpicked.length && !S.busy ? '' : ' disabled'}>Approve ${mpicked.length} deliver${mpicked.length === 1 ? 'y' : 'ies'}</button>` : '<p style="margin-top:22px">Step 2 (moving goods) for this rock comes later.</p>'}
<div class="st-w" id="st-wl"></div>
<div id="st-msg"></div>
<p style="margin-top:16px;font-size:13px">Step 3 (accepting deliveries and checking the result) comes later. Until then, accept them in the game or see Waiting to accept on the Bridge.</p>
</div>`;
    m.querySelectorAll('input[data-id]').forEach((c) => c.addEventListener('change', () => { S.tick[c.dataset.id] = c.checked; page(m); }));
    m.querySelectorAll('input[data-mi]').forEach((c) => c.addEventListener('change', () => { S.mtick[c.dataset.mi] = c.checked; page(m); }));
    const nx = m.querySelector('#st-next');
    if (nx) nx.addEventListener('click', () => { S.mtick = {}; mv.filter((x) => x.state === 'ok' && !S.sent[x.key]).slice(0, BATCH).forEach((x) => { S.mtick[x.key] = 1; }); page(m); });
    const nn = m.querySelector('#st-none');
    if (nn) nn.addEventListener('click', () => { S.mtick = {}; page(m); });
    const g = m.querySelector('#st-go');
    if (g) g.addEventListener('click', () => start(m, () => renameCalls(picked), 'rename'));
    const mg = m.querySelector('#st-mgo');
    if (mg) mg.addEventListener('click', () => { S.lastPicked = mpicked.map((x) => x.key); start(m, () => moveCalls(mpicked), 'delivery'); });
    m.querySelectorAll('button[data-rock]').forEach((b) => b.addEventListener('click', () => { if (S.busy) return; PLAN = PLANS[+b.dataset.rock]; S.msg = ''; page(m); }));
    if (S.msg) say(m, S.msg, S.msgErr);
  }

  const call = (sys, data) => ({ contract_address: DISPATCHER, entry_point: 'run_system', calldata: [short(sys), hex(data.length), ...data.map(hex)] });
  // one ChangeName call per building
  const renameCalls = (picked) => picked.map((x) => {
    if (nameErr(x.to)) throw new Error(esc(x.to) + ': ' + nameErr(x.to));
    return { contract_address: DISPATCHER, entry_point: 'run_system', calldata: [short('ChangeName'), '0x5', '0x5', hex(x.id), short(x.to), '0x1', hex(x.crew)] };
  });
  // one SendDelivery call per from → to pair, sent by the crew that controls the "from" building
  const moveCalls = (picked) => picked.map((x) => {
    if (!x.crew || !x.items.length) throw new Error('Nothing to send from ' + esc(x.fromN));
    return call('SendDelivery', [5, x.from, SLOT, x.items.length, ...x.items.flatMap((it) => [it.p, it.a]), 5, x.to, SLOT, 1, x.crew]);
  });

  function say(m, html, err) {
    S.msg = html; S.msgErr = !!err;
    const e = m.querySelector('#st-msg');
    if (!e) return;
    e.style.display = 'block';
    e.className = err ? 'err' : '';
    e.innerHTML = html;
  }

  // same wallet list as vendor/wallet.js
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

  function start(m, build, kind) {
    const list = wallets();
    const wl = m.querySelector('#st-wl');
    if (!list.length) return say(m, 'No Starknet wallet found in this browser. Open this page in the browser that has your wallet (e.g. Brave with Ready).', true);
    if (list.length === 1) return send(m, build, kind, list[0]);
    wl.innerHTML = '<span style="align-self:center">Pick the wallet to approve with:</span>' + list.map((w, i) => `<button data-i="${i}">${esc(w.name)}</button>`).join('');
    wl.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { wl.innerHTML = ''; send(m, build, kind, list[+b.dataset.i]); }));
  }

  async function account(w) {
    let a = null;
    if (typeof w.request === 'function') {
      try { const r = await w.request({ type: 'wallet_requestAccounts' }); if (Array.isArray(r) && r[0]) a = r[0]; } catch (e) { if (typeof w.enable !== 'function') throw e; }
    }
    if (!a && typeof w.enable === 'function') { const r = await w.enable(); if (Array.isArray(r) && r[0]) a = r[0]; }
    if (!a && w.selectedAddress) a = w.selectedAddress;
    return a;
  }

  async function send(m, build, kind, w) {
    const d = D();
    if (!d || !d.wallet) return say(m, 'Your game data is not loaded yet – try again in a moment.', true);
    S.busy = true; page(m);
    try {
      const a = await account(w);
      if (!a) throw new Error('The wallet did not share an address.');
      if (!sameAddr(a, d.wallet)) throw new Error('That wallet (' + esc(a) + ') is not the one this page is showing. Switch account in your wallet and try again.');
      const calls = build();
      if (!calls.length) throw new Error('Nothing ticked.');
      say(m, 'Waiting for your wallet… check the wallet window and approve (or reject) it there.');
      let res;
      if (typeof w.request === 'function') {
        res = await w.request({ type: 'wallet_addInvokeTransaction', params: { calls } });
      } else if (w.account && typeof w.account.execute === 'function') {
        res = await w.account.execute(calls.map((c) => ({ contractAddress: c.contract_address, entrypoint: c.entry_point, calldata: c.calldata })));
      } else throw new Error('This wallet cannot send transactions from a web page.');
      const h = res && (res.transaction_hash || res.transactionHash);
      S.tx = h || '';
      if (kind === 'delivery') { (S.lastPicked || []).forEach((k) => { S.sent[k] = 1; delete S.mtick[k]; }); }
      say(m, '✓ Sent to the game. ' + (h ? `Transaction <a href="https://voyager.online/tx/${esc(h)}" target="_blank" rel="noopener noreferrer">${esc(String(h).slice(0, 10))}…</a>. ` : '') +
        (kind === 'rename' ? 'In a minute or two, press Refresh at the top of the page and the new names should show as "Already done ✓".'
          : 'In a minute or two, press Refresh at the top of the page. Rows show "Nothing left to move ✓" once sent; deliveries between different crews then wait for you to accept them.'));
    } catch (e) {
      const t = String((e && e.message) || e || '');
      say(m, /reject|cancel|abort|denied|User/i.test(t) ? 'Cancelled in the wallet – nothing was changed.' : 'Not sent: ' + t, true);
    } finally {
      S.busy = false;
      const msg = S.msg, err = S.msgErr;
      if (isOn()) { page(m); say(m, msg, err); }
    }
  }

  const isOn = () => { const b = document.getElementById('vST'); return !!(b && b.className === 'on'); };

  // hidden "Storage tidy" page button – the Engineering deck shows it as a console (decks.js, beta only)
  const hook = () => {
    const after = document.getElementById('vB'), main = document.getElementById('main');
    if (!after || !main || document.getElementById('vST')) return;
    const b = document.createElement('button');
    b.id = 'vST'; b.textContent = 'Storage tidy';
    after.after(b);
    b.addEventListener('click', () => {
      document.querySelectorAll('button.on').forEach((x) => x.classList.remove('on'));
      try { window.YIC.view = 'M'; } catch (e) {}
      b.className = 'on';
      S.msg = '';
      page(main);
    });
  };
  document.addEventListener('click', (e) => {
    const b = document.getElementById('vST'), t = e.target.closest && e.target.closest('button[id^="v"]');
    if (b && t && t !== b) b.className = '';
  }, true);
  setInterval(hook, 700);
})();
