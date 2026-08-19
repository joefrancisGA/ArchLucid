#!/usr/bin/env bash
# Export ARCHLUCID_EVAL_CORPUS_REAL_MODE_* paths to committed exemplars under tests/eval-corpus/agent-results/.
# Source from run_eval_agent_corpus_rc.sh and run_real_mode_ai_quality_evidence_ci.sh.
set -euo pipefail

if [[ -z "${REPO_ROOT:-}" ]]; then
  REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fi

_RESULTS="${REPO_ROOT}/tests/eval-corpus/agent-results"

export ARCHLUCID_EVAL_CORPUS_REAL_MODE_SMOKE_AGENT_RESULT="${_RESULTS}/corpus-real-mode-smoke.real.json"
export ARCHLUCID_EVAL_CORPUS_REAL_MODE_COST_AGENT_RESULT="${_RESULTS}/corpus-real-mode-cost.real.json"
export ARCHLUCID_EVAL_CORPUS_REAL_MODE_COMPLIANCE_AGENT_RESULT="${_RESULTS}/corpus-real-mode-compliance.real.json"
export ARCHLUCID_EVAL_CORPUS_REAL_MODE_CRITIC_AGENT_RESULT="${_RESULTS}/corpus-real-mode-critic.real.json"
export ARCHLUCID_EVAL_CORPUS_REAL_MODE_THREE_TIER_AGENT_RESULT="${_RESULTS}/corpus-real-mode-three-tier.real.json"
export ARCHLUCID_EVAL_CORPUS_REAL_MODE_MICROSERVICES_AGENT_RESULT="${_RESULTS}/corpus-real-mode-microservices.real.json"
export ARCHLUCID_EVAL_CORPUS_REAL_MODE_DATABASE_BACKUP_AGENT_RESULT="${_RESULTS}/corpus-real-mode-database-backup.real.json"
export ARCHLUCID_EVAL_CORPUS_REAL_MODE_OVERPROVISIONED_VM_AGENT_RESULT="${_RESULTS}/corpus-real-mode-overprovisioned-vm.real.json"
export ARCHLUCID_EVAL_CORPUS_REAL_MODE_MULTI_REGION_AGENT_RESULT="${_RESULTS}/corpus-real-mode-multi-region.real.json"
export ARCHLUCID_EVAL_CORPUS_REAL_MODE_AZURE_WEB_APP_AGENT_RESULT="${_RESULTS}/corpus-real-mode-azure-web-app.real.json"
export ARCHLUCID_EVAL_CORPUS_REAL_MODE_CLOUD_MIGRATION_LIFT_SHIFT_AGENT_RESULT="${_RESULTS}/corpus-real-mode-cloud-migration-lift-shift.real.json"
export ARCHLUCID_EVAL_CORPUS_REAL_MODE_GREENFIELD_MICROSERVICES_AGENT_RESULT="${_RESULTS}/corpus-real-mode-greenfield-microservices.real.json"
export ARCHLUCID_EVAL_CORPUS_REAL_MODE_HEALTHCARE_HIPAA_AGENT_RESULT="${_RESULTS}/corpus-real-mode-healthcare-hipaa.real.json"
export ARCHLUCID_EVAL_CORPUS_REAL_MODE_FINOPS_EXISTING_AZURE_AGENT_RESULT="${_RESULTS}/corpus-real-mode-finops-existing-azure.real.json"
export ARCHLUCID_EVAL_CORPUS_REAL_MODE_EVENT_DRIVEN_AGENT_RESULT="${_RESULTS}/corpus-real-mode-event-driven.real.json"
export ARCHLUCID_EVAL_CORPUS_REAL_MODE_MULTI_REGION_ACTIVE_ACTIVE_AGENT_RESULT="${_RESULTS}/corpus-real-mode-multi-region-active-active.real.json"
export ARCHLUCID_EVAL_CORPUS_REAL_MODE_DATA_PLATFORM_ANALYTICS_AGENT_RESULT="${_RESULTS}/corpus-real-mode-data-platform-analytics.real.json"
export ARCHLUCID_EVAL_CORPUS_REAL_MODE_AI_ML_INFERENCE_AGENT_RESULT="${_RESULTS}/corpus-real-mode-ai-ml-inference.real.json"
