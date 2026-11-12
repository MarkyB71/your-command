// Skippy's Command Deck – browser extension (background).
// Finds your open Influence game tab and moves it to a building / lot / ship /
// crew / asteroid WITHOUT reloading the game. It only ever accepts simple paths
// like /building/123 – nothing else can be sent to the game.
const GAME = 'https://game.influenceth.io';
const SITE = 'https://your-command.adalia.academy';
const OK = /^\/(building|lot|ship|asteroids|crew|crewmate)\/\d{1,20}$/;
// At most one jump every 0.7 s, so a page can't keep pulling the game tab to the front.
let last = 0;

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg && (msg.type === 'yic-markets' || msg.type === 'yic-flights')) return; // answered by the listeners below
  // "SkippyChain ↗" button in the game's process window (chainlink.js): open it on the Command Deck.
  if (msg && msg.type === 'yic-chain' && sender.tab && sender.origin === GAME) {
    const n = typeof msg.n === 'string' ? msg.n.trim() : '', a = typeof msg.a === 'string' ? msg.a.trim() : '';
    const r = Math.round(+msg.r);
    if (!/^[\w ,.()'&/:+-]{2,120}$/.test(n) || !(r >= 1 && r <= 1e7) || !/^[\w ,.()'&/:+#-]{0,60}$/.test(a)) {
      reply({ ok: false, error: 'bad request' }); return;
    }
    const now = Date.now();
    if (now - last < 700) { reply({ ok: false, error: 'too fast' }); return; }
    last = now;
    openChain(n, r, a).then(() => reply({ ok: true }), () => reply({ ok: false })); return true;
  }
  // "Command Deck" button on the game page: jump back to the site.
  if (msg && msg.type === 'yic-deck' && sender.tab && sender.origin === GAME) {
    goDeck().then(() => reply({ ok: true }), () => reply({ ok: false })); return true;
  }
  if (!msg || msg.type !== 'yic-open' || typeof msg.path !== 'string' || !OK.test(msg.path)) {
    reply({ ok: false, error: 'bad request' }); return;
  }
  // Messages come from our site's page only.
  if (!sender.tab || sender.origin !== SITE) { reply({ ok: false, error: 'not allowed' }); return; }
  const now = Date.now();
  if (now - last < 700) { reply({ ok: false, error: 'too fast' }); return; }
  last = now;
  openInGame(msg.path).then(reply, () => reply({ ok: false, error: 'could not reach the game tab' }));
  return true; // reply later
});

async function openInGame(path) {
  const tabs = await chrome.tabs.query({ url: GAME + '/*' });
  if (!tabs.length) {
    await chrome.tabs.create({ url: GAME + path }); // no game open: normal deep link
    return { ok: true, mode: 'new-tab' };
  }
  const t = tabs.find(x => x.active) || tabs[0];
  await chrome.tabs.update(t.id, { active: true });
  await chrome.windows.update(t.windowId, { focused: true });
  await chrome.scripting.executeScript({
    target: { tabId: t.id },
    world: 'MAIN',
    func: p => {
      history.pushState({}, '', p);
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    },
    args: [path]
  });
  return { ok: true, mode: 'same-tab' };
}

// Opens a process in The SkippyChain: in the open Command Deck tab (no reload), or a new tab if none.
async function openChain(n, r, a) {
  const tabs = await chrome.tabs.query({ url: SITE + '/*' });
  if (!tabs.length) {
    const q = new URLSearchParams({ pcn: n, pcr: String(r) }); if (a) q.set('pca', a);
    await chrome.tabs.create({ url: SITE + '/?' + q.toString() + '#vH' }); return;
  }
  const t = tabs.find(x => x.active) || tabs[0];
  await chrome.tabs.update(t.id, { active: true });
  await chrome.windows.update(t.windowId, { focused: true });
  await chrome.scripting.executeScript({
    target: { tabId: t.id },
    world: 'MAIN',
    func: (n, r, a) => window.postMessage({ type: 'yic-chain', n, r, a }, location.origin),
    args: [n, r, a]
  });
}

// Toolbar icon: jump back to the Command Deck tab (or open it if none).
chrome.action.onClicked.addListener(goDeck);
async function goDeck() {
  const tabs = await chrome.tabs.query({ url: SITE + '/*' });
  if (!tabs.length) { await chrome.tabs.create({ url: SITE + '/' }); return; }
  const t = tabs.find(x => x.active) || tabs[0];
  await chrome.tabs.update(t.id, { active: true });
  await chrome.windows.update(t.windowId, { focused: true });
}

// Open marketplaces for the system map (maptags.js), from the Command Deck's belt-wide market list.
// Only the game tab may ask; the list is kept for 5 minutes (the server rebuilds it every 5 minutes too).
let mkt = null, mktAt = 0, mktBusy = null;
// product id -> [name, grams per unit, counted item (1) or bulk (0)] – same table as the Command Deck site
const PRODUCTS = {"1":["Water",1000,0],"2":["Hydrogen",1000,0],"3":["Ammonia",1000,0],"4":["Nitrogen",1000,0],"5":["Sulfur Dioxide",1000,0],"6":["Carbon Dioxide",1000,0],"7":["Carbon Monoxide",1000,0],"8":["Methane",1000,0],"9":["Apatite",1000,0],"10":["Bitumen",1000,0],"11":["Calcite",1000,0],"12":["Feldspar",1000,0],"13":["Olivine",1000,0],"14":["Pyroxene",1000,0],"15":["Coffinite",1000,0],"16":["Merrillite",1000,0],"17":["Xenotime",1000,0],"18":["Rhabdite",1000,0],"19":["Graphite",1000,0],"20":["Taenite",1000,0],"21":["Troilite",1000,0],"22":["Uraninite",1000,0],"23":["Oxygen",1000,0],"24":["Deionized Water",1000,0],"25":["Raw Salts",1000,0],"26":["Silica",1000,0],"27":["Naphtha",1000,0],"28":["Sodium Bicarbonate",1000,0],"29":["Iron",1000,0],"30":["Copper",1000,0],"31":["Nickel",1000,0],"32":["Quicklime",1000,0],"33":["Acetylene",1000,0],"34":["Ammonium Carbonate",1000,0],"35":["Triple Superphosphate",1000,0],"36":["Phosphate and Sulfate Salts",1000,0],"37":["Iron Sulfide",1000,0],"38":["Lead Sulfide",1000,0],"39":["Tin Sulfide",1000,0],"40":["Molybdenum Disulfide",1000,0],"41":["Fused Quartz",1000,0],"42":["Fiberglass",1000,0],"43":["Bare Copper Wire",1000,0],"44":["Cement",1000,0],"45":["Sodium Chloride",1000,0],"46":["Potassium Chloride",1000,0],"47":["Borax",1000,0],"48":["Lithium Carbonate",1000,0],"49":["Magnesium Chloride",1000,0],"50":["Propylene",1000,0],"51":["Sulfur",1000,0],"52":["Steel",1000,0],"53":["Silicon",1000,0],"54":["Nitric Acid",1000,0],"55":["Sulfuric Acid",1000,0],"56":["Soil",1000,0],"57":["Ferrosilicon",1000,0],"58":["Weathered Olivine",1000,0],"59":["Oxalic Acid",1000,0],"60":["Silver",1000,0],"61":["Gold",1000,0],"62":["Tin",1000,0],"63":["Iron Oxide",1000,0],"64":["Spirulina and Chlorella Algae",1000,0],"65":["Molybdenum Trioxide",1000,0],"66":["Silica Powder",1000,0],"67":["Solder",1000,0],"68":["Fiber Optic Cable",1000,0],"69":["Steel Beam",1000,0],"70":["Steel Sheet",1000,0],"71":["Steel Pipe",1000,0],"72":["Steel Wire",1000,0],"73":["Acrylonitrile",1000,0],"74":["Polypropylene",1000,0],"75":["Magnesium",1000,0],"76":["Chlorine",1000,0],"77":["Sodium Carbonate",1000,0],"78":["Calcium Chloride",1000,0],"79":["Boria",1000,0],"80":["Lithium Sulfate",1000,0],"81":["Hydrochloric Acid",1000,0],"82":["Hydrofluoric Acid",1000,0],"83":["Phosphoric Acid",1000,0],"84":["Boric Acid",1000,0],"85":["Zinc Oxide",1000,0],"86":["Nickel Oxide",1000,0],"87":["Magnesia",1000,0],"88":["Alumina",1000,0],"89":["Sodium Hydroxide",1000,0],"90":["Potassium Hydroxide",1000,0],"91":["Soybeans",1000,0],"92":["Potatoes",1000,0],"93":["Ammonium Oxalate",1000,0],"94":["Rare Earth Sulfates",1000,0],"95":["Ferrochromium",1000,0],"96":["Yellowcake",1000,0],"97":["Alumina Ceramic",1000,0],"98":["Austenitic Nichrome",1000,0],"99":["Copper Wire",1000,0],"100":["Silicon Wafer",1000,0],"101":["Steel Cable",1000,0],"102":["Polyacrylonitrile",1000,0],"103":["Natural Flavorings",1000,0],"104":["Platinum",1000,0],"105":["Lithium Chloride",1000,0],"106":["Zinc",1000,0],"107":["Epichlorohydrin",1000,0],"108":["Bisphenol A",1000,0],"109":["Rare Earth Oxides",1000,0],"110":["Ammonium Chloride",1000,0],"111":["Aluminium",1000,0],"112":["Calcium",1000,0],"113":["Sodium Chromate",1000,0],"114":["Leached Coffinite",1000,0],"115":["Uranyl Nitrate",1000,0],"116":["Fluorine",1000,0],"117":["Sodium Tungstate",1000,0],"118":["Ferrite",1000,0],"119":["Diode",1000,0],"120":["Laser Diode",1000,0],"121":["Ball Valve",1000,0],"122":["Aluminium Beam",1000,0],"123":["Aluminium Sheet",1000,0],"124":["Aluminium Pipe",1000,0],"125":["Polyacrylonitrile Fabric",1000,0],"126":["Cold Gas Thruster",3000,1],"127":["Cold Gas Torque Thruster",3000,1],"128":["Carbon Fiber",1000,0],"129":["Food",1000,0],"130":["Small Propellant Tank",6000,1],"131":["Borosilicate Glass",1000,0],"132":["Ball Bearing",1000,0],"133":["Large Thrust Bearing",2000000,1],"134":["Boron",1000,0],"135":["Lithium",1000,0],"136":["Epoxy",1000,0],"137":["Neodymium Oxide",1000,0],"138":["Yttria",1000,0],"139":["Sodium Dichromate",1000,0],"140":["Novolak Prepolymer Resin",1000,0],"141":["Ferromolybdenum",1000,0],"142":["Ammonium Diuranate",1000,0],"143":["Ammonium Paratungstate",1000,0],"144":["Engine Bell",300000,1],"145":["Steel Truss",1500000,1],"146":["Aluminium Hull Plate",600000,1],"147":["Aluminium Truss",1000000,1],"148":["Cargo Module",5000000,1],"149":["Pressure Vessel",1850000,1],"150":["Propellant Tank",3500000,1],"151":["Stainless Steel",1000,0],"152":["Bare Circuit Board",1000,0],"153":["Ferrite-bead Inductor",1000,0],"154":["Core Drill Bit",2000,1],"155":["Core Drill Thruster",10000,1],"156":["Parabolic Dish",72000,1],"157":["Photovoltaic Panel",8000,1],"158":["LiPo Battery",5000,1],"159":["Neodymium Trichloride",1000,0],"161":["Chromia",1000,0],"162":["Photoresist Epoxy",1000,0],"163":["Uranium Dioxide",1000,0],"164":["Tungsten",1000,0],"165":["Shuttle Hull",44600000,1],"166":["Light Transport Hull",74200000,1],"167":["Cargo Ring",10000000,1],"168":["Heavy Transport Hull",480400000,1],"169":["Tungsten Powder",1000,0],"170":["Hydrogen Propellant",1000,0],"171":["Stainless Steel Sheet",1000,0],"172":["Stainless Steel Pipe",1000,0],"173":["CCD",1000,0],"174":["Computer Chip",1000,0],"175":["Core Drill",30000,1],"176":["Neodymium",1000,0],"178":["Chromium",1000,0],"179":["Uranium Tetrafluoride",1000,0],"180":["Pure Nitrogen",1000,0],"181":["Nd:YAG Laser Rod",1000,0],"182":["Nichrome",1000,0],"183":["Neodymium Magnet",1000,0],"184":["Unenriched Uranium Hexafluoride",1000,0],"185":["Highly Enriched Uranium Hexafluoride",1000,0],"186":["Nd:YAG Laser",1000,0],"187":["Thin-film Resistor",1000,0],"188":["Highly Enriched Uranium Powder",1000,0],"189":["Leached Feldspar",1000,0],"190":["Roasted Rhabdite",1000,0],"191":["Rhabdite Slag",1000,0],"192":["Potassium Carbonate",1000,0],"193":["Hydrogen Heptafluorotantalate and Niobate",1000,0],"194":["Lead",1000,0],"195":["Potassium Fluoride",1000,0],"196":["Potassium Heptafluorotantalate",1000,0],"197":["Diepoxy Prepolymer Resin",1000,0],"199":["Tantalum",1000,0],"200":["PEDOT",1000,0],"201":["Polymer Tantalum Capacitor",1000,0],"202":["Surface Mount Device Reel",5000,1],"203":["Circuit Board",1000,0],"204":["Brushless Motor Stator",3000,1],"205":["Brushless Motor Rotor",3000,1],"206":["Brushless Motor",6000,1],"207":["Landing Leg",816000,1],"208":["Landing Auger",144000,1],"209":["Pump",8000,1],"210":["Radio Antenna",75000,1],"211":["Fiber Optic Gyroscope",2000,1],"212":["Star Tracker",2000,1],"213":["Computer",1000,0],"214":["Control Moment Gyroscope",160000,1],"215":["Robotic Arm",300000,1],"217":["Beryllium Carbonate",1000,0],"218":["Beryllia",1000,0],"219":["Beryllia Ceramic",1000,0],"220":["Neon",1000,0],"221":["Heat Exchanger",40000,1],"222":["Turbopump",290000,1],"224":["Neon/Fuel Separator Centrifuge",190000,1],"225":["Fuel Make-up Tank",100000,1],"226":["Neon Make-up Tank",250000,1],"227":["Lightbulb End Moderators",130000,1],"229":["Fused Quartz Lightbulb Tube",50000,1],"230":["Reactor Plumbing Assembly",1942000,1],"231":["Flow Divider Moderator",18700000,1],"232":["Nuclear Lightbulb",180000,1],"233":["Composite-overwrapped Reactor Shell",6000000,1],"234":["Closed-cycle Gas Core Nuclear Reactor Engine",30000000,1],"235":["Habitation Module",2200000,1],"236":["Mobility Module",2000000,1],"237":["Fluids Automation Module",3600000,1],"238":["Solids Automation Module",3600000,1],"239":["Terrain Interface Module",960000,1],"240":["Avionics Module",500000,1],"241":["Escape Module",6665000,1],"242":["Attitude Control Module",660000,1],"243":["Power Module",1000000,1],"244":["Thermal Module",1000000,1],"245":["Propulsion Module",32000000,1]};
async function marketSummary() {
  if (mkt && Date.now() - mktAt < 300000) return mkt;
  if (mktBusy) return mktBusy;
  mktBusy = (async () => {
    const r = await fetch(SITE + '/market.php', { credentials: 'omit', cache: 'no-store' });
    if (!r.ok) throw new Error('market ' + r.status);
    const j = await r.json();
    // orders: [product, type (1 buy / 2 sell), amount, price, marketplace id, asteroid id, crew id, fee]
    const per = {};
    for (const o of (j.orders || [])) {
      const ast = +o[5], m = +o[4]; if (!ast || !m) continue;
      const a = per[ast] || (per[ast] = {});
      const x = a[m] || (a[m] = [((j.markets || {})[m] || {}).name || ('Marketplace #' + m), 0, 0, {}]);
      const type = +o[1], prod = +o[0]; if (type !== 1 && type !== 2) continue;
      if (type === 2) x[1]++; else x[2]++;
      // one line per product and side: total amount, best price (lowest to buy from, highest offer to sell to)
      const k = type + ':' + prod, p = +o[3] / 1e6, it = x[3][k];
      if (!it) x[3][k] = [prod, type, +o[2], p];
      else { it[2] += +o[2]; it[3] = type === 2 ? Math.min(it[3], p) : Math.max(it[3], p); }
    }
    // items: [product name, 2 sell / 1 buy, amount (kg, or count), best price (SWAY per kg, or each), counted item?]
    const data = {};
    for (const ast in per) data[ast] = Object.values(per[ast]).map(x => {
      const items = Object.values(x[3]).map(([prod, type, amt, p]) => {
        const P = PRODUCTS[prod] || ['Product ' + prod, 1000, 0];
        return [P[0], type, P[2] ? amt : amt * P[1] / 1000, P[2] ? p : p / (P[1] / 1000), P[2]]; // bulk: kg and SWAY/kg
      }).sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]));
      return [x[0], x[1], x[2], items];
    }).sort((p, q) => (q[1] + q[2]) - (p[1] + p[2]));
    mkt = { data, fetched: +j.fetched || Math.floor(Date.now() / 1000) }; mktAt = Date.now();
    return mkt;
  })();
  try { return await mktBusy; } finally { mktBusy = null; }
}
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (!msg || msg.type !== 'yic-markets' || !sender.tab || sender.origin !== GAME) return;
  marketSummary().then(m => reply({ ok: true, ...m }), e => reply({ ok: false, error: String(e && e.message || e) }));
  return true;
});

// Other players' ships in flight for the system map (flights.js), from the Command Deck's belt-wide flight list.
// Only the game tab may ask; the list is kept for 5 minutes (the server rebuilds it every 5 minutes too).
let flt = null, fltAt = 0, fltBusy = null;
async function flightList() {
  if (flt && Date.now() - fltAt < 300000) return flt;
  if (fltBusy) return fltBusy;
  fltBusy = (async () => {
    const r = await fetch(SITE + '/flights.php', { credentials: 'omit', cache: 'no-store' });
    if (!r.ok) throw new Error('flights ' + r.status);
    const j = await r.json();
    if (!j || !Array.isArray(j.ships)) throw new Error('flights: no list');
    flt = { data: { ships: j.ships, orbits: j.orbits || {}, names: j.names || {} }, fetched: +j.fetched || Math.floor(Date.now() / 1000) };
    fltAt = Date.now();
    return flt;
  })();
  try { return await fltBusy; } finally { fltBusy = null; }
}
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (!msg || msg.type !== 'yic-flights' || !sender.tab || sender.origin !== GAME) return;
  flightList().then(f => reply({ ok: true, ...f }), e => reply({ ok: false, error: String(e && e.message || e) }));
  return true;
});
