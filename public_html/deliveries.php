<?php
// Your Influence Command – deliveries to and from one wallet's buildings and ships (read-only). Used by the Deliveries page.
require __DIR__ . '/_api.php';

$default = std_addr(DEFAULT_WALLET);
$wallet = isset($_GET['wallet']) && $_GET['wallet'] !== '' ? std_addr($_GET['wallet']) : $default;
if (!$wallet) fail(400, 'That is not a valid wallet address.');
$allowed = ALLOWED_WALLETS;
if ($wallet !== $default && !in_array('*', $allowed, true) && !in_array($wallet, array_map('std_addr', $allowed), true)) {
  fail(403, 'This server is not set up to show that wallet.');
}

// ---- cache for 2 minutes ----
$cf = $CACHE . '/deliveries_' . sha1($wallet) . '.json';
if (is_file($cf) && time() - filemtime($cf) < 120) { readfile($cf); exit; }

// ---- same fair-use limit as api.php ----
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rf = $CACHE . '/rl_' . sha1($ip) . '.json';
$now = time();
$hits = is_file($rf) ? (json_decode(file_get_contents($rf), true) ?: []) : [];
$hits = array_values(array_filter($hits, fn($t) => is_int($t) && $t > $now - RATE_WINDOW));
if (count($hits) >= RATE_MAX) { header('Retry-After: ' . RATE_WINDOW); fail(429, 'Too many look-ups from your connection. Please wait a few minutes and try again.'); }
$hits[] = $now;
@file_put_contents($rf, json_encode($hits), LOCK_EX);

// ---- crews, buildings and ships of this wallet ----
[$crews] = search('crew_v1', ['size' => 500, '_source' => ['id'], 'query' => ['bool' => ['should' => [
  ['term' => ['Crew.delegatedTo' => $wallet]], ['term' => ['Nft.owners.starknet' => $wallet]]], 'minimum_should_match' => 1]]]);
$crewIds = array_map(fn($c) => $c['id'], $crews);
$bIds = []; $sIds = [];
if ($crewIds) {
  $q = ['bool' => ['filter' => [['terms' => ['Control.controller.id' => $crewIds]]], 'must_not' => [['term' => ['Building.status' => 0]]]]];
  for ($from = 0; $from < 10000; $from += 1000) {
    [$docs, $total] = search('building_v1', ['from' => $from, 'size' => 1000, 'sort' => [['id' => 'asc']], '_source' => ['id'], 'query' => $q]);
    foreach ($docs as $d) $bIds[intval($d['id'])] = 1;
    if (count($docs) < 1000 || count($bIds) >= $total) break;
  }
  $r = try_search('ship_v1', ['size' => 500, '_source' => ['id'], 'query' => ['bool' => ['filter' => [['terms' => ['Control.controller.id' => $crewIds]]]]]]);
  if ($r) foreach ($r[0] as $d) $sIds[intval($d['id'])] = 1;
}

$ids = array_values(array_unique(array_merge(array_keys($bIds), array_keys($sIds))));
$mine = function ($e) use ($bIds, $sIds) { $l = intval($e['label'] ?? 0); $i = intval($e['id'] ?? 0); return ($l === 5 && isset($bIds[$i])) || ($l === 6 && isset($sIds[$i])); };
$astOf = function ($e) { foreach (($e['Location']['locations'] ?? []) as $l) if (intval($l['label'] ?? 0) === 3) return intval($l['id']); return 0; };
$row = function ($d) use ($mine, $astOf) {
  $D = $d['Delivery'] ?? []; $o = $D['origin'] ?? []; $t = $D['dest'] ?? [];
  return [intval($d['id']), intval($D['status'] ?? 0), intval($D['finishTime'] ?? 0),
    [intval($o['label'] ?? 0), intval($o['id'] ?? 0), $astOf($o), $mine($o) ? 1 : 0],
    [intval($t['label'] ?? 0), intval($t['id'] ?? 0), $astOf($t), $mine($t) ? 1 : 0],
    array_map(fn($c) => [intval($c['product'] ?? 0), intval($c['amount'] ?? 0)], $D['contents'] ?? []),
    empty($d['PrivateSale']) ? 0 : 1];
};
$find = function ($extra, $size) use ($ids, $row) {
  if (!$ids) return [];
  $out = [];
  foreach (array_chunk($ids, 5000) as $chunk) {
    $q = ['bool' => ['filter' => $extra, 'should' => [['terms' => ['Delivery.dest.id' => $chunk]], ['terms' => ['Delivery.origin.id' => $chunk]]], 'minimum_should_match' => 1]];
    $r = try_search('delivery_v1', ['size' => $size, 'sort' => [['Delivery.finishTime' => 'desc']], '_source' => ['id', 'Delivery', 'PrivateSale'], 'query' => $q]);
    if ($r === null) return null;
    foreach ($r[0] as $d) $out[] = $row($d);
  }
  return $out;
};
$keep = fn($rows) => $rows === null ? null : array_values(array_filter($rows, fn($x) => $x[3][3] || $x[4][3]));

$pending = $keep($find([['term' => ['Delivery.status' => 4]]], 200));
$transit = $keep($find([['term' => ['Delivery.status' => 2]], ['range' => ['Delivery.finishTime' => ['gt' => $now]]]], 300));
$recent  = $keep($find([['term' => ['Delivery.status' => 2]], ['range' => ['Delivery.finishTime' => ['gte' => $now - 7 * 86400, 'lte' => $now]]]], 500));

$out = json_encode(['fetched' => $now, 'pending' => $pending ?? [], 'transit' => $transit ?? [], 'recent' => $recent ?? [], 'err' => ($pending === null || $transit === null || $recent === null) ? 'Some deliveries could not be loaded.' : null]);
@file_put_contents($cf, $out, LOCK_EX);
echo $out;