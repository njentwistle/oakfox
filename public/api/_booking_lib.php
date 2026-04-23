<?php
// Shared helpers for the OakFox bespoke booking system.
// Data stored at ./data/bookings.json (deny-all .htaccess).

date_default_timezone_set('Europe/London');

const BOOKING_SLOT_MINUTES = 30;
const BOOKING_OPEN_HOUR = 9;    // 09:00
const BOOKING_CLOSE_HOUR = 17;  // last slot ends at 17:00 (so last start is 16:30)
const BOOKING_MIN_LEAD_HOURS = 24;
const BOOKING_MAX_DAYS_AHEAD = 30;

function bookings_file(): string {
    return __DIR__ . '/data/bookings.json';
}

function bookings_load(): array {
    $path = bookings_file();
    if (!file_exists($path)) return ['bookings' => []];
    $raw = @file_get_contents($path);
    if ($raw === false || trim($raw) === '') return ['bookings' => []];
    $data = json_decode($raw, true);
    if (!is_array($data) || !isset($data['bookings'])) return ['bookings' => []];
    return $data;
}

function bookings_save(array $data): bool {
    $path = bookings_file();
    $dir = dirname($path);
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    $tmp = $path . '.tmp';
    $fp = fopen($tmp, 'w');
    if (!$fp) return false;
    if (!flock($fp, LOCK_EX)) { fclose($fp); return false; }
    fwrite($fp, $json);
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return rename($tmp, $path);
}

function booking_token(): string {
    return bin2hex(random_bytes(18));
}

function booking_id(): string {
    return 'bk_' . bin2hex(random_bytes(6));
}

/**
 * Generate all possible slots for a given date (Y-m-d).
 * Returns array of ['start' => ISO, 'end' => ISO, 'label' => 'HH:MM'].
 * Does not check availability — just the schedule.
 */
function booking_slots_for_date(string $date): array {
    $tz = new DateTimeZone('Europe/London');
    try {
        $day = new DateTimeImmutable($date . ' 00:00:00', $tz);
    } catch (Exception $e) { return []; }

    $dow = (int)$day->format('N'); // 1=Mon..7=Sun
    if ($dow >= 6) return []; // closed weekends

    $slots = [];
    for ($h = BOOKING_OPEN_HOUR * 60; $h + BOOKING_SLOT_MINUTES <= BOOKING_CLOSE_HOUR * 60; $h += BOOKING_SLOT_MINUTES) {
        $start = $day->setTime(intdiv($h, 60), $h % 60);
        $end = $start->modify('+' . BOOKING_SLOT_MINUTES . ' minutes');
        $slots[] = [
            'start' => $start->format('c'),
            'end' => $end->format('c'),
            'label' => $start->format('H:i'),
        ];
    }
    return $slots;
}

/**
 * Given a date, return slots with availability flags.
 */
function booking_slots_with_status(string $date, array $data): array {
    $slots = booking_slots_for_date($date);
    if (empty($slots)) return [];

    $tz = new DateTimeZone('Europe/London');
    $now = new DateTimeImmutable('now', $tz);
    $minBookable = $now->modify('+' . BOOKING_MIN_LEAD_HOURS . ' hours');
    $maxBookable = $now->setTime(23, 59, 59)->modify('+' . BOOKING_MAX_DAYS_AHEAD . ' days');

    $booked = [];
    foreach ($data['bookings'] as $b) {
        if (($b['status'] ?? '') === 'cancelled') continue;
        $booked[$b['start']] = true;
    }

    $out = [];
    foreach ($slots as $slot) {
        try {
            $slotStart = new DateTimeImmutable($slot['start']);
        } catch (Exception $e) { continue; }

        $status = 'available';
        if (isset($booked[$slot['start']])) {
            $status = 'booked';
        } elseif ($slotStart < $minBookable) {
            $status = 'past';
        } elseif ($slotStart > $maxBookable) {
            $status = 'too-far';
        }

        $out[] = array_merge($slot, ['status' => $status]);
    }
    return $out;
}

function booking_is_valid_slot(string $startISO, array $data): bool {
    try {
        $start = new DateTimeImmutable($startISO);
    } catch (Exception $e) { return false; }
    $date = $start->format('Y-m-d');
    $slots = booking_slots_with_status($date, $data);
    foreach ($slots as $s) {
        if ($s['start'] === $startISO && $s['status'] === 'available') return true;
    }
    return false;
}
