<?php
// Ship picture by type and variant (?t=2&v=2). Uses the example ship id that api.php noted for that
// type/variant, so nobody can make the server fetch (and cache) a picture of their choosing.
require __DIR__ . '/_img.php';
$t = intval($_GET['t'] ?? 0); $v = intval($_GET['v'] ?? 0);
// ?g=1 – the in-game ship picture (no NFT card) from the game's own image set (@influenceth/sdk images.v1 manifest,
// icons/ships/w400). Fixed list, so nobody can make the server fetch anything else.
if (!empty($_GET['g'])) {
  $G = [1 => 'QmbSvDnie4iMn8cLFJQTpTFMXEQwT3DY5WS4bVjCzYcVPx', 2 => 'QmNPuAkXYBuFnThwYEjG48ry3EBCbKBykKAPiXAc6vZHuT',
        3 => 'Qmc7gGhYcFeifFaqHbMjRWooiuKm2Pf44ZC4mkiyHaUHnj', 4 => 'Qmb9mnBwfH8ntw6KNkt294yUHyQj65v4jxtuiEted3hT44'];
  if (!isset($G[$t])) img_unavailable(404);
  img_serve(__DIR__ . '/cache/shpg_' . $t . '.png', IPFS . $G[$t], 0);
}
if ($t < 1 || $t > 9 || $v < 1 || $v > 9) img_unavailable(400);
$small = !empty($_GET['s']);   // ?s=1 gives a small copy for thumbnails
$file = __DIR__ . '/cache/shp_' . $t . '_' . $v . ($small ? '_240' : '') . '.png';
$url = null;
if (!is_file($file)) {
  $svf = __DIR__ . '/cache/shipvariants.json';
  $sv = is_file($svf) ? (json_decode(file_get_contents($svf), true) ?: []) : [];
  $id = intval($sv[$t . '_' . $v] ?? 0);
  if (!$id) img_unavailable(404);
  $url = 'https://images.influenceth.io/v2/ships/' . $id . '/image.png';
}
img_serve($file, $url, $small ? 240 : 0);