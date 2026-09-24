<?php
// Beacon endpoint for the cookieless analytics in src/components/Analytics.astro.
// Always answers 204 with no body: a beacon can't read a response anyway, and
// rejected hits shouldn't be distinguishable from accepted ones.
require_once __DIR__ . '/_analytics_lib.php';

http_response_code(204);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') exit;

// Same-origin beacons only (when the browser says where it came from).
$from = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
if ($from !== '' && parse_url($from, PHP_URL_HOST) !== 'oakfox.co.uk') exit;

$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
if ($ua === '' || $ip === '' || analytics_is_bot($ua) || analytics_is_excluded($ip)) exit;

$in = json_decode((string) file_get_contents('php://input', false, null, 0, 2048), true);
if (!is_array($in)) exit;

$path = (string) ($in['p'] ?? '');
if (!preg_match('#^/[A-Za-z0-9/_.%-]{0,200}$#', $path)) exit;
if (preg_match('#^/(dashboard|api|brand)/#', $path)) exit;

$kind = ($in['k'] ?? '') === 'ev' ? 'ev' : 'pv';
$event = '';
if ($kind === 'ev') {
    $event = (string) ($in['e'] ?? '');
    if (!in_array($event, ANALYTICS_EVENTS, true)) exit;
}

$clean = fn ($v, $len = 80) => mb_substr(preg_replace('/[^\w.\-+ %\/]/u', '', (string) ($v ?? '')), 0, $len);
$ref = strtolower($clean($in['r'] ?? '', 120));
if ($ref === 'oakfox.co.uk') $ref = '';

$width = (int) ($in['w'] ?? 0);
$device = $width === 0 ? '' : ($width < 768 ? 'mobile' : ($width < 1024 ? 'tablet' : 'desktop'));

analytics_append([
    't' => time(),
    'd' => analytics_today(),
    'k' => $kind,
    'e' => $event,
    'p' => $path,
    'en' => $kind === 'pv' && !empty($in['en']) ? 1 : 0,
    'r' => $ref,
    'us' => $clean($in['us'] ?? ''),
    'um' => $clean($in['um'] ?? ''),
    'uc' => $clean($in['uc'] ?? ''),
    'dev' => $device,
    'v' => analytics_visitor_id($ip, $ua),
]);
