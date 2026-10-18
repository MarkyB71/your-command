#!/bin/bash
# Run by cPanel on every deploy (see .cpanel.yml): writes version.json with one site version number and date.
# Number = 200 + commits since the Version 200 baseline, so it goes up by itself with every change.
DEST="$1"
BASE=d54aeeeb29611bb737c52b190485103cfe450368
N=$(git rev-list --count "$BASE"..HEAD 2>/dev/null) && N=$((200 + N)) || N=0
D=$(git log -1 --format=%cd --date=format:'%-d %b %Y' 2>/dev/null)
H=$(git rev-parse --short HEAD 2>/dev/null)
printf '{"n":%s,"date":"%s","commit":"%s"}\n' "$N" "$D" "$H" > "$DEST/version.json"
# Give every script in the live index.html the same ?v= number, so a new deploy always reaches players' browsers.
if [ "$N" -gt 0 ] 2>/dev/null; then sed -i -E "s/\?v=[0-9]+/?v=$N/g" "$DEST/index.html"; fi
