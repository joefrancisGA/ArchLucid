#!/usr/bin/env python3
"""Validate and index Gate 1 ship-gate-evidence artifacts."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

CI_ROOT = Path(__file__).resolve().parent

if str(CI_ROOT) not in sys.path:
    sys.path.insert(0, str(CI_ROOT))

from assert_ship_gate_evidence_schema import validate_ship_gate_evidence_document


def find_evidence_files(root: Path) -> list[Path]:
    candidates = []

    direct_path = root / "ship-gate-evidence.json"

    if direct_path.is_file():
        candidates.append(direct_path)

    candidates.extend(sorted(root.glob("*/ship-gate-evidence.json")))
    return candidates


def build_index(root: Path) -> tuple[list[dict[str, object]], list[str]]:
    records: list[dict[str, object]] = []
    issues: list[str] = []
    evidence_files = find_evidence_files(root)

    if not evidence_files:
        return records, [f"no ship-gate-evidence.json found under {root}"]

    for path in evidence_files:
        try:
            document = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            issues.append(f"{path}: unable to read JSON: {error}")
            continue

        if not isinstance(document, dict):
            issues.append(f"{path}: root document must be an object")
            continue

        document_issues = validate_ship_gate_evidence_document(document)

        if document_issues:
            issues.extend(f"{path}: {issue}" for issue in document_issues)
            continue

        records.append(
            {
                "path": str(path),
                "runId": document["runId"],
                "generatedUtc": document["generatedUtc"],
                "gateCount": len(document["gates"]),
            }
        )

    return records, issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", type=Path)
    parser.add_argument("--json-out", type=Path, default=None)
    args = parser.parse_args()
    records, issues = build_index(args.path)

    if args.json_out is not None:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(
            json.dumps({"artifacts": records, "issues": issues}, indent=2) + "\n",
            encoding="utf-8",
        )

    if issues:
        for issue in issues:
            print(f"ERROR: {issue}", file=sys.stderr)

        return 1

    print(f"OK: indexed {len(records)} ship-gate-evidence artifact(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
