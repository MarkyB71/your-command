<?php
// Shared helper for the picture scripts (not reachable from the web – see .htaccess).
// Fetches a picture once, re-draws it as a clean PNG (optionally smaller), caches it and serves it.
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(403); exit; }

function img_get($url) {
  $ch = curl_init($url);
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 40, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 3]);
  $d = curl_exec($ch);
  $c = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return ($c === 200 && is_string($d) && strlen($d) > 0) ? $d : null;
}

function img_unavailable($code = 503) {
  http_response_code($code);
  if ($code === 503) header('Retry-After: 60');
  exit;
}

// $file: cache file path; $url: where to get it; $maxw: shrink to this width (0 = keep size)
function img_serve($file, $url, $maxw = 0) {
  if (!is_file($file)) {
    if (!function_exists('imagecreatefromstring')) img_unavailable();
    $data = $url ? img_get($url) : null;
    if (!$data || strlen($data) > 15000000) img_unavailable();
    $im = @imagecreatefromstring($data);
    if (!$im) img_unavailable();
    $w = imagesx($im); $h = imagesy($im);
    $nw = ($maxw && $w > $maxw) ? $maxw : $w; $nh = max(1, intval(round($h * $nw / $w)));
    $out = imagecreatetruecolor($nw, $nh);
    imagealphablending($out, false); imagesavealpha($out, true);
    imagefill($out, 0, 0, imagecolorallocatealpha($out, 0, 0, 0, 127));
    imagecopyresampled($out, $im, 0, 0, 0, 0, $nw, $nh, $w, $h);
    ob_start(); imagepng($out, null, 9); $png = ob_get_clean();
    imagedestroy($im); imagedestroy($out);
    @file_put_contents($file, $png, LOCK_EX);
  }
  header('Content-Type: image/png');
  header('X-Content-Type-Options: nosniff');
  header('Cache-Control: public, max-age=604800');
  readfile($file);
  exit;
}

const IPFS = 'https://developed-white-hedgehog.myfilebase.com/ipfs/';