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

echo "=== Deploy done $(date) ==="
