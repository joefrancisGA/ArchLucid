#!/usr/bin/env python3
"""Emit data-consistency readiness summary for RC evidence (assessment Tier 2 #10)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.data-consistency-readiness.v1"
_MATRIX_DOC = "docs/library/DATA_CONSISTENCY_MATRIX.md"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None

    payload = json.loads(path.read_text(encoding="utf-8"))

    return payload if isinstance(payload, dict) else None


def resolve_mode(appsettings: dict[str, Any] | None) -> str:
    if appsettings is None:
        return "MISSING"

    block = appsettings.get("DataConsistency")

    if not isinstance(block, dict):
        return "MISSING"

    enforcement = block.get("Enforcement")

    if not isinstance(enforcement, dict):
        return "MISSING"

    mode = str(enforcement.get("Mode") or "").strip()

    return mode.upper() if mode else "MISSING"


def build_summary(*, production_appsettings: Path, probe_fixture: Path | None) -> dict[str, Any]:
    appsettings = load_json(production_appsettings)
    mode = resolve_mode(appsettings)
    probe = load_json(probe_fixture) if probe_fixture else None

    orphan_count = None
    header_repoint_count = None

    if probe is not None:
        orphan_count = probe.get("orphanCount")
        header_repoint_count = probe.get("headerRepointCount")

    quarantine_capable = mode == "QUARANTINE"
    detection_only = mode == "ALERT"

    disposition = "PASS" if mode in {"ALERT", "QUARANTINE"} else "WARN"

    if orphan_count not in (None, 0) or header_repoint_count not in (None, 0):
        disposition = "WARN"

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "configuredMode": mode,
        "orphanProbePosture": "detection-only" if detection_only else "quarantine-capable",
        "headerRepointProbePosture": "detection-only" if detection_only else "quarantine-capable",
        "detectionOnlySignals": detection_only,
        "quarantineCapable": quarantine_capable,
        "orphanCount": orphan_count,
        "headerRepointCount": header_repoint_count,
        "matrixDoc": _MATRIX_DOC,
        "operatorNextSteps": [
            "Nonzero orphan or header-repoint counts require operator triage before sponsor send.",
            "Alert mode records findings without auto-deleting forensic data.",
            "Quarantine mode may block affected reads until manual review completes.",
        ],
        "interpretation": "Summarized from production appsettings and optional probe fixture — not a live probe run.",
    }


def render_markdown(summary: dict[str, Any]) -> str:
    lines = [
        "# Data consistency readiness summary",
        "",
        f"Generated UTC: **{summary['generatedUtc']}**",
        "",
        f"**Disposition:** **{summary['disposition']}**",
        f"**Configured mode:** **{summary['configuredMode']}**",
        "",
        f"- Orphan probe posture: {summary['orphanProbePosture']}",
        f"- Header-repoint probe posture: {summary['headerRepointProbePosture']}",
        f"- Detection-only signals: **{summary['detectionOnlySignals']}**",
        "",
        "## Operator next steps",
        "",
    ]

    for step in summary.get("operatorNextSteps") or []:
        lines.append(f"- {step}")

    lines.extend(["", f"Full matrix: `{summary['matrixDoc']}`", ""])
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--production-appsettings",
        type=Path,
        default=repo_root() / "ArchLucid.Api" / "appsettings.Production.json",
    )
    parser.add_argument("--probe-fixture", type=Path, default=None)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    args = parser.parse_args(argv)

    summary = build_summary(
        production_appsettings=args.production_appsettings,
        probe_fixture=args.probe_fixture,
    )

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(summary), encoding="utf-8")

    print(f"Data consistency readiness: {summary['disposition']} ({summary['configuredMode']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
