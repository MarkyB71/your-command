<?php
// Active players – PRIVATE page for Mark only (not linked from the site).
// Open with:  https://your-command.adalia.academy/players.php?k=YOUR_ADMIN_KEY
// The key lives in config.php as:  define('ADMIN_KEY', 'something-long-and-secret');
//
// How "active" is worked out (public game data only):
//   A crew counts as active if it did something in the window – its Crew.readyAt (set when it starts an action)
//   or Crew.lastFed (set when it is fed) falls inside the window.
//   A player = the wallet a crew is delegated to (falls back to the crew's owner).
//   This is an estimate: a player who only trades or only looks around may not show up.
//
// Gentle on the game server: one search at a time with a pause, re-counted at most every 6 hours,
// and one line per day kept in cache/players_hist.json so you can watch the trend.
require __DIR__ . '/_api.php';
header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');

if (!defined('ADMIN_KEY') || ADMIN_KEY === '' || !hash_equals((string)ADMIN_KEY, (string)($_GET['k'] ?? ''))) {
  http_response_code(404); echo 'Not found'; exit;
}

const PL_REFRESH = 21600;  // re-count at most every 6 hours
const PL_PAUSE = 300000;   // 0.3 s between searches
const PL_PAGE = 1000;      // crews per search
const PL_MAXPAGES = 60;    // safety cap (60,000 crews)
$cf = $CACHE . '/players.json';
$hf = $CACHE . '/players_hist.json';

function pl_count() {
  $now = time(); $cut = $now - 90 * 86400;
  $wins = [1, 7, 30, 90];
  $W = []; $C = array_fill_keys($wins, 0);
  foreach ($wins as $d) $W[$d] = [];
  $last = 0; $pages = 0; $seen = 0;
  while ($pages++ < PL_MAXPAGES) {
    usleep(PL_PAUSE);
    $r = try_search('crew_v1', [
      'size' => PL_PAGE, 'sort' => [['id' => 'asc']],
      'query' => ['bool' => [
        'filter' => [['range' => ['id' => ['gt' => $last]]]],
        'should' => [['range' => ['Crew.readyAt' => ['gte' => $cut]]], ['range' => ['Crew.lastFed' => ['gte' => $cut]]]],
        'minimum_should_match' => 1]],
      '_source' => ['id', 'Crew.delegatedTo', 'Crew.readyAt', 'Crew.lastFed', 'Nft.owners.starknet']]);
    if ($r === null) return null;
    foreach ($r[0] as $c) {
      $last = max($last, intval($c['id'])); $seen++;
      $cr = $c['Crew'] ?? [];
      // readyAt can be in the future while busy – that still means it acted recently
      $t = max(min(intval($cr['readyAt'] ?? 0), $now), intval($cr['lastFed'] ?? 0));
      $w = std_addr($cr['delegatedTo'] ?? '') ?: std_addr($c['Nft']['owners']['starknet'] ?? '');
      foreach ($wins as $d) if ($t >= $now - $d * 86400) {
        $C[$d]++;
        if ($w) $W[$d][$w] = 1;
      }
    }
    if (count($r[0]) < PL_PAGE) break;
  }
  usleep(PL_PAUSE);
  $all = try_search('crew_v1', ['size' => 0, 'track_total_hits' => true, 'query' => ['match_all' => (object)[]]]);
  $out = ['at' => $now, 'crewsEver' => $all ? $all[1] : null, 'players' => [], 'crews' => $C];
  foreach ($wins as $d) $out['players'][$d] = count($W[$d]);
  return $out;
}

$S = is_file($cf) ? json_decode(file_get_contents($cf), true) : null;
$err = '';
if (!$S || time() - ($S['at'] ?? 0) >= PL_REFRESH || isset($_GET['fresh'])) {
  @set_time_limit(300);
  $N = pl_count();
  if ($N) {
    $S = $N;
    @file_put_contents($cf, json_encode($S), LOCK_EX);
    $H = is_file($hf) ? (json_decode(file_get_contents($hf), true) ?: []) : [];
    $H[gmdate('Y-m-d')] = [$S['players'][1], $S['players'][7], $S['players'][30], $S['players'][90]];
    ksort($H);
    @file_put_contents($hf, json_encode($H), LOCK_EX);
  } else $err = 'Influence did not answer just now – showing the last count.';
}
$H = is_file($hf) ? (json_decode(file_get_contents($hf), true) ?: []) : [];
krsort($H);
$e = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES);
$n = fn($v) => $v === null ? '–' : number_format($v);
?><!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Active players</title>
<style>
body{background:#0b0f16;color:#dbe4f0;font:16px/1.5 system-ui,-apple-system,sans-serif;margin:0;padding:24px}
h1{font-size:22px;margin:0 0 4px;color:#7cc4ff}.sub{color:#8a97a8;font-size:14px;margin-bottom:20px}
.tiles{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px}
.t{background:#141b26;border:1px solid #232b38;border-radius:10px;padding:14px 18px;min-width:130px}
.t b{display:block;font-size:30px;color:#fff}.t span{color:#8a97a8;font-size:14px}
table{border-collapse:collapse;background:#141b26;border-radius:10px;overflow:hidden}
th,td{padding:6px 14px;text-align:right;border-bottom:1px solid #232b38}th:first-child,td:first-child{text-align:left}
th{color:#7cc4ff;font-weight:600}.err{color:#ffb35c;margin-bottom:12px}.note{color:#8a97a8;font-size:13px;margin-top:20px;max-width:640px}
</style></head><body>
<h1>Active players</h1>
<div class="sub">Private page · counted <?= $S ? $e(gmdate('j M Y, H:i', $S['at'])) . ' UTC' : 'not yet' ?></div>
<?php if ($err): ?><div class="err"><?= $e($err) ?></div><?php endif; ?>
<?php if ($S): ?>
<div class="tiles">
  <div class="t"><b><?= $n($S['players'][1]) ?></b><span>players, last 24 hours</span></div>
  <div class="t"><b><?= $n($S['players'][7]) ?></b><span>players, last 7 days</span></div>
  <div class="t"><b><?= $n($S['players'][30]) ?></b><span>players, last 30 days</span></div>
  <div class="t"><b><?= $n($S['players'][90]) ?></b><span>players, last 90 days</span></div>
</div>
<div class="tiles">
  <div class="t"><b><?= $n($S['crews'][7]) ?></b><span>active crews, 7 days</span></div>
  <div class="t"><b><?= $n($S['crews'][30]) ?></b><span>active crews, 30 days</span></div>
  <div class="t"><b><?= $n($S['crewsEver']) ?></b><span>crews ever made</span></div>
</div>
<?php endif; ?>
<?php if ($H): ?>
<table><tr><th>Day</th><th>24 h</th><th>7 days</th><th>30 days</th><th>90 days</th></tr>
<?php foreach (array_slice($H, 0, 120, true) as $d => $v): ?>
<tr><td><?= $e($d) ?></td><td><?= $n($v[0]) ?></td><td><?= $n($v[1]) ?></td><td><?= $n($v[2]) ?></td><td><?= $n($v[3]) ?></td></tr>
<?php endforeach; ?></table>
<?php endif; ?>
<div class="note">A player is counted when one of their crews started an action or was fed in that window. Players who only trade or look around may be missed, so treat it as a close estimate. One line is added per day the page is opened.</div>
</body></html>
