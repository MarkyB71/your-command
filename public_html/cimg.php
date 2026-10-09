<?php
// Crewmate portrait by crewmate id (?id=40302, &s=1 for a small copy).
// Only crewmates that api.php has seen for a visitor are allowed, so nobody can make the server fetch thousands of pictures.
require __DIR__ . '/_img.php';
$id = intval($_GET['id'] ?? 0);
if ($id < 1 || $id > 10000000) img_unavailable(400);
$small = !empty($_GET['s']);
$file = __DIR__ . '/cache/mate_' . $id . ($small ? '_160' : '') . '.png';
$url = null;
if (!is_file($file)) {
  $mf = __DIR__ . '/cache/mateids.json';
  $known = is_file($mf) ? (json_decode(file_get_contents($mf), true) ?: []) : [];
  if (empty($known[$id])) img_unavailable(404);
  $url = 'https://images.influenceth.io/v2/crewmates/' . $id . '/image.png';
}
img_serve($file, $url, $small ? 160 : 0);