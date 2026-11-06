/* Storage tidy – Skippy's Awesome Command Deck – TEST ONLY (?beta=1)
   Player page (design agreed with Mark 6 Nov 2026 – project doc claude/storage-tidy-player-page-2026-11-06.md):
     1 pick a rock · 2 naming (own prefix + styles, every name editable) · 3 moves (product groups → buildings,
     best free logistics crew, deliveries per approval) · 4 finish in the game + check again.
   Nothing is sent until the player presses Approve AND approves again in their own wallet. Only the game's
   ChangeName and SendDelivery systems are ever called, only on the wallet's own buildings, and the connected
   wallet must be the one the page is showing. No pasted code, no other actions.
   Call formats checked against @influenceth/sdk 2.8.1 System.getRunSystemCall:
     run_system('ChangeName', [5, buildingId, name, 1, crewId])
     run_system('SendDelivery', [5, fromId, 2, n, (product, amount)×n, 5, toId, 2, 1, crewId])
   Game rules learned on 6 Nov 2026 (Newark + TRCS Leisure Potato):
     names 4–28 letters/numbers/spaces (E6013 for an apostrophe), unique on each rock (E6014);
     renames work from anywhere; deliveries need the sending crew ON the rock (E4001); any of the wallet's
     crews may send from any of its buildings ("shared delegate"); tank farms only take fluids and weigh
     out at 75,000 t. */
(function () {
  'use strict';
  if (!/[?&]beta=1\b/.test(location.search)) return; // test only

  const DISPATCHER = '0x0422d33a3638dcc4c62e72e1d6942cd31eb643ef596ccac2351e0e21f6cd4bf4';
  const SLOT = 2; // warehouse / tank farm main storage (inventoryType 10 / 19)
  const WAREHOUSE = 1, EXTRACTOR = 2, TANK = 10;
  const BT = { 1: 'Warehouse', 2: 'Extractor', 3: 'Refinery', 4: 'Bioreactor', 5: 'Factory', 6: 'Shipyard', 7: 'Spaceport', 8: 'Marketplace', 9: 'Habitat', 10: 'Tank Farm' };
  // product id -> [grams per unit, volume per unit] (@influenceth/sdk 2.8.1 Product.TYPES)
  const MV = {"1":[1000,971],"2":[1000,14100],"3":[1000,1370],"4":[1000,1240],"5":[1000,684],"6":[1000,801],"7":[1000,1250],"8":[1000,2220],"9":[1000,521],"10":[1000,1600],"11":[1000,615],"12":[1000,606],"13":[1000,617],"14":[1000,476],"15":[1000,327],"16":[1000,521],"17":[1000,358],"18":[1000,233],"19":[1000,737],"20":[1000,208],"21":[1000,362],"22":[1000,156],"23":[1000,876],"24":[1000,1000],"25":[1000,775],"26":[1000,629],"27":[1000,1300],"28":[1000,909],"29":[1000,140],"30":[1000,123],"31":[1000,161],"32":[1000,599],"33":[1000,1440],"34":[1000,1330],"35":[1000,870],"36":[1000,595],"37":[1000,344],"38":[1000,219],"39":[1000,319],"40":[1000,329],"41":[1000,415],"42":[1000,1260],"43":[1000,123],"44":[1000,1130],"45":[1000,1410],"46":[1000,842],"47":[1000,963],"48":[1000,948],"49":[1000,718],"50":[1000,2040],"51":[1000,805],"52":[1000,159],"53":[1000,715],"54":[1000,893],"55":[1000,687],"56":[1000,714],"57":[1000,271],"58":[1000,521],"59":[1000,1050],"60":[1000,119],"61":[1000,65],"62":[1000,171],"63":[1000,387],"64":[1000,2500],"65":[1000,426],"66":[1000,755],"67":[1000,148],"68":[1000,886],"69":[1000,1100],"70":[1000,150],"71":[1000,1200],"72":[1000,150],"73":[1000,1230],"74":[1000,1570],"75":[1000,632],"76":[1000,4020],"77":[1000,787],"78":[1000,775],"79":[1000,739],"80":[1000,751],"81":[1000,1040],"82":[1000,1090],"83":[1000,694],"84":[1000,1390],"85":[1000,357],"86":[1000,300],"87":[1000,559],"88":[1000,460],"89":[1000,671],"90":[1000,674],"91":[1000,1530],"92":[1000,1520],"93":[1000,1110],"94":[1000,681],"95":[1000,222],"96":[1000,172],"97":[1000,316],"98":[1000,135],"99":[1000,152],"100":[1000,472],"101":[1000,182],"102":[1000,1210],"103":[1000,1820],"104":[1000,58],"105":[1000,805],"106":[1000,175],"107":[1000,1060],"108":[1000,1040],"109":[1000,272],"110":[1000,1090],"111":[1000,463],"112":[1000,1290],"113":[1000,617],"114":[1000,333],"115":[1000,593],"116":[1000,1520],"117":[1000,435],"118":[1000,220],"119":[1000,800],"120":[1000,800],"121":[1000,1480],"122":[1000,3190],"123":[1000,436],"124":[1000,3190],"125":[1000,2820],"126":[3000,1725],"127":[3000,1725],"128":[1000,1750],"129":[1000,1250],"130":[6000,87000],"131":[1000,595],"132":[1000,212],"133":[2000000,8640000],"134":[1000,543],"135":[1000,3770],"136":[1000,1680],"137":[1000,251],"138":[1000,363],"139":[1000,661],"140":[1000,1020],"141":[1000,168],"142":[1000,370],"143":[1000,435],"144":[300000,570000],"145":[1500000,21000000],"146":[600000,50520000],"147":[1000000,21100000],"148":[5000000,347500000],"149":[1850000,262700000],"150":[3500000,511000000],"151":[1000,140],"152":[1000,417],"153":[1000,228],"154":[2000,17260],"155":[10000,100000],"156":[72000,11808000],"157":[8000,52640],"158":[5000,3160],"159":[1000,404],"161":[1000,348],"162":[1000,1670],"163":[1000,165],"164":[1000,65],"165":[44600000,16011400000],"166":[74200000,35987000000],"167":[10000000,1550000000],"168":[480400000,60530400000],"169":[1000,104],"170":[1000,13300],"171":[1000,150],"172":[1000,1200],"173":[1000,84],"174":[1000,79],"175":[30000,107100],"176":[1000,178],"178":[1000,174],"179":[1000,271],"180":[1000,1240],"181":[1000,242],"182":[1000,143],"183":[1000,142],"184":[1000,327],"185":[1000,327],"186":[1000,385],"187":[1000,179],"188":[1000,96],"189":[1000,689],"190":[1000,321],"191":[1000,561],"192":[1000,686],"193":[1000,397],"194":[1000,110],"195":[1000,672],"196":[1000,365],"197":[1000,833],"199":[1000,75],"200":[1000,989],"201":[1000,256],"202":[5000,8550],"203":[1000,500],"204":[3000,906],"205":[3000,1308],"206":[6000,1572],"207":[816000,1876800],"208":[144000,982080],"209":[8000,6624],"210":[75000,12150000],"211":[2000,118],"212":[2000,94200],"213":[1000,333],"214":[160000,808000],"215":[300000,3600000],"217":[1000,833],"218":[1000,509],"219":[1000,414],"220":[1000,7410],"221":[40000,25440],"222":[290000,220110],"224":[190000,63460],"225":[100000,23400],"226":[250000,116750],"227":[130000,112580],"229":[50000,396000],"230":[1942000,6991200],"231":[18700000,18139000],"232":[180000,583200],"233":[6000000,51600000],"234":[30000000,54600000],"235":[2200000,264000000],"236":[2000000,4860000],"237":[3600000,301320000],"238":[3600000,11736000],"239":[960000,2976000],"240":[500000,12200000],"241":[6665000,339915000],"242":[660000,2976600],"243":[1000000,3800000],"244":[1000000,399000],"245":[32000000,106560000]};
  // product id -> group letter: gases/liquids by name, then by product category
  const GRP = {};
  '1W;2H;3A;4N;5S;6C;7C;8C;9R;10R;11R;12R;13R;14R;15R;16R;17R;18R;19R;20R;21R;22R;23O;24W;25L;26X;27G;28L;29M;30M;31M;32X;33G;34L;35L;36L;37L;38L;39L;40L;41G;42G;43B;44B;45L;46L;47L;48L;49L;50G;51M;52M;53M;54Q;55Q;56K;57M;58Z;59Q;60M;61M;62M;63X;64K;65X;66Z;67P;68G;69B;70B;71B;72B;73G;74G;75M;76A;77L;78L;79X;80L;81Q;82Q;83Q;84Q;85X;86X;87X;88X;89L;90L;91K;92K;93L;94L;95M;96X;97G;98M;99P;100G;101B;102G;103K;104M;105L;106M;107G;108G;109X;110L;111M;112M;113L;114Z;115L;116A;117L;118M;119P;120P;121P;122B;123B;124B;125G;126P;127P;128G;129K;130P;131G;132P;133P;134M;135M;136G;137X;138X;139L;140G;141M;142L;143L;144P;145P;146P;147P;148P;149P;150P;151M;152P;153P;154P;155P;156P;157P;158P;159L;161X;162G;163X;164M;165P;166P;167P;168P;169Z;170F;171B;172B;173P;174P;175B;176M;178M;179L;180N;181G;182M;183P;184L;185L;186P;187P;188M;189Z;190Z;191Z;192L;193L;194M;195L;196L;197G;199M;200G;201P;202P;203P;204P;205P;206P;207P;208P;209P;210P;211P;212P;213P;214P;215P;217L;218X;219G;220Z;221P;222P;224P;225P;226P;227P;229P;230P;231P;232P;233P;234P;235U;236U;237U;238U;239U;240U;241U;242U;243U;244U;245U'.split(';').forEach((t) => { GRP[+t.slice(0, -1)] = t.slice(-1); });
  // products a tank farm takes (SDK Inventory.TYPES[19].productConstraints)
  const TANKOK = new Set([1, 2, 3, 4, 5, 6, 7, 8, 23, 24, 27, 33, 50, 66, 73, 76, 116, 169, 170, 180, 184, 185, 220]);
  const CAP = { 1: [1.5e12, 75e9], 10: [75e9, 997.5e9] }; // grams, volume
  // product groups, in the order they are listed; tank = goes in a tank farm
  const GROUPS = [
    ['H', 'Hydrogen', 1], ['W', 'Water', 1], ['N', 'Nitrogen', 1], ['O', 'Oxygen', 1], ['S', 'Sulfur Dioxide', 1],
    ['C', 'Carbon Gases', 1], ['A', 'Ammonia', 1], ['F', 'Fuel', 1],
    ['R', 'Rocks', 0], ['X', 'Oxides', 0], ['L', 'Salts', 0], ['Q', 'Acids', 0], ['M', 'Metals', 0],
    ['G', 'Glass and Fibre', 0], ['B', 'Building Supplies', 0], ['P', 'Ship Parts', 0], ['U', 'Modules', 0],
    ['K', 'Food', 0], ['Z', 'Mixing', 0],
  ];
  const GNAME = {}; GROUPS.forEach(([g, n]) => { GNAME[g] = n; });
  const GDESC = {
    H: 'Hydrogen', W: 'Water, Deionized Water', N: 'Nitrogen, Pure Nitrogen', O: 'Oxygen', S: 'Sulfur Dioxide',
    C: 'Carbon Monoxide, Carbon Dioxide, Methane', A: 'Ammonia, Chlorine, Fluorine', F: 'Hydrogen Propellant',
    R: 'Raw mined rocks', X: 'Oxides', L: 'Salts, sulfates, carbonates, sulfides, phosphates', Q: 'Acids',
    M: 'Refined metals, alloys', G: 'Glass, fibre, polymers, ceramics', B: 'Beams, sheets, pipes, cement, tools',
    P: 'Electronics, engine and ship parts', U: 'Integration modules', K: 'Food and its ingredients', Z: 'Powders, part-refined goods',
  };
  const BATCHES = [15, 30, 50, 'All'];

  const S = {
    rock: '', step: 1, prefix: null, data: null, loading: false,
    style: { store: 'job', 2: 'num', 3: 'keep', 4: 'keep', 5: 'keep', 6: 'keep', 7: 'keep', 8: 'keep', 9: 'keep' },
    edit: {}, rtick: {}, groups: null, leave: {}, mover: null, bs: 30, mtick: {}, sent: {}, busy: false, msg: '', msgErr: false,
  };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const Y = () => window.YIC || {};
  const D = () => Y().D || null;
  const hex = (n) => '0x' + BigInt(n).toString(16);
  const short = (s) => {
    if (!/^[\x20-\x7e]{1,31}$/.test(s)) throw new Error('Name must be plain letters, numbers and spaces.');
    return '0x' + [...s].map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  };
  const nameErr = (s) => {
    if (s.length < 4) return 'too short (4+)';
    if (s.length > 28) return 'too long (' + s.length + ' of 28)';
    if (!/^[A-Za-z0-9 ]+$/.test(s)) return 'letters, numbers and spaces only';
    if (!/^(\S+ )*\S+$/.test(s)) return 'single spaces, none at the ends';
    return '';
  };
  const sameAddr = (a, b) => { try { return BigInt(a) === BigInt(b); } catch (e) { return false; } };
  const pname = (p) => { try { return (Y().pn && Y().pn(p)) || '#' + p; } catch (e) { return '#' + p; } };
  const tonnes = (kg) => (kg >= 10000 ? Math.round(kg / 1000).toLocaleString('en-GB') : (kg / 1000).toLocaleString('en-GB', { maximumFractionDigits: 1 })) + ' t';
  const amt = (p, a) => ((MV[p] || [1000])[0] === 1000 ? tonnes(a) : '× ' + a.toLocaleString('en-GB'));
  const lotIdx = (b) => { const l = ((b.Location && b.Location.locations) || []).find((x) => x.label === 4); return l ? Math.floor(l.id / 4294967296) : 0; };
  const nm = (b) => (b && b.Name && b.Name.name) || '';
  const inv = (b) => (b.Inventories || []).find((x) => x.slot === SLOT && x.status === 1);
  const isStore = (b) => b.Building.buildingType === WAREHOUSE || b.Building.buildingType === TANK;

  // ---------- data ----------
  const allB = () => (S.data || (D() && D().allB) || []);
  const rocks = () => {
    const c = {};
    allB().forEach((b) => { const r = b.meta && b.meta.asteroid && b.meta.asteroid.name; if (r && b.Building.status === 3 && isStore(b)) c[r] = (c[r] || 0) + 1; });
    return Object.keys(c).sort();
  };
  const onRock = () => allB().filter((b) => b.meta && b.meta.asteroid && b.meta.asteroid.name === S.rock && b.Building.status === 3);
  async function reload(m) {
    const d = D();
    if (!d || !d.wallet) return;
    S.loading = true; page(m);
    try {
      const r = await fetch('api.php?wallet=' + encodeURIComponent(d.wallet) + '&t=' + Date.now()).then((x) => x.json());
      if (r && r.allBuildings) S.data = r.allBuildings;
    } catch (e) {}
    S.loading = false; S.sent = {}; S.mtick = {}; page(m);
  }
  // most common first word of the player's building names – a starting prefix ("Skippys")
  const guessPrefix = () => {
    const c = {};
    allB().forEach((b) => { const w = nm(b).split(' ')[0]; if (w && w.length > 2 && /^[A-Za-z0-9]+$/.test(w)) c[w] = (c[w] || 0) + 1; });
    const best = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    return best && best[1] >= 3 ? best[0] : '';
  };
  const P = (s) => ((S.prefix || '').trim() ? S.prefix.trim() + ' ' + s : s);

  // ---------- step 2: suggested names ----------
  // the group a storage building mostly holds (by weight); null when empty
  function mainGroup(b) {
    const i = inv(b), w = {};
    ((i && i.contents) || []).forEach((c) => { if (c.amount > 0) { const g = GRP[c.product] || 'Z'; w[g] = (w[g] || 0) + c.amount * (MV[c.product] || [1000])[0]; } });
    const best = Object.entries(w).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : null;
  }
  function mainProduct(b) {
    const i = inv(b);
    const best = (((i && i.contents) || []).filter((c) => c.amount > 0).map((c) => [c.product, c.amount * (MV[c.product] || [1000])[0]])).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : null;
  }
  // storage "by job": each building gets the group it mostly holds; the fullest one of a group is the main
  // one, the rest are numbered (Oxides 2); empty ones become spares
  function jobPlan(store) {
    const by = {}, spare = [];
    store.forEach((b) => {
      const g = mainGroup(b);
      if (!g) { spare.push(b); return; }
      const i = inv(b);
      (by[g] = by[g] || []).push([b, i ? i.mass : 0]);
    });
    const name = {}, group = {};
    Object.keys(by).forEach((g) => {
      by[g].sort((a, b) => b[1] - a[1]).forEach(([b], k) => { name[b.id] = P(GNAME[g] + (k ? ' ' + (k + 1) : '')); group[b.id] = g; });
    });
    // goods on the rock with no home yet get an empty building (tank farms for gases/liquids, else a warehouse)
    const tankG = {}; GROUPS.forEach(([g, , t]) => { tankG[g] = t; });
    const homeless = {};
    store.forEach((b) => { const i = inv(b); ((i && i.contents) || []).forEach((c) => { const g = GRP[c.product]; if (c.amount > 0 && g && !by[g]) homeless[g] = (homeless[g] || 0) + c.amount * (MV[c.product] || [1000])[0]; }); });
    spare.sort((a, b) => lotIdx(a) - lotIdx(b));
    Object.entries(homeless).sort((a, b) => b[1] - a[1]).forEach(([g]) => {
      let k = spare.findIndex((b) => (b.Building.buildingType === TANK) === !!tankG[g]);
      if (k < 0 && tankG[g]) k = spare.findIndex((b) => b.Building.buildingType === WAREHOUSE);
      if (k < 0) return;
      const b = spare.splice(k, 1)[0];
      name[b.id] = P(GNAME[g]); group[b.id] = g;
    });
    let ns = 0, nt = 0;
    spare.forEach((b) => {
      name[b.id] = b.Building.buildingType === TANK ? P('Spare Tank ' + (++nt)) : P('Spare Store ' + (++ns));
    });
    return { name, group };
  }
  function suggestions() {
    const on = onRock(), out = [];
    const store = on.filter(isStore);
    const job = jobPlan(store);
    // storage
    const seen = {};
    store.sort((a, b) => lotIdx(a) - lotIdx(b)).forEach((b) => {
      let to = nm(b);
      if (S.style.store === 'job') to = job.name[b.id];
      else if (S.style.store === 'main') {
        const p = mainProduct(b);
        if (p) { const base = P(pname(p)); seen[base] = (seen[base] || 0) + 1; to = base + (seen[base] > 1 ? ' ' + seen[base] : ''); }
        else to = job.name[b.id];
      }
      out.push({ b, type: b.Building.buildingType, to });
    });
    // everything else, by type
    [2, 3, 4, 5, 6, 7, 8, 9].forEach((t) => {
      const list = on.filter((b) => b.Building.buildingType === t).sort((a, b) => lotIdx(a) - lotIdx(b));
      const cnt = {};
      list.forEach((b, k) => {
        let to = nm(b);
        const st = S.style[t];
        if (st === 'num') to = P(BT[t] + ' ' + (k + 1));
        else if (st === 'make') {
          const e = (t === EXTRACTOR ? (b.Extractors || []) : (b.Processors || []))[0];
          const p = e && e.outputProduct;
          const base = p ? P(pname(p) + (t === EXTRACTOR ? ' Extractor' : ' ' + BT[t])) : P(BT[t]);
          cnt[base] = (cnt[base] || 0) + 1;
          to = base + ' ' + cnt[base];
        }
        out.push({ b, type: t, to });
      });
    });
    // hand edits win
    out.forEach((x) => { if (S.edit[x.b.id] != null) x.to = S.edit[x.b.id]; x.now = nm(x.b); });
    return { rows: out, job };
  }
  // check every rename, then put them in an order where no name is taken before it is freed (E6014)
  function renamePlan() {
    const { rows, job } = suggestions();
    const d = D();
    const crewName = (c) => (c && d && d.crewN && d.crewN[c]) || (c ? 'Crew #' + c : '');
    rows.forEach((x) => {
      x.crew = x.b.Control && x.b.Control.controller && x.b.Control.controller.id;
      x.crewName = crewName(x.crew);
      x.err = x.to === x.now ? '' : nameErr(x.to);
      x.change = x.to !== x.now;
    });
    const held = {};
    onRock().forEach((b) => { if (nm(b)) held[nm(b).toLowerCase()] = b.id; });
    // the same new name twice
    const want = {};
    rows.forEach((x) => { if (x.change && !x.err) { const k = x.to.toLowerCase(); if (want[k]) x.err = 'same name as another row'; else want[k] = x.b.id; } });
    let pending = rows.filter((x) => x.change && !x.err && S.rtick[x.b.id] !== false);
    const order = [];
    let moved = true;
    while (pending.length && moved) {
      moved = false;
      pending = pending.filter((x) => {
        const who = held[x.to.toLowerCase()];
        if (who && who !== x.b.id) return true; // still taken – try later
        delete held[x.now.toLowerCase()]; held[x.to.toLowerCase()] = x.b.id; order.push(x); moved = true; return false;
      });
    }
    pending.forEach((x) => { x.err = 'name is in use on this rock'; });
    return { rows, order, job };
  }

  // ---------- step 3: moves ----------
  function defaultGroups(job) {
    const on = onRock().filter(isStore), g = {};
    GROUPS.forEach(([k, n]) => {
      // by-job plan first, else buildings already called "<prefix> <group>", "<prefix> <group> 2"…
      let ids = on.filter((b) => job.group[b.id] === k).sort((a, b) => (inv(b) ? inv(b).mass : 0) - (inv(a) ? inv(a).mass : 0)).map((b) => b.id);
      if (!ids.length) {
        const re = new RegExp('^(?:\\S+ )?' + n + '(?: (\\d+))?$', 'i');
        ids = on.filter((b) => re.test(nm(b))).sort((a, b) => (+(re.exec(nm(a))[1] || 1)) - (+(re.exec(nm(b))[1] || 1))).map((b) => b.id);
      }
      g[k] = [ids[0] || 0, ids[1] || 0];
    });
    return g;
  }
  function crews() {
    const d = D(), y = Y(), cm = (d && d.crewmates) || {};
    return ((d && d.crewList) || []).filter((c) => c.ast === S.rock && (c.roster || []).length && !/in flight|in orbit/i.test(c.place || '')).map((c) => {
      const ms = c.roster.map((id) => cm[id]).filter(Boolean);
      let free = 1, speed = 1;
      try { free = y.crewMult(11, ms); speed = y.crewMult(3, ms) * (y.CBNF && y.CBNF[3] ? 1 : y.habEff(c)); } catch (e) {}
      return { id: c.id, name: c.name, busy: c.busy || '', free, speed };
    }).sort((a, b) => (!!a.busy - !!b.busy) || (b.free - a.free) || (b.speed - a.speed));
  }
  function movePlan(job) {
    if (!S.groups) S.groups = defaultGroups(job);
    const on = onRock().filter(isStore);
    const byId = (id) => on.find((b) => b.id === id);
    const used = {};
    on.forEach((b) => { const i = inv(b); used[b.id] = i ? [i.mass + (i.reservedMass || 0), i.volume + (i.reservedVolume || 0)] : [0, 0]; });
    const fits = (id, g, v) => { const c = CAP[byId(id).Building.buildingType]; return used[id][0] + g <= c[0] * 0.95 && used[id][1] + v <= c[1] * 0.95; };
    const okIn = (id, p) => byId(id).Building.buildingType !== TANK || TANKOK.has(p);
    const out = {}, order = [];
    on.forEach((b) => {
      if (S.leave[b.id]) return;
      const i = inv(b);
      if (!i) return;
      i.contents.forEach((c) => {
        if (!(c.amount > 0)) return;
        const g = GRP[c.product], list = ((S.groups[g]) || []).filter((id) => id && byId(id) && !S.leave[id]);
        if (!list.length || list.includes(b.id)) return;
        const mv = MV[c.product] || [1000, 1000], gr = c.amount * mv[0], vo = c.amount * mv[1];
        const cand = list.filter((id) => okIn(id, c.product));
        let to = cand.find((id) => fits(id, gr, vo)), why = '';
        if (!cand.length) { to = list[0]; why = 'a tank farm can’t take this'; }
        else if (!to) { to = cand[cand.length - 1]; why = 'not enough space'; }
        if (!why) { used[to][0] += gr; used[to][1] += vo; used[b.id][0] -= gr; used[b.id][1] -= vo; }
        const k = b.id + '>' + to + (why ? '!' + why : '');
        if (!out[k]) { out[k] = { from: b.id, to, items: [], why }; order.push(k); }
        out[k].items.push({ p: c.product, a: c.amount });
      });
    });
    const cl = crews();
    if (S.mover == null || !cl.find((c) => c.id === S.mover)) S.mover = (cl.find((c) => !c.busy) || {}).id || 0;
    const mv = cl.find((c) => c.id === S.mover);
    const rows = order.map((k) => {
      const x = out[k];
      let state = 'ok', note = 'Ready';
      if (x.why) { state = 'no'; note = x.why + ' – skipped'; }
      else if (!mv) { state = 'no'; note = 'no free crew on this rock'; }
      else if (mv.busy) { state = 'no'; note = mv.name + ' is busy until ' + mv.busy; }
      return { key: k, from: x.from, to: x.to, fromN: nm(byId(x.from)), toN: nm(byId(x.to)), items: x.items, state, note };
    });
    const fill = on.map((b) => { const c = CAP[b.Building.buildingType]; return [nm(b), Math.round(used[b.id][0] / c[0] * 100), Math.round(used[b.id][1] / c[1] * 100)]; });
    return { rows, crews: cl, fill };
  }

  // ---------- page ----------
  function css() {
    if (document.getElementById('st-css')) return;
    const s = document.createElement('style');
    s.id = 'st-css';
    s.textContent = `
#st-wrap{max-width:1040px;margin:18px auto;padding:0 16px;color:#dbe7f5}
#st-wrap h2{margin:0 0 4px;color:#8fe3ff;font-size:22px}
#st-wrap h3{color:#8fe3ff;margin:22px 0 6px;font-size:17px}
#st-wrap .st-test{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:6px;background:#3a2a00;color:#ffd24a;font-size:12px;vertical-align:middle}
#st-wrap p{color:#b7c3d4;line-height:1.5;margin:8px 0}
#st-wrap table{width:100%;border-collapse:collapse;margin:10px 0;font-size:14px}
#st-wrap th,#st-wrap td{padding:7px 9px;border-bottom:1px solid #1d2734;text-align:left;vertical-align:top}
#st-wrap th{color:#8b9ab0;font-weight:600;font-size:13px}
#st-wrap td.st-to{color:#ffd24a;font-weight:700}
#st-wrap td.st-bad{color:#ff8a82}
#st-wrap tr.st-off td{opacity:.55}
#st-wrap input[type=checkbox]{width:17px;height:17px;cursor:pointer}
#st-wrap input[type=text],#st-wrap select{font:inherit;color:#e6ebf2;background:#131821;border:1px solid #2b3a4c;border-radius:7px;padding:6px 8px}
#st-wrap input.st-name{width:100%;box-sizing:border-box}
#st-wrap .st-steps{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}
#st-wrap .st-steps button,#st-wrap .st-w button{padding:8px 14px;border-radius:8px;border:1px solid #2b5a72;background:#131821;color:#e6ebf2;cursor:pointer}
#st-wrap .st-steps button.on,#st-wrap .st-w button.on{border-color:#8fe3ff;color:#8fe3ff;box-shadow:0 0 10px rgba(143,227,255,.3)}
#st-wrap .st-w{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0}
#st-wrap .st-opt{display:grid;grid-template-columns:170px 1fr;gap:8px 14px;align-items:center;margin:10px 0}
#st-wrap .st-opt label{color:#b7c3d4}
#st-wrap .st-go{font:700 16px system-ui,sans-serif;padding:12px 22px;border-radius:10px;border:1px solid #57ff65;background:#0f2a14;color:#57ff65;cursor:pointer}
#st-wrap .st-go:disabled{opacity:.4;cursor:default}
#st-wrap .st-next{font:600 15px system-ui,sans-serif;padding:10px 18px;border-radius:10px;border:1px solid #8fe3ff;background:#0d1d26;color:#8fe3ff;cursor:pointer}
#st-msg{margin-top:12px;padding:10px 12px;border-radius:8px;background:#0d1520;border:1px solid #2b5a72;display:none}
#st-msg.err{border-color:#ff564d;color:#ffb3ae}
#st-wrap .st-bar{display:inline-block;width:70px;height:7px;border-radius:4px;background:#1d2734;vertical-align:middle;margin-right:6px;overflow:hidden}
#st-wrap .st-bar i{display:block;height:100%;background:#57ff65}
#st-wrap a{color:#8fe3ff}`;
    document.head.appendChild(s);
  }
  const bar = (p) => `<span class="st-bar"><i style="width:${Math.min(100, p)}%;background:${p > 95 ? '#ff564d' : p > 80 ? '#ffd24a' : '#57ff65'}"></i></span>${p}%`;
  const sel = (id, opts, val) => `<select id="${id}">${opts.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>`;

  function page(m) {
    css();
    if (S.prefix == null) S.prefix = guessPrefix();
    const rl = rocks();
    if (!S.rock || !rl.includes(S.rock)) { S.rock = rl[0] || ''; }
    const steps = ['1 Pick a rock', '2 Names', '3 Moves', '4 Finish'];
    let body = '';
    if (!S.rock) body = '<p>No storage buildings found for this wallet yet.</p>';
    else if (S.step === 1) body = step1();
    else if (S.step === 2) body = step2();
    else if (S.step === 3) body = step3();
    else body = step4();
    m.innerHTML = `<div id="st-wrap">
<h2>Storage tidy <span class="st-test">TEST</span></h2>
<p>Rename your buildings and gather your goods into the right storage on one rock. Nothing happens unless you press Approve <b>and</b> approve again in your wallet.</p>
<div class="st-steps">${steps.map((t, i) => `<button data-step="${i + 1}"${S.step === i + 1 ? ' class="on"' : ''}>${t}</button>`).join('')}
<button id="st-reload" style="margin-left:auto">${S.loading ? 'Loading…' : '↻ Check again'}</button></div>
${body}
<div class="st-w" id="st-wl"></div>
<div id="st-msg"></div>
</div>`;
    wire(m);
    if (S.msg) say(m, S.msg, S.msgErr);
  }

  function step1() {
    const on = onRock().filter(isStore).sort((a, b) => lotIdx(a) - lotIdx(b));
    return `<h3>Step 1: pick a rock</h3>
<div class="st-w">${rocks().map((r) => `<button data-rock="${esc(r)}"${r === S.rock ? ' class="on"' : ''}>${esc(r)}</button>`).join('')}</div>
<table><thead><tr><th>Storage</th><th>Type</th><th>Weight</th><th>Space</th><th>Holds most</th></tr></thead><tbody>
${on.map((b) => { const i = inv(b) || { mass: 0, volume: 0, contents: [] }, c = CAP[b.Building.buildingType];
      const top = i.contents.filter((x) => x.amount > 0).map((x) => [x.product, x.amount]).sort((a, z) => z[1] * (MV[z[0]] || [1000])[0] - a[1] * (MV[a[0]] || [1000])[0]).slice(0, 3);
      return `<tr><td>${esc(nm(b) || '(no name)')}</td><td>${BT[b.Building.buildingType]}</td><td>${bar(Math.round(i.mass / c[0] * 100))}</td><td>${bar(Math.round(i.volume / c[1] * 100))}</td><td>${top.map(([p, a]) => esc(pname(p)) + ' ' + amt(p, a)).join(', ') || 'empty'}</td></tr>`; }).join('')}
</tbody></table>
<button class="st-next" data-step="2">Next: names →</button>`;
  }

  function step2() {
    const { rows, order } = renamePlan();
    const types = [...new Set(onRock().map((b) => b.Building.buildingType))].filter((t) => t !== WAREHOUSE && t !== TANK).sort((a, b) => a - b);
    const pub = { 7: 1, 8: 1, 9: 1 };
    const optFor = (t) => (t === EXTRACTOR ? [['num', 'Numbered (' + P('Extractor 1') + ')'], ['make', 'By what it mines (' + P('Water Extractor 1') + ')'], ['keep', 'Keep current names']]
      : pub[t] ? [['keep', 'Keep current names'], ['num', 'Numbered (' + P(BT[t] + ' 1') + ')']]
      : [['num', 'Numbered (' + P(BT[t] + ' 1') + ')'], ['make', 'By what it makes (' + P('Steel ' + BT[t] + ' 1') + ')'], ['keep', 'Keep current names']]);
    const changed = rows.filter((x) => x.change);
    const ready = order.length;
    return `<h3>Step 2: names</h3>
<div class="st-opt">
<label for="st-prefix">Your prefix</label><div><input type="text" id="st-prefix" maxlength="14" value="${esc(S.prefix)}" placeholder="e.g. Skippys – or leave empty"> <span style="color:#8b9ab0;font-size:13px">goes in front of every new name</span></div>
<label>Warehouses &amp; tank farms</label>${sel('st-s-store', [['job', 'By job (' + P('Rocks') + ', ' + P('Oxides 2') + ')'], ['main', 'By the main thing inside (' + P('Pyroxene') + ')'], ['keep', 'Keep current names']], S.style.store)}
${types.map((t) => `<label>${BT[t]}s${pub[t] ? ' <span style="color:#8b9ab0;font-size:12px">(other players see these)</span>' : ''}</label>${sel('st-s-' + t, optFor(t), S.style[t])}`).join('')}
</div>
<p>${changed.length} building${changed.length === 1 ? '' : 's'} would get a new name. You can type over any new name. Untick a row to leave it as it is.</p>
<table><thead><tr><th></th><th>Type</th><th>Name now</th><th style="width:34%">New name</th><th>Check</th></tr></thead><tbody>
${changed.map((x) => `<tr class="${x.err || S.rtick[x.b.id] === false ? 'st-off' : ''}"><td><input type="checkbox" data-rt="${x.b.id}"${S.rtick[x.b.id] === false ? '' : ' checked'}></td>
<td>${BT[x.type]}</td><td>${esc(x.now || '(no name)')}</td><td><input type="text" class="st-name" data-ed="${x.b.id}" maxlength="28" value="${esc(x.to)}"></td>
<td class="${x.err ? 'st-bad' : ''}">${x.err ? esc(x.err) : S.rtick[x.b.id] === false ? 'Left as it is' : 'Ready'}</td></tr>`).join('') || '<tr><td colspan="5">Nothing to rename with these choices.</td></tr>'}
</tbody></table>
<div class="st-w"><button class="st-go" id="st-rgo"${ready && !S.busy ? '' : ' disabled'}>Approve ${ready} rename${ready === 1 ? '' : 's'}</button>
<button class="st-next" data-step="3">Next: moves →</button></div>
<p style="font-size:13px">Renames can be done from anywhere – the crews don't need to be on the rock.</p>`;
  }

  function step3() {
    const { job } = renamePlan();
    const plan = movePlan(job);
    const store = onRock().filter(isStore).sort((a, b) => nm(a).localeCompare(nm(b)));
    const bOpts = (tank) => [[0, '— don’t move —']].concat(store.filter((b) => !tank || b.Building.buildingType === TANK || true).map((b) => [b.id, (nm(b) || 'Building #' + b.id) + (b.Building.buildingType === TANK ? ' (tank)' : '')]));
    const ok = plan.rows.filter((x) => x.state === 'ok');
    const picked = ok.filter((x) => S.mtick[x.key]);
    if (!Object.keys(S.mtick).length && !S.mtinit) { S.mtinit = true; ok.filter((x) => !S.sent[x.key]).slice(0, S.bs === 'All' ? Infinity : S.bs).forEach((x) => { S.mtick[x.key] = 1; }); return step3(); }
    return `<h3>Step 3: moves</h3>
<p>Pick where each kind of goods should live. The first building fills to 95%, then the overflow takes the rest. Goods already in their place stay put.</p>
<table><thead><tr><th>Goods</th><th>What's in it</th><th>Goes to</th><th>Overflow</th></tr></thead><tbody>
${GROUPS.map(([g, n, tank]) => `<tr><td>${esc(n)}${tank ? ' <span style="color:#8b9ab0;font-size:12px">(tank)</span>' : ''}</td><td style="color:#8b9ab0;font-size:13px">${esc(GDESC[g])}</td>
<td>${sel('st-g-' + g + '-0', bOpts(tank), S.groups[g][0])}</td><td>${sel('st-g-' + g + '-1', bOpts(tank), S.groups[g][1])}</td></tr>`).join('')}
</tbody></table>
<h3>Leave alone</h3>
<p>Ticked buildings are not touched – nothing is taken out or put in (e.g. stock you sell).</p>
<div class="st-w">${store.map((b) => `<label style="margin-right:10px"><input type="checkbox" data-lv="${b.id}"${S.leave[b.id] ? ' checked' : ''}> ${esc(nm(b) || 'Building #' + b.id)}</label>`).join('')}</div>
<h3>Who moves it</h3>
<div class="st-w">${plan.crews.length ? sel('st-mover', plan.crews.map((c) => [c.id, c.name + ' – free transport ×' + c.free.toFixed(2) + (c.busy ? ' – busy until ' + c.busy : '')]), S.mover) : '<span class="st-bad">None of your crews is on this rock right now – fly one there to move goods.</span>'}
<span style="color:#8b9ab0;font-size:13px">best first: deliveries inside the free transport distance arrive straight away</span></div>
<h3>Deliveries (${plan.rows.length})</h3>
<div class="st-w"><label>Deliveries per approval ${sel('st-bs', BATCHES.map((n) => [n, n]), S.bs)}</label><button id="st-tick">Tick the next ${S.bs === 'All' ? 'all' : S.bs}</button><button id="st-untick">Untick all</button></div>
<table><thead><tr><th></th><th>From</th><th>To</th><th>Goods</th><th>Check</th></tr></thead><tbody>
${plan.rows.map((x) => `<tr class="${x.state === 'ok' ? '' : 'st-off'}"><td>${x.state === 'ok' ? `<input type="checkbox" data-mt="${esc(x.key)}"${S.mtick[x.key] ? ' checked' : ''}>` : ''}</td>
<td>${esc(x.fromN)}</td><td class="st-to">${esc(x.toN)}</td><td>${x.items.map((it) => esc(pname(it.p)) + ' ' + amt(it.p, it.a)).join('<br>')}</td><td>${S.sent[x.key] ? 'Sent ✓' : esc(x.note)}</td></tr>`).join('') || '<tr><td colspan="5">Nothing to move – everything is in its place ✓</td></tr>'}
</tbody></table>
<div class="st-w"><button class="st-go" id="st-mgo"${picked.length && !S.busy ? '' : ' disabled'}>Approve ${picked.length} deliver${picked.length === 1 ? 'y' : 'ies'}</button>
<button class="st-next" data-step="4">Next: finish →</button></div>
<h3>How full afterwards</h3>
<table><thead><tr><th>Storage</th><th>Weight</th><th>Space</th></tr></thead><tbody>
${plan.fill.sort((a, b) => Math.max(b[1], b[2]) - Math.max(a[1], a[2])).map(([n, w, v]) => `<tr><td>${esc(n)}</td><td>${bar(w)}</td><td>${bar(v)}</td></tr>`).join('')}
</tbody></table>`;
  }

  function step4() {
    return `<h3>Step 4: finish</h3>
<p>Each delivery shows up in the game as a <b>Ready</b> "Surface Transfer" for the crew that moved it.</p>
<p>In the game, open that crew and press <b>Finish All Ready Items</b> – that finishes them all at once.</p>
<p>Then press <b>↻ Check again</b> above. Step 3 should say "Nothing to move – everything is in its place ✓", and step 1 shows how full each building is now.</p>`;
  }

  function wire(m) {
    const q = (s) => m.querySelector(s), qa = (s) => m.querySelectorAll(s);
    qa('[data-step]').forEach((b) => b.addEventListener('click', () => { S.step = +b.dataset.step; S.msg = ''; page(m); scrollTo(0, 0); }));
    qa('[data-rock]').forEach((b) => b.addEventListener('click', () => { if (S.busy) return; S.rock = b.dataset.rock; S.edit = {}; S.rtick = {}; S.groups = null; S.leave = {}; S.mover = null; S.mtick = {}; S.mtinit = false; S.sent = {}; S.msg = ''; page(m); }));
    const rl = q('#st-reload'); if (rl) rl.addEventListener('click', () => { if (!S.loading) reload(m); });
    const pf = q('#st-prefix');
    if (pf) pf.addEventListener('change', () => { S.prefix = pf.value.replace(/[^A-Za-z0-9 ]/g, '').trim(); S.edit = {}; page(m); });
    qa('select[id^="st-s-"]').forEach((s) => s.addEventListener('change', () => { S.style[s.id.slice(5)] = s.value; S.edit = {}; S.groups = null; page(m); }));
    qa('input[data-ed]').forEach((i) => i.addEventListener('change', () => { S.edit[i.dataset.ed] = i.value.trim(); page(m); }));
    qa('input[data-rt]').forEach((c) => c.addEventListener('change', () => { S.rtick[c.dataset.rt] = c.checked; page(m); }));
    const rg = q('#st-rgo'); if (rg) rg.addEventListener('click', () => start(m, () => renamePlan().order.map((x) => ({ contract_address: DISPATCHER, entry_point: 'run_system', calldata: [short('ChangeName'), '0x5', '0x5', hex(x.b.id), short(x.to), '0x1', hex(x.crew)] })), 'rename'));
    qa('select[id^="st-g-"]').forEach((s) => s.addEventListener('change', () => { const [, , g, k] = s.id.split('-'); S.groups[g][+k] = +s.value; S.mtick = {}; S.mtinit = false; page(m); }));
    qa('input[data-lv]').forEach((c) => c.addEventListener('change', () => { S.leave[c.dataset.lv] = c.checked; S.mtick = {}; S.mtinit = false; page(m); }));
    const mvr = q('#st-mover'); if (mvr) mvr.addEventListener('change', () => { S.mover = +mvr.value; page(m); });
    const bs = q('#st-bs'); if (bs) bs.addEventListener('change', () => { S.bs = bs.value === 'All' ? 'All' : +bs.value; S.mtick = {}; S.mtinit = false; page(m); });
    const tk = q('#st-tick'); if (tk) tk.addEventListener('click', () => { S.mtick = {}; S.mtinit = false; page(m); });
    const ut = q('#st-untick'); if (ut) ut.addEventListener('click', () => { S.mtick = {}; S.mtinit = true; page(m); });
    qa('input[data-mt]').forEach((c) => c.addEventListener('change', () => { if (c.checked) S.mtick[c.dataset.mt] = 1; else delete S.mtick[c.dataset.mt]; S.mtinit = true; page(m); }));
    const mg = q('#st-mgo');
    if (mg) mg.addEventListener('click', () => {
      const plan = movePlan(renamePlan().job);
      const picked = plan.rows.filter((x) => x.state === 'ok' && S.mtick[x.key]);
      S.lastPicked = picked.map((x) => x.key);
      start(m, () => picked.map((x) => {
        const data = [5, x.from, SLOT, x.items.length, ...x.items.flatMap((it) => [it.p, it.a]), 5, x.to, SLOT, 1, S.mover];
        return { contract_address: DISPATCHER, entry_point: 'run_system', calldata: [short('SendDelivery'), hex(data.length), ...data.map(hex)] };
      }), 'delivery');
    });
  }

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
    if (!list.length) return say(m, 'No Starknet wallet found in this browser. Open this page in the browser that has your wallet.', true);
    if (list.length === 1) return send(m, build, kind, list[0]);
    wl.innerHTML = '<span>Pick the wallet to approve with:</span>' + list.map((w, i) => `<button data-i="${i}">${esc(w.name)}</button>`).join('');
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
      if (typeof w.request === 'function') res = await w.request({ type: 'wallet_addInvokeTransaction', params: { calls } });
      else if (w.account && typeof w.account.execute === 'function') res = await w.account.execute(calls.map((c) => ({ contractAddress: c.contract_address, entrypoint: c.entry_point, calldata: c.calldata })));
      else throw new Error('This wallet cannot send transactions from a web page.');
      const h = res && (res.transaction_hash || res.transactionHash);
      if (kind === 'delivery') (S.lastPicked || []).forEach((k) => { S.sent[k] = 1; delete S.mtick[k]; });
      say(m, '✓ Sent to the game. ' + (h ? `Transaction <a href="https://voyager.online/tx/${esc(h)}" target="_blank" rel="noopener noreferrer">${esc(String(h).slice(0, 10))}…</a>. ` : '') +
        (kind === 'rename' ? 'In a minute or two press ↻ Check again – the new names then show here.' : 'Finish them in the game with Finish All Ready Items, then press ↻ Check again.'));
    } catch (e) {
      const t = String((e && e.message) || e || '');
      say(m, /reject|cancel|abort|denied|User/i.test(t) ? 'Cancelled in the wallet – nothing was changed.' : 'Not sent: ' + esc(t), true);
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
