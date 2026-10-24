# Changelog – Your Influence Command

Newest first. Version = the number in the site footer (it rises by one with every commit). Each change was tried on ?beta=1 first, then made live.

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
