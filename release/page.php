<?php
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: 0");
header("Content-Type: text/html; charset=UTF-8");
header("X-Debug-Time: " . date('Y-m-d H:i:s'));

$file = __DIR__ . '/index.html';

if (file_exists($file)) {
    include($file);
} else {
    http_response_code(404);
    echo "<h1>404 Page Not Found</h1>";
}
