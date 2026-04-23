<?php
require_once __DIR__ . '/_newsletter_lib.php';

$token = trim($_GET['t'] ?? '');

$status = 'error';
$heading = 'Something went wrong';
$message = 'The unsubscribe link is missing its token.';

if ($token !== '') {
    $data = newsletter_load();
    $idx = newsletter_find_by_token($data, $token);

    if ($idx === null) {
        $heading = 'Link not recognised';
        $message = 'This unsubscribe link has expired or already been used.';
    } else {
        $data['subscribers'][$idx]['status'] = 'unsubscribed';
        $data['subscribers'][$idx]['updated'] = date('c');
        if (newsletter_save($data)) {
            $status = 'ok';
            $heading = "You're unsubscribed";
            $message = "No hard feelings — you won't hear from us again. If you change your mind, you can always sign up again.";
        } else {
            $heading = 'Could not save';
            $message = 'Please try the link again shortly.';
        }
    }
}

$colorHeading = $status === 'ok' ? '#1A5C12' : '#b44d4d';
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex, nofollow" />
<title><?= htmlspecialchars($heading) ?> · OakFox</title>
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=Work+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
<style>
  :root { --cream: #F5F0E8; --forest: #1A5C12; --ink: #1A1D17; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Work Sans', system-ui, sans-serif; background: var(--cream); color: var(--ink); display: flex; min-height: 100vh; align-items: center; justify-content: center; padding: 2rem; }
  .card { max-width: 520px; text-align: left; }
  .label { font-family: ui-monospace, Menlo, monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; color: var(--forest); margin-bottom: 1.5rem; }
  h1 { font-family: 'Work Sans', sans-serif; font-weight: 500; letter-spacing: -0.03em; line-height: 1.05; font-size: clamp(2rem, 5vw, 3rem); margin: 0 0 1.5rem; color: <?= $colorHeading ?>; }
  p { font-size: 15px; line-height: 1.6; color: rgba(26, 29, 23, 0.7); margin: 0 0 2rem; }
  a.btn { display: inline-flex; align-items: center; gap: 0.75rem; color: var(--forest); text-decoration: none; font-size: 13px; font-weight: 500; }
  a.btn span { width: 40px; height: 40px; border-radius: 9999px; border: 1px solid rgba(26, 92, 18, 0.3); display: inline-flex; align-items: center; justify-content: center; transition: background-color 0.5s, color 0.5s; }
  a.btn:hover span { background: var(--forest); color: var(--cream); }
</style>
</head>
<body>
<main class="card">
  <p class="label">Newsletter</p>
  <h1><?= htmlspecialchars($heading) ?></h1>
  <p><?= htmlspecialchars($message) ?></p>
  <a class="btn" href="/">
    Back to OakFox
    <span>&rarr;</span>
  </a>
</main>
</body>
</html>
