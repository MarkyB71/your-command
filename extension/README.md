# Skippy's Command Deck – browser extension

Lets "in game ↗" links on your-command.adalia.academy move your open Influence game tab
to a building, lot, ship, crew or asteroid **without reloading the game**.

- Only runs on your-command.adalia.academy (to receive link clicks) and game.influenceth.io (to move the game tab).
- Only accepts simple paths like /building/123 – it can't do anything else in the game.
- Never reads or sends your wallet, keys or game data.

Build the download after changing anything here:

    cd extension/.. && rm -f public_html/downloads/skippys-command-deck.zip
    cp -r extension /tmp/skippys-command-deck && rm /tmp/skippys-command-deck/README.md
    (cd /tmp && zip -qr skippys-command-deck.zip skippys-command-deck)
    mv /tmp/skippys-command-deck.zip public_html/downloads/
