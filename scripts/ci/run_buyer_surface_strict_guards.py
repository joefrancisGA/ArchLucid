#!/usr/bin/env python3
"""Run buyer-facing claim guards in advisory or strict mode based on diff scope."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

from detect_buyer_surface_changes import detect_buyer_surface_changes

_CI_DIR = Path(__file__).resolve().parent


@dataclass(frozen=True)
class GuardCommand:
    label: str
    argv: tuple[str, ...]
    advisory_flag: str | None = None


GUARDS: tuple[GuardCommand, ...] = (
    GuardCommand(
        "buyer claim drift",
        ("python", "scripts/ci/check_buyer_claim_drift.py"),
        "--advisory",
    ),
    GuardCommand(
        "claim/evidence consistency",
        ("python", "scripts/ci/check_claim_evidence_consistency.py"),
        None,
    ),
    GuardCommand(
        "commercial overclaim guard",
        ("python", "scripts/ci/check_commercial_overclaim_guard.py"),
        None,
    ),
    GuardCommand(
        "procurement claim coherence",
        ("python", "scripts/ci/check_procurement_claim_coherence.py"),
        None,
    ),
    GuardCommand(
        "bakeoff 15-min honesty",
        ("python", "scripts/ci/check_bakeoff_15min_honesty.py"),
        None,
    ),
    GuardCommand(
        "weekly buyer-claim drift inventory",
        ("python", "scripts/ci/check_weekly_buyer_claim_drift_inventory.py"),
        None,
    ),
    GuardCommand(
        "weekly buyer-claim drift honesty",
        ("python", "scripts/ci/check_weekly_buyer_claim_drift_honesty.py"),
        None,
    ),
    GuardCommand(
        "AOAI retirement repro honesty",
        ("python", "scripts/ci/check_aoai_retirement_repro_honesty.py"),
        None,
    ),
    GuardCommand(
        "live vs nightly tripwire honesty",
        ("python", "scripts/ci/check_live_vs_nightly_tripwire_honesty.py"),
        None,
    ),
    GuardCommand(
        "solo-ops MVO honesty",
        ("python", "scripts/ci/check_solo_ops_mvo_honesty.py"),
        None,
    ),
    GuardCommand(
        "outbox exactly-once honesty",
        ("python", "scripts/ci/check_outbox_exactly_once_honesty.py"),
        None,
    ),
    GuardCommand(
        "manifest schema evolution honesty",
        ("python", "scripts/ci/check_manifest_schema_evolution_honesty.py"),
        None,
    ),
    GuardCommand(
        "concurrent execute/commit honesty",
        ("python", "scripts/ci/check_concurrent_execute_commit_honesty.py"),
        None,
    ),
    GuardCommand(
        "anti-gates-alone FinOps honesty",
        ("python", "scripts/ci/check_anti_gates_alone_finops_honesty.py"),
        None,
    ),
    GuardCommand(
        "paying-tenant spend-storm honesty",
        ("python", "scripts/ci/check_paying_tenant_spend_storm_honesty.py"),
        None,
    ),
    GuardCommand(
        "shared-AOAI-TPM noisy-neighbor honesty",
        ("python", "scripts/ci/check_shared_aoai_tpm_noisy_neighbor_honesty.py"),
        None,
    ),
    GuardCommand(
        "policy-pack customer-rule sandbox honesty",
        ("python", "scripts/ci/check_policy_pack_customer_rule_sandbox_honesty.py"),
        None,
    ),
    GuardCommand(
        "minimum pilot trust packet honesty",
        ("python", "scripts/ci/check_minimum_pilot_trust_packet_honesty.py"),
        None,
    ),
    GuardCommand(
        "polly run-completeness honesty",
        ("python", "scripts/ci/check_polly_run_completeness_honesty.py"),
        None,
    ),
    GuardCommand(
        "llm trust-boundary honesty",
        ("python", "scripts/ci/check_llm_trust_boundary_honesty.py"),
        None,
    ),
    GuardCommand(
        "tenant-identity header re-derive honesty",
        ("python", "scripts/ci/check_tenant_identity_header_rederive_honesty.py"),
        None,
    ),
    GuardCommand(
        "committed-manifest substitute honesty",
        ("python", "scripts/ci/check_committed_manifest_substitute_honesty.py"),
        None,
    ),
    GuardCommand(
        "netarchtest isolation honesty",
        ("python", "scripts/ci/check_netarchtest_isolation_honesty.py"),
        None,
    ),
    GuardCommand(
        "authority AgentTask path honesty",
        ("python", "scripts/ci/check_authority_agenttask_path_honesty.py"),
        None,
    ),
    GuardCommand(
        "append-only sealed evidence honesty",
        ("python", "scripts/ci/check_append_only_sealed_evidence_honesty.py"),
        None,
    ),
    GuardCommand(
        "retrieval tenancy hit guarantee honesty",
        ("python", "scripts/ci/check_retrieval_tenancy_hit_guarantee_honesty.py"),
        None,
    ),
    GuardCommand(
        "transactional finalize outbox honesty",
        ("python", "scripts/ci/check_transactional_finalize_outbox_honesty.py"),
        None,
    ),
    GuardCommand(
        "pre-finalize gate SoD honesty",
        ("python", "scripts/ci/check_pre_finalize_gate_sod_honesty.py"),
        None,
    ),
    GuardCommand(
        "faithfulness scoring lane honesty",
        ("python", "scripts/ci/check_faithfulness_support_ratio_scoring_lane_honesty.py"),
        None,
    ),
    GuardCommand(
        "shared hallucination defense plane honesty",
        ("python", "scripts/ci/check_shared_hallucination_defense_plane_honesty.py"),
        None,
    ),
    GuardCommand(
        "tenant DiD erosion beyond predicates honesty",
        ("python", "scripts/ci/check_tenant_did_erosion_beyond_predicates_honesty.py"),
        None,
    ),
    GuardCommand(
        "azure workload privilege escalation seam honesty",
        ("python", "scripts/ci/check_azure_workload_privilege_escalation_seam_honesty.py"),
        None,
    ),
    GuardCommand(
        "dapper DDL satellite breakdown honesty",
        ("python", "scripts/ci/check_dapper_ddl_satellite_breakdown_signals_honesty.py"),
        None,
    ),
    GuardCommand(
        "fine-tuning promotion decision record honesty",
        ("python", "scripts/ci/check_fine_tuning_promotion_decision_record_honesty.py"),
        None,
    ),
    GuardCommand(
        "real execute AOAI throttle policy honesty",
        ("python", "scripts/ci/check_real_execute_aoai_throttle_policy_honesty.py"),
        None,
    ),
    GuardCommand(
        "async orchestration first-force honesty",
        ("python", "scripts/ci/check_async_orchestration_first_force_honesty.py"),
        None,
    ),
    GuardCommand(
        "container apps terraform authority honesty",
        ("python", "scripts/ci/check_container_apps_terraform_authority_honesty.py"),
        None,
    ),
    GuardCommand(
        "policy pack evaluation hybrid honesty",
        ("python", "scripts/ci/check_policy_pack_evaluation_hybrid_honesty.py"),
        None,
    ),
    GuardCommand(
        "review volume 100x capacity honesty",
        ("python", "scripts/ci/check_review_volume_100x_capacity_honesty.py"),
        None,
    ),
    GuardCommand(
        "see-it universe honesty",
        ("python", "scripts/ci/check_see_it_universe_honesty.py"),
        None,
    ),
    GuardCommand(
        "comparison replay drift honesty",
        ("python", "scripts/ci/check_comparison_replay_drift_honesty.py"),
        None,
    ),
    GuardCommand(
        "operator primary object honesty",
        ("python", "scripts/ci/check_operator_primary_object_honesty.py"),
        None,
    ),
    GuardCommand(
        "first-15 package spine honesty",
        ("python", "scripts/ci/check_first_15_package_spine_honesty.py"),
        None,
    ),
    GuardCommand(
        "launch-load failure-order honesty",
        ("python", "scripts/ci/check_launch_load_failure_order_honesty.py"),
        None,
    ),
    GuardCommand(
        "wntp buyer ui honesty",
        ("python", "scripts/ci/check_wntp_buyer_ui_honesty.py"),
        None,
    ),
    GuardCommand(
        "decide once triad honesty",
        ("python", "scripts/ci/check_decide_once_triad_honesty.py"),
        None,
    ),
    GuardCommand(
        "gdpr erasure append-only honesty",
        ("python", "scripts/ci/check_gdpr_erasure_append_only_honesty.py"),
        None,
    ),
    GuardCommand(
        "offline export portability honesty",
        ("python", "scripts/ci/check_offline_export_portability_honesty.py"),
        None,
    ),
    GuardCommand(
        "evidence backup restore honesty",
        ("python", "scripts/ci/check_evidence_backup_restore_honesty.py"),
        None,
    ),
    GuardCommand(
        "crash recovery long-running review honesty",
        ("python", "scripts/ci/check_crash_recovery_long_running_review_honesty.py"),
        None,
    ),
    GuardCommand(
        "itsm outbox dlq delivery honesty",
        ("python", "scripts/ci/check_itsm_outbox_dlq_delivery_honesty.py"),
        None,
    ),
    GuardCommand(
        "mid-run authority revocation honesty",
        ("python", "scripts/ci/check_mid_run_authority_revocation_honesty.py"),
        None,
    ),
    GuardCommand(
        "evidence audit ordering causality honesty",
        ("python", "scripts/ci/check_evidence_audit_ordering_causality_honesty.py"),
        None,
    ),
    GuardCommand(
        "isolation claims too-strong honesty",
        ("python", "scripts/ci/check_isolation_claims_too_strong_honesty.py"),
        None,
    ),
    GuardCommand(
        "security review readiness honesty",
        ("python", "scripts/ci/check_security_review_ready_without_musts_honesty.py"),
        None,
    ),
    GuardCommand(
        "buyer first-30-minutes sync",
        ("python", "scripts/ci/assert_buyer_first_30_minutes_in_sync.py"),
        None,
    ),
    GuardCommand(
        "sponsor evidence label consistency",
        ("python", "scripts/ci/check_sponsor_evidence_label_consistency.py"),
        None,
    ),
    GuardCommand(
        "proof-language superlatives",
        ("python", "scripts/ci/check_proof_language_superlatives.py"),
        "--advisory",
    ),
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def resolve_strict_mode(*, base_ref: str, force_strict: bool, force_advisory: bool) -> tuple[bool, list[str]]:
    if force_advisory:
        return False, []

    if force_strict:
        return True, []

    env_strict = os.environ.get("ARCHLUCID_BUYER_SURFACE_STRICT", "").strip().lower()

    if env_strict in {"1", "true", "yes"}:
        return True, []

    ref = os.environ.get("GITHUB_REF", "")

    if ref.startswith("refs/heads/release/") or "/tags/v" in ref and "-rc" in ref:
        return True, []

    payload = detect_buyer_surface_changes(base_ref, repo_root())
    changed_paths = payload.get("changedPaths", [])

    if not isinstance(changed_paths, list):
        return False, []

    return bool(payload.get("buyerSurfaceChanged")), [str(path) for path in changed_paths]


def run_guard(root: Path, guard: GuardCommand, *, strict: bool) -> tuple[int, str]:
    argv = list(guard.argv)

    if not strict and guard.advisory_flag is not None:
        argv.append(guard.advisory_flag)

    completed = subprocess.run(
        argv,
        cwd=root,
        capture_output=True,
        text=True,
        check=False,
    )
    output = (completed.stdout or "") + (completed.stderr or "")

    return completed.returncode, output.strip()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-ref", default="origin/main")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Force strict mode regardless of buyer-surface diff.",
    )
    parser.add_argument(
        "--advisory",
        action="store_true",
        help="Force advisory mode (never fail).",
    )
    args = parser.parse_args(argv)

    root = repo_root()
    strict, changed_paths = resolve_strict_mode(
        base_ref=args.base_ref,
        force_strict=args.strict,
        force_advisory=args.advisory,
    )
    mode_label = "strict" if strict else "advisory"

    print(f"buyer-surface guards: mode={mode_label} base_ref={args.base_ref}")

    if changed_paths:
        print(f"buyer-surface guards: {len(changed_paths)} changed path(s) triggered strict evaluation")

        for path in changed_paths:
            print(f"  - {path}")
    elif strict:
        print("buyer-surface guards: strict via release branch/tag or ARCHLUCID_BUYER_SURFACE_STRICT")
    else:
        print("buyer-surface guards: no buyer-surface diff — failures are advisory only")

    failures: list[str] = []

    for guard in GUARDS:
        exit_code, output = run_guard(root, guard, strict=strict)

        if exit_code == 0:
            print(f"  PASS {guard.label}")
            continue

        failures.append(guard.label)
        print(f"  FAIL {guard.label} (exit {exit_code})", file=sys.stderr)

        if output:
            print(output, file=sys.stderr)

    if failures and strict:
        print(
            f"buyer-surface guards: {len(failures)} blocking failure(s) in strict mode",
            file=sys.stderr,
        )
        return 1

    if failures:
        print(
            f"buyer-surface guards: {len(failures)} advisory failure(s) — merge not blocked",
            file=sys.stderr,
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
