#!/usr/bin/env php
<?php

/**
 * This is brief procedural example code for PHP.
 *
 * A more robust, object-oriented implementation can be found in
 * \SparkLib\Phant, available from:
 *
 * https://github.com/sparkfun/SparkLib
 */

$endpoint = 'https://data.sparkfun.com';
$pubhash  = '6JJ4dEYoqNTwjyMVn0ZM';
$privhash = 'WwwZVA7W5PiMG92Ym0p2';

// $data['private_key'] = $privhash;

echo "Who are you? ";
$data['who'] = fgets(STDIN);

echo "Where are you at? ";
$data['where'] = fgets(STDIN);

$data['code'] = 'PHP';

echo "What's your favorite animal? ";
$data['favorite_animal'] = fgets(STDIN);

$postbody = http_build_query($data);

$headers = [
  "Content-type: application/x-www-form-urlencoded",
  "Phant-Private-Key: $privhash"
];

$opts = [
  'http' => [
    'method'  => 'POST',
    'header'  => $headers,
    'content' => $postbody
  ]
];

$url = $endpoint . '/input/' . $pubhash;

$context = stream_context_create($opts);

echo file_get_contents($url, false, $context);
