<?php
// Influence Stock – untouched core samples for one wallet (read-only). Used by the Samples page.
require __DIR__ . '/_api.php';

$default = std_addr(DEFAULT_WALLET);
$wallet = isset($_GET['wallet']) && $_GET['wallet'] !== '' ? std_addr($_GET['wallet']) : $default;
if (!$wallet) fail(400, 'That is not a valid wallet address.');
$allowed = ALLOWED_WALLETS;
if ($wallet !== $default && !in_array('*', $allowed, true) && !in_array($wallet, array_map('std_addr', $allowed), true)) {
  fail(403, 'This server is not set up to show that wallet.');
}

// ---- cache for 5 minutes ----
$cf = $CACHE . '/samples_' . sha1($wallet) . '.json';
if (is_file($cf) && time() - filemtime($cf) < 300) { readfile($cf); exit; }

// ---- same fair-use limit as api.php ----
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rf = $CACHE . '/rl_' . sha1($ip) . '.json';
$now = time();
$hits = is_file($rf) ? (json_decode(file_get_contents($rf), true) ?: []) : [];
$hits = array_values(array_filter($hits, fn($t) => is_int($t) && $t > $now - RATE_WINDOW));
if (count($hits) >= RATE_MAX) { header('Retry-After: ' . RATE_WINDOW); fail(429, 'Too many look-ups from your connection. Please wait a few minutes and try again.'); }
$hits[] = $now;
@file_put_contents($rf, json_encode($hits), LOCK_EX);

// ---- crews owned or delegated ----
[$crews] = search('crew_v1', [
  'size' => 500, '_source' => ['id'],
  'query' => ['bool' => ['should' => [
    ['term' => ['Crew.delegatedTo' => $wallet]],
    ['term' => ['Nft.owners.starknet' => $wallet]],
  ], 'minimum_should_match' => 1]],
]);
$crewIds = array_map(fn($c) => $c['id'], $crews);

// ---- untouched samples (Deposit.status 2 = sampled, never used) ----
$rows = [];
if ($crewIds) {
  for ($from = 0; $from < 10000; $from += 1000) {
    [$docs, $total] = search('deposit_v1', [
      'from' => $from, 'size' => 1000, 'sort' => [['id' => 'asc']],
      '_source' => ['id', 'Deposit', 'Location.location', 'meta.asteroid', 'PrivateSale'],
      'query' => ['bool' => ['filter' => [['terms' => ['Control.controller.id' => $crewIds]], ['term' => ['Deposit.status' => 2]]]]],
    ]);
    foreach ($docs as $d) {
      $rows[] = [intval($d['id']), intval($d['Deposit']['resource'] ?? 0), intval($d['Deposit']['remainingYield'] ?? 0),
        intval($d['Location']['location']['id'] ?? 0), (string)($d['meta']['asteroid']['name'] ?? ''), empty($d['PrivateSale']) ? 0 : 1];
    }
    if (count($docs) < 1000 || count($rows) >= $total) break;
  }
}

$out = json_encode(['fetched' => $now, 'rows' => $rows]);
@file_put_contents($cf, $out, LOCK_EX);
echo $out;