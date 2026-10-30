# Skippy's Command Deck – browser extension

Lets the **in game ↗** links on https://your-command.adalia.academy move your open
Influence game tab to a building, lot, ship, crew or asteroid **without reloading the game**.
Clicking the crowned-S icon in your browser's toolbar – or the crowned S added to the bottom of
the game's right-hand side bar – takes you back to the Command Deck tab.
It also switches the game's **lot colours** (Filter Lots › Building Categories highlight) back on
each time the game loads, until the game remembers that setting itself.

This is a community tool, not made or endorsed by Influence / Unstoppable Games.
All the code is in this folder – it's small enough to read in a few minutes.

## What it can and can't do

| File | What it does |
|---|---|
| `manifest.json` | Asks for the **scripting** permission and access to **two sites only**: `game.influenceth.io` and `your-command.adalia.academy`. No other sites, no history, no downloads, no storage, no cookies. |
| `site.js` | Runs on the Command Deck site only (top page, not frames). Marks the page so the site knows the extension is installed, and passes link clicks to the extension. Reads nothing else. |
| `game.js` | Runs on the game page only. Adds the crowned-S button to the game's side bar (looks like the game's own buttons). Clicking it asks the extension to switch to your Command Deck tab. Reads nothing from the game. |
| `lotcolours.js` | Runs on the game page only, once per load. Finds the game's own settings store and switches on the Building Categories highlight with the game's own colours – exactly what clicking the paint icon does. Changes nothing else. |
| `statusdots.js` | Runs on the game page only. Reads your buildings from what the game has already loaded and draws small coloured dots beside them on the asteroid view. Never clicks or changes anything in the game, makes no requests. Off by default – switch it on in Options. |
| `background.js` | When a link is clicked: checks the request came from the Command Deck site, checks it is exactly `/building/<number>` (or lot, ship, crew, crewmate, asteroids), then switches to your game tab and tells the game's own page router to show it. If no game tab is open, it opens the game normally. Toolbar icon or the S button in the game → switches to the Command Deck tab. |

It **never** reads, stores or sends your wallet, keys, passwords, game data or browsing.
It makes **no network requests** of its own. The Chrome Web Store version updates itself;
an unpacked copy only changes when you replace the folder yourself.

## Security notes (reviewed 28 Oct 2026)

- Only requests from `https://your-command.adalia.academy` tabs are accepted; anything
  from other sites, frames or the game itself is ignored.
- Only paths matching `^/(building|lot|ship|asteroids|crew|crewmate)/\d{1,20}$` are
  accepted, so nothing else (scripts, other URLs, actions) can be passed to the game.
- The script run in the game tab is fixed (`history.pushState` + a `popstate` event) –
  the only thing that changes is the checked path. It can't click, buy, sign or send anything.
- At most one jump every 0.7 s, so a page can't keep pulling the game tab to the front.
- On the game page the extension only adds its own button and sets that one highlight
  setting. It never clicks, buys, signs or sends anything in the game.
- Worst case if the Command Deck site were ever hacked: someone could make your game tab
  jump to a different building. Nothing more.

## Install

Get it from the [Chrome Web Store](https://chromewebstore.google.com/detail/pbiobnkpgohjcpednldpopbkedlhgpcd) (Chrome, Brave, or Edge with "allow extensions from other stores"). Updates arrive automatically.

What changed in each version: see [CHANGES.md](CHANGES.md).

For testing a new version before it's on the Store: download this `extension` folder from GitHub, then `chrome://extensions` › Developer mode › **Load unpacked**.

## Checks before every release
`node tools/check-extension.mjs` (from the repo root) checks the files (manifest, permissions, no remote code, CHANGES.md) and then loads the extension in a real Chromium against stand-in copies of the site and the game: in-game links, refusing bad links, the S button, hide used deposits, and the options page. GitHub runs it by itself whenever `extension/` changes (Actions tab › Extension checks).
