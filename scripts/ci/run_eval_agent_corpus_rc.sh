#!/usr/bin/env bash
# Release-candidate wrapper for scripts/ci/eval_agent_corpus.py
#
# Pull-request CI should keep Azure OpenAI credentials unset and call eval_agent_corpus.py
# without --require-real-mode-evidence (real-mode rows skip when env vars are unset).
#
# This script turns on strict recall, simulator quality-gate enforcement, and mandatory
# real-mode AgentResult evidence so RC automation fails fast when evidence is missing.
#
# Environment variables:
#   ARCHLUCID_EVAL_CORPUS_ROOT          — corpus directory (default: <repo>/tests/eval-corpus)
#   ARCHLUCID_EVAL_CORPUS_MIN_RECALL    — --min-recall (default: 0.75)
#   ARCHLUCID_EVAL_CORPUS_MARKDOWN_REPORT — if set, passes --markdown-report <path>
#   ARCHLUCID_EVAL_CORPUS_REAL_MODE_SMOKE_AGENT_RESULT — absolute path to exported Web AgentResult JSON
#       for scenario-real-mode-smoke (see tests/eval-corpus/scenario-real-mode-smoke.json /
#       docs/library/AGENT_EVAL_CORPUS.md).
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
MIN_RECALL="${ARCHLUCID_EVAL_CORPUS_MIN_RECALL:-0.75}"
CORPUS="${ARCHLUCID_EVAL_CORPUS_ROOT:-${REPO_ROOT}/tests/eval-corpus}"

if command -v python3 >/dev/null 2>&1; then
  PYTHON=(python3)
else
  PYTHON=(python)
fi

CMD=(
  "${PYTHON[@]}" "${SCRIPT_DIR}/eval_agent_corpus.py"
  "--corpus" "${CORPUS}"
  "--enforce"
  "--min-recall" "${MIN_RECALL}"
  "--enforce-quality-gate"
  "--require-real-mode-evidence"
)

if [[ -n "${ARCHLUCID_EVAL_CORPUS_MARKDOWN_REPORT:-}" ]]; then
  CMD+=( "--markdown-report" "${ARCHLUCID_EVAL_CORPUS_MARKDOWN_REPORT}" )
fi

exec "${CMD[@]}" "$@"
