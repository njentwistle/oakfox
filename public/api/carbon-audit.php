<?php
/**
 * Website carbon audit crawler.
 *
 * Fetches a public URL, discovers its declared assets (images, scripts,
 * stylesheets, fonts, media — including url() references inside linked CSS),
 * and returns total transfer bytes. The client converts bytes to CO2e with
 * co2.js (Sustainable Web Design Model).
 *
 * GET /api/carbon-audit.php?url=example.com
 *  -> { ok, url, finalUrl, bytes, requests, breakdown, cached, elapsedMs }
 */

// Notices or deprecation output would corrupt the JSON response on hosts
// with display_errors enabled.
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);
ini_set('display_errors', '0');

header('Content-Type: application/json');

const MAX_ASSETS = 60;
const MAX_CSS_FILES = 12;
const MAX_BODY_BYTES = 20971520;     // 20 MB per resource guard
const TIME_BUDGET_SECONDS = 28;      // overall crawl deadline
const CACHE_TTL_SECONDS = 3600;
const RATE_LIMIT_PER_MINUTE = 10;
// Chrome-like UA (with our token appended) so CDNs — Google Fonts especially —
// serve the same subset woff2 payloads a real browser downloads, not legacy
// TTF fallbacks.
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 OakFoxCarbonAudit/1.0 (+https://oakfox.co.uk/website-carbon-audit)';

$startedAt = microtime(true);

function fail(int $status, string $code, string $message): void
{
    http_response_code($status);
    echo json_encode(['ok' => false, 'error' => $code, 'message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    fail(405, 'method', 'Method not allowed');
}

// ---------------------------------------------------------------- input ----
$raw = trim($_GET['url'] ?? '');
if ($raw === '') {
    fail(400, 'missing-url', 'Add ?url=your-site.co.uk');
}
if (!preg_match('~^https?://~i', $raw)) {
    $raw = 'https://' . $raw;
}
$parts = parse_url($raw);
if ($parts === false || empty($parts['host']) || !str_contains($parts['host'], '.')) {
    fail(400, 'invalid-url', 'That does not look like a valid web address.');
}
if (isset($parts['port']) && !in_array((int) $parts['port'], [80, 443], true)) {
    fail(400, 'invalid-url', 'Only standard web ports are supported.');
}
$targetUrl = strtolower($parts['scheme']) . '://' . $parts['host'] . ($parts['path'] ?? '/');

// -------------------------------------------------------- rate limit + cache
$workDir = sys_get_temp_dir() . '/oakfox-carbon-audit';
if (!is_dir($workDir)) {
    @mkdir($workDir, 0700, true);
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$bucketFile = $workDir . '/rate-' . md5($ip) . '-' . date('YmdHi');
$hits = (int) @file_get_contents($bucketFile);
if ($hits >= RATE_LIMIT_PER_MINUTE) {
    fail(429, 'rate-limit', 'Too many audits from this connection — give it a minute and try again.');
}
@file_put_contents($bucketFile, (string) ($hits + 1));

$cacheFile = $workDir . '/result-' . md5($targetUrl);
if (is_file($cacheFile) && (time() - filemtime($cacheFile)) < CACHE_TTL_SECONDS) {
    $cached = json_decode((string) file_get_contents($cacheFile), true);
    if (is_array($cached)) {
        $cached['cached'] = true;
        echo json_encode($cached);
        exit;
    }
}

// ------------------------------------------------------------- SSRF guard --
function host_is_public(string $host): bool
{
    if (filter_var($host, FILTER_VALIDATE_IP)) {
        $ips = [$host];
    } else {
        $ips = [];
        foreach (@dns_get_record($host, DNS_A + DNS_AAAA) ?: [] as $record) {
            $ips[] = $record['ip'] ?? $record['ipv6'] ?? null;
        }
        $ips = array_values(array_filter($ips));
        if (!$ips) {
            $fallback = gethostbyname($host);
            if ($fallback === $host) {
                return false; // did not resolve
            }
            $ips = [$fallback];
        }
    }
    foreach ($ips as $candidate) {
        if (filter_var($candidate, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
            return false;
        }
    }
    return true;
}

function url_is_allowed(string $url): bool
{
    $p = parse_url($url);
    if ($p === false || empty($p['host']) || empty($p['scheme'])) {
        return false;
    }
    if (!in_array(strtolower($p['scheme']), ['http', 'https'], true)) {
        return false;
    }
    if (isset($p['port']) && !in_array((int) $p['port'], [80, 443], true)) {
        return false;
    }
    return host_is_public($p['host']);
}

// --------------------------------------------------------------- fetchers --
function base_curl(string $url): CurlHandle
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false, // redirects handled manually so every hop is re-validated
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_USERAGENT => USER_AGENT,
        // Advertise gzip but do NOT auto-decompress, so strlen(body) = wire bytes.
        CURLOPT_HTTPHEADER => ['Accept-Encoding: gzip', 'Accept: */*'],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
        CURLOPT_MAXFILESIZE => MAX_BODY_BYTES,
        CURLOPT_NOPROGRESS => false,
        CURLOPT_PROGRESSFUNCTION => fn ($c, $dt, $dl) => ($dl > MAX_BODY_BYTES) ? 1 : 0,
    ]);
    return $ch;
}

/** Fetch a document, re-validating each redirect hop. Returns null on failure. */
function fetch_document(string $url, int $maxRedirects = 5): ?array
{
    for ($hop = 0; $hop <= $maxRedirects; $hop++) {
        if (!url_is_allowed($url)) {
            return null;
        }
        $headers = [];
        $ch = base_curl($url);
        curl_setopt($ch, CURLOPT_HEADERFUNCTION, function ($c, $line) use (&$headers) {
            $sep = strpos($line, ':');
            if ($sep !== false) {
                $headers[strtolower(trim(substr($line, 0, $sep)))] = trim(substr($line, $sep + 1));
            }
            return strlen($line);
        });
        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);

        if (in_array($status, [301, 302, 303, 307, 308], true) && !empty($headers['location'])) {
            $next = resolve_url($headers['location'], $url);
            if ($next === null) {
                return null;
            }
            $url = $next;
            continue;
        }
        if ($body === false || $status < 200 || $status >= 400) {
            return null;
        }
        $bytes = strlen($body);
        if (($headers['content-encoding'] ?? '') === 'gzip') {
            $decoded = @gzdecode($body);
            if ($decoded !== false) {
                $body = $decoded;
            }
        }
        return [
            'url' => $url,
            'body' => $body,
            'bytes' => $bytes,
            'contentType' => strtolower($headers['content-type'] ?? ''),
        ];
    }
    return null;
}

function resolve_url(string $ref, string $base): ?string
{
    $ref = trim($ref);
    if ($ref === '' || str_starts_with($ref, 'data:') || str_starts_with($ref, 'javascript:') || str_starts_with($ref, '#') || str_starts_with($ref, 'blob:')) {
        return null;
    }
    if (preg_match('~^https?://~i', $ref)) {
        return $ref;
    }
    $b = parse_url($base);
    if ($b === false || empty($b['host'])) {
        return null;
    }
    $origin = $b['scheme'] . '://' . $b['host'] . (isset($b['port']) ? ':' . $b['port'] : '');
    if (str_starts_with($ref, '//')) {
        return $b['scheme'] . ':' . $ref;
    }
    if (str_starts_with($ref, '/')) {
        return $origin . $ref;
    }
    $dir = preg_replace('~/[^/]*$~', '/', $b['path'] ?? '/');
    // Collapse ../ segments so relative asset paths resolve cleanly.
    $path = $dir . $ref;
    while (preg_match('~/[^/]+/\.\./~', $path)) {
        $path = preg_replace('~/[^/]+/\.\./~', '/', $path, 1);
    }
    return $origin . $path;
}

// ------------------------------------------------------- main page fetch ---
$page = fetch_document($targetUrl);
if ($page === null || !str_contains($page['contentType'], 'html')) {
    fail(422, 'fetch-failed', 'We could not fetch that page. Check the URL is public and loading.');
}

// ------------------------------------------------------ asset discovery ----
libxml_use_internal_errors(true);
$dom = new DOMDocument();
@$dom->loadHTML($page['body']);

$assetUrls = [];
$cssUrls = [];

$add = function (?string $ref, string $kind = 'asset') use (&$assetUrls, &$cssUrls, $page) {
    $abs = $ref === null ? null : resolve_url($ref, $page['url']);
    if ($abs === null) {
        return;
    }
    if ($kind === 'css') {
        $cssUrls[$abs] = true;
    } else {
        $assetUrls[$abs] = true;
    }
};

$pickFromSrcset = function (string $srcset): ?string {
    // A browser downloads one candidate; take the last (typically largest).
    $candidates = array_filter(array_map('trim', explode(',', $srcset)));
    if (!$candidates) {
        return null;
    }
    $last = end($candidates);
    return preg_split('~\s+~', $last)[0] ?? null;
};

// <picture> elements: a browser downloads ONE candidate — the first source
// whose type it supports (webp/avif) — not the <img> fallback as well.
$picturedImgs = new SplObjectStorage();
foreach ($dom->getElementsByTagName('picture') as $pic) {
    $img = $pic->getElementsByTagName('img')->item(0);
    if ($img) {
        $picturedImgs->attach($img);
        if (strtolower($img->getAttribute('loading')) === 'lazy') {
            continue;
        }
    }
    $chosen = null;
    foreach ($pic->getElementsByTagName('source') as $srcNode) {
        $candidate = $srcNode->getAttribute('srcset') ?: $srcNode->getAttribute('src');
        if ($candidate) {
            $chosen = $pickFromSrcset($candidate) ?? $candidate;
            break;
        }
    }
    if ($chosen !== null) {
        $add($chosen);
    } elseif ($img && $img->getAttribute('src')) {
        $add($img->getAttribute('src'));
    }
}

foreach ($dom->getElementsByTagName('img') as $node) {
    // Lazy-loaded images are not fetched on an initial page view, which is
    // what the industry-standard tools (and the SWD rating bands) measure.
    if ($picturedImgs->contains($node) || strtolower($node->getAttribute('loading')) === 'lazy') {
        continue;
    }
    if ($node->getAttribute('src')) {
        $add($node->getAttribute('src'));
    } elseif ($node->getAttribute('srcset')) {
        $add($pickFromSrcset($node->getAttribute('srcset')));
    }
}
foreach ($dom->getElementsByTagName('source') as $node) {
    // Picture sources were resolved above; only count media (video/audio) sources.
    if ($node->parentNode instanceof DOMElement && strtolower($node->parentNode->nodeName) === 'picture') {
        continue;
    }
    if ($node->getAttribute('src')) {
        $add($node->getAttribute('src'));
    } elseif ($node->getAttribute('srcset')) {
        $add($pickFromSrcset($node->getAttribute('srcset')));
    }
}
foreach ($dom->getElementsByTagName('script') as $node) {
    if ($node->getAttribute('src')) {
        $add($node->getAttribute('src'));
    }
}
foreach (['video', 'audio', 'embed'] as $tag) {
    foreach ($dom->getElementsByTagName($tag) as $node) {
        if ($node->getAttribute('src')) {
            $add($node->getAttribute('src'));
        }
        if ($node->getAttribute('poster')) {
            $add($node->getAttribute('poster'));
        }
    }
}
foreach ($dom->getElementsByTagName('link') as $node) {
    $rel = strtolower($node->getAttribute('rel'));
    $href = $node->getAttribute('href');
    if (!$href) {
        continue;
    }
    if (str_contains($rel, 'stylesheet')) {
        $add($href, 'css');
    } elseif (str_contains($rel, 'icon') || $rel === 'preload' || $rel === 'modulepreload') {
        $add($href);
    }
}
// Inline style="... url(...)" references.
if (preg_match_all('~url\(\s*[\'"]?([^\'")]+)[\'"]?\s*\)~i', $page['body'], $inlineRefs)) {
    foreach (array_slice($inlineRefs[1], 0, 20) as $ref) {
        $add($ref);
    }
}

// ------------------------------------------------ parallel asset weighing --
$breakdown = ['html' => $page['bytes'], 'css' => 0, 'js' => 0, 'images' => 0, 'fonts' => 0, 'media' => 0, 'other' => 0];
$requests = 1;
$totalBytes = $page['bytes'];

function classify(string $url, string $contentType): string
{
    $type = strtolower($contentType);
    $path = strtolower(parse_url($url, PHP_URL_PATH) ?? '');
    if (str_contains($type, 'javascript') || preg_match('~\.m?js(\?|$)~', $path)) {
        return 'js';
    }
    if (str_contains($type, 'css') || preg_match('~\.css(\?|$)~', $path)) {
        return 'css';
    }
    if (str_contains($type, 'image') || preg_match('~\.(png|jpe?g|webp|avif|gif|svg|ico)(\?|$)~', $path)) {
        return 'images';
    }
    if (str_contains($type, 'font') || preg_match('~\.(woff2?|ttf|otf|eot)(\?|$)~', $path)) {
        return 'fonts';
    }
    if (str_contains($type, 'video') || str_contains($type, 'audio') || preg_match('~\.(mp4|webm|mp3|ogg|m4a)(\?|$)~', $path)) {
        return 'media';
    }
    return 'other';
}

/**
 * Weigh a batch of URLs with curl_multi. Bodies are discarded while counting
 * unless $keepBodies is set (needed for CSS scanning).
 */
function weigh_batch(array $urls, bool $keepBodies, float $deadline): array
{
    // Completed results move to $done immediately: spl_object_id values are
    // recycled once a handle is closed, so $results must only ever hold
    // in-flight handles or later requests would clobber finished ones.
    $done = [];
    $results = [];
    $queue = array_values($urls);
    $multi = curl_multi_init();
    $active = [];

    $enqueue = function () use (&$queue, &$active, $multi, $keepBodies, &$results) {
        while (count($active) < 8 && $queue) {
            $url = array_shift($queue);
            if (!url_is_allowed($url)) {
                continue;
            }
            $state = ['url' => $url, 'bytes' => 0, 'body' => '', 'contentType' => '', 'encoding' => ''];
            $ch = base_curl($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
            curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($c, $chunk) use (&$results) {
                $id = spl_object_id($c);
                $results[$id]['bytes'] += strlen($chunk);
                if ($results[$id]['keep'] && $results[$id]['bytes'] <= MAX_BODY_BYTES) {
                    $results[$id]['body'] .= $chunk;
                }
                return strlen($chunk);
            });
            curl_setopt($ch, CURLOPT_HEADERFUNCTION, function ($c, $line) use (&$results) {
                $id = spl_object_id($c);
                $sep = strpos($line, ':');
                if ($sep !== false) {
                    $key = strtolower(trim(substr($line, 0, $sep)));
                    if ($key === 'content-type') {
                        $results[$id]['contentType'] = trim(substr($line, $sep + 1));
                    }
                    if ($key === 'content-encoding') {
                        $results[$id]['encoding'] = trim(substr($line, $sep + 1));
                    }
                }
                return strlen($line);
            });
            $id = spl_object_id($ch);
            $state['keep'] = $keepBodies;
            $results[$id] = $state;
            curl_multi_add_handle($multi, $ch);
            $active[$id] = $ch;
        }
    };

    $enqueue();
    do {
        curl_multi_exec($multi, $running);
        curl_multi_select($multi, 0.2);
        while ($info = curl_multi_info_read($multi)) {
            $ch = $info['handle'];
            $id = spl_object_id($ch);
            $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
            if ($status < 200 || $status >= 300) {
                $results[$id]['bytes'] = 0; // do not count failures/redirect stubs
                $results[$id]['body'] = '';
            }
            $done[] = $results[$id];
            unset($results[$id], $active[$id]);
            curl_multi_remove_handle($multi, $ch);
            curl_close($ch);
            $enqueue();
        }
        if (microtime(true) > $deadline) {
            break;
        }
    } while ($running || $active || $queue);

    foreach ($active as $ch) {
        curl_multi_remove_handle($multi, $ch);
        curl_close($ch);
    }
    curl_multi_close($multi);
    return $done;
}

$deadline = $startedAt + TIME_BUDGET_SECONDS;

// CSS first — its url() references feed the second batch. Font files are
// capped: font CSS (e.g. Google Fonts) lists every unicode-range subset, but
// a browser only downloads the handful it actually needs.
$fontRefs = [];
$cssBatch = weigh_batch(array_slice(array_keys($cssUrls), 0, MAX_CSS_FILES), true, $deadline);
foreach ($cssBatch as $css) {
    if ($css['bytes'] <= 0) {
        continue;
    }
    $requests++;
    $totalBytes += $css['bytes'];
    $breakdown['css'] += $css['bytes'];
    $cssBody = $css['body'];
    if (($css['encoding'] ?? '') === 'gzip') {
        $decoded = @gzdecode($cssBody);
        if ($decoded !== false) {
            $cssBody = $decoded;
        }
    }
    if (!$cssBody) {
        continue;
    }
    // @font-face blocks first: a browser only downloads subsets whose
    // unicode-range covers the page's text — for practical purposes, the
    // latin subset (contains U+0000). Subset-less blocks always load.
    if (preg_match_all('~@font-face\s*\{[^}]*\}~is', $cssBody, $faceBlocks)) {
        foreach ($faceBlocks[0] as $block) {
            if (preg_match('~unicode-range\s*:([^;}]+)~i', $block, $range) && stripos($range[1], 'U+0000') === false) {
                continue;
            }
            if (preg_match('~url\(\s*[\'"]?([^\'")]+)[\'"]?\s*\)~i', $block, $fontUrl)) {
                $abs = resolve_url($fontUrl[1], $css['url']);
                if ($abs !== null) {
                    $fontRefs[$abs] = true;
                }
            }
        }
        $cssBody = preg_replace('~@font-face\s*\{[^}]*\}~is', '', $cssBody);
    }
    if (preg_match_all('~url\(\s*[\'"]?([^\'")]+)[\'"]?\s*\)~i', $cssBody, $refs)) {
        foreach (array_slice($refs[1], 0, 30) as $ref) {
            $abs = resolve_url($ref, $css['url']);
            if ($abs === null) {
                continue;
            }
            if (preg_match('~\.(woff2?|ttf|otf|eot)(\?|$)~i', parse_url($abs, PHP_URL_PATH) ?? '')) {
                $fontRefs[$abs] = true;
            } else {
                $assetUrls[$abs] = true;
            }
        }
    }
}
foreach (array_slice(array_keys($fontRefs), 0, 8) as $fontUrl) {
    $assetUrls[$fontUrl] = true;
}

$assetBatch = weigh_batch(array_slice(array_keys($assetUrls), 0, MAX_ASSETS), false, $deadline);
foreach ($assetBatch as $asset) {
    if ($asset['bytes'] <= 0) {
        continue;
    }
    $requests++;
    $totalBytes += $asset['bytes'];
    $breakdown[classify($asset['url'], $asset['contentType'])] += $asset['bytes'];
}

// ------------------------------------------------------------- response ----
$result = [
    'ok' => true,
    'url' => $targetUrl,
    'finalUrl' => $page['url'],
    'bytes' => $totalBytes,
    'requests' => $requests,
    'breakdown' => $breakdown,
    'cached' => false,
    'elapsedMs' => (int) round((microtime(true) - $startedAt) * 1000),
];

@file_put_contents($cacheFile, json_encode($result));
echo json_encode($result);
