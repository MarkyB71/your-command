<?php
// Market history – trades on every marketplace in the belt, from each marketplace's own activity log.
// Reads public game data only, and is deliberately GENTLE on the game's server (Mark's wish):
//   • one request at a time, with a short pause between them;
//   • everything goes into one shared archive (cache/mh_archive.json) that all visitors read from;
//   • the archive is topped up at most every 30 minutes, after the visitor already has their answer;
//   • older history is filled in a little at a time (MH_BACKFILL pages per top-up) until it's complete.
// ?range=100|7|30|90|all   100 (default) = the latest 100 trades across the belt; 7/30/90 = last N days; all = everything so far.
require __DIR__ . '/_api.php';
const MH_REFRESH = 1800;   // top up at most every 30 minutes
const MH_PAUSE = 300000;   // 0.3 s between requests
const MH_BACKFILL = 120;   // older pages read per top-up
$range = $_GET['range'] ?? '100';
if (!in_array($range, ['100', '7', '30', '90', 'all'], true)) $range = '100';
$af = $CACHE . '/mh_archive.json';

function mh_load($af) { return is_file($af) ? (json_decode(file_get_contents($af), true) ?: null) : null; }

function mh_answer($A, $range) {
  $now = time();
  $cut = ctype_digit($range) && $range !== '100' ? $now - intval($range) * 86400 : 0;
  $T = array_values($A['trades']);
  usort($T, fn($a, $b) => $b[0] <=> $a[0]);
  if ($range === '100') $T = array_slice($T, 0, 100);
  elseif ($cut) $T = array_values(array_filter($T, fn($t) => $t[0] >= $cut));
  $todo = count(array_filter($A['cursor'], fn($p) => $p > 0));
  return json_encode(['fetched' => $A['updated'], 'range' => $range, 'markets' => $A['markets'], 'trades' => $T,
    'complete' => $todo === 0, 'backfilling' => $todo, 'since' => $A['oldest'] ?? null]);
}

function mh_get($url, $token) {
  $ch = curl_init($url);
  curl_setopt_array($ch, [CURLOPT_HTTPHEADER => ['Accept: application/json', 'Authorization: Bearer ' . $token], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30]);
  $res = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  return [$code, $res === false ? null : json_decode($res, true)];
}

// read one page of one marketplace's log into the archive; returns [entries on the page (-1 = failed)]
function mh_page(&$A, $mid, $page, &$token) {
  usleep(MH_PAUSE);
  $url = API . '/v2/entities/0x' . dechex(intval($mid) * 65536 + 5) . '/activity?page=' . $page . '&pageSize=100';
  [$code, $j] = mh_get($url, $token);
  if ($code === 401) { $token = get_token(true); [$code, $j] = mh_get($url, $token); }
  if ($code === 429) { sleep(5); return [-1]; }  // Influence asked us to slow down
  if (!is_array($j)) return [-1];
  foreach ($j as $a) {
    $e = $a['event'] ?? []; $n = $e['name'] ?? ($e['event'] ?? '?'); $ts = $e['timestamp'] ?? 0;
    if ($ts && $ts < ($A['oldest'] ?? PHP_INT_MAX)) $A['oldest'] = $ts;
    if (!preg_match('/OrderFilled$/', $n)) continue;
    $id = $a['id'] ?? (($e['transactionHash'] ?? '') . ':' . ($e['logIndex'] ?? ''));
    if (isset($A['trades'][$id])) continue;
    $v = $e['returnValues'] ?? []; $isSell = strpos($n, 'Sell') === 0;
    // [time, 'S' sell order filled (someone bought) / 'B' buy order filled (someone sold), product, amount, price (SWAY x1e6 per unit), marketplace, buyer crew, seller crew]
    $A['trades'][$id] = [$ts, $isSell ? 'S' : 'B', intval($v['product'] ?? 0), intval($v['amount'] ?? 0), $v['price'] ?? 0, intval($mid),
      intval($isSell ? ($v['callerCrew']['id'] ?? 0) : ($v['buyerCrew']['id'] ?? 0)),
      intval($isSell ? ($v['sellerCrew']['id'] ?? 0) : ($v['callerCrew']['id'] ?? 0))];
  }
  return [count($j)];
}

function mh_update($af, $first) {
  global $CACHE;
  $lock = fopen($CACHE . '/mh_archive.lock', 'c');
  if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) return; // someone else is already topping it up
  @set_time_limit(900); ignore_user_abort(true);
  $A = mh_load($af) ?: ['trades' => [], 'cursor' => [], 'markets' => [], 'updated' => 0];
  if (!$first && time() - $A['updated'] < MH_REFRESH) return;
  $token = get_token();
  // the marketplace list (building type 8, built)
  $r = try_search('building_v1', ['size' => 500, 'query' => ['bool' => ['filter' => [['term' => ['Building.buildingType' => 8]], ['range' => ['Building.status' => ['gte' => 3]]]]]], '_source' => ['id', 'Name', 'meta.asteroid']]);
  if ($r) foreach ($r[0] as $b) {
    $A['markets'][$b['id']] = ['name' => $b['Name']['name'] ?? ('Marketplace #' . $b['id']), 'ast' => $b['meta']['asteroid']['name'] ?? null];
    if (!isset($A['cursor'][$b['id']])) $A['cursor'][$b['id']] = 2; // page 1 is read below; older pages are filled in over time
  }
  // 1) newest page of every marketplace
  foreach (array_keys($A['markets']) as $mid) {
    [$n] = mh_page($A, $mid, 1, $token);
    if ($n >= 0 && $n < 100) $A['cursor'][$mid] = 0; // the whole log fits on one page – done
  }
  // 2) a little older history each time, until every marketplace is complete
  if (!$first) {
    $budget = MH_BACKFILL;
    foreach ($A['cursor'] as $mid => $page) {
      while ($page > 0 && $budget > 0) {
        $budget--;
        [$n] = mh_page($A, $mid, $page, $token);
        if ($n < 0) break;
        $page = $n < 100 ? 0 : $page + 1;
      }
      $A['cursor'][$mid] = $page;
      if ($budget <= 0) break;
    }
  }
  $A['updated'] = time();
  @file_put_contents($af . '.tmp', json_encode($A), LOCK_EX); @rename($af . '.tmp', $af);
}

$A = mh_load($af);
if (!$A) { mh_update($af, true); $A = mh_load($af); if (!$A) fail(503, 'The market history is being built – please try again in a minute.'); echo mh_answer($A, $range); exit; }
$ans = mh_answer($A, $range);
header('Content-Length: ' . strlen($ans));
echo $ans;
if (time() - $A['updated'] >= MH_REFRESH) {        // answer first, then top up quietly
  if (function_exists('fastcgi_finish_request')) fastcgi_finish_request(); else { @ob_end_flush(); flush(); }
  mh_update($af, false);
}
