<?php
// Lot leases (Mark, 5 Nov 2026 – test ?beta=1) – who leases which lots on ANY asteroid, and the owner's lease offer.
// Public game data only. Gentle on the game's server: one shared answer per asteroid, kept for 30 minutes,
// read 500 lots per request with a short pause between requests.
// ?a=<asteroid number>  or  ?n=<asteroid name>
require __DIR__ . '/_api.php';
const LL_KEEP = 1800;     // 30 minutes per asteroid
const LL_PAUSE = 300000;  // 0.3 s between requests
const LL_MAX_PAGES = 60;  // 30,000 lots at most (Adalia Prime has about 5,500 leased)

$aid = intval($_GET['a'] ?? 0);
$name = trim((string)($_GET['n'] ?? ''));
if ($aid <= 0 && $name === '') fail(400, 'Pick an asteroid by name or number.');

// ---- fair-use limit (same as the other look-ups) – only for answers not already kept ----
function ll_limit() {
  global $CACHE;
  $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
  $rf = $CACHE . '/rl_' . sha1($ip) . '.json';
  $now = time();
  $hits = is_file($rf) ? (json_decode(file_get_contents($rf), true) ?: []) : [];
  $hits = array_values(array_filter($hits, fn($t) => is_int($t) && $t > $now - RATE_WINDOW));
  if (count($hits) >= RATE_MAX) { header('Retry-After: ' . RATE_WINDOW); fail(429, 'Too many look-ups from your connection. Please wait a few minutes and try again.'); }
  $hits[] = $now;
  @file_put_contents($rf, json_encode($hits), LOCK_EX);
}

// ---- find the asteroid ----
if ($aid <= 0) {
  ll_limit();
  [$found] = search('asteroid_v1', ['size' => 5, '_source' => ['id', 'Name'], 'query' => ['match_phrase' => ['Name.name' => $name]]]);
  foreach ($found as $f) if (strcasecmp($f['Name']['name'] ?? '', $name) === 0) { $aid = $f['id']; break; }
  if ($aid <= 0 && $found) $aid = $found[0]['id'];
  if ($aid <= 0) fail(404, 'No asteroid called "' . $name . '" was found.');
}
if ($aid > 250000) fail(400, 'Asteroid numbers go from 1 to 250,000.');

$cf = $CACHE . '/lotleases_' . $aid . '.json';
if (is_file($cf) && time() - filemtime($cf) < LL_KEEP) { readfile($cf); exit; }
ll_limit();

[$ast] = search('asteroid_v1', ['size' => 1, '_source' => ['id', 'Name', 'Control', 'PrepaidPolicies', 'PublicPolicies', 'ContractPolicies'],
  'query' => ['term' => ['id' => $aid]]]);
if (!$ast) fail(404, 'Asteroid #' . $aid . ' was not found.');
$A = $ast[0];
$offer = null;
foreach ($A['PrepaidPolicies'] ?? [] as $p) if (intval($p['permission'] ?? 0) === 1)
  $offer = ['rate' => intval($p['rate'] ?? 0), 'minTerm' => intval($p['initialTerm'] ?? 0), 'notice' => intval($p['noticePeriod'] ?? 0)];
$public = false;
foreach ($A['PublicPolicies'] ?? [] as $p) if (intval($p['permission'] ?? 0) === 1) $public = true;
$contract = false;
foreach ($A['ContractPolicies'] ?? [] as $p) if (intval($p['permission'] ?? 0) === 1) $contract = true;
$admin = intval($A['Control']['controller']['id'] ?? 0);

// ---- every lot on it with a lease running now (500 per request, by lot number) ----
$now = time();
$leases = []; $last = 0;
for ($pg = 0; $pg < LL_MAX_PAGES; $pg++) {
  if ($pg) usleep(LL_PAUSE);
  $filter = [['term' => ['Location.location.id' => $aid]], ['term' => ['Location.location.label' => 3]],
    ['nested' => ['path' => 'PrepaidAgreements', 'query' => ['range' => ['PrepaidAgreements.endTime' => ['gt' => $now]]]]]];
  if ($last) $filter[] = ['range' => ['id' => ['gt' => $last]]];
  $r = try_search('lot_v1', ['size' => 500, 'sort' => [['id' => 'asc']], '_source' => ['id', 'PrepaidAgreements'], 'query' => ['bool' => ['filter' => $filter]]]);
  if ($r === null) fail(502, 'Influence did not answer (lots). Please try again in a minute.');
  foreach ($r[0] as $lot) {
    $last = max($last, $lot['id']);
    foreach ($lot['PrepaidAgreements'] ?? [] as $p) {
      if (intval($p['permission'] ?? 0) !== 1 || intval($p['endTime'] ?? 0) <= $now) continue;
      // [lot number on the rock, tenant crew, rate (SWAY x1e6 per hour), lease ends]
      $leases[] = [intdiv($lot['id'], 4294967296), intval($p['permitted']['id'] ?? 0), intval($p['rate'] ?? 0), intval($p['endTime'])];
    }
  }
  if (count($r[0]) < 500) break;
}

// ---- tenant and administrator crew names ----
$crews = [];
$ids = array_values(array_unique(array_filter(array_merge([$admin], array_map(fn($l) => $l[1], $leases)))));
foreach (array_chunk($ids, 500) as $chunk) {
  usleep(LL_PAUSE);
  $r = try_search('crew_v1', ['size' => 500, '_source' => ['id', 'Name'], 'query' => ['terms' => ['id' => $chunk]]]);
  if ($r) foreach ($r[0] as $c) if (!empty($c['Name']['name'])) $crews[$c['id']] = $c['Name']['name'];
}

$out = json_encode(['id' => $aid, 'name' => $A['Name']['name'] ?? null, 'admin' => $admin, 'offer' => $offer,
  'public' => $public, 'contract' => $contract, 'leases' => $leases, 'crews' => (object)$crews, 'fetched' => $now]);
@file_put_contents($cf . '.tmp', $out, LOCK_EX); @rename($cf . '.tmp', $cf);
echo $out;
