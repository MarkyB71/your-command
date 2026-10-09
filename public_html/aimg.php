<?php
// Asteroid picture (the game's 3D render card) by asteroid id (?id=27963, &s=1 for a small copy).
// Only asteroids that api.php has seen for a visitor are allowed, so nobody can make the server fetch thousands of pictures.
require __DIR__ . '/_img.php';
$id = intval($_GET['id'] ?? 0);
if ($id < 1 || $id > 250000) img_unavailable(400);
$small = !empty($_GET['s']);
$file = __DIR__ . '/cache/ast_' . $id . ($small ? '_360' : '') . '.png';
$url = null;
if (!is_file($file)) {
  $af = __DIR__ . '/cache/astids.json';
  $known = is_file($af) ? (json_decode(file_get_contents($af), true) ?: []) : [];
  if (empty($known[$id])) img_unavailable(404);
  $url = 'https://images.influenceth.io/v2/asteroids/' . $id . '/image.png';
}
img_serve($file, $url, $small ? 360 : 0);