#!/usr/bin/env bash
set -euo pipefail
# Assembles dist/procurement-pack/ + dist/procurement-pack.zip with manifest.json (sha256 per file).
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="$ROOT/dist/procurement-pack"
rm -rf "$STAGE"
mkdir -p "$STAGE"

add_file() {
  local src="$1" dst="$2"
  test -f "$ROOT/$src" || { echo "missing $src" >&2; exit 1; }
  cp "$ROOT/$src" "$STAGE/$dst"
}

add_file "docs/go-to-market/TRUST_CENTER.md" "TRUST_CENTER.md"
add_file "docs/go-to-market/SUBPROCESSORS.md" "SUBPROCESSORS.md"
add_file "docs/go-to-market/SLA_SUMMARY.md" "SLA_SUMMARY.md"
add_file "docs/go-to-market/DPA_TEMPLATE.md" "DPA_TEMPLATE.md"
add_file "docs/security/CAIQ_LITE_2026.md" "CAIQ_LITE_2026.md"
add_file "docs/security/SIG_CORE_2026.md" "SIG_CORE_2026.md"

export ROOT STAGE
python - <<'PY'
import hashlib, json, os
stage = os.environ["STAGE"]
rows = [
    ("TRUST_CENTER.md", "docs/go-to-market/TRUST_CENTER.md"),
    ("SUBPROCESSORS.md", "docs/go-to-market/SUBPROCESSORS.md"),
    ("SLA_SUMMARY.md", "docs/go-to-market/SLA_SUMMARY.md"),
    ("DPA_TEMPLATE.md", "docs/go-to-market/DPA_TEMPLATE.md"),
    ("CAIQ_LITE_2026.md", "docs/security/CAIQ_LITE_2026.md"),
    ("SIG_CORE_2026.md", "docs/security/SIG_CORE_2026.md"),
]
out = []
for dst, src in rows:
    p = os.path.join(stage, dst)
    h = hashlib.sha256(open(p, "rb").read()).hexdigest()
    out.append({"path": dst, "source": src, "sha256": h})
open(os.path.join(stage, "manifest.json"), "w", encoding="utf-8").write(json.dumps(out, indent=2))
PY

(cd "$STAGE" && zip -qr "$ROOT/dist/procurement-pack.zip" .)
echo "Wrote $ROOT/dist/procurement-pack.zip"
