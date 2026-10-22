#!/usr/bin/env python3
"""Generate a generic-AI bakeoff comparison summary (assessment improvement #7)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.generic-ai-bakeoff-summary.v1"

_DIMENSIONS: tuple[tuple[str, str, str], ...] = (
    ("timeToSponsorPacket", "Time to sponsor-ready packet", "Wall-clock or labeled illustrative/unknown"),
    ("evidenceTraceability", "Evidence traceability", "Manifest, audit, citations vs ad hoc transcript"),
    ("repeatability", "Repeatability", "Structured re-run vs session-dependent prompting"),
    ("governanceAuditReadiness", "Governance / audit readiness", "Labels, ROI basis, export bundle vs ad hoc"),
    ("findingUsefulness", "Finding usefulness", "Operator judgment from the session — not a model IQ score"),
    ("sponsorPacketQuality", "Sponsor packet quality", "First-value report / exports vs manual assembly"),
)


def _load_json(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"{path.name} root must be an object")

    return payload


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8").strip()


def _timing_label(minutes: int | None, *, source: str) -> dict[str, Any]:
    if minutes is None:
        return {"valueMinutes": None, "basis": "unknown", "label": "unknown — not measured in this session"}

    return {"valueMinutes": minutes, "basis": source, "label": f"{minutes} minutes ({source})"}


def build_summary(
    *,
    archlucid_packet_dir: Path,
    manual_ai_path: Path,
    archlucid_minutes: int | None,
    manual_minutes: int | None,
    session_notes: str,
) -> dict[str, Any]:
    packet_meta = _load_json(archlucid_packet_dir / "packet-metadata.json") if (archlucid_packet_dir / "packet-metadata.json").is_file() else {}
    manual_text = _read_text(manual_ai_path)

    dimensions: list[dict[str, Any]] = []

    for key, title, notes in _DIMENSIONS:
        if key == "timeToSponsorPacket":
            arch = _timing_label(archlucid_minutes, source="measured" if archlucid_minutes is not None else "unknown")
            manual = _timing_label(manual_minutes, source="measured" if manual_minutes is not None else "unknown")
        elif key in {"evidenceTraceability", "repeatability", "governanceAuditReadiness", "sponsorPacketQuality"}:
            arch = {"advantage": "archlucid", "notes": notes}
            manual = {"advantage": "manual-ai", "notes": "Ad hoc unless operator manually assembles proof"}
        elif key == "findingUsefulness":
            arch = {"advantage": "session-judgment", "notes": "Record per finding in session notes — do not claim model superiority"}
            manual = {"advantage": "session-judgment", "notes": "Record per finding in session notes — do not claim model superiority"}
        else:
            arch = {"notes": notes}
            manual = {"notes": notes}

        dimensions.append(
            {
                "id": key,
                "title": title,
                "archlucid": arch,
                "manualFrontierAi": manual,
            }
        )

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "inputs": {
            "archlucidPacketDir": archlucid_packet_dir.as_posix(),
            "manualAiFindingsPath": manual_ai_path.as_posix(),
            "archlucidTimingMinutes": archlucid_minutes,
            "manualTimingMinutes": manual_minutes,
        },
        "packetMetadata": packet_meta or None,
        "manualAiExcerptChars": min(len(manual_text), 400),
        "dimensions": dimensions,
        "whereManualAiWins": [
            "Zero platform setup for a one-off review",
            "Broad exploratory questions outside committed manifest scope",
            "Custom narrative tone without export templates",
        ],
        "whereArchLucidWins": [
            "Durable manifest and committed review lifecycle",
            "Audit trail, correlation IDs, and evidence-linked findings",
            "Repeatable sponsor packet with execution-mode labels",
            "Governance-ready exports and ROI basis discipline",
        ],
        "antiClaims": [
            "Do not claim ArchLucid is smarter than frontier AI",
            "Do not present simulator output as live customer proof",
        ],
        "sessionNotes": session_notes.strip() or None,
    }


def render_markdown(payload: dict[str, Any]) -> str:
    lines = [
        "# Generic-AI bakeoff summary",
        "",
        f"Generated: {payload.get('generatedUtc')}",
        "",
        "## Timing",
        "",
    ]

    inputs = payload.get("inputs") or {}
    arch_timing = inputs.get("archlucidTimingMinutes")
    manual_timing = inputs.get("manualTimingMinutes")

    lines.append(
        f"- ArchLucid packet: **{arch_timing if arch_timing is not None else 'unknown / not measured'}** minutes"
    )
    lines.append(
        f"- Manual frontier AI: **{manual_timing if manual_timing is not None else 'unknown / not measured'}** minutes"
    )
    lines.append("")
    lines.append("## Dimensions")
    lines.append("")

    for row in payload.get("dimensions") or []:
        lines.append(f"### {row.get('title')}")
        lines.append(f"- ArchLucid: `{json.dumps(row.get('archlucid'), sort_keys=True)}`")
        lines.append(f"- Manual AI: `{json.dumps(row.get('manualFrontierAi'), sort_keys=True)}`")
        lines.append("")

    lines.extend(
        [
            "## Where manual frontier AI wins",
            "",
            *[f"- {item}" for item in payload.get("whereManualAiWins") or []],
            "",
            "## Where ArchLucid wins",
            "",
            *[f"- {item}" for item in payload.get("whereArchLucidWins") or []],
            "",
            "## Anti-claims",
            "",
            *[f"- {item}" for item in payload.get("antiClaims") or []],
            "",
        ]
    )

    notes = payload.get("sessionNotes")

    if notes:
        lines.extend(["## Session notes", "", str(notes), ""])

    return "\n".join(lines)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archlucid-packet-dir", required=True, type=Path)
    parser.add_argument("--manual-ai-findings", required=True, type=Path)
    parser.add_argument("--archlucid-minutes", type=int, default=None)
    parser.add_argument("--manual-minutes", type=int, default=None)
    parser.add_argument("--session-notes", default="")
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    if not args.archlucid_packet_dir.is_dir():
        print(f"generic_ai_bakeoff: missing packet dir {args.archlucid_packet_dir}", file=sys.stderr)
        return 2

    if not args.manual_ai_findings.is_file():
        print(f"generic_ai_bakeoff: missing manual AI findings {args.manual_ai_findings}", file=sys.stderr)
        return 2

    payload = build_summary(
        archlucid_packet_dir=args.archlucid_packet_dir,
        manual_ai_path=args.manual_ai_findings,
        archlucid_minutes=args.archlucid_minutes,
        manual_minutes=args.manual_minutes,
        session_notes=args.session_notes,
    )

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")
    print(f"generic_ai_bakeoff: wrote {args.json_out} and {args.markdown_out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
