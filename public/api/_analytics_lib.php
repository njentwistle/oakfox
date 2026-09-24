<?php
// Shared helpers for OakFox's first-party, cookieless analytics.
//
// Nothing is stored on or read from the visitor's device. Each hit carries a
// visitor id = hash(daily salt + IP + user agent); the salt is replaced every
// day and never kept, so ids can't be linked across days or reversed to an
// IP. Raw IPs are never written. Data lives in ./data/analytics/ (deny-all
// .htaccess inherited from ./data/) as one JSON line per hit, one file a month.

const ANALYTICS_EVENTS = ['contact', 'newsletter', 'booking', 'audit'];

function analytics_dir(): string {
    $dir = __DIR__ . '/data/analytics';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    return $dir;
}

function analytics_today(): string {
    return (new DateTimeImmutable('now', new DateTimeZone('Europe/London')))->format('Y-m-d');
}

// Today's salt, created on first use and replaced (not archived) each day.
function analytics_salt(): string {
    $path = analytics_dir() . '/salt.json';
    $today = analytics_today();
    $fp = @fopen($path, 'c+');
    if (!$fp) return $today;
    flock($fp, LOCK_EX);
    $current = json_decode(stream_get_contents($fp) ?: '', true);
    if (!is_array($current) || ($current['date'] ?? '') !== $today || empty($current['salt'])) {
        $current = ['date' => $today, 'salt' => bin2hex(random_bytes(16))];
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($current));
        fflush($fp);
    }
    flock($fp, LOCK_UN);
    fclose($fp);
    return $current['salt'];
}

function analytics_visitor_id(string $ip, string $ua): string {
    return substr(hash('sha256', analytics_salt() . '|' . $ip . '|' . $ua), 0, 16);
}

function analytics_is_bot(string $ua): bool {
    return (bool) preg_match(
        '/bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|curl|wget|python|httpclient|axios|node-fetch|go-http|java\//i',
        $ua
    );
}

// Excluded devices: hashed IPs of whoever opens the dashboard's Analytics page,
// so Nathan's own browsing doesn't count. Kept for 90 days from last seen.
function analytics_exclusions_path(): string {
    return analytics_dir() . '/exclude.json';
}

function analytics_ip_key(string $ip): string {
    return hash('sha256', 'oakfox-exclude|' . $ip);
}

function analytics_load_exclusions(): array {
    $raw = @file_get_contents(analytics_exclusions_path());
    $list = json_decode($raw ?: '', true);
    return is_array($list) ? $list : [];
}

function analytics_is_excluded(string $ip): bool {
    $list = analytics_load_exclusions();
    $seen = $list[analytics_ip_key($ip)] ?? 0;
    return $seen > time() - 90 * 86400;
}

function analytics_exclude(string $ip): void {
    $list = analytics_load_exclusions();
    $list[analytics_ip_key($ip)] = time();
    $cutoff = time() - 90 * 86400;
    $list = array_filter($list, fn ($t) => $t > $cutoff);
    @file_put_contents(analytics_exclusions_path(), json_encode($list), LOCK_EX);
}

function analytics_append(array $hit): void {
    $file = analytics_dir() . '/' . substr($hit['d'], 0, 7) . '.jsonl';
    @file_put_contents($file, json_encode($hit, JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);
}

// Every hit between two London dates (inclusive), oldest first.
function analytics_read(string $from, string $to): array {
    $hits = [];
    $month = new DateTimeImmutable(substr($from, 0, 7) . '-01');
    $last = substr($to, 0, 7);
    while ($month->format('Y-m') <= $last) {
        $file = analytics_dir() . '/' . $month->format('Y-m') . '.jsonl';
        if (is_file($file)) {
            foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                $h = json_decode($line, true);
                if (is_array($h) && $h['d'] >= $from && $h['d'] <= $to) $hits[] = $h;
            }
        }
        $month = $month->modify('+1 month');
    }
    return $hits;
}

// Where a visit came from: [label, group]. Campaign tags win over the referrer.
function analytics_source(array $h): array {
    $utm = strtolower(trim($h['us'] ?? ''));
    if ($utm !== '') return [$utm, 'Campaign'];
    $r = strtolower($h['r'] ?? '');
    if ($r === '') return ['Direct', 'Direct'];
    $rules = [
        ['/(^|\.)gemini\.google\./', 'Gemini', 'AI'],
        ['/(^|\.)google\./', 'Google', 'Search'],
        ['/(^|\.)bing\.com$/', 'Bing', 'Search'],
        ['/(^|\.)duckduckgo\.com$/', 'DuckDuckGo', 'Search'],
        ['/(^|\.)ecosia\.org$/', 'Ecosia', 'Search'],
        ['/(^|\.)yahoo\./', 'Yahoo', 'Search'],
        ['/(^|\.)(chatgpt\.com|chat\.openai\.com)$/', 'ChatGPT', 'AI'],
        ['/(^|\.)perplexity\.ai$/', 'Perplexity', 'AI'],
        ['/(^|\.)claude\.ai$/', 'Claude', 'AI'],
        ['/(^|\.)copilot\.microsoft\.com$/', 'Copilot', 'AI'],
        ['/(^|\.)(linkedin\.com|lnkd\.in)$/', 'LinkedIn', 'Social'],
        ['/(^|\.)instagram\.com$/', 'Instagram', 'Social'],
        ['/(^|\.)(facebook\.com|fb\.me)$/', 'Facebook', 'Social'],
        ['/(^|\.)(t\.co|x\.com|twitter\.com)$/', 'X', 'Social'],
    ];
    foreach ($rules as [$re, $label, $group]) {
        if (preg_match($re, $r)) return [$label, $group];
    }
    return [$r, 'Referral'];
}
