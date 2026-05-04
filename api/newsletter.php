<?php
header('Content-Type: application/json');

require_once __DIR__ . '/_newsletter_lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$email = trim($_POST['email'] ?? '');
$honeypot = trim($_POST['website'] ?? '');

if ($honeypot !== '') {
    // Silent success for bots hitting the honeypot field
    echo json_encode(['success' => true]);
    exit;
}

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['error' => 'Please enter an email address.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Please enter a valid email address.']);
    exit;
}

$email = strtolower(filter_var($email, FILTER_SANITIZE_EMAIL));
$data = newsletter_load();
$existingIndex = newsletter_find_by_email($data, $email);

$now = date('c');

if ($existingIndex !== null) {
    $sub = $data['subscribers'][$existingIndex];
    if (($sub['status'] ?? '') === 'confirmed') {
        echo json_encode(['success' => true, 'message' => "You're already on the list."]);
        exit;
    }
    // Reset token, resend confirmation for pending / unsubscribed
    $data['subscribers'][$existingIndex]['status'] = 'pending';
    $data['subscribers'][$existingIndex]['token'] = newsletter_token();
    $data['subscribers'][$existingIndex]['updated'] = $now;
    $token = $data['subscribers'][$existingIndex]['token'];
} else {
    $token = newsletter_token();
    $data['subscribers'][] = [
        'email' => $email,
        'status' => 'pending',
        'token' => $token,
        'created' => $now,
        'updated' => $now,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
    ];
}

if (!newsletter_save($data)) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not save — please try again in a moment.']);
    exit;
}

// Send double opt-in confirmation email
$confirmUrl = 'https://oakfox.co.uk/api/newsletter-confirm.php?t=' . urlencode($token);
$subject = 'Confirm your OakFox subscription';
$body = <<<EOT
Hi,

You (or someone using your email address) asked to join the OakFox newsletter —
a short, occasional letter on sustainable design, development, and the small
things we're learning at the studio.

Confirm your subscription by clicking the link below:

{$confirmUrl}

If this wasn't you, just ignore this email — nothing will happen until you
confirm.

— Nathan
OakFox · oakfox.co.uk
EOT;

// Envelope sender must be a real cPanel mailbox so SPF passes at Gmail/Outlook.
$envelopeSender = 'nathan@oakfox.co.uk';
$headers = "From: OakFox <{$envelopeSender}>\r\n";
$headers .= "Reply-To: OakFox <nathan@oakfox.co.uk>\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$subscriberSent = mail($email, $subject, $body, $headers, '-f' . $envelopeSender);
if (!$subscriberSent) {
    error_log('[newsletter] confirmation email failed for ' . $email);
}

// Notify Nathan of the new pending subscriber
$adminSubject = 'New newsletter signup (pending) — ' . $email;
$adminBody = <<<EOT
A new email address signed up to the OakFox newsletter and has been sent
a double opt-in confirmation link.

Email: {$email}
Status: pending confirmation
Time: {$now}
EOT;

mail('nathan@oakfox.co.uk', $adminSubject, $adminBody, $headers, '-f' . $envelopeSender);

echo json_encode([
    'success' => true,
    'message' => "Check your inbox — we've sent a confirmation link.",
]);
