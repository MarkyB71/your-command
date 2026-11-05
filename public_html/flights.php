<?php
// Influence Stock – every ship in flight across the belt, for the extension's system map (reads public game data only).
// Shared by all visitors and rebuilt at most every few minutes, so it puts little load on Influence.
// Gives: ships [id, name, ship type, owner wallet, crew id, from asteroid, to asteroid, leaves (unix), arrives (unix)],
// plus the orbits and names of every asteroid those ships fly between, so the route can be worked out.
require __DIR__ . '/_api.php';
const FLIGHTS_SECONDS = 300;
$ff = $CACHE . '/flights.json';
$fresh = fn() => is_file($ff) && time() - filemtime($ff) < FLIGHTS_SECONDS;
if ($fresh()) { readfile($ff); exit; }

// only one visitor rebuilds at a time; others get the last copy (or wait for the new one)
$lock = fopen($CACHE . '/flights.lock', 'c');
if ($lock && !flock($lock, LOCK_EX | LOCK_NB)) {
  if (is_file($ff)) { readfile($ff); exit; }
  flock($lock, LOCK_EX);
  if ($fresh()) { readfile($ff); exit; }
}

$now = time();
$gameNow = ($now - 1609459200) * 24;   // the game counts flight times in game seconds (24 × real time)
$unix = fn($g) => intval(1609459200 + $g / 24);
$ships = [];
$q = ['bool' => ['filter' => [['range' => ['Ship.transitArrival' => ['gt' => $gameNow]]]]]];
for ($from = 0; $from < 5000; $from += 1000) {
  $r = try_search('ship_v1', [
    'from' => $from, 'size' => 1000, 'query' => $q, 'sort' => [['id' => 'asc']],
    '_source' => ['id', 'Name', 'Ship', 'Nft', 'Control'],
  ]);
  if ($r === null) { if (is_file($ff)) { readfile($ff); exit; } fail(502, 'Influence did not answer (ships). Please try again in a minute.'); }
  [$docs, $total] = $r;
  foreach ($docs as $d) {
    $s = $d['Ship'] ?? [];
    $o = intval($s['transitOrigin']['id'] ?? 0); $t = intval($s['transitDestination']['id'] ?? 0);
    if (!$o || !$t || empty($s['transitArrival'])) continue;
    $owner = $d['Nft']['owner'] ?? null;
    $ships[] = [intval($d['id']), $d['Name']['name'] ?? null, intval($s['shipType'] ?? 0),
                $owner ? std_addr($owner) : null, intval($d['Control']['controller']['id'] ?? 0),
                $o, $t, $unix($s['transitDeparture'] ?? 0), $unix($s['transitArrival'])];
  }
  if (!$docs || count($ships) >= $total) break;
}

// orbits of the asteroids involved – static game data, kept in the same cache as orbits.php
$cf = $CACHE . '/orbits.json';
$all = is_file($cf) ? (json_decode(file_get_contents($cf), true) ?: []) : [];
$ids = [];
foreach ($ships as $s) { $ids[$s[5]] = 1; $ids[$s[6]] = 1; }
$miss = array_values(array_filter(array_keys($ids), fn($i) => !isset($all[$i])));
foreach (array_chunk($miss, 500) as $chunk) {
  $r = try_search('asteroid_v1', ['size' => 500, '_source' => ['id', 'Orbit', 'Name'], 'query' => ['terms' => ['id' => $chunk]]]);
  if ($r === null) continue;
  foreach ($r[0] as $a) if (!empty($a['Orbit'])) $all[intval($a['id'])] = ['o' => $a['Orbit'], 'n' => $a['Name']['name'] ?? null];
}
if ($miss) @file_put_contents($cf, json_encode($all), LOCK_EX);
$orbits = []; $names = [];
foreach (array_keys($ids) as $i) if (isset($all[$i])) {
  $o = $all[$i]['o'];
  $orbits[$i] = [$o['a'], $o['ecc'], $o['inc'], $o['raan'], $o['argp'], $o['m']];
  if (!empty($all[$i]['n'])) $names[$i] = $all[$i]['n'];
}

$out = json_encode(['fetched' => $now, 'ships' => $ships, 'orbits' => (object)$orbits, 'names' => (object)$names]);
@file_put_contents($ff, $out, LOCK_EX);
echo $out;
