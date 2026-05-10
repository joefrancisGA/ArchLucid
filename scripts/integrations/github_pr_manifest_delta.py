#!/usr/bin/env python3
"""Compare two golden-manifest-shaped JSON files for sponsor-facing deltas.

Typical use: export manifest JSON from two review IDs (base vs head) and diff counts + status.
No cloud calls; local files only.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def _load(path: Path) -> dict[str, Any]:
    raw = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(raw, dict):
        raise ValueError(f"{path}: root must be an object")

    return raw


def _pick_int(doc: dict[str, Any], *keys: str) -> int | None:
    for key in keys:
        if key in doc and isinstance(doc[key], int):
            return doc[key]

    return None


def _pick_str(doc: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        if key in doc and isinstance(doc[key], str) and doc[key].strip():
            return doc[key].strip()

    return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Diff two ArchLucid manifest JSON exports (offline).")
    parser.add_argument("--base", type=Path, required=True, help="Path to base manifest JSON")
    parser.add_argument("--head", type=Path, required=True, help="Path to head manifest JSON")
    parser.add_argument("--markdown", action="store_true", help="Write Markdown table to stdout")
    args = parser.parse_args()

    base_path: Path = args.base.resolve()
    head_path: Path = args.head.resolve()

    if not base_path.is_file() or not head_path.is_file():
        print("::error::Both --base and --head must be existing files", file=sys.stderr)
        return 1

    base = _load(base_path)
    head = _load(head_path)

    base_status = _pick_str(base, "status", "manifestStatus")
    head_status = _pick_str(head, "status", "manifestStatus")
    base_decisions = _pick_int(base, "decisionCount")
    head_decisions = _pick_int(head, "decisionCount")
    base_warnings = _pick_int(base, "warningCount")
    head_warnings = _pick_int(head, "warningCount")
    base_sys = _pick_str(base, "systemName")
    head_sys = _pick_str(head, "systemName")

    if args.markdown:
        lines = [
            "## Manifest delta",
            "",
            "| Field | Base | Head |",
            "|-------|------|------|",
            f"| File | `{base_path.name}` | `{head_path.name}` |",
            f"| systemName | {base_sys or '—'} | {head_sys or '—'} |",
            f"| status | {base_status or '—'} | {head_status or '—'} |",
            f"| decisionCount | {base_decisions if base_decisions is not None else '—'} | "
            f"{head_decisions if head_decisions is not None else '—'} |",
            f"| warningCount | {base_warnings if base_warnings is not None else '—'} | "
            f"{head_warnings if head_warnings is not None else '—'} |",
            "",
        ]
        print("\n".join(lines))
    else:
        print(f"base: {base_path}")
        print(f"head: {head_path}")
        print(f"systemName: {base_sys} -> {head_sys}")
        print(f"status: {base_status} -> {head_status}")
        print(f"decisionCount: {base_decisions} -> {head_decisions}")
        print(f"warningCount: {base_warnings} -> {head_warnings}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
