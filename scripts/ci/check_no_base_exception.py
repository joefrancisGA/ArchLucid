#!/usr/bin/env python3
"""Diff-scoped guard: ban `throw new Exception` in changed C# (use specific exception types)."""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parent
if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from git_diff_paths import (  # noqa: E402
    add_diff_range_arg,
    git_diff_name_only,
    normalize_git_path,
    repo_root,
    resolve_diff_range,
    should_skip_push_range,
)

SKIP_SUFFIXES = (
    ".Designer.cs",
    ".g.cs",
    "GlobalUsings.cs",
)

BASE_EXCEPTION = re.compile(r"\bthrow\s+new\s+(?:System\.)?Exception\s*\(")


def should_scan_path(path: str) -> bool:
    normalized = normalize_git_path(path)

    if not normalized.endswith(".cs"):
        return False

    if any(part in normalized for part in ("/obj/", "/bin/", "\\obj\\", "\\bin\\")):
        return False

    if any(normalized.endswith(suffix) for suffix in SKIP_SUFFIXES):
        return False

    return True


def code_without_line_comment(line: str) -> str:
    comment_index = line.find("//")

    if comment_index < 0:
        return line

    return line[:comment_index]


def scan_source(source: str) -> list[int]:
    lines = source.splitlines()
    violations: list[int] = []

    for index, line in enumerate(lines):
        candidate = code_without_line_comment(line).strip()

        if len(candidate) == 0:
            continue

        if BASE_EXCEPTION.search(candidate):
            violations.append(index + 1)

    return violations


def scan_file(path: Path) -> list[str]:
    source = path.read_text(encoding="utf-8-sig")
    line_numbers = scan_source(source)

    return [
        f"{path.as_posix()}:{line_no}: use a specific exception type instead of `throw new Exception`"
        for line_no in line_numbers
    ]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    add_diff_range_arg(parser)
    args = parser.parse_args(argv)

    root = repo_root()
    diff_range = resolve_diff_range(args)
    ci_range_hint = (os.environ.get("ARCHLUCID_GIT_DIFF_RANGE") or "").strip()

    if diff_range is None:
        if ci_range_hint and should_skip_push_range(ci_range_hint):
            print("Skipping base Exception guard: GitHub push with no meaningful before SHA.")
            return 0

        print(
            "Skipping base Exception guard: set --diff-range or ARCHLUCID_GIT_DIFF_RANGE.",
        )
        return 0

    try:
        changed_paths = git_diff_name_only(root, diff_range)
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        return 1

    violations: list[str] = []

    for changed in changed_paths:
        if not should_scan_path(changed):
            continue

        file_path = root / normalize_git_path(changed)

        if not file_path.is_file():
            continue

        violations.extend(scan_file(file_path))

    if not violations:
        print("Base Exception guard OK for changed .cs files.")
        return 0

    print("Base Exception guard failed:", file=sys.stderr)

    for item in violations:
        print(f"  {item}", file=sys.stderr)

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
