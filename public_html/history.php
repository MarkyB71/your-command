<?php
// History (activity log) for a wallet's crews. Reads public game data only; never changes anything in the game.
// ?wallet=0x…&probe=1 → small sample + list of event types (used while we work out what's available).
require __DIR__ . '/_api.php';

$default = std_addr(DEFAULT_WALLET);
$wallet = isset($_GET['wallet']) && $_GET['wallet'] !== '' ? std_addr($_GET['wallet']) : $default;
if (!$wallet) fail(400, 'That is not a valid wallet address.');
$allowed = ALLOWED_WALLETS;
if ($wallet !== $default && !in_array('*', $allowed, true) && !in_array($wallet, array_map('std_addr', $allowed), true)) {
  fail(403, 'This server is not set up to show that wallet.');
}
$probe = !empty($_GET['probe']);

$cf = $CACHE . '/history2_' . ($probe ? 'p_' : '') . sha1($wallet) . '.json';
if (is_file($cf) && time() - filemtime($cf) < 600) { readfile($cf); exit; }

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
$out = ['wallet' => $wallet, 'fetched' => $now, 'crews' => count($crews), 'tried' => []];
$types = [];
$sample = [];
$rows = [];
foreach (array_slice($crews, 0, $probe ? 5 : 80) as $c) {
  $hex = '0x' . dechex(intval($c['id']) * 65536 + 1); // crew label = 1
  $url = API . '/v2/entities/' . $hex . '/activity?page=1&pageSize=' . ($probe ? 25 : 100);
  [$code, $j, $hdr] = http_get_json($url, $token);
  if ($code === 401) { $token = get_token(true); [$code, $j, $hdr] = http_get_json($url, $token); }
  $n = is_array($j) ? count($j) : 0;
  $out['tried'][] = [$c['id'], $code, $n];
  if (is_array($j)) foreach ($j as $a) {
    $ev = $a['event']['name'] ?? ($a['event']['event'] ?? ($a['name'] ?? '?'));
    $types[$ev] = ($types[$ev] ?? 0) + 1;
    if ($probe && count($sample) < 6) $sample[] = $a;
    if (!$probe) {
      $id = $a['id'] ?? (($a['event']['transactionHash'] ?? '') . ':' . ($a['event']['logIndex'] ?? ''));
      if (isset($rows[$id])) continue;
      $v = $a['event']['returnValues'] ?? [];
      unset($v['caller']);
      $rows[$id] = ['t' => $a['event']['timestamp'] ?? 0, 'n' => $ev, 'c' => $c['id'], 'v' => $v, 'x' => $a['event']['transactionHash'] ?? ''];
    }
  }
}
arsort($types);
$out['types'] = $types;
if ($probe) $out['sample'] = $sample;
else { $rows = array_values($rows); usort($rows, fn($a, $b) => $b['t'] <=> $a['t']); $out['rows'] = $rows; }
$json = json_encode($out);
@file_put_contents($cf, $json, LOCK_EX);
echo $json;
