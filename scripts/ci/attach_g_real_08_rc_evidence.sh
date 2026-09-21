#!/usr/bin/env bash
# G-REAL-08: attach fresh real-llm-evidence-gate.json to RC readiness bundle (owner-executed).
# Does not call Azure OpenAI — run Invoke-RealLlmEvidenceGate.ps1 first when credentials exist.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

GATE_JSON="artifacts/release/real-llm-evidence-gate.json"

if [[ ! -f "$GATE_JSON" ]]; then
  echo "Missing $GATE_JSON — run: pwsh -NoProfile -File scripts/Invoke-RealLlmEvidenceGate.ps1" >&2
  exit 1
fi

pwsh -NoProfile -File scripts/Emit-ReleaseReadinessEvidence.ps1 -StrictRc
python3 scripts/ci/check_release_real_mode_claim.py

echo "G-REAL-08: gate artifact present; RC bundle updated under artifacts/release-readiness/"
