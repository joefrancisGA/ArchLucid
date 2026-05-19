#!/usr/bin/env python3
"""Verify public *Tests classes declare Suite or Category traits (mirrors architecture test)."""

from __future__ import annotations

import re
import sys
from pathlib import Path

CLASS_PATTERN = re.compile(
    r"^(?P<indent>\s*)(?P<modifiers>(?:public|internal)\s+)"
    r"(?:(?:sealed|abstract|static|partial)\s+)*"
    r"class\s+(?:\r?\n\s*)?(?P<name>\w*Tests)\b",
    re.MULTILINE,
)

TRAIT_PATTERN = re.compile(
    r'^\s*\[\s*Trait\s*\(\s*"(?:Suite|Category)"\s*,',
    re.MULTILINE,
)


def find_repository_root() -> Path:
    current = Path(__file__).resolve().parent
    for directory in [current, *current.parents]:
        if (directory / "ArchLucid.sln").is_file():
            return directory
    raise RuntimeError("ArchLucid.sln not found.")


def enumerate_test_project_directories(repository_root: Path) -> list[Path]:
    directories = [
        child
        for child in repository_root.iterdir()
        if child.is_dir() and child.name.endswith(".Tests")
    ]
    template_tests = (
        repository_root
        / "templates"
        / "archlucid-finding-engine"
        / "ArchLucidFindingEngine.Tests"
    )
    if template_tests.is_dir():
        directories.append(template_tests)
    return directories


def class_attribute_block_start(content: str, class_start: int) -> int:
    line_start = content.rfind("\n", 0, class_start) + 1
    scan = line_start
    while scan > 0:
        prev_newline = content.rfind("\n", 0, scan - 1)
        if prev_newline < 0:
            return 0
        line = content[prev_newline + 1 : scan]
        stripped = line.strip()
        if stripped == "":
            scan = prev_newline
            continue
        if stripped.startswith("[") or stripped.startswith("///") or stripped.startswith("//"):
            scan = prev_newline
            continue
        if stripped == "}":
            break
        break
    return scan if scan > 0 else 0


def find_violations(path: Path, content: str, repository_root: Path) -> list[str]:
    violations: list[str] = []
    for match in CLASS_PATTERN.finditer(content):
        if "public" not in match.group("modifiers"):
            continue
        class_start = match.start()
        block_start = class_attribute_block_start(content, class_start)
        block = content[block_start:class_start]
        if TRAIT_PATTERN.search(block) is None:
            relative = path.relative_to(repository_root).as_posix()
            line = content.count("\n", 0, class_start) + 1
            violations.append(f"{relative}:{line}: {match.group('name')}")
    return violations


def main() -> int:
    repository_root = find_repository_root()
    all_violations: list[str] = []
    for test_project in enumerate_test_project_directories(repository_root):
        for path in sorted(test_project.rglob("*.cs")):
            normalized = path.as_posix()
            if "/bin/" in normalized or "/obj/" in normalized:
                continue
            all_violations.extend(
                find_violations(path, path.read_text(encoding="utf-8"), repository_root)
            )
    for violation in sorted(all_violations):
        print(violation)
    print(f"\n{len(all_violations)} violation(s).")
    return 1 if all_violations else 0


if __name__ == "__main__":
    sys.exit(main())
