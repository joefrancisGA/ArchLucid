#!/usr/bin/env bash
# Automate real-mode AI quality evidence for CI (Improvement #2).
#
# Default profile (PR / nightly committed-exemplar path):
#   - Offline faithfulness + retrieval IR enforce
#   - Eval corpus RC wrapper with Phase B LLM faithfulness floors
#   - Committed-exemplar gate JSON + buyer-safe rollups
#
# Optional live path (--invoke-live-when-budget-allows):
#   - Golden cohort budget probe ($15/mo cap) — skip live invoke on kill (exit 2/3)
#   - Invoke-RealLlmGoldenCohort.ps1 when probe exit 0/1 and credentials present
#
# Usage:
#   bash scripts/ci/run_real_mode_ai_quality_evidence_ci.sh
#   bash scripts/ci/run_real_mode_ai_quality_evidence_ci.sh --output-dir artifacts/ci/custom
#   bash scripts/ci/run_real_mode_ai_quality_evidence_ci.sh --invoke-live-when-budget-allows
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
OUTPUT_DIR="${REPO_ROOT}/artifacts/ci/real-mode-ai-quality-evidence"
INVOKE_LIVE=0
BUDGET_SIMULATE_MTD=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --invoke-live-when-budget-allows)
      INVOKE_LIVE=1
      shift
      ;;
    --budget-probe-simulate-mtd-usd)
      BUDGET_SIMULATE_MTD="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

if command -v python3 >/dev/null 2>&1; then
  PYTHON=(python3)
else
  PYTHON=(python)
fi

mkdir -p "${OUTPUT_DIR}"

echo "## Real-mode AI quality evidence CI" >&2
echo "Output directory: ${OUTPUT_DIR}" >&2

"${PYTHON[@]}" "${SCRIPT_DIR}/assert_eval_corpus_rc_has_real_exemplar.py"

"${PYTHON[@]}" "${SCRIPT_DIR}/eval_agent_faithfulness.py" --enforce
if [[ -f "${REPO_ROOT}/docs/quality/faithfulness-report.md" ]]; then
  cp "${REPO_ROOT}/docs/quality/faithfulness-report.md" "${OUTPUT_DIR}/faithfulness-report.md"
fi

if [[ -f "${SCRIPT_DIR}/eval_retrieval_ir.py" ]]; then
  "${PYTHON[@]}" "${SCRIPT_DIR}/eval_retrieval_ir.py" --enforce
  if [[ -f "${REPO_ROOT}/docs/quality/retrieval-ir-report.md" ]]; then
    cp "${REPO_ROOT}/docs/quality/retrieval-ir-report.md" "${OUTPUT_DIR}/retrieval-ir-report.md"
  fi
  if [[ -f "${REPO_ROOT}/docs/quality/retrieval-ir-summary.json" ]]; then
    cp "${REPO_ROOT}/docs/quality/retrieval-ir-summary.json" "${OUTPUT_DIR}/retrieval-ir-summary.json"
  fi
fi

if [[ -f "${REPO_ROOT}/docs/quality/faithfulness-summary.json" ]]; then
  cp "${REPO_ROOT}/docs/quality/faithfulness-summary.json" "${OUTPUT_DIR}/faithfulness-summary.json"
fi

if [[ -f "${SCRIPT_DIR}/assert_faithfulness_ir_floor_ratchet.py" ]]; then
  "${PYTHON[@]}" "${SCRIPT_DIR}/assert_faithfulness_ir_floor_ratchet.py" \
    --faithfulness-summary "${REPO_ROOT}/docs/quality/faithfulness-summary.json" \
    --retrieval-summary "${REPO_ROOT}/docs/quality/retrieval-ir-summary.json"
fi

export REPO_ROOT
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/export_real_mode_eval_corpus_env.sh"
export ARCHLUCID_EVAL_CORPUS_MARKDOWN_REPORT="${OUTPUT_DIR}/eval-corpus-real-mode-evidence.md"

bash "${SCRIPT_DIR}/run_eval_agent_corpus_rc.sh"

"${PYTHON[@]}" "${SCRIPT_DIR}/emit_committed_real_mode_quality_gate.py" \
  --json-out "${OUTPUT_DIR}/real-llm-evidence-gate.json"

LIVE_GATE_COPIED=0

if [[ "${INVOKE_LIVE}" -eq 1 ]]; then
  if [[ -n "${BUDGET_SIMULATE_MTD}" ]]; then
    export ARCHLUCID_GOLDEN_COHORT_BUDGET_PROBE_SIMULATE_MTD_USD="${BUDGET_SIMULATE_MTD}"
  fi

  set +e
  "${PYTHON[@]}" "${REPO_ROOT}/scripts/golden_cohort_budget_probe.py" \
    --usage-ledger "${REPO_ROOT}/tests/golden-cohort/usage-mtd.json" \
    > "${OUTPUT_DIR}/budget-probe.log" 2>&1
  budget_code=$?
  set -e

  echo "budget_probe_exit_code=${budget_code}" >> "${OUTPUT_DIR}/budget-probe-summary.txt"

  if [[ "${budget_code}" -eq 0 || "${budget_code}" -eq 1 ]]; then
    if command -v pwsh >/dev/null 2>&1; then
      set +e
      pwsh -NoProfile -File "${REPO_ROOT}/scripts/ci/Invoke-RealLlmGoldenCohort.ps1" \
        -GateMarkdownOut "${OUTPUT_DIR}/real-llm-evidence-gate-live.md"
      live_exit=$?
      set -e

      if [[ -f "${REPO_ROOT}/artifacts/release/real-llm-evidence-gate.json" ]]; then
        cp "${REPO_ROOT}/artifacts/release/real-llm-evidence-gate.json" \
          "${OUTPUT_DIR}/real-llm-evidence-gate-live.json"
        LIVE_GATE_COPIED=1
      fi

      echo "live_invoke_exit_code=${live_exit}" >> "${OUTPUT_DIR}/budget-probe-summary.txt"
    else
      echo "::warning::pwsh not available — skipping live real-LLM golden cohort invoke." >&2
    fi
  else
    echo "::warning::Live real-LLM invoke skipped — golden cohort budget probe exit ${budget_code} (kill switch or probe failure)." >&2
    echo "live_invoke_skipped=budget_probe_${budget_code}" >> "${OUTPUT_DIR}/budget-probe-summary.txt"
  fi
fi

"${PYTHON[@]}" "${SCRIPT_DIR}/generate_agent_quality_dashboard.py" \
  --out "${OUTPUT_DIR}/agent-quality-dashboard.md"

"${PYTHON[@]}" "${SCRIPT_DIR}/generate_real_llm_run_evidence.py" \
  --out "${OUTPUT_DIR}/real-llm-run-evidence.md"

if [[ -f "${SCRIPT_DIR}/build_material_finding_faithfulness_summary.py" ]]; then
  "${PYTHON[@]}" "${SCRIPT_DIR}/build_material_finding_faithfulness_summary.py" \
    --json-out "${OUTPUT_DIR}/material-finding-faithfulness-summary.json" \
    --markdown-out "${OUTPUT_DIR}/material-finding-faithfulness-summary.md" || true
fi

"${PYTHON[@]}" "${SCRIPT_DIR}/build_ai_quality_release_summary.py" \
  --repo-root "${REPO_ROOT}" \
  --bundle-dir "${OUTPUT_DIR}" \
  --json-out "${OUTPUT_DIR}/ai-quality-release-summary.json" \
  --markdown-out "${OUTPUT_DIR}/ai-quality-release-summary.md"

"${PYTHON[@]}" "${SCRIPT_DIR}/report_real_mode_evidence_freshness.py" \
  --bundle-dir "${OUTPUT_DIR}" \
  --json-out "${OUTPUT_DIR}/real-mode-evidence-freshness.json" \
  --markdown-out "${OUTPUT_DIR}/real-mode-evidence-freshness.md" \
  --gate-json "${OUTPUT_DIR}/real-llm-evidence-gate.json" \
  --allow-simulator-only

echo "Wrote ${OUTPUT_DIR}/ai-quality-release-summary.json"
echo "live_gate_copied=${LIVE_GATE_COPIED}"
