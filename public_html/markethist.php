<?php
// Market history – trades on every marketplace in the belt, from each marketplace's own activity log.
// Reads public game data only. Shared by all visitors (same answer for everyone) and cached, so it puts little load on Influence.
// ?range=100|7|30|90|all   100 (default) = the latest 100 trades across the belt; 7/30/90 = last N days; all = everything.
require __DIR__ . '/_api.php';
$range = $_GET['range'] ?? '100';
if (!in_array($range, ['100', '7', '30', '90', 'all'], true)) $range = '100';
$mf = $CACHE . '/markethist_' . $range . '.json';
$keep = $range === 'all' ? 3600 : 900;
$fresh = fn() => is_file($mf) && time() - filemtime($mf) < $keep;
if ($fresh()) { readfile($mf); exit; }

// only one visitor rebuilds a range at a time; others get the last copy (or wait for the new one)
$lock = fopen($CACHE . '/markethist_' . $range . '.lock', 'c');
if ($lock && !flock($lock, LOCK_EX | LOCK_NB)) {
  if (is_file($mf)) { readfile($mf); exit; }
  flock($lock, LOCK_EX);
  if ($fresh()) { readfile($mf); exit; }
}

function http_get_json($url, $token) {
  $ch = curl_init($url);
  curl_setopt_array($ch, [CURLOPT_HTTPHEADER => ['Accept: application/json', 'Authorization: Bearer ' . $token], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30]);
  $res = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  return [$code, $res === false ? null : json_decode($res, true)];
}

@set_time_limit(180);
$start = microtime(true);
$now = time();
$cutoff = ctype_digit($range) && $range !== '100' ? $now - intval($range) * 86400 : 0;
$maxPages = $range === '100' ? 1 : ($range === 'all' ? 60 : 30);

// every marketplace (building type 8) that has been built
[$mk] = search('building_v1', ['size' => 500, 'query' => ['bool' => ['filter' => [['term' => ['Building.buildingType' => 8]], ['range' => ['Building.status' => ['gte' => 3]]]]]],
  '_source' => ['id', 'Name', 'meta.asteroid', 'Location']]);
$markets = [];
foreach ($mk as $b) $markets[$b['id']] = ['name' => $b['Name']['name'] ?? ('Marketplace #' . $b['id']), 'ast' => $b['meta']['asteroid']['name'] ?? null];

$token = get_token();
$trades = []; $seen = []; $partial = false; $types = [];
foreach (array_keys($markets) as $mid) {
  $hex = '0x' . dechex(intval($mid) * 65536 + 5); // building label = 5
  for ($page = 1; $page <= $maxPages; $page++) {
    if (microtime(true) - $start > 150) { $partial = true; break 2; }
    $url = API . '/v2/entities/' . $hex . '/activity?page=' . $page . '&pageSize=100';
    [$code, $j] = http_get_json($url, $token);
    if ($code === 401) { $token = get_token(true); [$code, $j] = http_get_json($url, $token); }
    if (!is_array($j) || !$j) break;
    $oldest = PHP_INT_MAX;
    foreach ($j as $a) {
      $e = $a['event'] ?? []; $n = $e['name'] ?? ($e['event'] ?? '?'); $ts = $e['timestamp'] ?? 0;
      $oldest = min($oldest, $ts);
      $types[$n] = ($types[$n] ?? 0) + 1;
      if (!preg_match('/OrderFilled$/', $n)) continue;
      if ($cutoff && $ts < $cutoff) continue;
      $id = $a['id'] ?? (($e['transactionHash'] ?? '') . ':' . ($e['logIndex'] ?? ''));
      if (isset($seen[$id])) continue; $seen[$id] = 1;
      $v = $e['returnValues'] ?? [];
      // [time, 'S' sell order filled (someone bought) / 'B' buy order filled (someone sold), product, amount, price (SWAY x1e6 per unit), marketplace, buyer crew, seller crew]
      $isSell = strpos($n, 'Sell') === 0;
      $trades[] = [$ts, $isSell ? 'S' : 'B', intval($v['product'] ?? 0), intval($v['amount'] ?? 0), $v['price'] ?? 0, intval($mid),
        intval($isSell ? ($v['callerCrew']['id'] ?? 0) : ($v['buyerCrew']['id'] ?? 0)),
        intval($isSell ? ($v['sellerCrew']['id'] ?? 0) : ($v['callerCrew']['id'] ?? 0))];
    }
    if (count($j) < 100 || ($cutoff && $oldest < $cutoff)) break;
    if ($page === $maxPages && $range !== '100') $partial = true;
  }
}
usort($trades, fn($a, $b) => $b[0] <=> $a[0]);
if ($range === '100') $trades = array_slice($trades, 0, 100);
arsort($types);
$out = json_encode(['fetched' => $now, 'range' => $range, 'partial' => $partial, 'markets' => $markets, 'trades' => $trades, 'types' => $types, 'secs' => round(microtime(true) - $start, 1)]);
@file_put_contents($mf, $out, LOCK_EX);
echo $out;
