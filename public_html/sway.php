<?php
// SWAY balance for a wallet – Skippy's Awesome Command Deck (Mark, 11 Nov 2026). Read only.
// Asks a public Starknet node for balanceOf on the SWAY token. Answers are kept 60 s per wallet so the node isn't asked twice.
require __DIR__ . '/_api.php';

const SWAY_TOKEN = '0x004878d1148318a31829523ee9c6a5ee563af6cd87f90a30809e5b0d27db8a9b'; // @influenceth/sdk starknet_addresses.SN_MAIN.Sway
const SEL_BALANCE = '0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e';  // balanceOf
const SWAY_DP = 6; // SWAY has 6 decimals (market prices are SWAY × 1e6)

$w = std_addr($_GET['wallet'] ?? '');
if (!$w) fail(400, 'Give a wallet address.');

$cf = $CACHE . '/sway_' . sha1($w) . '.json';
if (is_file($cf) && filemtime($cf) > time() - 60) { readfile($cf); exit; }

// fair use: same per-visitor limit as api.php for fresh look-ups
$rf = $CACHE . '/rlsw_' . sha1($_SERVER['REMOTE_ADDR'] ?? 'unknown') . '.json';
$hits = is_file($rf) ? (json_decode(file_get_contents($rf), true) ?: []) : [];
$hits = array_values(array_filter($hits, fn($t) => is_int($t) && $t > time() - RATE_WINDOW));
if (count($hits) >= RATE_MAX) { header('Retry-After: ' . RATE_WINDOW); fail(429, 'Too many look-ups. Please wait a few minutes.'); }
$hits[] = time();
@file_put_contents($rf, json_encode($hits), LOCK_EX);

// Public nodes, tried in turn. config.php may set STARKNET_RPC to put a preferred node first.
$nodes = ['https://rpc.starknet.lava.build', 'https://starknet.drpc.org', 'https://api.zan.top/public/starknet-mainnet', 'https://starknet-rpc.publicnode.com'];
if (defined('STARKNET_RPC') && STARKNET_RPC) array_unshift($nodes, STARKNET_RPC);

$req = ['jsonrpc' => '2.0', 'id' => 1, 'method' => 'starknet_call', 'params' => [
  'request' => ['contract_address' => SWAY_TOKEN, 'entry_point_selector' => SEL_BALANCE, 'calldata' => [$w]],
  'block_id' => 'latest',
]];

$res = null;
foreach ($nodes as $n) {
  $ch = curl_init($n);
  curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($req), CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8]);
  $body = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  $j = $body ? json_decode($body, true) : null;
  if ($code === 200 && isset($j['result'][0])) { $res = $j['result']; break; }
}
if (!$res) fail(502, 'Could not read the SWAY balance just now.');

// u256 = [low, high] felts; SWAY never gets near 2^128, so low is enough – but add high in case.
$raw = '0';
if (function_exists('gmp_init')) {
  $raw = gmp_strval(gmp_add(gmp_init($res[0]), gmp_mul(gmp_init($res[1] ?? '0x0'), gmp_pow(2, 128))));
} else {
  $raw = (string)hexdec($res[0]); // float above 2^53 – fine for display
}
$sway = (float)$raw / pow(10, SWAY_DP);

$out = json_encode(['wallet' => $w, 'sway' => $sway, 'at' => time()]);
@file_put_contents($cf, $out, LOCK_EX);
echo $out;
