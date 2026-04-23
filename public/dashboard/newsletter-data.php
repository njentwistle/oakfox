<?php
// Protected by inherited Basic Auth on the /dashboard/ directory.
// Reads the bespoke newsletter JSON and returns a summary.

header('Content-Type: application/json');

$path = __DIR__ . '/../api/data/newsletter.json';

if (!file_exists($path)) {
    echo json_encode(['subscribers' => [], 'stats' => ['total' => 0, 'confirmed' => 0, 'pending' => 0, 'unsubscribed' => 0]]);
    exit;
}

$raw = @file_get_contents($path);
$data = json_decode($raw, true);
if (!is_array($data) || !isset($data['subscribers'])) {
    echo json_encode(['subscribers' => [], 'stats' => ['total' => 0, 'confirmed' => 0, 'pending' => 0, 'unsubscribed' => 0]]);
    exit;
}

$subscribers = $data['subscribers'];
$stats = ['total' => count($subscribers), 'confirmed' => 0, 'pending' => 0, 'unsubscribed' => 0];

$public = [];
foreach ($subscribers as $s) {
    $status = $s['status'] ?? 'pending';
    if (isset($stats[$status])) $stats[$status]++;
    $public[] = [
        'email' => $s['email'] ?? '',
        'status' => $status,
        'created' => $s['created'] ?? null,
        'confirmed' => $s['confirmed'] ?? null,
        'updated' => $s['updated'] ?? null,
    ];
}

// Support ?format=csv for download
if (($_GET['format'] ?? '') === 'csv') {
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="oakfox-subscribers-' . date('Y-m-d') . '.csv"');
    $fp = fopen('php://output', 'w');
    fputcsv($fp, ['email', 'status', 'created', 'confirmed']);
    foreach ($public as $row) {
        fputcsv($fp, [$row['email'], $row['status'], $row['created'], $row['confirmed']]);
    }
    fclose($fp);
    exit;
}

echo json_encode(['subscribers' => $public, 'stats' => $stats]);
