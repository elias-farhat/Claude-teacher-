#!/usr/bin/env bash
# Puts the Kenney CC0 kits the bridge template uses (fantasy town, nature, castle) into public/bridge/kenney/
# as flat <name>.glb files, with each kit's textures in Textures/<kit>-*.png (see kenney_flatten.py).
#
# Source: assets/kenney/*.zip in this repo, else the zip assets of the GitHub Release "kenney-kits" in this repo. kenney.nl refuses automated
# downloads (HTTP 403), so download the three kits once in a browser and attach the zips to that release:
#   https://kenney.nl/assets/fantasy-town-kit  https://kenney.nl/assets/nature-kit  https://kenney.nl/assets/castle-kit
# CC0 lets us redistribute them.
#
# usage: fetch-kenney.sh [dest]   (needs GH_TOKEN and GITHUB_REPOSITORY on Actions)
# Exits 0 when the kits are missing (prints "kenney: MISSING ..."), unless KENNEY_STRICT=1.
set -euo pipefail
DEST="${1:-public/bridge/kenney}"
mkdir -p "$DEST"
if [ -f "$DEST/.done" ]; then echo "kenney: cached, $(ls "$DEST" | wc -l) models"; exit 0; fi
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

missing() {
  echo "kenney: MISSING ($1). Attach the 3 kit zips to a release named kenney-kits."
  echo "::warning::Kenney kits missing: $1. Scenes that use them will render without those models."
  [ "${KENNEY_STRICT:-0}" = 1 ] && exit 1
  exit 0
}

# Preferred source: zips committed to the repo in assets/kenney/ (relative to video/).
LOCAL="$(cd "$(dirname "$0")/.." && pwd)/assets/kenney"
if ls "$LOCAL"/*.zip >/dev/null 2>&1; then
  cp "$LOCAL"/*.zip "$TMP"/
  echo "kenney: using zips from assets/kenney"
else
  gh release download kenney-kits --repo "${GITHUB_REPOSITORY:?}" --pattern '*.zip' --dir "$TMP" 2>"$TMP/err" \
    || missing "no zips in assets/kenney and no kenney-kits release: $(tr '\n' ' ' < "$TMP/err" | cut -c1-160)"
fi
for kit in fantasy-town nature castle; do
  ls "$TMP"/*.zip | grep -qi "$kit" || echo "::warning::kenney-kits release has no zip matching '$kit'"
done
python3 -I "$(dirname "$0")/kenney_flatten.py" "$DEST" "$TMP"/*.zip
n=$(ls "$DEST"/*.glb 2>/dev/null | wc -l)
[ "$n" -gt 0 ] || missing "the release zips contain no .glb models"
touch "$DEST/.done"
