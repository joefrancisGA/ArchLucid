#!/usr/bin/env python3
"""Emit buyer-safe audit evidence summary for first-pilot proof (TB-125)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = REPO_ROOT / "scripts" / "ci" / "data" / "audit_event_catalog.v1.json"
TRIAGE_DOC = "docs/runbooks/SUPPORT_AUDIT_TRIAGE_ONE_PAGER.md"


def load_deltas(path: Path | None) -> dict[str, object]:
    if path is None or not path.is_file():
        return {}

    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError("deltas JSON must be an object")

    return payload


def catalog_event_types() -> list[str]:
    if not CATALOG_PATH.is_file():
        return []

    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    events = catalog.get("events") or []

    return [str(entry.get("eventType", "")) for entry in events if isinstance(entry, dict) and entry.get("eventType")]


def build_payload(run_id: str, deltas: dict[str, object]) -> dict[str, object]:
    audit_row_count = int(deltas.get("auditRowCount", 0) or 0)
    truncated = deltas.get("auditRowCountTruncated") is True
    sample_ids = catalog_event_types()[:10]
    disposition = "PASS" if audit_row_count > 0 or truncated else "WARN"

    return {
        "schema": "archlucid.proof-packet.audit-evidence-summary.v1",
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "runId": run_id or "not-supplied",
        "disposition": disposition,
        "auditRowCount": audit_row_count,
        "auditRowCountTruncated": truncated,
        "sampleAuditEventIdCount": len(sample_ids),
        "sampleAuditEventIds": sample_ids,
        "omittedFields": [
            "raw audit payloads",
            "prompt text",
            "API keys",
            "customer secrets",
        ],
        "deeperLogsGuidance": "Follow SUPPORT_AUDIT_TRIAGE_ONE_PAGER.md for correlation-id investigation order.",
        "triageDoc": TRIAGE_DOC,
    }


def render_markdown(payload: dict[str, object]) -> str:
    run_id = str(payload.get("runId", "not-supplied"))
    disposition = str(payload.get("disposition", "WARN"))
    audit_rows = payload.get("auditRowCount", 0)
    truncated = payload.get("auditRowCountTruncated", False)
    sample_ids = payload.get("sampleAuditEventIds") or []

    lines = [
        "# Audit evidence summary",
        "",
        f"**Run id:** `{run_id}`",
        f"**Disposition:** **{disposition}**",
        "",
        f"**Audit rows linked to run:** {audit_rows}{' (count capped — lower bound only)' if truncated else ''}",
        f"**Sample catalog event types:** {len(sample_ids)}",
        "",
        "## Omitted from this export",
        "",
    ]

    for field in payload.get("omittedFields") or []:
        lines.append(f"- {field}")

    lines.extend(
        [
            "",
            "## Investigation order",
            "",
            str(payload.get("deeperLogsGuidance", "")),
            f"Runbook: `{payload.get('triageDoc', TRIAGE_DOC)}`",
            "",
        ],
    )

    if sample_ids:
        lines.append("## Sample audit event types (catalog)")
        lines.append("")

        for event_id in sample_ids:
            lines.append(f"- `{event_id}`")

        lines.append("")

    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run-id", default="")
    parser.add_argument("--deltas-json", type=Path, default=None)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    args = parser.parse_args(argv)

    payload = build_payload(args.run_id.strip(), load_deltas(args.deltas_json))
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    disposition = str(payload["disposition"])
    print(f"OK: audit evidence summary {disposition}")
    return 0 if disposition == "PASS" else 0


if __name__ == "__main__":
    raise SystemExit(main())
