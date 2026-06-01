#!/usr/bin/env python3
"""Evaluate first-pilot proof against PILOT_ACCEPTANCE_THRESHOLDS gates (TB-158)."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]
_MATRIX = _REPO / "scripts" / "ci" / "data" / "pilot_acceptance_thresholds.v1.json"
_COMMITTED_RUN = re.compile(
    r"(runId|run\s*id|committed\s*(at|utc|timestamp))",
    re.IGNORECASE,
)


def load_json(path: Path) -> dict[str, object]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"{path} must be a JSON object")

    return payload


def load_matrix() -> dict[str, object]:
    return load_json(_MATRIX)


def first_value_has_committed_run(path: Path | None) -> bool:
    if path is None or not path.is_file():
        return False

    text = path.read_text(encoding="utf-8", errors="replace")

    if not text.strip():
        return False

    return bool(_COMMITTED_RUN.search(text))


def resolve_quote_disposition(
    summary: dict[str, object],
    quote_readiness: dict[str, object] | None,
) -> str:
    if quote_readiness is not None:
        return str(quote_readiness.get("proofDisposition") or "HOLD")

    blocks = int(summary.get("blockCount") or 0)
    sponsor = str(summary.get("sponsorPacketDisposition") or "HOLD")
    roi_safe = summary.get("roiSponsorSafe") is True

    if blocks > 0:
        return "HOLD"

    if sponsor == "DEFERRED_SCOPE":
        return "DEFERRED_SCOPE"

    if sponsor in {"READY", "WARN"} and roi_safe:
        return "SEND"

    return "HOLD"


def evaluate_gates(
    summary: dict[str, object],
    quote_readiness: dict[str, object] | None,
    first_value_report: Path | None,
    matrix: dict[str, object],
) -> tuple[str, str, list[dict[str, object]]]:
    gates: list[dict[str, object]] = []
    hold_reasons: list[str] = []

    blocks = int(summary.get("blockCount") or 0)
    sponsor = str(summary.get("sponsorPacketDisposition") or "HOLD")
    roi_basis = str(summary.get("roiBasisStatus") or "not-collected")
    roi_safe = summary.get("roiSponsorSafe") is True
    quote_disposition = resolve_quote_disposition(summary, quote_readiness)
    send_dispositions = matrix.get("sendDispositions") or ["SEND", "READY", "WARN"]
    strong_roi = matrix.get("strongRoiBasis") or ["buyer-provided"]
    weak_roi = matrix.get("weakRoiBasis") or []

    gates.append(
        {
            "id": "proof-packet-go-no-go",
            "status": "PASS" if blocks == 0 and quote_disposition in send_dispositions else "HOLD",
            "detail": f"blockCount={blocks}; quoteDisposition={quote_disposition}",
        },
    )

    if blocks > 0:
        hold_reasons.append("blocking proof findings present")

    if quote_disposition == "HOLD":
        hold_reasons.append("quote-to-proof disposition is HOLD")

    first_value_ok = first_value_has_committed_run(first_value_report)
    gates.append(
        {
            "id": "first-value-report",
            "status": "PASS" if first_value_ok else "HOLD",
            "detail": "committed run markers present"
            if first_value_ok
            else "first-value-report missing or lacks committed run markers",
        },
    )

    if not first_value_ok:
        hold_reasons.append("first-value-report not ready")

    if sponsor == "DEFERRED_SCOPE":
        gates.append(
            {
                "id": "deferred-scope",
                "status": "DEFERRED_SCOPE",
                "detail": "buyer requirements outside V1 — not a pilot failure",
            },
        )
        return "DEFERRED_SCOPE", "Sufficient", gates

    roi_gate = "PASS"

    if not roi_safe:
        roi_gate = "HOLD"
        hold_reasons.append("ROI figures are not sponsor-safe")

    if roi_basis in weak_roi and roi_gate != "HOLD":
        roi_gate = "WARN"

    gates.append(
        {
            "id": "roi-confidence",
            "status": roi_gate,
            "detail": f"roiBasisStatus={roi_basis}; roiSponsorSafe={roi_safe}",
        },
    )

    if roi_basis in strong_roi and roi_safe and blocks == 0 and quote_disposition in send_dispositions:
        quality = "Strong"
    elif blocks == 0 and quote_disposition in send_dispositions and first_value_ok:
        quality = "Sufficient"
    elif blocks > 0 or quote_disposition == "HOLD" or not first_value_ok:
        quality = "Missing"
    else:
        quality = "Weak"

    if hold_reasons:
        return "HOLD", quality, gates

    if roi_gate == "HOLD":
        return "HOLD", quality, gates

    return "PASS", quality, gates


def build_payload(
    summary: dict[str, object],
    quote_readiness: dict[str, object] | None,
    first_value_report: Path | None,
) -> dict[str, object]:
    matrix = load_matrix()
    outcome, quality, gates = evaluate_gates(summary, quote_readiness, first_value_report, matrix)

    return {
        "schema": "archlucid.pilot-acceptance-thresholds-report.v1",
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "canonicalDoc": matrix.get("canonicalDoc"),
        "pilotOutcome": outcome,
        "proofQualityLevel": quality,
        "runId": summary.get("runId"),
        "sponsorPacketDisposition": summary.get("sponsorPacketDisposition"),
        "roiBasisStatus": summary.get("roiBasisStatus"),
        "roiSponsorSafe": summary.get("roiSponsorSafe"),
        "blockCount": summary.get("blockCount"),
        "quoteToProofDisposition": resolve_quote_disposition(summary, quote_readiness),
        "gates": gates,
        "ownerReviewRequired": True,
        "ownerReviewNote": (
            "Thresholds are model-assisted defaults per PILOT_ACCEPTANCE_THRESHOLDS.md; "
            "owner must confirm before customer-facing commercial commitments."
        ),
    }


def render_markdown(payload: dict[str, object]) -> str:
    outcome = str(payload.get("pilotOutcome", "HOLD"))
    quality = str(payload.get("proofQualityLevel", "Missing"))

    lines = [
        "# Pilot acceptance thresholds (generated)",
        "",
        f"**Outcome:** **{outcome}**",
        f"**Proof quality:** **{quality}**",
        "",
        "> Owner review required before quoting thresholds in a customer-facing commitment.",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Run id | {payload.get('runId') or 'not supplied'} |",
        f"| Sponsor packet | {payload.get('sponsorPacketDisposition')} |",
        f"| Quote-to-proof | {payload.get('quoteToProofDisposition')} |",
        f"| ROI basis | {payload.get('roiBasisStatus')} |",
        f"| ROI sponsor-safe | {payload.get('roiSponsorSafe')} |",
        f"| Blocking findings | {payload.get('blockCount')} |",
        "",
        "## Gates",
        "",
        "| Gate | Status | Detail |",
        "| --- | --- | --- |",
    ]

    for gate in payload.get("gates") or []:
        if not isinstance(gate, dict):
            continue

        lines.append(
            f"| {gate.get('id')} | {gate.get('status')} | {gate.get('detail')} |",
        )

    lines.extend(
        [
            "",
            "Canonical thresholds: "
            "[`PILOT_ACCEPTANCE_THRESHOLDS.md`](../../docs/go-to-market/PILOT_ACCEPTANCE_THRESHOLDS.md)",
            "",
        ],
    )

    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--go-no-go-summary", type=Path, required=True)
    parser.add_argument("--quote-to-proof-readiness", type=Path, default=None)
    parser.add_argument("--first-value-report", type=Path, default=None)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    args = parser.parse_args(argv)

    summary = load_json(args.go_no_go_summary)
    quote = load_json(args.quote_to_proof_readiness) if args.quote_to_proof_readiness else None
    payload = build_payload(summary, quote, args.first_value_report)

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    print(f"OK: pilot acceptance {payload['pilotOutcome']} ({payload['proofQualityLevel']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
