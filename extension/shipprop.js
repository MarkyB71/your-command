// Skippy's Command Deck – ship propellant % (runs on game.influenceth.io, in the page).
// Adds a propellant bar along the bottom of each ship's row in the game's My Assets › Ships list.
// Same tank sizes as the Command Deck site (Light Transport 4 kt, Heavy Transport 24 kt, Shuttle 2 kt).
//   bar fades red (10% and under) -> yellow (25%) -> green (half a tank or more)
// It only READS what the game has already loaded (no requests of its own), checks every 5 s,
// never clicks or changes anything, and switches itself off quietly if a game update moves things.
(() => {
  if (window.top !== window) return;
  const root = document.documentElement;
  const note = t => { if (root) root.dataset.yicShipProp = t; };
  const COL = { green: '#57ff65', yellow: '#ffd94f', red: '#ff564d' }; // the game's own colours
  const TYPE = { 1: 'Escape Module', 2: 'Light Transport', 3: 'Heavy Transport', 4: 'Shuttle' }; // sdk Ship.TYPES
  const TANK = { 2: 4000, 3: 24000, 4: 2000 }; // tonnes of propellant when full (same as the site)
  // product names – some ships carry these as names, so never tag a label that is a resource
  // (stops bars showing in the lot Resources / My Deposits panel)
  const PRODUCT_NAMES = new Set(["Acetylene", "Acrylonitrile", "Alumina", "Alumina Ceramic", "Aluminium", "Aluminium Beam", "Aluminium Hull Plate", "Aluminium Pipe", "Aluminium Sheet", "Aluminium Truss", "Ammonia", "Ammonium Carbonate", "Ammonium Chloride", "Ammonium Diuranate", "Ammonium Oxalate", "Ammonium Paratungstate", "Apatite", "Attitude Control Module", "Austenitic Nichrome", "Avionics Module", "Ball Bearing", "Ball Valve", "Bare Circuit Board", "Bare Copper Wire", "Beryllia", "Beryllia Ceramic", "Beryllium Carbonate", "Bisphenol A", "Bitumen", "Borax", "Boria", "Boric Acid", "Boron", "Borosilicate Glass", "Brushless Motor", "Brushless Motor Rotor", "Brushless Motor Stator", "CCD", "Calcite", "Calcium", "Calcium Chloride", "Carbon Dioxide", "Carbon Fiber", "Carbon Monoxide", "Cargo Module", "Cargo Ring", "Cement", "Chlorine", "Chromia", "Chromium", "Circuit Board", "Closed-cycle Gas Core Nuclear Reactor Engine", "Coffinite", "Cold Gas Thruster", "Cold Gas Torque Thruster", "Composite-overwrapped Reactor Shell", "Computer", "Computer Chip", "Control Moment Gyroscope", "Copper", "Copper Wire", "Core Drill", "Core Drill Bit", "Core Drill Thruster", "Deionized Water", "Diepoxy Prepolymer Resin", "Diode", "Engine Bell", "Epichlorohydrin", "Epoxy", "Escape Module", "Feldspar", "Ferrite", "Ferrite-bead Inductor", "Ferrochromium", "Ferromolybdenum", "Ferrosilicon", "Fiber Optic Cable", "Fiber Optic Gyroscope", "Fiberglass", "Flow Divider Moderator", "Fluids Automation Module", "Fluorine", "Food", "Fuel Make-up Tank", "Fused Quartz", "Fused Quartz Lightbulb Tube", "Gold", "Graphite", "Habitation Module", "Heat Exchanger", "Heavy Transport Hull", "Highly Enriched Uranium Hexafluoride", "Highly Enriched Uranium Powder", "Hydrochloric Acid", "Hydrofluoric Acid", "Hydrogen", "Hydrogen Heptafluorotantalate and Niobate", "Hydrogen Propellant", "Iron", "Iron Oxide", "Iron Sulfide", "Landing Auger", "Landing Leg", "Large Thrust Bearing", "Laser Diode", "Leached Coffinite", "Leached Feldspar", "Lead", "Lead Sulfide", "LiPo Battery", "Light Transport Hull", "Lightbulb End Moderators", "Lithium", "Lithium Carbonate", "Lithium Chloride", "Lithium Sulfate", "Magnesia", "Magnesium", "Magnesium Chloride", "Merrillite", "Methane", "Mobility Module", "Molybdenum Disulfide", "Molybdenum Trioxide", "Naphtha", "Natural Flavorings", "Nd:YAG Laser", "Nd:YAG Laser Rod", "Neodymium", "Neodymium Magnet", "Neodymium Oxide", "Neodymium Trichloride", "Neon", "Neon Make-up Tank", "Neon/Fuel Separator Centrifuge", "Nichrome", "Nickel", "Nickel Oxide", "Nitric Acid", "Nitrogen", "Novolak Prepolymer Resin", "Nuclear Lightbulb", "Olivine", "Oxalic Acid", "Oxygen", "PEDOT", "Parabolic Dish", "Phosphate and Sulfate Salts", "Phosphoric Acid", "Photoresist Epoxy", "Photovoltaic Panel", "Platinum", "Polyacrylonitrile", "Polyacrylonitrile Fabric", "Polymer Tantalum Capacitor", "Polypropylene", "Potassium Carbonate", "Potassium Chloride", "Potassium Fluoride", "Potassium Heptafluorotantalate", "Potassium Hydroxide", "Potatoes", "Power Module", "Pressure Vessel", "Propellant Tank", "Propulsion Module", "Propylene", "Pump", "Pure Nitrogen", "Pyroxene", "Quicklime", "Radio Antenna", "Rare Earth Oxides", "Rare Earth Sulfates", "Raw Salts", "Reactor Plumbing Assembly", "Rhabdite", "Rhabdite Slag", "Roasted Rhabdite", "Robotic Arm", "Shuttle Hull", "Silica", "Silica Powder", "Silicon", "Silicon Wafer", "Silver", "Small Propellant Tank", "Sodium Bicarbonate", "Sodium Carbonate", "Sodium Chloride", "Sodium Chromate", "Sodium Dichromate", "Sodium Hydroxide", "Sodium Tungstate", "Soil", "Solder", "Solids Automation Module", "Soybeans", "Spirulina and Chlorella Algae", "Stainless Steel", "Stainless Steel Pipe", "Stainless Steel Sheet", "Star Tracker", "Steel", "Steel Beam", "Steel Cable", "Steel Pipe", "Steel Sheet", "Steel Truss", "Steel Wire", "Sulfur", "Sulfur Dioxide", "Sulfuric Acid", "Surface Mount Device Reel", "Taenite", "Tantalum", "Terrain Interface Module", "Thermal Module", "Thin-film Resistor", "Tin", "Tin Sulfide", "Triple Superphosphate", "Troilite", "Tungsten", "Tungsten Powder", "Turbopump", "Unenriched Uranium Hexafluoride", "Uraninite", "Uranium Dioxide", "Uranium Tetrafluoride", "Uranyl Nitrate", "Water", "Weathered Olivine", "Xenotime", "Yellowcake", "Yttria", "Zinc", "Zinc Oxide"]);

  let qc = null;
  function findQueryClient() {
    let start = null;
    for (const el of document.querySelectorAll('body *')) {
      const k = Object.keys(el).find(k => k.startsWith('__reactFiber$'));
      if (k) { start = el[k]; break; }
    }
    if (!start) return null;
    let f = start; while (f.return) f = f.return;
    const stack = [f]; let n = 0;
    while (stack.length && n < 300000) {
      const x = stack.pop(); n++;
      const p = x.memoizedProps;
      if (p && p.client && typeof p.client.getQueryCache === 'function') return p.client;
      if (x.sibling) stack.push(x.sibling);
      if (x.child) stack.push(x.child);
    }
    return null;
  }

  // the game's own ship name (formatters.shipName)
  const nameOf = s => (s.Name && s.Name.name) || ((TYPE[s.Ship.shipType] || 'Ship') + ' #' + Number(s.id).toLocaleString());
  // propellant left, as a % of a full tank (propellant inventories are types 11–14; mass is in grams)
  function propOf(s) {
    const tank = TANK[s.Ship.shipType]; if (!tank) return null;
    const p = (s.Inventories || []).find(i => i && i.inventoryType >= 11 && i.inventoryType <= 14);
    const t = p ? (p.mass || 0) / 1e6 : 0;
    return { pct: Math.round(Math.min(1, t / tank) * 100), t, tank };
  }

  // name -> propellant, from every ship the game has loaded
  function readShips() {
    if (!qc) qc = findQueryClient();
    if (!qc) return null;
    const out = new Map();
    const take = s => {
      if (!s || typeof s !== 'object' || !s.Ship || !s.id) return;
      const p = propOf(s); if (p) out.set(nameOf(s), p);
    };
    qc.getQueryCache().getAll().forEach(q => {
      const d = q.state && q.state.data;
      if (!d) return;
      if (Array.isArray(d)) d.forEach(take);
      else if (Array.isArray(d.hits)) d.hits.forEach(take);
      else take(d);
    });
    return out;
  }

  const mix = (a, b, t) => '#' + [0, 2, 4].map(i => Math.round(parseInt(a.substr(1 + i, 2), 16) * (1 - t) + parseInt(b.substr(1 + i, 2), 16) * t).toString(16).padStart(2, '0')).join('');
  function colour(pct) {
    if (pct <= 10) return COL.red;
    if (pct <= 25) return mix(COL.red, COL.yellow, (pct - 10) / 15);
    if (pct < 50) return mix(COL.yellow, COL.green, (pct - 25) / 25);
    return COL.green;
  }
  const fmtT = t => t < 1 ? Math.round(t * 1000).toLocaleString() + ' kg' : t < 1000 ? Math.round(t).toLocaleString() + ' t' : (+(t / 1000).toFixed(2)).toLocaleString() + ' kt';
  // One strip over the bottom of the ship's row: "Propellant  [bar]  75%"
  function tag(p) {
    const c = colour(p.pct);
    const r = document.createElement('div');
    r.className = 'yic-prop';
    r.dataset.pct = p.pct;
    r.title = 'Propellant ' + fmtT(p.t) + ' of ' + fmtT(p.tank) + ' (Skippy\'s Command Deck)';
    // laid over the row's bottom edge so it adds no height
    r.style.cssText = 'position:absolute;left:0;right:0;bottom:0;z-index:2;display:flex;align-items:center;gap:8px;box-sizing:border-box;'
      + 'padding:2px 6px;font-size:10px;line-height:1;color:#aaa;letter-spacing:.03em;background:rgba(0,0,0,.6);pointer-events:none';
    const l = document.createElement('span');
    l.textContent = 'Propellant';
    const bar = document.createElement('span');
    bar.style.cssText = 'flex:1;height:4px;border:1px solid rgba(255,255,255,.25);border-radius:3px;background:rgba(0,0,0,.45);overflow:hidden';
    const f = document.createElement('span');
    f.style.cssText = 'display:block;height:100%;width:' + p.pct + '%;background:' + c + ';box-shadow:0 0 4px ' + c;
    bar.appendChild(f);
    const n = document.createElement('span');
    n.textContent = p.pct + '%';
    n.style.cssText = 'min-width:30px;text-align:right;font-weight:600;color:' + c;
    r.append(l, bar, n);
    return r;
  }
  // the ship's row = the first box above its name label that holds the picture, the name and the status
  function rowOf(label) {
    for (let x = label.parentElement, i = 0; x && x !== document.body && i < 4; x = x.parentElement, i++)
      if (x.children.length >= 3 && getComputedStyle(x).display === 'flex' && getComputedStyle(x).flexDirection === 'row') return x;
    return null;
  }

  function refresh() {
    const ships = readShips();
    if (!ships) { note('waiting for the game'); return; }
    if (!ships.size) { note('no ships loaded yet'); return; }
    // ship names are shown in <label>s in the game's asset lists
    let n = 0;
    const seen = new Set();
    document.querySelectorAll('label').forEach(lb => {
      const s = lb.textContent.trim();
      if (PRODUCT_NAMES.has(s)) return;
      const p = ships.get(s);
      if (!p) return;
      const row = rowOf(lb); if (!row) return;
      seen.add(row);
      const old = row.querySelector(':scope > .yic-prop');
      if (old && old.dataset.pct === String(p.pct)) { n++; return; }
      if (old) old.remove();
      if (getComputedStyle(row).position === 'static') row.style.position = 'relative';
      row.appendChild(tag(p)); n++;
    });
    document.querySelectorAll('.yic-prop').forEach(b => { if (!seen.has(b.parentElement)) b.remove(); });
    note(n ? n + ' ships labelled' : 'ship list not open');
  }

  note('starting');
  let waited = 0;
  const go = setInterval(() => {
    const raw = root.dataset.yicOpts;
    if (!raw) { if (++waited > 60) { clearInterval(go); note('options not found'); } return; }
    clearInterval(go);
    let on = true; try { on = JSON.parse(raw).shipProp !== false; } catch (e) {}
    if (!on) { note('switched off in options'); return; }
    const tick = () => { try { refresh(); } catch (e) { note('paused – ' + e.message); } };
    tick(); setInterval(tick, 5000);
  }, 1000);
})();
