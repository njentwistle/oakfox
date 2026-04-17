<?php
// Protected by inherited Basic Auth. Lists past campaigns.
header('Content-Type: application/json');

$path = __DIR__ . '/../api/data/campaigns.json';
if (!file_exists($path)) {
    echo json_encode(['campaigns' => []]);
    exit;
}
$raw = @file_get_contents($path);
$data = json_decode($raw, true);
if (!is_array($data) || !isset($data['campaigns'])) {
    echo json_encode(['campaigns' => []]);
    exit;
}

$list = $data['campaigns'];
usort($list, fn($a, $b) => strcmp($b['sentAt'] ?? '', $a['sentAt'] ?? ''));

// Trim bodies for list view
$public = array_map(fn($c) => [
    'id' => $c['id'] ?? '',
    'subject' => $c['subject'] ?? '',
    'sentAt' => $c['sentAt'] ?? '',
    'recipients' => $c['recipients'] ?? 0,
    'failed' => $c['failed'] ?? 0,
], $list);

echo json_encode(['campaigns' => $public]);
