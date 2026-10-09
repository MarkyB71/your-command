<?php
// Influence Stock – server helper. Reads public game data only; never changes anything in the game.
require __DIR__ . '/_api.php';

// ---- which wallet ----
$default = std_addr(DEFAULT_WALLET);
$wallet = isset($_GET['wallet']) && $_GET['wallet'] !== '' ? std_addr($_GET['wallet']) : $default;
if (!$wallet) fail(400, 'That is not a valid wallet address.');
$allowed = ALLOWED_WALLETS;
if ($wallet !== $default && !in_array('*', $allowed, true) && !in_array($wallet, array_map('std_addr', $allowed), true)) {
  fail(403, 'This server is not set up to show that wallet.');
}

// ---- short cache ----
$cf = $CACHE . '/stock_' . sha1($wallet) . '.json';
if (is_file($cf) && time() - filemtime($cf) < CACHE_SECONDS) { readfile($cf); exit; }

// ---- fair use: limit fresh look-ups per visitor (protects the API key and the server) ----
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rf = $CACHE . '/rl_' . sha1($ip) . '.json';
$now = time();
$hits = is_file($rf) ? (json_decode(file_get_contents($rf), true) ?: []) : [];
$hits = array_values(array_filter($hits, fn($t) => is_int($t) && $t > $now - RATE_WINDOW));
if (count($hits) >= RATE_MAX) { header('Retry-After: ' . RATE_WINDOW); fail(429, 'Too many look-ups from your connection. Please wait a few minutes and try again.'); }
$hits[] = $now;
@file_put_contents($rf, json_encode($hits), LOCK_EX);

// ---- now and then, tidy old cache files ----
if (mt_rand(1, 20) === 1) {
  foreach (array_merge(glob($CACHE . '/stock_*.json') ?: [], glob($CACHE . '/rl_*.json') ?: []) as $old) {
    if (@filemtime($old) < $now - KEEP_FILES) @unlink($old);
  }
}

// ---- crews owned or delegated ----
[$crews] = search('crew_v1', [
  'size' => 500, '_source' => ['id', 'Name', 'Crew', 'Location', 'meta', 'Ship', 'Station'],
  'query' => ['bool' => ['should' => [
    ['term' => ['Crew.delegatedTo' => $wallet]],
    ['term' => ['Nft.owners.starknet' => $wallet]],
  ], 'minimum_should_match' => 1]],
]);
$crewIds = array_map(fn($c) => $c['id'], $crews);

// ---- every building these crews control (storage and production) ----
$allBuildings = [];
if ($crewIds) {
  // skip Building.status 0 (unplanned / removed sites) – no page uses them and they doubled the data. Planned sites (status 1) are kept.
  $q = ['bool' => ['filter' => [['terms' => ['Control.controller.id' => $crewIds]]], 'must_not' => [['term' => ['Building.status' => 0]]]]];
  for ($from = 0; $from < 10000; $from += 500) {
    [$docs, $total] = search('building_v1', [
      'from' => $from, 'size' => 500, 'query' => $q, 'sort' => [['id' => 'asc']],
      '_source' => ['id', 'Name', 'Building', 'Extractors', 'Processors', 'DryDocks', 'Inventories', 'meta.asteroid', 'Location.locations', 'Control'],
    ]);
    $allBuildings = array_merge($allBuildings, $docs);
    if (!$docs || count($allBuildings) >= $total) break;
  }
}

// ---- ships controlled by these crews (never breaks the page) ----
$ships = []; $shipErr = null;
if ($crewIds) {
  $r = try_search('ship_v1', ['size' => 500, 'query' => ['bool' => ['filter' => [['terms' => ['Control.controller.id' => $crewIds]]]]]]);
  if ($r) $ships = $r[0]; else $shipErr = 'ship search failed';
}

// ---- remember one ship id per type/variant, so shipimg.php can fetch that picture once ----
$svf = $CACHE . '/shipvariants.json';
$sv = is_file($svf) ? (json_decode(file_get_contents($svf), true) ?: []) : [];
$svNew = false;
foreach ($ships as $sh) {
  $k = intval($sh['Ship']['shipType'] ?? 0) . '_' . intval($sh['Ship']['variant'] ?? 1);
  if (!isset($sv[$k]) && !empty($sh['id'])) { $sv[$k] = intval($sh['id']); $svNew = true; }
}
if ($svNew) @file_put_contents($svf, json_encode($sv), LOCK_EX);

// ---- asteroids this wallet owns or its crews control, with how many lots are in use (never breaks the page) ----
$owned = []; $astErr = null;
$r = try_search('asteroid_v1', ['size' => 200, 'query' => ['bool' => ['should' => [['term' => ['Nft.owners.starknet' => $wallet]], ['terms' => ['Control.controller.id' => $crewIds ?: [0]]]], 'minimum_should_match' => 1]], '_source' => ['id', 'Name', 'Celestial', 'Orbit', 'Control', 'Nft.owners']]);
if ($r === null) $astErr = 'asteroid search failed';
else {
  $owned = $r[0];
  foreach (array_slice(array_keys($owned), 0, 50) as $i) {
    $uuid = '0x' . dechex(intval($owned[$i]['id']) * 65536 + 3);
    $c = try_search('building_v1', ['size' => 0, 'track_total_hits' => true, 'query' => ['bool' => ['filter' => [
      ['nested' => ['path' => 'Location.locations', 'query' => ['term' => ['Location.locations.uuid' => $uuid]]]], ['range' => ['Building.status' => ['gte' => 1]]]]]]]);
    $owned[$i]['lotsUsed'] = $c ? $c[1] : null;
  }
  // remember these ids so aimg.php may fetch their pictures
  $af = $CACHE . '/astids.json';
  $known = is_file($af) ? (json_decode(file_get_contents($af), true) ?: []) : [];
  $n0 = count($known);
  foreach ($owned as $o) if (!empty($o['id'])) $known[intval($o['id'])] = 1;
  if (count($known) !== $n0) @file_put_contents($af, json_encode($known), LOCK_EX);
}

// ---- open market orders placed by these crews (never breaks the page) ----
$orders = []; $ordErr = null;
if ($crewIds) {
  $r = try_search('order_v1', ['size' => 1000, 'query' => ['bool' => ['filter' => [['terms' => ['crew.id' => $crewIds]], ['term' => ['status' => 1]]]]]]);
  if ($r === null) $ordErr = 'order search failed'; else $orders = $r[0];
}

// ---- crewmates on these crews, for the Travel page's engine bonus (never breaks the page) ----
$crewmates = [];
$mateIds = [];
foreach ($crews as $c) foreach (($c['Crew']['roster'] ?? []) as $m) $mateIds[] = intval($m);
if ($mateIds) {
  $r = try_search('crewmate_v1', ['size' => 500, 'query' => ['terms' => ['id' => array_values(array_unique($mateIds))]], '_source' => ['id', 'Crewmate']]);
  if ($r) foreach ($r[0] as $cm) if (isset($cm['id'])) $crewmates[$cm['id']] = $cm['Crewmate'] ?? null;
  // remember these ids so cimg.php may fetch their portraits
  $mf = $CACHE . '/mateids.json';
  $known = is_file($mf) ? (json_decode(file_get_contents($mf), true) ?: []) : [];
  $n0 = count($known);
  foreach ($mateIds as $m) if ($m > 0) $known[$m] = 1;
  if (count($known) !== $n0) @file_put_contents($mf, json_encode($known), LOCK_EX);
}

// ---- leases on the lots under these buildings (never breaks the page) ----
$leases = []; $leaseErr = null;
$lotIds = [];
foreach ($allBuildings as $b) {
  if (intval($b['Building']['status'] ?? 0) < 1) continue;
  foreach (($b['Location']['locations'] ?? []) as $l) if (intval($l['label'] ?? 0) === 4) $lotIds[] = intval($l['id']);
}
$lotIds = array_values(array_unique($lotIds));
foreach (array_chunk($lotIds, 500) as $chunk) {
  $r = try_search('lot_v1', ['size' => 500, '_source' => ['id', 'UseLot', 'PrepaidAgreements', 'ContractAgreements', 'WhitelistAgreements'], 'query' => ['terms' => ['id' => $chunk]]]);
  if ($r === null) { $leaseErr = 'lease search failed'; break; }
  foreach ($r[0] as $lot) {
    $ag = [];
    foreach (['PrepaidAgreements' => 'P', 'ContractAgreements' => 'C', 'WhitelistAgreements' => 'W'] as $k => $t) {
      foreach (($lot[$k] ?? []) as $a) $ag[] = [$t, intval($a['permitted']['id'] ?? 0), intval($a['startTime'] ?? 0), intval($a['endTime'] ?? 0), intval($a['noticeTime'] ?? 0), intval($a['rate'] ?? 0)];
    }
    $tenant = intval($lot['UseLot']['tenant']['id'] ?? 0);
    if ($ag || $tenant) $leases[] = [intval($lot['id']), $tenant, $ag];
  }
}

// ---- stations the crews live in (for habitat bonus) ----
$stations = []; $stIds = [];
foreach ($crews as $c) { $l = $c['Location']['location'] ?? null; if ($l && intval($l['label'] ?? 0) === 5) $stIds[] = intval($l['id']); }
$stIds = array_values(array_unique($stIds));
if ($stIds) {
  $r = try_search('building_v1', ['size' => 200, '_source' => ['id', 'Station', 'Building.buildingType'], 'query' => ['terms' => ['id' => array_slice($stIds, 0, 200)]]]);
  if ($r !== null) foreach ($r[0] as $b) $stations[intval($b['id'])] = [intval($b['Station']['stationType'] ?? 0), intval($b['Station']['population'] ?? 0), intval($b['Building']['buildingType'] ?? 0)];
}

$out = json_encode(['wallet' => $wallet, 'fetched' => $now, 'crews' => $crews, 'allBuildings' => $allBuildings, 'ships' => $ships, 'shipErr' => $shipErr, 'owned' => $owned, 'astErr' => $astErr, 'orders' => $orders, 'ordErr' => $ordErr, 'crewmates' => (object)$crewmates, 'leases' => $leases, 'leaseErr' => $leaseErr, 'stations' => (object)$stations]);
@file_put_contents($cf, $out, LOCK_EX);
echo $out;