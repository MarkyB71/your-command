# Changelog – Your Influence Command

Newest first. Version = the number in the site footer (it rises by one with every commit). Each change was tried on ?beta=1 first, then made live.

## 13 Nov 2026 – Logistics Hub: 🗄 Storage tidy is live – rename your buildings with a naming style you choose (every name editable, nothing forced), ↩ put back your old names (saved in your browser before each rename), and gather stock into tidy storage. The rock's name shows in each step's heading. Help page updated.

## 13 Nov 2026 – Captain's log Today: "Finishing soon" jobs no longer count as needing your attention. Logistics Hub: the same-actions guard (15 minutes) now still works after a page reload – remembered in your browser only. Help page updated.

## 13 Nov 2026 – Captain's log Today: new "Finishing soon" list – jobs that finish within 3 hours, with time left. Help page updated.

## 13 Nov 2026 – Fix: table headings stay on top when you scroll – building pictures and "in game" buttons no longer show through them Today's workload jump links (e.g. Waiting to accept) scroll just the Captain's log, not the whole page, so the list shows properly.

## 13 Nov 2026 – Logistics Hub Production: 📋 your production plans are saved when you approve and listed at the top – see each process done / running / to collect / ready / waiting and start the next ones. MAX button (the most you can make from what's on the rock). Search by input or process. Cargo bay: best ship re-picked as flight times come in (with a warning), full ships marked, clear "Click to load" on rock cards. New welcome line. Help page updated.

## 13 Nov 2026 – Captain's log: ✎ edit a note's text. ⚙ Process boxes get "🚚 Plan it in the Logistics Hub" and 📦 Still needed boxes get "make ›" on each short item – both open Production with the rock, product and amount filled in; if the rock can't make it, the box says which building is missing. Help page updated.

## 13 Nov 2026 – Fix: the Logistics Hub can no longer send the exact same actions twice within 15 minutes (a ship was loaded twice because the game data hadn't caught up after the first Approve). Reported by Mark.

## 13 Nov 2026 – New top bar layout: Play Influence on the left; SWAY, Deck controls (always centred) and Refresh Game Data in the middle; search, Command Deck, wallet and Help on the right. On decks with page buttons the bar has its own line. No more jumping about while the page loads, and no stray Logistics Hub button on load. The airlock now says "Warning. Airlock cycling. Entering the Logistics Hub." Help page updated.

## 13 Nov 2026 – Fix: Logistics Hub process starts no longer fail with "E6049: max process time". Very slow processes (e.g. Natural Flavorings Growing – 2 runs) start as many runs as the game allows, and show "⏱ game limit: X of Y runs now – start the rest when it finishes". Reported by Mark.

## 13 Nov 2026 – New deck layout: one deck per crew class and the game buildings it works in. New Mining deck (Core Samples, Lot resources, Resource map, Supply chain). Engineering now holds everything used when making products (Products, planners, Storage status – was Contents –, Deliveries, Leases, Lot leases). Science Lab: Asteroids, Spectral type raws, Bioreactor status. Trade Deck is trading only. Every deck has a status page for its own buildings. Bridge: three stations each side of the chair with building-colour dots; Weapons console removed. Crew Quarters in Habitat yellow, Trade Deck tab in Marketplace green. Feed crews link in Logistics Hub orange. Flight Deck navigation drags the same way as the Bridge. Help page updated.

## 12 Nov 2026 – The SkippyChain can now be opened from the game: with extension 0.6.7, a gold "SkippyChain ↗" button in the game's process window opens that product here – same recipe, amount from the runs set in the game, on that rock.

## 11 Nov 2026 – The SkippyChain: change how something is made on one card and every card for that same product in the chain changes too (e.g. Iron from Olivine instead of Taenite). Community request. To undo: set CAS=false in vendor/chain.js. Help page updated.

## 11 Nov 2026 – SWAY balance: the top bar now shows the SWAY in your wallet, with the game's SWAY icon, just left of Deck controls (Deck controls now sits in the middle of the bar). Updates every 5 minutes; click to read it again. Help page updated.

## 11 Nov 2026 – Science Lab: new Spectral type raws page – pick an asteroid type (rock specimens under glass) and see which raw materials can be mined there, in test tubes coloured like the game's resource groups. Pick a raw material to see which types have it. Help page updated.

## 10 Nov 2026 – Browser extension 0.6.5 is on the Chrome Web Store: ships in flight on the game's system map – your ships and other players' ships (in your friend / foe tag colours), with routes and where they meet their rock, and a tick box for each group. Help page no longer says "coming in 0.6.5".

## 10 Nov 2026 – Skippys Sticky Wall: the heading and tabs sit on the top line, with adding notes and Rock colours on their own line underneath.

## 10 Nov 2026 – Captain's log: Notes are now Skippys Sticky Wall. New 📦 Still needed box (pick a building – shows what's still short on the note's rock) and ⚙ Process box (pick a process and runs – shows the building it needs, whether you have one there, and what's still short). Notes with no rock are white. Help page updated.

## 10 Nov 2026 – Captain's log fix: the Today tab has its own rock picker (starts on All rocks) – it was following the rock picked on another deck. Help page updated.

## 10 Nov 2026 – Captain's log on the Bridge: the captain's chair now opens your Captain's log with three tabs – 🗓 Today (today's workload), 📌 Notes (sticky notes you drag around, tick off, tie to a rock with your own rock colours from 10 game colours, and link together; saved in your browser only) and 📜 Log (everything your crews have done, with Adalia Stardates from the game's own clock). The Bridge consoles roll up while you work on the notes. Deck controls moved to the far left of the top bar, the SkippyChain sits above the chair, and the Weapons console is dimmed on standby. Help page updated.

## 10 Nov 2026 – Logistics Hub: a Hub tab in the main deck's top bar, a matching top bar inside the Hub, Bridge-style side walls, and a 🐞 Report a problem button in the Hub.

## 10 Nov 2026 – Bridge welcome: the doors and Skippy's welcome clip now show only on your very first visit (clicking Skippy in the chair still plays it any time).

## 10 Nov 2026 – Sign-in page: the wallet note now says the site never asks you to sign or send anything, except in the Logistics Hub for game actions you approve.

## 10 Nov 2026 – Galley fix: Feed crews now gives each crew exactly enough to reach 100% food – the same sum the game's own Feed Crew uses. Before, a crew under 50% food was offered too much and the game turned the whole feed down ("food limit reached"). Same fix in Production's crew feeding.

## 9 Nov 2026 – Logistics Hub: a small hidden extra in the airlock for players who don't want to go through it every time. (Not on the Help page – ask Skippy.)

## 9 Nov 2026 – Logistics Hub is now the Logistics Bridge: a viewscreen with consoles, like the Bridge in orange. 🏭 Production (rock, what to make and how much – weight or count, "What's it for?" from building recipes – what you need worked back through the chain, processes in order, where things go with how full afterwards, moves, two crews picked for you with the option to feed them, start processes with finish times). 🚀 Cargo bay (how many rocks to fly in from, the ship there or the nearest one, trips, flight times, and exactly what will be loaded). 🍽 Galley (feed your crews – tick the ones to feed). Crew Quarters: crew cards with crewmate pictures – click a crew to see all its members; 🍽 Feed crews opens the hub. Crew planner: new green look, top part stays put while scrolling. Help page updated.

## 9 Nov 2026 – Logistics Hub, Start processes too?: a process that makes a solid (e.g. Magnesium, Boric Acid, Nitric Acid) no longer gets stuck when its output would have gone to a tank farm – the nearest storage that can take it is used. Processes that can't start yet are listed one per line with the reason (e.g. every Refinery on the rock is busy). Help page updated.

## 9 Nov 2026 – Logistics Hub: ↻ Check the game again is now in the pinned header (no scrolling up). Already on its way only lists deliveries not yet finished (it was counting finished ones too), and each has an in game ↗ link to the building it's going to instead of a crew column. Flight deck: ship panel text is always cleaned (security check). Help page updated.

## 9 Nov 2026 – Logistics Hub fix: each step's storage must take all its inputs – no more tank farm picked when an input can't go in one (e.g. Hydrochloric Acid for Boric Acid).

## 9 Nov 2026 – New in the Logistics Hub: 🚀 Load a ship – bring what you need from your other rocks. Choose to send the inputs or what they're made from, which rock, which ships (the load is split across them) and which crew moves it; it only loads the ship, you fly and unload it. 🛒 Or buy it on the belt shows the marketplaces selling the load, with cost and in game ↗ links. Also: the full production plan's stages fold away behind Show the stages, and after sending it names the crew to finish with (with an in game ↗ link). Help page updated.

## 9 Nov 2026 – Logistics Hub: the header (LOGISTICS HUB, the wallet warning and Return to the Bridge) now stays pinned at the top of the screen when you scroll.

## 8 Nov 2026 – New: 🚚 Logistics Hub – the one page that can act in the game (button in the deck tool row, through an airlock warning every time). Pick what to make on a rock: it picks a free building near your crews and a storage with room, works out the inputs (what's there, on its way, short, or can be mined/made here), lays out the full production plan in stages using by-products, and moves the stock – nearest first, with distances and trip times. Optional: start the processes that are ready. Nothing happens unless you approve it in your own wallet; long lists go in batches and everything is re-checked just before sending. Plans are saved in your browser. Help and Safety pages updated.

## 7 Nov 2026 – Planners: Fewest flights and Fly in now count a rock that can make something with some ingredients flown in from your other rocks (no more wrong "Not available", e.g. Lead), picking the rock that needs least flown in. Everywhere a page says fly it in (SkippyChain, building tiles, Make it here?) it now says where from – in stock on, or mine it on, one of your rocks. Old Fuel check and Daily Grind files removed.

## 6 Nov 2026 – New Skippy welcome on the Bridge: he now says "Welcome to Skippy's Awesome Command Deck" (also when you click him in the captain's chair).

## 6 Nov 2026 – Bottom of the site: "Enjoying Skippy's Awesome Command Deck?" in gold, a quieter Buy me a coffee button, and PayPal moved to the middle.

## 6 Nov 2026 – Renamed to "Skippy's Awesome Command Deck" (community suggestion) – browser tab title and the full-list download. The browser extension gets the new name in its next update.

## 5 Nov 2026 – Fix: opening Lot leases from the Science Lab no longer lights up The Bridge tab – the Science Lab stays selected.

## 5 Nov 2026 – Deck controls on the Bridge: click the glowing panel above the captain's chair to change the browser extension's settings and friend / foe tags right on the Command Deck (needs extension 0.6.3, now on the Chrome Web Store).

## 5 Nov 2026 – Fix: Crews food % now counts Dietitians and Food Preparation crewmates (Arvad Specialists get their extra half tier), so it matches the game.

## 5 Nov 2026 – New Lot leases page (Science Lab, community request): type any asteroid's name or number to see its lease offer (price a day, minimum term, notice) and every lot on a globe – free to lease, leased by you or leased by someone else. Zoom in, hover a lot for the tenant, price and end date, click it to open it in the game. Colour leased lots by price where prices vary, or by your friend / foe tags (extension 0.6.3+).

## 5 Nov 2026 – Market history: other players' crews now show by name (community request). Unnamed crews still show as "Crew #number".

## 3 Nov 2026 – New Help page (help.html): how to use every deck and the browser extension. Open it with the ? Help button beside ⟳ Refresh.

## Version 621 – 2 Nov 2026 – Engineering: pick a rock and each dial lists its buildings with the time left, soonest first (hover a line for the full name and finish date). Building Status now also lists buildings under construction with their time left.

## Version 598 – 2 Nov 2026 – The SkippyChain: new "Still to produce – whole chain" box (community request). Adds up every product that has to be made anywhere in the chain, across all branches, grouped by building (Refinery, Factory, Bioreactor, Shipyard). Uses your stock first when "Use my stock on" is set. Click a product name to open the SkippyChain on that total.

## Version 596 – 31 Oct 2026 – Production planner: new Shipyard tab for ship parts such as Habitation Modules, hulls, engines and modules (whole ships stay in the Construction planner).

## Version 589 – 30 Oct 2026 – Resource Map: new "All resources" option (community request). Every lot shows the resource it is richest in, blended into a smooth heat map on the real shape. Tick "Show only the best building spots" to light up free lots that are poor in everything – good places for warehouses, refineries and the like – with a list of the best ones.

## Version 583 – 29 Oct 2026 – The Daily Grind deck and Fuel check removed for now (code kept to bring back later).

## Version 578 – 29 Oct 2026 – New Resource Map in the Science Lab: pick a scanned rock and a resource and every lot lights up by how rich it is, in the game's own resource-map colours (6 steps, one colour per resource group). Shows the rock's real shape when you add its 3D model (Add 3D model button right on the page), or a globe otherwise. Your buildings are ringed in the game's building colours; hover a lot for its level; Richest lots list turns the rock to that lot, with an "in game ↗" link on each lot (needs the Command Deck extension).

## Version 565 – 29 Oct 2026 – Refresh fixes on the decks: the ⟳ Refresh button now fetches new data quietly (no loading screen, no Bridge flash, no doubled search boxes and Refresh buttons). A browser refresh goes straight back to the page you were on, and if it was on the viewscreen it stays there; the old header no longer flashes up while it loads.

## Version 560 – 29 Oct 2026 – Filter box above long tables (type to narrow the rows). Building Contents: switch between cards and a table (remembers your choice). Background refresh: game data updates every minute without reloading the page or losing your place. Ship status colours match the game: In orbit blue, In flight orange, Docked white. Tidy: unused old ship-colour test removed.

## Version 557 – 29 Oct 2026 – Construction planner (was Asteroid planner) now plans ships too (Shuttle, Light and Heavy Transport). New Production planner on the Engineering deck: Refinery / Factory / Bioreactor tabs, make any amount (kg / t / kt) of a product on a rock. Both planners ask you to pick a rock first and use the one rock box at the top; Fly in sits beside Fewest flights with each material folded to one line, Materials underneath. The SkippyChain moved to the Bridge: gold console in front of the captain's chair. Tidy: old page banners, drawn banner artwork and header logos (hidden behind the decks) removed.

## Version 536 – 29 Oct 2026 – The Bridge: click Skippy in the captain's chair to hear his welcome again (the bottom of the chair still opens Today's workload)

## Version 532 – 29 Oct 2026 – Removed the old extension download (zip) and its by-hand install steps – everyone installs from the Chrome Web Store now. Extension checks run on GitHub on every extension change.

## Version 526 – 29 Oct 2026 – New deck The Daily Grind (duty board) with Fuel check moved in from Engineering; Fuel check lists rocks that can make fuel if Silica + Tungsten Powder are flown in; raws a rock can't mine can be made there instead (e.g. Hydrogen from Water) in Fuel check, Travel and the Asteroid planner; SkippyChain warns when a raw is on "Mine it" but the chosen rock can't mine it; decks: bottom Updated / Wallet line hidden

## Version 515 – 28 Oct 2026 – Browser extension 0.4.5 (sent to the Chrome Web Store): crowned-S button in the game's side bar back to the Command Deck; switches the game's lot colours (Building Categories highlight) on at every load; download zip + README updated

## Version 506 – 28 Oct 2026 – Where to buy: Quickest / Economy choice (Economy = the trip up to 365 h that burns the least propellant)

## Version 504 – 28 Oct 2026 – Trade Deck: new 'Where to buy' console – nearest places selling a product, flight times there and back, propellant burned and its cost in SWAY, goods and total (one way if the rock sells propellant, else round trip on ½ tank)

## Version 502 – 28 Oct 2026 – Market history: 'Only my trades' tick box lined up with its label

## Version 498 – 28 Oct 2026 – Fix: the money strip and the "Report a problem" line at the bottom kept swapping places every 0.7 s, so that area flickered. They now stay put.

## Version 495 – 27 Oct 2026 – The Bridge: the Standby console is now an orange Weapons console (Armoury station), kept ready for when conflict starts in the game – not linked yet.

## Version 491 – 27 Oct 2026 – Trade Deck: new My trading console – Orders (are you cheapest / top bid?), Watch (pin products, see best prices) and Calculator (what an amount sells for or costs right now, fees included).

## Version 489 – 27 Oct 2026 – ⟳ Refresh button beside the wallet button under the deck tabs: fetches the latest game data without reloading the page.

## Version 487 – 27 Oct 2026 – SkippyChain: sideways scroll bar now stays at the bottom of the screen, so big chains (e.g. Habitat) can be scrolled left/right without going to the bottom first.

## Version 485 – 27 Oct 2026 – Wallet button under the deck tabs shows the connected address (e.g. 0x12c8…96bf); click it to connect or change wallet.

## Version 484 – 27 Oct 2026 – Skippy's Command Deck goes live: the site is now a ship. The Bridge (landing page) and five deck rooms – Flight Deck, Crew Quarters, Science Lab, Engineering, Trade Deck – each with its own look in the game's crew-class colours. Click a console to open that page on the viewscreen; the centre piece takes you back to the deck's start. Search, Play Influence, Command Deck and Connect / change wallet sit under the deck tabs; Download is at the bottom. Phone layout tidied. Skippy's door intro plays once per visit.

## Version 466 – 27 Oct 2026 – Community Tools: added 📊 Influence Tracker (influence-tracker-six.vercel.app).

## Version 435 – 26 Oct 2026 – Supply chain: under each "✗ needs", the quickest rock to fly it from and the flight time leaving now (Light Transport, full tank, 2,000 t cargo).

## Version 433 – 26 Oct 2026 – Core Samples: arranged by rock (each rock its own heading), with a switch to By resource; your choice is remembered.

## Version 430 – 26 Oct 2026 – New page Asteroids › Supply chain: which of your rocks can mine each raw resource, and which rocks need it flown in.

## Version 423 – 26 Oct 2026 – Every table: headings stay in view under the menu, soft row stripes, sort arrows only where you can sort, and click-to-sort on simple tables (Ships, Leases, Status and more).

## Version 422 – 26 Oct 2026 – Today's Workload: Idle buildings and Storage nearly full now show one row per asteroid (click to open); counts are buildings, e.g. "Idle buildings (126 on 6 asteroids)".

## Version 417 – 26 Oct 2026 – Code tidy (nothing players see should change): removed the old page code left in app.js since Version 200 (176 KB → 97 KB), folded about 60 old always-on test switches into plain code, moved the Academy test designs out of the live site folder.

## Version 416 – 26 Oct 2026 – "Try other Community Tools" at the bottom of every page: links to Adalia Academy, Adalia Exchange, Elerium tools and the Influence Tools extension (open in a new tab).

## Version 412 – 26 Oct 2026 – Core Samples: small samples (under 2 t) hidden by default with a tick box to show them, and the choice is remembered. Crew planner: bonuses listed biggest first, with a gap before the ones that don't help.

## Version 411 – 26 Oct 2026 – New "🐞 Report a problem" button on its own line under the support strip. Players describe a bug (page filled in for them, Discord name and wallet optional); reports are saved privately on the server and posted as issues in a private GitHub repo. Limits: 5 per visitor per hour, 30 a day in total.

## Version 403 – 26 Oct 2026 – Asteroid planner: Then send has a full tank / propellant as it is now choice, and keeps half the tank when the build rock can't make propellant; raw materials your other rocks hold or mine (e.g. Taenite for iron) are flown in, and the table and Fewest flights now agree; building tiles line up. Header: title shrinks to fit narrow windows (banner label hides when there's no room); Updated/wallet and Download stay together on one row.

## Version 396 – 26 Oct 2026 – Building Contents: long product names wrap so the amounts stay inside the card.

## Version 388 – 25 Oct 2026 – "Enjoying the Command Deck?" strip above the footer: Buy me a coffee · SkipCoin · PayPal. SkipCoin removed from the top menu; its box now shows only the crypto wallets.

## Version 383 – 25 Oct 2026 – Command Deck button now installs the extension from the Chrome Web Store (one click, automatic updates) instead of the zip.

## Version 381 – 24 Oct 2026 – Search box moved from the banner onto the menu row (slim box, before the Updated lines) so the banner animation is clear.

## Version 379 – 24 Oct 2026 – Updated/wallet lines moved onto the menu row (left of Download); search box moved into the banner (top right); the empty strip is gone.

## Version 378 – 24 Oct 2026 – Landing title: "Quartermaster" and "Command Deck" blue, "Skippy's" white (matches the PDF).

## Version 374 – 24 Oct 2026 – New top layout: page banner at the very top with the page title in the middle, menu under it (banner + menu stay at the top when scrolling), then a slim strip with Updated/wallet on the left and search on the right.

## Version 369 – 24 Oct 2026 – Download button renamed "Download your Command Deck".

## Version 368 – 24 Oct 2026 – Download button opens a choice: Spreadsheet (CSV) or PDF. One file with stock (every asteroid, no filters), buildings, crews and ships. PDF in the site's dark blue style, saved from the print window.

## Version 363 – 24 Oct 2026 – Products: "in game ↗" links on each building in an opened product row (needs the Command Deck extension).

## Version 361 – 24 Oct 2026 – Today's Workload: every idle building has its own "in game ↗" link (one per line in the fold-out)

## Version 359 – 24 Oct 2026 – Page titles tidied: "Your <Page>" with no group word (no more "Your Asteroids Asteroids" or "Your Logistics Products")

## Version 357 – 24 Oct 2026 – Asteroid planner: each building tile shows what you can build on the chosen asteroid (✓ Stock for N · ⚒ Make it here ↗ opens The SkippyChain in a new tab · ⚒ Needs a facility · ✈ Fly some in)

## Version 352 – 24 Oct 2026 – Asteroid planner new layout: Materials + Fewest flights side by side, Fly in full width below, then Facilities and Mine here side by side at the bottom

## Version 347 – 24 Oct 2026 – Asteroid planner: Fewest flights "First send" also offers ships already in flight (marked ✈ landing on …), counting the wait until they land

## Version 344 – 24 Oct 2026 – Skippy's Command Deck browser extension: "in game ↗" links on every page jump your open game tab to a building, lot, ship, crew or asteroid with no reload; Command Deck install button next to Play Influence (code + safety notes in extension/ on GitHub)

## Version 332 – 24 Oct 2026 – SkippyChain: big gold Back and Forward buttons, same size, centred above the top box (Made from and Used in)

## Version 327 – 24 Oct 2026 – Asteroid planner: one building type updates instantly; with two or more, set the counts then press Calculate (no more delay on every click)

## Version 323 – 24 Oct 2026 – Travel: crewed asteroids + chosen trip outlined
- Travel shows only asteroids with a crew on them; a "Show all asteroids" button brings the rest back.
- Clicking a trip outlines it in the table (glowing blue), with the way back dashed.

## Version 319 – 24 Oct 2026 – Asteroid planner: several buildings at once + Travel: launch windows
- Asteroid planner: a tile with a count box for every building, in game build order (Extractor, Warehouse, Tank Farm, Refinery, Factory, Spaceport, Habitat, Shipyard, Bioreactor, Marketplace); the whole plan adds them all up. Clear all button. Tidier layout (fly in wraps, wider materials table).
- Travel: "Launch windows – next 30 days" chart for the clicked trip and the way back (green = best time to leave, red = slow), Show all trips button; table trip times coloured by how good leaving now is.
- Travel: rocks that can't make their own propellant only get half the tank used flying there, so the ship can get back.

## Version 307 – 24 Oct 2026 – Asteroid planner: make it on site + new layout
- Anything that can be fully made on the build asteroid (its own stock, mining and the facilities you have there) is made there instead of flown in.
- Layout: Materials, then Mine here and Facilities on the left; Fly in on the right (opened out, weights in their own column); Fewest flights below.
- Facilities box also lists missing facilities that would let you make a fly-in item on site (e.g. Bioreactor for Soil).

## Version 298 – 24 Oct 2026 – Asteroid planner: "Make it here?" column in the materials table (✓ Yes / ◐ Partly – fly in … / ✗ No, with process, facilities and what to mine)

## Version 295 – 24 Oct 2026 – Asteroid planner: Fewest flights reworked
- "First send" line at the top (no summary box), with a dropdown when more than one ship could go.
- "Then send it" line at the bottom: ship, flight time, load, propellant used or what the trip would need (full tank time, max load, refuel).
- Crew engine bonus in all flight and propellant maths; flight times in weeks / days / hours; slow routes up to ~12 weeks found (no more false "out of range").
- Softer gold, blue destination, green times.

## Version 284 – 24 Oct 2026 – Asteroid planner: Fewest flights summary in a glowing box with gold numbers; "First send" ship line in gold
## Version 282 – 24 Oct 2026 – Asteroid planner: when no ship is at a source asteroid, Fewest flights adds the flight to get your nearest ready ship there (with flight time)

## Version 279 – 24 Oct 2026 – Asteroid planner (Planners › Asteroid planner)
- Pick an asteroid, how many and which building: materials needed vs stock on that asteroid.
- Fewest flights: the fewest of your asteroids that can supply the rest (in stock, mine it or make it there), with Light / Heavy Transport trips.
- Fly in list: best source for each item, your ships on the way or parked there, and where it can be mined. Mine here and facilities you'll use.
- Ships data now carries cargo and destination (app.js).

## Version 264 – 23 Oct 2026 – SkippyChain facility badge
- Each box says which facility it needs (Factory, Refinery, Shipyard …) and whether you have one on the chosen asteroid. Stock line moved to the bottom of the box.

## Version 261 – 23 Oct 2026 – Lot resources: Hide "Planning expired" + Order by
## Version 258 – 23 Oct 2026 – Lot resources: all lots, building pictures and game category colours; quiet grey "Planning expired"

## Version 253 – 23 Oct 2026 – Ships: crew class colours match the game
## Version 250 – 23 Oct 2026 – Ships: Crew on board (cards with faces, class colours, food bar; empty crews hidden)

## Version 246 – 23 Oct 2026 – Connect wallet
- Button at the top right and on the wallet page: pick an installed Starknet wallet; reads the address only.

## Version 241 – 22 Oct 2026 – SkippyChain: process shown on single-recipe boxes (long names scroll); "None in stock" in red
## Version 235 – 20 Oct 2026 – SkippyChain: Back button + Up one level
## Version 233 – 20 Oct 2026 – Page titles tidied ("The SkippyChain", "Your Market", "Your Travel Planner" …)
## Version 231 – 20 Oct 2026 – Tab icon (crowned S)
## Version 230 – 20 Oct 2026 – Wallets with no storage can use the site
## Version 228 – 19 Oct 2026 – SkippyChain: top-down tree + "Focus on this" with a trail back (chain.js v63)
## Version 224 – 19 Oct 2026 – Ships: from / destination in their own colours

## Version 218 – 19 Oct 2026 – Own header
- "Quartermaster Skippy's Command Deck" (Rye font, glow, logos at both ends, title follows the page); Adalia Academy bar removed.

## Version 205 – 19 Oct 2026 – Menu: hovering another group switches dropdown; dropdowns slide open with group colour and glow
## Version 202 – 19 Oct 2026 – Automatic version number in the footer (deploy stamps it)

## Version 200 – 18 Oct 2026 – one file per page (the big code change)
- Every page now has its own file in `public_html/pages/` (ships, crews, products, deliveries,
  contents, status, leases, market, trade, travel, workload, samples, search, asteroids, lotres).
- `app.js` still loads your data, builds the menu and holds shared helpers; pages reach them through `window.YIC`.
- Ships page: Docked / In orbit / In flight colour tags.
- Last version before this change: app.js v160 / chain.js v59 (git commit 80cd022). To roll back,
  restore `public_html/app.js` and `public_html/index.html` from that commit and deploy.

## SkippyChain – chain.js v59 – 18 Oct 2026
- "◂ Made from" / "Used in ▸" buttons on every box; Used in opens one level by default.
