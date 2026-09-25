<?php
// Protected by the inherited Basic Auth on /dashboard/.
// Every sign-off, newest first, with the full audit record for signed ones.
require_once __DIR__ . '/../api/_signoff_lib.php';

header('Content-Type: application/json');
header('Cache-Control: no-store');

$rows = array_map(function ($doc) {
    return [
        'token' => $doc['token'],
        'url' => SIGNOFF_URL . $doc['token'],
        'status' => $doc['status'] ?? 'awaiting',
        'created' => $doc['created'] ?? '',
        'client' => $doc['client'] ?? [],
        'title' => $doc['title'] ?? '',
        'summary' => signoff_summary($doc),
        'payments' => $doc['payments'] ?? [],
        'signature' => $doc['signature'] ?? null,
        'billing' => signoff_billing_line($doc),
        'withdrawnAt' => $doc['withdrawnAt'] ?? null,
    ];
}, signoff_list());

echo json_encode(['signoffs' => $rows]);
