<?php
// proxy.php

// Get the target URL from the query string (?url=...)
$url = isset($_GET['url']) ? $_GET['url'] : '';
if (!$url) {
    http_response_code(400);
    echo 'Missing url parameter';
    exit;
}

// Validate URL (basic check)
if (!filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo 'Invalid url parameter';
    exit;
}

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: *');

// Forward the request
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo 'Failed to fetch remote content';
    exit;
}

// Pass through the content type
if ($contentType) {
    header('Content-Type: ' . $contentType);
} else {
    header('Content-Type: text/html');
}

http_response_code($httpCode);
echo $response;