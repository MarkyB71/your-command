<?php
// Influence Stock – shared helpers for api.php and market.php (not reachable from the web – see .htaccess).
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(403); exit; }
require __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

const API = 'https://api.influenceth.io';
const RATE_MAX = 30;        // fresh look-ups allowed per visitor …
const RATE_WINDOW = 600;    // … in this many seconds
const KEEP_FILES = 86400;   // old cache / rate files are tidied after a day
$CACHE = __DIR__ . '/cache';

function fail($code, $msg) { http_response_code($code); echo json_encode(['error' => $msg]); exit; }

function std_addr($a) {
  $a = strtolower(trim((string)$a));
  if (!preg_match('/^0x[0-9a-f]{1,64}$/', $a)) return null;
  return '0x' . str_pad(substr($a, 2), 64, '0', STR_PAD_LEFT);
}

function http_post($url, $body, $token = null) {
  $ch = curl_init($url);
  $headers = ['Content-Type: application/json', 'Accept: application/json'];
  if ($token) $headers[] = 'Authorization: Bearer ' . $token;
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($body),
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
  ]);
  $res = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($res === false) return [0, null];
  return [$code, json_decode($res, true)];
}

function get_token($fresh = false) {
  global $CACHE;
  $f = $CACHE . '/token.json';
  if (!$fresh && is_file($f)) {
    $t = json_decode(file_get_contents($f), true);
    if (!empty($t['access_token']) && ($t['client_id'] ?? '') === CLIENT_ID) return $t['access_token'];
  }
  [$code, $j] = http_post(API . '/v2/auth/token', [
    'grant_type' => 'client_credentials',
    'client_id' => CLIENT_ID,
    'client_secret' => CLIENT_SECRET,
  ]);
  if ($code === 0) fail(502, 'Could not reach Influence. Please try again in a minute.');
  if ($code !== 200 || empty($j['access_token'])) fail(502, 'The server\'s Influence API key was not accepted.');
  @file_put_contents($f, json_encode(['access_token' => $j['access_token'], 'client_id' => CLIENT_ID]), LOCK_EX);
  return $j['access_token'];
}

// One search. Returns [docs, total] or null if Influence said no (the caller decides if that matters).
function try_search($index, $body) {
  static $token = null;
  if ($token === null) $token = get_token();
  [$code, $j] = http_post(API . '/_search/' . $index, $body, $token);
  if ($code === 401) { $token = get_token(true); [$code, $j] = http_post(API . '/_search/' . $index, $body, $token); }
  $h = $j['hits'] ?? ($j['body']['hits'] ?? null);
  if ($code !== 200 || !$h) return null;
  $total = is_array($h['total'] ?? null) ? ($h['total']['value'] ?? 0) : ($h['total'] ?? 0);
  return [array_map(fn($x) => $x['_source'], $h['hits'] ?? []), $total];
}

function search($index, $body) {
  $r = try_search($index, $body);
  if ($r === null) fail(502, 'Influence did not answer (' . $index . '). Please try again in a minute.');
  return $r;
}