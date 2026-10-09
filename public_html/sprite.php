<?php
// Crewmate sprite sheets and their atlases (the game's own portrait layers), fetched once from IPFS and cached.
// ?p=body&t=json  → atlas (frame positions)    ?p=body&t=png → sprite sheet
// Only the 16 files listed below can be fetched, so the server can't be used to pull anything else.
require __DIR__ . '/_img.php';
$CID = [
  'body'      => ['Qma4buremdGjkVJaUrJ3nq6UWnJ8LHX2SxNnqH52XJEfi4', 'QmQDqPtk7L9bEhCqjkWy7nnJS5Q1jrH7dBPugTAwvdVDsM'],
  'feature'   => ['QmNpRNrxVw3dE98PNHTLAx6Y7Pooj5nAZ9UFVzuaxZR6hz', 'QmSVkZnH5W82477SEVpBu291CTeftMsqiQzZzsyRNJV94g'],
  'hair'      => ['QmZKR4SbZzAgA232qC5m4xpW2RUJXndm7qXYhBtJCRVJXi', 'QmNQGS4a4FpEcBMAndxuaKp2dPMG4QzkAesn1y3aVSNqgX'],
  'headPiece' => ['QmS3tSm4NFDZrWAoqfnTCUwtuG3i82xeePzjcfN85x2bLF', 'QmT1FXQsoEPtGoUsN4k8sFFKZff4bDwvxiA2YhQAtL8NiN'],
  'item'      => ['QmW2cv4FwKfMRTAv4X3WCEcFX491oCQqXKnXp9SzBVjr7Y', 'QmbYdVx4y4zptXZCXHAbdy4Lc4DXnMcvdXP22n7c9uXeTk'],
  'leadership'=> ['QmVqdVFf83dEEGKyajMcjz7DxUY8Ex98gspocfEGe6i9u4', 'QmadRoxGo9P2GhXDLw9pf9nfwWrUoNaJK3TsN1R7KWNaxR'],
  'misc'      => ['QmP7Gxbpp6qKJvtRddM1sRU4XT7EBvRSiUnmLEiS8xLg22', 'QmfLYQ3mYxqk649jcx2GZCUcXcDWDPsoeTQZ7xdi5XQSjS'],
  'outfit'    => ['QmdHXN3ACbUfg1Bbq5m3adK436WLctamK69atSTHQ4q75v', 'QmQ3fj2EjseoM7DJJF9mYF5GBPZSsvYfVQUvW3H1MNN5Pu'],
];
$p = $_GET['p'] ?? '';
$t = ($_GET['t'] ?? '') === 'json' ? 'json' : 'png';
if (!isset($CID[$p])) img_unavailable(404);
$cid = $CID[$p][$t === 'json' ? 0 : 1];
$file = __DIR__ . '/cache/sprite_' . $cid . '.' . $t;
if (!is_file($file)) {
  $data = img_get(IPFS . $cid);
  if (!$data || strlen($data) > 30000000) img_unavailable();
  if ($t === 'json' && json_decode($data) === null) img_unavailable();
  if ($t === 'png' && substr($data, 0, 8) !== "\x89PNG\r\n\x1a\n") img_unavailable();
  @file_put_contents($file, $data, LOCK_EX);
}
header('Content-Type: ' . ($t === 'json' ? 'application/json' : 'image/png'));
header('X-Content-Type-Options: nosniff');
header('Cache-Control: public, max-age=2592000, immutable');
readfile($file);
