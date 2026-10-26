<?php
// "Report a problem" – players' reports are saved privately OUTSIDE public_html:
//   /home/yourcommand/bug-reports/reports.txt   (easy to read in cPanel File Manager)
//   /home/yourcommand/bug-reports/reports.jsonl (one report per line, for Claude)
// Nothing here is ever served back to the web.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function out($code, $arr) { http_response_code($code); echo json_encode($arr); exit; }

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(405, ['error' => 'Please use the Report a problem box.']);
$raw = file_get_contents('php://input', false, null, 0, 20000);
$in = json_decode($raw, true);
if (!is_array($in)) out(400, ['error' => 'Could not read the report.']);

function clean($s, $max) {
  $s = (string)$s;
  $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s) ?? '';
  $s = trim(str_replace("\r\n", "\n", $s));
  return mb_substr($s, 0, $max);
}
$text = clean($in['text'] ?? '', 2000);
if (mb_strlen($text) < 5) out(400, ['error' => 'Please say a little about what happened.']);
$kinds = ['bug' => 'Something is wrong'];
$kind = $kinds[$in['kind'] ?? ''] ?? 'Something is wrong';
$page = clean($in['page'] ?? '', 80);
$who = clean($in['who'] ?? '', 80);
$ver = clean($in['ver'] ?? '', 40);
$ua = clean($_SERVER['HTTP_USER_AGENT'] ?? '', 200);
$wallet = '';
if (!empty($in['wallet']) && preg_match('/^0x[0-9a-fA-F]{1,64}$/', (string)$in['wallet'])) $wallet = strtolower($in['wallet']);

$dir = dirname(__DIR__) . '/bug-reports';
if (!is_dir($dir)) @mkdir($dir, 0700, true);
if (!is_dir($dir) || !is_writable($dir)) {           // fall back to the private cache folder
  $dir = __DIR__ . '/cache/bug-reports';
  if (!is_dir($dir)) @mkdir($dir, 0700, true);
}
if (!is_dir($dir) || !is_writable($dir)) out(500, ['error' => 'Sorry, the report could not be saved. Please tell Skippy on Discord.']);

// Gentle limit: 5 reports per visitor per hour (IP kept only as a hash, only for this).
$ipH = substr(hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|yic-report'), 0, 16);
$rl = $dir . '/rl_' . $ipH . '.json';
$now = time();
$hits = is_file($rl) ? (json_decode(@file_get_contents($rl), true) ?: []) : [];
$hits = array_values(array_filter($hits, function ($t) use ($now) { return $t > $now - 3600; }));
if (count($hits) >= 5) out(429, ['error' => 'Thanks! You have sent a few already – please try again in an hour.']);
$hits[] = $now;
@file_put_contents($rl, json_encode($hits), LOCK_EX);

// Overall cap: 30 reports a day for the whole site, so a script can't flood us.
$dayF = $dir . '/day_' . date('Ymd') . '.txt';
$fh = @fopen($dayF, 'c+');
if ($fh) {
  flock($fh, LOCK_EX);
  $n = (int)stream_get_contents($fh);
  if ($n >= 30) { flock($fh, LOCK_UN); fclose($fh); out(429, ['error' => 'Sorry, the report box is full for today. Please try again tomorrow.']); }
  ftruncate($fh, 0); rewind($fh); fwrite($fh, (string)($n + 1)); fflush($fh);
  flock($fh, LOCK_UN); fclose($fh);
}
foreach (glob($dir . '/day_*.txt') ?: [] as $f) if (filemtime($f) < time() - 7 * 86400) @unlink($f);

$id = date('Ymd-His', $now) . '-' . substr(bin2hex(random_bytes(3)), 0, 4);
$rec = ['id' => $id, 'time' => date('c', $now), 'kind' => $kind, 'page' => $page, 'text' => $text,
        'who' => $who, 'wallet' => $wallet, 'version' => $ver, 'browser' => $ua];
@file_put_contents($dir . '/reports.jsonl', json_encode($rec, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);

$txt = "==== " . $id . "  (" . date('D j M Y H:i', $now) . " UTC)\n" .
  "Type:    " . $kind . "\n" .
  "Page:    " . ($page ?: '-') . "\n" .
  "From:    " . ($who ?: '(no name given)') . "\n" .
  "Wallet:  " . ($wallet ?: '(not shared)') . "\n" .
  "Version: " . ($ver ?: '-') . "\n" .
  "Browser: " . $ua . "\n\n" . $text . "\n\n";
if (@file_put_contents($dir . '/reports.txt', $txt, FILE_APPEND | LOCK_EX) === false)
  out(500, ['error' => 'Sorry, the report could not be saved. Please tell Skippy on Discord.']);

// Also post it as an issue in the PRIVATE GitHub repo (if config.php has GH_TOKEN + GH_REPO).
// The report is already saved above, so a GitHub hiccup never loses it.
@include __DIR__ . '/config.php';
if (defined('GH_TOKEN') && defined('GH_REPO') && GH_TOKEN && GH_REPO && function_exists('curl_init')) {
  $noPing = function ($t) { return str_replace('@', "@\u{200B}", $t); };   // no accidental @mentions
  $title = ($page ? $page . ': ' : '') . mb_substr(preg_replace('/\s+/u', ' ', $text), 0, 70);
  $body = "**Page:** " . ($page ?: '-') . "  \n" .
    "**From:** " . ($who ? $noPing($who) : '(no name given)') . "  \n" .
    "**Wallet:** " . ($wallet ?: '(not shared)') . "  \n" .
    "**Version:** " . ($ver ?: '-') . "  \n" .
    "**Browser:** " . $ua . "  \n" .
    "**Report id:** " . $id . "\n\n" .
    "~~~~text\n" . str_replace('~~~~', '~ ~ ~ ~', $text) . "\n~~~~";
  $ch = curl_init('https://api.github.com/repos/' . GH_REPO . '/issues');
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode(['title' => $noPing($title), 'body' => $body]),
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . GH_TOKEN, 'Accept: application/vnd.github+json',
      'X-GitHub-Api-Version: 2022-11-28', 'User-Agent: your-command-report', 'Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
  ]);
  $res = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($code !== 201)
    @file_put_contents($dir . '/github-errors.txt', date('c') . " $id HTTP $code " . substr((string)$res, 0, 300) . "\n", FILE_APPEND | LOCK_EX);
}

out(200, ['ok' => true, 'id' => $id]);
