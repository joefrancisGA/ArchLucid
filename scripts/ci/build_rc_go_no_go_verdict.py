#!/usr/bin/env python3
"""Build unified rc-go-no-go-verdict.json/.md from release readiness artifacts."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from release_evidence_common import evaluate_strict_rc, load_json, repo_root  # noqa: E402

_SCHEMA = "archlucid.rc-go-no-go-verdict.v1"


def _rollup_verdict(rollup: str | None, strict_disposition: str, claim_disposition: str) -> str:
    if strict_disposition == "HOLD" or claim_disposition == "HOLD":
        return "HOLD"

    if rollup == "FAIL" or strict_disposition != "PASS":
        return "HOLD"

    if rollup in {"WARN", "PARTIAL"} or claim_disposition == "WARN":
        return "WARN"

    return "PASS"


def build_verdict(root: Path, bundle_dir: Path) -> dict[str, Any]:
    readiness = load_json(bundle_dir / "release-readiness-index.json") or {}
    confidence = load_json(bundle_dir / "release-confidence-rollup.json") or {}
    claim_gate = load_json(bundle_dir / "real-mode-claim-gate.json") or {}
    canary_gate = load_json(bundle_dir / "real-model-canary-gate.json") or {}
    deploy_handoff = load_json(bundle_dir / "deploy-handoff.json") or {}
    azure_parity = load_json(bundle_dir / "azure-iac-parity-proof.json") or {}
    managed_identity = load_json(bundle_dir / "managed-identity-verification.json") or {}
    saq_gate = load_json(bundle_dir / "saq-release-gate.json") or {}

    lanes = confidence.get("lanes") if isinstance(confidence.get("lanes"), list) else []
    strict_disposition = str(confidence.get("strictDisposition") or evaluate_strict_rc(lanes)[0])
    strict_reasons = confidence.get("strictBlockingReasons")

    if not isinstance(strict_reasons, list):
        _, strict_reasons = evaluate_strict_rc(lanes)

    claim_disposition = str(
        claim_gate.get("disposition")
        or claim_gate.get("claimDisposition")
        or readiness.get("claimGateDisposition")
        or "UNKNOWN"
    ).upper()
    readiness_rollup = str(readiness.get("rollup") or "UNKNOWN").upper()
    confidence_disposition = str(confidence.get("disposition") or "NOT_COLLECTED").upper()

    blockers: list[str] = []

    for reason in strict_reasons:
        if isinstance(reason, str) and reason.strip():
            blockers.append(reason)

    if claim_disposition == "HOLD":
        blockers.append(f"Real-mode claim gate: {claim_disposition}")

    for reason in claim_gate.get("blockingReasons") or []:
        if isinstance(reason, str) and reason.strip():
            blockers.append(reason)

    canary_disposition = str(canary_gate.get("disposition") or "").upper()

    if canary_disposition in {"FAIL", "WAIVER_REQUIRED_FAIL"}:
        blockers.append(f"Real-model canary gate: {canary_disposition}")

    for reason in canary_gate.get("blockingReasons") or []:
        if isinstance(reason, str) and reason.strip():
            blockers.append(reason)

    if readiness_rollup == "FAIL":
        blockers.append(f"Release readiness index rollup: {readiness_rollup}")

    if str(azure_parity.get("disposition") or "").upper() == "HOLD":
        blockers.append("Azure IaC parity proof: HOLD")

    if str(managed_identity.get("disposition") or "").upper() == "HOLD":
        blockers.append("Managed identity verification: HOLD")

    if str(saq_gate.get("disposition") or "").upper() == "HOLD":
        blockers.append("SAQ release gate: HOLD")

    for reason in saq_gate.get("blockingReasons") or []:
        if isinstance(reason, str) and reason.strip():
            blockers.append(reason)

    deploy_status = str(deploy_handoff.get("deployReadinessStatus") or "").upper()

    if deploy_status == "HOLD":
        blockers.append("Deploy handoff: HOLD")

    verdict = _rollup_verdict(readiness_rollup, strict_disposition, claim_disposition)

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "verdict": verdict,
        "releaseReadinessRollup": readiness_rollup,
        "confidenceDisposition": confidence_disposition,
        "strictDisposition": strict_disposition,
        "claimGateDisposition": claim_disposition,
        "claimWordingClass": claim_gate.get("claimWordingClass"),
        "deployReadinessStatus": deploy_handoff.get("deployReadinessStatus"),
        "azureIacParityDisposition": azure_parity.get("disposition"),
        "managedIdentityDisposition": managed_identity.get("disposition"),
        "saqReleaseGateDisposition": saq_gate.get("disposition"),
        "blockers": blockers,
        "remediation": [
            "Attach missing release-blocking lane status JSON from CI.",
            "Refresh real-llm-evidence-gate.json or use simulator-only override with matching claim wording.",
            "Resolve FAIL rows in release-readiness-index.json before buyer-facing RC signoff.",
        ],
        "references": {
            "releaseReadinessIndex": "release-readiness-index.json",
            "releaseConfidenceRollup": "release-confidence-rollup.json",
            "realModeClaimGate": "real-mode-claim-gate.json",
            "deployHandoff": "deploy-handoff.json",
            "saqReleaseGate": "saq-release-gate.json",
        },
    }


def render_markdown(payload: dict[str, Any]) -> str:
    lines = [
        "# RC go/no-go verdict",
        "",
        f"Generated UTC: **{payload['generatedUtc']}**",
        "",
        f"**Verdict:** **{payload['verdict']}**",
        "",
        "| Signal | Value |",
        "| --- | --- |",
        f"| Release readiness rollup | {payload.get('releaseReadinessRollup')} |",
        f"| Confidence disposition | {payload.get('confidenceDisposition')} |",
        f"| Strict RC disposition | {payload.get('strictDisposition')} |",
        f"| Claim gate | {payload.get('claimGateDisposition')} |",
        f"| Claim wording class | {payload.get('claimWordingClass') or '(not emitted)'} |",
        f"| Deploy readiness | {payload.get('deployReadinessStatus') or '(not emitted)'} |",
        f"| Azure IaC parity | {payload.get('azureIacParityDisposition') or '(not emitted)'} |",
        f"| Managed identity | {payload.get('managedIdentityDisposition') or '(not emitted)'} |",
        f"| SAQ release gate | {payload.get('saqReleaseGateDisposition') or '(not emitted)'} |",
        "",
    ]

    blockers = payload.get("blockers") or []

    if blockers:
        lines.append("## Blockers")
        lines.append("")

        for blocker in blockers:
            lines.append(f"- {blocker}")

        lines.append("")

    remediation = payload.get("remediation") or []

    if remediation:
        lines.append("## Remediation")
        lines.append("")

        for item in remediation:
            lines.append(f"- {item}")

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
        help="Exit non-zero when verdict is HOLD.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    payload = build_verdict(args.repo_root.resolve(), args.bundle_dir.resolve())

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    print(f"RC go/no-go verdict: {payload['verdict']}")

    if args.strict_rc and payload["verdict"] == "HOLD":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
