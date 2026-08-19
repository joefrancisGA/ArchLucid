#!/usr/bin/env python3
"""Add missing [Trait("Suite", ...)] / [Trait("Category", ...)] on public *Tests classes."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

CLASS_DECL_PATTERN = re.compile(
    r"^(?P<indent>\s*)(?P<modifiers>(?:public|internal|private|protected)\s+)"
    r"(?:(?:sealed|abstract|static|partial)\s+)*"
    r"class\s+(?P<name>\w*Tests)\b",
    re.MULTILINE,
)

TRAIT_PATTERN = re.compile(
    r'^\s*\[\s*Trait\s*\(\s*"(?:Suite|Category)"\s*,',
    re.MULTILINE,
)


@dataclass(frozen=True)
class TraitInsertion:
    insert_at: int
    traits: tuple[str, ...]
    class_name: str


def find_repository_root() -> Path:
    current = Path(__file__).resolve().parent
    for directory in [current, *current.parents]:
        if (directory / "ArchLucid.sln").is_file():
            return directory
    raise RuntimeError("ArchLucid.sln not found.")


def is_excluded(path: Path) -> bool:
    normalized = path.as_posix()
    return "/bin/" in normalized or "/obj/" in normalized


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


def preceding_block_start(content: str, class_start: int) -> int:
    line_start = content.rfind("\n", 0, class_start) + 1
    scan = line_start
    while scan > 0:
        prev_newline = content.rfind("\n", 0, scan - 1)
        line = content[prev_newline + 1 : scan]
        stripped = line.strip()
        if stripped == "":
            scan = prev_newline
            continue
        if stripped.startswith("[") or stripped.startswith("///") or stripped.startswith("//"):
            scan = prev_newline
            continue
        break
    return scan if scan > 0 else 0


def block_has_trait(content: str, block_start: int, class_start: int) -> bool:
    block = content[block_start:class_start]
    return TRAIT_PATTERN.search(block) is not None


def is_public_class(modifiers: str) -> bool:
    return "public" in modifiers.split()


def determine_traits(
    class_name: str,
    class_declaration: str,
    file_path: Path,
    file_content: str,
) -> tuple[str, ...]:
    relative = file_path.as_posix()

    if "ArchLucid.Architecture.Tests" in relative:
        return ('[Trait("Suite", "Core")]', '[Trait("Category", "Unit")]')

    if "/GoldenCohort/" in relative or class_name.startswith("GoldenCohort"):
        if "Contract" in class_name or "RealLlmGate" in class_name:
            return (
                '[Trait("Category", "Unit")]',
                '[Trait("Suite", "GoldenCohort")]',
            )
        return ('[Trait("Category", "Unit")]', '[Trait("Suite", "Core")]')

    if "IClassFixture<" in class_declaration and (
        "HttpClient" in class_declaration or "CreateClient()" in file_content
    ):
        return ('[Trait("Suite", "Core")]', '[Trait("Category", "Integration")]')

    if "ArchLucid.Api.Tests" in relative and "WebApplicationFactory<" in file_content:
        return ('[Trait("Suite", "Core")]', '[Trait("Category", "Integration")]')

    return ('[Trait("Category", "Unit")]',)


def plan_insertions(path: Path, content: str) -> list[TraitInsertion]:
    insertions: list[TraitInsertion] = []

    for match in CLASS_DECL_PATTERN.finditer(content):
        if not is_public_class(match.group("modifiers")):
            continue

        class_start = match.start()
        block_start = preceding_block_start(content, class_start)
        if block_has_trait(content, block_start, class_start):
            continue

        traits = determine_traits(match.group("name"), match.group(0), path, content)
        insertions.append(
            TraitInsertion(
                insert_at=block_start,
                traits=traits,
                class_name=match.group("name"),
            )
        )

    return insertions


def apply_insertions(content: str, insertions: list[TraitInsertion]) -> str:
    updated = content
    for insertion in sorted(insertions, key=lambda item: item.insert_at, reverse=True):
        block = "\n".join(insertion.traits) + "\n"
        updated = updated[: insertion.insert_at] + block + updated[insertion.insert_at :]
    return updated


def process_file(path: Path, dry_run: bool) -> list[str]:
    text = path.read_text(encoding="utf-8")
    insertions = plan_insertions(path, text)
    if not insertions:
        return []

    updated = apply_insertions(text, insertions)
    if not dry_run and updated != text:
        path.write_text(updated, encoding="utf-8", newline="\n")

    return [
        f"{path}:{insertion.class_name} -> {', '.join(insertion.traits)}"
        for insertion in insertions
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    repository_root = find_repository_root()
    all_changes: list[str] = []

    for test_project in enumerate_test_project_directories(repository_root):
        for path in sorted(test_project.rglob("*.cs")):
            if is_excluded(path):
                continue
            all_changes.extend(process_file(path, args.dry_run))

    for change in sorted(all_changes):
        print(change)

    print(f"\n{'Would update' if args.dry_run else 'Updated'} {len(all_changes)} test class(es).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
