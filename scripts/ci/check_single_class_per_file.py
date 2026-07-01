#!/usr/bin/env python3
"""Diff-scoped guard: one root-level class/record/struct per .cs file."""

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


TYPE_DECL = re.compile(
    r"^\s*(?:"
    r"(?:public|internal|private|protected|file)\s+"
    r")?"
    r"(?:(?:partial|sealed|abstract|static|readonly)\s+)*"
    r"(?:class|record|struct)\s+(\w+)",
    re.MULTILINE,
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


def strip_raw_string_literals(source: str) -> str:
    """Drop bodies of C# triple-quoted raw string literals (analyzer tests embed stub sources)."""
    lines: list[str] = []
    in_raw = False

    for line in source.splitlines():
        if not in_raw:
            open_idx = line.find('"""')

            if open_idx == -1:
                lines.append(line)
                continue

            after_open = line[open_idx + 3 :]
            close_idx = after_open.find('"""')

            if close_idx != -1:
                lines.append(line[: open_idx + 3] + after_open[close_idx:])
                continue

            in_raw = True
            lines.append(line[: open_idx + 3])
            continue

        close_idx = line.find('"""')

        if close_idx == -1:
            continue

        in_raw = False
        lines.append(line[close_idx:])

    return "\n".join(lines)


def root_type_names(source: str) -> set[str]:
    names: set[str] = set()
    type_nesting = 0
    pending_type_open = False
    skip_next_block_open = False

    for line in strip_raw_string_literals(source).splitlines():
        stripped = line.strip()

        if stripped.startswith("//"):
            continue

        if stripped.startswith("namespace ") and not stripped.endswith(";"):
            skip_next_block_open = True

        match = TYPE_DECL.match(line)

        if match is not None and type_nesting == 0:
            names.add(match.group(1))
            pending_type_open = "{" not in line

        opens = line.count("{")
        closes = line.count("}")

        if skip_next_block_open and opens > 0:
            skip_next_block_open = False
            opens -= 1

        if pending_type_open and opens > 0:
            type_nesting += opens
            pending_type_open = False
        elif type_nesting > 0:
            type_nesting += opens

        type_nesting -= closes

        if type_nesting < 0:
            type_nesting = 0
            pending_type_open = False

    return names


def scan_file(path: Path) -> list[str]:
    source = path.read_text(encoding="utf-8-sig")
    names = root_type_names(source)

    if len(names) <= 1:
        return []

    joined = ", ".join(sorted(names))

    return [f"{path.as_posix()}: multiple root types ({joined})"]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    add_diff_range_arg(parser)
    args = parser.parse_args(argv)

    root = repo_root()
    diff_range = resolve_diff_range(args)
    ci_range_hint = (os.environ.get("ARCHLUCID_GIT_DIFF_RANGE") or "").strip()

    if diff_range is None:
        if ci_range_hint and should_skip_push_range(ci_range_hint):
            print("Skipping single-class-per-file guard: GitHub push with no meaningful before SHA.")
            return 0

        print(
            "Skipping single-class-per-file guard: "
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
        print("Single-class-per-file guard OK for changed .cs files.")
        return 0

    print("Single-class-per-file guard failed:", file=sys.stderr)

    for item in violations:
        print(f"  {item}", file=sys.stderr)

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
