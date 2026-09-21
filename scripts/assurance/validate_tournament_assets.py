#!/usr/bin/env python3
"""Validate architecture tournament assets without exposing held-out truth."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

FORBIDDEN_HOLDOUT_KEYS = {
    "expectedFindings",
    "plantedDefects",
    "dangerousRecommendations",
    "acceptableAlternatives",
    "mustNotFail",
    "answerKeyBody",
    "expectedAnswer",
}


def validate_assets(development_path: Path, holdout_path: Path) -> list[str]:
    errors: list[str] = []
    development = json.loads(development_path.read_text(encoding="utf-8"))
    holdout = json.loads(holdout_path.read_text(encoding="utf-8"))

    dev_cases = development.get("cases", [])
    slots = holdout.get("slots", [])

    if len(dev_cases) != 5:
        errors.append(f"development case count must be 5, got {len(dev_cases)}")

    if len(slots) != 25:
        errors.append(f"holdout slot count must be 25, got {len(slots)}")

    ids = [row.get("caseId") for row in dev_cases] + [row.get("caseId") for row in slots]
    if len(ids) != len(set(ids)):
        errors.append("case ids must be unique across development and holdout sets")

    for row in dev_cases:
        for key in ("scenario", "objectives", "plantedDefects", "acceptableAlternatives", "dangerousRecommendations", "mustNotFail"):
            if not row.get(key):
                errors.append(f"{row.get('caseId')}: missing development truth field {key}")

    for row in slots:
        leaked = sorted(FORBIDDEN_HOLDOUT_KEYS.intersection(row.keys()))
        if leaked:
            errors.append(f"{row.get('caseId')}: held-out truth leaked via keys {leaked}")
        if row.get("answerKey") != "EXTERNAL_OWNER_CONTROLLED":
            errors.append(f"{row.get('caseId')}: answerKey must remain external")
        if row.get("rubric") != "EXTERNAL_OWNER_CONTROLLED":
            errors.append(f"{row.get('caseId')}: rubric must remain external")

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--development", type=Path, required=True)
    parser.add_argument("--holdout", type=Path, required=True)
    args = parser.parse_args(argv)

    errors = validate_assets(args.development, args.holdout)
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1

    print("Architecture tournament assets: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
