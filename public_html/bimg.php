<?php
// Building picture by type (?t=1..10), from the game's own image set.
require __DIR__ . '/_img.php';
$CID = [
  1 => 'QmbjnJvdst5MSfeaA9L3ZDbdbGB3fPhA5LADAUV5fzKbFM', 2 => 'QmZj4osCZ2oYN6wjmZzShPiPiCJyDccRfiLy8RymCfCn9a',
  3 => 'QmdYF4SSDkR2Z2f4WXNyZHE4L3ovt6mijJ8dD8f7Byc7j7', 4 => 'QmRKf6BmZ9oYUxGfnpHqn3VkUkaNMMPUaWZqyGQ6GPg6TM',
  5 => 'QmWSYx6bba6q6GvB7PuamR7NB7coTEGVUAhjvhkvXJuZkP', 6 => 'QmT2fDpAHcnHym8Lu8JDcnjqKXbBN9JHJ2pw8EH9L4zUhs',
  7 => 'QmRKGMoWSWGqDLhUzM7qiLKYJwnbYJ39xsf3vyUzUmvBy8', 8 => 'QmdN14bdmtPnmNpSRRNrf9MLr5kH73QSzUcvjqrHd7tnfA',
  9 => 'QmdGtRkGSHmZMaU7TSRyCARgTr76G5jN47fNAL3w7oJUUk', 10 => 'QmdxLap3Pk9KZ9TmaLqHDz6SLQTFi4mAue6MU7bUJoooz9',
];
$t = intval($_GET['t'] ?? 0);
if (!isset($CID[$t])) img_unavailable(400);
// ?l=1 – a large copy (1000 px wide) for full-screen use, e.g. the Logistics Hub airlock view (8 Nov 2026)
$big = !empty($_GET['l']);
img_serve(__DIR__ . '/cache/bld_' . $t . ($big ? '_1000' : '_160') . '.png', IPFS . $CID[$t], $big ? 1000 : 160);