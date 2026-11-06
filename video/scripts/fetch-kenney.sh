#!/usr/bin/env bash
# Downloads the Kenney CC0 kits the bridge template uses (fantasy town, nature, castle) into
# public/bridge/kenney/ as flat <name>.glb files. Skips any kit that is already there.
set -euo pipefail
DEST="${1:-public/bridge/kenney}"
mkdir -p "$DEST"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
for kit in fantasy-town-kit nature-kit castle-kit; do
  if [ -f "$DEST/.done-$kit" ]; then echo "$kit: cached"; continue; fi
  page="$(curl -fsSL "https://kenney.nl/assets/$kit")"
  url="$(grep -oE 'href="[^"]+\.zip"' <<<"$page" | head -1 | sed -E 's/^href="//; s/"$//')"
  [ -n "$url" ] || { echo "::error::$kit: no .zip link found on its kenney.nl page"; exit 1; }
  case "$url" in /*) url="https://kenney.nl$url" ;; esac
  echo "$kit: $url"
  curl -fsSL "$url" -o "$TMP/$kit.zip"
  mkdir -p "$TMP/$kit" && unzip -q -o "$TMP/$kit.zip" -d "$TMP/$kit"
  count=0
  while IFS= read -r -d '' f; do
    b="$(basename "$f")"; [ -e "$DEST/$b" ] || { cp "$f" "$DEST/$b"; count=$((count + 1)); }
  done < <(find "$TMP/$kit" -name '*.glb' -print0)
  [ "$count" -gt 0 ] || { echo "::error::$kit: zip has no .glb models"; exit 1; }
  echo "$kit: $count models"
  touch "$DEST/.done-$kit"
done
ls "$DEST" | wc -l
