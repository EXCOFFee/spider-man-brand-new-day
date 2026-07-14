#!/usr/bin/env sh
# Regenerates public/fonts/anton-latin.woff2 from the upstream Anton source.
#
# Anton is licensed under the SIL Open Font License 1.1 (public/fonts/LICENSE).
# It is the only web font on the site; body text uses the system-ui stack (0 KB).
#
# Requires: curl and python3 with fonttools + brotli:
#   python3 -m pip install fonttools brotli
#
# The subset covers Basic Latin, the Latin-1 letters Spanish needs, and the few
# typographic punctuation marks the copy uses. Hinting is dropped because Anton
# is only ever rendered at large display sizes.
#
# Metric-matched fallback derivation (see @font-face "Anton Fallback" in
# src/styles/global.css). Anton metrics (unitsPerEm 2048): ascent 2409,
# descent -674, lineGap 0, xAvgCharWidth 938. Arial reference (unitsPerEm 2048):
# ascent 1854, descent -434, lineGap 67, xAvgCharWidth 904. Applying the
# capsize/fontaine formula:
#   size-adjust      = (938/2048) / (904/2048)        = 103.76%
#   ascent-override  = 2409 / (2048 * 1.0376)         = 113.36%
#   descent-override = 674  / (2048 * 1.0376)         =  31.72%
#   line-gap-override= 0    / (2048 * 1.0376)         =   0.00%
set -eu

BASE="https://raw.githubusercontent.com/google/fonts/main/ofl/anton"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

curl -fsSL "$BASE/OFL.txt" -o public/fonts/LICENSE
curl -fsSL "$BASE/Anton-Regular.ttf" -o "$TMP/Anton-Regular.ttf"

python3 -m fontTools.subset "$TMP/Anton-Regular.ttf" \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2026,U+00B7,U+00B0" \
  --no-hinting --desubroutinize --flavor=woff2 \
  --output-file=public/fonts/anton-latin.woff2

echo "Wrote public/fonts/anton-latin.woff2 ($(wc -c < public/fonts/anton-latin.woff2) bytes)"
