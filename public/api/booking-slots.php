<?php
header('Content-Type: application/json');
require_once __DIR__ . '/_booking_lib.php';

$date = trim($_GET['date'] ?? '');
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid date']);
    exit;
}

$data = bookings_load();
$slots = booking_slots_with_status($date, $data);

echo json_encode([
    'date' => $date,
    'slots' => $slots,
    'config' => [
        'openHour' => BOOKING_OPEN_HOUR,
        'closeHour' => BOOKING_CLOSE_HOUR,
        'slotMinutes' => BOOKING_SLOT_MINUTES,
        'minLeadHours' => BOOKING_MIN_LEAD_HOURS,
        'maxDaysAhead' => BOOKING_MAX_DAYS_AHEAD,
        'timezone' => 'Europe/London',
    ],
]);
