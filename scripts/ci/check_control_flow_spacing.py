#!/usr/bin/env python3
"""Diff-scoped guard: blank line before if/foreach unless first statement in a method."""

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


CONTROL_FLOW = re.compile(r"^\s*(if\s*\(|foreach\s*\()")
METHOD_OPEN = re.compile(
    r"^\s*(?:public|private|protected|internal|static|async|override|virtual|sealed|\w+\s+)*"
    r"[\w<>\[\],\s]+\([^\)]*\)\s*\{?\s*$",
)
SKIP_SUFFIXES = (
    ".Designer.cs",
    ".g.cs",
    "GlobalUsings.cs",
)


def should_scan_path(path: str) -> bool:
    normalized = normalize_git_path(path)

    if not normalized.endswith(".cs"):
        return False

    if any(part in normalized for part in ("/obj/", "/bin/", "\\obj\\", "\\bin\\")):
        return False

    if any(normalized.endswith(suffix) for suffix in SKIP_SUFFIXES):
        return False

    return True


def previous_non_empty_line(lines: list[str], index: int) -> str | None:
    cursor = index - 1

    while cursor >= 0:
        candidate = lines[cursor].strip()

        if len(candidate) == 0:
            cursor -= 1
            continue

        return lines[cursor]

    return None


def allows_control_flow_without_blank(previous: str | None) -> bool:
    if previous is None:
        return True

    stripped = previous.strip()

    if len(stripped) == 0:
        return True

    if stripped == "{":
        return True

    if stripped.endswith("{"):
        return True

    if METHOD_OPEN.match(previous):
        return True

    return False


def scan_source(source: str) -> list[int]:
    lines = source.splitlines()
    violations: list[int] = []

    for index, line in enumerate(lines):
        if not CONTROL_FLOW.match(line):
            continue

        if index > 0 and lines[index - 1].strip() == "":
            continue

        previous = previous_non_empty_line(lines, index)

        if allows_control_flow_without_blank(previous):
            continue

        violations.append(index + 1)

    return violations


def scan_file(path: Path) -> list[str]:
    source = path.read_text(encoding="utf-8-sig")
    line_numbers = scan_source(source)

    return [f"{path.as_posix()}:{line_no}: missing blank line before if/foreach" for line_no in line_numbers]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    add_diff_range_arg(parser)
    args = parser.parse_args(argv)

    root = repo_root()
    diff_range = resolve_diff_range(args)
    ci_range_hint = (os.environ.get("ARCHLUCID_GIT_DIFF_RANGE") or "").strip()

    if diff_range is None:
        if ci_range_hint and should_skip_push_range(ci_range_hint):
            print("Skipping control-flow spacing guard: GitHub push with no meaningful before SHA.")
            return 0

        print(
            "Skipping control-flow spacing guard: "
            "set --diff-range or ARCHLUCID_GIT_DIFF_RANGE.",
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
        print("Control-flow spacing guard OK for changed .cs files.")
        return 0

    print("Control-flow spacing guard failed:", file=sys.stderr)

    for item in violations:
        print(f"  {item}", file=sys.stderr)

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
