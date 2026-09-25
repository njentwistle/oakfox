<?php
// Client sign-off. GET ?t=<token> returns the agreement; POST signs it, once.
// The token is the only key, so every failure looks the same from outside.
require_once __DIR__ . '/_signoff_lib.php';

header('Content-Type: application/json');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

function reply(int $status, array $body): void {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

const NOT_FOUND = 'This link isn’t valid. Please check it, or email nathan@oakfox.co.uk.';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $doc = signoff_load($_GET['t'] ?? '');
    if (!$doc) reply(404, ['error' => NOT_FOUND]);
    reply(200, signoff_public($doc));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') reply(405, ['error' => 'Method not allowed.']);

$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) reply(400, ['error' => 'Something went wrong sending the form. Please try again.']);

$token = $in['t'] ?? '';
$name = signoff_clean((string) ($in['name'] ?? ''), 120);
$role = signoff_clean((string) ($in['role'] ?? ''), 120);
$email = trim((string) ($in['email'] ?? ''));
$billing = (string) ($in['billing'] ?? '');

if (mb_strlen($name) < 2) reply(400, ['error' => 'Type your full name to sign.', 'field' => 'name']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) reply(400, ['error' => 'Enter an email address we can send your copy to.', 'field' => 'email']);
if (($in['agree'] ?? false) !== true) reply(400, ['error' => 'Tick the box to confirm you agree.', 'field' => 'agree']);

$result = signoff_locked(function () use ($token, $name, $role, $email, $billing) {
    $doc = signoff_load($token);
    if (!$doc) return [404, ['error' => NOT_FOUND]];
    $choice = signoff_billing($doc);
    if ($choice && !in_array($billing, ['monthly', 'annually'], true)) {
        return [400, ['error' => 'Choose whether you’d like to pay monthly or annually.', 'field' => 'billing']];
    }
    $status = $doc['status'] ?? 'awaiting';
    if ($status === 'signed') return [409, ['error' => 'This agreement has already been signed.', 'agreement' => signoff_public($doc)]];
    if ($status !== 'awaiting') return [410, ['error' => 'This agreement has been withdrawn. Please email nathan@oakfox.co.uk.']];

    $fingerprint = signoff_fingerprint($doc);
    if ($fingerprint !== ($doc['fingerprint'] ?? '')) {
        return [409, ['error' => 'This agreement has changed since it was sent. Please email nathan@oakfox.co.uk for a fresh link.']];
    }
    $doc['status'] = 'signed';
    $doc['signature'] = [
        'name' => $name,
        'role' => $role,
        'email' => $email,
        'billing' => $choice ? $billing : null,
        'signedAt' => (new DateTimeImmutable('now'))->format(DATE_ATOM),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
        'userAgent' => mb_substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 400),
        'fingerprint' => $fingerprint,
    ];
    // Payment reminders start from today: the domain yearly, and the monthly
    // items monthly or yearly as the client chose.
    $doc['payments'] = signoff_schedule($doc, (new DateTimeImmutable('today'))->format('Y-m-d'));
    if (!signoff_save($token, $doc)) return [500, ['error' => 'We couldn’t save your signature. Please try again, or email nathan@oakfox.co.uk.']];
    return [200, $doc];
});

if ($result === null) reply(500, ['error' => 'We couldn’t save your signature. Please try again, or email nathan@oakfox.co.uk.']);
[$status, $doc] = $result;
if ($status !== 200) reply($status, $doc);

// The record is saved before any email goes, so a mail failure never loses it.
$sent = signoff_send_copies($token, $doc);
reply(200, ['agreement' => signoff_public($doc), 'emailed' => $sent['client']]);
