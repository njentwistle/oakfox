<?php
require_once __DIR__ . '/_booking_lib.php';

$token = trim($_GET['t'] ?? '');
$status = 'error';
$heading = 'Something went wrong';
$message = 'The link is missing a token.';
$bookingTime = '';

if ($token !== '') {
    $data = bookings_load();
    $idx = null;
    foreach ($data['bookings'] as $i => $b) {
        if (hash_equals($b['token'] ?? '', $token)) { $idx = $i; break; }
    }
    if ($idx === null) {
        $heading = 'Link not recognised';
        $message = 'This cancellation link is invalid or has already been used.';
    } else {
        $b = $data['bookings'][$idx];
        if (($b['status'] ?? '') === 'cancelled') {
            $status = 'already';
            $heading = 'Already cancelled';
            $message = 'This booking has already been cancelled.';
        } else {
            $data['bookings'][$idx]['status'] = 'cancelled';
            $data['bookings'][$idx]['cancelled'] = date('c');
            if (bookings_save($data)) {
                $status = 'ok';
                $heading = 'Booking cancelled';
                $message = 'Your call has been cancelled. Feel free to book another time whenever works for you.';
                try {
                    $dt = new DateTimeImmutable($b['start']);
                    $bookingTime = $dt->format('l, j F · H:i') . ' (UK time)';
                } catch (Exception $e) {}

                $notice = "Booking {$b['id']} cancelled by client.\n\nWhen: {$bookingTime}\nName: {$b['name']}\nEmail: {$b['email']}";
                $headers = "From: OakFox <noreply@oakfox.co.uk>\r\nContent-Type: text/plain; charset=UTF-8\r\n";
                @mail('nathan@oakfox.co.uk', 'Booking cancelled — ' . $b['name'], $notice, $headers);
            } else {
                $heading = 'Could not save';
                $message = 'Please try the link again in a moment.';
            }
        }
    }
}

$colour = ($status === 'ok' || $status === 'already') ? '#1A5C12' : '#b44d4d';
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
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=Work+Sans:wght@400;500&display=swap" rel="stylesheet" />
<style>
  :root { --cream: #F5F0E8; --forest: #1A5C12; --ink: #1A1D17; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Work Sans', system-ui, sans-serif; background: var(--cream); color: var(--ink); display: flex; min-height: 100vh; align-items: center; justify-content: center; padding: 2rem; }
  .card { max-width: 520px; }
  .label { font-family: ui-monospace, Menlo, monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; color: var(--forest); margin-bottom: 1.5rem; }
  h1 { font-family: 'Work Sans', sans-serif; font-weight: 500; letter-spacing: -0.03em; font-size: clamp(2rem, 5vw, 3rem); margin: 0 0 1.5rem; color: <?= $colour ?>; }
  h1 em { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-weight: 400; }
  p { font-size: 15px; line-height: 1.6; color: rgba(26, 29, 23, 0.7); margin: 0 0 1rem; }
  a.btn { display: inline-flex; align-items: center; gap: 0.75rem; color: var(--forest); text-decoration: none; font-size: 13px; font-weight: 500; margin-top: 1.5rem; }
  a.btn span { width: 40px; height: 40px; border-radius: 9999px; border: 1px solid rgba(26,92,18,0.3); display: inline-flex; align-items: center; justify-content: center; transition: background-color 0.5s, color 0.5s; }
  a.btn:hover span { background: var(--forest); color: var(--cream); }
</style>
</head>
<body>
<main class="card">
  <p class="label">Booking</p>
  <h1><?= htmlspecialchars($heading) ?></h1>
  <p><?= htmlspecialchars($message) ?></p>
  <?php if ($bookingTime): ?>
    <p style="font-family: ui-monospace, Menlo, monospace; font-size: 13px; color: var(--ink);"><?= htmlspecialchars($bookingTime) ?></p>
  <?php endif; ?>
  <a class="btn" href="/book">Book another time <span>&rarr;</span></a>
</main>
</body>
</html>
