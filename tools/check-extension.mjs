// Checks for Skippy's Command Deck (the browser extension).
// Run:  node tools/check-extension.mjs        (from the repo root; needs Node + Playwright's Chromium)
// Runs by itself on GitHub whenever extension/ or the download zip changes (.github/workflows/checks.yml).
//
// Part 1 – the files: manifest is sound, every file it names exists, every script parses,
//          no remote code / eval (Chrome Web Store rule), permissions haven't grown,
//          CHANGES.md has the version, the download zip matches the folder.
// Part 2 – a real Chromium with the extension loaded, on stand-in copies of the site and the game
//          (no wallet or log-in needed): it starts, the site sees it, "in game" links work and bad
//          ones are refused, the S button docks in the side bar, lot colours / hide used deposits
//          run without errors, and the options page saves.
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const EXT = path.join(ROOT, 'extension');
const ZIP = path.join(ROOT, 'public_html/downloads/skippys-command-deck.zip');
const SITE = 'https://your-command.adalia.academy';
const GAME = 'https://game.influenceth.io';

// What the extension is allowed to ask for. Growing this list is a deliberate change.
const ALLOWED_PERMS = ['scripting', 'storage'];
const ALLOWED_HOSTS = [GAME + '/*', SITE + '/*'];

let fails = 0, warns = 0;
const ok = m => console.log('  ✓ ' + m);
const GH = !!process.env.GITHUB_ACTIONS;    // on GitHub: also show each problem as a note on the run page
const bad = m => { fails++; console.log('  ✗ ' + m); if (GH) console.log('::error::' + m.replace(/\n/g, ' ')); };
const warn = m => { warns++; console.log('  ! ' + m); if (GH) console.log('::warning::' + m.replace(/\n/g, ' ')); };
const check = (cond, good, fail) => cond ? ok(good) : bad(fail || good);

// ---------- Part 1: the files ----------
console.log('Part 1 – files');
const man = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8'));
const V = man.version;
check(man.manifest_version === 3, 'Manifest V3');
check(/^\d+\.\d+\.\d+$/.test(V), 'version ' + V);

const named = new Set();
(man.content_scripts || []).forEach(c => (c.js || []).concat(c.css || []).forEach(f => named.add(f)));
if (man.background && man.background.service_worker) named.add(man.background.service_worker);
Object.values(man.icons || {}).forEach(f => named.add(f));
Object.values((man.action && man.action.default_icon) || {}).forEach(f => named.add(f));
(man.web_accessible_resources || []).forEach(w => (w.resources || []).forEach(f => named.add(f)));
if (man.options_ui) named.add(man.options_ui.page);
const missing = [...named].filter(f => !fs.existsSync(path.join(EXT, f)));
check(!missing.length, 'every file the manifest names exists (' + named.size + ')', 'missing: ' + missing.join(', '));

const jsFiles = fs.readdirSync(EXT).filter(f => f.endsWith('.js'));
for (const f of jsFiles) {
  try { execFileSync(process.execPath, ['--check', path.join(EXT, f)], { stdio: 'pipe' }); ok(f + ' parses'); }
  catch (e) { bad(f + ' does not parse: ' + String(e.stderr).split('\n').slice(0, 3).join(' ')); }
}

const code = jsFiles.concat(fs.readdirSync(EXT).filter(f => f.endsWith('.html')))
  .map(f => [f, fs.readFileSync(path.join(EXT, f), 'utf8')]);
const remote = code.filter(([, s]) => /<script[^>]+src=["']https?:|import\s*\(\s*["']https?:|importScripts\s*\(\s*["']https?:/.test(s)).map(([f]) => f);
check(!remote.length, 'no code loaded from the internet', 'remote code in: ' + remote.join(', '));
const evals = code.filter(([, s]) => /\beval\s*\(|new\s+Function\s*\(|setTimeout\s*\(\s*["'`]|setInterval\s*\(\s*["'`]/.test(s)).map(([f]) => f);
check(!evals.length, 'no eval / new Function', 'eval-style code in: ' + evals.join(', '));
const inline = code.filter(([f, s]) => f.endsWith('.html') && /<script(?![^>]*\bsrc=)[^>]*>\s*\S/.test(s)).map(([f]) => f);
check(!inline.length, 'no inline scripts in extension pages', 'inline <script> (blocked in MV3) in: ' + inline.join(', '));

const perms = man.permissions || [], hosts = man.host_permissions || [];
const extraP = perms.filter(p => !ALLOWED_PERMS.includes(p)), extraH = hosts.filter(h => !ALLOWED_HOSTS.includes(h));
check(!extraP.length && !extraH.length, 'permissions unchanged (' + perms.join(', ') + '; 2 sites)',
  'NEW permissions – the Web Store will re-review and players get a warning: ' + extraP.concat(extraH).join(', '));
const csHosts = (man.content_scripts || []).flatMap(c => c.matches || []).filter(h => !ALLOWED_HOSTS.includes(h));
check(!csHosts.length, 'scripts only run on the site and the game', 'scripts run on other sites: ' + csHosts.join(', '));

const changes = fs.existsSync(path.join(EXT, 'CHANGES.md')) ? fs.readFileSync(path.join(EXT, 'CHANGES.md'), 'utf8') : '';
check(new RegExp('^## ' + V.replace(/\./g, '\\.') + '\\b', 'm').test(changes), 'CHANGES.md has ' + V, 'CHANGES.md has no "## ' + V + '" entry');

// Download zip: same version = must be the same files; older = fine while testing, but say so.
if (!fs.existsSync(ZIP)) bad('download zip missing: ' + path.relative(ROOT, ZIP));
else {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zipchk-'));
  execFileSync('unzip', ['-q', ZIP, '-d', tmp]);
  const mf = execFileSync('find', [tmp, '-name', 'manifest.json']).toString().trim().split('\n')[0];
  const zdir = path.dirname(mf), zv = JSON.parse(fs.readFileSync(mf, 'utf8')).version;
  const list = d => execFileSync('find', [d, '-type', 'f']).toString().trim().split('\n').map(f => path.relative(d, f)).sort();
  if (zv === V) {
    const zl = list(zdir), need = list(EXT).filter(f => !/\.md$/.test(f));
    const diff = need.filter(f => !zl.includes(f) || !fs.readFileSync(path.join(zdir, f)).equals(fs.readFileSync(path.join(EXT, f))));
    const extra = zl.filter(f => !need.includes(f));
    check(!diff.length && !extra.length, 'download zip matches the folder (' + V + ')',
      'download zip is ' + V + ' but differs: ' + diff.concat(extra).join(', ') + ' – rebuild the zip');
  } else {
    const newer = V.split('.').map(Number).reduce((a, n, i) => a || (n - +zv.split('.')[i]), 0) > 0;
    newer ? warn('download zip is still ' + zv + ' (folder is ' + V + ') – fine while ' + V + ' is in testing; rebuild it before release')
          : bad('download zip (' + zv + ') is NEWER than the folder (' + V + ')');
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}

// ---------- Part 2: a real browser ----------
console.log('Part 2 – in Chromium (stand-in site and game pages)');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { bad('Playwright not installed – browser checks skipped'); finish(); }

const SITE_HTML = `<!doctype html><html><head><title>site</title></head><body><h1>Command Deck stand-in</h1></body></html>`;
const GAME_HTML = `<!doctype html><html><head><title>game</title></head><body>
  <div id="bar"><div class="hudBtn" data-tooltip-id="hudMenuTooltip">A</div><div class="hudBtn" data-tooltip-id="hudMenuTooltip">B</div>
  <div class="hudBtn on" data-tooltip-id="hudMenuTooltip">C</div></div>
  <div id="usedTxt" data-on="1" onclick="this.dataset.on=this.dataset.on==='1'?'0':'1'">Show Used Deposits</div>
</body></html>`;

const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'extprof-'));
const ctx = await chromium.launchPersistentContext(prof, {
  headless: true, channel: 'chromium',
  args: ['--disable-extensions-except=' + EXT, '--load-extension=' + EXT]
});
const errs = [];
try {
  await ctx.route(/^https?:/, r => {      // web only – the extension's own files must load normally
    const u = r.request().url();
    if (u.startsWith(SITE)) return r.fulfill({ contentType: 'text/html', body: SITE_HTML });
    if (u.startsWith(GAME)) return r.fulfill({ contentType: 'text/html', body: GAME_HTML });
    return r.abort();
  });
  let sw = ctx.serviceWorkers()[0];
  if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 10000 }).catch(() => null);
  check(!!sw, 'extension starts (background worker running)', 'background worker did not start');
  const extId = sw ? sw.url().split('/')[2] : '';
  ctx.on('page', p => { p.on('pageerror', e => errs.push(p.url() + ': ' + e.message)); });
  if (sw) sw.on('console', m => { if (m.type() === 'error') errs.push('background: ' + m.text()); });

  // Site sees the extension
  const site = await ctx.newPage();
  site.on('pageerror', e => errs.push('site: ' + e.message));
  await site.goto(SITE + '/');
  const seen = await site.waitForFunction(() => document.documentElement.dataset.yicGameExt, null, { timeout: 5000 }).then(h => h.jsonValue()).catch(() => null);
  check(seen === V, 'site sees the extension (version ' + seen + ')', 'site does not see the extension');

  // "in game" link: no game tab yet → opens one at that place
  const ask = p => site.evaluate(p => new Promise(res => {
    const on = e => { if (e.data && e.data.type === 'yic-open-result' && e.data.path === p) { removeEventListener('message', on); res(e.data.result); } };
    addEventListener('message', on);
    postMessage({ type: 'yic-open', path: p }, location.origin);
    setTimeout(() => res('no answer'), 4000);
  }), p);
  const tabWait = ctx.waitForEvent('page', { timeout: 5000 }).catch(() => null);
  const r1 = await ask('/building/123');
  const gtab = await tabWait;
  if (gtab) await gtab.waitForURL(GAME + '/**', { timeout: 5000 }).catch(() => {});
  if (gtab) await gtab.waitForLoadState('load').catch(() => {});
  check(r1 && r1.ok && r1.mode === 'new-tab' && gtab && gtab.url() === GAME + '/building/123', 'in-game link opens the game at /building/123',
    'in-game link failed: ' + JSON.stringify(r1));

  // Game tab open now → same tab, no reload
  if (gtab) {
    await new Promise(r => setTimeout(r, 1500));     // let the game page settle
    await gtab.evaluate(() => { window.__stay = 1; });
    await new Promise(r => setTimeout(r, 800));     // the 0.7 s limit
    const r2 = await ask('/ship/7');
    await new Promise(r => setTimeout(r, 300));
    const same = await gtab.evaluate(() => [location.pathname, window.__stay]).catch(() => []);
    check(r2 && r2.ok && r2.mode === 'same-tab' && same[0] === '/ship/7' && same[1] === 1, 'second link moves the open game tab without reloading',
      'same-tab move failed: ' + JSON.stringify(r2) + ' ' + JSON.stringify(same));
  }

  // Bad requests are refused
  await new Promise(r => setTimeout(r, 800));
  for (const p of ['/building/1/../../x', 'https://evil.example/', '/settings', '/building/abc']) {
    const r = await ask(p);
    await new Promise(r => setTimeout(r, 800));   // so the 0.7 s limit can't hide a wrong "yes"
    check(r && r.ok === false && r.error === 'bad request', 'refuses ' + p, 'ACCEPTED bad path ' + p + ': ' + JSON.stringify(r));
  }
  const fast = [await ask('/lot/1'), await ask('/lot/2')];
  check(fast[1] && fast[1].ok === false, 'two links within 0.7 s: the second is held back', 'rate limit not working: ' + JSON.stringify(fast));

  // Game page: S button docks after the last side bar button, with the usual button class.
  // A fresh game tab, so nothing from the link tests above can get in the way.
  const game = await ctx.newPage();
  await game.goto(GAME + '/');
  const what = () => game.evaluate(() => location.href + ' · ' + document.body.innerHTML.replace(/\s+/g, ' ').slice(0, 160)).catch(e => e.message);
  if (game) {
    const gtab = game;
    const dock = await gtab.waitForFunction(() => {
      const s = document.getElementById('yic-s'); const bar = document.getElementById('bar');
      return s && s.parentElement === bar && bar.lastElementChild === s && s.className === 'hudBtn' && s.querySelector('img').naturalWidth > 0;
    }, null, { timeout: 5000 }).then(() => true).catch(() => false);
    check(dock, 'S button sits at the bottom of the game side bar, game look, icon loads', 'S button not docked properly: ' + await what());
    const unticked = await gtab.waitForFunction(() => document.getElementById('usedTxt').dataset.on === '0', null, { timeout: 3000 }).then(() => true).catch(() => false);
    check(unticked, '"Show Used Deposits" unticked once', '"Show Used Deposits" was not unticked');
    await gtab.click('#usedTxt'); await new Promise(r => setTimeout(r, 1000));
    check(await gtab.evaluate(() => document.getElementById('usedTxt').dataset.on === '1'), 'you can tick it back on (it stays ticked)', 'it unticked itself again');
    const lc = await gtab.evaluate(() => document.documentElement.dataset.yicLotColours || '');
    ok('lot colours script ran (' + (lc || 'no game store on the stand-in page – expected') + ')');
    const tabsBefore = ctx.pages().length;
    await gtab.click('#yic-s'); await new Promise(r => setTimeout(r, 800));
    check(ctx.pages().length === tabsBefore, 'S button goes back to the open Command Deck tab (no new tab)', 'S button opened another tab');
  }

  // Options page: shows, saves, and the game reads it
  const op = await ctx.newPage();
  await op.goto('chrome-extension://' + extId + '/' + man.options_ui.page);
  await new Promise(r => setTimeout(r, 800));
  const boxes = await op.$$eval('input[type=checkbox]', b => b.map(x => [x.name, x.checked]));
  check(boxes.length >= 3 && boxes.every(b => b[1]), 'options page shows ' + boxes.length + ' choices, all on by default', 'options page: ' + JSON.stringify(boxes));
  await op.click('input[name=sideButton]');
  await op.waitForFunction(() => document.getElementById('saved').textContent === 'Saved', null, { timeout: 3000 }).catch(() => {});
  const g2 = await ctx.newPage();
  await g2.goto(GAME + '/');
  await new Promise(r => setTimeout(r, 1500));
  const opts = await g2.evaluate(() => [document.documentElement.dataset.yicOpts, !!document.getElementById('yic-s')]);
  check(opts[0] && JSON.parse(opts[0]).sideButton === false && !opts[1], 'switching the S button off in options works', 'option not applied: ' + JSON.stringify(opts));
  await op.click('input[name=sideButton]');

  check(!errs.length, 'no script errors anywhere', 'script errors:\n      ' + errs.join('\n      '));
} catch (e) {
  bad('browser check crashed: ' + e.message);
} finally {
  await ctx.close();
  fs.rmSync(prof, { recursive: true, force: true });
}
finish();

function finish() {
  console.log('\n' + (fails ? '✗ ' + fails + ' problem(s)' : '✓ All extension checks passed') + (warns ? ' · ' + warns + ' note(s)' : '') + ' – version ' + V);
  process.exit(fails ? 1 : 0);
}
