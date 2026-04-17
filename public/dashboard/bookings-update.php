<?php
// Protected by the inherited Basic Auth on /dashboard/.
require_once __DIR__ . '/../api/_booking_lib.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$id = trim($_POST['id'] ?? '');
$action = trim($_POST['action'] ?? '');
if ($id === '' || !in_array($action, ['cancel'], true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing id or unsupported action']);
    exit;
}

$data = bookings_load();
$idx = null;
foreach ($data['bookings'] as $i => $b) {
    if (($b['id'] ?? '') === $id) { $idx = $i; break; }
}
if ($idx === null) {
    http_response_code(404);
    echo json_encode(['error' => 'Booking not found']);
    exit;
}

if ($action === 'cancel') {
    $b = $data['bookings'][$idx];
    if (($b['status'] ?? '') !== 'cancelled') {
        $data['bookings'][$idx]['status'] = 'cancelled';
        $data['bookings'][$idx]['cancelled'] = date('c');
        $data['bookings'][$idx]['cancelledBy'] = 'admin';
        if (!bookings_save($data)) {
            http_response_code(500);
            echo json_encode(['error' => 'Could not save']);
            exit;
        }

        // Notify client
        if (!empty($b['email'])) {
            try {
                $dt = new DateTimeImmutable($b['start']);
                $label = $dt->format('l, j F · H:i') . ' (UK time)';
            } catch (Exception $e) { $label = $b['start']; }

            $body = "Hi " . $b['name'] . ",\n\n"
                . "We've had to cancel your OakFox call scheduled for {$label}. "
                . "Sorry for the short notice — feel free to book another time that works for you at https://oakfox.co.uk/book or reply to this email.\n\n"
                . "— Nathan\nOakFox";
            $headers = "From: OakFox <noreply@oakfox.co.uk>\r\nReply-To: OakFox <nathan@oakfox.co.uk>\r\nContent-Type: text/plain; charset=UTF-8\r\n";
            @mail($b['email'], 'Your OakFox call has been cancelled', $body, $headers);
        }
    }
}

echo json_encode(['success' => true]);
