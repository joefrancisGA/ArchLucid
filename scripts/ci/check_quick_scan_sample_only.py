#!/usr/bin/env python3
"""Marketing Quick Scan copy must stay sample/demonstration-only (TB-902 / M-110)."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

_CONTENT_REL = "archlucid-ui/src/app/(marketing)/quick-scan/quick-scan-page-content.ts"
_QUICK_SCAN_DIR = "archlucid-ui/src/app/(marketing)/quick-scan"
_SAMPLE_OR_DEMO = re.compile(r"sample|demonstrat", re.I)
_LIVE_ANONYMOUS_AI = re.compile(r"\b(live anonymous(?:\s+quick scan)?\s+ai|anonymous\s+ai)\b", re.I)
_REQUIRED_CONSTS = (
    "QUICK_SCAN_HERO_LEAD",
    "QUICK_SCAN_BUYER_OVERVIEW",
    "QUICK_SCAN_ANALYSIS_TYPICAL_DURATION",
)
_CAVEAT_MARKERS = (
    "sample",
    "demonstrat",
    "until m-110",
    "false",
    "not ",
    "do not",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _const_value(text: str, name: str) -> str | None:
    match = re.search(
        rf"export const {re.escape(name)}\s*=\s*`?\"([^\"]+)\"",
        text,
    )

    if match is None:
        return None

    return match.group(1)


def scan_quick_scan_dir(root: Path) -> list[str]:
    errors: list[str] = []
    folder = root / _QUICK_SCAN_DIR

    if not folder.is_dir():
        return [f"missing {_QUICK_SCAN_DIR}"]

    for path in sorted(folder.rglob("*.ts")):
        rel = path.relative_to(root).as_posix()

        for index, line in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), start=1):
            lowered = line.lower()

            if any(marker in lowered for marker in _CAVEAT_MARKERS):
                continue

            if _LIVE_ANONYMOUS_AI.search(line):
                errors.append(f"{rel}:{index}: Quick Scan copy must stay sample-only until M-110")

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    path = repo_root() / _CONTENT_REL
    errors: list[str] = []

    if not path.is_file():
        print(f"missing {_CONTENT_REL}", file=sys.stderr)
        return 1

    text = path.read_text(encoding="utf-8", errors="replace")

    for name in _REQUIRED_CONSTS:
        value = _const_value(text, name)

        if value is None:
            errors.append(f"{_CONTENT_REL}: missing string const {name}")
            continue

        if _SAMPLE_OR_DEMO.search(value) is None:
            errors.append(
                f"{_CONTENT_REL}: {name} must say sample or demonstration "
                "(Quick Scan public path is sample-only until M-110)",
            )

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    dir_errors = scan_quick_scan_dir(repo_root())

    if dir_errors:
        for error in dir_errors:
            print(error, file=sys.stderr)

        return 1

    print("check_quick_scan_sample_only: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
