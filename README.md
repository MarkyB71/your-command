# Your Influence Command

Source for https://your-command.adalia.academy

- `public_html/` mirrors the live site (except `config.php` and `cache/`, which stay on the server only).
- Deploy: cPanel › Git Version Control › Manage › Pull or Deploy › "Update from Remote", then "Deploy HEAD Commit". `.cpanel.yml` copies `public_html/` over the live folder.
- Before each deploy, back up changed files to `~/stock-backups` as before.
