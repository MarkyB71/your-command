<?php
// Influence Stock – asteroid orbits (static game data) for the travel maths. Read-only.
require __DIR__ . '/_api.php';
$ids = array_values(array_unique(array_filter(array_map('intval', explode(',', (string)($_GET['ids'] ?? ''))), fn($i) => $i > 0 && $i <= 250000)));
if (!$ids || count($ids) > 200) fail(400, 'Give 1 to 200 asteroid ids.');
$cf = $CACHE . '/orbits.json';
$all = is_file($cf) ? (json_decode(file_get_contents($cf), true) ?: []) : [];
$miss = array_values(array_filter($ids, fn($i) => !isset($all[$i])));
if ($miss) {
  $r = try_search('asteroid_v1', ['size' => 200, '_source' => ['id', 'Orbit', 'Name'], 'query' => ['terms' => ['id' => $miss]]]);
  if ($r === null) fail(502, 'Could not look up those asteroids just now.');
  foreach ($r[0] as $a) if (!empty($a['Orbit'])) $all[intval($a['id'])] = ['o' => $a['Orbit'], 'n' => $a['Name']['name'] ?? null];
  @file_put_contents($cf, json_encode($all), LOCK_EX);
}
$out = [];
foreach ($ids as $i) if (isset($all[$i])) $out[$i] = $all[$i];
echo json_encode(['orbits' => (object)$out]);