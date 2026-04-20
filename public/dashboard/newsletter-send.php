<?php
// Protected by inherited Basic Auth on /dashboard/.
// Compose and send the OakFox Studio Notes letter to confirmed subscribers.

require_once __DIR__ . '/../api/_newsletter_lib.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$subject = trim($_POST['subject'] ?? '');
$body = trim($_POST['body'] ?? '');
$mode = $_POST['mode'] ?? 'full';
$testEmail = trim($_POST['testEmail'] ?? '');

if ($subject === '' || $body === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Subject and body are both required.']);
    exit;
}

if (strlen($subject) > 200) {
    http_response_code(400);
    echo json_encode(['error' => 'Subject is too long (max 200 characters).']);
    exit;
}

if (strlen($body) > 50000) {
    http_response_code(400);
    echo json_encode(['error' => 'Body is too long (max 50,000 characters).']);
    exit;
}

// --- Markdown-ish to HTML conversion (simple, safe) ---
function letter_body_to_html(string $text): string {
    // Escape HTML first
    $html = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');

    // Split into paragraphs on blank lines
    $paragraphs = preg_split('/\n\s*\n/', $html);

    $out = [];
    foreach ($paragraphs as $p) {
        $p = trim($p);
        if ($p === '') continue;

        // Headings: line starting with ## or #
        if (preg_match('/^# (.+)$/m', $p, $m) && strpos($p, "\n") === false) {
            $out[] = '<h2 style="font-family: Georgia, serif; font-size: 22px; font-weight: 500; color: #1A1D17; margin: 32px 0 12px;">' . $m[1] . '</h2>';
            continue;
        }
        if (preg_match('/^## (.+)$/m', $p, $m) && strpos($p, "\n") === false) {
            $out[] = '<h3 style="font-family: Georgia, serif; font-size: 18px; font-weight: 500; color: #1A1D17; margin: 24px 0 10px;">' . $m[1] . '</h3>';
            continue;
        }

        // Bold: **text**
        $p = preg_replace('/\*\*([^*]+)\*\*/', '<strong>$1</strong>', $p);
        // Italic: *text*
        $p = preg_replace('/(?<!\*)\*([^*]+)\*(?!\*)/', '<em>$1</em>', $p);
        // Links: [text](url)
        $p = preg_replace_callback(
            '/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/',
            fn($m) => '<a href="' . $m[2] . '" style="color: #1A5C12; text-decoration: underline;">' . $m[1] . '</a>',
            $p
        );
        // Auto-link bare URLs
        $p = preg_replace_callback(
            '/(?<![=">])\b(https?:\/\/[^\s<)]+)/',
            fn($m) => '<a href="' . $m[1] . '" style="color: #1A5C12; text-decoration: underline;">' . $m[1] . '</a>',
            $p
        );
        // Line breaks within paragraph
        $p = nl2br($p);
        $out[] = '<p style="margin: 0 0 16px; line-height: 1.6;">' . $p . '</p>';
    }
    return implode("\n", $out);
}

function letter_build_html(string $subject, string $bodyHtml, string $unsubUrl): string {
    $year = date('Y');
    return <<<HTML
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{$subject}</title>
</head>
<body style="margin: 0; padding: 0; background: #F5F0E8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1A1D17;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #F5F0E8;">
<tr><td align="center" style="padding: 40px 20px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background: #FAF7F2; border-radius: 12px; border: 1px solid rgba(26,92,18,0.1); overflow: hidden;">
<tr><td style="padding: 36px 40px 20px;">
<a href="https://oakfox.co.uk" style="display: inline-block; text-decoration: none;">
<img src="https://oakfox.co.uk/images/site/logo.png" alt="OakFox" width="120" style="display: block; height: auto; border: 0; outline: none; text-decoration: none; margin-bottom: 14px;" />
</a>
<p style="font-family: 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #1A5C12; margin: 0;">Studio Notes</p>
</td></tr>
<tr><td style="padding: 0 40px 32px;">
{$bodyHtml}
</td></tr>
<tr><td style="padding: 20px 40px; border-top: 1px solid rgba(26,29,23,0.1); background: rgba(26,29,23,0.02);">
<p style="margin: 0; font-size: 12px; color: rgba(26,29,23,0.55); line-height: 1.5;">
You're receiving this because you subscribed at oakfox.co.uk.<br>
<a href="{$unsubUrl}" style="color: #1A5C12;">Unsubscribe</a>
 &middot;
<a href="https://oakfox.co.uk" style="color: #1A5C12;">oakfox.co.uk</a>
</p>
<p style="margin: 8px 0 0; font-size: 11px; color: rgba(26,29,23,0.35);">&copy; OakFox {$year} &middot; Martland Mill, Mart Ln, Burscough, L40 0SD</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
HTML;
}

function letter_send(string $to, string $subject, string $plainBody, string $token): bool {
    $unsubUrl = 'https://oakfox.co.uk/api/newsletter-unsubscribe.php?t=' . urlencode($token);
    $htmlBody = letter_build_html($subject, letter_body_to_html($plainBody), $unsubUrl);

    $plainFoot = "\n\n---\nYou're receiving this because you subscribed at oakfox.co.uk.\nUnsubscribe: {$unsubUrl}\noakfox.co.uk";
    $plainFull = $plainBody . $plainFoot;

    // Multipart/alternative
    $boundary = 'oakfox-' . bin2hex(random_bytes(8));
    $headers = "From: OakFox <noreply@oakfox.co.uk>\r\n";
    $headers .= "Reply-To: OakFox <nathan@oakfox.co.uk>\r\n";
    $headers .= "List-Unsubscribe: <{$unsubUrl}>\r\n";
    $headers .= "List-Unsubscribe-Post: List-Unsubscribe=One-Click\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";

    $message = "--{$boundary}\r\n";
    $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $message .= $plainFull . "\r\n\r\n";
    $message .= "--{$boundary}\r\n";
    $message .= "Content-Type: text/html; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $message .= $htmlBody . "\r\n\r\n";
    $message .= "--{$boundary}--";

    return @mail($to, $subject, $message, $headers);
}

// --- Test mode: send one email to the given address ---
if ($mode === 'test') {
    if (!filter_var($testEmail, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Please enter a valid test email.']);
        exit;
    }
    $ok = letter_send($testEmail, '[TEST] ' . $subject, $body, 'test-token-not-real');
    echo json_encode($ok
        ? ['success' => true, 'message' => 'Test sent to ' . $testEmail]
        : ['success' => false, 'error' => 'Mail server refused the test. Try again.']
    );
    exit;
}

// --- Full send: iterate confirmed subscribers ---
@set_time_limit(0);
ignore_user_abort(true);

$data = newsletter_load();
$confirmed = [];
foreach ($data['subscribers'] as $s) {
    if (($s['status'] ?? '') === 'confirmed') $confirmed[] = $s;
}

if (empty($confirmed)) {
    echo json_encode(['error' => 'No confirmed subscribers yet.']);
    exit;
}

$sent = 0; $failed = 0;
$startedAt = date('c');
foreach ($confirmed as $s) {
    $ok = letter_send($s['email'], $subject, $body, $s['token']);
    if ($ok) $sent++; else $failed++;
    // Gentle pause to avoid tripping per-hour mail throttles on shared hosting
    if (($sent + $failed) % 20 === 0) { usleep(500000); }
}

// Log the campaign
$campaignsPath = __DIR__ . '/../api/data/campaigns.json';
$campaigns = ['campaigns' => []];
if (file_exists($campaignsPath)) {
    $raw = @file_get_contents($campaignsPath);
    $parsed = json_decode($raw, true);
    if (is_array($parsed) && isset($parsed['campaigns'])) $campaigns = $parsed;
}
$campaigns['campaigns'][] = [
    'id' => 'cmp_' . bin2hex(random_bytes(6)),
    'subject' => $subject,
    'body' => $body,
    'sentAt' => $startedAt,
    'completedAt' => date('c'),
    'recipients' => $sent,
    'failed' => $failed,
];
@file_put_contents($campaignsPath, json_encode($campaigns, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

echo json_encode([
    'success' => true,
    'sent' => $sent,
    'failed' => $failed,
    'total' => count($confirmed),
]);
