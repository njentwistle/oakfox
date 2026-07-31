<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$services = $_POST['services'] ?? [];
$message = trim($_POST['message'] ?? '');
$honeypot = trim($_POST['website'] ?? '');
$elapsedMs = (int) ($_POST['elapsed_ms'] ?? 0);

// Bots fill the hidden field or submit faster than any human can. Silent
// success in both cases so they don't learn to adapt.
if ($honeypot !== '' || $elapsedMs < 2500) {
    echo json_encode(['success' => true]);
    exit;
}

// Validate — message is optional so low-friction "get in touch" enquiries work.
if (empty($name) || empty($email)) {
    http_response_code(400);
    echo json_encode(['error' => 'Please add your name and email.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Please enter a valid email address.']);
    exit;
}

if (strlen($name) > 120 || strlen($message) > 5000) {
    http_response_code(400);
    echo json_encode(['error' => 'One of the fields is too long.']);
    exit;
}

// Per-IP rate limit: 3 sends per rolling hour (same file-bucket pattern as
// carbon-audit.php).
$workDir = sys_get_temp_dir() . '/oakfox-contact';
if (!is_dir($workDir)) {
    @mkdir($workDir, 0700, true);
}
foreach (glob($workDir . '/rate-*') ?: [] as $oldBucket) {
    if (time() - (int) @filemtime($oldBucket) > 7200) {
        @unlink($oldBucket);
    }
}
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$bucketFile = $workDir . '/rate-' . md5($ip) . '-' . date('YmdH');
$hits = (int) @file_get_contents($bucketFile);
if ($hits >= 3) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many messages from this connection — please email nathan@oakfox.co.uk directly.']);
    exit;
}
@file_put_contents($bucketFile, (string) ($hits + 1));

// Links in the name or message are the classic spam signature. The enquiry is
// still delivered (flagged), but attacker content is never relayed back out
// via the confirmation email.
$looksSpammy = (bool) preg_match('~https?://|www\.~i', $name . ' ' . $message);

// Sanitise
$name = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
$email = filter_var($email, FILTER_SANITIZE_EMAIL);
$message = $message !== ''
    ? htmlspecialchars($message, ENT_QUOTES, 'UTF-8')
    : '(No message — quick enquiry. Suggest replying to arrange a call.)';

if (is_array($services)) {
    $allowed = ['Branding', 'Web Design', 'Development', 'Hosting', 'Copywriting', 'Marketing', 'Not sure yet'];
    $services = array_filter($services, fn($s) => in_array($s, $allowed));
    $serviceList = implode(', ', $services);
} else {
    $serviceList = 'None selected';
}

$to = 'nathan@oakfox.co.uk';
$subject = ($looksSpammy ? '[Possible spam] ' : '') . "New enquiry from {$name}";
$date = date('j M Y, g:ia');

$utmSource   = htmlspecialchars(trim($_POST['utm_source'] ?? ''), ENT_QUOTES, 'UTF-8');
$utmMedium   = htmlspecialchars(trim($_POST['utm_medium'] ?? ''), ENT_QUOTES, 'UTF-8');
$utmCampaign = htmlspecialchars(trim($_POST['utm_campaign'] ?? ''), ENT_QUOTES, 'UTF-8');
$utmTerm     = htmlspecialchars(trim($_POST['utm_term'] ?? ''), ENT_QUOTES, 'UTF-8');
$gclid       = htmlspecialchars(trim($_POST['gclid'] ?? ''), ENT_QUOTES, 'UTF-8');

$sourceInfo = '';
if ($utmSource || $gclid) {
    $sourceInfo = "\n--- Ad Attribution ---\n";
    if ($gclid)       $sourceInfo .= "Google Ads Click: Yes\n";
    if ($utmSource)   $sourceInfo .= "Source: {$utmSource}\n";
    if ($utmMedium)   $sourceInfo .= "Medium: {$utmMedium}\n";
    if ($utmCampaign) $sourceInfo .= "Campaign: {$utmCampaign}\n";
    if ($utmTerm)     $sourceInfo .= "Keyword: {$utmTerm}\n";
}

// ── Email to Nathan ──
$nathanBody = <<<EOT
New project enquiry via oakfox.co.uk

Name: {$name}
Email: {$email}
Services: {$serviceList}
Date: {$date}

Message:
{$message}
{$sourceInfo}
EOT;

// Envelope sender must be a real cPanel mailbox so SPF passes at Gmail/Outlook.
$envelopeSender = 'nathan@oakfox.co.uk';
$headers = "From: OakFox <{$envelopeSender}>\r\n";
$headers .= "Reply-To: {$name} <{$email}>\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = mail($to, $subject, $nathanBody, $headers, '-f' . $envelopeSender);
if (!$sent) {
    error_log('[contact] admin notification failed for ' . $email);
}

// ── Confirmation to client — skipped for flagged submissions so the form
// can't be used to relay spam content to arbitrary addresses ──
if (!$looksSpammy) {
    $clientSubject = "Thanks for getting in touch — OakFox";
    $clientBody = <<<EOT
Hi {$name},

Thanks for reaching out to OakFox. We've received your enquiry and will be in touch shortly.

Here's a copy of what you sent:

Services: {$serviceList}

Message:
{$message}

Speak soon,
Nathan
OakFox — oakfox.co.uk
EOT;

    $clientHeaders = "From: OakFox <{$envelopeSender}>\r\n";
    $clientHeaders .= "Reply-To: OakFox <nathan@oakfox.co.uk>\r\n";
    $clientHeaders .= "Content-Type: text/plain; charset=UTF-8\r\n";

    $clientSent = mail($email, $clientSubject, $clientBody, $clientHeaders, '-f' . $envelopeSender);
    if (!$clientSent) {
        error_log('[contact] client confirmation failed for ' . $email);
    }
}

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send. Please email nathan@oakfox.co.uk directly.']);
}
