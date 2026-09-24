<?php
// Protected by the inherited Basic Auth on /dashboard/.
// Aggregates the cookieless analytics for the dashboard's Analytics page, and
// excludes the requesting device (hashed IP) from future counts.
require_once __DIR__ . '/../api/_analytics_lib.php';

header('Content-Type: application/json');
header('Cache-Control: no-store');

analytics_exclude($_SERVER['REMOTE_ADDR'] ?? '');

$days = (int) ($_GET['days'] ?? 28);
if (!in_array($days, [7, 28, 90], true)) $days = 28;

$tz = new DateTimeZone('Europe/London');
$today = new DateTimeImmutable('today', $tz);
$start = $today->modify('-' . ($days - 1) . ' days');
$prevEnd = $start->modify('-1 day');
$prevStart = $prevEnd->modify('-' . ($days - 1) . ' days');

$all = analytics_read($prevStart->format('Y-m-d'), $today->format('Y-m-d'));
$cur = array_values(array_filter($all, fn ($h) => $h['d'] >= $start->format('Y-m-d')));
$prev = array_values(array_filter($all, fn ($h) => $h['d'] <= $prevEnd->format('Y-m-d')));

// Visitors = distinct daily ids summed over the period (ids rotate daily).
function totals(array $hits): array {
    $t = ['visitors' => 0, 'pageviews' => 0, 'visits' => 0, 'events' => array_fill_keys(ANALYTICS_EVENTS, 0)];
    $daily = [];
    foreach ($hits as $h) {
        if ($h['k'] === 'pv') {
            $t['pageviews']++;
            $t['visits'] += $h['en'];
            $daily[$h['d'] . $h['v']] = true;
        } elseif (isset($t['events'][$h['e']])) {
            $t['events'][$h['e']]++;
        }
    }
    $t['visitors'] = count($daily);
    return $t;
}

function top(array $counts, int $n = 10): array {
    arsort($counts);
    $rows = [];
    foreach (array_slice($counts, 0, $n, true) as $k => $v) $rows[] = ['label' => (string) $k, 'value' => $v];
    return $rows;
}

$series = [];
for ($d = $start; $d <= $today; $d = $d->modify('+1 day')) {
    $series[$d->format('Y-m-d')] = ['date' => $d->format('Y-m-d'), 'visitors' => [], 'pageviews' => 0];
}
$pages = $entryPages = $sources = $sourceGroup = $groups = $devices = $campaigns = [];
$conversions = [];
$live = [];
$liveCutoff = time() - 30 * 60;

foreach ($cur as $h) {
    $source = analytics_source($h);
    if ($h['k'] === 'pv') {
        $series[$h['d']]['pageviews']++;
        $series[$h['d']]['visitors'][$h['v']] = true;
        $pages[$h['p']] = ($pages[$h['p']] ?? 0) + 1;
        if ($h['t'] >= $liveCutoff) $live[$h['v']] = true;
        if ($h['en']) {
            $entryPages[$h['p']] = ($entryPages[$h['p']] ?? 0) + 1;
            $sources[$source[0]] = ($sources[$source[0]] ?? 0) + 1;
            $sourceGroup[$source[0]] = $source[1];
            $groups[$source[1]] = ($groups[$source[1]] ?? 0) + 1;
            if ($h['dev'] !== '') $devices[$h['dev']] = ($devices[$h['dev']] ?? 0) + 1;
            if ($h['us'] !== '' || $h['uc'] !== '') {
                $key = implode(' / ', array_filter([$h['us'], $h['um'], $h['uc']], fn ($x) => $x !== ''));
                $campaigns[$key] = ($campaigns[$key] ?? 0) + 1;
            }
        }
    } else {
        $conversions[] = ['t' => $h['t'], 'event' => $h['e'], 'path' => $h['p'], 'source' => $source[0]];
    }
}

$first = null;
foreach (glob(analytics_dir() . '/*.jsonl') ?: [] as $file) {
    $fh = fopen($file, 'r');
    $h = json_decode(($fh ? fgets($fh) : '') ?: '', true);
    if ($fh) fclose($fh);
    if (is_array($h) && ($first === null || $h['d'] < $first)) $first = $h['d'];
}

echo json_encode([
    'days' => $days,
    'range' => [$start->format('Y-m-d'), $today->format('Y-m-d')],
    'since' => $first,
    'live' => count($live),
    'current' => totals($cur),
    'previous' => totals($prev),
    'series' => array_values(array_map(
        fn ($s) => ['date' => $s['date'], 'visitors' => count($s['visitors']), 'pageviews' => $s['pageviews']],
        $series
    )),
    'pages' => top($pages),
    'entryPages' => top($entryPages),
    'sources' => array_map(fn ($r) => $r + ['group' => $sourceGroup[$r['label']] ?? ''], top($sources)),
    'groups' => top($groups),
    'devices' => top($devices, 3),
    'campaigns' => top($campaigns),
    'conversions' => array_slice(array_reverse($conversions), 0, 20),
], JSON_UNESCAPED_SLASHES);
