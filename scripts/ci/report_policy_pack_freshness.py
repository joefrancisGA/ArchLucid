#!/usr/bin/env python3
"""Report policy-pack template freshness for CI and release evidence."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path(__file__).resolve().parents[2],
    )
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    root = args.repo_root.resolve()
    packs_root = root / "templates" / "policy-packs"

    if not packs_root.is_dir():
        print(f"ERROR: missing {packs_root}", file=sys.stderr)
        return 2

    rows: list[dict[str, object]] = []

    for rules_path in sorted(packs_root.rglob("compliance-rules.json")):
        stat = rules_path.stat()
        rows.append(
            {
                "relativePath": str(rules_path.relative_to(root)).replace("\\", "/"),
                "lastModifiedUtc": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
                "sizeBytes": stat.st_size,
            }
        )

    payload = {
        "schema": "archlucid.policy-pack-freshness.v1",
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "packCount": len(rows),
        "packs": rows,
    }

    text = json.dumps(payload, indent=2)

    if args.json_out is not None:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(text + "\n", encoding="utf-8")

    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
