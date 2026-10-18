# Changelog – Your Influence Command

## Version 200 – 18 Oct 2026 – one file per page (the big code change)
- Every page now has its own file in `public_html/pages/` (ships, crews, products, deliveries,
  contents, status, leases, market, trade, travel, workload, samples, search, asteroids, lotres).
- `app.js` still loads your data, builds the menu and holds shared helpers; pages reach them through `window.YIC`.
- Ships page: Docked / In orbit / In flight colour tags.
- Last version before this change: app.js v160 / chain.js v59 (git commit 80cd022). To roll back,
  restore `public_html/app.js` and `public_html/index.html` from that commit and deploy.

## SkippyChain – chain.js v59 – 18 Oct 2026
- "◂ Made from" / "Used in ▸" buttons on every box; Used in opens one level by default.
