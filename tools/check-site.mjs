// Site checks for Skippy's Command Deck – clicks every deck and every page in a real Chromium.
// Runs by itself on GitHub on every push that changes public_html/ (.github/workflows/site-checks.yml),
// so a red ✗ shows up BEFORE the new version is deployed in cPanel.
//
// How it works: the NEW pages and scripts from GitHub are served on this machine; the game data the
// pages ask for (api.php, market.php, …) comes from the LIVE site, read only. Pictures are stand-ins,
// "Report a problem" is never really sent, and nothing else on the internet is reached.
// Each run goes through the site twice: as everyone sees it, and with ?beta=1 (the tests).
//
// Run:   node tools/check-site.mjs                      (live game data – needs the internet)
//        node tools/check-site.mjs --data saved.json    (saved answers instead of the live site)
import fs from 'fs';
import path from 'path';
import http from 'http';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const WEB = path.join(ROOT, 'public_html');
const LIVE = 'https://your-command.adalia.academy';
const argi = process.argv.indexOf('--data');
const SAVED = argi > 0 ? JSON.parse(fs.readFileSync(process.argv[argi + 1], 'utf8')) : null;
const GH = !!process.env.GITHUB_ACTIONS;
// The site's own wallet (Skippy's) – the one the site shows by default. Public game data.
const WALLET = '0x0631aCdbF5a79758CbCC84301b387aEbFB5C0ec7476aA48a0CeB98662973C5ce';
let commit = 'local';
try { commit = execFileSync('git', ['-C', ROOT, 'rev-parse', '--short', 'HEAD']).toString().trim(); } catch (e) {}

let fails = 0, warns = 0;
const ok = m => console.log('  ✓ ' + m);
const bad = m => { fails++; console.log('  ✗ ' + m); if (GH) console.log('::error::' + m.replace(/\n/g, ' ')); };
const warn = m => { warns++; console.log('  ! ' + m); if (GH) console.log('::warning::' + m.replace(/\n/g, ' ')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

// ---------- Part 1: every script parses ----------
console.log('Part 1 – every script parses');
const scripts = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.js') && !/\.min\.js$|three|GLTFLoader|OrbitControls|BufferGeometryUtils/.test(f)) scripts.push(p);
  }
})(WEB);
let parsed = 0;
for (const f of scripts) {
  const src = fs.readFileSync(f, 'utf8');
  const mod = /^\s*(import|export)\s/m.test(src);
  try {
    execFileSync(process.execPath, mod ? ['--input-type=module', '--check'] : ['--check', f], { input: mod ? src : undefined, stdio: ['pipe', 'pipe', 'pipe'] });
    parsed++;
  } catch (e) { bad(path.relative(ROOT, f) + ' does not parse: ' + String(e.stderr).split('\n').filter(Boolean).slice(0, 4).join(' ')); }
}
if (parsed === scripts.length) ok('all ' + parsed + ' scripts parse');

// ---------- Part 2: a real browser ----------
console.log('Part 2 – every deck and page in Chromium (' + (SAVED ? 'saved game data' : 'live game data, read only') + ')');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { bad('Playwright not installed – browser checks skipped'); finish(); }

// The new site files, served here
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/version.json') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ n: 'check', date: '', commit })); }
  let p = path.normalize(path.join(WEB, decodeURIComponent(u.pathname)));
  if (!p.startsWith(WEB)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!fs.existsSync(p)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const IMG = /^\/(rimg|bimg|cimg|aimg|shipimg|_img)\.php$/;

// Saved answers: exact match, or orbits put together from the saved ones
let ORB = null;
function savedAnswer(key) {
  if (SAVED[key]) return SAVED[key];
  const k = key.split('?')[0];
  if (k === 'orbits.php') {
    if (!ORB) { ORB = {}; for (const [kk, v] of Object.entries(SAVED)) if (kk.startsWith('orbits.php')) Object.assign(ORB, JSON.parse(v.b).orbits || {}); }
    const ids = (new URLSearchParams(key.split('?')[1] || '').get('ids') || '').split(',');
    const o = {}; ids.forEach(i => { if (ORB[i]) o[i] = ORB[i]; });
    return { s: 200, t: 'application/json', b: JSON.stringify({ orbits: o }) };
  }
  const same = Object.keys(SAVED).find(kk => kk.split('?')[0] === k);       // e.g. another history range
  return same ? SAVED[same] : null;
}

const browser = await chromium.launch({ args: ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1'] });
const tally = { live: 0, cached: 0 };
const liveCache = new Map();                 // each live answer fetched once per run (gentle on the server)

for (const pass of [{ name: 'as everyone sees it', q: '?wallet=' + WALLET }, { name: 'with ?beta=1 (tests)', q: '?wallet=' + WALLET + '&beta=1' }]) {
  console.log('  — ' + pass.name);
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const errs = [], missing = new Set(), dataFails = new Set();

  await ctx.route(/^https?:/, async route => {
    const req = route.request(), u = new URL(req.url());
    if (u.host !== new URL(BASE).host) return route.abort();            // nothing else on the internet
    if (!u.pathname.endsWith('.php')) return route.continue();          // the new site files
    if (IMG.test(u.pathname) || (u.pathname === '/sprite.php' && u.searchParams.get('t') !== 'json'))
      return route.fulfill({ contentType: 'image/png', body: PNG });
    if (u.pathname === '/report.php') return route.fulfill({ contentType: 'application/json', body: '{"ok":true,"id":"site-check"}' });
    const key = u.pathname.slice(1) + u.search;
    if (SAVED) {
      const a = savedAnswer(key);
      if (!a) { dataFails.add(key.slice(0, 80) + ' (not saved)'); return route.fulfill({ status: 404, body: '{}' }); }
      return route.fulfill({ status: a.s, contentType: a.t || 'application/json', body: a.b });
    }
    if (req.method() !== 'GET') return route.fulfill({ status: 405, body: '{}' });
    try {
      let a = liveCache.get(key);
      if (a) tally.cached++;
      else {
        const r = await fetch(LIVE + '/' + key, { headers: { 'User-Agent': 'your-command-site-check' } });
        a = { s: r.status, t: r.headers.get('content-type') || 'application/json', b: await r.text() };
        if (r.ok) liveCache.set(key, a);
        tally.live++;
        if (!r.ok) dataFails.add(key.slice(0, 80) + ' → HTTP ' + r.status);
      }
      return route.fulfill({ status: a.s, contentType: a.t, body: a.b });
    } catch (e) { dataFails.add(key.slice(0, 80) + ' → ' + e.message); return route.abort(); }
  });

  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(e.message.split('\n')[0]));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_NAME_NOT_RESOLVED|ERR_FAILED/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  page.on('response', r => { const u = new URL(r.url()); if (u.host === new URL(BASE).host && !u.pathname.endsWith('.php') && r.status() >= 400) missing.add(u.pathname); });
  page.on('dialog', d => d.dismiss());

  // Settled = the main area has stopped changing for a moment
  const settle = async (maxMs) => {
    let last = '', same = 0;
    for (let t = 0; t < maxMs; t += 400) {
      await wait(400);
      const s = await page.evaluate(() => {
        const m = document.querySelector('#main'), r = document.querySelector('#deckroom');
        return ((m && m.innerText) || '').length + '|' + ((r && r.innerText) || '').length + '|' + document.body.innerText.length;
      }).catch(() => '');
      if (s === last) { if (++same >= 3) return; } else { same = 0; last = s; }
    }
  };
  const step = async (label, fn, check) => {
    const before = errs.length;
    try { await fn(); } catch (e) { bad(pass.name + ' · ' + label + ': could not open – ' + e.message.split('\n')[0]); return; }
    await settle(20000);
    const res = await check();
    const newErrs = errs.slice(before);
    if (newErrs.length) bad(pass.name + ' · ' + label + ': script error – ' + [...new Set(newErrs)].slice(0, 3).join(' | '));
    else if (res !== true) bad(pass.name + ' · ' + label + ': ' + res);
    else return true;
  };

  // Load
  const t0 = Date.now();
  const loaded = await step('first load', () => page.goto(BASE + '/' + pass.q, { waitUntil: 'load', timeout: 60000 }), async () => {
    const okLoad = await page.waitForFunction(() => window.YIC && (document.querySelector('button[data-deck]') || (document.querySelector('#main') && document.querySelector('#main').innerText.length > 50)),
      null, { timeout: 60000 }).then(() => true).catch(() => false);
    return okLoad || 'the site never finished loading (stuck on "Loading…"?)';
  });
  if (loaded) ok('loads in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');

  // Every deck
  const decks = await page.$$eval('button[data-deck]', b => [...new Set(b.map(x => x.dataset.deck))]).catch(() => []);
  let dOK = 0;
  for (const d of decks) {
    const r = await step('deck "' + d + '"', () => page.evaluate(d => document.querySelector('button[data-deck="' + d + '"]').click(), d), async () => {
      const n = await page.evaluate(() => { const m = document.querySelector('#main'), r = document.querySelector('#deckroom');
        return ((m && m.offsetParent && m.innerText) || '').length + ((r && r.innerText) || '').length; });
      return n > 30 || 'deck shows nothing';
    });
    if (r) dOK++;
  }
  if (decks.length) { if (dOK === decks.length) ok('all ' + decks.length + ' decks open'); }
  else bad(pass.name + ': no deck tabs found');

  // Every page (the page buttons the decks use)
  const pages = await page.$$eval('[id^="v"]', b => b.filter(x => /^v[A-Z]$/.test(x.id)).map(x => [x.id.slice(1), x.textContent.trim().slice(0, 30)])).catch(() => []);
  let pOK = 0;
  for (const [k, name] of pages) {
    const r = await step('page "' + name + '"', () => page.evaluate(k => document.getElementById('v' + k).click(), k), async () => {
      const info = await page.evaluate(() => {
        const m = document.querySelector('#main'), r = document.querySelector('#deckroom');
        const mt = (m && m.innerText) || '', rt = (r && r.innerText) || '';
        return { n: mt.length + rt.length, text: (mt || rt).replace(/\s+/g, ' ').slice(0, 80) };
      });
      if (info.n < 20) return 'page is empty';
      if (/^\s*Loading/i.test(info.text) && info.n < 60) return 'still "Loading…" after 20 s';
      return true;
    });
    if (r) pOK++;
  }
  if (pages.length && pOK === pages.length) ok('all ' + pages.length + ' pages open and show something');
  if (pages.length < 15) bad(pass.name + ': only ' + pages.length + ' page buttons found (expected 20+)');

  if (missing.size) bad(pass.name + ': site files not found (404): ' + [...missing].join(', '));
  else ok('no missing site files');
  if (dataFails.size) warn(pass.name + ': game data problems (not the new code – the live site or the game): ' + [...dataFails].slice(0, 5).join(' | '));
  await ctx.close();
}
await browser.close();
server.close();
if (!SAVED) console.log('  (live game data: ' + tally.live + ' look-ups, ' + tally.cached + ' re-used)');
finish();

function finish() {
  console.log('\n' + (fails ? '✗ ' + fails + ' problem(s)' : '✓ All site checks passed') + (warns ? ' · ' + warns + ' note(s)' : '') + ' – commit ' + commit);
  process.exit(fails ? 1 : 0);
}
