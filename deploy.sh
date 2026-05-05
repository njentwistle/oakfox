#!/bin/sh
# Deploys repo contents to public_html. Used by .cpanel.yml because rsync isn't
# installed on this shared host. Uses tar | tar to preserve permissions and dotfiles.
set -e

DEST=/home/oakfoxco/public_html
SRC=/home/oakfoxco/repositories/oakfox
HTPASSWD="$DEST/dashboard/.htpasswd"
BACKUP=/tmp/oakfox-htpasswd.bak

echo "=== Deploy $(date) ==="
echo "SRC=$SRC"
echo "DEST=$DEST"

if [ -f "$HTPASSWD" ]; then
  cp "$HTPASSWD" "$BACKUP"
  echo "Backed up .htpasswd"
fi

cd "$SRC"

tar --exclude='.git' --exclude='.gitignore' --exclude='.cpanel.yml' --exclude='deploy.sh' -cf - . \
  | (cd "$DEST" && tar -xf -)

if [ -f "$BACKUP" ]; then
  cp "$BACKUP" "$HTPASSWD"
  rm "$BACKUP"
  echo "Restored .htpasswd"
fi

# LiteSpeed/Apache need every file world-readable and every dir world-executable.
# tar can extract with stricter modes; force 644/755 so .htaccess et al stay readable.
echo "Resetting permissions to 644/755..."
find "$DEST" -type f -exec chmod 644 {} \; 2>/dev/null || true
find "$DEST" -type d -exec chmod 755 {} \; 2>/dev/null || true

echo "=== Deploy done $(date) ==="
