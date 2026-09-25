<?php
// Shared helpers for client sign-offs: a private link where a client reads an
// agreed scope of work and signs it. Each sign-off is one JSON file in
// /home/oakfoxco/signoffs, outside public_html, so records are never web-served
// and never in this repo (which is public). The link token is the file name.

date_default_timezone_set('Europe/London');

const SIGNOFF_OWNER_EMAIL = 'nathan@oakfox.co.uk';
const SIGNOFF_OWNER_NAME = 'Nathan Entwistle';
const SIGNOFF_OWNER_ROLE = 'Managing Director';
const SIGNOFF_COMPANY = 'OakFox Limited';
const SIGNOFF_URL = 'https://oakfox.co.uk/sign-off/#';
const SIGNOFF_UNITS = ['one-off' => '', 'month' => 'per month', 'year' => 'per year'];

function signoff_dir(): string {
    // public_html/api → the account's home directory. OAKFOX_SIGNOFF_DIR is for
    // local testing only.
    return getenv('OAKFOX_SIGNOFF_DIR') ?: dirname(__DIR__, 2) . '/signoffs';
}

function signoff_new_token(): string {
    return bin2hex(random_bytes(24));
}

function signoff_valid_token($t): bool {
    return is_string($t) && preg_match('/^[a-f0-9]{48}$/', $t) === 1;
}

function signoff_path(string $token): string {
    return signoff_dir() . '/' . $token . '.json';
}

function signoff_load(string $token): ?array {
    if (!signoff_valid_token($token)) return null;
    $raw = @file_get_contents(signoff_path($token));
    if ($raw === false) return null;
    $doc = json_decode($raw, true);
    return is_array($doc) ? $doc : null;
}

function signoff_save(string $token, array $doc): bool {
    $dir = signoff_dir();
    if (!is_dir($dir) && !@mkdir($dir, 0700, true)) return false;
    $path = signoff_path($token);
    $tmp = $path . '.tmp';
    $json = json_encode($doc, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if (@file_put_contents($tmp, $json, LOCK_EX) === false) return false;
    @chmod($tmp, 0600);
    return rename($tmp, $path);
}

// One lock for every change, so two submissions can't both sign the same link.
function signoff_locked(callable $fn) {
    $dir = signoff_dir();
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $fp = fopen($dir . '/.lock', 'c');
    if (!$fp || !flock($fp, LOCK_EX)) return null;
    try {
        return $fn();
    } finally {
        flock($fp, LOCK_UN);
        fclose($fp);
    }
}

function signoff_list(): array {
    $out = [];
    foreach (glob(signoff_dir() . '/*.json') ?: [] as $file) {
        $token = basename($file, '.json');
        $doc = signoff_load($token);
        if ($doc) $out[] = ['token' => $token] + $doc;
    }
    usort($out, fn($a, $b) => strcmp($b['created'] ?? '', $a['created'] ?? ''));
    return $out;
}

// The agreed wording, reduced to a stable form. Its SHA-256 is the fingerprint
// shown on the page and in both emails, so either side can show the text they
// signed is the text on record.
function signoff_fingerprint(array $doc): string {
    $agreement = [
        'client' => $doc['client'] ?? [],
        'title' => $doc['title'] ?? '',
        'intro' => $doc['intro'] ?? '',
        'items' => $doc['items'] ?? [],
        'terms' => $doc['terms'] ?? [],
        'billingChoice' => !empty($doc['billingChoice']),
        'created' => $doc['created'] ?? '',
    ];
    return hash('sha256', json_encode($agreement, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
}

function signoff_clean(string $s, int $max = 2000): string {
    $s = preg_replace('/[^\P{C}\n\r\t]+/u', '', $s) ?? '';
    return mb_substr(trim($s), 0, $max);
}

function signoff_money(float $amount): string {
    return '£' . (floor($amount) == $amount ? number_format($amount, 0) : number_format($amount, 2));
}

function signoff_price_line(array $item): string {
    $unit = SIGNOFF_UNITS[$item['unit'] ?? 'one-off'] ?? '';
    return signoff_money((float) ($item['price'] ?? 0)) . ($unit ? ' ' . $unit : '');
}

// Sums by how often they're charged.
function signoff_sums(array $items): array {
    $sums = ['one-off' => 0.0, 'month' => 0.0, 'year' => 0.0];
    foreach ($items as $item) {
        $unit = $item['unit'] ?? 'one-off';
        if (isset($sums[$unit])) $sums[$unit] += (float) ($item['price'] ?? 0);
    }
    return $sums;
}

// Everything the first year costs: the one-off items, twelve months of the
// monthly ones and the yearly ones. The same whichever way the client pays.
function signoff_first_year(array $items): string {
    $s = signoff_sums($items);
    return signoff_money($s['one-off'] + 12 * $s['month'] + $s['year']);
}

// How it's paid, in words: "£9.99 a month and £14.99 a year". Paying
// annually folds twelve months of the monthly items into the yearly payment.
function signoff_plan(array $items, string $choice = 'monthly'): string {
    $s = signoff_sums($items);
    $year = $s['year'] + ($choice === 'annually' ? 12 * $s['month'] : 0);
    $parts = [];
    if ($s['one-off'] > 0) $parts[] = signoff_money($s['one-off']) . ' up front';
    if ($choice !== 'annually' && $s['month'] > 0) $parts[] = signoff_money($s['month']) . ' a month';
    if ($year > 0) $parts[] = signoff_money($year) . ' a year';
    if (!$parts) return 'Nothing to pay';
    $last = array_pop($parts);
    return $parts ? implode(', ', $parts) . ' and ' . $last : $last;
}

// The summary under the items. Until the client has chosen how to pay, both
// ways are described.
function signoff_summary(array $doc): array {
    $items = $doc['items'] ?? [];
    $choice = $doc['signature']['billing'] ?? null;
    $plan = signoff_billing($doc) && !$choice
        ? signoff_plan($items, 'monthly') . ', or ' . signoff_plan($items, 'annually')
        : signoff_plan($items, $choice ?: 'monthly');
    return [['First year total', signoff_first_year($items)], ['Payments', $plan]];
}

// When the sign-off lets the client choose, the monthly items can be paid
// monthly or as one yearly payment of twelve months.
function signoff_billing(array $doc): ?array {
    if (empty($doc['billingChoice'])) return null;
    $monthly = 0;
    $labels = [];
    foreach ($doc['items'] ?? [] as $item) {
        if (($item['unit'] ?? '') !== 'month') continue;
        $monthly += (float) ($item['price'] ?? 0);
        $labels[] = $item['label'];
    }
    if (!$labels) return null;
    return ['items' => $labels, 'monthly' => signoff_money($monthly), 'annually' => signoff_money($monthly * 12)];
}

function signoff_billing_line(array $doc): string {
    $b = signoff_billing($doc);
    $choice = $doc['signature']['billing'] ?? '';
    if (!$b || !isset($b[$choice])) return '';
    return $choice === 'annually' ? 'Annually, ' . $b['annually'] . ' a year' : 'Monthly, ' . $b['monthly'] . ' a month';
}

/* ---------- Payments ---------- */

// Saved when the agreement is signed: one entry per paid item, first due on
// the signing date, and reminded by _signoff_reminders.php. Paying annually
// turns a monthly item into a yearly payment of twelve months. This is
// working state, not part of the agreement, so it's outside the fingerprint.
function signoff_schedule(array $doc, string $today): array {
    $choice = $doc['signature']['billing'] ?? 'monthly';
    $out = [];
    foreach ($doc['items'] ?? [] as $i => $item) {
        $amount = (float) ($item['price'] ?? 0);
        if ($amount <= 0) continue;
        $unit = $item['unit'] ?? 'one-off';
        $every = $unit === 'month' ? ($choice === 'annually' ? 'year' : 'month') : ($unit === 'year' ? 'year' : 'once');
        if ($unit === 'month' && $every === 'year') $amount = round($amount * 12, 2);
        $out[] = [
            'id' => 'p' . ($i + 1),
            'label' => $item['label'],
            'amount' => $amount,
            'every' => $every,
            'day' => (int) substr($today, 8, 2),
            'nextDue' => $today,
            'status' => 'active',
            'paid' => [],
            'reminded' => [],
        ];
    }
    return $out;
}

// The next due date, keeping to the original day of the month where it
// exists (a payment due on the 31st falls on the 30th in a 30-day month).
function signoff_advance(string $ymd, string $every, int $day): string {
    [$y, $m] = array_map('intval', explode('-', $ymd));
    $m += $every === 'month' ? 1 : 12;
    $y += intdiv($m - 1, 12);
    $m = ($m - 1) % 12 + 1;
    $last = (int) (new DateTimeImmutable(sprintf('%04d-%02d-01', $y, $m)))->format('t');
    return sprintf('%04d-%02d-%02d', $y, $m, min($day, $last));
}

function signoff_payment_line(array $p): string {
    $every = ['month' => ' a month', 'year' => ' a year', 'once' => ' once'][$p['every']] ?? '';
    return $p['label'] . ': ' . signoff_money((float) $p['amount']) . $every;
}

function signoff_when(string $iso, string $format = 'j F Y, g:ia'): string {
    try {
        return (new DateTimeImmutable($iso))->setTimezone(new DateTimeZone('Europe/London'))->format($format);
    } catch (Exception $e) {
        return $iso;
    }
}

// What the client's browser may see: never the IP address or user agent.
function signoff_public(array $doc): array {
    $out = [
        'status' => $doc['status'] ?? 'awaiting',
        'created' => $doc['created'] ?? '',
        'client' => $doc['client'] ?? [],
        'title' => $doc['title'] ?? '',
        'intro' => $doc['intro'] ?? '',
        'items' => $doc['items'] ?? [],
        'terms' => $doc['terms'] ?? [],
        'firstYear' => signoff_first_year($doc['items'] ?? []),
        'plans' => [
            'monthly' => signoff_plan($doc['items'] ?? [], 'monthly'),
            'annually' => signoff_plan($doc['items'] ?? [], 'annually'),
        ],
        'billing' => signoff_billing($doc),
        'fingerprint' => $doc['fingerprint'] ?? '',
        'preparedBy' => SIGNOFF_OWNER_NAME . ', ' . SIGNOFF_OWNER_ROLE . ', ' . SIGNOFF_COMPANY,
    ];
    if (!empty($doc['signature'])) {
        $s = $doc['signature'];
        $out['signature'] = ['name' => $s['name'], 'role' => $s['role'] ?? '', 'email' => $s['email'], 'signedAt' => $s['signedAt'], 'billing' => signoff_billing_line($doc), 'plan' => signoff_summary($doc)[1][1]];
    }
    return $out;
}

/* ---------- Email ---------- */

function signoff_esc(string $s): string {
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

function signoff_header_text(string $s): string {
    return trim(str_replace(["\r", "\n", '"', '<', '>'], ' ', $s));
}

function signoff_subject(string $s): string {
    return '=?UTF-8?B?' . base64_encode(signoff_header_text($s)) . '?=';
}

function signoff_email_html(array $doc, string $intro, bool $audit): string {
    $e = 'signoff_esc';
    $c = $doc['client'];
    $s = $doc['signature'];
    $rows = '';
    foreach ($doc['items'] as $item) {
        $was = !empty($item['was']) ? '<span style="color:#6B6760; text-decoration:line-through; margin-right:6px;">' . $e(signoff_money((float) $item['was'])) . '</span>' : '';
        $detail = ($item['detail'] ?? '') !== '' ? '<div style="color:#6B6760; font-size:13px; margin-top:3px; line-height:1.5;">' . $e($item['detail']) . '</div>' : '';
        $rows .= '<tr><td style="padding:12px 12px 12px 0; border-bottom:1px solid #E6E0D5; vertical-align:top;">'
            . '<div style="color:#1A1D17; font-weight:600;">' . $e($item['label']) . '</div>' . $detail . '</td>'
            . '<td style="padding:12px 0; border-bottom:1px solid #E6E0D5; text-align:right; vertical-align:top; white-space:nowrap; color:#1A1D17;">'
            . $was . $e(signoff_price_line($item)) . '</td></tr>';
    }
    $totals = '';
    foreach (signoff_summary($doc) as [$label, $value]) {
        $totals .= '<tr><td style="padding:6px 16px 0 0; color:#6B6760; white-space:nowrap; vertical-align:top;">' . $e($label) . '</td><td style="padding:6px 0 0; text-align:right; color:#1A1D17; font-weight:600;">' . $e($value) . '</td></tr>';
    }
    $terms = '';
    foreach ($doc['terms'] as $term) {
        $terms .= '<li style="margin:0 0 6px; line-height:1.55;">' . $e($term) . '</li>';
    }
    $termsBlock = $terms ? '<h2 style="font-size:15px; color:#1A1D17; margin:26px 0 8px;">Terms</h2><ul style="margin:0; padding-left:20px; color:#2E3329; font-size:14px;">' . $terms . '</ul>' : '';
    $role = ($s['role'] ?? '') !== '' ? ', ' . $e($s['role']) : '';
    $auditRows = $audit
        ? '<tr><td style="padding:3px 12px 3px 0; color:#6B6760;">IP address</td><td>' . $e($s['ip']) . '</td></tr>'
          . '<tr><td style="padding:3px 12px 3px 0; color:#6B6760; vertical-align:top;">Browser</td><td>' . $e($s['userAgent']) . '</td></tr>'
        : '';
    $signedAt = $e(signoff_when($s['signedAt'], 'j F Y \a\t g:ia T'));
    $schedule = '';
    if ($audit && !empty($doc['payments'])) {
        foreach ($doc['payments'] as $pay) {
            $schedule .= '<li style="margin:0 0 6px; line-height:1.55;">' . $e(signoff_payment_line($pay)) . ', first due ' . $e(signoff_when($pay['nextDue'], 'j F Y')) . '</li>';
        }
        $schedule = '<h2 style="font-size:15px; color:#1A1D17; margin:26px 0 8px;">Payment reminders saved</h2>'
            . '<ul style="margin:0; padding-left:20px; color:#2E3329; font-size:14px;">' . $schedule . '</ul>'
            . '<p style="font-size:13px; color:#6B6760; margin:8px 0 0;">You\'ll be emailed a week before each one, on the day, and weekly while it\'s unpaid. Mark payments paid, or change a date, in the dashboard.</p>';
    }
    $billing = signoff_billing_line($doc);
    $billingRow = $billing ? '<tr><td style="padding:3px 12px 3px 0; color:#6B6760;">Payment choice</td><td>' . $e($billing) . '</td></tr>' : '';

    return <<<HTML
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background:#F5F0E8; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:640px; margin:0 auto; padding:32px 24px; background:#FFFFFF;">
  <div style="border-bottom:2px solid #1A5C12; padding-bottom:14px; margin-bottom:22px;">
    <div style="font-size:13px; color:#1A5C12; font-weight:600;">OakFox</div>
    <h1 style="margin:6px 0 0; font-size:22px; color:#1A1D17; font-weight:600;">{$e($doc['title'])}</h1>
    <div style="font-size:13px; color:#6B6760; margin-top:4px;">Agreement with {$e($c['company'] ?: $c['name'])}</div>
  </div>
  {$intro}
  <table style="width:100%; border-collapse:collapse; font-size:14px; margin-top:8px;">{$rows}</table>
  <table style="margin:10px 0 0 auto; border-collapse:collapse; font-size:14px;">{$totals}</table>
  {$termsBlock}
  <div style="margin-top:28px; padding:16px 18px; background:#FAF7F2; border:1px solid #E6E0D5; border-radius:8px;">
    <div style="font-size:13px; color:#6B6760; margin-bottom:6px;">Signed electronically</div>
    <div style="font-size:18px; color:#1A1D17; font-style:italic; font-family:Georgia,serif;">{$e($s['name'])}</div>
    <div style="font-size:13px; color:#2E3329; margin-top:4px;">{$e($s['name'])}{$role}, {$e($c['company'] ?: $c['name'])}</div>
    <table style="border-collapse:collapse; font-size:12px; color:#2E3329; margin-top:12px;">
      <tr><td style="padding:3px 12px 3px 0; color:#6B6760;">Signed</td><td>{$signedAt}</td></tr>
      {$billingRow}
      <tr><td style="padding:3px 12px 3px 0; color:#6B6760;">Email</td><td>{$e($s['email'])}</td></tr>
      {$auditRows}
      <tr><td style="padding:3px 12px 3px 0; color:#6B6760; vertical-align:top;">Fingerprint</td><td style="font-family:Menlo,Consolas,monospace; word-break:break-all;">{$e($s['fingerprint'])}</td></tr>
    </table>
  </div>
  {$schedule}
  <p style="font-size:12px; color:#6B6760; line-height:1.55; margin-top:18px;">The fingerprint is a SHA-256 hash of the agreement's wording. If the wording had changed, the fingerprint would too. Prepared by {$e(SIGNOFF_OWNER_NAME)}, {$e(SIGNOFF_OWNER_ROLE)}, {$e(SIGNOFF_COMPANY)}.</p>
</div>
</body></html>
HTML;
}

function signoff_email_text(array $doc, string $intro, bool $audit): string {
    $s = $doc['signature'];
    $lines = [$intro, '', strtoupper($doc['title']), ''];
    foreach ($doc['items'] as $item) {
        $was = !empty($item['was']) ? ' (usually ' . signoff_money((float) $item['was']) . ')' : '';
        $lines[] = '- ' . $item['label'] . ': ' . signoff_price_line($item) . $was;
        if (($item['detail'] ?? '') !== '') $lines[] = '  ' . $item['detail'];
    }
    $lines[] = '';
    foreach (signoff_summary($doc) as [$label, $value]) $lines[] = $label . ': ' . $value;
    if ($doc['terms']) {
        $lines[] = '';
        $lines[] = 'Terms';
        foreach ($doc['terms'] as $term) $lines[] = '- ' . $term;
    }
    $lines[] = '';
    $lines[] = 'Signed electronically by ' . $s['name'] . (($s['role'] ?? '') !== '' ? ', ' . $s['role'] : '');
    $lines[] = 'Signed: ' . signoff_when($s['signedAt'], 'j F Y \a\t g:ia T');
    if ($billing = signoff_billing_line($doc)) $lines[] = 'Payment choice: ' . $billing;
    $lines[] = 'Email: ' . $s['email'];
    if ($audit) {
        $lines[] = 'IP address: ' . $s['ip'];
        $lines[] = 'Browser: ' . $s['userAgent'];
    }
    $lines[] = 'Fingerprint (SHA-256 of the wording): ' . $s['fingerprint'];
    if ($audit && !empty($doc['payments'])) {
        $lines[] = '';
        $lines[] = 'Payment reminders saved:';
        foreach ($doc['payments'] as $pay) $lines[] = '- ' . signoff_payment_line($pay) . ', first due ' . signoff_when($pay['nextDue'], 'j F Y');
    }
    return implode("\n", $lines);
}

function signoff_send(string $to, string $subject, string $text, string $html, string $replyTo): bool {
    $boundary = '=_oakfox_s_' . bin2hex(random_bytes(8));
    $headers = "From: OakFox <noreply@oakfox.co.uk>\r\n"
        . "Reply-To: {$replyTo}\r\n"
        . "MIME-Version: 1.0\r\n"
        . "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";
    $body = "--{$boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n{$text}\r\n\r\n"
        . "--{$boundary}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n{$html}\r\n\r\n"
        . "--{$boundary}--";
    return @mail($to, signoff_subject($subject), $body, $headers);
}

// Copies for the client (to the address they signed with, and the one on the
// sign-off if that differs) and for Nathan, with the audit details.
function signoff_send_copies(string $token, array $doc): array {
    $c = $doc['client'];
    $s = $doc['signature'];
    $who = $c['company'] ?: $c['name'];
    $first = explode(' ', $s['name'])[0];

    $clientIntro = "Hi {$first}, thanks for signing. This email is your copy of what you agreed with OakFox, so keep it somewhere safe. Any questions, just reply.";
    $clientIntroHtml = '<p style="margin:0 0 14px; line-height:1.55; color:#2E3329;">Hi ' . signoff_esc($first) . ', thanks for signing. This email is your copy of what you agreed with OakFox, so keep it somewhere safe. Any questions, just reply.</p>';
    $recipients = array_unique(array_filter([$s['email'], $c['email'] ?? '']));
    $clientSent = false;
    foreach ($recipients as $to) {
        $clientSent = signoff_send($to, "Your signed agreement with OakFox: {$doc['title']}",
            signoff_email_text($doc, $clientIntro, false), signoff_email_html($doc, $clientIntroHtml, false),
            SIGNOFF_OWNER_NAME . ' <' . SIGNOFF_OWNER_EMAIL . '>') || $clientSent;
    }

    $link = 'https://oakfox.co.uk/dashboard/sign-off/';
    $ownerIntro = "{$s['name']} signed \"{$doc['title']}\" for {$who}. The record is saved on the server and listed at {$link}";
    $ownerIntroHtml = '<p style="margin:0 0 14px; line-height:1.55; color:#2E3329;">' . signoff_esc($s['name']) . ' signed this for ' . signoff_esc($who)
        . '. The record is saved on the server and listed in the <a href="' . $link . '" style="color:#1A5C12;">dashboard</a>.</p>';
    $ownerSent = signoff_send(SIGNOFF_OWNER_EMAIL, "Signed: {$who}, {$doc['title']}",
        signoff_email_text($doc, $ownerIntro, true), signoff_email_html($doc, $ownerIntroHtml, true),
        signoff_header_text($s['name']) . ' <' . $s['email'] . '>');

    return ['client' => $clientSent, 'owner' => $ownerSent];
}
