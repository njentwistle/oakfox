<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payload.']);
    exit;
}

$basics      = is_array($payload['basics'] ?? null)      ? $payload['basics']      : [];
$selected    = is_array($payload['selected'] ?? null)    ? $payload['selected']    : [];
$answers     = is_array($payload['answers'] ?? null)     ? $payload['answers']     : [];
$fieldLabels = is_array($payload['fieldLabels'] ?? null) ? $payload['fieldLabels'] : [];
$clientSummary = is_string($payload['summary'] ?? null)  ? $payload['summary']     : '';

// Validate required basics
$name    = trim($basics['client_name']    ?? '');
$company = trim($basics['client_company'] ?? '');
$email   = trim($basics['client_email']   ?? '');

if ($name === '' || $company === '' || $email === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Name, company and email are required.']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Please provide a valid email address.']);
    exit;
}

// Whitelist of section ids that the front end offers
$allowedSections = ['web', 'branding', 'marketing', 'development', 'consultancy'];
$sectionLabels = [
    'web'          => 'Web',
    'branding'     => 'Branding',
    'marketing'    => 'Marketing',
    'development'  => 'Development',
    'consultancy'  => 'Consultancy',
];
$selected = array_values(array_filter($selected, fn($s) => is_string($s) && in_array($s, $allowedSections, true)));

// Helpers
function cleanLine(string $s): string {
    // Keep new lines intact for textareas, strip control chars except LF/CR/TAB
    $s = preg_replace('/[^\P{C}\n\r\t]+/u', '', $s) ?? $s;
    return trim($s);
}
function esc(string $s): string {
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}
function nl2p(string $s): string {
    $s = esc($s);
    $s = str_replace(["\r\n", "\r"], "\n", $s);
    $parts = preg_split("/\n{2,}/", $s) ?: [$s];
    return implode('', array_map(fn($p) => '<p style="margin:0 0 10px 0; line-height:1.55;">' . nl2br($p) . '</p>', $parts));
}

// Normalise strings
foreach ($basics as $k => $v) { $basics[$k] = is_string($v) ? cleanLine($v) : ''; }
foreach ($answers as $k => $v) { $answers[$k] = is_string($v) ? cleanLine($v) : ''; }
foreach ($fieldLabels as $k => $v) { $fieldLabels[$k] = is_string($v) ? cleanLine($v) : ''; }

// Build the HTML email for Nathan (full detail)
$basicsOrder = [
    'client_name'     => 'Name',
    'client_role'     => 'Role',
    'client_company'  => 'Company',
    'client_email'    => 'Email',
    'client_phone'    => 'Phone',
    'client_site'     => 'Website',
    'client_budget'   => 'Budget',
    'client_timeline' => 'Timeline',
    'client_source'   => 'Heard via',
];

$basicsRows = '';
foreach ($basicsOrder as $key => $label) {
    $val = $basics[$key] ?? '';
    if ($val === '') continue;
    $basicsRows .= '<tr><td style="padding:6px 12px 6px 0; color:#777; vertical-align:top; white-space:nowrap;">' . esc($label) . '</td><td style="padding:6px 0; color:#222;">' . esc($val) . '</td></tr>';
}

$sectionsHtml = '';
foreach ($selected as $sid) {
    $sectionsHtml .= '<h2 style="margin:32px 0 12px 0; font-size:18px; color:#C46B1F; border-bottom:1px solid #eee; padding-bottom:6px;">' . esc($sectionLabels[$sid]) . '</h2>';
    $any = false;
    foreach ($answers as $fid => $val) {
        if ($val === '') continue;
        // A field "belongs" to the section if the front end only sent answers for ticked sections,
        // but we can't tell from id alone. So: print every non-empty answer once, grouped by
        // best-effort prefix match on the section id.
        if (strpos($fid, $sid . '_') !== 0) continue;
        $label = $fieldLabels[$fid] ?? $fid;
        $sectionsHtml .= '<div style="margin-bottom:14px;">';
        $sectionsHtml .= '<div style="font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#888; margin-bottom:4px;">' . esc($label) . '</div>';
        $sectionsHtml .= '<div style="color:#222; font-size:14px;">' . nl2p($val) . '</div>';
        $sectionsHtml .= '</div>';
        $any = true;
    }
    if (!$any) {
        $sectionsHtml .= '<p style="color:#999; font-style:italic; font-size:13px;">(no answers captured for this section)</p>';
    }
}

$notes = $basics['client_notes'] ?? '';
$notesBlock = '';
if ($notes !== '') {
    $notesBlock = '<h2 style="margin:32px 0 12px 0; font-size:18px; color:#C46B1F; border-bottom:1px solid #eee; padding-bottom:6px;">Notes</h2>' . nl2p($notes);
}

$selectedPretty = array_map(fn($s) => $sectionLabels[$s], $selected);
$selectedLine = $selectedPretty ? implode(', ', $selectedPretty) : 'none';
$date = date('j M Y, g:ia');

$nathanHtml = <<<HTML
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background:#F5F0E8; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:640px; margin:0 auto; padding:32px 24px; background:#fff;">
  <div style="border-bottom:2px solid #C46B1F; padding-bottom:14px; margin-bottom:20px;">
    <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.14em; color:#888;">OakFox onboarding</div>
    <h1 style="margin:6px 0 0 0; font-size:24px; color:#222;">{$company} — {$name}</h1>
    <div style="font-size:12px; color:#888; margin-top:4px;">{$date} · Areas: {$selectedLine}</div>
  </div>
  <table style="width:100%; border-collapse:collapse; font-size:14px;">{$basicsRows}</table>
  {$sectionsHtml}
  {$notesBlock}
  <hr style="border:none; border-top:1px solid #eee; margin:28px 0 14px;">
  <p style="font-size:11px; color:#999;">Submitted via the dashboard onboarding form.</p>
</div>
</body></html>
HTML;

// Plain-text fallback (also used as the basis for Nathan's copy if HTML mail is blocked)
$plainSummary = $clientSummary !== '' ? $clientSummary : "(summary missing)";

// ── Send to Nathan ──
$boundary = '=_oakfox_' . bin2hex(random_bytes(8));
$to = 'nathan@oakfox.co.uk';
$subject = "Onboarding · {$company} ({$name})";
$headers  = "From: OakFox <noreply@oakfox.co.uk>\r\n";
$headers .= "Reply-To: {$name} <{$email}>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";

$body  = "--{$boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n{$plainSummary}\r\n\r\n";
$body .= "--{$boundary}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n{$nathanHtml}\r\n\r\n";
$body .= "--{$boundary}--";

$nathanSent = mail($to, $subject, $body, $headers);

// ── Send copy to client ──
$clientSubject = "Thanks {$name} — your OakFox onboarding is in";
$clientPlain  = "Hi {$name},\n\n";
$clientPlain .= "Thanks for taking the time to fill in the OakFox onboarding — it makes a real difference to how we kick off. I've got your responses and will be in touch to book the next step.\n\n";
$clientPlain .= "Here's a copy of what we captured:\n\n";
$clientPlain .= $plainSummary . "\n\n";
$clientPlain .= "Any tweaks or things to add, just reply to this email.\n\n";
$clientPlain .= "Speak soon,\nNathan\nOakFox — oakfox.co.uk";

$clientIntroHtml = '<p style="margin:0 0 14px 0; line-height:1.55;">Hi ' . esc($name) . ',</p>'
    . '<p style="margin:0 0 14px 0; line-height:1.55;">Thanks for taking the time to fill in the OakFox onboarding — it makes a real difference to how we kick off. I\'ve got your responses and will be in touch to book the next step.</p>'
    . '<p style="margin:0 0 14px 0; line-height:1.55;">Here\'s a copy of what we captured, so you have it too:</p>';
$clientSignoff = '<p style="margin:20px 0 0 0; line-height:1.55;">Any tweaks or things to add, just reply to this email.</p>'
    . '<p style="margin:14px 0 0 0; line-height:1.55;">Speak soon,<br>Nathan<br><span style="color:#888;">OakFox — <a href="https://oakfox.co.uk" style="color:#C46B1F; text-decoration:none;">oakfox.co.uk</a></span></p>';

$clientHtml = <<<HTML
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background:#F5F0E8; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:640px; margin:0 auto; padding:32px 24px; background:#fff;">
  <div style="border-bottom:2px solid #C46B1F; padding-bottom:14px; margin-bottom:20px;">
    <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.14em; color:#888;">OakFox</div>
    <h1 style="margin:6px 0 0 0; font-size:22px; color:#222;">Thanks for your onboarding</h1>
  </div>
  {$clientIntroHtml}
  <div style="background:#FAF6EE; border:1px solid #ECE3D2; border-radius:8px; padding:16px 18px; margin:14px 0;">
    <table style="width:100%; border-collapse:collapse; font-size:14px;">{$basicsRows}</table>
    {$sectionsHtml}
    {$notesBlock}
  </div>
  {$clientSignoff}
</div>
</body></html>
HTML;

$clientBoundary = '=_oakfox_c_' . bin2hex(random_bytes(8));
$clientHeaders  = "From: OakFox <noreply@oakfox.co.uk>\r\n";
$clientHeaders .= "Reply-To: Nathan <nathan@oakfox.co.uk>\r\n";
$clientHeaders .= "MIME-Version: 1.0\r\n";
$clientHeaders .= "Content-Type: multipart/alternative; boundary=\"{$clientBoundary}\"\r\n";

$clientBody  = "--{$clientBoundary}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n{$clientPlain}\r\n\r\n";
$clientBody .= "--{$clientBoundary}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n{$clientHtml}\r\n\r\n";
$clientBody .= "--{$clientBoundary}--";

mail($email, $clientSubject, $clientBody, $clientHeaders);

if ($nathanSent) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Server could not send mail. Please email nathan@oakfox.co.uk directly.']);
}
