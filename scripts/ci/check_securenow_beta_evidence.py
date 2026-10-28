#!/usr/bin/env python3
"""Check SecureNow beta evidence coverage without conflating implementation and validation.

The matrix records known test commands, but only fresh, explicitly supplied
verification results can satisfy the release gate. No Azure access is required.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

IDS = (
    "FR-EV-01", "FR-EV-02", "FR-EV-03",
    "FR-AP-01", "FR-AP-02", "FR-AP-03", "FR-AP-04", "FR-AP-05",
    "FR-DG-01", "FR-DG-02", "FR-DG-03",
    "FR-RM-01", "FR-RM-02", "FR-RM-03",
    "FR-UI-01", "FR-UI-02",
    "NFR-01", "NFR-02", "NFR-03", "NFR-04", "NFR-05", "NFR-06",
)
VALID = {"PASS", "FAIL", "UNKNOWN", "NOT_RUN", "BLOCKED"}
ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MATRIX = ROOT / "docs/securenow/BETA_EVIDENCE_MATRIX.json"


def validate(matrix: object, *, strict: bool = False) -> list[str]:
    errors: list[str] = []
    if not isinstance(matrix, dict):
        return ["matrix must be a JSON object"]
    entries = matrix.get("requirements")
    if not isinstance(entries, list):
        return ["requirements must be an array"]
    ids: list[str] = []
    for index, item in enumerate(entries):
        if not isinstance(item, dict):
            errors.append(f"requirements[{index}] must be an object")
            continue
        rid = item.get("id")
        if not isinstance(rid, str):
            errors.append(f"requirements[{index}]: id must be a string")
            continue
        ids.append(rid)
        status = item.get("status")
        if status not in VALID:
            errors.append(f"{rid}: invalid status {status!r}")
        evidence = item.get("evidence")
        if not isinstance(evidence, str) or not evidence.strip():
            errors.append(f"{rid}: evidence must explain what was inspected or not yet checked")
        if status == "PASS":
            for field in ("test_command", "result_reference", "commit_sha"):
                if not isinstance(item.get(field), str) or not item[field].strip():
                    errors.append(f"{rid}: PASS requires {field}")
        if status == "PASS":
            sha = item.get("commit_sha")
            if isinstance(sha, str) and re.fullmatch(r"[0-9a-fA-F]{40}", sha) is None:
                errors.append(f"{rid}: commit_sha must be a full 40-character Git commit")
            command = item.get("test_command")
            if isinstance(command, str) and command.strip().lower() in {"passed", "pass", "yes", "true"}:
                errors.append(f"{rid}: test_command must describe an executable check")
            reference = item.get("result_reference")
            if isinstance(reference, str) and reference.strip().lower() in {"passed", "pass", "yes", "true"}:
                errors.append(f"{rid}: result_reference must identify a traceable run or artifact")
        if strict and status != "PASS":
            errors.append(f"{rid}: strict beta gate requires PASS, got {status}")
    missing = sorted(set(IDS) - set(ids))
    unexpected = sorted(set(ids) - set(IDS))
    if missing:
        errors.append(f"missing requirement ids: {', '.join(missing)}")
    if unexpected:
        errors.append(f"unexpected requirement ids: {', '.join(unexpected)}")
    duplicates = sorted({rid for rid in ids if ids.count(rid) > 1})
    if duplicates:
        errors.append(f"duplicate requirement ids: {', '.join(duplicates)}")
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--matrix", type=Path, default=DEFAULT_MATRIX)
    parser.add_argument("--strict", action="store_true", help="fail unless every requirement has verified PASS evidence")
    args = parser.parse_args(argv)
    try:
        matrix = json.loads(args.matrix.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        print(f"SecureNow beta matrix unreadable: {exc}", file=sys.stderr)
        return 2
    errors = validate(matrix, strict=args.strict)
    counts = {value: 0 for value in sorted(VALID)}
    for item in matrix.get("requirements", []):
        if isinstance(item, dict) and item.get("status") in counts:
            counts[item["status"]] += 1
    print("SecureNow beta evidence: " + ", ".join(f"{k}={v}" for k, v in counts.items()))
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1
    print("SecureNow beta evidence matrix structurally valid" + ("; strict gate PASS" if args.strict else "; no release claim"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
