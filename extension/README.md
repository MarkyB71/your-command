# Skippy's Command Deck – browser extension

Lets the **in game ↗** links on https://your-command.adalia.academy move your open
Influence game tab to a building, lot, ship, crew or asteroid **without reloading the game**.
Clicking the crowned-S icon in your browser's toolbar takes you back to the Command Deck tab.

This is a community tool, not made or endorsed by Influence / Unstoppable Games.
All the code is in this folder – it's small enough to read in a few minutes.

## What it can and can't do

| File | What it does |
|---|---|
| `manifest.json` | Asks for the **scripting** permission and access to **two sites only**: `game.influenceth.io` and `your-command.adalia.academy`. No other sites, no history, no downloads, no storage, no cookies. |
| `site.js` | Runs on the Command Deck site only (top page, not frames). Marks the page so the site knows the extension is installed, and passes link clicks to the extension. Reads nothing else. |
| `background.js` | When a link is clicked: checks the request came from the Command Deck site, checks it is exactly `/building/<number>` (or lot, ship, crew, crewmate, asteroids), then switches to your game tab and tells the game's own page router to show it. If no game tab is open, it opens the game normally. Toolbar icon → switches to the Command Deck tab. |

It **never** reads, stores or sends your wallet, keys, passwords, game data or browsing.
It makes **no network requests** of its own and has **no auto-update** – it only changes
when you replace the folder yourself.

## Security notes (reviewed 24 Oct 2026)

- Only requests from `https://your-command.adalia.academy` tabs are accepted; anything
  from other sites, frames or the game itself is ignored.
- Only paths matching `^/(building|lot|ship|asteroids|crew|crewmate)/\d{1,20}$` are
  accepted, so nothing else (scripts, other URLs, actions) can be passed to the game.
- The script run in the game tab is fixed (`history.pushState` + a `popstate` event) –
  the only thing that changes is the checked path. It can't click, buy, sign or send anything.
- At most one jump every 0.7 s, so a page can't keep pulling the game tab to the front.
- Worst case if the Command Deck site were ever hacked: someone could make your game tab
  jump to a different building. Nothing more.

## Checking your download

The zip on the site should match this SHA-256 (version 0.3.1):

    b58d05a56a80209030cba1a7518349e8d4e6317409ac7cf9fce97d215a513c4b

On a Mac: `shasum -a 256 skippys-command-deck.zip` · Windows: `certutil -hashfile skippys-command-deck.zip SHA256`

Or skip the zip entirely: download this `extension` folder from GitHub and use **Load unpacked** on it.

## Install (Chrome, Brave or Edge on a computer)

1. Unzip the download.
2. Go to `chrome://extensions` (Brave: `brave://extensions`, Edge: `edge://extensions`).
3. Switch on **Developer mode**.
4. Click **Load unpacked** and choose the `skippys-command-deck` folder.
5. Reload the Command Deck page.

## Rebuilding the download (for the site owner)

From the repo root:

    rm -rf /tmp/scd && mkdir -p /tmp/scd && cp -r extension /tmp/scd/skippys-command-deck
    rm /tmp/scd/skippys-command-deck/README.md
    (cd /tmp/scd && zip -qrX skippys-command-deck.zip skippys-command-deck)
    mv /tmp/scd/skippys-command-deck.zip public_html/downloads/
    sha256sum public_html/downloads/skippys-command-deck.zip   # update the checksum above
