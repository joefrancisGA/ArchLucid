#!/usr/bin/env python3
"""Generate quote-to-proof readiness checklist JSON/Markdown from proof summary (TB-129)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def load_json(path: Path) -> dict[str, object]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"{path} must be a JSON object")

    return payload


def resolve_proof_disposition(summary: dict[str, object], closeout: dict[str, object] | None) -> str:
    blocks = int(summary.get("blockCount") or 0)
    sponsor = str(summary.get("sponsorPacketDisposition") or "HOLD")
    roi_safe = summary.get("roiSponsorSafe") is True
    roi_basis = str(summary.get("roiBasisStatus") or "not-collected")

    if blocks > 0:
        return "HOLD"

    if sponsor == "DEFERRED_SCOPE":
        return "DEFERRED_SCOPE"

    if sponsor in {"READY", "WARN"} and roi_safe:
        return "SEND"

    if roi_basis in {"demo-derived", "not-collected", "hold_missing_sources"}:
        return "HOLD"

    commercial = str((closeout or {}).get("commercialDisposition") or "")

    if commercial == "DEFERRED_SCOPE":
        return "DEFERRED_SCOPE"

    if commercial == "PASS":
        return "SEND"

    return "HOLD"


def build_payload(summary: dict[str, object], closeout: dict[str, object] | None) -> dict[str, object]:
    disposition = resolve_proof_disposition(summary, closeout)
    deferred = summary.get("deferredScopeReasons") or []

    return {
        "schema": "archlucid.quote-to-proof-readiness.v1",
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "proofDisposition": disposition,
        "sponsorPacketDisposition": summary.get("sponsorPacketDisposition"),
        "verdict": summary.get("verdict"),
        "blockCount": summary.get("blockCount"),
        "warnCount": summary.get("warnCount"),
        "roiBasisStatus": summary.get("roiBasisStatus"),
        "roiSponsorSafe": summary.get("roiSponsorSafe"),
        "dataConsistencyStatus": summary.get("dataConsistencyStatus"),
        "runId": summary.get("runId"),
        "recommendedNextAction": (closeout or {}).get("recommendedNextAction"),
        "commercialDisposition": (closeout or {}).get("commercialDisposition"),
        "followUpSlaDays": 7,
        "deferredScopeReasons": deferred,
        "checklistDoc": "docs/go-to-market/QUOTE_TO_PROOF_READINESS_CHECKLIST.md",
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
        f"| ROI sponsor-safe | {payload.get('roiSponsorSafe')} |",
        f"| Data consistency | {payload.get('dataConsistencyStatus')} |",
        f"| Commercial disposition | {payload.get('commercialDisposition')} |",
        f"| Next action | {payload.get('recommendedNextAction')} |",
        f"| Follow-up SLA | {payload.get('followUpSlaDays')} days |",
        "",
        "Canonical checklist: [`QUOTE_TO_PROOF_READINESS_CHECKLIST.md`](../../docs/go-to-market/QUOTE_TO_PROOF_READINESS_CHECKLIST.md)",
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


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--go-no-go-summary", type=Path, required=True)
    parser.add_argument("--commercial-closeout", type=Path, default=None)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    args = parser.parse_args(argv)

    summary = load_json(args.go_no_go_summary)
    closeout = load_json(args.commercial_closeout) if args.commercial_closeout and args.commercial_closeout.is_file() else None
    payload = build_payload(summary, closeout)

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    print(f"OK: quote-to-proof readiness {payload['proofDisposition']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
