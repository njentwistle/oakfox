<?php
header('Content-Type: application/json');
require_once __DIR__ . '/_booking_lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$start = trim($_POST['start'] ?? '');
$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$notes = trim($_POST['notes'] ?? '');
$honeypot = trim($_POST['website'] ?? '');

if ($honeypot !== '') {
    echo json_encode(['success' => true]);
    exit;
}

if (empty($start) || empty($name) || empty($email)) {
    http_response_code(400);
    echo json_encode(['error' => 'Please fill in name, email, and pick a slot.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Please enter a valid email.']);
    exit;
}

if (strlen($name) > 120 || strlen($phone) > 40 || strlen($notes) > 2000) {
    http_response_code(400);
    echo json_encode(['error' => 'One of the fields is too long.']);
    exit;
}

$data = bookings_load();

if (!booking_is_valid_slot($start, $data)) {
    http_response_code(409);
    echo json_encode(['error' => 'That slot is no longer available. Please pick another.']);
    exit;
}

// Recompute end time from slot start
try {
    $startDt = new DateTimeImmutable($start);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid slot time.']);
    exit;
}
$endDt = $startDt->modify('+' . BOOKING_SLOT_MINUTES . ' minutes');

$token = booking_token();
$id = booking_id();
$now = date('c');

$booking = [
    'id' => $id,
    'start' => $startDt->format('c'),
    'end' => $endDt->format('c'),
    'name' => htmlspecialchars($name, ENT_QUOTES, 'UTF-8'),
    'email' => strtolower(filter_var($email, FILTER_SANITIZE_EMAIL)),
    'phone' => htmlspecialchars($phone, ENT_QUOTES, 'UTF-8'),
    'notes' => htmlspecialchars($notes, ENT_QUOTES, 'UTF-8'),
    'status' => 'confirmed',
    'token' => $token,
    'created' => $now,
    'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
];

$data['bookings'][] = $booking;

if (!bookings_save($data)) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not save the booking. Please try again in a moment.']);
    exit;
}

// Human-readable time
$timeLabel = $startDt->format('l, j F Y · H:i') . ' (UK time)';
$cancelUrl = 'https://oakfox.co.uk/api/booking-cancel.php?t=' . urlencode($token);

// Email the client
$clientSubject = 'Your OakFox call is booked — ' . $startDt->format('j M, H:i');
$clientBody = <<<EOT
Hi {$booking['name']},

Your free initial call with OakFox is booked:

When: {$timeLabel}
Duration: 30 minutes
Cancel: {$cancelUrl}

We'll call you on the number provided, or reply to this email if you'd prefer a
video call and share a link. If anything changes, just reply to this email.

Speak soon,
Nathan
OakFox · oakfox.co.uk · 07730 396404
EOT;

$headers = "From: OakFox <noreply@oakfox.co.uk>\r\n";
$headers .= "Reply-To: OakFox <nathan@oakfox.co.uk>\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

@mail($booking['email'], $clientSubject, $clientBody, $headers);

// Email Nathan
$adminSubject = 'New booking — ' . $startDt->format('j M, H:i') . ' · ' . $booking['name'];
$adminBody = <<<EOT
New booking via oakfox.co.uk/book

When: {$timeLabel}
Name: {$booking['name']}
Email: {$booking['email']}
Phone: {$booking['phone']}

Notes:
{$booking['notes']}

Booking ID: {$id}
EOT;

@mail('nathan@oakfox.co.uk', $adminSubject, $adminBody, $headers);

echo json_encode([
    'success' => true,
    'booking' => [
        'id' => $id,
        'start' => $booking['start'],
        'end' => $booking['end'],
        'label' => $timeLabel,
    ],
]);
