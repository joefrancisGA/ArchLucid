#!/usr/bin/env python3
"""Build RC35 beta evidence records from beta-critical run IDs."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from validate_ship_gate_evidence_index import build_index

_SCHEMA = "archlucid.private-beta-evidence-records.v1"


def build_records(evidence_root: Path, run_ids: list[str]) -> dict[str, Any]:
    records, validation_issues = build_index(evidence_root)
    by_run_id = {str(record["runId"]): record for record in records}
    requested = [run_id.strip() for run_id in run_ids if run_id.strip()]
    missing = [run_id for run_id in requested if run_id not in by_run_id]
    issues = [*validation_issues, *[f"requested run ID has no valid evidence: {run_id}" for run_id in missing]]

    return {
        "schema": _SCHEMA,
        "disposition": "PASS" if requested and not issues else "HOLD",
        "requestedRunIds": requested,
        "records": [by_run_id[run_id] for run_id in requested if run_id in by_run_id],
        "issues": issues if requested else ["at least one beta-critical run ID is required"],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--evidence-root", type=Path, required=True)
    parser.add_argument("--run-id", action="append", dest="run_ids", required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args()

    report = build_records(args.evidence_root, args.run_ids)
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"private-beta evidence records: {report['disposition']}")
    return 0 if report["disposition"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
