#!/usr/bin/env python3
"""Periodic trust/procurement doc freshness sweep (T2-12)."""

from __future__ import annotations

import argparse
import re
import sys
from datetime import date
from pathlib import Path

_LAST_REVIEWED = re.compile(r"^\s*\*\*Last reviewed:\*\*\s*(\d{4}-\d{2}-\d{2})\s*$", re.MULTILINE)
_STALE_DAYS = 180

_TARGETS = [
    "docs/go-to-market/trust-center.md",
    "docs/go-to-market/CLAIM_READINESS_STATUS.md",
    "docs/go-to-market/PROCUREMENT_PACK_INDEX.md",
    "docs/security/MULTI_TENANT_RLS.md",
]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def evaluate(root: Path) -> list[str]:
    warnings: list[str] = []
    today = date.today()

    for relative in _TARGETS:
        path = root / relative

        if not path.is_file():
            warnings.append(f"MISSING: {relative}")
            continue

        match = _LAST_REVIEWED.search(path.read_text(encoding="utf-8", errors="replace"))

        if not match:
            warnings.append(f"NO_LAST_REVIEWED: {relative}")
            continue

        reviewed = date.fromisoformat(match.group(1))

        if (today - reviewed).days > _STALE_DAYS:
            warnings.append(f"STALE: {relative} ({(today - reviewed).days} days)")

    return warnings


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument("--warn-only", action="store_true")
    args = parser.parse_args(argv)
    warnings = evaluate(args.repo_root.resolve())

    if warnings:
        print("trust_procurement_freshness warnings:")

        for warning in warnings:
            print(f"  - {warning}")

    if warnings and not args.warn_only:
        return 1

    print("trust_procurement_freshness: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
