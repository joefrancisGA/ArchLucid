#!/usr/bin/env python3
"""Validate outbox/retrieval SLO threshold fixtures fire as expected (T2-8)."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.slo-threshold-calibration.v1"
_FIXTURE = Path(__file__).resolve().parent / "fixtures" / "slo-threshold-calibration" / "synthetic-signals.json"


def load_fixture(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def evaluate(fixture: dict[str, Any]) -> dict[str, Any]:
    lanes: list[dict[str, Any]] = []

    for lane in fixture.get("lanes", []):
        value = float(lane["observed"])
        warn = float(lane["warnThreshold"])
        critical = float(lane["criticalThreshold"])
        status = "PASS"

        if value >= critical:
            status = "HOLD"
        elif value >= warn:
            status = "WARN"

        lanes.append(
            {
                "id": lane["id"],
                "label": lane["label"],
                "observed": value,
                "warnThreshold": warn,
                "criticalThreshold": critical,
                "status": status,
            }
        )

    disposition = "PASS"

    if any(row["status"] == "HOLD" for row in lanes):
        disposition = "HOLD"
    elif any(row["status"] == "WARN" for row in lanes):
        disposition = "WARN"

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "lanes": lanes,
        "detail": "synthetic calibration only — not live pilot telemetry",
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fixture", type=Path, default=_FIXTURE)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args(argv)
    summary = evaluate(load_fixture(args.fixture))

    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    if summary["disposition"] == "HOLD":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
