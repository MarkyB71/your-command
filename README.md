# Your Influence Command

Source for https://your-command.adalia.academy

- `public_html/` mirrors the live site (except `config.php` and `cache/`, which stay on the server only).
- Deploy: cPanel › Git Version Control › Manage › Pull or Deploy › "Update from Remote", then "Deploy HEAD Commit". `.cpanel.yml` copies `public_html/` over the live folder.
- Before each deploy, back up changed files to `~/stock-backups` as before.

## Automatic checks (GitHub › Actions)
- **Site checks** – on every change to `public_html/`: every script must parse, then a real browser opens the site twice (as everyone sees it, and with `?beta=1`) and clicks every deck and every page. Fails on script errors, empty pages or missing files. Game data comes from the live site, read only. Green ✓ = safe to deploy in cPanel. Run by hand: `node tools/check-site.mjs`.
- **Extension checks** – on every change to `extension/`. See `extension/README.md`.
