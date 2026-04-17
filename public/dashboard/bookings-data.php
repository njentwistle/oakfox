<?php
// Protected by the inherited Basic Auth on /dashboard/.
require_once __DIR__ . '/../api/_booking_lib.php';

header('Content-Type: application/json');

$data = bookings_load();
$tz = new DateTimeZone('Europe/London');
$now = new DateTimeImmutable('now', $tz);

$upcoming = [];
$past = [];
$cancelled = [];

foreach ($data['bookings'] as $b) {
    try {
        $start = new DateTimeImmutable($b['start']);
    } catch (Exception $e) { continue; }

    $row = [
        'id' => $b['id'] ?? '',
        'start' => $b['start'] ?? '',
        'end' => $b['end'] ?? '',
        'name' => $b['name'] ?? '',
        'email' => $b['email'] ?? '',
        'phone' => $b['phone'] ?? '',
        'notes' => $b['notes'] ?? '',
        'status' => $b['status'] ?? '',
        'created' => $b['created'] ?? '',
    ];

    if (($b['status'] ?? '') === 'cancelled') {
        $cancelled[] = $row;
    } elseif ($start >= $now) {
        $upcoming[] = $row;
    } else {
        $past[] = $row;
    }
}

usort($upcoming, fn($a, $b) => strcmp($a['start'], $b['start']));
usort($past, fn($a, $b) => strcmp($b['start'], $a['start']));
usort($cancelled, fn($a, $b) => strcmp($b['start'], $a['start']));

echo json_encode([
    'upcoming' => $upcoming,
    'past' => $past,
    'cancelled' => $cancelled,
    'stats' => [
        'upcoming' => count($upcoming),
        'past' => count($past),
        'cancelled' => count($cancelled),
    ],
]);
