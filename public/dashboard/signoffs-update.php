<?php
// Protected by the inherited Basic Auth on /dashboard/.
// POST {action: 'create', client, title, intro, items, terms} → new private link.
// POST {action: 'withdraw', token} → the link stops accepting a signature.
// There is deliberately no edit: a sent agreement never changes under the
// client. To correct one, withdraw it and create another.
require_once __DIR__ . '/../api/_signoff_lib.php';

header('Content-Type: application/json');
header('Cache-Control: no-store');

function reply(int $status, array $body): void {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') reply(405, ['error' => 'Method not allowed.']);
$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) reply(400, ['error' => 'Invalid request.']);

if (($in['action'] ?? '') === 'withdraw') {
    $token = $in['token'] ?? '';
    $result = signoff_locked(function () use ($token) {
        $doc = signoff_load($token);
        if (!$doc) return [404, 'No sign-off with that link.'];
        if (($doc['status'] ?? '') !== 'awaiting') return [409, 'Only an unsigned sign-off can be withdrawn.'];
        $doc['status'] = 'withdrawn';
        $doc['withdrawnAt'] = (new DateTimeImmutable('now'))->format(DATE_ATOM);
        return signoff_save($token, $doc) ? [200, null] : [500, 'Could not save the change.'];
    });
    [$status, $error] = $result ?? [500, 'Could not save the change.'];
    reply($status, $error ? ['error' => $error] : ['ok' => true]);
}

if (($in['action'] ?? '') !== 'create') reply(400, ['error' => 'Unknown action.']);

$client = is_array($in['client'] ?? null) ? $in['client'] : [];
$doc = [
    'status' => 'awaiting',
    'created' => (new DateTimeImmutable('now'))->format(DATE_ATOM),
    'client' => [
        'name' => signoff_clean((string) ($client['name'] ?? ''), 120),
        'company' => signoff_clean((string) ($client['company'] ?? ''), 160),
        'email' => trim((string) ($client['email'] ?? '')),
    ],
    'title' => signoff_clean((string) ($in['title'] ?? ''), 160),
    'intro' => signoff_clean((string) ($in['intro'] ?? ''), 2000),
    'items' => [],
    'terms' => [],
    // Lets the client choose to pay the monthly items monthly or annually.
    'billingChoice' => !empty($in['billingChoice']),
];

foreach (is_array($in['items'] ?? null) ? $in['items'] : [] as $item) {
    if (!is_array($item)) continue;
    $label = signoff_clean((string) ($item['label'] ?? ''), 160);
    if ($label === '') continue;
    $unit = (string) ($item['unit'] ?? 'one-off');
    $was = is_numeric($item['was'] ?? null) && (float) $item['was'] > 0 ? round((float) $item['was'], 2) : null;
    $doc['items'][] = array_filter([
        'label' => $label,
        'detail' => signoff_clean((string) ($item['detail'] ?? ''), 600),
        'price' => round(max(0, (float) ($item['price'] ?? 0)), 2),
        'was' => $was,
        'unit' => array_key_exists($unit, SIGNOFF_UNITS) ? $unit : 'one-off',
    ], fn($v) => $v !== null && $v !== '');
}
foreach (is_array($in['terms'] ?? null) ? $in['terms'] : [] as $term) {
    $term = signoff_clean((string) $term, 600);
    if ($term !== '') $doc['terms'][] = $term;
}

if ($doc['client']['name'] === '') reply(400, ['error' => 'Add the client’s name.']);
if (!filter_var($doc['client']['email'], FILTER_VALIDATE_EMAIL)) reply(400, ['error' => 'Add a valid email for the client.']);
if ($doc['title'] === '') reply(400, ['error' => 'Give the agreement a title.']);
if (!$doc['items']) reply(400, ['error' => 'Add at least one item.']);

$doc['fingerprint'] = signoff_fingerprint($doc);
$token = signoff_new_token();
if (!signoff_save($token, $doc)) reply(500, ['error' => 'Could not save the sign-off on the server.']);

reply(200, ['token' => $token, 'url' => SIGNOFF_URL . $token]);
