<?php
// Daily payment reminders for signed agreements. Run by cron as oakfoxco:
//   0 8 * * * /opt/cpanel/ea-php83/root/usr/bin/php /home/oakfoxco/public_html/api/_signoff_reminders.php
// Sends Nathan one email listing every payment that's due within a week, due
// today, or overdue (again each week until it's marked paid in the
// dashboard). Each reminder is recorded once its email has gone, so a missed
// or repeated run neither skips nor duplicates one.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require_once __DIR__ . '/_signoff_lib.php';

$today = new DateTimeImmutable('today');
$due = [];

foreach (signoff_list() as $doc) {
    if (($doc['status'] ?? '') !== 'signed' || empty($doc['payments'])) continue;
    foreach ($doc['payments'] as $p) {
        if (($p['status'] ?? '') !== 'active') continue;
        $days = (int) $today->diff(new DateTimeImmutable($p['nextDue']))->format('%r%a');
        if ($days > 7) continue;
        $stage = $days > 0 ? 'soon' : ($days === 0 ? 'today' : 'overdue-week' . intdiv(-$days - 1, 7));
        $key = $p['nextDue'] . ':' . $stage;
        if (in_array($key, $p['reminded'] ?? [], true)) continue;
        $due[] = ['token' => $doc['token'], 'client' => $doc['client'], 'payment' => $p, 'days' => $days, 'key' => $key];
    }
}

if (!$due) exit;

usort($due, fn($a, $b) => $a['days'] <=> $b['days']);
$when = function (int $days): string {
    if ($days === 0) return 'due today';
    if ($days > 0) return 'due in ' . $days . ($days === 1 ? ' day' : ' days');
    return -$days . (-$days === 1 ? ' day' : ' days') . ' overdue';
};

$rows = '';
$lines = [];
foreach ($due as $d) {
    $c = $d['client'];
    $who = $c['company'] ?: $c['name'];
    $p = $d['payment'];
    $date = signoff_when($p['nextDue'], 'j M Y');
    $colour = $d['days'] < 0 ? '#9B2C1F' : '#1A1D17';
    $rows .= '<tr><td style="padding:10px 12px 10px 0; border-bottom:1px solid #E6E0D5; vertical-align:top;">'
        . '<div style="font-weight:600; color:#1A1D17;">' . signoff_esc($who) . '</div>'
        . '<div style="color:#6B6760; font-size:13px;">' . signoff_esc(signoff_payment_line($p)) . '</div></td>'
        . '<td style="padding:10px 0; border-bottom:1px solid #E6E0D5; text-align:right; vertical-align:top; white-space:nowrap;">'
        . '<div style="color:' . $colour . '; font-weight:600;">' . signoff_esc($when($d['days'])) . '</div>'
        . '<div style="color:#6B6760; font-size:13px;">' . signoff_esc($date) . '</div></td></tr>';
    $lines[] = '- ' . $who . ', ' . signoff_payment_line($p) . ': ' . $when($d['days']) . ' (' . $date . ')';
}

$link = 'https://oakfox.co.uk/dashboard/sign-off/';
$count = count($due);
$first = $due[0];
$subject = $count === 1
    ? 'Payment reminder: ' . ($first['client']['company'] ?: $first['client']['name']) . ', ' . $first['payment']['label'] . ' ' . $when($first['days'])
    : "Payment reminders: {$count} payments to collect";

$html = <<<HTML
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background:#F5F0E8; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:640px; margin:0 auto; padding:32px 24px; background:#FFFFFF;">
  <div style="border-bottom:2px solid #1A5C12; padding-bottom:14px; margin-bottom:18px;">
    <div style="font-size:13px; color:#1A5C12; font-weight:600;">OakFox</div>
    <h1 style="margin:6px 0 0; font-size:22px; color:#1A1D17; font-weight:600;">Payments to collect</h1>
  </div>
  <table style="width:100%; border-collapse:collapse; font-size:14px;">{$rows}</table>
  <p style="font-size:13px; color:#6B6760; line-height:1.55; margin-top:18px;">Once a payment is in, mark it paid in the <a href="{$link}" style="color:#1A5C12;">dashboard</a> and the reminder moves to the next due date.</p>
</div>
</body></html>
HTML;
$text = "Payments to collect:\n\n" . implode("\n", $lines) . "\n\nOnce a payment is in, mark it paid in the dashboard ({$link}) and the reminder moves to the next due date.";

if (!signoff_send(SIGNOFF_OWNER_EMAIL, $subject, $text, $html, SIGNOFF_OWNER_NAME . ' <' . SIGNOFF_OWNER_EMAIL . '>')) {
    fwrite(STDERR, "Payment reminder email failed; will retry on the next run.\n");
    exit(1);
}

// Only now record them as sent, so a failed email is retried tomorrow.
signoff_locked(function () use ($due) {
    foreach ($due as $d) {
        $doc = signoff_load($d['token']);
        if (!$doc) continue;
        foreach ($doc['payments'] as $i => $p) {
            if ($p['id'] === $d['payment']['id'] && !in_array($d['key'], $p['reminded'] ?? [], true)) {
                $doc['payments'][$i]['reminded'][] = $d['key'];
            }
        }
        signoff_save($d['token'], $doc);
    }
});
