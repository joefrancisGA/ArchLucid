#!/usr/bin/env python3
"""Compose RC signoff gates into a single PASS/WARN/HOLD/SKIPPED evidence bundle (TB-317)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from release_evidence_bundle import evaluate_real_mode_ai_evidence  # noqa: E402
from release_evidence_common import first_existing, load_json, repo_root  # noqa: E402

_SCHEMA = "archlucid.rc-evidence-signoff-bundle.v1"
_BLOCKING_STATUSES = frozenset({"HOLD", "FAIL"})
_WARN_STATUSES = frozenset({"WARN", "STALE", "PARTIAL"})


def _normalize_status(raw: Any) -> str:
    if raw is None:
        return "SKIPPED"

    normalized = str(raw).strip().upper()

    if normalized in {"PASS", "READY", "VALID", "TRUE"}:
        return "PASS"

    if normalized in _WARN_STATUSES:
        return "WARN"

    if normalized in _BLOCKING_STATUSES | {"INVALID", "FALSE"}:
        return "HOLD"

    if normalized in {"SKIPPED", "NOT_COLLECTED", "NOT_RUN", "MISSING", "UNKNOWN"}:
        return "SKIPPED"

    return "WARN"


def _gate_from_payload(
    *,
    gate_id: str,
    label: str,
    artifact_path: str | None,
    payload: dict[str, Any] | None,
    status_keys: tuple[str, ...],
    reason_keys: tuple[str, ...] = ("detail", "summary", "reason"),
    evidence_mode: str = "unknown",
    high_risk: bool = False,
    skipped_reason: str = "artifact not attached to release bundle",
) -> dict[str, Any]:
    if payload is None:
        return {
            "id": gate_id,
            "label": label,
            "status": "SKIPPED",
            "reason": skipped_reason,
            "artifactPath": artifact_path,
            "evidenceMode": evidence_mode,
            "highRisk": high_risk,
        }

    status_value = None

    for key in status_keys:
        if key in payload and payload.get(key) not in (None, ""):
            status_value = payload.get(key)
            break

    status = _normalize_status(status_value)

    reason = skipped_reason

    for key in reason_keys:
        candidate = payload.get(key)

        if isinstance(candidate, str) and candidate.strip():
            reason = candidate.strip()
            break

    if status == "SKIPPED" and reason == skipped_reason:
        reason = f"{label}: no disposition field in attached artifact"

    resolved_mode = evidence_mode

    if evidence_mode == "unknown":
        execution_mode = str(payload.get("executionMode") or payload.get("executionModeLabel") or "").lower()

        if execution_mode == "real":
            resolved_mode = "real"
        elif execution_mode == "simulator":
            resolved_mode = "simulator"
        elif payload.get("simulatorOnlyOverridePresent") is True:
            resolved_mode = "simulator"

    return {
        "id": gate_id,
        "label": label,
        "status": status,
        "reason": reason,
        "artifactPath": artifact_path,
        "evidenceMode": resolved_mode,
        "highRisk": high_risk,
    }


def _resolve_artifact(root: Path, bundle_dir: Path, candidates: list[str]) -> tuple[Path | None, str | None]:
    path, _scope = first_existing(root, bundle_dir, candidates)

    if path is None:
        return None, None

    return path, path.relative_to(bundle_dir).as_posix() if path.is_relative_to(bundle_dir) else path.name


def build_signoff_bundle(root: Path, bundle_dir: Path) -> dict[str, Any]:
    gates: list[dict[str, Any]] = []

    release_smoke_path, release_smoke_rel = _resolve_artifact(
        root,
        bundle_dir,
        [
            "release-smoke-result.json",
            "release-smoke/result.json",
            "artifacts/release-smoke/result.json",
            "result.json",
        ],
    )
    release_smoke_payload = load_json(release_smoke_path) if release_smoke_path else None
    gates.append(
        _gate_from_payload(
            gate_id="release-smoke",
            label="Release smoke (API/CLI/artifacts)",
            artifact_path=release_smoke_rel,
            payload=release_smoke_payload,
            status_keys=("verdict", "status", "disposition"),
            high_risk=True,
            skipped_reason="Release smoke result JSON not attached (run release-smoke.ps1 -ResultOut)",
        )
    )

    live_ui_path, live_ui_rel = _resolve_artifact(
        root,
        bundle_dir,
        [
            "release-smoke-live-ui-sql-result.json",
            "artifacts/release/release-smoke-live-ui-sql-result.json",
        ],
    )
    live_ui_payload = load_json(live_ui_path) if live_ui_path else None
    gates.append(
        _gate_from_payload(
            gate_id="live-ui-api-parity",
            label="Live UI/API/SQL parity",
            artifact_path=live_ui_rel,
            payload=live_ui_payload,
            status_keys=("status", "verdict", "disposition"),
            high_risk=True,
            skipped_reason="Live UI-SQL parity artifact not attached (release-smoke-live-ui-sql.ps1)",
        )
    )

    config_lint_path, config_lint_rel = _resolve_artifact(
        root,
        bundle_dir,
        ["config-lint-production-like-hosted-pilot.json"],
    )
    config_lint_payload = load_json(config_lint_path) if config_lint_path else None
    gates.append(
        _gate_from_payload(
            gate_id="config-lint",
            label="Production-like config lint",
            artifact_path=config_lint_rel,
            payload=config_lint_payload,
            status_keys=("disposition", "rollup", "status"),
            high_risk=True,
            skipped_reason="Config lint JSON not attached",
        )
    )

    openapi_path, openapi_rel = _resolve_artifact(
        root,
        bundle_dir,
        [
            "openapi-contract-snapshot-status.json",
            "artifacts/ci/openapi-contract-snapshot-status.json",
            "doc-link-check-status.json",
            "artifacts/ci/doc-link-check-status.json",
        ],
    )
    openapi_payload = load_json(openapi_path) if openapi_path else None
    gates.append(
        _gate_from_payload(
            gate_id="openapi-contract",
            label="OpenAPI contract snapshot / doc integrity",
            artifact_path=openapi_rel,
            payload=openapi_payload,
            status_keys=("status", "disposition", "rollup"),
            high_risk=True,
            skipped_reason="OpenAPI or doc-link CI status artifact not attached",
        )
    )

    data_consistency_path, data_consistency_rel = _resolve_artifact(
        root,
        bundle_dir,
        [
            "data-consistency-readiness.json",
            "data-consistency-readiness/data-consistency-summary.json",
        ],
    )
    data_consistency_payload = load_json(data_consistency_path) if data_consistency_path else None
    gates.append(
        _gate_from_payload(
            gate_id="data-consistency",
            label="Data consistency readiness",
            artifact_path=data_consistency_rel,
            payload=data_consistency_payload,
            status_keys=("disposition", "rollup", "status"),
            high_risk=False,
            skipped_reason="Data consistency readiness summary not attached",
        )
    )

    sim_div_path, sim_div_rel = _resolve_artifact(
        root,
        bundle_dir,
        [
            "simulator-live-divergence.json",
            "artifacts/release/simulator-live-divergence.json",
        ],
    )
    sim_div_payload = load_json(sim_div_path) if sim_div_path else None
    sim_div_gate = _gate_from_payload(
        gate_id="simulator-live-divergence",
        label="Simulator/live divergence (buyer-facing full-real boundary)",
        artifact_path=sim_div_rel,
        payload=sim_div_payload,
        status_keys=("classification", "disposition", "status"),
        reason_keys=("blockingReasons", "detail", "summary"),
        high_risk=True,
        skipped_reason="simulator-live-divergence.json not attached",
    )

    if sim_div_payload is not None and sim_div_payload.get("buyerFacingFullRealBlocked") is True:
        sim_div_gate["status"] = "HOLD"
        reasons = sim_div_payload.get("blockingReasons")

        if isinstance(reasons, list) and reasons:
            sim_div_gate["reason"] = "; ".join(str(r) for r in reasons[:3])

    gates.append(sim_div_gate)

    arch_inv_path, arch_inv_rel = _resolve_artifact(
        root,
        bundle_dir,
        ["architecture-invariant-rc-summary.json"],
    )
    arch_inv_payload = load_json(arch_inv_path) if arch_inv_path else None
    gates.append(
        _gate_from_payload(
            gate_id="architecture-invariant-rc",
            label="P0/P1 architecture invariant RC summary",
            artifact_path=arch_inv_rel,
            payload=arch_inv_payload,
            status_keys=("disposition", "status"),
            reason_keys=("interpretation", "detail", "summary"),
            high_risk=True,
            skipped_reason="architecture-invariant-rc-summary.json not attached",
        )
    )

    saq_path, saq_rel = _resolve_artifact(
        root,
        bundle_dir,
        ["saq-release-gate.json"],
    )
    saq_payload = load_json(saq_path) if saq_path else None
    gates.append(
        _gate_from_payload(
            gate_id="saq-release-gate",
            label="Open P0/P1 strong-model architecture questions",
            artifact_path=saq_rel,
            payload=saq_payload,
            status_keys=("disposition", "status"),
            reason_keys=("policy", "detail", "summary"),
            high_risk=True,
            skipped_reason="SAQ release gate artifact not attached",
        )
    )

    ai_summary_path, ai_summary_rel = _resolve_artifact(
        root,
        bundle_dir,
        ["ai-quality-release-summary.json"],
    )
    ai_summary_payload = load_json(ai_summary_path) if ai_summary_path else None
    real_mode_row = evaluate_real_mode_ai_evidence(bundle_dir)
    ai_status = _normalize_status(real_mode_row.get("status"))
    ai_mode = "real" if str(real_mode_row.get("executionMode") or "").lower() == "real" else (
        "simulator" if real_mode_row.get("simulatorOnlyOverridePresent") else "unknown"
    )

    if ai_status == "SKIPPED" and bool(real_mode_row.get("simulatorOnlyOverridePresent")):
        ai_status = "PASS"
        ai_mode = "simulator"

    if ai_status == "SKIPPED" and ai_summary_payload is not None:
        ai_status = _normalize_status(ai_summary_payload.get("disposition") or ai_summary_payload.get("rollup"))
        ai_mode = "offline"

    ai_reason = str(real_mode_row.get("detail") or real_mode_row.get("claimBoundary") or "No AI readiness artifacts")

    if ai_status == "PASS" and bool(real_mode_row.get("simulatorOnlyOverridePresent")):
        ai_reason = "Simulator-only override attached; real-mode claims explicitly bounded."

    gates.append(
        {
            "id": "ai-readiness-evidence",
            "label": "AI readiness evidence (real vs simulator boundary)",
            "status": ai_status,
            "reason": ai_reason,
            "artifactPath": ai_summary_rel or real_mode_row.get("artifact"),
            "evidenceMode": ai_mode,
            "highRisk": True,
            "simulatorOnlyOverridePresent": bool(real_mode_row.get("simulatorOnlyOverridePresent")),
        }
    )

    claim_path, claim_rel = _resolve_artifact(
        root,
        bundle_dir,
        ["real-mode-claim-gate.json"],
    )
    claim_payload = load_json(claim_path) if claim_path else None
    claim_gate = _gate_from_payload(
        gate_id="procurement-claim-boundary",
        label="Procurement / real-mode claim boundary",
        artifact_path=claim_rel,
        payload=claim_payload,
        status_keys=("disposition", "claimDisposition", "status"),
        reason_keys=("claimWordingClass", "detail", "summary"),
        high_risk=True,
        skipped_reason="real-mode-claim-gate.json not attached",
    )

    claim_consistency_path, claim_consistency_rel = _resolve_artifact(
        root,
        bundle_dir,
        ["claim-evidence-consistency.json"],
    )
    claim_consistency_payload = load_json(claim_consistency_path) if claim_consistency_path else None

    if claim_consistency_payload is not None:
        consistency_status = _normalize_status(
            claim_consistency_payload.get("disposition") or claim_consistency_payload.get("status")
        )

        if consistency_status in _BLOCKING_STATUSES | {"WARN"} and claim_gate["status"] == "PASS":
            claim_gate["status"] = consistency_status

        if claim_consistency_rel:
            claim_gate["artifactPath"] = f"{claim_gate.get('artifactPath') or claim_rel}; {claim_consistency_rel}"

    gates.append(claim_gate)

    perf_path, perf_rel = _resolve_artifact(
        root,
        bundle_dir,
        ["pilot-critical-performance-evidence.json"],
    )
    perf_payload = load_json(perf_path) if perf_path else None

    if perf_payload is not None:
        gates.append(
            _gate_from_payload(
                gate_id="pilot-critical-performance",
                label="Pilot-critical performance smoke",
                artifact_path=perf_rel,
                payload=perf_payload,
                status_keys=("disposition", "overallDisposition", "status"),
                high_risk=False,
                skipped_reason="Pilot-critical performance evidence not attached",
            )
        )

    timing_path, timing_rel = _resolve_artifact(
        root,
        bundle_dir,
        ["first-pilot-timing-budget.json"],
    )
    timing_payload = load_json(timing_path) if timing_path else None
    timing_gate_payload = timing_payload

    if timing_payload is not None and isinstance(timing_payload.get("firstValueCommitBudget"), dict):
        timing_gate_payload = {
            **timing_payload,
            "disposition": timing_payload["firstValueCommitBudget"].get("disposition"),
            "detail": timing_payload["firstValueCommitBudget"].get("detail"),
        }

    gates.append(
        _gate_from_payload(
            gate_id="first-value-timing",
            label="First-value timing budget (create→commit→artifact)",
            artifact_path=timing_rel,
            payload=timing_gate_payload,
            status_keys=("disposition", "status"),
            reason_keys=("detail", "summary"),
            high_risk=True,
            skipped_reason="first-pilot-timing-budget.json not attached — run Invoke-FirstPilotPerformanceBudgetSmoke.ps1",
        )
    )

    pilot_readiness_path, pilot_readiness_rel = _resolve_artifact(
        root,
        bundle_dir,
        ["pilot-readiness-live-release-gate.json"],
    )
    pilot_readiness_payload = load_json(pilot_readiness_path) if pilot_readiness_path else None
    gates.append(
        _gate_from_payload(
            gate_id="pilot-readiness-live-bundle",
            label="Pilot readiness live bundle (--run-id release train)",
            artifact_path=pilot_readiness_rel,
            payload=pilot_readiness_payload,
            status_keys=("disposition", "overallVerdict", "status"),
            reason_keys=("detail", "summary"),
            evidence_mode="live",
            high_risk=True,
            skipped_reason=(
                "pilot-readiness-live-release-gate.json not attached — run "
                "run_pilot_readiness_live_release_gate.py with --run-id after first-review smoke"
            ),
        )
    )

    citation_path, citation_rel = _resolve_artifact(
        root,
        bundle_dir,
        [
            "retrieval-quality-rollup.json",
            "artifacts/release/retrieval-quality-rollup.json",
        ],
    )
    citation_payload = load_json(citation_path) if citation_path else None
    gates.append(
        _gate_from_payload(
            gate_id="rag-citation-coverage",
            label="RAG output citation coverage (offline faithfulness rollup)",
            artifact_path=citation_rel,
            payload=citation_payload,
            status_keys=("disposition", "status", "rollup"),
            reason_keys=("interpretation", "detail", "summary"),
            high_risk=False,
            skipped_reason=(
                "Retrieval quality rollup not attached "
                "(scripts/ci/report_retrieval_quality_rollup.py via collect-first-pilot-proof.ps1)"
            ),
        )
    )

    readiness = load_json(bundle_dir / "release-readiness-index.json") or {}
    high_risk_gates = [gate for gate in gates if gate.get("highRisk")]
    skipped_high_risk = [gate for gate in high_risk_gates if gate["status"] == "SKIPPED"]
    hold_gates = [gate for gate in gates if gate["status"] == "HOLD"]
    warn_gates = [gate for gate in gates if gate["status"] == "WARN"]

    if hold_gates or any(gate["status"] == "SKIPPED" for gate in skipped_high_risk):
        overall = "HOLD"
    elif warn_gates:
        overall = "WARN"
    elif all(gate["status"] in {"PASS", "SKIPPED"} for gate in gates):
        overall = "PASS"
    else:
        overall = "WARN"

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "overallDisposition": overall,
        "gitCommitSha": readiness.get("gitCommitSha"),
        "environment": readiness.get("environment"),
        "evidenceModeSummary": {
            "realModeAiAttached": ai_mode == "real",
            "simulatorOnlyOverridePresent": bool(real_mode_row.get("simulatorOnlyOverridePresent")),
            "simulatorEvidenceOnly": ai_mode in {"simulator", "unknown"} and not real_mode_row.get("simulatorOnlyOverridePresent"),
        },
        "skippedHighRiskGates": [gate["id"] for gate in skipped_high_risk],
        "gates": gates,
        "references": {
            "releaseReadinessIndex": "release-readiness-index.json",
            "rcGoNoGoVerdict": "rc-go-no-go-verdict.json",
            "releaseConfidenceRollup": "release-confidence-rollup.json",
        },
    }


def render_markdown(payload: dict[str, Any]) -> str:
    mode_summary = payload.get("evidenceModeSummary") or {}
    lines = [
        "# RC evidence signoff bundle",
        "",
        f"Generated UTC: **{payload['generatedUtc']}**",
        "",
        f"**Overall disposition:** **{payload['overallDisposition']}**",
        "",
        "## AI evidence mode",
        "",
        f"- Real-mode AI evidence attached: **{mode_summary.get('realModeAiAttached')}**",
        f"- Simulator-only override present: **{mode_summary.get('simulatorOnlyOverridePresent')}**",
        f"- Simulator/offline evidence only (no real-mode claim): **{mode_summary.get('simulatorEvidenceOnly')}**",
        "",
        "| Gate | Status | Evidence mode | Artifact | Reason |",
        "| --- | --- | --- | --- | --- |",
    ]

    for gate in payload.get("gates") or []:
        artifact = gate.get("artifactPath") or "(none)"
        reason = str(gate.get("reason") or "").replace("|", "/")[:160]
        lines.append(
            f"| {gate.get('label')} | **{gate.get('status')}** | {gate.get('evidenceMode')} | `{artifact}` | {reason} |"
        )

    skipped = payload.get("skippedHighRiskGates") or []

    if skipped:
        lines.extend(["", "## Skipped high-risk gates", ""])

        for gate_id in skipped:
            lines.append(f"- `{gate_id}` — attach artifact before buyer-facing RC signoff")

        lines.append("")

    return "\n".join(lines)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument("--bundle-dir", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument(
        "--strict-rc",
        action="store_true",
        help="Exit non-zero when overall disposition is HOLD.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    payload = build_signoff_bundle(args.repo_root.resolve(), args.bundle_dir.resolve())

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    print(f"RC evidence signoff bundle: {payload['overallDisposition']}")

    if args.strict_rc and payload["overallDisposition"] == "HOLD":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
