#!/usr/bin/env python3
"""Compare repeated JSON outputs after removing explicitly volatile fields."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

DEFAULT_VOLATILE_FIELDS = {
    "createdUtc",
    "updatedUtc",
    "occurredUtc",
    "durationMs",
}


def normalize(value, volatile_fields: set[str]):
    if isinstance(value, dict):
        return {
            key: normalize(item, volatile_fields)
            for key, item in sorted(value.items())
            if key not in volatile_fields
        }
    if isinstance(value, list):
        normalized = [normalize(item, volatile_fields) for item in value]
        if all(isinstance(item, dict) and ("findingId" in item or "pathId" in item) for item in normalized):
            key = "findingId" if all("findingId" in item for item in normalized) else "pathId"
            return sorted(normalized, key=lambda item: str(item.get(key)))
        return normalized
    return value


def fingerprint(payload, volatile_fields: set[str]) -> str:
    normalized = normalize(payload, volatile_fields)
    canonical = json.dumps(normalized, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def audit(paths: list[Path], volatile_fields: set[str]) -> dict:
    rows = []
    for path in paths:
        digest = fingerprint(json.loads(path.read_text(encoding="utf-8")), volatile_fields)
        rows.append({"path": str(path), "sha256": digest})
    unique = sorted({row["sha256"] for row in rows})
    return {
        "schemaVersion": 1,
        "runCount": len(rows),
        "deterministic": len(unique) <= 1,
        "distinctSemanticFingerprints": len(unique),
        "runs": rows,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("outputs", nargs="+", type=Path)
    parser.add_argument("--volatile-field", action="append", default=[])
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args(argv)

    volatile = DEFAULT_VOLATILE_FIELDS | set(args.volatile_field)
    result = audit(args.outputs, volatile)
    print(json.dumps(result, indent=2))
    return 1 if args.enforce and not result["deterministic"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
