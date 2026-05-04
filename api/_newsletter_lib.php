<?php
// Shared helpers for OakFox bespoke newsletter system.
// Data file lives in ./data/ with a .htaccess deny-all so it can't be fetched directly.

function newsletter_file(): string {
    return __DIR__ . '/data/newsletter.json';
}

function newsletter_load(): array {
    $path = newsletter_file();
    if (!file_exists($path)) {
        return ['subscribers' => []];
    }
    $raw = file_get_contents($path);
    if ($raw === false || trim($raw) === '') {
        return ['subscribers' => []];
    }
    $data = json_decode($raw, true);
    if (!is_array($data) || !isset($data['subscribers'])) {
        return ['subscribers' => []];
    }
    return $data;
}

function newsletter_save(array $data): bool {
    $path = newsletter_file();
    $dir = dirname($path);
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
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

function newsletter_find_by_email(array $data, string $email): ?int {
    $email = strtolower($email);
    foreach ($data['subscribers'] as $i => $s) {
        if (strtolower($s['email']) === $email) return $i;
    }
    return null;
}

function newsletter_find_by_token(array $data, string $token): ?int {
    foreach ($data['subscribers'] as $i => $s) {
        if (hash_equals($s['token'] ?? '', $token)) return $i;
    }
    return null;
}

function newsletter_token(): string {
    return bin2hex(random_bytes(24));
}
