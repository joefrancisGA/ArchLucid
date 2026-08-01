#!/usr/bin/env bash
# Pack Release bin/obj trees for same-workflow reuse by fast-core test shards.
# Usage (repo root): bash scripts/ci/pack_corset_build_outputs.sh /path/to/corset-build-outputs.tgz

set -euo pipefail

OUT="${1:?output tarball path required}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

mkdir -p "$(dirname "$OUT")"
LIST="$(mktemp)"
trap 'rm -f "$LIST"' EXIT

# Only product/test project outputs — skip UI node_modules and .git.
find . \
  \( -path './.git' -o -path './.git/*' -o -path './archlucid-ui/*' -o -path './node_modules/*' -o -path './.cache/*' \) -prune -o \
  -type d \( -name bin -o -name obj \) -print \
  > "$LIST"

if [ ! -s "$LIST" ]; then
  echo "::error::pack_corset_build_outputs: no bin/obj directories found"
  exit 1
fi

tar -czf "$OUT" -T "$LIST"
echo "Packed corset build outputs -> $OUT ($(wc -c < "$OUT") bytes, $(wc -l < "$LIST") dirs)"
