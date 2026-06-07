#!/usr/bin/env python3
"""Evaluate support-bundle attachment status for release evidence (T2-6)."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.support-bundle-status.v1"
_REQUIRED_MARKERS = ("support-bundle", "support_bundle", "support-summary")


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def evaluate(bundle_dir: Path) -> dict[str, Any]:
    matches = [
        path.name
        for path in bundle_dir.iterdir()
        if path.is_file() and any(marker in path.name.lower() for marker in _REQUIRED_MARKERS)
    ]

    status = "PASS" if matches else "MISSING"

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "status": status,
        "matchedFiles": sorted(matches),
        "detail": "support bundle or support-summary artifact present" if matches else "no support bundle artifact attached",
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle-dir", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args(argv)
    summary = evaluate(args.bundle_dir.resolve())
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
