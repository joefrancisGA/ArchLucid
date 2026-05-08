#!/usr/bin/env bash
# Release-candidate wrapper for scripts/ci/eval_agent_corpus.py
#
# Pull-request CI should keep Azure OpenAI credentials unset and call eval_agent_corpus.py
# without --require-real-mode-evidence (real-mode rows skip when env vars are unset).
#
# This script turns on strict recall, simulator + real-mode quality-gate enforcement, and
# mandatory real-mode AgentResult evidence so RC automation fails fast when evidence is
# missing or reference paths are rejected by the default gate.
#
# Environment variables:
#   ARCHLUCID_EVAL_CORPUS_ROOT          — corpus directory (default: <repo>/tests/eval-corpus)
#   ARCHLUCID_EVAL_CORPUS_MIN_RECALL    — --min-recall (default: 0.75)
#   ARCHLUCID_EVAL_CORPUS_MARKDOWN_REPORT — if set, passes --markdown-report <path>
# Real-mode quality rows (set each to an absolute path of Web-serialized AgentResult JSON; RC workflow
# points them at committed exemplars under tests/eval-corpus/agent-results/*.real.json):
#   ARCHLUCID_EVAL_CORPUS_REAL_MODE_SMOKE_AGENT_RESULT       — scenario-real-mode-smoke (Topology)
#   ARCHLUCID_EVAL_CORPUS_REAL_MODE_COST_AGENT_RESULT        — scenario-real-mode-cost
#   ARCHLUCID_EVAL_CORPUS_REAL_MODE_COMPLIANCE_AGENT_RESULT  — scenario-real-mode-compliance
#   ARCHLUCID_EVAL_CORPUS_REAL_MODE_CRITIC_AGENT_RESULT      — scenario-real-mode-critic
# See docs/library/AGENT_EVAL_CORPUS.md.
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
  "--enforce-real-quality-gate"
  "--require-real-mode-evidence"
)

if [[ -n "${ARCHLUCID_EVAL_CORPUS_MARKDOWN_REPORT:-}" ]]; then
  CMD+=( "--markdown-report" "${ARCHLUCID_EVAL_CORPUS_MARKDOWN_REPORT}" )
fi

exec "${CMD[@]}" "$@"
