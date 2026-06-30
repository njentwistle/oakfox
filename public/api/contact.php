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

// Sanitise
$name = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
$email = filter_var($email, FILTER_SANITIZE_EMAIL);
$message = $message !== ''
    ? htmlspecialchars($message, ENT_QUOTES, 'UTF-8')
    : '(No message — quick enquiry. Suggest replying to arrange a call.)';

if (is_array($services)) {
    $allowed = ['Branding', 'Web Design', 'Development', 'Hosting', 'Copywriting', 'Marketing', 'Environmental', 'Not sure yet'];
    $services = array_filter($services, fn($s) => in_array($s, $allowed));
    $serviceList = implode(', ', $services);
} else {
    $serviceList = 'None selected';
}

$to = 'nathan@oakfox.co.uk';
$subject = "New enquiry from {$name}";
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

// ── Confirmation to client ──
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

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send. Please email nathan@oakfox.co.uk directly.']);
}
