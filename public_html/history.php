<?php
// History (activity log) for a wallet's crews. Reads public game data only; never changes anything in the game.
// ?wallet=0x…&range=100|7|30|90|all
//   100 (default) → the latest 100 actions for each crew; 7/30/90 → everything in the last N days; all → everything.
// Deduplicated, newest first. Cached 10 minutes (30 for "all"). Long ranges page back through each crew's log.
require __DIR__ . '/_api.php';

$default = std_addr(DEFAULT_WALLET);
$wallet = isset($_GET['wallet']) && $_GET['wallet'] !== '' ? std_addr($_GET['wallet']) : $default;
if (!$wallet) fail(400, 'That is not a valid wallet address.');
$allowed = ALLOWED_WALLETS;
if ($wallet !== $default && !in_array('*', $allowed, true) && !in_array($wallet, array_map('std_addr', $allowed), true)) {
  fail(403, 'This server is not set up to show that wallet.');
}

$range = $_GET['range'] ?? '100';
if (!in_array($range, ['100', '7', '30', '90', 'all'], true)) $range = '100';
$cf = $CACHE . '/history3_' . $range . '_' . sha1($wallet) . '.json';
if (is_file($cf) && time() - filemtime($cf) < ($range === 'all' ? 1800 : 600)) { readfile($cf); exit; }

// fair use (same limit as api.php)
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rf = $CACHE . '/rl_' . sha1($ip) . '.json';
$now = time();
$hits = is_file($rf) ? (json_decode(file_get_contents($rf), true) ?: []) : [];
$hits = array_values(array_filter($hits, fn($t) => is_int($t) && $t > $now - RATE_WINDOW));
if (count($hits) >= RATE_MAX) { header('Retry-After: ' . RATE_WINDOW); fail(429, 'Too many look-ups from your connection. Please wait a few minutes and try again.'); }
$hits[] = $now;
@file_put_contents($rf, json_encode($hits), LOCK_EX);

function http_get_json($url, $token) {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_HTTPHEADER => ['Accept: application/json', 'Authorization: Bearer ' . $token],
    CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30, CURLOPT_HEADER => true,
  ]);
  $res = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $hs = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
  curl_close($ch);
  if ($res === false) return [0, null, ''];
  return [$code, json_decode(substr($res, $hs), true), substr($res, 0, $hs)];
}

[$crews] = search('crew_v1', [
  'size' => 500, '_source' => ['id', 'Name'],
  'query' => ['bool' => ['should' => [
    ['term' => ['Crew.delegatedTo' => $wallet]],
    ['term' => ['Nft.owners.starknet' => $wallet]],
  ], 'minimum_should_match' => 1]],
]);

$token = get_token();
@set_time_limit(180);
$start = microtime(true);
$cutoff = ctype_digit($range) && $range !== '100' ? $now - intval($range) * 86400 : 0;
$pageSize = 100; // the game's own page size
$maxPages = $range === '100' ? 1 : ($range === 'all' ? 50 : 20);
$out = ['wallet' => $wallet, 'fetched' => $now, 'range' => $range, 'crews' => count($crews), 'tried' => [], 'partial' => false];
$types = [];
$rows = [];
foreach (array_slice($crews, 0, 80) as $c) {
  $hex = '0x' . dechex(intval($c['id']) * 65536 + 1); // crew label = 1
  $got = 0; $code = 0;
  for ($page = 1; $page <= $maxPages; $page++) {
    if (microtime(true) - $start > 150) { $out['partial'] = true; break 2; } // stay inside the server's time limit
    $url = API . '/v2/entities/' . $hex . '/activity?page=' . $page . '&pageSize=' . $pageSize;
    [$code, $j, $hdr] = http_get_json($url, $token);
    if ($code === 401) { $token = get_token(true); [$code, $j, $hdr] = http_get_json($url, $token); }
    if (!is_array($j) || !$j) break;
    $oldest = PHP_INT_MAX;
    foreach ($j as $a) {
      $ts = $a['event']['timestamp'] ?? 0; $oldest = min($oldest, $ts);
      if ($cutoff && $ts < $cutoff) continue;
      $ev = $a['event']['name'] ?? ($a['event']['event'] ?? ($a['name'] ?? '?'));
      $id = $a['id'] ?? (($a['event']['transactionHash'] ?? '') . ':' . ($a['event']['logIndex'] ?? ''));
      if (isset($rows[$id])) continue;
      $types[$ev] = ($types[$ev] ?? 0) + 1;
      $v = $a['event']['returnValues'] ?? [];
      unset($v['caller']);
      $rows[$id] = ['t' => $ts, 'n' => $ev, 'c' => $c['id'], 'v' => $v, 'x' => $a['event']['transactionHash'] ?? ''];
      $got++;
    }
    if (count($j) < $pageSize || ($cutoff && $oldest < $cutoff)) break;
    if ($page === $maxPages) $out['partial'] = true;
  }
  $out['tried'][] = [$c['id'], $code, $got];
}
arsort($types);
$out['types'] = $types;
$rows = array_values($rows); usort($rows, fn($a, $b) => $b['t'] <=> $a['t']); $out['rows'] = $rows;
$json = json_encode($out);
@file_put_contents($cf, $json, LOCK_EX);
echo $json;
