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

// Check if client wants status updates
$wantStatus = isset($_GET['status']) && $_GET['status'] === '1';

if ($wantStatus) {
    // Send immediate status response
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'proxy_active', 
        'message' => 'Proxy responding, fetching content...',
        'timestamp' => time()
    ]);
    exit;
}

// Forward the request and capture headers
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo 'Failed to fetch remote content';
    exit;
}

// Split headers and body
$headers = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

// Parse and forward relevant headers
$headerLines = explode("\r\n", $headers);
foreach ($headerLines as $line) {
    if (stripos($line, 'Content-Type:') === 0) {
        header($line);
    } elseif (stripos($line, 'Last-Modified:') === 0) {
        header($line);
    } elseif (stripos($line, 'ETag:') === 0) {
        header($line);
    } elseif (stripos($line, 'Cache-Control:') === 0) {
        header($line);
    }
}

http_response_code($httpCode);
echo $body;