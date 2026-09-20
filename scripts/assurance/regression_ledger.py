#!/usr/bin/env python3
"""Validate that every confirmed defect has a prevention/regression disposition."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

VALID = {"regression-test", "property-test", "metamorphic-test", "structural-prevention", "documented-nonautomatable"}


def validate(records: list[dict]) -> list[str]:
    errors = []
    for row in records:
        if not row.get("confirmed", True):
            continue
        defect_id = row.get("defectId", "<missing>")
        disposition = row.get("regressionDisposition")
        artifact = str(row.get("regressionArtifact", "")).strip()
        if disposition not in VALID:
            errors.append(f"{defect_id}: invalid/missing regressionDisposition")
        if disposition != "documented-nonautomatable" and not artifact:
            errors.append(f"{defect_id}: automated/preventive disposition requires regressionArtifact")
        if disposition == "documented-nonautomatable" and not str(row.get("reason", "")).strip():
            errors.append(f"{defect_id}: nonautomatable disposition requires reason")
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("ledger", type=Path)
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args(argv)
    payload = json.loads(args.ledger.read_text(encoding="utf-8"))
    records = payload.get("defects", payload if isinstance(payload, list) else [])
    errors = validate(records)
    print(json.dumps({"schemaVersion": 1, "errorCount": len(errors), "errors": errors}, indent=2))
    return 1 if args.enforce and errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
