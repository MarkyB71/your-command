<?php
// Which crew sent a delivery (Mark, 9 Nov 2026) – for the Logistics Hub's "Finish with" column.
// The game's delivery record doesn't hold the crew, but the delivery's own activity log does (DeliverySent /
// DeliveryPackaged → callerCrew). Reads public game data only; never changes anything in the game.
// ?ids=123,456  → {"123": 159, "456": 0}   (0 = not found)
// Answers are kept for good (a delivery's sender never changes); misses are retried after 10 minutes.
// At most 25 new look-ups per call, gently spaced, so the game's server isn't pushed.
require __DIR__ . '/_api.php';

function dc_get($url, $token) {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_HTTPHEADER => ['Accept: application/json', 'Authorization: Bearer ' . $token],
    CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20,
  ]);
  $res = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return [$code, $res === false ? null : json_decode($res, true)];
}

$ids = array_values(array_unique(array_filter(array_map('intval', explode(',', $_GET['ids'] ?? '')))));
$ids = array_slice($ids, 0, 200);
if (!$ids) { echo '{}'; exit; }

$cf = $CACHE . '/delcrew.json';
$known = is_file($cf) ? (json_decode(@file_get_contents($cf), true) ?: []) : [];
$now = time();
$out = []; $todo = [];
foreach ($ids as $id) {
  $k = (string)$id;
  if (isset($known[$k]) && ($known[$k][0] || $now - $known[$k][1] < 600)) $out[$k] = $known[$k][0];
  else $todo[] = $id;
}

$token = null;
foreach (array_slice($todo, 0, 25) as $i => $id) {
  if ($i) usleep(200000); // go gently on the game's server
  if (!$token) $token = get_token();
  $hex = '0x' . dechex($id * 65536 + 9); // delivery label = 9 (@influenceth/sdk Entity.IDS.DELIVERY)
  $url = API . '/v2/entities/' . $hex . '/activity?page=1&pageSize=10';
  [$code, $j] = dc_get($url, $token);
  if ($code === 401) { $token = get_token(true); [$code, $j] = dc_get($url, $token); }
  $crew = 0;
  if (is_array($j)) foreach ($j as $a) {
    $ev = $a['event']['name'] ?? ($a['event']['event'] ?? '');
    if (!in_array($ev, ['DeliverySent', 'DeliveryPackaged', 'DeliveryPackagedV1'], true)) continue;
    $c = $a['event']['returnValues']['callerCrew'] ?? null;
    $crew = intval(is_array($c) ? ($c['id'] ?? 0) : $c);
    if ($crew) break;
  }
  $known[(string)$id] = [$crew, $now];
  $out[(string)$id] = $crew;
}

// keep the file small: drop entries over 30 days old
foreach ($known as $k => $v) if ($now - $v[1] > 30 * 86400) unset($known[$k]);
@file_put_contents($cf, json_encode($known), LOCK_EX);
echo json_encode($out);
