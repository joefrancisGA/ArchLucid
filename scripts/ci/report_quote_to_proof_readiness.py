#!/usr/bin/env python3
"""Generate quote-to-proof readiness checklist JSON/Markdown from proof summary (TB-129)."""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from release_evidence_common import load_json  # noqa: E402
from roi_baseline_send_policy import evaluate_send_eligibility, map_roi_basis_to_completeness  # noqa: E402

_SEND_BLOCKING_COMPLETENESS = frozenset({"PARTIAL", "DEFAULTED", "NOT_COLLECTED"})


def resolve_proof_disposition(
    summary: dict[str, object],
    closeout: dict[str, object] | None,
    *,
    baseline_completeness: str,
) -> str:
    blocks = int(summary.get("blockCount") or 0)
    sponsor = str(summary.get("sponsorPacketDisposition") or "HOLD")
    roi_safe = summary.get("roiSponsorSafe") is True
    roi_basis = str(summary.get("roiBasisStatus") or "not-collected")

    if blocks > 0:
        return "HOLD"

    if sponsor == "DEFERRED_SCOPE":
        return "DEFERRED_SCOPE"

    if baseline_completeness in _SEND_BLOCKING_COMPLETENESS:
        return "HOLD"

    if sponsor in {"READY", "WARN"} and roi_safe:
        return "SEND"

    if roi_basis in {"demo-derived", "not-collected", "hold_missing_sources", "defaulted", "missing"}:
        return "HOLD"

    commercial = str((closeout or {}).get("commercialDisposition") or "")

    if commercial == "DEFERRED_SCOPE":
        return "DEFERRED_SCOPE"

    if commercial == "PASS":
        return "SEND"

    return "HOLD"


def build_payload(
    summary: dict[str, object],
    closeout: dict[str, object] | None,
    *,
    evaluation: dict[str, object],
) -> dict[str, object]:
    roi_basis = str(summary.get("roiBasisStatus") or "not-collected")
    baseline_completeness = str(evaluation.get("baselineCompletenessStatus") or map_roi_basis_to_completeness(roi_basis))
    disposition = resolve_proof_disposition(
        summary,
        closeout,
        baseline_completeness=baseline_completeness,
    )
    deferred = summary.get("deferredScopeReasons") or []
    override_applied = evaluation.get("overrideApplied") is True

    if override_applied and disposition == "HOLD" and int(summary.get("blockCount") or 0) == 0:
        sponsor = str(summary.get("sponsorPacketDisposition") or "HOLD")

        if sponsor not in {"HOLD", "DEFERRED_SCOPE", "READINESS_ONLY"}:
            disposition = "SEND"

    return {
        "schema": "archlucid.quote-to-proof-readiness.v1",
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "proofDisposition": disposition,
        "baselineCompletenessStatus": baseline_completeness,
        "sendEligible": evaluation.get("sendEligible"),
        "sendBlockReasons": evaluation.get("sendBlockReasons"),
        "missingRequiredBaselineFields": evaluation.get("missingRequiredBaselineFields"),
        "overrideApplied": override_applied,
        "sponsorPacketDisposition": summary.get("sponsorPacketDisposition"),
        "verdict": summary.get("verdict"),
        "blockCount": summary.get("blockCount"),
        "warnCount": summary.get("warnCount"),
        "roiBasisStatus": roi_basis,
        "roiSponsorSafe": summary.get("roiSponsorSafe"),
        "dataConsistencyStatus": summary.get("dataConsistencyStatus"),
        "runId": summary.get("runId"),
        "recommendedNextAction": (closeout or {}).get("recommendedNextAction"),
        "commercialDisposition": (closeout or {}).get("commercialDisposition"),
        "followUpSlaDays": 7,
        "deferredScopeReasons": deferred,
        "checklistDoc": "docs/go-to-market/QUOTE_TO_PROOF_PACKET.md",
        "baselineSendPolicyDoc": "docs/go-to-market/QUOTE_TO_PROOF_PACKET.md#roi-baseline-send-policy",
    }


def render_markdown(payload: dict[str, object]) -> str:
    disposition = str(payload.get("proofDisposition", "HOLD"))

    lines = [
        "# Quote-to-proof readiness (generated)",
        "",
        f"**Disposition:** **{disposition}** (SEND = safe to schedule sponsor review; HOLD = resolve proof first; DEFERRED_SCOPE = buyer ask outside V1)",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Run id | {payload.get('runId') or 'not supplied'} |",
        f"| Sponsor packet | {payload.get('sponsorPacketDisposition')} |",
        f"| ROI basis | {payload.get('roiBasisStatus')} |",
        f"| Baseline completeness | {payload.get('baselineCompletenessStatus')} |",
        f"| ROI sponsor-safe | {payload.get('roiSponsorSafe')} |",
        f"| Data consistency | {payload.get('dataConsistencyStatus')} |",
        f"| Commercial disposition | {payload.get('commercialDisposition')} |",
        f"| Next action | {payload.get('recommendedNextAction')} |",
        f"| Follow-up SLA | {payload.get('followUpSlaDays')} days |",
        "",
        "Canonical checklist: [`QUOTE_TO_PROOF_PACKET.md`](../../docs/go-to-market/QUOTE_TO_PROOF_PACKET.md#readiness-checklist)",
        "",
    ]

    deferred = payload.get("deferredScopeReasons") or []

    if deferred:
        lines.append("## Deferred buyer requirements")
        lines.append("")

        for item in deferred:
            lines.append(f"- {item}")

        lines.append("")

    return "\n".join(lines)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--go-no-go-summary", type=Path, required=True)
    parser.add_argument("--commercial-closeout", type=Path, default=None)
    parser.add_argument("--override-json", type=Path, default=None)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument(
        "--strict-send",
        action="store_true",
        help="Exit non-zero when SEND would be issued with incomplete ROI baseline unless override present.",
    )
    return parser.parse_args(argv)


def resolve_strict_send(args: argparse.Namespace) -> bool:
    if args.strict_send:
        return True

    return os.environ.get("ARCHLUCID_STRICT_SEND", "").strip() in {"1", "true", "TRUE", "yes", "YES"}


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    summary = load_json(args.go_no_go_summary)

    if summary is None:
        raise SystemExit(f"Could not read summary: {args.go_no_go_summary}")

    closeout = (
        load_json(args.commercial_closeout)
        if args.commercial_closeout and args.commercial_closeout.is_file()
        else None
    )
    override = (
        load_json(args.override_json)
        if args.override_json and args.override_json.is_file()
        else None
    )
    evaluation = evaluate_send_eligibility(summary, override)
    payload = build_payload(summary, closeout, evaluation=evaluation)

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    print(f"OK: quote-to-proof readiness {payload['proofDisposition']}")

    strict_send = resolve_strict_send(args)

    if strict_send and payload["proofDisposition"] == "SEND":
        if not evaluation.get("sendEligible"):
            print("Strict SEND blocked: sendEligible=false", file=sys.stderr)
            return 1

    if strict_send and payload["proofDisposition"] == "HOLD":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
