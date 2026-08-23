#!/usr/bin/env bash
# Text/Python CI guards that do not require a full-solution dotnet build.
# Invoked by workflow job "guards-pre-corset" (parallel with Tier 0.x; gates dotnet-fast-core).
#
# Usage (repo root):
#   bash scripts/ci/run_guards_pre_corset.sh
#
# Optional env (set by ci.yml for diff-scoped guards):
#   ARCHLUCID_GIT_REPO_ROOT — workspace root (default: repo root)
#   ARCHLUCID_GIT_DIFF_RANGE — e.g. base...head for PR/push/dispatch

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

export ARCHLUCID_GIT_REPO_ROOT="${ARCHLUCID_GIT_REPO_ROOT:-$ROOT}"

echo "Pre-corset guards: ARCHLUCID_GIT_DIFF_RANGE=${ARCHLUCID_GIT_DIFF_RANGE:-<unset>}"

python3 scripts/ci/assert_audit_const_count.py
python3 scripts/ci/assert_openapi_mutations_in_audit_matrix.py
python3 scripts/ci/check_audit_matrix.py
python3 scripts/ci/detect_mutating_route_idempotency_drift.py
python3 scripts/ci/assert_route_tier_policy_nav.py
python3 scripts/ci/check_nav_authority_controller_parity.py
python3 scripts/ci/check_api_latency_tiers.py
python3 scripts/ci/assert_ui_route_traffic_workbook_canonical.py
python3 scripts/ci/test_coordinator_parity_probe.py
python3 scripts/ci/assert_rollback_scripts_exist.py
python3 scripts/ci/assert_reference_architecture_exemplars.py

if [[ -n "${ARCHLUCID_GIT_DIFF_RANGE:-}" ]]; then
  python3 scripts/ci/assert_forward_migration_touches_archlucid_sql.py
  python3 scripts/ci/assert_forward_migration_touches_archlucid_system_sql.py
  python3 scripts/ci/assert_tenant_table_isolation_classifications.py
  python3 scripts/ci/check_single_class_per_file.py
  python3 scripts/ci/check_control_flow_spacing.py
  python3 scripts/ci/check_csharp_is_null.py
  python3 scripts/ci/check_no_console_writeline.py
  python3 scripts/ci/check_no_base_exception.py
  python3 scripts/ci/check_datetime_now.py
  python3 scripts/ci/check_no_async_void.py
  python3 scripts/ci/check_no_sync_over_async.py
fi

python -m unittest discover -s scripts/ci/tests -p "test_assert_forward_migration_touches_archlucid_sql.py"
python -m unittest discover -s scripts/ci/tests -p "test_assert_forward_migration_touches_archlucid_system_sql.py"
python -m unittest discover -s scripts/ci/tests -p "test_assert_tenant_table_isolation_classifications.py"
python -m unittest discover -s scripts/ci/tests -p "test_csharp_style_guards.py"
python -m unittest discover -s scripts/ci/tests -p "test_maintainability_batch_5cm.py"
python -m unittest discover -s scripts/ci/tests -p "test_decision_explainability_batch_tb050_tb053_tb051.py"
python -m unittest discover -s scripts/ci/tests -p "test_traceability_batch_5ce.py"
python -m unittest discover -s scripts/ci/tests -p "test_stickiness_batch_tb057.py"
python -m unittest discover -s scripts/ci/tests -p "test_check_api_latency_tiers.py"

python3 scripts/ci/check_migration_numbering.py || true
python3 scripts/ci/check_test_configure_await.py
python3 scripts/ci/check_single_ddl_file.py
python3 scripts/ci/check_archlucid_unified_schema_snapshot.py
python3 scripts/ci/smoke_m49_harness_validate_only.py

python3 scripts/ci/assert_legacy_config_sunset_not_passed.py
python3 scripts/ci/assert_agent_reference_baselines.py

set +e
grep -rni "archiforge" --include="*.cs" --exclude-dir=obj --exclude-dir=bin --exclude-dir=.git . > "${RUNNER_TEMP:-/tmp}/archiforge-cs-hits.txt"
rc=$?
set -e
if [ "$rc" -gt 1 ]; then
  echo "::error::ArchLucid rename guard: grep failed while scanning .cs files (rc=$rc)"
  exit 1
fi
if [ "$rc" -eq 0 ]; then
  echo "::error::ArchLucid rename guard: unexpected 'archiforge' references in .cs files:"
  cat "${RUNNER_TEMP:-/tmp}/archiforge-cs-hits.txt"
  exit 1
fi

set +e
grep -rni "archiforge" --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git . \
  > "${RUNNER_TEMP:-/tmp}/archiforge-ts-hits.txt"
rc=$?
set -e
if [ "$rc" -gt 1 ]; then
  echo "::error::ArchLucid rename guard: grep failed while scanning TS/TSX files (rc=$rc)"
  exit 1
fi
if [ "$rc" -eq 0 ]; then
  echo "::error::ArchLucid rename guard: unexpected 'archiforge' references in TS/TSX files:"
  cat "${RUNNER_TEMP:-/tmp}/archiforge-ts-hits.txt"
  exit 1
fi

set +e
grep -rni "archiforge" \
  --include="*.ts" --include="*.tsx" --include="*.tf" \
  'archlucid-ui/src/app/(marketing)' infra/terraform-edge \
  > "${RUNNER_TEMP:-/tmp}/archiforge-marketing-edge.txt"
rc=$?
set -e
if [ "$rc" -gt 1 ]; then
  echo "::error::ArchLucid rename guard: grep failed while scanning marketing UI / terraform-edge (rc=$rc)"
  exit 1
fi
if [ "$rc" -eq 0 ]; then
  echo "::error::ArchLucid rename guard: unexpected 'archiforge' in marketing UI or terraform-edge:"
  cat "${RUNNER_TEMP:-/tmp}/archiforge-marketing-edge.txt"
  exit 1
fi

set +e
# Match IIntegrationEventPublisher receiver only — not product PublishAsync helpers
# (e.g. ArchitectureIntelligenceProductPublishService.PublishAsync).
grep -rn "publisher\.PublishAsync(" --include="*.cs" --exclude-dir=obj --exclude-dir=bin --exclude-dir=.git . > "${RUNNER_TEMP:-/tmp}/pub-hits.txt"
rc=$?
set -e
if [ "$rc" -gt 1 ]; then
  echo "::error::grep failed while scanning for publisher.PublishAsync( (rc=$rc)"
  exit 1
fi
if [ "$rc" -eq 1 ]; then
  echo "No publisher.PublishAsync( matches in .cs files."
else
  HITS=$(grep -v "Tests/" "${RUNNER_TEMP:-/tmp}/pub-hits.txt" \
    | grep -v "IntegrationEventPublishing.cs" \
    | grep -v "IntegrationEventOutboxProcessor.cs" \
    | grep -v "interface IIntegrationEventPublisher" \
    | grep -v "/// " \
    || true)
  if [ -n "$HITS" ]; then
    echo "::error::Found direct IIntegrationEventPublisher.PublishAsync calls outside authorized locations:"
    echo "$HITS"
    echo ""
    echo "Use OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync instead."
    exit 1
  fi
fi

python scripts/assert_context_ingestion_di_guards.py
python scripts/ci/assert_list_endpoint_pagination.py

python3 scripts/ci/sweep_trust_procurement_freshness.py --warn-only
python3 scripts/ci/check_doc_source_of_truth_headers.py
python3 scripts/ci/audit_new_operator_dry_run_docs.py
python3 scripts/ci/check_azure_ai_search_release_evidence.py
python3 scripts/ci/validate_outbox_retrieval_slo_thresholds.py
python3 scripts/ci/check_public_pdf_safety.py

python3 -m pip install --quiet pytest
cd scripts/ci && python3 -m pytest tests/ -v
cd "$ROOT"

python3 scripts/ci/assert_query_performance.py --dry-run || true
python3 scripts/ci/assert_pmf_tracker_discipline.py
python3 scripts/ci/assert_traceability_coverage.py
python3 scripts/ci/assert_rtm_test_filters_resolve.py
python3 scripts/ci/eval_agent_quality.py --manifest-only --strict
python3 scripts/ci/eval_retrieval_ir.py --enforce

echo "Pre-corset guards finished successfully."
