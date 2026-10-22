#!/usr/bin/env bash
# Shared CI wrapper for scripts/golden_cohort_budget_probe.py (Q15 kill-switch).
# Writes GITHUB_OUTPUT (exit_code, mtd_usd, warn/kill thresholds), step summary,
# and ::warning:: when the probe requests skip. Always exits 0 so the workflow stays green.
#
# Usage: bash scripts/ci/run_golden_cohort_budget_probe_ci.sh "Summary label"
set -uo pipefail

label="${1:-Golden cohort real LLM}"
log_file="${RUNNER_TEMP:-/tmp}/golden-cohort-budget-probe.log"

if [ -z "${GITHUB_OUTPUT:-}" ]; then
  echo "run_golden_cohort_budget_probe_ci.sh: GITHUB_OUTPUT is not set (GitHub Actions only)." >&2
  exit 1
fi

# GitHub's default bash -e would abort on probe exit 1–3 before we map codes to a green skip.
set +e
set -o pipefail
python scripts/golden_cohort_budget_probe.py --usage-ledger tests/golden-cohort/usage-mtd.json 2>&1 | tee "${log_file}"
code=${PIPESTATUS[0]}
set -e
set +o pipefail

mtd_line=$(grep '^EXPORT_MTD_USD=' "${log_file}" | tail -n1 || true)
mtd_val="${mtd_line#EXPORT_MTD_USD=}"
warn_line=$(grep '^EXPORT_WARN_THRESHOLD_USD=' "${log_file}" | tail -n1 || true)
warn_val="${warn_line#EXPORT_WARN_THRESHOLD_USD=}"
kill_line=$(grep '^EXPORT_KILL_THRESHOLD_USD=' "${log_file}" | tail -n1 || true)
kill_val="${kill_line#EXPORT_KILL_THRESHOLD_USD=}"

{
  echo "exit_code=${code}"
  echo "mtd_usd=${mtd_val}"
  echo "warn_threshold_usd=${warn_val}"
  echo "kill_threshold_usd=${kill_val}"
} >> "${GITHUB_OUTPUT}"

case "${code}" in
  0)
    {
      echo "## ${label}"
      echo "Continue: MTD spend \$${mtd_val:-?} is under the warn threshold (\$${warn_val:-?})."
    } >> "${GITHUB_STEP_SUMMARY}"
    ;;
  1)
    {
      echo "## ${label} (WARN)"
      echo "MTD spend \$${mtd_val:-?} crossed the **warn** threshold (\$${warn_val:-?}, 80% of cap)."
      echo "Live real-LLM steps may continue; monitor spend before the kill threshold."
    } >> "${GITHUB_STEP_SUMMARY}"
    ;;
  2)
    echo "::warning::${label} skipped — MTD spend \$${mtd_val:-?} crossed kill threshold (\$${kill_val:-?}, 95% of \$15 cap). Workflow continues without failure."
    {
      echo "## ${label} (SKIP — KILL SWITCH)"
      echo "MTD spend \$${mtd_val:-?} crossed the **kill** threshold (\$${kill_val:-?}, 95% of cap)."
      echo "Real-LLM steps SKIPPED for the rest of the month. Workflow does not count as failure."
    } >> "${GITHUB_STEP_SUMMARY}"
    ;;
  *)
    echo "::warning::${label} skipped — budget probe failed (exit ${code}). See docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md § Probe failure."
    {
      echo "## ${label} (SKIP — probe failed)"
      echo "Budget probe failed (exit ${code}). See docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md § Probe failure."
    } >> "${GITHUB_STEP_SUMMARY}"
    ;;
esac

exit 0
