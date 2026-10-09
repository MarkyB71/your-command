<?php
// Influence Stock – every open market listing across the belt (reads public game data only).
// Shared by all visitors and rebuilt at most every few minutes, so it puts little load on Influence.
require __DIR__ . '/_api.php';
const MARKET_SECONDS = 300;
$mf = $CACHE . '/market.json';
$fresh = fn() => is_file($mf) && time() - filemtime($mf) < MARKET_SECONDS;
if ($fresh()) { readfile($mf); exit; }

// only one visitor rebuilds at a time; others get the last copy (or wait for the new one)
$lock = fopen($CACHE . '/market.lock', 'c');
if ($lock && !flock($lock, LOCK_EX | LOCK_NB)) {
  if (is_file($mf)) { readfile($mf); exit; }
  flock($lock, LOCK_EX);
  if ($fresh()) { readfile($mf); exit; }
}

$now = time();
$orders = [];
$q = ['bool' => ['filter' => [['term' => ['status' => 1]], ['range' => ['validTime' => ['lte' => $now]]]]]];
for ($from = 0; $from < 10000; $from += 1000) {
  [$docs, $total] = search('order_v1', [
    'from' => $from, 'size' => 1000, 'query' => $q, 'sort' => [['price' => 'asc']],
    '_source' => ['product', 'orderType', 'amount', 'price', 'entity', 'crew', 'locations', 'makerFee'],
  ]);
  foreach ($docs as $d) {
    $ast = 0;
    foreach (($d['locations'] ?? []) as $l) if (($l['label'] ?? 0) == 3) $ast = intval($l['id']);
    // [product, type (1 buy / 2 sell), amount, price (SWAY x 1e6 per unit), marketplace id, asteroid id, crew id, maker fee]
    $orders[] = [intval($d['product'] ?? 0), intval($d['orderType'] ?? 0), intval($d['amount'] ?? 0), $d['price'] ?? 0,
                 intval($d['entity']['id'] ?? 0), $ast, intval($d['crew']['id'] ?? 0), intval($d['makerFee'] ?? 0)];
  }
  if (!$docs || count($orders) >= $total) break;
}

// names and fees of the marketplaces involved
$markets = [];
$ids = array_values(array_unique(array_map(fn($o) => $o[4], $orders)));
foreach (array_chunk($ids, 500) as $chunk) {
  $r = try_search('building_v1', ['size' => 500, 'query' => ['terms' => ['id' => $chunk]], '_source' => ['id', 'Name', 'Exchange', 'meta.asteroid']]);
  if ($r) foreach ($r[0] as $b) $markets[$b['id']] = [
    'name' => $b['Name']['name'] ?? null, 'ast' => $b['meta']['asteroid']['name'] ?? null, 'ex' => $b['Exchange'] ?? null,
  ];
}

$out = json_encode(['fetched' => $now, 'orders' => $orders, 'markets' => $markets]);
@file_put_contents($mf, $out, LOCK_EX);
echo $out;