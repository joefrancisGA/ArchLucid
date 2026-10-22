#!/usr/bin/env python3
"""Build weekly proof-cadence checklist JSON from release and pilot readiness artifacts."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from release_evidence_common import load_json, parse_datetime  # noqa: E402
from validate_weekly_proof_cadence import validate_payload  # noqa: E402

_PAYLOAD_SCHEMA = "archlucid.weekly-proof-cadence.v1"
_GATE_DOC = Path(__file__).resolve().parents[2] / "docs" / "go-to-market" / "CLAIM_READINESS_STATUS.md"


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_claim_readiness_gates(doc_path: Path) -> dict[str, dict[str, str]]:
    if not doc_path.is_file():
        return {}

    text = doc_path.read_text(encoding="utf-8")
    gates: dict[str, dict[str, str]] = {}

    for match in re.finditer(
        r"\|\s*\*\*(G\d)\*\*\s*\|[^|]*\|\s*\*\*(PASS|HOLD|WARN)\*\*",
        text,
        flags=re.IGNORECASE,
    ):
        gate_id = match.group(1).upper()
        status = match.group(2).upper()
        gates[gate_id] = {"status": status, "reason": f"From {doc_path.name} gate table."}

    return gates


def _count_proof_log_real_runs(log_path: Path) -> int:
    if not log_path.is_file():
        return 0

    count = 0

    for line in log_path.read_text(encoding="utf-8").splitlines():
        normalized = line.lower()

        if "|" not in line or "example" in normalized or "_example_" in normalized:
            continue

        if "| real |" in normalized or "| real " in normalized:
            count += 1

    return count


def _gate_row(
    gate_id: str,
    *,
    doc_gates: dict[str, dict[str, str]],
    real_run_count: int,
    real_mode_status: str | None,
    release_bundle_present: bool,
) -> dict[str, str]:
    doc_row = doc_gates.get(gate_id) or {}
    status = str(doc_row.get("status") or "NOT_RUN").upper()
    reason = str(doc_row.get("reason") or "No claim-readiness row found.")
    evidence_ref = "docs/go-to-market/CLAIM_READINESS_STATUS.md"

    if gate_id == "G4":
        if real_run_count >= 3:
            status = "PASS"
            reason = f"{real_run_count} qualifying real runs logged in CLAIM_READINESS_STATUS.md#proof-packet-run-log."
        else:
            status = "HOLD"
            reason = f"{real_run_count} of 3 qualifying real runs logged — append rows after each real pilot commit."

        evidence_ref = "docs/go-to-market/CLAIM_READINESS_STATUS.md#proof-packet-run-log"

    if gate_id == "G5":
        normalized = (real_mode_status or "MISSING").upper()

        if normalized == "PASS":
            status = "PASS"
            reason = "Release bundle reports real-mode AI evidence PASS."
        elif normalized in {"WARN", "PARTIAL"}:
            status = "WARN"
            reason = f"Real-mode AI evidence is partial ({normalized}) — use cautious wording only."
        else:
            status = "HOLD"
            reason = "Real-mode credentialed evidence missing or stale — owner action required."

        evidence_ref = "artifacts/release-readiness/real-llm-evidence-gate.json"

    if gate_id == "G6" and release_bundle_present and status == "NOT_RUN":
        status = "PASS"
        reason = "Release evidence bundle generated this cadence run."

    return {
        "status": status,
        "reason": reason,
        "evidenceRef": evidence_ref,
    }


def _resolve_stage1_readiness(gates: dict[str, dict[str, str]], overall: str) -> str:
    g4 = str((gates.get("G4") or {}).get("status") or "NOT_RUN").upper()
    g5 = str((gates.get("G5") or {}).get("status") or "NOT_RUN").upper()

    if overall == "HOLD" or g4 == "HOLD" or g5 == "HOLD":
        return "NOT_READY"

    if g4 == "PASS" and g5 in {"PASS", "WARN"}:
        return "READY"

    return "NOT_READY"


def build_cadence(
    *,
    cadence_id: str,
    release_bundle_dir: Path,
    pilot_summary_path: Path | None,
    proof_log_path: Path,
    claim_status_path: Path,
) -> dict[str, Any]:
    doc_gates = _parse_claim_readiness_gates(claim_status_path)
    real_run_count = _count_proof_log_real_runs(proof_log_path)

    bundle_manifest = load_json(release_bundle_dir / "release-evidence-bundle-manifest.json")
    real_mode = None

    if isinstance(bundle_manifest, dict):
        lane = bundle_manifest.get("realModeAiEvidence")

        if isinstance(lane, dict):
            real_mode = str(lane.get("status") or "")

    release_generated = None

    if isinstance(bundle_manifest, dict):
        release_generated = parse_datetime(bundle_manifest.get("generatedUtc"))

    pilot_summary = load_json(pilot_summary_path) if pilot_summary_path and pilot_summary_path.is_file() else None
    pilot_generated = None
    run_ids: list[str] = []

    if isinstance(pilot_summary, dict):
        pilot_generated = parse_datetime(pilot_summary.get("generatedUtc"))
        run_id = str(pilot_summary.get("runId") or "").strip()

        if run_id:
            run_ids.append(run_id)

    gates = {
        gate_id: _gate_row(
            gate_id,
            doc_gates=doc_gates,
            real_run_count=real_run_count,
            real_mode_status=real_mode,
            release_bundle_present=bundle_manifest is not None,
        )
        for gate_id in ("G1", "G2", "G3", "G4", "G5", "G6")
    }

    statuses = [str(row["status"]).upper() for row in gates.values()]
    missing_real_mode = gates["G5"]["status"] == "HOLD" or real_run_count == 0

    if any(status == "HOLD" for status in statuses):
        overall = "HOLD"
    elif any(status == "WARN" for status in statuses):
        overall = "PASS_WITH_WARNINGS"
    else:
        overall = "PASS"

    stage1_readiness = _resolve_stage1_readiness(gates, overall)

    now = datetime.now(timezone.utc)

    def _days_old(generated: datetime | None) -> int | None:
        if generated is None:
            return None

        return (now - generated).days

    return {
        "schema": _PAYLOAD_SCHEMA,
        "cadenceId": cadence_id,
        "generatedUtc": _utc_now(),
        "gates": gates,
        "overallDisposition": overall,
        "stage1Readiness": stage1_readiness,
        "runIdsReferenced": run_ids,
        "executionModeSummary": {
            "qualifyingRealRunCount": real_run_count,
            "realModeAiEvidenceStatus": real_mode or "MISSING",
            "pilotSummaryPresent": pilot_summary is not None,
        },
        "evidenceFreshness": {
            "releaseBundleDaysOld": _days_old(release_generated),
            "pilotSummaryDaysOld": _days_old(pilot_generated),
        },
        "missingRealModeEvidence": missing_real_mode,
    }


def render_markdown(payload: dict[str, Any]) -> str:
    lines = [
        "# Weekly proof cadence checklist",
        "",
        f"**Cadence id:** {payload.get('cadenceId')}",
        f"**Generated UTC:** {payload.get('generatedUtc')}",
        f"**Overall disposition:** {payload.get('overallDisposition')}",
        f"**Stage 1 readiness:** {payload.get('stage1Readiness')}",
        f"**Missing real-mode evidence:** {payload.get('missingRealModeEvidence')}",
        "",
        "## Claim gates (G1–G6)",
        "",
        "| Gate | Status | Reason | Evidence |",
        "| --- | --- | --- | --- |",
    ]

    for gate_id, row in (payload.get("gates") or {}).items():
        if not isinstance(row, dict):
            continue

        lines.append(
            f"| **{gate_id}** | {row.get('status')} | {row.get('reason')} | `{row.get('evidenceRef')}` |"
        )

    lines.extend(
        [
            "",
            "## Closing G4 / G5 from HOLD",
            "",
            "- **G4:** Append three **Real** rows to `CLAIM_READINESS_STATUS.md#proof-packet-run-log` using `collect-first-pilot-proof.ps1 -RunId <guid>` after each committed pilot.",
            "- **G5:** Run `Invoke-RealLlmEvidenceGate.ps1` with owner credentials, archive `real-llm-evidence-gate.json`, then re-run this cadence.",
            "",
            "Runbook: `docs/runbooks/WEEKLY_PROOF_CADENCE.md`",
            "",
        ]
    )

    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cadence-id", required=True)
    parser.add_argument("--release-bundle-dir", type=Path, required=True)
    parser.add_argument("--pilot-summary", type=Path, default=None)
    parser.add_argument("--proof-log", type=Path, default=_GATE_DOC)
    parser.add_argument("--claim-status", type=Path, default=_GATE_DOC)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, default=None)
    args = parser.parse_args(argv)

    payload = build_cadence(
        cadence_id=args.cadence_id,
        release_bundle_dir=args.release_bundle_dir,
        pilot_summary_path=args.pilot_summary,
        proof_log_path=args.proof_log,
        claim_status_path=args.claim_status,
    )

    errors = validate_payload(payload)

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    if args.markdown_out is not None:
        args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    print(f"Weekly proof cadence written: {args.json_out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
