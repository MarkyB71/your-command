(function(){
const VER=(document.currentScript&&new URL(document.currentScript.src).searchParams.get('v'))||'';
const PX={"1":["Water","Volatile",1000,false],"2":["Hydrogen","Volatile",1000,false],"3":["Ammonia","Volatile",1000,false],"4":["Nitrogen","Volatile",1000,false],"5":["Sulfur Dioxide","Volatile",1000,false],"6":["Carbon Dioxide","Volatile",1000,false],"7":["Carbon Monoxide","Volatile",1000,false],"8":["Methane","Volatile",1000,false],"9":["Apatite","Organic",1000,false],"10":["Bitumen","Organic",1000,false],"11":["Calcite","Organic",1000,false],"12":["Feldspar","Metal",1000,false],"13":["Olivine","Metal",1000,false],"14":["Pyroxene","Metal",1000,false],"15":["Coffinite","Fissile",1000,false],"16":["Merrillite","Rare Earth",1000,false],"17":["Xenotime","Rare Earth",1000,false],"18":["Rhabdite","Metal",1000,false],"19":["Graphite","Metal",1000,false],"20":["Taenite","Metal",1000,false],"21":["Troilite","Metal",1000,false],"22":["Uraninite","Fissile",1000,false],"23":["Oxygen","Nonmetal",1000,false],"24":["Deionized Water","Refined Volatile",1000,false],"25":["Raw Salts","Salt",1000,false],"26":["Silica","Oxide",1000,false],"27":["Naphtha","Refined Organic",1000,false],"28":["Sodium Bicarbonate","Carbonate",1000,false],"29":["Iron","Refined Metal",1000,false],"30":["Copper","Refined Metal",1000,false],"31":["Nickel","Refined Metal",1000,false],"32":["Quicklime","Oxide",1000,false],"33":["Acetylene","Refined Organic",1000,false],"34":["Ammonium Carbonate","Carbonate",1000,false],"35":["Triple Superphosphate","Phosphate",1000,false],"36":["Phosphate and Sulfate Salts","Salt",1000,false],"37":["Iron Sulfide","Sulfide",1000,false],"38":["Lead Sulfide","Sulfide",1000,false],"39":["Tin Sulfide","Sulfide",1000,false],"40":["Molybdenum Disulfide","Sulfide",1000,false],"41":["Fused Quartz","Processed Glass",1000,false],"42":["Fiberglass","Fabric",1000,false],"43":["Bare Copper Wire","Processed Metal",1000,false],"44":["Cement","Construction",1000,false],"45":["Sodium Chloride","Salt",1000,false],"46":["Potassium Chloride","Salt",1000,false],"47":["Borax","Salt",1000,false],"48":["Lithium Carbonate","Carbonate",1000,false],"49":["Magnesium Chloride","Salt",1000,false],"50":["Propylene","Refined Organic",1000,false],"51":["Sulfur","Nonmetal",1000,false],"52":["Steel","Alloy",1000,false],"53":["Silicon","Nonmetal",1000,false],"54":["Nitric Acid","Acid",1000,false],"55":["Sulfuric Acid","Acid",1000,false],"56":["Soil","Organic Substrate",1000,false],"57":["Ferrosilicon","Alloy",1000,false],"58":["Weathered Olivine","Semi-refined",1000,false],"59":["Oxalic Acid","Acid",1000,false],"60":["Silver","Refined Metal",1000,false],"61":["Gold","Refined Metal",1000,false],"62":["Tin","Refined Metal",1000,false],"63":["Iron Oxide","Oxide",1000,false],"64":["Spirulina and Chlorella Algae","Ingredient",1000,false],"65":["Molybdenum Trioxide","Oxide",1000,false],"66":["Silica Powder","Powder",1000,false],"67":["Solder","Electronics",1000,false],"68":["Fiber Optic Cable","Processed Glass",1000,false],"69":["Steel Beam","Processed Metal",1000,false],"70":["Steel Sheet","Processed Metal",1000,false],"71":["Steel Pipe","Processed Metal",1000,false],"72":["Steel Wire","Processed Metal",1000,false],"73":["Acrylonitrile","Refined Organic",1000,false],"74":["Polypropylene","Polymer",1000,false],"75":["Magnesium","Refined Metal",1000,false],"76":["Chlorine","Nonmetal",1000,false],"77":["Sodium Carbonate","Carbonate",1000,false],"78":["Calcium Chloride","Salt",1000,false],"79":["Boria","Oxide",1000,false],"80":["Lithium Sulfate","Sulfate",1000,false],"81":["Hydrochloric Acid","Acid",1000,false],"82":["Hydrofluoric Acid","Acid",1000,false],"83":["Phosphoric Acid","Acid",1000,false],"84":["Boric Acid","Acid",1000,false],"85":["Zinc Oxide","Oxide",1000,false],"86":["Nickel Oxide","Oxide",1000,false],"87":["Magnesia","Oxide",1000,false],"88":["Alumina","Oxide",1000,false],"89":["Sodium Hydroxide","Base",1000,false],"90":["Potassium Hydroxide","Base",1000,false],"91":["Soybeans","Ingredient",1000,false],"92":["Potatoes","Ingredient",1000,false],"93":["Ammonium Oxalate","Salt",1000,false],"94":["Rare Earth Sulfates","Sulfate",1000,false],"95":["Ferrochromium","Alloy",1000,false],"96":["Yellowcake","Oxide",1000,false],"97":["Alumina Ceramic","Ceramic",1000,false],"98":["Austenitic Nichrome","Alloy",1000,false],"99":["Copper Wire","Electronics",1000,false],"100":["Silicon Wafer","Crystal",1000,false],"101":["Steel Cable","Processed Metal",1000,false],"102":["Polyacrylonitrile","Polymer",1000,false],"103":["Natural Flavorings","Ingredient",1000,false],"104":["Platinum","Refined Metal",1000,false],"105":["Lithium Chloride","Salt",1000,false],"106":["Zinc","Refined Metal",1000,false],"107":["Epichlorohydrin","Refined Organic",1000,false],"108":["Bisphenol A","Grown Organic",1000,false],"109":["Rare Earth Oxides","Oxide",1000,false],"110":["Ammonium Chloride","Salt",1000,false],"111":["Aluminium","Refined Metal",1000,false],"112":["Calcium","Refined Metal",1000,false],"113":["Sodium Chromate","Salt",1000,false],"114":["Leached Coffinite","Semi-refined",1000,false],"115":["Uranyl Nitrate","Nitrate",1000,false],"116":["Fluorine","Nonmetal",1000,false],"117":["Sodium Tungstate","Salt",1000,false],"118":["Ferrite","Alloy",1000,false],"119":["Diode","Electronics",1000,false],"120":["Laser Diode","Electronics",1000,false],"121":["Ball Valve","Mechanism",1000,false],"122":["Aluminium Beam","Processed Metal",1000,false],"123":["Aluminium Sheet","Processed Metal",1000,false],"124":["Aluminium Pipe","Processed Metal",1000,false],"125":["Polyacrylonitrile Fabric","Fabric",1000,false],"126":["Cold Gas Thruster","Mechanism",3000,true],"127":["Cold Gas Torque Thruster","Mechanism",3000,true],"128":["Carbon Fiber","Fabric",1000,false],"129":["Food","Food",1000,false],"130":["Small Propellant Tank","Mechanism",6000,true],"131":["Borosilicate Glass","Refined Glass",1000,false],"132":["Ball Bearing","Mechanism",1000,false],"133":["Large Thrust Bearing","Mechanism",2000000,true],"134":["Boron","Nonmetal",1000,false],"135":["Lithium","Refined Metal",1000,false],"136":["Epoxy","Adhesive",1000,false],"137":["Neodymium Oxide","Oxide",1000,false],"138":["Yttria","Oxide",1000,false],"139":["Sodium Dichromate","Salt",1000,false],"140":["Novolak Prepolymer Resin","Grown Organic",1000,false],"141":["Ferromolybdenum","Alloy",1000,false],"142":["Ammonium Diuranate","Salt",1000,false],"143":["Ammonium Paratungstate","Salt",1000,false],"144":["Engine Bell","Engine Part",300000,true],"145":["Steel Truss","Hull Module",1500000,true],"146":["Aluminium Hull Plate","Hull Module",600000,true],"147":["Aluminium Truss","Hull Module",1000000,true],"148":["Cargo Module","Hull Module",5000000,true],"149":["Pressure Vessel","Hull Module",1850000,true],"150":["Propellant Tank","Hull Module",3500000,true],"151":["Stainless Steel","Alloy",1000,false],"152":["Bare Circuit Board","Electronics",1000,false],"153":["Ferrite-bead Inductor","Electronics",1000,false],"154":["Core Drill Bit","Mechanism",2000,true],"155":["Core Drill Thruster","Mechanism",10000,true],"156":["Parabolic Dish","Mechanism",72000,true],"157":["Photovoltaic Panel","Electronics",8000,true],"158":["LiPo Battery","Electronics",5000,true],"159":["Neodymium Trichloride","Salt",1000,false],"161":["Chromia","Oxide",1000,false],"162":["Photoresist Epoxy","Adhesive",1000,false],"163":["Uranium Dioxide","Oxide",1000,false],"164":["Tungsten","Refined Metal",1000,false],"165":["Shuttle Hull","Ship Hull",44600000,true],"166":["Light Transport Hull","Ship Hull",74200000,true],"167":["Cargo Ring","Hull Module",10000000,true],"168":["Heavy Transport Hull","Ship Hull",480400000,true],"169":["Tungsten Powder","Powder",1000,false],"170":["Hydrogen Propellant","Propellant",1000,false],"171":["Stainless Steel Sheet","Processed Metal",1000,false],"172":["Stainless Steel Pipe","Processed Metal",1000,false],"173":["CCD","Electro-optical",1000,false],"174":["Computer Chip","Electronics",1000,false],"175":["Core Drill","Tool",30000,true],"176":["Neodymium","Refined Rare Earth",1000,false],"178":["Chromium","Refined Metal",1000,false],"179":["Uranium Tetrafluoride","Fluoride",1000,false],"180":["Pure Nitrogen","Refined Volatile",1000,false],"181":["Nd:YAG Laser Rod","Crystal",1000,false],"182":["Nichrome","Alloy",1000,false],"183":["Neodymium Magnet","Electromechanical",1000,false],"184":["Unenriched Uranium Hexafluoride","Fluoride",1000,false],"185":["Highly Enriched Uranium Hexafluoride","Fluoride",1000,false],"186":["Nd:YAG Laser","Electro-optical",1000,false],"187":["Thin-film Resistor","Electronics",1000,false],"188":["Highly Enriched Uranium Powder","Refined Fissile",1000,false],"189":["Leached Feldspar","Semi-refined",1000,false],"190":["Roasted Rhabdite","Semi-refined",1000,false],"191":["Rhabdite Slag","Semi-refined",1000,false],"192":["Potassium Carbonate","Carbonate",1000,false],"193":["Hydrogen Heptafluorotantalate and Niobate","Fluoride",1000,false],"194":["Lead","Refined Metal",1000,false],"195":["Potassium Fluoride","Fluoride",1000,false],"196":["Potassium Heptafluorotantalate","Fluoride",1000,false],"197":["Diepoxy Prepolymer Resin","Refined Organic",1000,false],"199":["Tantalum","Refined Metal",1000,false],"200":["PEDOT","Grown Organic",1000,false],"201":["Polymer Tantalum Capacitor","Electronics",1000,false],"202":["Surface Mount Device Reel","Electronics",5000,true],"203":["Circuit Board","Electronics",1000,false],"204":["Brushless Motor Stator","Electromechanical",3000,true],"205":["Brushless Motor Rotor","Electromechanical",3000,true],"206":["Brushless Motor","Electromechanical",6000,true],"207":["Landing Leg","Ship Part",816000,true],"208":["Landing Auger","Ship Part",144000,true],"209":["Pump","Electromechanical",8000,true],"210":["Radio Antenna","Electromechanical",75000,true],"211":["Fiber Optic Gyroscope","Electro-optical",2000,true],"212":["Star Tracker","Electro-optical",2000,true],"213":["Computer","Electronics",1000,false],"214":["Control Moment Gyroscope","Electromechanical",160000,true],"215":["Robotic Arm","Electromechanical",300000,true],"217":["Beryllium Carbonate","Carbonate",1000,false],"218":["Beryllia","Oxide",1000,false],"219":["Beryllia Ceramic","Ceramic",1000,false],"220":["Neon","Refined Volatile",1000,false],"221":["Heat Exchanger","Engine Part",40000,true],"222":["Turbopump","Engine Part",290000,true],"224":["Neon/Fuel Separator Centrifuge","Engine Part",190000,true],"225":["Fuel Make-up Tank","Engine Part",100000,true],"226":["Neon Make-up Tank","Engine Part",250000,true],"227":["Lightbulb End Moderators","Engine Part",130000,true],"229":["Fused Quartz Lightbulb Tube","Engine Part",50000,true],"230":["Reactor Plumbing Assembly","Engine Part",1942000,true],"231":["Flow Divider Moderator","Engine Part",18700000,true],"232":["Nuclear Lightbulb","Engine Part",180000,true],"233":["Composite-overwrapped Reactor Shell","Engine Part",6000000,true],"234":["Closed-cycle Gas Core Nuclear Reactor Engine","Engine Part",30000000,true],"235":["Habitation Module","Integration Module",2200000,true],"236":["Mobility Module","Integration Module",2000000,true],"237":["Fluids Automation Module","Integration Module",3600000,true],"238":["Solids Automation Module","Integration Module",3600000,true],"239":["Terrain Interface Module","Integration Module",960000,true],"240":["Avionics Module","Integration Module",500000,true],"241":["Escape Module","Integration Module",6665000,true],"242":["Attitude Control Module","Integration Module",660000,true],"243":["Power Module","Integration Module",1000000,true],"244":["Thermal Module","Integration Module",1000000,true],"245":["Propulsion Module","Integration Module",32000000,true]};const RX=[["Water Electrolysis",1,{"24":9},{"2":1,"23":8}],["Water Vacuum-evaporation Desalination",1,{"1":20},{"24":19,"25":1}],["Sabatier Process",1,{"2":8,"6":44},{"8":16,"24":36}],["Olivine Enhanced Weathering",1,{"6":1936,"13":4526},{"26":1322,"58":5140}],["Bitumen Hydro-cracking",1,{"2":7,"10":200},{"27":60}],["Taenite Electrolytic Refining",1,{"20":20},{"29":15,"30":1,"31":3}],["Calcite Calcination",1,{"11":100},{"6":44,"32":56}],["Huels Process",1,{"8":16},{"33":13}],["Ammonia Carbonation",1,{"3":34,"6":44,"24":18},{"34":96}],["Salt Sulfidization and Phosphorization",1,{"25":8,"29":2,"55":6,"83":4},{"36":17}],["Basic Food Cooking and Packaging",2,{"45":1,"64":120,"91":160,"92":160,"103":39},{"129":480}],["Troilite Centrifugal Froth Flotation",1,{"21":200,"55":193},{"37":160,"38":16,"39":4,"40":10}],["Silica Fusing",2,{"26":1},{"41":1}],["Silica Pultrusion",2,{"26":1},{"42":1}],["Copper Wire Drawing",2,{"30":1},{"43":1}],["Salty Cement Mixing",1,{"1":5,"32":3},{"44":7}],["Salt Selective Crystallization",1,{"25":100},{"45":46,"46":29,"47":2,"48":13,"49":6,"78":5}],["Naphtha Steam-cracking",1,{"24":4,"27":16},{"50":3}],["Steel Alloying",1,{"19":5,"29":994,"112":1},{"52":1000}],["Silica Carbothermic Reduction",1,{"19":24,"26":60},{"7":56,"53":28}],["Ostwald Process",1,{"3":17,"23":64,"24":24},{"54":87}],["Wet Sulfuric Acid Process",1,{"5":64,"23":16,"24":18},{"55":98}],["Fungal Soilbuilding",3,{"10":300000,"24":200000},{"56":500000}],["Iron Oxide and Silica Carbothermic Reduction",1,{"19":123,"26":320,"63":232},{"6":451,"57":224}],["Methane Steam Reforming and Water-gas Shift",1,{"8":16,"24":18},{"2":6,"7":28}],["Acetylene Oxalic Acid Production",1,{"33":39,"54":126},{"59":135}],["Lead Sulfide Smelting",1,{"7":1344,"23":2304,"38":11485},{"5":3072,"6":2112,"194":10049}],["Tin Sulfide Smelting",1,{"7":56,"11":6,"23":108,"39":270},{"5":128,"6":88,"62":238}],["Iron Sulfide Roasting",1,{"23":160,"37":264},{"5":192,"63":232}],["Haber-Bosch Process",1,{"2":6,"180":28},{"3":34}],["Molybdenum Disulfide Roasting",1,{"23":224,"40":320},{"5":256,"65":288}],["Silica Gas Atomization",2,{"26":1},{"66":1}],["Solder Manufacturing",2,{"30":1,"60":6,"62":143},{"67":150}],["Quartz Filament Drawing and Wrapping",2,{"41":1,"74":4},{"68":5}],["Steel Beam Rolling",2,{"52":1},{"69":1}],["Steel Sheet Rolling",2,{"52":1},{"70":1}],["Steel Pipe Rolling",2,{"52":1},{"71":1}],["Steel Wire Drawing",2,{"52":1},{"72":1}],["Propylene Ammoxidation",1,{"3":374,"23":960,"50":841,"55":98},{"24":1080,"73":796}],["Propylene Polymerization",1,{"50":1},{"74":1}],["Magnesium Chloride Molten Salt Electrolysis",1,{"49":95},{"75":24,"76":71}],["Solvay Process",1,{"11":100,"45":117},{"77":106,"78":111}],["Boria Hydration",1,{"24":54,"79":70},{"84":124}],["Pyroxene Acid Leaching, Digestion, and Ion Exchange",1,{"14":2200,"55":294,"89":40},{"80":294,"117":110}],["Apatite Acid Extraction",1,{"9":2051,"55":1960},{"81":73,"82":40,"83":1176}],["Hydrogen Combustion",1,{"2":2,"23":16},{"24":18}],["Carbon Monoxide Combustion",1,{"7":56,"23":32},{"6":88}],["Borax Acid Extraction",1,{"24":90,"47":201,"81":73},{"45":117,"84":247}],["Nitrogen Cryocooling and Fractional Distillation",1,{"4":1000,"112":2},{"180":950,"220":5}],["Olivine Acid Leaching and Calcining",1,{"55":12946,"58":15422},{"5":8456,"6":5809,"23":1984,"24":2378,"63":1852,"85":488,"86":448,"87":3869}],["Anorthite Feldspar Acid Leaching and Carbonation",1,{"12":1096,"34":96,"55":392,"82":80},{"24":144,"189":624,"217":69}],["Sodium Chloralkali Process",1,{"24":36,"45":117},{"2":2,"76":71,"89":80}],["Potassium Chloralkali Process",1,{"24":36,"46":149},{"2":2,"76":71,"90":112}],["Apatite Acid Re-extraction",1,{"9":2051,"83":2743},{"35":468,"81":73,"82":40}],["Ammonium Carbonate Oxalation",1,{"34":96,"59":90},{"6":44,"24":18,"93":124}],["Xenotime Hot Acid Leaching",1,{"17":1614,"55":1176},{"83":784,"94":2006}],["Merrillite Hot Acid Leaching",1,{"16":9314,"55":1177,"81":5542},{"2":8,"45":468,"78":7991,"83":5488,"94":2078}],["Ammonia Catalytic Cracking",1,{"3":40},{"2":6,"180":34}],["Uraninite Acid Leaching, Solvent Extraction, and Precipitation",1,{"3":204,"22":855,"23":32,"55":588},{"96":887}],["Coffinite Acid Leaching, Solvent Extraction, and Precipitation",1,{"3":408,"15":2544,"23":64,"55":1176},{"24":108,"26":180,"96":1774,"114":556}],["Alumina Forming and Sintering",2,{"88":1},{"97":1}],["Austenitic Nichrome Alloying",1,{"31":15,"95":4,"178":1},{"98":20}],["Copper Wire Insulating",2,{"43":17,"74":3},{"99":20}],["Silicon Czochralski Process and Wafer Slicing",2,{"53":720000,"83":1},{"100":432000}],["Steel Cable Laying",2,{"72":1},{"101":1}],["Acrylonitrile Polymerization",1,{"5":1,"73":50},{"102":50}],["Soybean Growing",3,{"3":2600,"6":52000,"24":2200,"35":640,"36":400,"46":840},{"91":26000}],["Boric Acid Thermal Decomposition",1,{"84":124},{"24":54,"79":70}],["Lithium Carbonate Chlorination",1,{"48":74,"81":73},{"6":44,"24":18,"105":85}],["Lithium Sulfate Carbonation",1,{"77":106,"80":110},{"48":74}],["Iron Oxide Direct Reduction",1,{"7":112,"63":232},{"6":176,"29":168}],["Zinc Oxide Direct Reduction",1,{"7":28,"85":81},{"6":44,"106":65}],["Nickel Oxide Direct Reduction",1,{"7":28,"86":75},{"6":44,"31":59}],["Pidgeon Process",1,{"57":28,"87":20},{"26":15,"29":21,"75":12}],["Polypropylene Chlorination and Basification",1,{"74":42,"76":142,"89":80},{"24":18,"45":117,"81":36,"107":93}],["Potato Growing",3,{"3":590,"6":22000,"24":60000,"35":290,"36":100,"46":830},{"92":75600}],["Rare Earth Sulfates Oxalation and Calcination",1,{"89":960,"93":1488,"94":2078},{"3":408,"6":528,"7":336,"24":432,"109":1118}],["Ammonia Chlorination",1,{"3":17,"81":36},{"110":53}],["Hall–Heroult Process",1,{"19":36,"88":102},{"7":84,"111":54}],["Calcium Chloride Molten Salt Electrolysis",1,{"78":111},{"76":71,"112":40}],["Cement Mixing",2,{"24":5,"32":3},{"44":8}],["Natural Flavorings Growing",3,{"3":580,"6":23000,"24":8100,"35":220,"36":350,"46":290},{"103":15500}],["Yellowcake Digestion, Solvent Extraction, and Precipitation",1,{"54":504,"96":887},{"24":72,"115":1182}],["Hydrofluoric Acid Cold Electrolysis",1,{"82":20,"195":58},{"2":1,"116":38}],["Rhabdite Roasting and Acid Extraction",1,{"18":21958,"23":12896,"24":4104},{"83":14890,"190":24068}],["Ferrite Sintering",1,{"23":32,"63":926,"85":244,"86":224},{"118":1426}],["Diode Doping and Assembly",2,{"74":70,"84":1,"100":350},{"119":420}],["Ball Valve Machining",2,{"111":1},{"121":1}],["Aluminium Beam Rolling",2,{"111":1},{"122":1}],["Aluminium Sheet Rolling",2,{"111":1},{"123":1}],["Aluminium Pipe Rolling",2,{"111":1},{"124":1}],["Polyacrylonitrile Weaving",2,{"102":1},{"125":1}],["Cold Gas Thruster Printing",2,{"111":3},{"126":1}],["Polyacrylonitrile Oxidation and Carbonization",1,{"23":224,"102":212},{"24":108,"128":144}],["Aluminium Small Propellant Tank Assembly",2,{"111":6},{"130":1}],["Borosilicate Glassmaking",1,{"26":15,"77":2,"79":2,"88":1},{"131":20}],["Ball Bearing Machining and Assembly",2,{"52":53,"102":2},{"132":55}],["Large Thrust Bearing Machining and Assembly",2,{"52":2000},{"133":1}],["Boria Magnesiothermic Reduction",1,{"75":73,"79":70},{"87":121,"134":22}],["Lithium Chloride Molten Salt Electrolysis",1,{"46":75,"105":42},{"76":71,"135":7}],["Diepoxy Step Growth Polymerization",1,{"89":120,"107":278,"108":456},{"24":54,"45":175,"197":625}],["Rare Earth Oxides Ion Exchange",1,{"109":1118},{"137":336,"138":452}],["Calcium Oxide Aluminothermic Reduction",1,{"32":168,"111":54},{"88":102,"112":120}],["Sodium Chromate Acidification and Crystallization",1,{"81":73,"113":324},{"24":18,"45":117,"139":262}],["Sulfuric Acid Hot Catalytic Reduction",1,{"55":98},{"5":64,"23":16,"24":18}],["Molybdenum Trioxide Aluminothermic Reduction and Alloying",1,{"29":2401,"65":7198,"111":2698},{"88":5098,"141":7199}],["Uranyl Nitrate Redox and Precipitation",1,{"3":324,"24":18,"115":5516},{"142":4369}],["Sodium Tungstate Ion Exchange, Precipitation, and Crystallization",1,{"3":170,"24":396,"117":3526},{"89":960,"143":3132}],["Stainless Steel Alloying",1,{"29":99,"31":16,"95":76,"141":9},{"151":200}],["Board Printing",2,{"30":20,"42":108,"61":1,"136":71},{"152":200}],["Ferrite-bead Inductor Winding",2,{"99":1,"118":8,"136":1},{"153":10}],["Core Drill Bit Milling",2,{"71":2},{"154":1}],["Core Drill Thruster Assembly",2,{"124":5,"127":5,"130":5,"132":1},{"155":5}],["Parabolic Dish Assembly",2,{"99":7,"122":20,"128":27,"136":18},{"156":1}],["Photovoltaic Panel Amorphization and Assembly",2,{"99":1,"100":4,"123":2,"131":1},{"157":5}],["LiPo Battery Assembly",2,{"30":1,"102":28,"111":1,"135":20},{"158":10}],["Neodymium Oxide Chlorination",1,{"110":321,"137":336},{"3":102,"24":54,"159":501}],["Sodium Dichromate Hot Sulfur Reduction",1,{"51":32,"139":262},{"161":152}],["Photoresist Epoxy Stoichiometry and Packaging",2,{"140":2},{"162":1}],["Ammonium Diuranate Calcination and Hydrogen Reduction",1,{"2":4,"142":624},{"3":34,"24":54,"163":540}],["Ammonium Paratungstate Calcination and Hydrogen Reduction",1,{"2":72,"143":3132},{"3":170,"24":828,"164":2206}],["Engine Bell Additive Manufacturing",4,{"98":300},{"144":1}],["Steel Truss Construction",4,{"69":750,"71":750},{"145":1}],["Aluminium Hull Plate Construction",4,{"123":600},{"146":1}],["Aluminium Truss Construction",4,{"122":1000},{"147":1}],["Cargo Module Construction",4,{"122":3000,"123":2000},{"148":1}],["Aluminium Pressure Vessel Construction",4,{"123":1850},{"149":1}],["Aluminium Propellant Tank Construction",4,{"123":3500},{"150":1}],["Shuttle Hull Construction",4,{"146":10,"147":4,"150":8,"235":3},{"165":1}],["Light Transport Hull Construction",4,{"145":6,"146":8,"150":16,"235":2},{"166":1}],["Cargo Ring Construction",4,{"122":8000,"133":1},{"167":1}],["Heavy Transport Hull Construction",4,{"145":32,"146":96,"150":96,"167":3,"235":4},{"168":1}],["Tungsten Gas Atomization",2,{"164":1},{"169":1}],["Hydrogen Cryocooling and Reactor Consumables Stoichiometry",1,{"2":97,"66":2,"169":1},{"170":100}],["Stainless Steel Sheet Rolling",2,{"151":1},{"171":1}],["Stainless Steel Pipe Rolling",2,{"151":1},{"172":1}],["Silicon Wafer CPU Photolithography, Ball Bonding, and Encapsulation",2,{"61":14000,"74":120000,"83":3,"84":2,"90":48000,"100":140000,"162":95000},{"174":101500}],["Core Drill Assembly",2,{"154":1,"155":1,"180":18},{"175":1}],["Neodymium Trichloride Vacuum Calciothermic Reduction",1,{"112":120,"159":501},{"78":333,"176":288}],["Neodymium Trichloride Molten Salt Electrolysis",1,{"45":58,"159":251},{"76":142,"176":144}],["Chromia Aluminothermic Reduction",1,{"111":54,"161":152},{"88":102,"178":104}],["Uranium Dioxide Oxidation",1,{"82":80,"163":270},{"24":36,"179":314}],["Leached Coffinite Froth Flotation, Solvent Extraction, and Precipitation",1,{"2":4,"54":252,"110":107,"114":424320},{"3":34,"24":72,"81":73,"104":195}],["Nd:YAG Czochralski Process",2,{"88":50981,"137":1009,"138":67066},{"181":119056}],["Nichrome Alloying",1,{"31":4,"178":1},{"182":5}],["Magnet Sintering and Magnetization",2,{"29":72,"134":1,"176":27},{"183":100}],["Uranium Tetrafluoride Oxidation",1,{"116":38,"179":314},{"184":352}],["Uranium Hexafluoride Centrifuge Cascade Enrichment",1,{"184":530694},{"185":2672}],["Nd:YAG Laser Assembly",2,{"99":1,"111":8,"120":1,"181":10},{"186":20}],["Thin-film Resistor Sputtering and Laser-trimming",2,{"74":2500,"97":12500,"182":1},{"187":15000}],["HEUF6 Magnesiothermic Reduction and Fine Division",1,{"75":73,"185":349},{"188":235}],["Spirulina and Chlorella Algae Growing",3,{"3":550,"6":5900,"24":1300,"28":150,"35":170,"36":70,"46":110},{"64":4000}],["PEDOT Bacteria Culturing",3,{"8":280,"23":320,"36":740},{"200":410}],["BPA Bacteria Culturing",3,{"8":430,"23":690},{"108":410}],["Potassium Hydroxide Carbonation",1,{"6":44,"90":112},{"24":18,"192":138}],["Novolak Bacteria Culturing",3,{"8":410,"23":670},{"140":410}],["Ferrochromium Alloying",1,{"29":1,"178":1},{"95":2}],["Potassium Carbonate Oxidation",1,{"82":40,"192":138},{"6":44,"24":18,"195":116}],["Rhabdite Slag Acid Leaching",1,{"82":520,"191":1416},{"24":180,"193":1048}],["Tantalate-Niobate Liquid-Liquid Extraction and Redox",1,{"193":544,"195":232},{"82":80,"196":392}],["Carbon Dioxide Ferrocatalysis",1,{"6":11},{"7":7,"23":4}],["Potassium Heptafluorotantalate Sodiothermic Reduction",1,{"45":292,"196":392},{"76":177,"195":116,"199":181}],["Rhabdite Carbothermic Reduction",1,{"19":2556,"190":24076},{"6":9372,"95":16153,"191":1107}],["Polymer Tantalum Capacitor Assembly",2,{"19":1,"55":2900,"60":19,"136":1000,"199":8000,"200":1000},{"201":10000}],["Surface Mount Device Reel Assembly",2,{"119":1,"153":2,"187":1,"201":1},{"202":1}],["Pick-and-place Board Population",2,{"67":8,"152":10,"202":2},{"203":20}],["Motor Stator Assembly",2,{"99":15,"111":5,"118":9,"203":1},{"204":10}],["Motor Rotor Assembly",2,{"111":5,"132":1,"183":9},{"205":5}],["Brushless Motor Assembly",2,{"204":1,"205":1},{"206":1}],["Landing Leg Assembly",4,{"67":4,"69":500,"70":296,"99":4,"206":2},{"207":1}],["Landing Auger Assembly",4,{"70":80,"71":40,"99":6,"206":3},{"208":1}],["Pump Assembly",2,{"111":9,"132":1,"206":5},{"209":5}],["Antenna Assembly",2,{"67":1,"99":29,"156":10,"203":1},{"210":10}],["Fiber Optic Gyroscope Assembly",2,{"68":17,"186":2,"203":1},{"211":10}],["Star Tracker Assembly",2,{"131":92,"173":1,"174":2,"203":5},{"212":50}],["Computer Assembly",2,{"111":36,"174":4,"203":10},{"213":50}],["Control Moment Gyroscope Assembly",2,{"111":1475,"132":4,"203":1,"206":20},{"214":10}],["Robotic Arm Assembly",2,{"67":1,"69":250,"74":19,"99":3,"206":5,"213":1},{"215":1}],["Feldspar Aluminium Hydroxide Calcination",1,{"189":156},{"24":54,"88":102}],["Ferrochromium Roasting and Hot Base Leaching",1,{"23":5280,"77":8267,"95":8076},{"6":3432,"63":5557,"113":12634}],["Beryllium Carbonate Calcination",1,{"217":69},{"6":44,"218":25}],["Beryllia Forming and Sintering",2,{"218":1},{"219":1}],["Silicon Wafer CCD Photolithography, Ball Bonding, and Packaging",2,{"61":2250,"74":37000,"83":1,"84":2,"90":31000,"100":90000,"162":61000},{"173":62500}],["Heat Exchanger Assembly",4,{"151":10,"172":30},{"221":1}],["Turbopump Assembly",4,{"97":400,"121":5,"132":2,"151":2000,"172":500},{"222":10}],["Laser Diode Doping, Amorphization, and Assembly",2,{"61":308,"83":7,"84":22,"100":3080,"111":61600},{"120":65000}],["Separator Centrifuge Assembly",4,{"99":2,"134":140,"151":32,"172":14,"182":2},{"224":1}],["Fuel Make-up Tank Assembly",4,{"121":3,"134":140,"171":20,"172":4,"188":33},{"225":2}],["Neon Make-up Tank Assembly",4,{"121":1,"171":10,"172":2,"220":487},{"226":2}],["Lightbulb End Moderators Assembly",4,{"19":54,"172":2,"219":74},{"227":1}],["Cold Gas Torque Thruster Printing",2,{"111":3},{"127":1}],["Fused Quartz Lightbulb Additive/Subtractive Assembly",4,{"41":50},{"229":1}],["Reactor Plumbing Assembly Squared",4,{"67":4,"99":46,"121":35,"209":7,"213":1,"221":8,"222":1,"224":1,"225":3,"226":3},{"230":1}],["Flow Divider Moderator Assembly",4,{"19":12000,"151":200,"219":6500},{"231":1}],["Nuclear Lightbulb Assembly",4,{"227":1,"229":1},{"232":1}],["Reactor Shell Assembly",4,{"42":1000,"69":1000,"128":2000,"136":1500,"171":450,"172":50},{"233":1}],["Closed-cycle Gas Core Nuclear Reactor Engine Assembly",4,{"144":7,"230":1,"231":1,"232":7,"233":1},{"234":1}],["Habitation Module Assembly",4,{"23":63,"41":50,"149":1,"180":237},{"235":1}],["Mobility Module Assembly",4,{"121":10,"126":12,"130":74,"172":30,"180":1480},{"236":1}],["Fluids Automation Module Assembly",4,{"67":2,"99":9,"121":20,"171":2490,"172":1000,"209":10,"213":1},{"237":1}],["Solids Automation Module Assembly",4,{"67":2,"69":2000,"70":910,"99":10,"132":20,"206":10,"215":2},{"238":1}],["Terrain Interface Module Assembly",4,{"207":1,"208":1},{"239":1}],["Avionics Module Assembly",4,{"67":10,"99":404,"210":1,"211":3,"212":1,"213":3},{"240":1}],["Escape Module Assembly",4,{"24":124,"129":1800,"157":2,"158":5,"235":1,"236":1,"240":1},{"241":1}],["Attitude Control Module Assembly",4,{"67":1,"99":3,"122":16,"213":1,"214":4},{"242":1}],["Power Module Assembly",4,{"67":4,"99":70,"157":250,"158":585,"203":1},{"243":5}],["Thermal Module Assembly",4,{"3":500,"121":10,"172":474,"209":2},{"244":1}],["Propulsion Module Assembly",4,{"69":1500,"99":5,"124":495,"234":1},{"245":1}],["Sulfur Dioxide Plasma Catalysis",1,{"2":4,"5":64},{"24":36,"51":32}],["Parkes Process",1,{"106":189,"194":10049},{"60":99,"61":1}],["Bicarbonate Solvay Process",1,{"6":44,"11":100,"24":18,"45":117},{"28":168,"78":111}],["Solvay-Hou Process",1,{"3":34,"6":44,"24":18,"45":117},{"77":106,"110":107}],["Bicarbonate Solvay-Hou Process",1,{"3":34,"6":88,"24":36,"45":117},{"28":168,"110":107}],["Sodium Bicarbonate Calcination",1,{"28":168},{"6":44,"24":18,"77":106}],["Epoxy Stoichiometry and Packaging",2,{"197":2},{"136":1}],["PEDOT Algae Growing",3,{"6":740,"24":150,"36":720},{"200":400}],["BPA Algae Growing",3,{"6":1150,"24":250},{"108":400}],["Novolak Algae Growing",3,{"6":1100,"24":250},{"140":400}],["Hydrochloric Redox",1,{"2":2,"76":71},{"81":73}],["Hydrofluoric Redox",1,{"2":2,"116":38},{"82":40}],["Methane Combustion",1,{"8":16,"23":64},{"6":44,"24":36}],["Carbon Monoxide Arc Decomposition",1,{"7":112},{"6":44,"23":32}],["Sulfur Combustion",1,{"23":32,"51":32},{"5":64}],["Triple Superphosphate Acid Extraction",1,{"24":36,"35":234,"55":98},{"83":64}]];
const P={};for(const k in PX)P[k]=PX[k][0];
function renderReport(doc,D){
const $=s=>doc.querySelector(s);
const PR=D.products;
const pn=p=>(PR[p]&&PR[p][0])||('Product '+p);
const pc=p=>(PR[p]&&PR[p][1])||'';
const isAt=p=>!!(PR[p]&&PR[p][3]);
const kg=(p,a)=>isAt(p)?a:a*((PR[p]&&PR[p][2])||0)/1000;
const fmt=(p,a)=>{if(!a)return '';if(isAt(p))return a.toLocaleString();const k=a*((PR[p]&&PR[p][2])||0)/1000;
 if(k<1000)return (+k.toFixed(k<10?1:0)).toLocaleString()+' kg';const t=k/1000;if(t<1000)return (+t.toFixed(t<10?2:t<100?1:0)).toLocaleString()+' t';return (+(t/1000).toFixed(t<1e4?2:1)).toLocaleString()+' kt'};
doc.title='Your Influence Command';
doc.head.innerHTML='<meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Influence Command</title><style>'+
':root{--bg:#0b0e13;--panel:#131821;--line:#232b38;--text:#e6ebf2;--muted:#8a96a8;--accent:#5fc3e4;--accent2:#e4a85f}'+
'*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}'+
'header{position:sticky;top:0;z-index:5;background:rgba(11,14,19,.96);border-bottom:1px solid var(--line);padding:14px 20px}'+
'h1{margin:0;font-size:20px;letter-spacing:.3px}h1 span{color:var(--accent)}.sub{color:var(--muted);font-size:13px;margin-top:2px}'+
'.bar{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;align-items:center}'+
'input,select,button{font:inherit;color:var(--text);background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:7px 10px}'+
'input{min-width:220px;flex:1;max-width:340px}button{cursor:pointer}button:hover{border-color:var(--accent)}'+
'.seg{display:inline-flex;border:1px solid var(--line);border-radius:6px;overflow:hidden}.seg button{border:0;border-radius:0}.seg button.on{background:var(--accent);color:#04121a;font-weight:600}'+
'main{padding:16px 20px 40px}.wrap{overflow:auto;border:1px solid var(--line);border-radius:8px;background:var(--panel)}'+
'table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}th,td{padding:7px 12px;border-bottom:1px solid var(--line);white-space:nowrap}'+
'th{position:sticky;top:0;background:#1a212d;text-align:left;font-weight:600;color:var(--muted);cursor:pointer;user-select:none}th:hover{color:var(--text)}'+
'th.num,td.num{text-align:right}td.tot,th.tot{color:var(--accent2);font-weight:600}tbody tr:hover{background:#18202b}'+
'tr.prow{cursor:pointer}tr.prow td:first-child:before{content:"▸ ";color:var(--muted)}tr.prow.open td:first-child:before{content:"▾ "}tr.det td{background:#0f141c;white-space:normal;padding:6px 12px 10px 34px}.det .b{display:flex;justify-content:space-between;gap:20px;max-width:560px;padding:2px 0}.det .a{color:var(--muted);font-size:12px}'+
'td.cls{color:var(--muted);font-size:12px}.empty{color:#3a4454}'+
'.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;align-items:start}'+
'.card{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:12px}.card h3{margin:0 0 2px;font-size:15px}.card .t{color:var(--muted);font-size:12px;margin-bottom:8px}'+
'.card table td{padding:3px 0;border:0}.card table td.num{padding-left:12px}'+
'h4{margin:12px 0 4px;font-size:13px;color:var(--accent2)}h4.bad{color:#ff7a7a}.steps{margin:0;padding-left:22px;max-width:900px}.steps li{padding:4px 0}.steps li div{font-size:13px}.mk-q input{min-width:0;width:120px}h2{font-size:16px;color:var(--accent);margin:22px 0 10px}h2:first-child{margin-top:0}.note{color:var(--muted);padding:20px}'+
'.as-3d{margin-top:6px;display:flex;gap:4px;flex-wrap:wrap}.as-b{display:inline-block;font-size:12px;padding:3px 8px;border:1px solid var(--line);border-radius:6px;background:#0f141c;color:var(--accent);cursor:pointer}.as-b:hover{border-color:var(--accent)}.m3d{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;padding:20px}.m3d-box{width:min(1000px,96vw);height:min(760px,88vh);background:#05070a;border:1px solid var(--line);border-radius:10px;display:flex;flex-direction:column;overflow:hidden}.m3d-top{display:flex;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid var(--line)}.m3d-top .a{color:var(--muted);font-size:12px;flex:1}.m3d-x{padding:3px 10px}.m3d-view{flex:1;position:relative;min-height:0}.m3d-view canvas{display:block;width:100%!important;height:100%!important;touch-action:none}.ddm{position:fixed;display:none;flex-direction:column;z-index:50;background:var(--panel);border:1px solid var(--line);border-radius:6px;overflow:hidden;min-width:140px;box-shadow:0 6px 18px rgba(0,0,0,.5)}.ddm button{border:0;border-radius:0;text-align:left;width:100%}.ddm button.on{background:var(--accent);color:#04121a;font-weight:600}#csv{margin-left:auto}'+
'</style>';
const asts=D.asteroids;
doc.body.innerHTML='<header><meta charset="utf-8"><h1>Your <span>Influence</span> Command</h1><div class="sub" id="sub"></div>'+
'<div class="bar"><input id="q" placeholder="Search product or building…"><select id="ast"></select><select id="cls"></select>'+
'<span class="seg"><button id="vN" class="on">Today\'s Workload</button><button id="vP">Products</button><button id="vBB">Buildings ▾</button><span class="ddm" id="ddm"><button id="vB">Contents</button><button id="vT">Status</button></span><button id="vA">Asteroids</button><button id="vX">Core Samples</button><button id="vL">Leases</button><button id="vK">Market</button><button id="vY">Trade finder</button><button id="vC">Crews</button><button id="vS">Ships</button><button id="vR">Travel</button></span><button id="csv" title="Download the stock list as a spreadsheet (CSV)">Download your full stock list</button></div></header><main id="main"></main>';
$('#sub').textContent='Updated '+D.when+' · '+asts.reduce((n,a)=>n+a.buildings.length,0)+' storage buildings · '+asts.length+' asteroids · '+D.crews+' crews';
$('#ast').innerHTML='<option value="">All asteroids</option>'+asts.map((a,i)=>'<option value="'+i+'">'+esc(a.name)+'</option>').join('');
const classes=[...new Set(Object.keys(PR).map(pc).filter(Boolean))].sort();
$('#cls').innerHTML='<option value="">All types</option>'+classes.map(c=>'<option>'+esc(c)+'</option>').join('');
const BX={"1":["Warehouse",{"44":400000,"69":350000,"70":200000}],"2":["Extractor",{"44":250000,"69":300000,"125":3000,"237":1,"243":6}],"3":["Refinery",{"44":600000,"69":300000,"70":200000,"104":2,"237":12,"238":2,"240":2,"243":16,"244":4}],"4":["Bioreactor",{"24":1400000,"41":300000,"44":500000,"56":300000,"69":100000,"70":300000,"74":25000,"180":125000,"237":16,"238":12,"240":3,"243":8}],"5":["Factory",{"44":900000,"69":1100000,"70":700000,"237":4,"238":40,"240":8,"243":20,"244":6}],"6":["Shipyard",{"44":1500000,"69":2000000,"70":1000000,"237":8,"238":60,"240":10,"243":24,"244":6}],"7":["Spaceport",{"44":3000000,"69":1600000,"70":2500000,"101":200000,"237":50,"238":180,"240":40,"243":150,"244":60}],"8":["Marketplace",{"44":3000000,"69":2500000,"70":3000000,"101":500000,"133":6,"235":80,"240":160,"243":60,"244":40}],"9":["Habitat",{"24":300000,"44":5000000,"56":200000,"69":4000000,"70":5000000,"101":1000000,"133":12,"235":240,"240":200,"243":240,"244":320}],"10":["Tank Farm",{"44":200000,"69":50000,"70":50000,"171":200000,"237":2}]};for(const k in BX)PR['B'+k]=[BX[k][0]+' (building)','Building',0,true];
let view='N',sortKey='name',sortDir=1;const open=new Set();
// totals: tot[astIndex][product]
const tot=asts.map(a=>{const t={};a.buildings.forEach(b=>{for(const p in b.items)t[p]=(t[p]||0)+b.items[p]});return t});
const allP=[...new Set(tot.flatMap(t=>Object.keys(t)))];
const pooled={};tot.forEach(t=>{for(const p in t)pooled[p]=(pooled[p]||0)+t[p]});
window.YIC={asts,tot,pooled,get D(){return D},get crewMult(){return crewMult},get CBJ(){return CBJ},get CBNF(){return CBNF},get habEff(){return habEff},get CMC(){return CMC},get CMT(){return CMT},get pfmt(){return fmt},get pn(){return pn}};
function rows(){
 const q=$('#q').value.trim().toLowerCase(),ai=$('#ast').value,cl=$('#cls').value;
 const cols=ai===''?asts.map((a,i)=>i):[+ai];
 let r=allP.filter(p=>(!cl||pc(p)===cl)&&(!q||pn(p).toLowerCase().includes(q))).map(p=>{const v=cols.map(i=>tot[i][p]||0);return{p,v,total:v.reduce((x,y)=>x+y,0)}}).filter(x=>x.total>0);
 r.sort((x,y)=>{let a,b;if(sortKey==='name'){a=pn(x.p);b=pn(y.p);return a.localeCompare(b)*sortDir}if(sortKey==='cls'){return (pc(x.p).localeCompare(pc(y.p))||pn(x.p).localeCompare(pn(y.p)))*sortDir}
  a=sortKey==='total'?kg(x.p,x.total):kg(x.p,x.v[sortKey]);b=sortKey==='total'?kg(y.p,y.total):kg(y.p,y.v[sortKey]);return (a-b)*sortDir});
 return{r,cols};
}
const RX=D.recipes||[];
const mk={};


const fq=(p,a)=>fmt(p,isAt(p)?Math.ceil(a-1e-6):a)||'0';
















const tonnes=(p,a)=>a*((PR[p]&&PR[p][2])||0)/1e6;
const fmtT=t=>t<1?(+(t*1000).toFixed(t<0.01?1:0)).toLocaleString()+' kg':t<1000?(+t.toFixed(t<10?2:t<100?1:0)).toLocaleString()+' t':(+(t/1000).toFixed(t<1e4?2:1)).toLocaleString()+' kt';
const PROCN={"23":["Water Electrolysis",{"2":1,"23":8}],"24":["Water Vacuum-evaporation Desalination",{"24":19,"25":1}],"25":["Sabatier Process",{"8":16,"24":36}],"26":["Olivine Enhanced Weathering",{"26":1322,"58":5140}],"27":["Bitumen Hydro-cracking",{"27":60}],"28":["Taenite Electrolytic Refining",{"29":15,"30":1,"31":3}],"29":["Calcite Calcination",{"6":44,"32":56}],"30":["Huels Process",{"33":13}],"31":["Ammonia Carbonation",{"34":96}],"32":["Salt Sulfidization and Phosphorization",{"36":17}],"33":["Basic Food Cooking and Packaging",{"129":480}],"34":["Troilite Centrifugal Froth Flotation",{"37":160,"38":16,"39":4,"40":10}],"35":["Silica Fusing",{"41":1}],"36":["Silica Pultrusion",{"42":1}],"37":["Copper Wire Drawing",{"43":1}],"38":["Salty Cement Mixing",{"44":7}],"39":["Salt Selective Crystallization",{"45":46,"46":29,"47":2,"48":13,"49":6,"78":5}],"40":["Naphtha Steam-cracking",{"50":3}],"41":["Steel Alloying",{"52":1000}],"42":["Silica Carbothermic Reduction",{"7":56,"53":28}],"43":["Ostwald Process",{"54":87}],"44":["Wet Sulfuric Acid Process",{"55":98}],"45":["Fungal Soilbuilding",{"56":500000}],"46":["Iron Oxide and Silica Carbothermic Reduction",{"6":451,"57":224}],"47":["Methane Steam Reforming and Water-gas Shift",{"2":6,"7":28}],"48":["Acetylene Oxalic Acid Production",{"59":135}],"49":["Lead Sulfide Smelting",{"5":3072,"6":2112,"194":10049}],"50":["Tin Sulfide Smelting",{"5":128,"6":88,"62":238}],"51":["Iron Sulfide Roasting",{"5":192,"63":232}],"52":["Haber-Bosch Process",{"3":34}],"53":["Molybdenum Disulfide Roasting",{"5":256,"65":288}],"54":["Silica Gas Atomization",{"66":1}],"55":["Solder Manufacturing",{"67":150}],"56":["Quartz Filament Drawing and Wrapping",{"68":5}],"57":["Steel Beam Rolling",{"69":1}],"58":["Steel Sheet Rolling",{"70":1}],"59":["Steel Pipe Rolling",{"71":1}],"60":["Steel Wire Drawing",{"72":1}],"61":["Propylene Ammoxidation",{"24":1080,"73":796}],"62":["Propylene Polymerization",{"74":1}],"63":["Magnesium Chloride Molten Salt Electrolysis",{"75":24,"76":71}],"64":["Solvay Process",{"77":106,"78":111}],"65":["Boria Hydration",{"84":124}],"66":["Pyroxene Acid Leaching, Digestion, and Ion Exchange",{"80":294,"117":110}],"67":["Apatite Acid Extraction",{"81":73,"82":40,"83":1176}],"68":["Hydrogen Combustion",{"24":18}],"69":["Carbon Monoxide Combustion",{"6":88}],"70":["Borax Acid Extraction",{"45":117,"84":247}],"71":["Nitrogen Cryocooling and Fractional Distillation",{"180":950,"220":5}],"72":["Olivine Acid Leaching and Calcining",{"5":8456,"6":5809,"23":1984,"24":2378,"63":1852,"85":488,"86":448,"87":3869}],"73":["Anorthite Feldspar Acid Leaching and Carbonation",{"24":144,"189":624,"217":69}],"74":["Sodium Chloralkali Process",{"2":2,"76":71,"89":80}],"75":["Potassium Chloralkali Process",{"2":2,"76":71,"90":112}],"76":["Apatite Acid Re-extraction",{"35":468,"81":73,"82":40}],"77":["Ammonium Carbonate Oxalation",{"6":44,"24":18,"93":124}],"78":["Xenotime Hot Acid Leaching",{"83":784,"94":2006}],"79":["Merrillite Hot Acid Leaching",{"2":8,"45":468,"78":7991,"83":5488,"94":2078}],"80":["Ammonia Catalytic Cracking",{"2":6,"180":34}],"81":["Uraninite Acid Leaching, Solvent Extraction, and Precipitation",{"96":887}],"82":["Coffinite Acid Leaching, Solvent Extraction, and Precipitation",{"24":108,"26":180,"96":1774,"114":556}],"83":["Alumina Forming and Sintering",{"97":1}],"84":["Austenitic Nichrome Alloying",{"98":20}],"85":["Copper Wire Insulating",{"99":20}],"86":["Silicon Czochralski Process and Wafer Slicing",{"100":432000}],"87":["Steel Cable Laying",{"101":1}],"88":["Acrylonitrile Polymerization",{"102":50}],"89":["Soybean Growing",{"91":26000}],"90":["Boric Acid Thermal Decomposition",{"24":54,"79":70}],"91":["Lithium Carbonate Chlorination",{"6":44,"24":18,"105":85}],"92":["Lithium Sulfate Carbonation",{"48":74}],"93":["Iron Oxide Direct Reduction",{"6":176,"29":168}],"94":["Zinc Oxide Direct Reduction",{"6":44,"106":65}],"95":["Nickel Oxide Direct Reduction",{"6":44,"31":59}],"96":["Pidgeon Process",{"26":15,"29":21,"75":12}],"97":["Polypropylene Chlorination and Basification",{"24":18,"45":117,"81":36,"107":93}],"98":["Potato Growing",{"92":75600}],"99":["Rare Earth Sulfates Oxalation and Calcination",{"3":408,"6":528,"7":336,"24":432,"109":1118}],"100":["Ammonia Chlorination",{"110":53}],"101":["Hall–Heroult Process",{"7":84,"111":54}],"102":["Calcium Chloride Molten Salt Electrolysis",{"76":71,"112":40}],"103":["Cement Mixing",{"44":8}],"104":["Natural Flavorings Growing",{"103":15500}],"105":["Yellowcake Digestion, Solvent Extraction, and Precipitation",{"24":72,"115":1182}],"106":["Hydrofluoric Acid Cold Electrolysis",{"2":1,"116":38}],"107":["Rhabdite Roasting and Acid Extraction",{"83":14890,"190":24068}],"108":["Ferrite Sintering",{"118":1426}],"109":["Diode Doping and Assembly",{"119":420}],"110":["Ball Valve Machining",{"121":1}],"111":["Aluminium Beam Rolling",{"122":1}],"112":["Aluminium Sheet Rolling",{"123":1}],"113":["Aluminium Pipe Rolling",{"124":1}],"114":["Polyacrylonitrile Weaving",{"125":1}],"115":["Cold Gas Thruster Printing",{"126":1}],"116":["Polyacrylonitrile Oxidation and Carbonization",{"24":108,"128":144}],"117":["Aluminium Small Propellant Tank Assembly",{"130":1}],"118":["Borosilicate Glassmaking",{"131":20}],"119":["Ball Bearing Machining and Assembly",{"132":55}],"120":["Large Thrust Bearing Machining and Assembly",{"133":1}],"121":["Boria Magnesiothermic Reduction",{"87":121,"134":22}],"122":["Lithium Chloride Molten Salt Electrolysis",{"76":71,"135":7}],"123":["Diepoxy Step Growth Polymerization",{"24":54,"45":175,"197":625}],"124":["Rare Earth Oxides Ion Exchange",{"137":336,"138":452}],"125":["Calcium Oxide Aluminothermic Reduction",{"88":102,"112":120}],"126":["Sodium Chromate Acidification and Crystallization",{"24":18,"45":117,"139":262}],"127":["Sulfuric Acid Hot Catalytic Reduction",{"5":64,"23":16,"24":18}],"128":["Molybdenum Trioxide Aluminothermic Reduction and Alloying",{"88":5098,"141":7199}],"129":["Uranyl Nitrate Redox and Precipitation",{"142":4369}],"130":["Sodium Tungstate Ion Exchange, Precipitation, and Crystallization",{"89":960,"143":3132}],"131":["Stainless Steel Alloying",{"151":200}],"132":["Board Printing",{"152":200}],"133":["Ferrite-bead Inductor Winding",{"153":10}],"134":["Core Drill Bit Milling",{"154":1}],"135":["Core Drill Thruster Assembly",{"155":5}],"136":["Parabolic Dish Assembly",{"156":1}],"137":["Photovoltaic Panel Amorphization and Assembly",{"157":5}],"138":["LiPo Battery Assembly",{"158":10}],"139":["Neodymium Oxide Chlorination",{"3":102,"24":54,"159":501}],"141":["Sodium Dichromate Hot Sulfur Reduction",{"161":152}],"142":["Photoresist Epoxy Stoichiometry and Packaging",{"162":1}],"143":["Ammonium Diuranate Calcination and Hydrogen Reduction",{"3":34,"24":54,"163":540}],"144":["Ammonium Paratungstate Calcination and Hydrogen Reduction",{"3":170,"24":828,"164":2206}],"145":["Engine Bell Additive Manufacturing",{"144":1}],"146":["Steel Truss Construction",{"145":1}],"147":["Aluminium Hull Plate Construction",{"146":1}],"148":["Aluminium Truss Construction",{"147":1}],"149":["Cargo Module Construction",{"148":1}],"150":["Aluminium Pressure Vessel Construction",{"149":1}],"151":["Aluminium Propellant Tank Construction",{"150":1}],"152":["Shuttle Hull Construction",{"165":1}],"153":["Light Transport Hull Construction",{"166":1}],"154":["Cargo Ring Construction",{"167":1}],"155":["Heavy Transport Hull Construction",{"168":1}],"156":["Tungsten Gas Atomization",{"169":1}],"157":["Hydrogen Cryocooling and Reactor Consumables Stoichiometry",{"170":100}],"158":["Stainless Steel Sheet Rolling",{"171":1}],"159":["Stainless Steel Pipe Rolling",{"172":1}],"160":["Silicon Wafer CPU Photolithography, Ball Bonding, and Encapsulation",{"174":101500}],"161":["Core Drill Assembly",{"175":1}],"162":["Neodymium Trichloride Vacuum Calciothermic Reduction",{"78":333,"176":288}],"163":["Neodymium Trichloride Molten Salt Electrolysis",{"76":142,"176":144}],"165":["Chromia Aluminothermic Reduction",{"88":102,"178":104}],"166":["Uranium Dioxide Oxidation",{"24":36,"179":314}],"167":["Leached Coffinite Froth Flotation, Solvent Extraction, and Precipitation",{"3":34,"24":72,"81":73,"104":195}],"168":["Nd:YAG Czochralski Process",{"181":119056}],"169":["Nichrome Alloying",{"182":5}],"170":["Magnet Sintering and Magnetization",{"183":100}],"171":["Uranium Tetrafluoride Oxidation",{"184":352}],"172":["Uranium Hexafluoride Centrifuge Cascade Enrichment",{"185":2672}],"173":["Nd:YAG Laser Assembly",{"186":20}],"174":["Thin-film Resistor Sputtering and Laser-trimming",{"187":15000}],"175":["HEUF6 Magnesiothermic Reduction and Fine Division",{"188":235}],"176":["Spirulina and Chlorella Algae Growing",{"64":4000}],"177":["PEDOT Bacteria Culturing",{"200":410}],"178":["BPA Bacteria Culturing",{"108":410}],"179":["Potassium Hydroxide Carbonation",{"24":18,"192":138}],"180":["Novolak Bacteria Culturing",{"140":410}],"181":["Ferrochromium Alloying",{"95":2}],"182":["Potassium Carbonate Oxidation",{"6":44,"24":18,"195":116}],"183":["Rhabdite Slag Acid Leaching",{"24":180,"193":1048}],"184":["Tantalate-Niobate Liquid-Liquid Extraction and Redox",{"82":80,"196":392}],"185":["Carbon Dioxide Ferrocatalysis",{"7":7,"23":4}],"186":["Potassium Heptafluorotantalate Sodiothermic Reduction",{"76":177,"195":116,"199":181}],"187":["Rhabdite Carbothermic Reduction",{"6":9372,"95":16153,"191":1107}],"188":["Polymer Tantalum Capacitor Assembly",{"201":10000}],"189":["Surface Mount Device Reel Assembly",{"202":1}],"190":["Pick-and-place Board Population",{"203":20}],"191":["Motor Stator Assembly",{"204":10}],"192":["Motor Rotor Assembly",{"205":5}],"193":["Brushless Motor Assembly",{"206":1}],"194":["Landing Leg Assembly",{"207":1}],"195":["Landing Auger Assembly",{"208":1}],"196":["Pump Assembly",{"209":5}],"197":["Antenna Assembly",{"210":10}],"198":["Fiber Optic Gyroscope Assembly",{"211":10}],"199":["Star Tracker Assembly",{"212":50}],"200":["Computer Assembly",{"213":50}],"201":["Control Moment Gyroscope Assembly",{"214":10}],"202":["Robotic Arm Assembly",{"215":1}],"203":["Feldspar Aluminium Hydroxide Calcination",{"24":54,"88":102}],"204":["Ferrochromium Roasting and Hot Base Leaching",{"6":3432,"63":5557,"113":12634}],"205":["Beryllium Carbonate Calcination",{"6":44,"218":25}],"206":["Beryllia Forming and Sintering",{"219":1}],"207":["Silicon Wafer CCD Photolithography, Ball Bonding, and Packaging",{"173":62500}],"208":["Heat Exchanger Assembly",{"221":1}],"209":["Turbopump Assembly",{"222":10}],"210":["Laser Diode Doping, Amorphization, and Assembly",{"120":65000}],"211":["Separator Centrifuge Assembly",{"224":1}],"212":["Fuel Make-up Tank Assembly",{"225":2}],"213":["Neon Make-up Tank Assembly",{"226":2}],"214":["Lightbulb End Moderators Assembly",{"227":1}],"215":["Cold Gas Torque Thruster Printing",{"127":1}],"216":["Fused Quartz Lightbulb Additive/Subtractive Assembly",{"229":1}],"217":["Reactor Plumbing Assembly Squared",{"230":1}],"218":["Flow Divider Moderator Assembly",{"231":1}],"219":["Nuclear Lightbulb Assembly",{"232":1}],"220":["Reactor Shell Assembly",{"233":1}],"221":["Closed-cycle Gas Core Nuclear Reactor Engine Assembly",{"234":1}],"222":["Habitation Module Assembly",{"235":1}],"223":["Mobility Module Assembly",{"236":1}],"224":["Fluids Automation Module Assembly",{"237":1}],"225":["Solids Automation Module Assembly",{"238":1}],"226":["Terrain Interface Module Assembly",{"239":1}],"227":["Avionics Module Assembly",{"240":1}],"228":["Escape Module Assembly",{"241":1}],"229":["Attitude Control Module Assembly",{"242":1}],"230":["Power Module Assembly",{"243":5}],"231":["Thermal Module Assembly",{"244":1}],"232":["Propulsion Module Assembly",{"245":1}],"233":["Sulfur Dioxide Plasma Catalysis",{"24":36,"51":32}],"234":["Parkes Process",{"60":99,"61":1}],"235":["Bicarbonate Solvay Process",{"28":168,"78":111}],"236":["Solvay-Hou Process",{"77":106,"110":107}],"237":["Bicarbonate Solvay-Hou Process",{"28":168,"110":107}],"238":["Sodium Bicarbonate Calcination",{"6":44,"24":18,"77":106}],"239":["Epoxy Stoichiometry and Packaging",{"136":1}],"240":["PEDOT Algae Growing",{"200":400}],"241":["BPA Algae Growing",{"108":400}],"242":["Novolak Algae Growing",{"140":400}],"243":["Hydrochloric Redox",{"81":73}],"244":["Hydrofluoric Redox",{"82":40}],"245":["Methane Combustion",{"6":44,"24":36}],"246":["Carbon Monoxide Arc Decomposition",{"6":44,"23":32}],"247":["Hydrogen Propellant Unbundling",{"2":97,"66":2,"169":1}],"248":["Sulfur Combustion",{"5":64}],"249":["Triple Superphosphate Acid Extraction",{"83":64}],"250":["Shuttle Integration",{}],"251":["Light Transport Integration",{}],"252":["Heavy Transport Integration",{}],"300":["Warehouse Construction",{}],"301":["Extractor Construction",{}],"302":["Refinery Construction",{}],"303":["Bioreactor Construction",{}],"304":["Factory Construction",{}],"305":["Shipyard Construction",{}],"306":["Spaceport Construction",{}],"307":["Marketplace Construction",{}],"308":["Habitat Construction",{}],"309":["Tank Farm Construction",{}]};
const SCAP={10:[1.5e12,7.5e10],19:[7.5e10,9.975e11]};
function drawStatus(m){
 const ai=$('#ast').value,an=ai===''?null:asts[+ai].name,q=$('#q').value.trim().toLowerCase();
 const now=Date.now()/1000;
 const when=t=>new Date(t*1000).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
 const left=t=>tLeft(t,now);
 const astOf=b=>{const l=((b.Location&&b.Location.locations)||[]).find(x=>x.label===3);return (b.meta&&b.meta.asteroid&&b.meta.asteroid.name)||(l?'Asteroid #'+l.id:'?')};
 const okQ=(...t)=>!q||t.some(v=>String(v||'').toLowerCase().includes(q));
 const SL={run:['#0ca30c','Working'],done:['#fab219','Finished – collect'],idle:['#d03b3b','Idle']},RANK={idle:0,done:1,run:2};
 const dot=s=>'<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:'+SL[s][0]+';margin-right:7px;vertical-align:middle"></span>'+SL[s][1];
 const prodT=[2,3,4,5,6],storeT=[];
 const groups={},sites={};
 (D.allB||[]).forEach(b=>{const st=b.Building&&b.Building.status,a=astOf(b);if(an&&a!==an)return;
  if(st===1||st===2){sites[a]=(sites[a]||0)+1;return}if(st!==3)return;
  const bt=b.Building.buildingType,name=(b.Name&&b.Name.name)||((BT[bt]||'Building')+' #'+b.id),crew=(D.crewN||{})[b.Control&&b.Control.controller&&b.Control.controller.id]||'';
  const g=groups[a]=groups[a]||{prod:[],store:[],other:{}};
  if(prodT.includes(bt)){
   const jobs=[];
   (b.Extractors||[]).forEach(e=>jobs.push(e.status===1?{s:e.finishTime<=now?'done':'run',what:'Extracting '+pn(e.outputProduct),out:fmt(e.outputProduct,e.yield),fin:e.finishTime}:{s:'idle',what:''}));
   (b.Processors||[]).forEach(p=>{if(p.status!==1){jobs.push({s:'idle',what:bt===6?'Ship parts: idle':''});return}
    const pr=PROCN[p.runningProcess],o=p.outputProduct,amt=pr&&pr[1][o]?Math.round(p.recipes*pr[1][o]):0;
    jobs.push({s:p.finishTime<=now?'done':'run',what:pr?pr[0]:'Process '+p.runningProcess,out:o?(amt?fmt(o,amt)+' ':'')+pn(o):'',fin:p.finishTime})});
   (b.DryDocks||[]).forEach(d=>jobs.push(d.status===1?{s:d.finishTime<=now?'done':'run',what:'Dry dock: assembling ship',out:'',fin:d.finishTime}:{s:'idle',what:'Dry dock: idle'}));
   const s=jobs.some(j=>j.s==='run')?'run':jobs.some(j=>j.s==='done')?'done':'idle';
   const fin=Math.min(...jobs.filter(j=>j.fin).map(j=>j.fin),Infinity);
   if(okQ(name,BT[bt],crew,...jobs.map(j=>j.what+' '+j.out),SL[s][1]))g.prod.push({name,type:BT[bt],crew,s,jobs,fin});
  }else if(storeT.includes(bt)){
   const inv=(b.Inventories||[]).find(i=>SCAP[i.inventoryType]);
   const c=inv?SCAP[inv.inventoryType]:null,ms=inv?(inv.mass||0):0,vs=inv?(inv.volume||0):0;
   const f=c?Math.max(ms/c[0],vs/c[1]):0;
   if(okQ(name,BT[bt],crew))g.store.push({name,type:BT[bt],crew,f,ms,vs,c});
  }else g.other[BT[bt]]=(g.other[BT[bt]]||0)+1;
 });
 const aKeys=Object.keys(groups).sort();
 if(!aKeys.length){m.innerHTML='<div class="note">Nothing matches.</div>';return}
 const bar=(f,col)=>'<span style="display:inline-block;width:140px;height:8px;background:#232b38;vertical-align:middle;margin-right:8px;border-radius:2px;overflow:hidden"><span style="display:block;height:100%;width:'+Math.min(100,Math.round(f*100))+'%;background:'+col+'"></span></span>';
 let h='';
 aKeys.forEach(a=>{const g=groups[a];
  g.prod.sort((x,y)=>RANK[x.s]-RANK[y.s]||x.type.localeCompare(y.type)||x.fin-y.fin||x.name.localeCompare(y.name));
  g.store.sort((x,y)=>y.f-x.f);
  const n=k=>g.prod.filter(x=>x.s===k).length;
  h+='<h2>'+esc(a)+'</h2><div class="note" style="padding:0 0 10px">'+g.prod.length+' production buildings · <b style="color:#4cd04c">'+n('run')+' working</b> · <b style="color:#ff7a7a">'+n('idle')+' idle</b>'+(n('done')?' · <b style="color:#fab219">'+n('done')+' finished, waiting to collect</b>':'')+'</div>';
  if(g.prod.length)h+='<div class="wrap"><table><thead><tr><th>Status</th><th>Building</th><th>Type</th><th>Crew</th><th>Doing</th><th>Output</th><th>Finishes</th><th>Time left</th></tr></thead><tbody>'+
   g.prod.map(x=>{const js=x.jobs.filter(j=>j.s!=='idle'||j.what);
    return '<tr><td>'+dot(x.s)+'</td><td>'+bthumb(x.type,56,42)+esc(x.name)+'</td><td class="cls">'+esc(x.type)+'</td><td class="cls">'+esc(x.crew)+'</td>'+
    '<td style="white-space:normal">'+(js.map(j=>esc(j.what)).join('<br>')||'–')+'</td><td class="cls" style="white-space:normal">'+(js.map(j=>esc(j.out||'')).join('<br>')||'')+'</td>'+
    '<td class="cls">'+js.map(j=>j.fin?(j.s==='done'?'Done '+esc(when(j.fin)):esc(when(j.fin))):'').join('<br>')+'</td>'+
    '<td>'+js.map(j=>j.fin?(j.s==='done'?'<span style="color:#fab219">Ready to collect</span>':'<b data-fin="'+j.fin+'">'+left(j.fin)+'</b>'):'').join('<br>')+'</td></tr>'}).join('')+'</tbody></table></div>';
  if(g.store.length)h+='<div class="note" style="padding:16px 0 10px">'+g.store.length+' warehouses and tank farms</div><div class="wrap"><table><thead><tr><th>Building</th><th>Type</th><th>Crew</th><th>Filled</th><th>Used</th></tr></thead><tbody>'+
   g.store.map(x=>{const col=x.f>=0.9?'#d03b3b':x.f>=0.75?'#fab219':'#5fc3e4';
    return '<tr><td>'+bthumb(x.type,56,42)+esc(x.name)+'</td><td class="cls">'+esc(x.type)+'</td><td class="cls">'+esc(x.crew)+'</td><td>'+bar(x.f,col)+Math.round(x.f*100)+'%</td><td class="cls">'+(x.c?fmtT(x.ms/1e6)+' of '+fmtT(x.c[0]/1e6)+' · '+Math.round(x.vs/1e6).toLocaleString()+' of '+Math.round(x.c[1]/1e6).toLocaleString()+' m³':'–')+'</td></tr>'}).join('')+'</tbody></table></div>';
  const o=Object.entries(g.other).map(([k,v])=>v+' '+k+(v>1?'s':'')).join(', ');
  if(o||sites[a])h+='<div class="note" style="padding:8px 0 0">'+(o?'Also here: '+esc(o)+'. ':'')+(sites[a]?sites[a]+' unfinished construction site'+(sites[a]>1?'s':'')+' not shown.':'')+'</div>';
 });
 h+='<div class="note" style="padding:14px 0 0">Shipyard output amounts and secondary refinery outputs aren\'t shown. Warehouses and tank farms that are nearly full show on Today\'s Workload.</div>';
 m.innerHTML=h}
const SPEC={1:['C',[1,6,7,8,9,10,11]],2:['Cm',[1,6,7,8,9,10,11,18,19,20,21,22]],3:['Ci',[1,2,3,4,5,6,7,8,9,10,11]],4:['Cs',[1,6,7,8,9,10,11,12,13,14,15,16,17]],5:['Cms',[1,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22]],6:['Cis',[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]],7:['S',[12,13,14,15,16,17]],8:['Sm',[12,13,14,15,16,17,18,19,20,21,22]],9:['Si',[1,2,3,4,5,6,7,8,12,13,14,15,16,17]],10:['M',[18,19,20,21,22]],11:['I',[1,2,3,4,5,6,7,8]]};
const BONG=[['Yield',[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22],[[1,1,3],[2,2,6],[3,3,15]]],['Volatile',[1,2,3,4,5,6,7,8],[[4,1,10],[5,2,20],[6,3,50]]],['Metal',[12,13,14,18,19,20,21],[[7,1,10],[8,2,20],[9,3,50]]],['Organic',[9,10,11],[[10,1,10],[11,2,20],[12,3,50]]],['Rare Earth',[16,17],[[13,3,30]]],['Fissile',[15,22],[[14,3,30]]]];
const RAR=['Common','Uncommon','Rare','Superior','Exceptional','Incomparable'];
function astAbund(packed){const out={};try{let v=BigInt(packed);for(let i=1;i<=22;i++){out[i]=Number(v%1024n)/1000;v=i===11?v>>28n:v>>10n}}catch(e){}return out}
function astBonuses(packed,st){const res=(SPEC[st]||['',[]])[1],out=[];BONG.forEach(([n,rs,bs])=>{if(!rs.some(r=>res.includes(r)))return;bs.forEach(([pos,lv,mod])=>{if((packed&(1<<pos))>0)out.push({n,lv,mod})})});return out}
const M3D={db:null,open(){return this.db||(this.db=new Promise((res,rej)=>{let q;try{q=indexedDB.open('influenceStock3d',1)}catch(e){rej(e);return}q.onupgradeneeded=()=>q.result.createObjectStore('models');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)}))},
 async run(mode,fn){const db=await this.open();return new Promise((res,rej)=>{const tx=db.transaction('models',mode),rq=fn(tx.objectStore('models'));tx.oncomplete=()=>res(rq&&rq.result);tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error)})},
 keys(){return this.run('readonly',s=>s.getAllKeys())},get(id){return this.run('readonly',s=>s.get(id))},put(id,v){return this.run('readwrite',s=>s.put(v,id))},del(id){return this.run('readwrite',s=>s.delete(id))}};
async function open3d(id,name){let rec=null;try{rec=await M3D.get(id)}catch(e){}if(!rec)return;
 const ov=document.createElement('div');ov.className='m3d';
 ov.innerHTML='<div class="m3d-box"><div class="m3d-top"><b>'+esc(name)+'</b><span class="a">Drag to turn · scroll or pinch to zoom</span><button class="m3d-x" title="Close">✕</button></div><div class="m3d-view"><div class="note">Loading 3D model…</div></div></div>';
 document.body.appendChild(ov);let stop=null;
 const kd=e=>{if(e.key==='Escape')close()};const close=()=>{if(stop)stop();ov.remove();document.removeEventListener('keydown',kd)};
 document.addEventListener('keydown',kd);ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('.m3d-x'))close()});
 const view=ov.querySelector('.m3d-view');
 try{const mod=await import('./vendor/viewer.js?v='+VER+'b');view.innerHTML='';const s=await mod.show(view,rec.buf);if(ov.isConnected)stop=s;else s()}
 catch(e){view.innerHTML='<div class="note">Could not show this model ('+esc((e&&e.message)||e)+'). Try downloading it again from the game.</div>'}}
async function wire3d(m){const g=m.querySelector('.as-grid');if(!g)return;let have;
 try{have=new Set((await M3D.keys()).map(Number))}catch(e){g.querySelectorAll('.as-3d').forEach(d=>{d.innerHTML='<span class="a">3D models need browser storage, which is turned off here.</span>'});return}
 g.querySelectorAll('.as-3d').forEach(d=>{const id=+d.dataset.id,a=g.querySelector('.as-img[data-id="'+id+'"]');
  if(have.has(id)){d.innerHTML='<button class="as-b" data-act="view">View 3D</button><button class="as-b" data-act="del" title="Remove the 3D model from this browser">Remove</button>';if(a){a.dataset.m3d='1';a.title='Open the 3D model'}}
  else{d.innerHTML='<label class="as-b" title="In the game, open this asteroid\'s management page and press Download 3D Model, then pick that file here">Add 3D model<input type="file" accept=".glb,.gltf" style="display:none"></label>';if(a){delete a.dataset.m3d;a.title='Open the picture'}}});
 if(g.dataset.w)return;g.dataset.w='1';
 g.addEventListener('click',e=>{const a=e.target.closest('.as-img');if(a&&a.dataset.m3d){e.preventDefault();open3d(+a.dataset.id,a.dataset.name);return}
  const b=e.target.closest('button.as-b');if(!b)return;const d=b.closest('.as-3d'),id=+d.dataset.id,nm=(g.querySelector('.as-img[data-id="'+id+'"]')||{}).dataset||{};
  if(b.dataset.act==='view')open3d(id,nm.name||'');
  if(b.dataset.act==='del'&&window.confirm('Remove the 3D model for '+(nm.name||'this asteroid')+' from this browser?'))M3D.del(id).then(()=>wire3d(m))});
 g.addEventListener('change',async e=>{const inp=e.target;if(!inp.matches('.as-3d input[type=file]'))return;const f=inp.files&&inp.files[0];if(!f)return;const d=inp.closest('.as-3d'),id=+d.dataset.id;
  const msg=t=>{d.innerHTML='<span class="a">'+esc(t)+'</span>';setTimeout(()=>wire3d(m),3500)};
  if(f.size>400e6)return msg('That file is too big (over 400 MB).');d.innerHTML='<span class="a">Saving the model… (big files take a little while)</span>';
  const buf=await f.arrayBuffer(),hd=new Uint8Array(buf.slice(0,4)),isGlb=String.fromCharCode(...hd)==='glTF',isJson=hd[0]===123;
  if(!isGlb&&!isJson)return msg('That doesn\'t look like a 3D model from the game (.glb or .gltf).');
  try{await M3D.put(id,{name:f.name,buf,size:f.size,added:Date.now()});wire3d(m)}catch(err){msg('Could not save it in this browser (storage may be full or turned off).')}});
}
function drawAsteroids(m){
 const ai=$('#ast').value,an=ai===''?null:asts[+ai].name,q=$('#q').value.trim().toLowerCase();
 const list=(D.owned||[]).map(a=>{const c=a.Celestial||{},st=c.celestialType,sp=SPEC[st]||['?',[]],r=c.radius||0,lots=Math.floor(4*Math.PI*r*r);
  const name=(a.Name&&a.Name.name)||(a.id+'-'+sp[0].toUpperCase()),bon=astBonuses(c.bonuses||0,st),lv=bon.reduce((s,b)=>s+b.lv,0);
  const scanned=(c.scanStatus||0)>=4&&c.abundances,ab=scanned?astAbund(c.abundances):null;
  const owner=(a.Nft&&a.Nft.owners&&a.Nft.owners.starknet)===D.wallet,ctl=(D.crewN||{})[a.Control&&a.Control.controller&&a.Control.controller.id]||'';
  return{id:a.id,name,sp:sp[0],res:sp[1],r,lots,used:a.lotsUsed,size:r<=5?'Small':r<=20?'Medium':r<=50?'Large':'Huge',bon,rar:lv<=3?RAR[lv]:lv<=5?RAR[4]:RAR[5],scanned,ab,owner,ctl,orb:a.Orbit||null}})
  .filter(x=>(!an||x.name===an)&&(!q||[x.name,x.sp+'-type',x.size,x.rar,x.ctl,...x.res.map(pn)].some(v=>String(v).toLowerCase().includes(q))))
  .sort((a,b)=>(b.owner-a.owner)||a.name.localeCompare(b.name));
 if(!list.length){m.innerHTML='<div class="note">'+((D.owned||[]).length?'Nothing matches.':'No asteroids are owned by this wallet or controlled by its crews.')+'</div>';return}
 const pct=f=>(Math.round(f*1000)/10).toLocaleString()+'%';
 let h='<style>.as-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:14px;align-items:start}.as-c{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:12px;display:grid;grid-template-columns:130px 1fr;gap:12px}'+
  '.as-img{display:block;width:130px;height:160px;border-radius:6px;background:#000 no-repeat 50% 45%/180% auto}.as-c h3{margin:0;font-size:16px}.as-c .t{color:var(--muted);font-size:12px;margin:2px 0 6px}'+
  '.as-chip{display:inline-block;font-size:11.5px;border:1px solid var(--line);border-radius:10px;padding:1px 8px;margin:0 4px 4px 0;color:var(--accent)}.as-k{display:flex;justify-content:space-between;font-size:13px;padding:2px 0}.as-k span:first-child{color:var(--muted)}'+
  '.as-res{grid-column:1/-1}.as-r{display:flex;align-items:center;gap:6px;font-size:13px;padding:2px 0}.as-r .nm{width:120px}.as-r .bb{flex:1;height:6px;background:#232b38;border-radius:2px;overflow:hidden}.as-r .bb i{display:block;height:100%;background:var(--accent)}.as-r .v{width:52px;text-align:right;color:var(--muted)}</style>';
 h+='<div class="note" style="padding:0 0 10px">'+list.length+' asteroid'+(list.length>1?'s':'')+' you own or control. Click a picture to see it full size (or in 3D once you have added the model).</div><div class="as-grid">';
 list.forEach(x=>{
  const lb=x.used!=null&&x.lots?Math.min(1,x.used/x.lots):null;
  h+='<div class="as-c"><div><a class="as-img" data-id="'+(+x.id)+'" data-name="'+esc(x.name)+'" href="aimg.php?id='+(+x.id)+'" target="_blank" title="Open the picture" style="background-image:url(aimg.php?id='+(+x.id)+'&s=1)"></a><div class="as-3d" data-id="'+(+x.id)+'"></div></div><div>'+
   '<h3>'+esc(x.name)+'</h3><div class="t">#'+(+x.id)+' · '+esc(x.sp)+'-type · '+x.size+' · '+esc(x.rar)+'</div>'+
   '<div>'+(x.owner?'<span class="as-chip">Owned</span>':'')+(x.ctl?'<span class="as-chip" style="color:var(--muted)">Controlled by '+esc(x.ctl)+'</span>':'')+'</div>'+
   '<div class="as-k"><span>Radius</span><span>'+(Math.round(x.r*100)/100).toLocaleString()+' km</span></div>'+
   '<div class="as-k"><span>Lots</span><span>'+x.lots.toLocaleString()+'</span></div>'+
   '<div class="as-k"><span>Lots in use</span><span>'+(x.used==null?'–':x.used.toLocaleString()+' ('+pct(lb)+')')+'</span></div>'+
   (lb!=null?'<div style="height:6px;background:#232b38;border-radius:2px;overflow:hidden;margin:2px 0 6px"><div style="height:100%;width:'+Math.max(1,Math.round(lb*100))+'%;background:'+(lb>=0.9?'#d03b3b':lb>=0.75?'#fab219':'#5fc3e4')+'"></div></div>':'')+
   (x.orb&&x.orb.a?'<div class="as-k"><span>Orbit</span><span>'+(x.orb.a/149597870.7).toFixed(3)+' AU · ecc '+(+x.orb.ecc).toFixed(3)+' · inc '+(+x.orb.inc*180/Math.PI).toFixed(2)+'°</span></div>':'')+
   '<div style="margin-top:6px">'+(x.bon.length?x.bon.map(b=>'<span class="as-chip">'+esc(b.n)+' +'+b.mod+'%</span>').join(''):'<span class="as-chip" style="color:var(--muted)">No bonuses</span>')+'</div>'+
   '</div><div class="as-res"><h4 style="margin:4px 0 6px">'+(x.scanned?'Resources (abundance)':'Resources it can hold – not resource-scanned yet')+'</h4>'+
   (x.scanned?x.res.map(r=>[r,x.ab[r]||0]).sort((a,b)=>b[1]-a[1]).map(([r,v])=>'<div class="as-r">'+ricon(r,20)+'<span class="nm">'+esc(pn(r))+(BONB?(()=>{const m=resBonus(x.bon,r).m;return m>1.0001?' <span style="color:#4cd04c;font-size:12px;font-weight:600">+'+Math.round((m-1)*100)+'% faster</span>':''})():'')+'</span><span class="bb"><i style="width:'+Math.round(v*100)+'%"></i></span><span class="v">'+(v?pct(v):'–')+'</span></div>').join('')
    :x.res.map(r=>'<span class="as-chip" style="color:var(--text)">'+ricon(r,16)+esc(pn(r))+'</span>').join(''))+
   '</div></div>'});
 m.innerHTML=h+'</div>'+(BONB?bestAstHTML():'')+'<div class="note" style="padding:12px 0 0">Abundance is the asteroid-wide figure from its resource scan; the amount at each lot varies. Lots in use counts every building or construction site on the asteroid, whoever owns it.<br>3D models: in the game, open your asteroid\'s management page and press <b>Download 3D Model</b>, then use <b>Add 3D model</b> here. Models are kept only in this browser.</div>';wire3d(m)}
let mkTab='mine',BELT=null,beltLoad=null,beltType=2,beltOpen=null,beltSort='name',beltDir=1;
function mkTabs(){return '<div class="bar" style="margin:0 0 12px"><span class="seg"><button data-mk="mine"'+(mkTab==='mine'?' class="on"':'')+'>My listings</button><button data-mk="belt"'+(mkTab==='belt'?' class="on"':'')+'>Whole belt</button></span>'+
 (mkTab==='belt'?'<span class="seg"><button data-bt="2"'+(beltType===2?' class="on"':'')+'>For sale</button><button data-bt="1"'+(beltType===1?' class="on"':'')+'>Wanted</button></span>':'')+'</div>'}
if(window.__mkClick)document.removeEventListener('click',window.__mkClick);
window.__mkClick=e=>{const t=e.target.closest&&e.target.closest('[data-mk],[data-bt]');if(!t||!document.getElementById('main')||!document.getElementById('main').contains(t))return;
 if(t.dataset.mk){mkTab=t.dataset.mk;beltOpen=null}else{beltType=+t.dataset.bt;beltOpen=null}draw()};
document.addEventListener('click',window.__mkClick);
function drawBelt(m){
 if(!BELT||BELT.err){
  if(BELT&&BELT.err){m.innerHTML=mkTabs()+'<div class="note">Could not load the belt market ('+esc(BELT.err)+'). Click Whole belt to try again.</div>';BELT=null;return}
  m.innerHTML=mkTabs()+'<div class="note">Loading every listing in the belt…</div>';
  if(!beltLoad)beltLoad=fetch('market.php',{cache:'no-store'}).then(r=>r.json()).then(j=>{if(j.error)throw new Error(j.error);BELT=j}).catch(e=>{BELT={err:(e&&e.message)||'error'}}).finally(()=>{beltLoad=null;if(view==='K'&&mkTab==='belt')draw()});
  return}
 const ai=$('#ast').value,an=ai===''?null:asts[+ai].name,q=$('#q').value.trim().toLowerCase(),cl=$('#cls').value;
 const mk=BELT.markets||{},mine=new Set(Object.keys(D.crewN||{}).map(Number));
 const mName=id=>(mk[id]&&mk[id].name)||('Marketplace #'+id),aName=(id,a)=>(mk[id]&&mk[id].ast)||('Asteroid #'+a);
 const fee=id=>{const x=mk[id]&&mk[id].ex;return x?((beltType===2?x.takerFee:x.makerFee)||0)/100:null};
 const pkg=(p,raw)=>raw/1e6*1000/((PR[p]&&PR[p][2])||1000),pt=(p,raw)=>raw/1e6*1e6/((PR[p]&&PR[p][2])||1000),pe=raw=>raw/1e6;
 const num=v=>(+v.toFixed(v<1?4:v<100?2:0)).toLocaleString();
 const priceH=(p,raw)=>isAt(p)?num(pe(raw))+' SWAY <span class="a">each</span>':num(pkg(p,raw))+' SWAY <span class="a">per kg</span><br><span class="a">'+num(pt(p,raw))+' per t</span>';
 const rows=(BELT.orders||[]).filter(o=>o[1]===beltType&&o[2]>0&&o[3]>0).map(o=>({p:String(o[0]),amt:o[2],raw:o[3],mid:o[4],ast:aName(o[4],o[5]),crew:o[6]}))
  .filter(o=>(!an||o.ast===an)&&(!cl||pc(o.p)===cl)&&(!q||pn(o.p).toLowerCase().includes(q)||mName(o.mid).toLowerCase().includes(q)||o.ast.toLowerCase().includes(q)));
 const g={};rows.forEach(o=>{(g[o.p]=g[o.p]||[]).push(o)});
 let list=Object.keys(g).map(p=>{const os=g[p].sort((a,b)=>beltType===2?a.raw-b.raw:b.raw-a.raw);return{p,os,amt:os.reduce((s,o)=>s+o.amt,0),best:os[0].raw,worst:os[os.length-1].raw,mk:new Set(os.map(o=>o.mid)).size,mine:os.some(o=>mine.has(o.crew))}});
 const key={name:x=>pn(x.p),amt:x=>kg(x.p,x.amt),best:x=>isAt(x.p)?pe(x.best):pkg(x.p,x.best),n:x=>x.os.length};
 list.sort((a,b)=>{const ka=key[beltSort](a),kb=key[beltSort](b);return (typeof ka==='string'?ka.localeCompare(kb):ka-kb)*beltDir});
 const all=(BELT.orders||[]).filter(o=>o[1]===beltType).length,mks=new Set((BELT.orders||[]).map(o=>o[4])).size,ast=new Set((BELT.orders||[]).map(o=>o[5])).size;
 let h=mkTabs()+'<div class="note" style="padding:0 0 10px">'+all.toLocaleString()+' '+(beltType===2?'listings for sale':'buy requests')+' in '+mks+' marketplaces on '+ast+' asteroids · updated '+esc(new Date(BELT.fetched*1000).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}))+' (refreshes every 5 minutes)'+(an?' · showing <b>'+esc(an)+'</b> only':'')+'</div>';
 if(!list.length){m.innerHTML=h+'<div class="note">Nothing matches.</div>';return}
 const th=(k,t,c)=>'<th data-bs="'+k+'"'+(c?' class="'+c+'"':'')+'>'+t+(beltSort===k?(beltDir>0?' ▴':' ▾'):'')+'</th>';
 h+='<div class="wrap"><table><thead><tr>'+th('name','Product')+'<th>Type</th>'+th('amt',beltType===2?'Available':'Wanted','num')+th('best',beltType===2?'Lowest price':'Highest offer','num')+'<th class="num">'+(beltType===2?'Highest':'Lowest')+'</th>'+th('n','Listings','num')+'<th class="num">Markets</th></tr></thead><tbody>';
 list.forEach(x=>{const o=beltOpen===x.p;
  h+='<tr class="prow'+(o?' open':'')+'" data-p="'+x.p+'"><td>'+ricon(x.p,24)+esc(pn(x.p))+(x.mine?' <span class="a">(incl. yours)</span>':'')+'</td><td class="cls">'+esc(pc(x.p))+'</td><td class="num tot">'+fq(x.p,x.amt)+'</td><td class="num">'+priceH(x.p,x.best)+'</td><td class="num cls">'+priceH(x.p,x.worst)+'</td><td class="num">'+x.os.length+'</td><td class="num">'+x.mk+'</td></tr>';
  if(o)h+='<tr class="det"><td colspan="7"><table style="width:auto"><thead><tr><th class="num">Price</th><th class="num">Amount</th><th>Marketplace</th><th>Asteroid</th><th class="num">'+(beltType===2?'Buyer fee':'Seller fee')+'</th></tr></thead><tbody>'+
   x.os.slice(0,200).map(r=>{const f=fee(r.mid);return '<tr><td class="num">'+priceH(r.p,r.raw)+'</td><td class="num">'+fq(r.p,r.amt)+'</td><td>'+esc(mName(r.mid))+(mine.has(r.crew)?' <span style="color:var(--accent)">· yours</span>':'')+'</td><td class="cls">'+esc(r.ast)+'</td><td class="num cls">'+(f==null?'–':(+f.toFixed(2))+'%')+'</td></tr>'}).join('')+
   (x.os.length>200?'<tr><td colspan="5" class="a">…and '+(x.os.length-200)+' more</td></tr>':'')+'</tbody></table></td></tr>'});
 m.innerHTML=h+'</tbody></table></div><div class="note" style="padding:10px 0 0">Every open listing in the game, from every player. Click a product to see each listing. Prices are as listed; the marketplace fee is shown per listing.</div>';
 m.querySelectorAll('tr.prow').forEach(tr=>tr.addEventListener('click',()=>{beltOpen=beltOpen===tr.dataset.p?null:tr.dataset.p;draw()}));
 m.querySelectorAll('th[data-bs]').forEach(th=>th.addEventListener('click',()=>{const k=th.dataset.bs;if(beltSort===k)beltDir=-beltDir;else{beltSort=k;beltDir=k==='name'?1:(k==='best'&&beltType===2?1:-1)}draw()}));
}
let trShip=null,trProp='full',trCargo='empty',trLeave=0,trRun=0;
function drawTravel(m){
 const astsO=(D.owned||[]).filter(a=>a.Orbit&&a.Orbit.a).map(a=>({id:a.id,name:(a.Name&&a.Name.name)||('Asteroid #'+a.id),o:a.Orbit})).sort((a,b)=>a.name.localeCompare(b.name));
 if(astsO.length<2){m.innerHTML='<div class="note">You need at least two asteroids for a travel table.</div>';return}
 const ships=(D.ships||[]).filter(s=>s.st>=2&&s.st<=4).sort((a,b)=>a.name.localeCompare(b.name));
 const opts=[...ships.map(s=>['s'+s.id,s.name+' · '+s.type]),['g2','Any Light Transport (no crew bonus)'],['g3','Any Heavy Transport (no crew bonus)'],['g4','Any Shuttle (no crew bonus)']];
 if(!trShip||!opts.some(o=>o[0]===trShip))trShip=(ships.find(s=>s.st===2)?'s'+ships.find(s=>s.st===2).id:opts[0][0]);
 const sel=(id,cur,list)=>'<select id="'+id+'">'+list.map(([v,t])=>'<option value="'+esc(v)+'"'+(String(v)===String(cur)?' selected':'')+'>'+esc(t)+'</option>').join('')+'</select>';
 let h='<div class="bar" style="margin:0 0 10px">Ship '+sel('trS',trShip,opts)+' Propellant '+sel('trP',trProp,[['full','Full tank'],['now','What it has now']])+' Cargo '+sel('trC',trCargo,[['empty','Empty'],['full','Full'],['now','What it has now']])+' Leave '+sel('trL',trLeave,[[0,'now'],[6,'in 6 hours'],[12,'in 12 hours'],[24,'in 1 day'],[48,'in 2 days']])+'</div>';
 h+='<div id="trInfo" class="note" style="padding:0 0 10px"></div><div class="wrap"><table id="trT"><thead><tr><th>From \\ To</th>'+astsO.map(a=>'<th class="num">'+esc(a.name)+'</th>').join('')+'</tr></thead><tbody>'+
  astsO.map(a=>'<tr><td><b>'+esc(a.name)+'</b></td>'+astsO.map(b=>'<td class="num" data-f="'+a.id+'" data-t="'+b.id+'">'+(a.id===b.id?'<span class="a">–</span>':'<span class="a">…</span>')+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'+
  '<div class="note" style="padding:10px 0 0">Quickest trip leaving at the chosen time, worked out the same way as the game\'s route planner (1 game day = 1 real hour). The fastest in each row is highlighted. Small grey figure = distance between the two asteroids right now. Food, emergency mode and waiting for a better launch window are not included.</div>';
 m.innerHTML=h;
 ['trS','trP','trC','trL'].forEach(id=>m.querySelector('#'+id).addEventListener('change',e=>{const v=e.target.value;if(id==='trS')trShip=v;if(id==='trP')trProp=v;if(id==='trC')trCargo=v;if(id==='trL')trLeave=+v;drawTravel(m)}));
 // ship figures
 let st=2,variant=1,bonus=1,mates=null,propKg=0,cargoKg=0,label='';
 if(trShip[0]==='s'){const s=ships.find(x=>'s'+x.id===trShip);st=s.st;variant=s.sv;const crewId=s.crewId;const cr=(D.crewsRaw||[]).find(c=>c.id===crewId);const roster=(cr&&cr.Crew&&cr.Crew.roster)||[];mates=roster.map(id=>(D.crewmates||{})[id]).filter(Boolean);propKg=s.prop*1000;cargoKg=s.useM/1000;label=esc(s.name)+(cr?' (crew '+esc((cr.Name&&cr.Name.name)||('#'+cr.id))+')':'')}
 else{st=+trShip.slice(1);label='a standard '+({2:'Light Transport',3:'Heavy Transport',4:'Shuttle'})[st]+' with no crew bonus'}
 m.querySelector('#trInfo').innerHTML='Working out trips for '+label+'…';
 const run=++trRun;
 import('./vendor/travel.js?v='+VER).then(async T=>{
  if(run!==trRun||!m.isConnected)return;
  if(mates&&mates.length){bonus=T.exhaustBonus(mates);label+=' · engine bonus ×'+bonus.toFixed(2)}
  const S=T.SHIPS[st];const pk=trProp==='full'?S[2]/1000:propKg,ck=trCargo==='empty'?0:trCargo==='full'?S[3]/1000:cargoKg;
  const maxDv=T.maxDeltaV(st,variant,bonus,ck,pk),now=(Date.now()/1000-1609459200)/3600,dep=now+trLeave;
  m.querySelector('#trInfo').innerHTML=label+' · '+fmtT(pk/1000)+' propellant · '+(ck?fmtT(ck/1000)+' cargo':'no cargo')+' · up to '+(maxDv/1000).toFixed(1)+' km/s';
  const best={};
  for(const a of astsO)for(const b of astsO){if(a.id===b.id)continue;
   if(run!==trRun||!m.isConnected)return;
   const td=m.querySelector('td[data-f="'+a.id+'"][data-t="'+b.id+'"]');const au=T.distance(a.o,b.o,dep)/1.495978707e11;
   const f=await T.fastest(a.o,b.o,dep,maxDv);
   td.innerHTML=(f?'<b>'+f.tof+' h</b>'+(f.tof>=48?' <span class="a">('+(f.tof/24).toFixed(1)+' d)</span>':''):'<span class="a">out of range</span>')+'<br><span class="a">'+au.toFixed(2)+' AU</span>';
   td.dataset.h=f?f.tof:'';if(f&&(!best[a.id]||f.tof<best[a.id].tof))best[a.id]={tof:f.tof,td};
   await new Promise(r=>setTimeout(r,0))}
  Object.values(best).forEach(x=>{x.td.style.background='rgba(95,195,228,.15)'});
 }).catch(e=>{const i=m.querySelector('#trInfo');if(i)i.innerHTML='Could not load the travel maths ('+esc((e&&e.message)||e)+').'});
}

function drawAlerts(m){
 const ai=$('#ast').value,an=ai===''?null:asts[+ai].name,q=$('#q').value.trim().toLowerCase(),now=Date.now()/1000;
 const when=t=>new Date(t*1000).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
 const astOf=b=>{const l=((b.Location&&b.Location.locations)||[]).find(x=>x.label===3);return (b.meta&&b.meta.asteroid&&b.meta.asteroid.name)||(l?'Asteroid #'+l.id:'?')};
 const okA=a=>!an||a===an,okQ=(...t)=>!q||t.some(v=>String(v||'').toLowerCase().includes(q));
 const S={collect:[],risk:[],accept:[],lease:[],build:[],idle:[],store:[],food:[],prop:[]};
 const plan={};let planX=0;
 const add=(k,r)=>{if(okA(r.a)&&okQ(r.name,r.type,r.crew,r.a,r.what))S[k].push(r)};
 (D.allB||[]).forEach(b=>{const B=b.Building||{},st=B.status,a=astOf(b),bt=B.buildingType,type=BT[bt]||'Building',name=(b.Name&&b.Name.name)||(type+' #'+b.id),crew=(D.crewN||{})[b.Control&&b.Control.controller&&b.Control.controller.id]||'';
  const r=(lvl,what,t)=>({lvl,what,t:t||0,a,name,type,crew,pic:type});
  if(st===2){if(B.finishTime&&B.finishTime<=now)add('build',r(2,'Construction finished – ready to complete',B.finishTime));else add('build',r(0,'Being built – done '+(B.finishTime?when(B.finishTime)+' ('+tLeft(B.finishTime,now)+')':'soon'),B.finishTime));return}
  if(st===1){const xp=B.plannedAt&&B.plannedAt+172800<=now;if(okA(a)&&okQ(name,type,crew,a,'planned')){plan[a]=(plan[a]||0)+1;if(xp)planX++}
   if(xp){const c=[];(b.Inventories||[]).forEach(i=>(i.contents||[]).forEach(x=>{if(x&&x.amount>0)c.push(pn(String(x.product))+' '+fq(String(x.product),x.amount))}));if(c.length)add('risk',r(2,c.join(', ')+' – reservation ran out '+when(B.plannedAt+172800),B.plannedAt))}return}
  if(st!==3)return;
  if([2,3,4,5,6].includes(bt)){let busy=false;
   (b.Extractors||[]).forEach(e=>{if(e.status!==1)return;busy=true;if(e.finishTime<=now)add('collect',r(2,'Extracting '+pn(e.outputProduct)+' – finished',e.finishTime))});
   (b.Processors||[]).forEach(p=>{if(p.status!==1)return;busy=true;if(p.finishTime<=now){const pr=PROCN[p.runningProcess];add('collect',r(2,(pr?pr[0]:'Process')+' – finished',p.finishTime))}});
   (b.DryDocks||[]).forEach(d=>{if(d.status!==1)return;busy=true;if(d.finishTime<=now)add('collect',r(2,'Ship assembly – finished',d.finishTime))});
   if(!busy)add('idle',r(1,'Nothing running'));
  }else if([1,10].includes(bt)){const inv=(b.Inventories||[]).find(i=>SCAP[i.inventoryType]);if(!inv)return;const c=SCAP[inv.inventoryType],f=Math.max((inv.mass||0)/c[0],(inv.volume||0)/c[1]);
   if(f>=0.75)add('store',r(f>=0.9?2:1,Math.round(f*100)+'% full – '+fmtT((inv.mass||0)/1e6)+' of '+fmtT(c[0]/1e6),f))}
 });
 (D.crewList||[]).forEach(c=>{if(!c.mates||c.food==null||c.food>=0.65)return;add('food',{lvl:c.food<0.5?2:1,what:'Food at '+Math.round(c.food*100)+'%'+(c.food<0.5?' – crew is slowed down':''),t:-c.food,a:c.ast,name:c.name,type:'Crew',crew:c.mates+' crewmate'+(c.mates>1?'s':'')})});
 {const g={};S.idle.forEach(x=>{const k=x.a+'|'+x.type;(g[k]=g[k]||{lvl:1,t:0,a:x.a,type:x.type,n:[],crew:new Set()}).n.push(x.name);if(x.crew)g[k].crew.add(x.crew)});
  S.idle=Object.values(g).map(x=>({lvl:1,t:-x.n.length,a:x.a,type:x.type,pic:x.type,what:x.n.length+' '+x.type+(x.n.length>1?'s':'')+' with nothing running',name:x.type,html:x.n.length>1?'<details><summary style="cursor:pointer">'+x.n.length+' '+esc(x.type)+'s</summary><div class="a" style="white-space:normal;max-width:420px">'+x.n.map(esc).join(', ')+'</div></details>':esc(x.n[0]),crew:[...x.crew].join(', ')}))}
 leaseInfo().forEach(x=>{if(x.st==='ok')return;add('lease',{lvl:x.st==='soon'?1:2,what:x.st==='none'?'No lease – owner can seize it':x.left<=0?'Lease ended '+Math.floor(-x.left/86400)+' days ago – owner can seize it':'Lease ends in '+tLeft(x.end,Date.now()/1000),t:x.end,a:x.a,name:'Lot #'+x.lot.toLocaleString()+(x.b.length?' · '+x.b.map(b=>b.name).join(', '):''),type:'Lot',crew:x.crew})});
 const BETA=true;
 if(BETA){if(!DLV&&!dlvLoad)dlvLoad=fetch('deliveries.php?wallet='+encodeURIComponent(D.wallet||''),{cache:'no-store'}).then(r=>r.json()).then(j=>{if(j.error)throw new Error(j.error);DLV=j}).catch(e=>{DLV={err0:(e&&e.message)||'error'}}).finally(()=>{dlvLoad=null;if(view==='N'||view==='V')draw()});
  if(DLV&&!DLV.err0){const bI={};(D.allB||[]).forEach(b=>{bI[b.id]=b});const sI={};(D.ships||[]).forEach(s=>{sI[s.id]=s});
   const nm=e=>{if(e[0]===5){const b=bI[e[1]];if(!b)return ['Building #'+e[1],'','Building'];const ty=BT[b.Building&&b.Building.buildingType]||'Building';return [(b.Name&&b.Name.name)||(ty+' #'+e[1]),astOf(b),ty]}const s=sI[e[1]];return s?[s.name,s.ast||'','Ship']:['Ship #'+e[1],'','Ship']};
   (DLV.pending||[]).forEach(r=>{if(!r[4][3])return;const [n,a,ty]=nm(r[4]);add('accept',{lvl:1,what:(r[5]||[]).map(([p,x])=>pn(String(p))+' '+fq(String(p),x)).join(', ')||'Delivery',t:r[2]||0,a,name:n,type:ty,crew:r[3][3]?'You ('+nm(r[3])[0]+')':'Another player',pic:ty==='Ship'?'':ty,ship:ty==='Ship'?1:0})})}}
 const TANK={2:4000,3:24000,4:2000};
 (D.ships||[]).forEach(s=>{const tk=TANK[s.st];if(!tk)return;const f=(s.prop||0)/tk;if(f>=0.25)return;add('prop',{lvl:f<0.1?2:1,what:'Propellant '+fmtT(s.prop||0)+' of '+fmtT(tk)+' ('+Math.round(f*100)+'%)',t:f,a:s.ast||'',name:s.name,type:s.type,crew:(D.crewN||{})[s.crewId]||'',ship:1})});
 const SEC=[['collect','Ready to collect','Finished jobs waiting for you to collect the output.'],['risk','Materials at risk','Planned building sites whose 2-day reservation has run out, with materials still on them. The game makes materials on an expired site public. Start construction or move them out.'],...(BETA?[['accept','Waiting to accept','Deliveries sent to you. Accept them in the game so the goods go into storage.']]:[]),['lease','Leases with less than 30 days','Lots under your buildings where the lease has ended or ends within 30 days. If a lease runs out, the asteroid owner can seize the building and its stock.'],['build','Construction','Buildings being built, or finished and waiting for you to complete them.'],['idle','Idle buildings','Production buildings with nothing running, grouped by asteroid. Click a group to see the buildings.'],['store','Storage nearly full','Warehouses and tank farms 75% full or more.'],['food','Crews low on food','Crews with crewmates whose food is under 65%. Below 50% they work more slowly.'],['prop','Ships low on propellant','Ships with less than a quarter of a tank.']];
 const COL={2:'#ff7a7a',1:'#fab219',0:'#5fc3e4'},dot=l=>'<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:'+COL[l]+';margin-right:7px;vertical-align:middle"></span>';
 const total=SEC.reduce((n,[k])=>n+S[k].length,0),pk=Object.keys(plan).sort(),pn_=pk.reduce((n,k)=>n+plan[k],0);
 const planH=pn_?'<div class="note" style="padding:14px 0 0">Not counted above: '+pn_+' planned building site'+(pn_>1?'s':'')+' not started yet'+(planX?' ('+planX+' past the 2-day reservation)':'')+' – '+pk.map(k=>esc(k)+' '+plan[k]).join(', ')+'.</div>':'';
 let h='<div style="display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px">'+SEC.map(([k,t])=>{const n=S[k].length,hi=S[k].some(x=>x.lvl===2);
  return '<a href="#al-'+k+'" style="text-decoration:none;flex:1 1 140px;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:#0f141c;color:inherit"><div style="font-size:22px;font-weight:600;color:'+(n?(hi?COL[2]:COL[1]):'#4cd04c')+'">'+n+'</div><div class="a" style="font-size:12px">'+t+'</div></a>'}).join('')+'</div>';
 if(!total){m.innerHTML=h+'<div class="note">Nothing needs your attention right now.</div>'+planH;return}
 SEC.forEach(([k,t,d])=>{const L=S[k];if(!L.length)return;L.sort((x,y)=>y.lvl-x.lvl||x.t-y.t||x.a.localeCompare(y.a)||String(x.name).localeCompare(String(y.name)));
  h+='<h2 id="al-'+k+'">'+t+' <span class="a" style="font-size:14px;font-weight:400">('+L.length+')</span></h2><div class="note" style="padding:0 0 8px">'+d+'</div><div class="wrap"><table><thead><tr><th>'+({collect:'Resource',risk:'Materials on site',accept:'Resource',lease:'Lease',build:'Progress',idle:'Type',store:'Space used',food:'Food level',prop:'Propellant left'}[k]||'What')+'</th><th>'+(k==='food'?'Crew':k==='risk'?'Site':k==='accept'?'Delivered to':k==='prop'?'Ship':k==='lease'?'Lot':'Building')+'</th><th>Asteroid</th><th>'+(k==='food'?'Size':k==='accept'?'Sent by':k==='lease'?'Leased by':k==='prop'?'Ship owner':'Building owner')+'</th></tr></thead><tbody>'+
  L.map(x=>'<tr><td style="white-space:normal">'+dot(x.lvl)+esc(x.what)+'</td><td>'+(x.pic?bthumb(x.pic,48,36):'')+(x.html||esc(x.name||'')+(x.pic||x.ship?' <span class="a">· '+esc(x.type)+'</span>':''))+'</td><td class="cls">'+esc(x.a||'')+'</td><td class="cls">'+esc(x.crew||'')+'</td></tr>').join('')+'</tbody></table></div>'});
 h+='<div class="note" style="padding:14px 0 0">Red = act now, amber = soon, blue = for information. Storage uses the standard sizes; crew bonuses aren\'t included. Food uses the same estimate as the Crews page.</div>';
 m.innerHTML=h+planH}
let SAMP=null,sampLoad=null,sampOpen=null;
function drawSamples(m){
 if(!SAMP||SAMP.err){
  if(SAMP&&SAMP.err){m.innerHTML='<div class="note">Could not load your core samples ('+esc(SAMP.err)+'). Click Core Samples to try again.</div>';SAMP=null;return}
  m.innerHTML='<div class="note">Loading your core samples…</div>';
  if(!sampLoad)sampLoad=fetch('samples.php?wallet='+encodeURIComponent(D.wallet||''),{cache:'no-store'}).then(r=>r.json()).then(j=>{if(j.error)throw new Error(j.error);SAMP=j}).catch(e=>{SAMP={err:(e&&e.message)||'error'}}).finally(()=>{sampLoad=null;if(view==='X')draw()});
  return}
 const ai=$('#ast').value,an=ai===''?null:asts[+ai].name,q=$('#q').value.trim().toLowerCase(),cl=$('#cls').value;
 const ex={};(D.allB||[]).forEach(b=>{const B=b.Building||{};if(B.status!==3||B.buildingType!==2)return;const l=((b.Location&&b.Location.locations)||[]).find(x=>x.label===4);if(!l)return;
  const e=ex[l.id]=ex[l.id]||[];e.push({name:(b.Name&&b.Name.name)||('Extractor #'+b.id),busy:(b.Extractors||[]).some(x=>x.status===1)})});
 const lotN=id=>Math.floor(id/4294967296);
 const g={};(SAMP.rows||[]).forEach(([id,r,kg,lot,a,sale])=>{const p=String(r);if(an&&a!==an)return;if(cl&&pc(p)!==cl)return;if(q&&!(pn(p).toLowerCase().includes(q)||a.toLowerCase().includes(q)))return;
  const k=a+'|'+p,x=g[k]=g[k]||{a,p,n:0,kg:0,max:0,lots:{}};x.n++;x.kg+=kg;x.max=Math.max(x.max,kg);
  const L=x.lots[lot]=x.lots[lot]||{lot,n:0,kg:0,max:0,sale:0};L.n++;L.kg+=kg;L.max=Math.max(L.max,kg);L.sale+=sale});
 const list=Object.values(g).sort((x,y)=>y.kg-x.kg);
 const all=(SAMP.rows||[]).length;
 let h='<div class="note" style="padding:0 0 10px">'+all.toLocaleString()+' untouched samples (sampled, never extracted from) · updated '+esc(new Date(SAMP.fetched*1000).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}))+' (refreshes every 5 minutes)'+(an?' · showing <b>'+esc(an)+'</b> only':'')+'</div>';
 if(!list.length){m.innerHTML=h+'<div class="note">'+(all?'Nothing matches.':'You have no untouched samples.')+'</div>';return}
 h+='<div class="wrap"><table><thead><tr><th>Resource</th><th>Asteroid</th><th class="num">Total left</th><th class="num">Samples</th><th class="num">Lots</th><th class="num">Biggest sample</th></tr></thead><tbody>';
 list.forEach(x=>{const k=x.a+'|'+x.p,o=sampOpen===k,lots=Object.values(x.lots).sort((a,b)=>b.max-a.max||b.kg-a.kg);
  h+='<tr class="prow'+(o?' open':'')+'" data-k="'+esc(k)+'"><td>'+ricon(x.p,24)+esc(pn(x.p))+'</td><td class="cls">'+esc(x.a)+'</td><td class="num tot">'+fmt(x.p,x.kg)+'</td><td class="num">'+x.n+'</td><td class="num">'+lots.length+'</td><td class="num">'+fmt(x.p,x.max)+'</td></tr>';
  if(o)h+='<tr class="det"><td colspan="6"><table style="width:auto"><thead><tr><th>Lot</th><th class="num">Samples</th><th class="num">Total</th><th class="num">Biggest</th><th>Extractor on this lot</th></tr></thead><tbody>'+
   lots.map(L=>{const e=ex[L.lot];return '<tr><td>#'+lotN(L.lot).toLocaleString()+'</td><td class="num">'+L.n+(L.sale?' <span class="a">('+L.sale+' for sale)</span>':'')+'</td><td class="num">'+fmt(x.p,L.kg)+'</td><td class="num">'+fmt(x.p,L.max)+'</td><td>'+(e?e.map(z=>esc(z.name)+' · '+(z.busy?'<span style="color:#4cd04c">working</span>':'<span style="color:#fab219">idle</span>')).join('<br>'):'<span class="a">none</span>')+'</td></tr>'}).join('')+'</tbody></table></td></tr>'});
 m.innerHTML=h+'</tbody></table></div><div class="note" style="padding:10px 0 0">Click a resource to see its lots, biggest sample first. Used and part-used samples are left out.</div>';
 m.querySelectorAll('tr.prow').forEach(tr=>tr.addEventListener('click',()=>{sampOpen=sampOpen===tr.dataset.k?null:tr.dataset.k;draw()}));
}
function leaseInfo(){
 const now=Date.now()/1000,mine=new Set(Object.keys(D.crewN||{}).map(Number)),onLot={},astOfLot={};
 (D.allB||[]).forEach(b=>{const B=b.Building||{};if((B.status||0)<1)return;const ls=(b.Location&&b.Location.locations)||[],l=ls.find(x=>x.label===4);if(!l)return;
  const t=BT[B.buildingType]||'Building';(onLot[l.id]=onLot[l.id]||[]).push({name:(b.Name&&b.Name.name)||(t+' #'+b.id),type:t,planned:B.status!==3});
  astOfLot[l.id]=(b.meta&&b.meta.asteroid&&b.meta.asteroid.name)||('Asteroid #'+(l.id%4294967296))});
 const own=new Set((D.owned||[]).map(a=>+a.id));
 return (D.leases||[]).filter(([id])=>!own.has(id%4294967296)).map(([id,tenant,ag])=>{const my=ag.filter(a=>mine.has(a[1])),use=(my.length?my:ag).slice().sort((x,y)=>y[3]-x[3])[0]||null;
  const end=use?use[3]:0,crewId=use?use[1]:tenant,left=end?end-now:null;
  const st=!use?'none':left<=0?'ended':left<30*86400?'soon':'ok';
  return {id,lot:Math.floor(id/4294967296),a:astOfLot[id]||('Asteroid #'+(id%4294967296)),b:onLot[id]||[],crew:(D.crewN||{})[crewId]||(crewId?'Crew #'+crewId:''),end,left,st,kind:use?({P:'Prepaid',C:'Contract',W:'Whitelist'})[use[0]]:'',notice:use?use[4]:0}})}
function drawLeases(m){
 const ai=$('#ast').value,an=ai===''?null:asts[+ai].name,q=$('#q').value.trim().toLowerCase(),now=Date.now()/1000;
 if(D.leaseErr&&!(D.leases||[]).length){m.innerHTML='<div class="note">Could not load your leases just now. Try Refresh in a minute.</div>';return}
 const RANK={ended:0,none:1,soon:2,ok:3},COL={ended:'#ff7a7a',none:'#ff7a7a',soon:'#fab219',ok:'#4cd04c'},LBL={ended:'Ended',none:'No lease',soon:'Ends soon',ok:'OK'};
 const all=leaseInfo(),list=all.filter(x=>(!an||x.a===an)&&(!q||[x.a,x.crew,'#'+x.lot,...x.b.map(b=>b.name+' '+b.type)].some(v=>String(v).toLowerCase().includes(q))))
  .sort((x,y)=>RANK[x.st]-RANK[y.st]||(x.end-y.end)||x.lot-y.lot);
 const n=k=>list.filter(x=>x.st===k).length;
 const day=t=>new Date(t*1000).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
 let h='<div class="note" style="padding:0 0 10px">'+list.length+' leased lot'+(list.length===1?'':'s')+(an?' on <b>'+esc(an)+'</b>':'')+' · <b style="color:#ff7a7a">'+(n('ended')+n('none'))+' ended</b> · <b style="color:#fab219">'+n('soon')+' ending within 30 days</b> · <b style="color:#4cd04c">'+n('ok')+' OK</b></div>';
 if(!list.length){m.innerHTML=h+'<div class="note">'+(all.length?'Nothing matches.':'None of your buildings are on leased lots.')+'</div>';return}
 const dot=s=>'<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:'+COL[s]+';margin-right:7px;vertical-align:middle"></span>'+LBL[s];
 h+='<div class="wrap"><table><thead><tr><th>Status</th><th>Lot</th><th>Asteroid</th><th>On this lot</th><th>Leased by</th><th>Lease ends</th><th>Time left</th></tr></thead><tbody>'+
  list.map(x=>'<tr><td>'+dot(x.st)+'</td><td>#'+x.lot.toLocaleString()+'</td><td class="cls">'+esc(x.a)+'</td><td style="white-space:normal">'+(x.b.map(b=>bthumb(b.type,48,36)+esc(b.name)+(b.planned?' <span class="a">(site)</span>':'')).join('<br>')||'–')+'</td><td class="cls">'+esc(x.crew)+(x.kind&&x.kind!=='Prepaid'?' <span class="a">('+x.kind+')</span>':'')+'</td>'+
   '<td class="cls">'+(x.end?esc(day(x.end)):'–')+'</td><td>'+(x.st==='none'?'<b style="color:#ff7a7a">No lease</b>':x.left<=0?'<b style="color:#ff7a7a">Ended '+Math.floor(-x.left/86400)+' days ago</b>':'<b'+(x.st==='soon'?' style="color:#fab219"':'')+'>'+tLeft(x.end,now)+'</b>')+(x.notice?'<br><span class="a">notice given</span>':'')+'</td></tr>').join('')+'</tbody></table></div>';
 m.innerHTML=h+'<div class="note" style="padding:10px 0 0">If a lease runs out, the asteroid owner can seize the building and everything in it. Extend ended or ending leases in the game. Only lots with your buildings or building sites are shown; lots on asteroids you own need no lease.</div>'}
function navGroups(){
 if(!window.__stars){window.__stars=1;(()=>{
  const st=document.createElement('style');st.textContent='html{background:#0b0e13}body{background:transparent!important}#aa-head{background:transparent!important}#stars{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}body>*:not(#stars):not(header):not(.ddm):not(.m3d):not(style):not(script){position:relative;z-index:1}';document.head.appendChild(st);
  const cv=document.createElement('canvas');cv.id='stars';document.body.prepend(cv);const ctx=cv.getContext('2d');
  const calm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W=0,H=0,S=[];const dpr=Math.min(window.devicePixelRatio||1,2);
  const make=()=>{W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);const n=Math.round(W*H/5200);
   S=Array.from({length:n},()=>{const z=Math.random();return{x:Math.random()*W,y:Math.random()*H,z,r:0.35+z*1.15,a:0.25+z*0.6,tw:Math.random()*6.28,ts:0.4+Math.random()*1.4,c:Math.random()<0.18?'150,205,235':Math.random()<0.08?'255,214,170':'235,240,255'}})};
  let last=0;const draw=t=>{ctx.clearRect(0,0,W,H);
   const g=ctx.createRadialGradient(W*0.78,H*0.18,0,W*0.78,H*0.18,Math.max(W,H)*0.7);g.addColorStop(0,'rgba(60,110,150,0.10)');g.addColorStop(1,'rgba(11,14,19,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
   if(BG){const cx=W*0.74,cy=H*0.34,sc=Math.min(W,H)*0.42/BG.R,az=(calm?0.6:0.6+t/1000*0.006),ca=Math.cos(az),sa=Math.sin(az),ct=Math.cos(1.2),sn=Math.sin(1.2);
    const sg=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.min(W,H)*0.07);sg.addColorStop(0,'rgba(255,245,225,0.55)');sg.addColorStop(0.25,'rgba(255,230,190,0.25)');sg.addColorStop(1,'rgba(255,220,170,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.arc(cx,cy,Math.min(W,H)*0.07,0,6.283);ctx.fill();
    ctx.fillStyle='rgba(200,215,235,0.22)';for(const p of BG.pts){const x=p[0]*ca-p[1]*sa,y=p[0]*sa+p[1]*ca;ctx.fillRect(cx+x*sc,cy+(y*ct-p[2]*sn)*sc,1.3,1.3)}}
   const dt=last?Math.min(0.1,(t-last)/1000):0;last=t;
   for(const s of S){if(!calm){s.x-=dt*(1.5+s.z*7);if(s.x<-2){s.x=W+2;s.y=Math.random()*H}}
    const a=calm?s.a:s.a*(0.75+0.25*Math.sin(t/1000*s.ts+s.tw));ctx.fillStyle='rgba('+s.c+','+a.toFixed(3)+')';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.283);ctx.fill()}};
  let raf=0,prev=0;const loop=t=>{raf=requestAnimationFrame(loop);if(t-prev<33)return;prev=t;draw(t)};
  let BG=null;
  if(!calm||true){const ids=[];for(let i=1;ids.length<600;i++){const id=1+((i*104729)%249999);if(!ids.includes(id))ids.push(id)}
   setTimeout(()=>{Promise.all([import('./vendor/travel.js?v='+VER),...[0,200,400].map(s=>fetch('orbits.php?ids='+ids.slice(s,s+200).join(',')).then(r=>r.json()).then(j=>j.orbits||{}).catch(()=>({})))]).then(([T,...os])=>{
    const t=(Date.now()/1000-1609459200)/3600,AU=1.495978707e11,pts=[];let R=0;
    os.forEach(o=>Object.values(o).forEach(x=>{try{const p=T.pos(x.o,t);const q=[p[0]/AU,p[1]/AU,p[2]/AU];R=Math.max(R,Math.hypot(q[0],q[1]));pts.push(q)}catch(e){}}));
    if(pts.length)BG={pts,R:R||4};if(calm)draw(0)}).catch(()=>{})},1500)}
  make();if(calm)draw(0);else raf=requestAnimationFrame(loop);
  addEventListener('resize',()=>{make();if(calm)draw(0)});
  document.addEventListener('visibilitychange',()=>{if(calm)return;if(document.hidden){cancelAnimationFrame(raf);raf=0}else if(!raf){last=0;raf=requestAnimationFrame(loop)}});
 })()}
 if(!window.__imgQ){window.__imgQ=1;let fly=0;setInterval(()=>{document.querySelectorAll('img[data-src]:not([data-busy])').forEach(img=>{if(fly>=3)return;img.dataset.busy='1';fly++;const n=+(img.dataset.n||0);const done=ok=>{fly--;img.onload=img.onerror=null;if(ok){img.removeAttribute('data-src');return}img.dataset.n=n+1;if(n+1>=6){img.removeAttribute('data-src');img.style.visibility='hidden';return}setTimeout(()=>img.removeAttribute('data-busy'),1500*(n+1))};img.onload=()=>done(true);img.onerror=()=>done(false);img.src=img.dataset.src+(n?'&try='+n:'')})},250)}
 if(!window.__imgRetry){window.__imgRetry=1;document.addEventListener('error',e=>{const t=e.target;if(!t||t.tagName!=='IMG'||t.dataset.retry==null)return;const n=+t.dataset.retry;if(n>=5){t.style.visibility='hidden';return}t.dataset.retry=n+1;const base=t.getAttribute('src').replace(/&try=\d+$/,'');setTimeout(()=>{t.src=base+'&try='+(n+1)},1500+Math.random()*2500*(n+1))},true)}
 const seg=document.querySelector('header span.seg');if(!seg||seg.dataset.grouped)return;seg.dataset.grouped='1';
 if(!$('#vV')&&$('#vR')){const b=document.createElement('button');b.id='vV';b.textContent='Deliveries';b.addEventListener('click',()=>setV('V'));$('#vR').after(b)}
 
 if(!$('#vF')&&$('#vX')){const b=document.createElement('button');b.id='vF';b.textContent='Lot resources';b.addEventListener('click',()=>setV('F'));$('#vX').after(b)}
 if(!$('#don')&&$('#csv')){const b=document.createElement('button');b.id='don';b.textContent='SkipCoin';b.title='Donate to support this site';{const st=document.createElement('style');st.id='don-css';st.textContent='#don{color:#ffd24a!important;font-weight:600;transition:box-shadow .2s,color .2s,border-color .2s}#don:hover,#don:focus-visible{color:#ffe680!important;border-color:#ffd24a!important;box-shadow:0 0 6px rgba(255,210,74,.9),0 0 18px rgba(255,190,40,.55)!important;text-shadow:0 0 6px rgba(255,210,74,.7)}';document.head.appendChild(st)}$('#csv').before(b);
  const p=document.createElement('div');p.id='donp';p.style.cssText='display:none;position:fixed;z-index:60;left:50%;top:50%;transform:translate(-50%,-50%);max-height:calc(100vh - 32px);overflow:auto;width:min(440px,calc(100vw - 32px));background:#0f141c;border:1px solid var(--line);border-radius:10px;padding:14px 16px;box-shadow:0 8px 30px rgba(0,0,0,.6)';
  const W=[['Ethereum','0x7e2165833c8BDf1ec6BC7c1ACEa0D4E611F2ef01'],['Starknet','0x0631aCdbF5a79758CbCC84301b387aEbFB5C0ec7476aA48a0CeB98662973C5ce']];
  p.innerHTML='<div style="position:relative;text-align:center;padding:0 34px;margin:0 0 8px"><b style="display:block;font-size:17px;font-weight:800;color:#ffd24a;line-height:1.3;text-shadow:0 0 8px rgba(255,210,74,.35)">Help Skippy on his journey through the Adalian Belt</b><button data-x title="Close" style="position:absolute;right:0;top:0">✕</button></div><div class="a" style="margin:0 0 12px;white-space:normal">This site is free to use. If it helps you, a donation helps keep it running. Thank you!</div><a href="https://paypal.me/SkippyInfluence" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin:0 0 14px;padding:7px 14px;border-radius:6px;background:#0070ba;color:#fff;text-decoration:none;font-weight:600">Donate with PayPal</a>'+W.map(([n,a])=>'<div style="margin:0 0 12px"><div class="a" style="font-size:12px;margin:0 0 3px">'+n+' wallet – only send on the '+n+' network</div><div style="display:flex;gap:8px;align-items:center"><code style="font-size:11px;word-break:break-all;white-space:normal;flex:1">'+a+'</code><button data-c="'+a+'">Copy</button></div></div>').join('');
  document.body.appendChild(p);
  b.addEventListener('click',e=>{e.stopPropagation();p.style.display=p.style.display==='none'?'block':'none'});
  p.addEventListener('click',e=>{e.stopPropagation();const c=e.target.closest('[data-c]');if(c){const t=c.dataset.c,done=()=>{c.textContent='Copied ✓';setTimeout(()=>{c.textContent='Copy'},2000)};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,()=>{const s=getSelection(),g=document.createRange();g.selectNodeContents(c.previousSibling);s.removeAllRanges();s.addRange(g);c.textContent='Press Ctrl+C'});else{const s=getSelection(),g=document.createRange();g.selectNodeContents(c.previousSibling);s.removeAllRanges();s.addRange(g);c.textContent='Press Ctrl+C'}}if(e.target.closest('[data-x]'))p.style.display='none'});
  document.addEventListener('click',()=>{p.style.display='none'});document.addEventListener('keydown',e=>{if(e.key==='Escape')p.style.display='none'})}
 const G=[['Fleet',['S','C']],['Logistics',['P','V']],['Asteroids',['A','X','F']],['Buildings',['B','T','L']],['Trading',['K','Y']],['Planners',['R']]];
 const old=$('#vBB');if(old)old.style.display='none';
 const menus=[],btns=[];
 const closeAll=()=>menus.forEach(d=>d.style.display='none');
 const frag=[];
 {const s0=document.createElement('div');s0.id='seg0';s0.className='seg';s0.appendChild($('#vN'));$('#ast').before(s0)} /* Today's Workload (+ The SkippyChain, added by chain.js) sit before the asteroid box */
 G.forEach(([name,keys])=>{const b=document.createElement('button');b.textContent=name+' ▾';b.dataset.g=name;
  const d=document.createElement('span');d.className='ddm';keys.forEach(k=>{const e=$('#v'+k);if(e)d.appendChild(e)});
  b.addEventListener('click',e=>{e.stopPropagation();const open=d.style.display==='flex';closeAll();const old=$('#ddm');if(old)old.style.display='none';if(open)return;const r=b.getBoundingClientRect();d.style.left=r.left+'px';d.style.top=(r.bottom+4)+'px';d.style.display='flex'});
  d.addEventListener('click',()=>{closeAll();setTimeout(upd,0)});
  menus.push(d);btns.push([b,d,name]);frag.push(b);document.body.appendChild(d)});
 
 frag.forEach(e=>{if(e)seg.appendChild(e)});if(old)seg.appendChild(old);
 document.addEventListener('click',closeAll);window.addEventListener('scroll',closeAll);
 const upd=()=>btns.forEach(([b,d,name])=>{const on=d.querySelector('button.on');b.className=on?'on':'';b.textContent=(on?name+': '+on.textContent:name)+' ▾'});
 seg.addEventListener('click',()=>setTimeout(upd,0));upd();
 {const hd=document.querySelector('header'),q=$('#q'),as=$('#ast'),cl=$('#cls'),h1=hd&&hd.querySelector('h1');
  if(hd&&q&&h1&&!hd.querySelector('.toprow')){const row=document.createElement('div');row.className='toprow';row.style.cssText='display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap';
   const left=document.createElement('div');left.style.cssText='min-width:0';const right=document.createElement('div');right.style.cssText='display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;align-items:center;margin-left:auto';
   h1.before(row);[h1,...hd.querySelectorAll(':scope > .sub')].forEach(e=>left.appendChild(e));[q,cl].forEach(e=>{if(e)right.appendChild(e)});if(as&&seg&&seg.parentElement){as.title='Pick an asteroid to show just that one';seg.parentElement.insertBefore(as,seg)}row.append(left,right)}}
 {const gq=$('#q');if(gq&&!$('#gq')){gq.id='gq';gq.placeholder='Search everything…';const hid=document.createElement('input');hid.type='hidden';hid.id='q';hid.value='';document.body.appendChild(hid);
  let prev='N';const go=()=>{if(gq.value.trim()){if(view!=='Z')prev=view;setV('Z')}else if(view==='Z')setV(prev)};
  gq.addEventListener('input',go);
  document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button[id^="v"]');if(b&&gq.value)gq.value=''},true)}}
 {const h1=document.querySelector('header h1');if(h1&&!h1.dataset.home){h1.dataset.home='1';h1.style.cursor='pointer';h1.title='Back to Today\'s Workload';h1.setAttribute('role','link');h1.tabIndex=0;const home=()=>{const g=$('#gq');if(g)g.value='';const d=$('#ddm');setV('N');scrollTo({top:0,behavior:'smooth'})};h1.addEventListener('click',home);h1.addEventListener('keydown',e=>{if(e.key==='Enter')home()})}}
 if(!window.__bars&&!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)){window.__bars=1;const main=$('#main');
  const run=()=>{const els=[...main.querySelectorAll('[style*="background:#232b38"] > [style*="width:"]')].filter(e=>!e.dataset.anim);if(!els.length)return;
   els.forEach((e,i)=>{e.dataset.anim='1';const w=e.style.width;e.style.transition='none';e.style.width='0';e.dataset.w=w});
   requestAnimationFrame(()=>requestAnimationFrame(()=>els.forEach((e,i)=>{e.style.transition='width .9s cubic-bezier(.2,.8,.2,1) '+Math.min(i*25,500)+'ms';e.style.width=e.dataset.w})))};
  new MutationObserver(run).observe(main,{childList:true});run()}
 if(!window.__glow){window.__glow=1;const s=document.createElement('style');s.id='glow-css';s.textContent='.seg button,.ddm button,.bar>button,#csv{transition:box-shadow .2s,color .2s,background-color .2s}.seg button:hover,.ddm button:hover,.bar>button:hover,#csv:hover{box-shadow:0 0 12px rgba(95,195,228,.55),inset 0 0 8px rgba(95,195,228,.18);color:#e6f6fc;position:relative;z-index:2}.card,.as-grid>*,#main a[href^=\'#al-\']{transition:border-color .2s,box-shadow .2s,transform .2s}.card:hover,.as-grid>*:hover,#main a[href^=\'#al-\']:hover{border-color:#5fc3e4!important;box-shadow:0 0 16px rgba(95,195,228,.32);transform:translateY(-1px)}#main tbody tr:hover>td{background:rgba(95,195,228,.06)}@media (prefers-reduced-motion: reduce){.card,.as-grid>*,#main a[href^=\'#al-\']{transition:none}.card:hover,.as-grid>*:hover,#main a[href^=\'#al-\']:hover{transform:none}}';document.head.appendChild(s)}
}
let TRD=null,trdOpen=null,trdRun=0;
function drawTrade(m){
 if(!BELT||BELT.err){m.innerHTML='<div class="note">Loading every market listing in the belt…</div>';
  if(!beltLoad)beltLoad=fetch('market.php',{cache:'no-store'}).then(r=>r.json()).then(j=>{if(j.error)throw new Error(j.error);BELT=j}).catch(e=>{BELT={err:(e&&e.message)||'error'}}).finally(()=>{beltLoad=null;if(view==='Y')draw()});
  return}
 const q=$('#q').value.trim().toLowerCase(),cl=$('#cls').value,mk=BELT.markets||{};
 const fee=id=>{const x=mk[id]&&mk[id].ex;return x?(x.takerFee||0)/10000:0};
 const aN=(mid,aid)=>(mk[mid]&&mk[mid].ast)||('Asteroid #'+aid),mN=id=>(mk[id]&&mk[id].name)||('Marketplace #'+id);
 const ord=(BELT.orders||[]).filter(o=>o[2]>0&&o[3]>0),sell=ord.filter(o=>o[1]===2),buy=ord.filter(o=>o[1]===1);
 const by={};
 buy.forEach(b=>sell.forEach(s=>{if(s[0]!==b[0]||s[4]===b[4])return;const cost=s[3]*(1+fee(s[4])),get=b[3]*(1-fee(b[4]));if(get<=cost)return;
  const amt=Math.min(s[2],b[2]),p=String(b[0]);(by[p]=by[p]||[]).push({p,amt,profit:(get-cost)*amt/1e6,s,b,fa:s[5],ta:b[5],from:aN(s[4],s[5]),to:aN(b[4],b[5])})}));
 let list=Object.keys(by).map(p=>{const d=by[p].sort((x,y)=>y.profit-x.profit);return{p,best:d[0],deals:d}})
  .filter(x=>(!cl||pc(x.p)===cl)&&(!q||pn(x.p).toLowerCase().includes(q)||x.deals.some(d=>d.from.toLowerCase().includes(q)||d.to.toLowerCase().includes(q))))
  .sort((x,y)=>y.best.profit-x.best.profit);
 const pkg=(p,raw)=>raw/1e6*1000/((PR[p]&&PR[p][2])||1000),num=v=>(+v.toFixed(v<1?4:v<100?2:0)).toLocaleString();
 const price=(p,raw)=>isAt(p)?num(raw/1e6)+' <span class="a">each</span>':num(pkg(p,raw))+' <span class="a">/kg</span>';
 const sw=v=>v>=1e6?(v/1e6).toFixed(2)+'M':v>=1e3?(v/1e3).toFixed(1)+'k':Math.round(v).toLocaleString();
 const tonnes=(p,amt)=>amt*((PR[p]&&PR[p][2])||1000)/1e6;
 let h='<div class="note" style="padding:0 0 10px">Products you can buy on one market and sell straight into a "wanted" offer on another, for more than you paid (after both market fees). '+list.length+' products · market data updated '+esc(new Date(BELT.fetched*1000).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}))+'</div>';
 if(!list.length){m.innerHTML=h+'<div class="note">No profitable trades right now.</div>';return}
 h+='<div class="wrap"><table id="trdT"><thead><tr><th>Product</th><th>Buy at</th><th class="num">Price</th><th>Sell at</th><th class="num">Price</th><th class="num">Amount</th><th class="num">Profit</th><th class="num">Flight</th></tr></thead><tbody>';
 const row=(d,top)=>'<td>'+esc(d.from)+'<br><span class="a">'+esc(mN(d.s[4]))+'</span></td><td class="num">'+price(d.p,d.s[3])+'</td><td>'+esc(d.to)+'<br><span class="a">'+esc(mN(d.b[4]))+'</span></td><td class="num">'+price(d.p,d.b[3])+'</td><td class="num">'+fq(d.p,d.amt)+(isAt(d.p)?'':'<br><span class="a">'+Math.max(1,Math.ceil(tonnes(d.p,d.amt)/2000))+' LT trip'+(Math.ceil(tonnes(d.p,d.amt)/2000)>1?'s':'')+'</span>')+'</td><td class="num tot">'+sw(d.profit)+' <span class="a">SWAY</span></td><td class="num" data-fa="'+d.fa+'" data-ta="'+d.ta+'" data-kg="'+Math.round(Math.min(tonnes(d.p,d.amt),2000)*1000)+'">'+(d.fa===d.ta?'<span class="a">same asteroid</span>':'<span class="a">…</span>')+'</td>';
 list.forEach(x=>{const o=trdOpen===x.p;
  h+='<tr class="prow'+(o?' open':'')+'" data-p="'+x.p+'"><td>'+ricon(x.p,24)+esc(pn(x.p))+(x.deals.length>1?' <span class="a">('+x.deals.length+' deals)</span>':'')+'</td>'+row(x.best)+'</tr>';
  if(o)h+='<tr class="det"><td colspan="8"><table style="width:auto"><thead><tr><th>Buy at</th><th class="num">Price</th><th>Sell at</th><th class="num">Price</th><th class="num">Amount</th><th class="num">Profit</th><th class="num">Flight</th></tr></thead><tbody>'+x.deals.slice(1,21).map(d=>'<tr>'+row(d)+'</tr>').join('')+'</tbody></table></td></tr>'});
 m.innerHTML=h+'</tbody></table></div><div class="note" style="padding:10px 0 0">Profit = (their wanted price − the listing price) × amount, after both buyer fees. Flight = quickest trip for a standard Light Transport with a full tank, carrying the load (up to 2,000 t), leaving now – no crew bonus. Click a product for more deals.</div>';
 m.querySelectorAll('tr.prow').forEach(tr=>tr.addEventListener('click',()=>{trdOpen=trdOpen===tr.dataset.p?null:tr.dataset.p;draw()}));
 // flight times
 const cells=[...m.querySelectorAll('td[data-fa]')].filter(td=>td.dataset.fa!==td.dataset.ta);if(!cells.length)return;
 const ids=[...new Set(cells.flatMap(td=>[td.dataset.fa,td.dataset.ta]))];const run=++trdRun;
 Promise.all([fetch('orbits.php?ids='+ids.join(',')).then(r=>r.json()),import('./vendor/travel.js?v='+VER)]).then(async([j,T])=>{
  const O=j.orbits||{},S=T.SHIPS[2],pk=S[2]/1000,now=(Date.now()/1000-1609459200)/3600,memo=TRD=TRD||{};
  for(const td of cells){if(run!==trdRun||!td.isConnected)return;const a=O[td.dataset.fa],b=O[td.dataset.ta];if(!a||!b){td.innerHTML='<span class="a">?</span>';continue}
   const kg=+td.dataset.kg,k=td.dataset.fa+'>'+td.dataset.ta+'>'+Math.round(kg/1e5)+'>'+Math.floor(now);
   if(!(k in memo)){const f=await T.fastest(a.o,b.o,now,T.maxDeltaV(2,1,1,kg,pk));memo[k]=f?f.tof:0;await new Promise(r=>setTimeout(r,0))}
   const h_=memo[k];td.innerHTML=h_?'<b>'+h_+' h</b>'+(h_>=48?'<br><span class="a">'+(h_/24).toFixed(1)+' d</span>':''):'<span class="a">out of range</span>'}
 }).catch(e=>{cells.forEach(td=>{td.innerHTML='<span class="a">?</span>'})});
}
function drawSearch(m){
 const gq=$('#gq'),q=(gq?gq.value:'').trim().toLowerCase(),an='';
 if(!q){m.innerHTML='<div class="note">Type in the search box to search everything.</div>';return}
 const has=s=>String(s||'').toLowerCase().includes(q),okA=a=>!an||a===an,cap=200;
 const prod=[];asts.forEach(a=>{if(!okA(a.name))return;const per={};a.buildings.forEach(b=>Object.keys(b.items).forEach(p=>{if(!has(pn(p)))return;const x=per[p]=per[p]||{amt:0,bs:[]};x.amt+=b.items[p];x.bs.push(b.name)}));Object.keys(per).forEach(p=>prod.push({p,a:a.name,amt:per[p].amt,bs:per[p].bs}))});
 prod.sort((x,y)=>pn(x.p).localeCompare(pn(y.p))||x.a.localeCompare(y.a));
 const astOf=b=>(b.meta&&b.meta.asteroid&&b.meta.asteroid.name)||'';
 const bl=[];(D.allB||[]).forEach(b=>{const B=b.Building||{};if((B.status||0)<1)return;const t=BT[B.buildingType]||'Building',n=(b.Name&&b.Name.name)||(t+' #'+b.id),a=astOf(b);if(!okA(a)||!(has(n)||has(t)))return;
  bl.push({n,t,a,c:(D.crewN||{})[b.Control&&b.Control.controller&&b.Control.controller.id]||'',s:B.status===3?'Built':B.status===2?'Being built':'Planned site'})});
 bl.sort((x,y)=>x.a.localeCompare(y.a)||x.n.localeCompare(y.n));
 const cl=(D.crewList||[]).filter(c=>okA(c.ast||'')&&has(c.name)).sort((x,y)=>String(x.name).localeCompare(String(y.name)));
 const sl=(D.ships||[]).filter(s=>okA(s.ast||'')&&(has(s.name)||has(s.type)||String(s.id)===q)).sort((x,y)=>x.name.localeCompare(y.name));
 const tot=prod.length+bl.length+cl.length+sl.length;
 let h='<div class="note" style="padding:0 0 10px">Search results for <b>“'+esc(q)+'”</b> on '+(an?'<b>'+esc(an)+'</b>':'all asteroids')+' · '+tot+' found. Clear the search box or pick a menu button to go back.</div>';
 if(!tot){m.innerHTML=h+'<div class="note">Nothing matches.</div>';return}
 const sec=(t,n,head,rows)=>n?'<h2>'+t+' <span class="a" style="font-size:14px;font-weight:400">('+n+')</span></h2><div class="wrap"><table><thead><tr>'+head.map(x=>'<th'+(x[1]?' class="num"':'')+'>'+x[0]+'</th>').join('')+'</tr></thead><tbody>'+rows.slice(0,cap).join('')+'</tbody></table></div>'+(n>cap?'<div class="note">…and '+(n-cap)+' more – narrow the search.</div>':''):'';
 h+=sec('Products in stock',prod.length,[['Product'],['Asteroid'],['Amount',1],['In buildings']],prod.map(x=>'<tr><td>'+ricon(x.p,22)+esc(pn(x.p))+'</td><td class="cls">'+esc(x.a)+'</td><td class="num tot">'+fq(x.p,x.amt)+'</td><td class="cls" style="white-space:normal">'+esc(x.bs.join(', '))+'</td></tr>'));
 h+=sec('Buildings',bl.length,[['Building'],['Type'],['Asteroid'],['Crew'],['State']],bl.map(x=>'<tr><td>'+bthumb(x.t,48,36)+esc(x.n)+'</td><td class="cls">'+esc(x.t)+'</td><td class="cls">'+esc(x.a)+'</td><td class="cls">'+esc(x.c)+'</td><td class="cls">'+esc(x.s)+'</td></tr>'));
 h+=sec('Crews',cl.length,[['Crew'],['Asteroid'],['Where'],['Crewmates',1]],cl.map(c=>'<tr><td>'+esc(c.name)+'</td><td class="cls">'+esc(c.ast||'–')+'</td><td class="cls" style="white-space:normal">'+esc(c.place||'')+'</td><td class="num">'+c.mates+'</td></tr>'));
 h+=sec('Ships',sl.length,[['Ship'],['Type'],['Asteroid'],['Where']],sl.map(s=>'<tr><td>'+esc(s.name)+' <span class="a">#'+esc(s.id)+'</span></td><td class="cls">'+esc(s.type)+'</td><td class="cls">'+esc(s.ast||'–')+'</td><td class="cls" style="white-space:normal">'+esc(s.place||'')+'</td></tr>'));
 m.innerHTML=h}
let BELTO=null,beltOLoad=null;
function beltMap(m){
 const box=document.createElement('div');box.style.cssText='position:relative;margin:0 0 16px;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:radial-gradient(ellipse at 50% 50%,#0d1622 0%,#05070a 70%)';
 box.innerHTML='<canvas style="display:block;width:100%;height:clamp(260px,46vw,440px)"></canvas><div class="a" style="position:absolute;left:12px;top:8px;font-size:12px;pointer-events:none">The Adalia system right now · your asteroids in blue · drag to turn</div><div class="bm-load a" style="position:absolute;left:12px;bottom:8px;font-size:12px">Loading orbits…</div>';
 m.prepend(box);const cv=box.querySelector('canvas'),ctx=cv.getContext('2d');
 const mine=(D.owned||[]).filter(a=>a.Orbit&&a.Orbit.a).map(a=>({id:+a.id,name:(a.Name&&a.Name.name)||('Asteroid #'+a.id),o:a.Orbit}));
 const ids=[];for(let i=1;ids.length<600;i++){const id=1+((i*104729)%249999);if(!ids.includes(id))ids.push(id)}
 if(!BELTO&&!beltOLoad)beltOLoad=Promise.all([0,200,400].map(s=>fetch('orbits.php?ids='+ids.slice(s,s+200).join(',')).then(r=>r.json()).then(j=>j.orbits||{}).catch(()=>({})))).then(a=>{BELTO=Object.assign({},...a);return BELTO});
 Promise.all([import('./vendor/travel.js?v='+VER),BELTO?Promise.resolve(BELTO):beltOLoad]).then(([T,BO])=>{
  if(!box.isConnected)return;
  const t=(Date.now()/1000-1609459200)/3600,AU=1.495978707e11,P=o=>{const p=T.pos(o,t);return[p[0]/AU,p[1]/AU,p[2]/AU]};
  const belt=Object.values(BO).map(x=>{try{return P(x.o)}catch(e){return null}}).filter(Boolean);
  const me=mine.map(a=>{let p=null,ring=[];try{p=P(a.o);const am=(a.o.a||0)*1000,per=2*Math.PI*Math.sqrt(am*am*am/1.1369e20)/86400;for(let k=0;k<=96;k++){const q=T.pos(a.o,t+per*k/96);ring.push([q[0]/AU,q[1]/AU,q[2]/AU])}}catch(e){}return{...a,p,ring}}).filter(a=>a.p);
  box.querySelector('.bm-load').remove();
  let R=0;belt.concat(me.map(a=>a.p)).forEach(p=>{R=Math.max(R,Math.hypot(p[0],p[1]))});R=R||4;
  const calm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  let az=0.6,tilt=1.05,drag=null,W=0,H=0;const dpr=Math.min(devicePixelRatio||1,2);
  const size=()=>{W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)};size();
  const proj=p=>{const s=Math.min(W,H*1.6)*0.46/R,ca=Math.cos(az),sa=Math.sin(az),x=p[0]*ca-p[1]*sa,y=p[0]*sa+p[1]*ca,ct=Math.cos(tilt),st=Math.sin(tilt);return[W/2+x*s,H/2+(y*ct-p[2]*st)*s,y*st]};
  const frame=()=>{ctx.clearRect(0,0,W,H);
   const g=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.min(W,H)*0.12);g.addColorStop(0,'rgba(255,250,235,1)');g.addColorStop(0.15,'rgba(255,235,200,0.85)');g.addColorStop(1,'rgba(255,220,170,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(W/2,H/2,Math.min(W,H)*0.12,0,6.283);ctx.fill();
   ctx.fillStyle='rgba(225,232,245,0.55)';belt.forEach(p=>{const q=proj(p);ctx.fillRect(q[0],q[1],1.2,1.2)});
   me.forEach(a=>{ctx.strokeStyle='rgba(95,195,228,0.35)';ctx.lineWidth=1;ctx.beginPath();a.ring.forEach((p,i)=>{const q=proj(p);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])});ctx.stroke()});
   me.forEach(a=>{const q=proj(a.p);ctx.fillStyle='#5fc3e4';ctx.save();ctx.translate(q[0],q[1]);ctx.rotate(Math.PI/4);ctx.fillRect(-4,-4,8,8);ctx.restore();ctx.fillStyle='#e6ebf2';ctx.font='12px system-ui,sans-serif';ctx.fillText(a.name,q[0]+8,q[1]-6)})};
  let raf=0;const loop=()=>{if(!box.isConnected){cancelAnimationFrame(raf);return}raf=requestAnimationFrame(loop);if(!drag&&!calm)az+=0.0012;frame()};
  if(calm)frame();else loop();
  new ResizeObserver(()=>{size();frame()}).observe(cv);
  cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,az,tilt};cv.setPointerCapture(e.pointerId)});
  cv.addEventListener('pointermove',e=>{if(!drag)return;az=drag.az+(e.clientX-drag.x)*0.008;tilt=Math.max(0.15,Math.min(1.45,drag.tilt+(e.clientY-drag.y)*0.006));if(calm)frame()});
  cv.addEventListener('pointerup',()=>{drag=null});cv.style.touchAction='none';cv.style.cursor='grab';
 }).catch(e=>{const l=box.querySelector('.bm-load');if(l)l.textContent='Could not draw the map ('+((e&&e.message)||e)+').'});
}
function animTiles(m){
 if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 if(!document.getElementById('al-anim-css')){const s=document.createElement('style');s.id='al-anim-css';s.textContent='@keyframes alPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,122,122,0)}50%{box-shadow:0 0 16px 2px rgba(255,122,122,.35)}}.al-hot{animation:alPulse 2.4s ease-in-out infinite;border-color:rgba(255,122,122,.55)!important}';document.head.appendChild(s)}
 const tiles=[...m.querySelectorAll('a[href^="#al-"]')],t0=performance.now(),dur=900;
 const nums=tiles.map(a=>{const d=a.firstElementChild,n=+d.textContent||0;if(getComputedStyle(d).color==='rgb(255, 122, 122)')a.classList.add('al-hot');d.textContent='0';return[d,n]});
 const step=t=>{const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);nums.forEach(([d,n])=>{if(d.isConnected)d.textContent=String(Math.round(n*e))});if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step);
}
let DLV=null,dlvLoad=null;
function drawDeliveries(m){
 if(!DLV||DLV.err0){if(DLV&&DLV.err0){m.innerHTML='<div class="note">Could not load deliveries ('+esc(DLV.err0)+'). Click Deliveries to try again.</div>';DLV=null;return}
  m.innerHTML='<div class="note">Loading your deliveries…</div>';
  if(!dlvLoad)dlvLoad=fetch('deliveries.php?wallet='+encodeURIComponent(D.wallet||''),{cache:'no-store'}).then(r=>r.json()).then(j=>{if(j.error)throw new Error(j.error);DLV=j}).catch(e=>{DLV={err0:(e&&e.message)||'error'}}).finally(()=>{dlvLoad=null;if(view==='V'||view==='N')draw()});
  return}
 const ai=$('#ast').value,an=ai===''?null:asts[+ai].name,now=Date.now()/1000;
 const bById={};(D.allB||[]).forEach(b=>{bById[b.id]=b});const sById={};(D.ships||[]).forEach(s=>{sById[s.id]=s});
 const astN={};(D.owned||[]).forEach(a=>{astN[a.id]=(a.Name&&a.Name.name)||('Asteroid #'+a.id)});(D.allB||[]).forEach(b=>{const l=((b.Location&&b.Location.locations)||[]).find(x=>x.label===3);if(l&&b.meta&&b.meta.asteroid&&b.meta.asteroid.name)astN[l.id]=b.meta.asteroid.name});
 const aName=id=>id?(astN[id]||('Asteroid #'+id)):'';
 const ent=([label,id,ast,mine])=>{let n,t;if(label===5){const b=bById[id];t=b?(BT[b.Building&&b.Building.buildingType]||'Building'):'Building';n=b?((b.Name&&b.Name.name)||(t+' #'+id)):(t+' #'+id)}else if(label===6){const s=sById[id];t='Ship';n=s?s.name:('Ship #'+id)}else{t='?';n='#'+id}
  return '<b'+(mine?'':' style="font-weight:400"')+'>'+esc(n)+'</b>'+(mine?'':' <span class="a">(other player)</span>')+'<br><span class="a">'+esc(t)+(ast?' · '+esc(aName(ast)):'')+'</span>'};
 const what=c=>c.length?c.map(([p,a])=>ricon(p,20)+esc(pn(String(p)))+' <span class="a">'+fq(String(p),a)+'</span>').join('<br>'):'<span class="a">–</span>';
 const okA=r=>!an||aName(r[3][2])===an||aName(r[4][2])===an;
 const when=t=>new Date(t*1000).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
 const P=(DLV.pending||[]).filter(r=>r[4][3]&&okA(r)),Out=(DLV.pending||[]).filter(r=>!r[4][3]&&r[3][3]&&okA(r));
 const Tr=(DLV.transit||[]).filter(okA).sort((x,y)=>x[2]-y[2]);
 const fl=(D.ships||[]).filter(s=>s.fl&&(!an||s.ast===an||String(s.place||'').includes(an)));
 const Rc=(DLV.recent||[]).filter(okA);
 const sec=(t,d,n,head,rows,empty)=>'<h2>'+t+' <span class="a" style="font-size:14px;font-weight:400">('+n+')</span></h2><div class="note" style="padding:0 0 8px">'+d+'</div>'+(n?'<div class="wrap"><table><thead><tr>'+head.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>':'<div class="note">'+empty+'</div>');
 let h='<div class="note" style="padding:0 0 10px">Updated '+esc(new Date(DLV.fetched*1000).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}))+' (refreshes every 2 minutes)'+(an?' · showing <b>'+esc(an)+'</b> only':'')+(DLV.err?' · <span style="color:#ff7a7a">'+esc(DLV.err)+'</span>':'')+'</div>';
 h+=sec('Waiting to accept','Deliveries other players have sent to you. Accept them in the game.',P.length,['What','From','To','Sent'],P.map(r=>'<tr><td>'+what(r[5])+'</td><td>'+ent(r[3])+'</td><td>'+ent(r[4])+'</td><td class="cls">'+(r[2]?esc(when(r[2])):'–')+(r[6]?'<br><span class="a">for sale</span>':'')+'</td></tr>'),'Nothing waiting for you.');
 if(Out.length)h+=sec('Sent, waiting for the other player','Deliveries you sent that the other player has not accepted yet.',Out.length,['What','From','To','Sent'],Out.map(r=>'<tr><td>'+what(r[5])+'</td><td>'+ent(r[3])+'</td><td>'+ent(r[4])+'</td><td class="cls">'+(r[2]?esc(when(r[2])):'–')+'</td></tr>'),'');
 h+=sec('On the way now','Deliveries moving to or from your buildings and ships right now, soonest first.',Tr.length,['What','From','To','Arrives','Time left'],Tr.map(r=>'<tr><td>'+what(r[5])+'</td><td>'+ent(r[3])+'</td><td>'+ent(r[4])+'</td><td class="cls">'+esc(when(r[2]))+'</td><td><b data-fin="'+r[2]+'">'+tLeft(r[2],now)+'</b></td></tr>'),'Nothing on the way right now.');
 h+=sec('Your ships in flight','Ships travelling between asteroids.',fl.length,['Ship','Type','Route','Cargo'],fl.map(s=>'<tr><td><span style="display:inline-block;width:56px;height:42px;vertical-align:middle;margin-right:8px;border-radius:4px;background:#000 url(shipimg.php?t='+s.st+'&v='+s.sv+'&s=1) no-repeat 50% 42%/170% auto"></span>'+esc(s.name)+'</td><td class="cls">'+esc(s.type)+'</td><td class="cls" style="white-space:normal">'+esc(s.place)+'</td><td class="cls" style="white-space:normal">'+(s.useM>0?fmtT(s.useM/1e6)+(s.carry?' · '+esc(s.carry):''):'Empty')+'</td></tr>'),'None of your ships are flying right now.');
 if((DLV.recent||[]).length){const nmE=([label,id])=>{if(label===5){const b=bById[id];return b?((b.Name&&b.Name.name)||((BT[b.Building&&b.Building.buildingType]||'Building')+' #'+id)):('Building #'+id)}if(label===6){const s=sById[id];return s?s.name:('Ship #'+id)}return '#'+id};
  const P={},RT={};Rc.forEach(r=>{const dir=r[4][3]&&r[3][3]?'mv':r[4][3]?'in':'out';(r[5]||[]).forEach(([p,a])=>{const x=P[p]=P[p]||{in:0,out:0,mv:0,n:0};x[dir]+=a;x.n++});const k=(r[3][3]?nmE(r[3]):'Other player')+' → '+(r[4][3]?nmE(r[4]):'Other player');const t=RT[k]=RT[k]||{n:0,p:{}};t.n++;(r[5]||[]).forEach(([p,a])=>{t.p[p]=(t.p[p]||0)+a})});
  const tot=x=>x.in+x.out+x.mv,cell=(p,v)=>v?fq(String(p),v):'<span class="a">–</span>';
  const PL=Object.keys(P).sort((a,b)=>tot(P[b])-tot(P[a])),RL=Object.keys(RT).sort((a,b)=>RT[b].n-RT[a].n).slice(0,15);
  h+=sec('Totals – last 7 days','What you moved most, by product. In = from other players, Out = to other players, Moved = between your own buildings and ships.',PL.length,['Product','In','Out','Moved','Deliveries'],PL.map(p=>'<tr><td>'+ricon(p,20)+esc(pn(String(p)))+'</td><td class="num">'+cell(p,P[p].in)+'</td><td class="num">'+cell(p,P[p].out)+'</td><td class="num">'+cell(p,P[p].mv)+'</td><td class="num">'+P[p].n+'</td></tr>'),'');
  h+=sec('Busiest routes – last 7 days','Where your deliveries went most often, busiest first (top 15).',RL.length,['From → To','Deliveries','What'],RL.map(k=>'<tr><td style="white-space:normal">'+esc(k)+'</td><td class="num">'+RT[k].n+'</td><td style="white-space:normal">'+Object.keys(RT[k].p).sort((a,b)=>RT[k].p[b]-RT[k].p[a]).slice(0,4).map(p=>ricon(p,16)+esc(pn(String(p)))+' <span class="a">'+fq(String(p),RT[k].p[p])+'</span>').join('<br>')+'</td></tr>'),'')}
 h+=sec('Recent deliveries','Everything that arrived in the last 7 days, newest first.',Rc.length,['','What','From','To','Arrived'],Rc.slice(0,300).map(r=>{const io=r[4][3]&&r[3][3]?'<span class="a">Moved</span>':r[4][3]?'<span style="color:#4cd04c">In</span>':'<span style="color:#fab219">Out</span>';return '<tr><td>'+io+'</td><td>'+what(r[5])+'</td><td>'+ent(r[3])+'</td><td>'+ent(r[4])+'</td><td class="cls">'+esc(when(r[2]))+'</td></tr>'}),'No deliveries in the last 7 days.');
 m.innerHTML=h;
}
var CMT={"28":["Navigator","+2% propellant speed"],"29":["Dietitian","10% less food used"],"30":["Refiner","+5% refining speed"],"31":["Surveyor","+10% core sampling speed"],"32":["Hauler","+5% cargo mass"],"41":["Buster","+2% propellant flow"],"42":["Mogul","+16% market fees collected"],"43":["Scholar","faster technology"],"44":["Recycler","10% less loss when deconstructing"],"45":["Mechanic","cheaper ship repair"],"46":["Operator","less ship wear"],"47":["Logistician","+5% surface transport speed"],"48":["Experimenter","faster inventions"],"49":["Builder","+5% construction speed"],"50":["Prospector","+5% core sample quality"]};
var CMC={1:'Pilot',2:'Engineer',3:'Miner',4:'Merchant',5:'Scientist'},TRB=true;
function fillFacesIn(m){if(!m.querySelector('img[data-face]'))return;import('./vendor/faces.js?v=1').then(f=>f.fillFaces(m,D.crewmates||{})).catch(()=>{})}
function crewTraits(c){const cm=D.crewmates||{};return (c.roster||[]).map(id=>{const x=cm[id]||{};const tr=(x.impactful||[]).map(t=>CMT[t]).filter(Boolean);return '<div style="padding:2px 0;display:flex;gap:10px;align-items:flex-start"><img data-face="'+id+'" src="cimg.php?id='+id+'&s=1" alt="" loading="lazy" style="width:54px;height:72px;object-fit:cover;object-position:50% 0;border-radius:6px;border:1px solid #2a3648;background:#000;flex:none"><div><b>'+esc((c.mn&&c.mn[id])||('Crewmate #'+id))+'</b> <span style="color:var(--accent)">'+esc(CMC[x.class]||'')+'</span>'+(tr.length?'<br><span class="a">'+tr.map(t=>esc(t[0])+' – '+esc(t[1])).join('<br>')+'</span>':'')+'</div></div>'}).join('')||'0'}
var CBA={"1":{"c":3,"d":{"13":0.01},"t":{"31":0.1}},"2":{"c":3,"d":null,"t":{"50":0.05}},"3":{"c":0,"d":{"6":0.0125,"13":0.005},"t":{"47":0.05}},"4":{"c":3,"d":{"13":0.01},"t":null},"5":{"c":2,"d":{"13":0.01},"t":{"49":0.05}},"6":{"c":0,"d":null,"t":{"32":0.05}},"7":{"c":1,"d":{"1":0.01,"13":0.01},"t":{"28":0.02}},"8":{"c":2,"d":{"9":0.0125,"13":0.0075},"t":{"30":0.05}},"9":{"c":2,"d":{"9":0.0125,"13":0.0075},"t":null},"10":{"c":5,"d":{"10":0.025,"13":0.0075},"t":null},"11":{"c":4,"d":null,"t":null},"13":{"c":5,"d":null,"t":null},"14":{"c":0,"d":{"11":0.05},"t":{"29":0.1}},"17":{"c":4,"d":{"12":0.05,"13":0.025},"t":null},"18":{"c":1,"d":{"1":0.01},"t":{"41":0.02}},"19":{"c":0,"d":{"6":0.0125},"t":null},"20":{"c":2,"d":{"9":0.0125,"13":0.005},"t":null}};
var CBS=[0.5,1,1.25,1.375,1.4375,1.46875];
function crewMult(aid,ms){const A=CBA[aid];let m=1,cm=0;ms.forEach(x=>{if(!x)return;if(A.c&&x.class===A.c)cm++;const t=x.title;if(A.d&&t>=1&&t<=65){const dep=(t-1)%13+1,tier=Math.floor((t-1)/13)+1+(x.coll===1?0.5:0);if(A.d[dep])m+=A.d[dep]*tier}(x.impactful||[]).forEach(i=>{if(A.t&&A.t[i])m+=A.t[i]})});if(A.c)m*=CBS[Math.min(cm,5)];return m}
var CBJ=[[1,'Core sampling speed'],[2,'Core sample quality'],[4,'Extraction (mining) speed'],[5,'Construction speed'],[8,'Refining speed'],[9,'Manufacturing speed'],[10,'Bioreactor speed'],[20,'Ship building speed'],[3,'Surface transport speed'],[7,'Ship engine power'],[18,'Propellant flow'],[17,'Lower market fees'],[11,'Free transport distance'],[13,'Extra refining yield'],[14,'Food lasts longer'],[6,'Cargo mass'],[19,'Cargo volume']];
var CBNF={2:1,6:1,7:1,13:1,14:1,15:1,16:1,18:1,19:1};
function habEff(c){const s=c&&c.stn&&(D.stations||{})[c.stn];if(!s||s[0]!==3)return 1;const p=s[1];return p>500?1.2-0.2*(Math.min(p,1000)-500)/500:1.2}

var LOTS={},lotsLoad={},ABM=null,ABC={},lfAst=null,lfRes=null;
var BONB=true;
function resBonus(bon,r){let m=1;const nn=[];(bon||[]).forEach(b=>{const gg=BONG.find(x=>x[0]===b.n);if(gg&&gg[1].map(Number).includes(+r)){m*=(100+b.mod)/100;nn.push(b.n+' +'+b.mod+'%')}});return {m,nn}}
function bestAstHTML(){const own=(D.owned||[]).filter(a=>a.Celestial&&(a.Celestial.scanStatus||0)>=4&&a.Celestial.abundances);if(!own.length)return '';
 const rows={};own.forEach(a=>{const c=a.Celestial,ab=astAbund(c.abundances),bon=astBonuses(c.bonuses||0,c.celestialType),nm=(a.Name&&a.Name.name)||('Asteroid #'+a.id);Object.keys(ab).forEach(r=>{const v=ab[r];if(!(v>0))return;(rows[r]=rows[r]||[]).push({nm,v,m:resBonus(bon,r).m})})});
 const R=Object.keys(rows).sort((x,y)=>pn(x).localeCompare(pn(y))),fb=m=>m>1.0001?'<span style="color:#4cd04c;font-weight:600">+'+Math.round((m-1)*100)+'% faster</span>':'<span class="a">none</span>';
 return '<h2 style="margin-top:18px">Best asteroid for each resource</h2><div class="note" style="padding:0 0 8px">For each resource, your scanned asteroids ranked by how much of it they hold (abundance) and how fast it extracts there (asteroid bonus). Best = abundance × bonus.</div><div class="wrap"><table><thead><tr><th>Resource</th><th>Best asteroid</th><th class="num">Abundance</th><th>Extraction bonus</th><th>Also on</th></tr></thead><tbody>'+
  R.map(r=>{const L=rows[r].sort((a,b)=>b.v*b.m-a.v*a.m),b=L[0];return '<tr><td>'+ricon(r,20)+esc(pn(r))+'</td><td><b>'+esc(b.nm)+'</b></td><td class="num">'+(b.v*100).toFixed(1)+'%</td><td>'+fb(b.m)+'</td><td class="cls" style="white-space:normal">'+(L.slice(1).map(x=>esc(x.nm)+' '+(x.v*100).toFixed(1)+'%'+(x.m>1.0001?' (+'+Math.round((x.m-1)*100)+'%)':'')).join(', ')||'–')+'</td></tr>'}).join('')+'</tbody></table></div>'}
var lfMode='all';
function drawLotRes(m){
 const own=(D.owned||[]).filter(a=>a.Celestial&&a.Celestial.abundances&&a.Celestial.scanStatus>=4);
 const nm=a=>(a.Name&&a.Name.name)||('Asteroid #'+a.id);
 if(!own.length){m.innerHTML='<div class="note">This needs an asteroid you own or control that has had its resource scan.</div>';return}
 const ai=$('#ast').value,an=ai===''?null:asts[+ai].name;
 if(an){const f=own.find(a=>nm(a)===an);if(f)lfAst=f.id}
 if(!own.some(a=>a.id===lfAst))lfAst=own[0].id;
 const A=own.find(a=>a.id===lfAst);
 if(!ABM){m.innerHTML='<div class="note">Loading the game\'s resource maths…</div>';import('./vendor/abund.js?v='+VER).then(x=>{ABM=x;if(view==='F')draw()}).catch(e=>{m.innerHTML='<div class="note">Could not load the resource maths ('+esc((e&&e.message)||e)+').</div>'});return}
 const ab=ABM.abundances(A.Celestial.abundances),rs=Object.keys(ab).filter(k=>ab[k]>0).sort((x,y)=>ab[y]-ab[x]).map(Number);
 if(!rs.includes(lfRes))lfRes=rs[0];
 let h='<div class="note" style="padding:0 0 10px">How rich each free lot is in one resource, worked out with the game\'s own maths. Pick an asteroid and a resource.</div>'+
  '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px"><select id="lfA">'+own.map(a=>'<option value="'+a.id+'"'+(a.id===lfAst?' selected':'')+'>'+esc(nm(a))+'</option>').join('')+'</select><select id="lfR">'+rs.map(r=>'<option value="'+r+'"'+(r===lfRes?' selected':'')+'>'+esc(pn(String(r)))+' ('+Math.round(ab[r]*1000)/10+'% of asteroid)</option>').join('')+'</select></div>';
 const wire=()=>{const a=m.querySelector('#lfA'),r=m.querySelector('#lfR');if(a)a.addEventListener('change',()=>{lfAst=+a.value;if($('#ast').value!==''){$('#ast').value=''}draw()});if(r)r.addEventListener('change',()=>{lfRes=+r.value;draw()})};
 const L=LOTS[lfAst];
 if(!L||L.err){if(L&&L.err){m.innerHTML=h+'<div class="note">Could not load the lots ('+esc(L.err)+'). Pick the asteroid again to retry.</div>';delete LOTS[lfAst];wire();return}
  m.innerHTML=h+'<div class="note">Checking which lots are in use…</div>';wire();const id=lfAst;
  if(!lotsLoad[id])lotsLoad[id]=fetch('lots.php?wallet='+encodeURIComponent(D.wallet||'')+'&a='+id,{cache:'no-store'}).then(r=>r.json()).then(j=>{if(j.error)throw new Error(j.error);LOTS[id]=j}).catch(e=>{LOTS[id]={err:(e&&e.message)||'error'}}).finally(()=>{delete lotsLoad[id];if(view==='F')draw()});
  return}
 const n=ABM.lotCount(lfAst),k=lfAst+'_'+lfRes;if(!ABC[k])ABC[k]=ABM.lotsFor(lfAst,A.Celestial.abundances,lfRes,n);const v=ABC[k];
 const used=new Set(L.used||[]),all=[];for(let l=1;l<=n;l++)all.push(l);all.sort((x,y)=>v[y]-v[x]);
 const free=all.filter(l=>!used.has(l)),best=all[0];
 const bar=x=>'<span style="display:inline-block;width:80px;height:6px;background:#232b38;vertical-align:middle;margin-right:8px"><span style="display:block;height:100%;width:'+Math.round(x*100)+'%;background:'+(x>=0.6?'#4cd04c':x>=0.35?'#fab219':'#5fc3e4')+'"></span></span>';
 h+='<div class="note" style="padding:0 0 10px">'+esc(nm(A))+': '+free.length+' free of '+n+' lots. Richest lot for '+esc(pn(String(lfRes)))+' is Lot #'+best+' ('+(v[best]*100).toFixed(1)+'%)'+(used.has(best)?' – already in use':' – free')+'.</div>';

 if(BONB){const rb=resBonus(astBonuses(A.Celestial.bonuses||0,A.Celestial.celestialType),lfRes);h+='<div style="margin:0 0 10px;font-weight:600;color:'+(rb.m>1.0001?'#4cd04c':'#8a96a8')+'">'+(rb.m>1.0001?'⚡ '+esc(nm(A))+' bonus for '+esc(pn(String(lfRes)))+': '+esc(rb.nn.join(' and '))+' – extraction is '+Math.round((rb.m-1)*100)+'% faster here':'No asteroid bonus for '+esc(pn(String(lfRes)))+' on '+esc(nm(A)))+'</div>'}
 const BETA=true;const GLB=false,GAME='https://game.influenceth.io',gl=(p,t)=>GLB?' <a href="'+GAME+p+'" target="influencegame" title="'+t+' (reuses your game tab)" style="white-space:nowrap;font-size:12px;color:#8fe3ff">Open in game ↗</a>':'';
 const mine={};(D.allB||[]).forEach(b=>{const ls=(b.Location&&b.Location.locations)||[],as=ls.find(x=>x.label===3),lo=ls.find(x=>x.label===4);if(!as||as.id!==lfAst||!lo)return;const B=b.Building||{};if((B.status||0)<1)return;const li=Math.floor(lo.id/4294967296);(mine[li]=mine[li]||[]).push(b)});
 const bdesc=b=>{const B=b.Building||{},ty=BT[B.buildingType]||'Building',bn=(b.Name&&b.Name.name)||(ty+' #'+b.id);let s='';const pl=B.status===1,px=pl&&B.plannedAt&&B.plannedAt+172800<=Date.now()/1000;if(pl)s='';else if(B.status===2)s='being built';else if(B.buildingType===2){const e=(b.Extractors||[]).find(x=>x.status===1);s=e?'extracting '+pn(String(e.outputProduct)):'idle'}return '<b>'+esc(bn)+'</b> <span class="a">· '+esc(ty)+(s?' · '+esc(s):'')+'</span>'+gl('/building/'+b.id,'Open this building in the game')+(px?' <span title="The 2-day site reservation has run out. The game makes any materials sent here public." style="display:inline-block;margin:2px 0;padding:1px 8px;border-radius:9px;background:rgba(255,90,90,.15);border:1px solid #ff6b6b;color:#ff7a7a;font-size:12px;font-weight:600;white-space:nowrap">Planning expired – site is public</span>':pl?' <span style="display:inline-block;margin:2px 0;padding:1px 8px;border-radius:9px;background:rgba(250,178,25,.15);border:1px solid #fab219;color:#fab219;font-size:12px;font-weight:600;white-space:nowrap">Planning approved – reserved for '+(B.plannedAt?tLeft(B.plannedAt+172800,Date.now()/1000):'2 days')+'</span>':'')};
 const on=l=>mine[l]?mine[l].map(bdesc).join('<br>'):used.has(l)?'<span class="a">Another player\'s building</span>':'<span style="color:#4cd04c">Free</span>';
 const ex=all.filter(l=>mine[l]&&mine[l].some(b=>(b.Building||{}).buildingType===2));
 const MODES=[['all','All lots ('+n+')'],['free','Free lots ('+free.length+')'],['ext','Your extractors ('+ex.length+')']];if(!MODES.some(x=>x[0]===lfMode))lfMode='free';
 if(BETA)h+='<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:4px 0 14px"><span style="font-size:17px;font-weight:800;color:#8fe3ff;text-shadow:0 0 8px rgba(110,198,230,.85),0 0 18px rgba(110,198,230,.45);letter-spacing:.2px">Show your lots:</span>'+MODES.map(([k,t])=>'<button data-lm="'+k+'" aria-pressed="'+(k===lfMode)+'" style="padding:8px 16px;font-size:15px;border-radius:8px;'+(k===lfMode?'background:#6ec6e6;color:#06121c;border:2px solid #9fe0f5;font-weight:700;box-shadow:0 0 12px rgba(110,198,230,.6)':'background:transparent;border:2px solid #3a4658;color:#c8d3e0')+'">'+(k===lfMode?'✓ ':'')+t+'</button>').join('')+'</div>';
 const L2=lfMode==='all'?all:lfMode==='ext'?ex:free,lim=lfMode==='ext'?L2.length:30;
 if(!L2.length)h+='<div class="note">'+(lfMode==='ext'?'You have no extractors on this asteroid.':'There are no free lots on this asteroid.')+'</div>';
 else h+='<div class="wrap"><table><thead><tr><th class="num">#</th><th>Lot</th><th>'+esc(pn(String(lfRes)))+' here</th>'+(BETA?'<th>On this lot</th>':'')+'</tr></thead><tbody>'+L2.slice(0,lim).map((l,i)=>'<tr><td class="num">'+(i+1)+'</td><td>Lot #'+l+gl('/lot/'+(lfAst+l*4294967296),'Open this lot in the game')+'</td><td>'+bar(v[l])+(v[l]*100).toFixed(1)+'%</td>'+(BETA?'<td style="white-space:normal">'+on(l)+'</td>':'')+'</tr>').join('')+'</tbody></table></div>'+(L2.length>lim?'<div class="note" style="padding:8px 0 0">Showing the '+lim+' richest of '+L2.length+'.</div>':'');
 m.innerHTML=h;wire();m.querySelectorAll('[data-lm]').forEach(b=>b.addEventListener('click',()=>{lfMode=b.dataset.lm;draw()}))}
function drawMarket(m){
 if(mkTab==='belt'){drawBelt(m);return}
 const ai=$('#ast').value,an=ai===''?null:asts[+ai].name,q=$('#q').value.trim().toLowerCase();
 const bById={};(D.allB||[]).forEach(b=>{bById[b.id]=b});
 const astN={};(D.owned||[]).forEach(a=>{astN[a.id]=(a.Name&&a.Name.name)||('Asteroid #'+a.id)});(D.allB||[]).forEach(b=>{const l=((b.Location&&b.Location.locations)||[]).find(x=>x.label===3);if(l&&b.meta&&b.meta.asteroid&&b.meta.asteroid.name)astN[l.id]=b.meta.asteroid.name});
 const bName=id=>{const b=bById[id];return b?((b.Name&&b.Name.name)||((BT[b.Building&&b.Building.buildingType]||'Building')+' #'+id)):('#'+id)};
 const per=p=>isAt(p)?'each':'per t',unitP=(p,pr)=>isAt(p)?pr:pr*1e6/((PR[p]&&PR[p][2])||1000);
 const sw=v=>(v>=100?Math.round(v).toLocaleString():(+v.toFixed(v<1?4:2)).toLocaleString())+' SWAY';
 const now=Date.now()/1000;
 const list=(D.orders||[]).map(o=>{const loc=(o.locations||[]).find(x=>x.label===3),pr=(o.price||0)/1e6;
  return{p:String(o.product),type:o.orderType===2?'Selling':'Buying',amt:o.amount||0,init:o.initialAmount||o.amount||0,pr,total:(o.amount||0)*pr,mkt:bName(o.entity&&o.entity.id),from:o.storage?bName(o.storage.id):'',ast:loc?(astN[loc.id]||('Asteroid #'+loc.id)):'',crew:(D.crewN||{})[o.crew&&o.crew.id]||'',live:!o.validTime||o.validTime<=now,vt:o.validTime}})
  .filter(x=>(!an||x.ast===an)&&(!q||[pn(x.p),x.type,x.mkt,x.from,x.ast,x.crew].some(v=>String(v).toLowerCase().includes(q))))
  .sort((a,b)=>a.ast.localeCompare(b.ast)||a.type.localeCompare(b.type)||pn(a.p).localeCompare(pn(b.p)));
 let h=mkTabs();
 if(D.ordErr){m.innerHTML=h+'<div class="note">Could not load your market listings just now. Try Refresh in a minute.</div>';return}
 if(!list.length){m.innerHTML=h+'<div class="note">'+((D.orders||[]).length?'Nothing matches.':'Your crews have no open buy or sell listings.')+'</div>';return}
 const sell=list.filter(x=>x.type==='Selling'),tv=sell.reduce((s,x)=>s+x.total,0);
 h+='<div class="note" style="padding:0 0 10px">'+list.length+' open listing'+(list.length>1?'s':'')+(sell.length?' · selling '+sell.length+' worth '+sw(tv)+' in total':'')+'</div>';
 h+='<div class="wrap"><table><thead><tr><th>Product</th><th>Type</th><th class="num">Amount left</th><th class="num">Price</th><th class="num">Total value</th><th>Marketplace</th><th>Asteroid</th><th>From storage</th><th>Crew</th></tr></thead><tbody>'+
  list.map(x=>'<tr><td>'+ricon(x.p,24)+esc(pn(x.p))+'</td><td class="cls"'+(x.type==='Selling'?' style="color:#4cd04c"':' style="color:#fab219"')+'>'+x.type+(x.live?'':'<br><span class="a">starts '+esc(new Date(x.vt*1000).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}))+'</span>')+'</td>'+
   '<td class="num">'+fq(x.p,x.amt)+(x.init>x.amt?'<br><span class="a">of '+fq(x.p,x.init)+'</span>':'')+'</td><td class="num">'+(isAt(x.p)?sw(x.pr)+' <span class="a">each</span>':(+(x.pr*1000/((PR[x.p]&&PR[x.p][2])||1000)).toFixed(4)).toLocaleString()+' SWAY <span class="a">per kg</span><br><span class="a">'+sw(unitP(x.p,x.pr))+' per t</span>')+'</td><td class="num tot">'+sw(x.total)+'</td>'+
   '<td>'+bthumb('Marketplace',40,30)+esc(x.mkt)+'</td><td class="cls">'+esc(x.ast)+'</td><td class="cls">'+esc(x.from)+'</td><td class="cls">'+esc(x.crew)+'</td></tr>').join('')+'</tbody></table></div>';
 h+='<div class="note" style="padding:10px 0 0">Shows open listings placed by your crews. Prices are in SWAY; bulk goods are shown per kg (as in the game) and per tonne. Market fees are not included.</div>';
 m.innerHTML=h}
function drawAssets(m,which){
 const ai=$('#ast').value,an=ai===''?null:asts[+ai].name,q=$('#q').value.trim().toLowerCase();
 const okA=x=>!an||x.ast===an,okQ=(...t)=>!q||t.some(v=>String(v||'').toLowerCase().includes(q));
 const fc=f=>f==null?'#5b6677':f>=0.5?'#0ca30c':f>=0.25?'#fab219':'#d03b3b',fl=f=>f==null?'–':f>=0.5?'Fed':f>=0.25?'Getting low':'Starving';
 const cl=(D.crewList||[]).filter(c=>okA(c)&&okQ(c.name,c.place,c.ast)).sort((a,b)=>(a.ast||'~').localeCompare(b.ast||'~')||(a.food==null?2:a.food)-(b.food==null?2:b.food));
 const sl=(D.ships||[]).filter(x=>okA(x)&&okQ(x.name,x.place,x.ast,x.type,'#'+x.id,x.id)).sort((a,b)=>(a.ast||'~').localeCompare(b.ast||'~')||a.name.localeCompare(b.name));
 const low=cl.filter(c=>c.food!=null&&c.food<0.25).length;
 let h='<div class="note" style="padding:0 0 10px">'+(which==='C'?cl.length+' crews':sl.length+' ships')+(an?' at or heading to <b>'+esc(an)+'</b>':'')+(which==='C'&&low?' · <b style="color:#ff7a7a">'+low+' crew'+(low>1?'s':'')+' starving</b>':'')+'</div>';
 if(which==='C')h+='<div class="wrap"><table><thead><tr><th>Crew</th>'+(TRB?'<th>Crewmates · class · useful traits</th>':'<th class="num">Crewmates</th>')+'<th>Asteroid</th><th>Where</th><th>Food</th><th>Status</th></tr></thead><tbody>'+
  cl.map(c=>'<tr><td>'+esc(c.name)+'</td><td class="num"'+(TRB?' style="text-align:left;white-space:normal;min-width:220px"':'')+'>'+(TRB?crewTraits(c):c.mates)+'</td><td>'+esc(c.ast||'–')+'</td><td class="cls" style="white-space:normal">'+esc(c.place)+'</td><td><span style="display:inline-block;width:60px;height:6px;background:#232b38;vertical-align:middle;margin-right:6px"><span style="display:block;height:100%;width:'+Math.round((c.food||0)*100)+'%;background:'+fc(c.food)+'"></span></span>'+(c.food==null?'–':Math.round(c.food*100)+'%')+' <span class="cls">'+fl(c.food)+'</span></td><td class="cls">'+(c.busy?'Busy until '+esc(c.busy):'Ready')+'</td></tr>').join('')+'</tbody></table></div>';
 if(which==='S')h+='<div class="wrap"><table><thead><tr><th>Ship</th><th class="num">ID</th><th>Type</th><th>Asteroid</th><th>Where</th><th>Cargo</th><th class="num">Propellant</th></tr></thead><tbody>'+
  sl.map(x=>'<tr><td><a href="shipimg.php?t='+x.st+'&v='+x.sv+'" target="_blank" title="Open picture" style="display:inline-block;width:72px;height:54px;vertical-align:middle;margin-right:10px;border-radius:4px;background:#000 url(shipimg.php?t='+x.st+'&v='+x.sv+'&s=1) no-repeat 50% 42%/170% auto"></a>'+esc(x.name)+'</td><td class="num">'+esc(x.id)+'</td><td class="cls">'+esc(x.type)+(x.sv>1?'<br><span style="color:var(--accent)">'+esc(({2:'Cobalt Pioneer',3:'Titanium Pioneer',4:'Aureate Pioneer'})[x.sv]||('Variant '+x.sv))+'</span>':'')+'</td><td>'+esc(x.ast||'–')+'</td><td class="cls" style="white-space:normal">'+(x.fl?'<b>':'')+esc(x.place)+(x.fl?'</b>':'')+'</td><td class="cls" style="white-space:normal">'+(x.useM>0?fmtT(x.useM/1e6)+(x.carry?' · '+esc(x.carry):''):'Empty')+'</td><td class="num">'+fmtT(x.prop)+'</td></tr>').join('')+'</tbody></table></div>';
 if(which==='C')h+='<div class="note" style="padding:10px 0 0">Food is worked out from when each crew was last fed; crewmate food traits aren\'t included, so treat it as a guide.</div>';
 m.innerHTML=h;if(which==='C')fillFacesIn(m)}

function draw(){
 const m=$('#main');
 
 
 
 if(view==='N'){drawAlerts(m);animTiles(m);return}
 if(view==='Z'){drawSearch(m);return}
 if(view==='X'){drawSamples(m);return}
 if(view==='L'){drawLeases(m);return}
 if(view==='Y'){drawTrade(m);return}
 if(view==='T'){drawStatus(m);return}
 if(view==='A'){drawAsteroids(m);beltMap(m);return}
 if(view==='F'){drawLotRes(m);return}
 
 if(view==='V'){drawDeliveries(m);return}
 if(view==='K'){drawMarket(m);return}
 if(view==='R'){drawTravel(m);return}
 if(view==='C'||view==='S'){drawAssets(m,view);return}
 if(view==='P'){
  const{r,cols}=rows();
  if(!r.length){m.innerHTML='<div class="note">Nothing matches.</div>';return}
  const multi=cols.length>1;
  let h='<div class="wrap"><table><thead><tr><th data-k="name">Product</th><th data-k="cls">Type</th>'+(multi?cols.map((i,j)=>'<th class="num" data-k="'+j+'">'+esc(asts[i].name)+'</th>').join(''):'')+'<th class="num tot" data-k="total">'+(multi?'Total':esc(asts[cols[0]].name))+'</th></tr></thead><tbody>';
  r.forEach(x=>{const isOpen=open.has(x.p);h+='<tr class="prow'+(isOpen?' open':'')+'" data-p="'+x.p+'"><td>'+ricon(x.p,26)+esc(pn(x.p))+'</td><td class="cls">'+esc(pc(x.p))+'</td>'+(multi?x.v.map(v=>'<td class="num'+(v?'':' empty')+'">'+(v?fmt(x.p,v):'–')+'</td>').join(''):'')+'<td class="num tot">'+fmt(x.p,x.total)+'</td></tr>';
   if(isOpen){let d='';cols.forEach(i=>asts[i].buildings.forEach(b=>{if(b.items[x.p])d+='<div class="b"><span>'+esc(b.name)+' <span class="a">· '+esc(asts[i].name)+'</span></span><span>'+fmt(x.p,b.items[x.p])+'</span></div>'}));h+='<tr class="det"><td colspan="'+(3+(multi?cols.length:0))+'">'+d+'</td></tr>'}});
  m.innerHTML=h+'</tbody></table></div>';
  m.querySelectorAll('tr.prow').forEach(tr=>tr.addEventListener('click',()=>{const p=tr.dataset.p;open.has(p)?open.delete(p):open.add(p);draw()}));
  m.querySelectorAll('th').forEach(th=>th.addEventListener('click',()=>{const k=th.dataset.k;const key=isNaN(k)?k:+k;if(sortKey===key)sortDir=-sortDir;else{sortKey=key;sortDir=(key==='name'||key==='cls')?1:-1}draw()}));
 }else{
  const q=$('#q').value.trim().toLowerCase(),ai=$('#ast').value,cl=$('#cls').value;
  let h='';
  asts.forEach((a,i)=>{if(ai!==''&&+ai!==i)return;
   const cards=a.buildings.map(b=>{const ps=Object.keys(b.items).filter(p=>(!cl||pc(p)===cl));const nameHit=!q||b.name.toLowerCase().includes(q);const shown=ps.filter(p=>nameHit||pn(p).toLowerCase().includes(q));if(!shown.length)return '';
    shown.sort((x,y)=>pn(x).localeCompare(pn(y)));
    return '<div class="card"><div style="display:flex;align-items:center;margin-bottom:4px">'+bthumb(b.type,64,48)+'<h3 style="margin:0">'+esc(b.name)+'</h3></div><div class="t">'+esc(b.type)+(b.crew?' · '+esc(b.crew):'')+'</div>'+(b.fill?(()=>{const f=b.fill.f,col=f>=0.9?'#d03b3b':f>=0.75?'#fab219':'#5fc3e4';return '<div style="margin:6px 0 8px"><div style="height:8px;background:#232b38;border-radius:2px;overflow:hidden"><div style="height:100%;width:'+Math.min(100,Math.round(f*100))+'%;background:'+col+'"></div></div><div class="t" style="margin-top:3px">'+Math.round(f*100)+'% full · '+fmtT(b.fill.m/1e6)+' of '+fmtT(b.fill.cap/1e6)+' · '+Math.round(b.fill.vo/1e6).toLocaleString()+' of '+Math.round(b.fill.vc/1e6).toLocaleString()+' m³</div></div>'})():'')+'<table>'+shown.map(p=>'<tr><td>'+ricon(p,22)+esc(pn(p))+'</td><td class="num">'+fmt(p,b.items[p])+'</td></tr>').join('')+'</table></div>'}).join('');
   if(cards)h+='<h2>'+esc(a.name)+'</h2><div class="grid">'+cards+'</div>'});
  m.innerHTML=h||'<div class="note">Nothing matches.</div>';
 }
}
function csv(){
 const{r,cols}=rows();const c=v=>{let t=String(v);if(/^[=+\-@\t\r]/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"'};
 const unit=p=>isAt(p)?'units':'tonnes';const val=(p,a)=>isAt(p)?a:+(kg(p,a)/1000).toFixed(3);
 let s=['Product','Type','Unit',...cols.map(i=>asts[i].name),'Total'].map(c).join(',')+'\n';
 r.forEach(x=>{s+=[pn(x.p),pc(x.p),unit(x.p)].map(c).join(',')+','+x.v.map(v=>val(x.p,v)).join(',')+','+val(x.p,x.total)+'\n'});
 const a=doc.createElement('a');a.href=URL.createObjectURL(new Blob([s],{type:'text/csv'}));const _n=new Date(),_p=x=>String(x).padStart(2,'0');a.download='influence-stock_'+_n.getFullYear()+'-'+_p(_n.getMonth()+1)+'-'+_p(_n.getDate())+'_'+_p(_n.getHours())+'-'+_p(_n.getMinutes())+'.csv';doc.body.appendChild(a);a.click();a.remove();
}
$('#q').addEventListener('input',draw);$('#ast').addEventListener('change',draw);$('#cls').addEventListener('change',draw);
const setV=v=>{view=v;['N','P','B','T','A','K','C','S','R','X','L','Y','V','F'].forEach(k=>{const e=$('#v'+k);if(e)e.className=k===v?'on':''});$('#vBB').className=(v==='B'||v==='T')?'on':'';$('#vBB').textContent=v==='B'?'Buildings: Contents ▾':v==='T'?'Buildings: Status ▾':'Buildings ▾';$('#ddm').style.display='none';draw()};
$('#vP').addEventListener('click',()=>setV('P'));$('#vB').addEventListener('click',()=>setV('B'));$('#vN').addEventListener('click',()=>setV('N'));$('#vC').addEventListener('click',()=>setV('C'));$('#vS').addEventListener('click',()=>setV('S'));$('#vT').addEventListener('click',()=>setV('T'));
$('#vBB').addEventListener('click',e=>{e.stopPropagation();const d=$('#ddm');if(d.style.display==='flex'){d.style.display='none';return}const r=$('#vBB').getBoundingClientRect();d.style.left=r.left+'px';d.style.top=(r.bottom+4)+'px';d.style.display='flex'});
document.addEventListener('click',()=>{const d=$('#ddm');if(d)d.style.display='none'});window.addEventListener('scroll',()=>{const d=$('#ddm');if(d)d.style.display='none'});$('#vA').addEventListener('click',()=>setV('A'));$('#vK').addEventListener('click',()=>setV('K'));if($('#vX'))$('#vX').addEventListener('click',()=>setV('X'));$('#vL').addEventListener('click',()=>setV('L'));if($('#vY'))$('#vY').addEventListener('click',()=>setV('Y'));$('#vR').addEventListener('click',()=>setV('R'));
$('#csv').addEventListener('click',csv);
navGroups();
draw();
}
const ricon=(p,z)=>/^\d+$/.test(String(p))?'<img src="rimg.php?p='+p+'" loading="lazy" width="'+z+'" height="'+z+'" alt="" data-hide style="vertical-align:middle;margin-right:8px;object-fit:contain">':'';
document.addEventListener('error',e=>{const t=e.target;if(t&&t.tagName==='IMG'&&t.hasAttribute('data-hide'))t.style.visibility='hidden'},true);
const bthumb=(n,w,h)=>{const t=Object.keys(BT).find(k=>BT[k]===n);return t?'<span style="display:inline-block;width:'+w+'px;height:'+h+'px;vertical-align:middle;margin-right:10px;border-radius:4px;background:#000 url(bimg.php?t='+t+') no-repeat 50% 50%/cover"></span>':''};
const BT={1:'Warehouse',2:'Extractor',3:'Refinery',4:'Bioreactor',5:'Factory',6:'Shipyard',7:'Spaceport',8:'Marketplace',9:'Habitat',10:'Tank Farm'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const say=m=>{document.body.innerHTML=m;siteHeader()};
const SITE='https://adalia.academy/';
const NAV=[['Home',SITE],['About Influence',SITE+'about_influence/'],['Main Campus',SITE+'main-campus/'],['Student Library',SITE+'libraries/'],['Tutorials',SITE+'tutorialv1/']];
function siteHeader(){
 const d=document;
 if(!d.getElementById('aa-font')){const l=d.createElement('link');l.id='aa-font';l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Jura:wght@300;400;500&display=swap';d.head.appendChild(l)}
 if(!d.getElementById('aa-css')){const st=d.createElement('style');st.id='aa-css';st.textContent=
  'body{padding:0!important}.aa{background:#000;padding:10px 10px 0;font-family:Jura,sans-serif}'+
  '.aa a{text-decoration:none}'+
  '.aa-logo{display:block;border:1px solid #036189;padding:10px 0 8px;text-align:center;color:#0a8fc7;font-weight:300;line-height:.9;letter-spacing:-2px;font-size:clamp(34px,5vw,57px)}'+
  '.aa-logo span{display:block}.aa-logo span+span{padding-left:1.6em}'+
  '.aa-nav{display:flex;flex-wrap:wrap;justify-content:space-around;gap:4px 18px;border:1px solid #036189;margin-top:6px;padding:6px 10px}'+
  '.aa-nav a{color:#fbfbfb;font-size:clamp(15px,1.8vw,22px);padding:2px 4px}.aa-nav a:hover{color:#0a8fc7}'+
  '.aa-nav a.home:before{content:"\\2190  "}';
  d.head.appendChild(st)}
 const old=d.getElementById('aa-head');if(old)old.remove();
 const h=d.createElement('div');h.className='aa';h.id='aa-head';
 h.innerHTML='<a class="aa-logo" href="'+SITE+'" title="Back to Adalia Academy"><span>ADALIA.</span><span>ACADEMY</span></a><nav class="aa-nav">'+NAV.map((n,i)=>'<a'+(i?'':' class="home"')+' href="'+n[1]+'">'+n[0]+'</a>').join('')+'</nav>';
 d.body.prepend(h);
}

const LS='influenceStockWallet';
const getSaved=()=>{try{return localStorage.getItem(LS)||''}catch(e){return ''}};
const setSaved=v=>{try{v?localStorage.setItem(LS,v):localStorage.removeItem(LS)}catch(e){}};
const okAddr=a=>/^0x[0-9a-fA-F]{1,64}$/.test(a);
const short=a=>a.length>14?a.slice(0,8)+'…'+a.slice(-6):a;
const CSS='<style>body{margin:0;background:#0b0e13;color:#e6ebf2;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}'+
 '.box{max-width:560px;margin:6vh auto 0;padding:0 20px}h1{font-size:26px;margin:0 0 6px}h1 span{color:#5fc3e4}p{color:#8a96a8;margin:6px 0 18px}'+
 'input{width:100%;box-sizing:border-box;font:inherit;color:#e6ebf2;background:#131821;border:1px solid #232b38;border-radius:8px;padding:12px}'+
 'button{margin-top:12px;font:inherit;font-weight:600;color:#04121a;background:#5fc3e4;border:0;border-radius:8px;padding:11px 22px;cursor:pointer}'+
 '.err{color:#ff7a7a;min-height:1.5em;margin-top:8px}.foot{color:#5b6677;font-size:12px;margin-top:40px}</style>';
const FOOT='<div class="foot">A community tool from Adalia Academy. Not an official Influence site. It only reads public game data.</div>';
function askWallet(msg){
 say(CSS+'<div class="box"><h1>Your <span>Influence</span> Command</h1><p>See everything in your warehouses and tank farms across all your crews and asteroids.</p>'+
 '<label for="w">Your Starknet wallet address</label><input id="w" placeholder="0x…" autocomplete="off" spellcheck="false">'+
 '<p style="font-size:13px;margin-top:6px">Find it in your wallet (Argent or Braavos) using "Copy address". Your browser will remember it.</p>'+
 '<button id="go">Show my stock</button><div class="err" id="err">'+esc(msg||'')+'</div>'+FOOT+'</div>');
 const inp=document.getElementById('w');inp.value=getSaved();inp.focus();
 const go=()=>{const v=inp.value.trim();if(!okAddr(v)){document.getElementById('err').textContent='That doesn\'t look like a wallet address. It should start with 0x.';return}
  setSaved(v);history.replaceState(null,'','?wallet='+encodeURIComponent(v));load(v)};
 document.getElementById('go').onclick=go;inp.addEventListener('keydown',e=>{if(e.key==='Enter')go()});
}
async function load(wallet){
 say(CSS+'<style>@keyframes ldGlow{0%,100%{opacity:.85}50%{opacity:1}}.ld-star{animation:ldGlow 2.4s ease-in-out infinite}.ld-ship{mix-blend-mode:screen}@media (prefers-reduced-motion: reduce){.ld-star{animation:none}}</style>'+
 '<div class="box" style="text-align:center"><svg viewBox="-125 -70 250 140" width="340" height="190" style="display:block;margin:8vh auto 10px;overflow:visible" aria-hidden="true"><defs>'+
 '<radialGradient id="ldS"><stop offset="0" stop-color="#fffaf0"/><stop offset=".3" stop-color="#ffe2b0" stop-opacity=".8"/><stop offset="1" stop-color="#ffd09a" stop-opacity="0"/></radialGradient>'+
 '<radialGradient id="ldF"><stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="ldM" maskContentUnits="userSpaceOnUse"><circle r="19" fill="url(#ldF)"/></mask></defs>'+
 '<ellipse rx="62" ry="26" fill="none" stroke="rgba(95,195,228,.15)" stroke-width="1.2"/><path id="ldP" d="M100,0 A100,42 0 1,1 -100,0 A100,42 0 1,1 100,0" fill="none" stroke="rgba(95,195,228,.35)" stroke-width="1.6"/>'+
 '<g class="ld-star"><circle r="30" fill="url(#ldS)"/><circle r="7" fill="#fffaf0"/></g>'+
 '<g><animateMotion dur="5s" repeatCount="indefinite"><mpath href="#ldP"/></animateMotion><g mask="url(#ldM)"><image class="ld-ship" href="shipimg.php?t=2&amp;v=2&amp;s=1" x="-34" y="-43" width="72" height="96"/></g></g></svg>'+
 '<p>Loading your command for '+esc(short(wallet))+'…</p></div>');
 let j;
 try{const r=await fetch('api.php?wallet='+encodeURIComponent(wallet),{cache:'no-store'});j=await r.json();if(!r.ok||j.error)throw new Error(j.error||('Server error '+r.status))}
 catch(e){askWallet('Could not load stock: '+e.message);return}
 const crews=j.crews||[],PRIM={10:1,19:1};
 const blds=(j.allBuildings||[]).filter(b=>b.Building&&b.Building.status===3&&(b.Building.buildingType===1||b.Building.buildingType===10)&&(b.Inventories||[]).some(i=>PRIM[i.inventoryType]&&(i.contents||[]).some(c=>c.amount>0)));
 if(!crews.length){askWallet('No crews found for that wallet.');return}
 const astOf=b=>{const l=(b.Location&&b.Location.locations)||[];const a=l.find(x=>x.label===3);return a?a.id:0};
 const groups={},astName={};
 for(const b of blds){const a=astOf(b);astName[a]=(b.meta&&b.meta.asteroid&&b.meta.asteroid.name)||('Asteroid #'+a);(groups[a]=groups[a]||[]).push(b)}
 const aKeys=Object.keys(groups).sort((x,y)=>astName[x].localeCompare(astName[y]));
 if(!aKeys.length){askWallet('Found '+crews.length+' crew(s) for that wallet, but no warehouses or tank farms with stock.');return}
 const used={};
 const D={when:new Date(j.fetched*1000).toLocaleString(),crews:crews.length,products:used,recipes:RX,asteroids:aKeys.map(a=>({name:astName[a],buildings:groups[a].map(b=>{const it={};(b.Inventories||[]).filter(i=>PRIM[i.inventoryType]).forEach(i=>(i.contents||[]).forEach(c=>{if(c.amount){it[c.product]=(it[c.product]||0)+c.amount;used[c.product]=PX[c.product]||['Product '+c.product,'',0,false]}}));
  const cn=crews.find(c=>b.Control&&c.id===b.Control.controller.id);
  return{name:(b.Name&&b.Name.name)||((BT[b.Building&&b.Building.buildingType]||'Building')+' #'+b.id),type:BT[b.Building&&b.Building.buildingType]||'Building',crew:cn&&cn.Name&&cn.Name.name||'',lot:(((b.Location&&b.Location.locations)||[]).find(x=>x.label===4)||{}).id?Math.floor(((b.Location.locations.find(x=>x.label===4)).id)/4294967296):0,items:it,fill:(()=>{const CP={10:[1.5e12,7.5e10],19:[7.5e10,9.975e11]},inv=(b.Inventories||[]).find(i=>CP[i.inventoryType]);if(!inv)return null;const c=CP[inv.inventoryType];return{f:Math.max((inv.mass||0)/c[0],(inv.volume||0)/c[1]),m:inv.mass||0,cap:c[0],vo:inv.volume||0,vc:c[1]}})()}}).filter(b=>Object.keys(b.items).length)}))};
 for(const k in PX)if(!used[k])used[k]=PX[k];
 D.allB=j.allBuildings||[];D.owned=j.owned||[];D.orders=j.orders||[];D.ordErr=j.ordErr||null;D.wallet=j.wallet;D.crewN={};crews.forEach(c=>{D.crewN[c.id]=(c.Name&&c.Name.name)||('Crew #'+c.id)});
 D.crewsRaw=crews;D.leases=j.leases||[];D.leaseErr=j.leaseErr||null;D.crewmates=j.crewmates||{};D.stations=j.stations||{};
 const ST={1:['Escape Module',null],2:['Light Transport',16],3:['Heavy Transport',17],4:['Shuttle',15]},CAP={15:[5e7,1.25e8],16:[2e9,5e9],17:[1.2e10,3e10]};
 D.ships=(j.ships||[]).map(s=>{const t=ST[s.Ship&&s.Ship.shipType]||['Ship',null],loc=(s.Location&&s.Location.location)||{},inv=s.Inventories||[];
  const c=inv.find(i=>i.inventoryType===t[1]),pr=inv.find(i=>i.inventoryType>=11&&i.inventoryType<=14);
  const sh=s.Ship||{},fl=loc.label===10,an=x=>x?(astName[x.id]||('Asteroid #'+x.id)):'?',arr=sh.transitArrival?new Date((1609459200+sh.transitArrival/24)*1000):null;
  const carry=c&&c.contents&&c.contents.length?c.contents.filter(x=>x.amount>0).map(x=>(PX[x.product]?PX[x.product][0]:'Product '+x.product)).join(', '):'';
  return{id:s.id,crewId:(s.Control&&s.Control.controller&&s.Control.controller.id)||0,st:+sh.shipType||0,sv:+sh.variant||1,name:(s.Name&&s.Name.name)||(t[0]+' #'+s.id),type:t[0],fl,carry,ast:fl?an(sh.transitDestination):((s.meta&&s.meta.asteroid&&s.meta.asteroid.name)||''),
   place:fl?('on route from '+an(sh.transitOrigin)+(arr?', arrives '+arr.toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'')):loc.label===5?((s.meta&&s.meta.building&&s.meta.building.name)||'spaceport'):loc.label===4?('Lot #'+Math.floor(loc.id/4294967296)):loc.label===3?'in orbit':'in flight',
   capM:c?CAP[t[1]][0]:0,capV:c?CAP[t[1]][1]:0,useM:c?(c.mass||0)+(c.reservedMass||0):0,useV:c?(c.volume||0)+(c.reservedVolume||0):0,prop:pr?(pr.mass||0)/1e6:0}});
 {const now=Date.now()/1000,dt=x=>new Date(x*1000).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}),an=x=>x?(astName[x.id]||('Asteroid #'+x.id)):'?',shipById={};(j.ships||[]).forEach(x=>shipById[x.id]=x);
  D.crewList=crews.map(c=>{const cr=c.Crew||{},loc=(c.Location&&c.Location.location)||{},me=c.meta||{},sh=c.Ship||{};let ast=(me.asteroid&&me.asteroid.name)||'',place='';
   if(loc.label===10){ast=an(sh.transitDestination);place='In flight (escape module) from '+an(sh.transitOrigin)+', arrives '+dt(1609459200+(sh.transitArrival||0)/24)}
   else if(loc.label===6){const sp=shipById[loc.id],sl=sp&&sp.Location&&sp.Location.location;if(sl&&sl.label===10){ast=an(sp.Ship.transitDestination);place='Aboard '+((me.ship&&me.ship.name)||'ship')+' · in flight from '+an(sp.Ship.transitOrigin)+', arrives '+dt(1609459200+sp.Ship.transitArrival/24)}else place='Aboard '+((me.ship&&me.ship.name)||'ship')+(me.building&&me.building.name?' · '+me.building.name:'')}
   else if(loc.label===5)place=(me.building&&me.building.name)||'Building';else if(loc.label===4)place='Lot #'+Math.floor(loc.id/4294967296);else if(loc.label===3)place='In orbit';
   const ys=Math.max(0,now-(cr.lastFed||0))*24/31536000,food=cr.lastFed?Math.min(Math.max(0,1-ys,0.75-0.5*ys),1):null;
   return{id:c.id,stn:loc.label===5?loc.id:0,name:(c.Name&&c.Name.name)||('Crew #'+c.id),mates:(cr.roster||[]).length,roster:(cr.roster||[]),mn:Object.fromEntries((me.crewmates||[]).map(x=>[x.id,x.name||''])),ast,place,food,busy:cr.readyAt&&cr.readyAt>now?dt(cr.readyAt):''}})}
 renderReport(document,D);
 siteHeader();
 const sub=document.getElementById('sub');
 if(sub){const w=document.createElement('div');w.className='sub';w.style.marginTop='2px';
  w.innerHTML='Wallet '+esc(short(j.wallet))+' · <a href="#" id="chg" style="color:#5fc3e4">Change wallet</a> · <a href="#" id="rf" style="color:#5fc3e4">Refresh</a>';
  sub.after(w);
  document.getElementById('chg').onclick=e=>{e.preventDefault();history.replaceState(null,'',location.pathname);askWallet()};
  document.getElementById('rf').onclick=e=>{e.preventDefault();load(wallet)};}
 const f=document.createElement('div');f.style.cssText='color:#5b6677;font-size:12px;padding:0 20px 30px';f.textContent='A community tool from Adalia Academy. Not an official Influence site. It only reads public game data.'+(VER?' · Version '+VER:'');document.body.appendChild(f);
}
const start=new URLSearchParams(location.search).get('wallet')||getSaved();
if(start&&okAddr(start)){setSaved(start);load(start)}else askWallet();
})();
function tLeft(t,now){const s=Math.max(0,t-now),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),mi=Math.floor(s%3600/60);return s<=0?'any moment':d?d+'d '+h+'h '+mi+'m':h?h+'h '+mi+'m':Math.max(1,mi)+'m'}
setInterval(()=>{const n=Date.now()/1000;document.querySelectorAll('[data-fin]').forEach(e=>{e.textContent=tLeft(+e.dataset.fin,n)})},30000);