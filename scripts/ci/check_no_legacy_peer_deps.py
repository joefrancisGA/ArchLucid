#!/usr/bin/env python3
"""Fail when npm ci is configured to use --legacy-peer-deps (TB / §17 npm hygiene)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_SCAN_GLOBS = (
    ".npmrc",
    "archlucid-ui/.npmrc",
    "archlucid-ui/package.json",
    ".github/workflows/*.yml",
)
_BANNED = "legacy-peer-deps"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def collect_paths(root: Path) -> list[Path]:
    paths: list[Path] = []

    for rel in _SCAN_GLOBS:
        if "*" in rel:
            paths.extend(sorted(root.glob(rel)))
        else:
            candidate = root / rel

            if candidate.is_file():
                paths.append(candidate)

    return paths


def scan(root: Path) -> list[str]:
    errors: list[str] = []

    for path in collect_paths(root):
        text = path.read_text(encoding="utf-8", errors="replace")

        if _BANNED in text:
            rel = path.relative_to(root).as_posix()
            errors.append(f"{rel}: must not set {_BANNED} (use package.json overrides)")

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    errors = scan(repo_root())

    if errors:
        print("check_no_legacy_peer_deps: FAIL", file=sys.stderr)

        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_no_legacy_peer_deps: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
