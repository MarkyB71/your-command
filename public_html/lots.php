<?php
// Your Influence Command – which lots are in use on one of the wallet's asteroids (read-only). Used by the Lot resources page.
require __DIR__ . '/_api.php';

$default = std_addr(DEFAULT_WALLET);
$wallet = isset($_GET['wallet']) && $_GET['wallet'] !== '' ? std_addr($_GET['wallet']) : $default;
if (!$wallet) fail(400, 'That is not a valid wallet address.');
$allowed = ALLOWED_WALLETS;
if ($wallet !== $default && !in_array('*', $allowed, true) && !in_array($wallet, array_map('std_addr', $allowed), true)) {
  fail(403, 'This server is not set up to show that wallet.');
}
$aid = intval($_GET['a'] ?? 0);
if ($aid <= 0) fail(400, 'Missing asteroid.');

// ---- cache for 10 minutes per wallet + asteroid ----
$cf = $CACHE . '/lots_' . $aid . '_' . sha1($wallet) . '.json';
if (is_file($cf) && time() - filemtime($cf) < 600) { readfile($cf); exit; }

// ---- same fair-use limit as api.php ----
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rf = $CACHE . '/rl_' . sha1($ip) . '.json';
$now = time();
$hits = is_file($rf) ? (json_decode(file_get_contents($rf), true) ?: []) : [];
$hits = array_values(array_filter($hits, fn($t) => is_int($t) && $t > $now - RATE_WINDOW));
if (count($hits) >= RATE_MAX) { header('Retry-After: ' . RATE_WINDOW); fail(429, 'Too many look-ups from your connection. Please wait a few minutes and try again.'); }
$hits[] = $now;
@file_put_contents($rf, json_encode($hits), LOCK_EX);

// ---- the asteroid must be owned or controlled by this wallet ----
[$crews] = search('crew_v1', ['size' => 500, '_source' => ['id'], 'query' => ['bool' => ['should' => [
  ['term' => ['Crew.delegatedTo' => $wallet]], ['term' => ['Nft.owners.starknet' => $wallet]]], 'minimum_should_match' => 1]]]);
$crewIds = array_map(fn($c) => $c['id'], $crews);
[$ast] = search('asteroid_v1', ['size' => 1, '_source' => ['id'], 'query' => ['bool' => ['filter' => [['term' => ['id' => $aid]]], 'should' => [
  ['term' => ['Nft.owners.starknet' => $wallet]], ['terms' => ['Control.controller.id' => $crewIds ?: [0]]]], 'minimum_should_match' => 1]]]);
if (!$ast) fail(403, 'You can only see lots on asteroids you own or control.');

// ---- every building (any owner, planned or built) on that asteroid ----
$uuid = '0x' . dechex($aid * 65536 + 3);
$q = ['bool' => ['filter' => [['nested' => ['path' => 'Location.locations', 'query' => ['term' => ['Location.locations.uuid' => $uuid]]]], ['range' => ['Building.status' => ['gte' => 1]]]]]];
$used = [];
for ($from = 0; $from < 10000; $from += 1000) {
  [$docs, $total] = search('building_v1', ['from' => $from, 'size' => 1000, 'sort' => [['id' => 'asc']], '_source' => ['id', 'Location.locations'], 'query' => $q]);
  foreach ($docs as $d) foreach (($d['Location']['locations'] ?? []) as $l) if (intval($l['label'] ?? 0) === 4) $used[intval(floor(floatval($l['id']) / 4294967296))] = 1;
  if (count($docs) < 1000 || $from + 1000 >= $total) break;
}
$used = array_keys($used); sort($used);
$out = json_encode(['a' => $aid, 'fetched' => $now, 'used' => $used]);
@file_put_contents($cf, $out, LOCK_EX);
echo $out;