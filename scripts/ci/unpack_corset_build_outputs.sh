#!/usr/bin/env bash
# Unpack corset build outputs tarball into the repo root.
# Usage (repo root): bash scripts/ci/unpack_corset_build_outputs.sh /path/to/corset-build-outputs.tgz

set -euo pipefail

ARCHIVE="${1:?tarball path required}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [ ! -f "$ARCHIVE" ]; then
  echo "::error::unpack_corset_build_outputs: missing archive $ARCHIVE"
  exit 1
fi

tar -xzf "$ARCHIVE" -C "$ROOT"
echo "Unpacked corset build outputs from $ARCHIVE"
