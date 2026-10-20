#!/usr/bin/env bash
# Blocking beta-readiness wiring guards (push corset + PR trunk gate parity).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

python3 scripts/ci/check_no_merge_conflict_markers.py
python3 scripts/ci/check_async_hazards.py --root .
python3 scripts/ci/check_direct_clock_access.py --root .
python3 scripts/ci/check_sensitive_log_placeholders.py --root .
python3 scripts/ci/check_playwright_skip_reasons.py
python3 scripts/ci/check_temporary_behavior_registry.py
python3 scripts/ci/check_sponsor_export_execution_mode_label.py
python3 scripts/ci/check_live_api_private_beta_access_ci_wiring.py
python3 scripts/ci/check_private_beta_frozen_branch_pin.py
python3 scripts/ci/check_auth_beta_readiness_invite_callout_surfaces.py
python3 scripts/ci/check_ui_jwt_bearer_build_on_push_corset.py
python3 scripts/ci/check_push_corset_openapi_snapshot.py
python3 scripts/ci/check_api_types_package_in_sync.py
python3 scripts/ci/check_release_gate_playwright_wiring.py
python3 scripts/ci/check_insight_density_advisory_surfaces.py
python3 scripts/ci/check_architecture_object_acceptance_wiring.py
python3 scripts/ci/check_securenow_archlucid_leak_guard_wiring.py
python3 scripts/ci/check_policy_pack_finding_delta_offline_packet.py
python3 scripts/ci/check_policy_pack_compounding_evidence_ledger.py
python3 scripts/ci/check_manifest_summary_manifest_version_access.py
python3 scripts/ci/check_status_tag_kind_warning.py
python3 scripts/ci/check_npm_overrides_lockfile_sync.py
python3 scripts/ci/check_live_e2e_simulator_azure_openai_env.py
python3 scripts/ci/check_github_actions_run_block_scalars.py
python3 scripts/ci/check_workspace_mode_client_boundary.py
python3 scripts/ci/check_schemathesis_light_auth_paths.py
python3 scripts/ci/check_private_beta_access_coverage.py
python3 scripts/ci/check_private_beta_openapi_provisioning_routes.py
python3 scripts/ci/check_sponsor_roi_summary_section_imports.py
python3 scripts/ci/check_private_beta_proxy_esm_boundary.py
python3 scripts/ci/check_quick_scan_sample_only.py
python3 scripts/ci/check_private_beta_claim_boundary.py
python3 scripts/ci/check_azure_extractor_pester_isolation.py
python3 scripts/ci/check_no_legacy_peer_deps.py
python3 scripts/ci/assert_prompt_injection_guard.py
python3 scripts/ci/check_demo_anonymous_read_plane_honesty.py
python3 scripts/ci/check_beta_readiness_unittest_discover.py
