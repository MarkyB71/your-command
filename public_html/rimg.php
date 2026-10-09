<?php
// Resource (product) icon by product id (?p=1..245), shrunk to 96 px.
// Picture ids come from the @influenceth/sdk image manifest, fetched once and kept in cache/rescid.json.
require __DIR__ . '/_img.php';
$p = intval($_GET['p'] ?? 0);
if ($p < 1 || $p > 999) img_unavailable(400);
$file = __DIR__ . '/cache/res_' . $p . '.png';
$url = null;
if (!is_file($file)) {
  $mf = __DIR__ . '/cache/rescid.json';
  $map = is_file($mf) ? json_decode(file_get_contents($mf), true) : null;
  if (!$map) {
    $j = null;
    foreach (['https://cdn.jsdelivr.net/npm/@influenceth/sdk@2.7.2/assets/images/manifests/images.v1.json',
              'https://unpkg.com/@influenceth/sdk@2.7.2/assets/images/manifests/images.v1.json'] as $u) {
      $raw = img_get($u); if ($raw) { $j = json_decode($raw, true); if ($j) break; }
    }
    $map = [];
    foreach (($j['assets'] ?? []) as $a) {
      $cid = (string)($a['cid'] ?? '');
      if (($a['kind'] ?? '') === 'resource-icon' && !empty($a['id']) && preg_match('/^[A-Za-z0-9]{40,80}$/', $cid)) $map[intval($a['id'])] = $cid;
    }
    if (!$map) img_unavailable();
    @file_put_contents($mf, json_encode($map), LOCK_EX);
  }
  if (empty($map[$p])) img_unavailable(404);
  $url = IPFS . $map[$p];
}
img_serve($file, $url, 96);