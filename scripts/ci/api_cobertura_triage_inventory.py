#!/usr/bin/env python3
"""TB-635: classify ArchLucid.Api Cobertura gap classes against ArchLucid.Api.Tests."""

from __future__ import annotations

import argparse
import re
import sys
from collections import Counter
from dataclasses import dataclass
from datetime import date
from pathlib import Path

_GAP_ROW_RE = re.compile(
    r"^\| (\d+) \| `([^`]+)` \| `([^`]+)` \| ([0-9.]+) \| (\d+) \|",
    re.MULTILINE,
)

_TRAIT_CATEGORY_RE = re.compile(
    r'\[\s*Trait\s*\(\s*"Category"\s*,\s*"([^"]+)"\s*\)\s*\]',
)

_PURE_DTO_NAME_SUFFIXES = (
    "Request",
    "Response",
    "Dto",
    "ItemResult",
    "FeatureState",
)

_SMALL_LOGIC_NAME_MARKERS = (
    "Validator",
    "Mapper",
    "Patterns",
    "Parser",
    "Formatter",
    "Transformer",
)

_INVENTORY_START = "<!-- TB-635-API-COBERTURA-TRIAGE-START -->"
_INVENTORY_END = "<!-- TB-635-API-COBERTURA-TRIAGE-END -->"


@dataclass(frozen=True)
class GapClassRow:
    rank: int
    type_name: str
    file_path: str
    line_pct: float
    uncovered_lines: int


@dataclass(frozen=True)
class TestFileIndexEntry:
    relative_path: str
    categories: frozenset[str]
    content: str


@dataclass(frozen=True)
class ClassifiedRow:
    row: GapClassRow
    bucket: str
    test_refs: tuple[str, ...]


def find_repository_root() -> Path:
    current = Path(__file__).resolve().parent
    for directory in [current, *current.parents]:
        if (directory / "ArchLucid.sln").is_file():
            return directory
    raise RuntimeError("ArchLucid.sln not found.")


def parse_api_gap_section(markdown: str) -> list[GapClassRow]:
    api_start = markdown.find("### ArchLucid.Api ")
    if api_start < 0:
        raise RuntimeError("ArchLucid.Api section not found in gap analysis.")

    table_anchor = "#### All classes below 95% line coverage"
    table_start = markdown.find(table_anchor, api_start)
    if table_start < 0:
        raise RuntimeError("ArchLucid.Api full gap table not found in gap analysis.")

    section_end = markdown.find(_INVENTORY_START, table_start)
    if section_end < 0:
        section_end = markdown.find("\n### ArchLucid.", table_start + len(table_anchor))

    if section_end < 0:
        api_section = markdown[table_start:]
    else:
        api_section = markdown[table_start:section_end]

    rows: list[GapClassRow] = []
    for match in _GAP_ROW_RE.finditer(api_section):
        rows.append(
            GapClassRow(
                rank=int(match.group(1)),
                type_name=match.group(2),
                file_path=match.group(3),
                line_pct=float(match.group(4)),
                uncovered_lines=int(match.group(5)),
            ),
        )

    if len(rows) == 0:
        raise RuntimeError("No ArchLucid.Api gap rows parsed.")

    return rows


def build_api_test_index(tests_root: Path) -> list[TestFileIndexEntry]:
    entries: list[TestFileIndexEntry] = []

    if not tests_root.is_dir():
        return entries

    for path in sorted(tests_root.rglob("*.cs")):
        content = path.read_text(encoding="utf-8")
        categories = frozenset(_TRAIT_CATEGORY_RE.findall(content))
        entries.append(
            TestFileIndexEntry(
                relative_path=path.relative_to(tests_root).as_posix(),
                categories=categories,
                content=content,
            ),
        )

    return entries


def short_type_name(type_name: str) -> str:
    return type_name.rsplit(".", 1)[-1]


def reference_terms(type_name: str) -> set[str]:
    short = short_type_name(type_name)
    terms = {short, type_name}

    if short.endswith("Controller"):
        terms.add(short[: -len("Controller")])

    return terms


def find_test_references(type_name: str, index: list[TestFileIndexEntry]) -> list[TestFileIndexEntry]:
    terms = reference_terms(type_name)
    matches: list[TestFileIndexEntry] = []

    for entry in index:
        if any(term in entry.content for term in terms):
            matches.append(entry)

    return matches


def read_source_text(repo_root: Path, relative_file: str) -> str | None:
    normalized = relative_file.replace("\\", "/")
    candidates = [
        repo_root / normalized,
        repo_root / "ArchLucid.Api" / normalized.removeprefix("ArchLucid.Api/"),
    ]

    for path in candidates:
        if path.is_file():
            return path.read_text(encoding="utf-8")

    return None


def looks_like_auto_property_dto(source_text: str, short_name: str) -> bool:
    if any(short_name.endswith(suffix) for suffix in _PURE_DTO_NAME_SUFFIXES):
        if "public " in source_text and " get;" in source_text and " set;" in source_text:
            if re.search(r"\b(if|while|for|foreach|switch|return\s+[^;]+;)\b", source_text) is None:
                return True

    if "[ExcludeFromCodeCoverage" in source_text and "DTO" in source_text:
        return True

    return False


def has_integration_reference(refs: list[TestFileIndexEntry]) -> bool:
    return any("Integration" in entry.categories for entry in refs)


def has_unit_reference(refs: list[TestFileIndexEntry]) -> bool:
    return any("Unit" in entry.categories for entry in refs)


def looks_like_small_logic_surface(type_name: str, file_path: str) -> bool:
    short = short_type_name(type_name)
    haystack = f"{type_name} {file_path}"

    return any(marker in haystack for marker in _SMALL_LOGIC_NAME_MARKERS)


def classify_gap_row(
    row: GapClassRow,
    repo_root: Path,
    test_index: list[TestFileIndexEntry],
) -> ClassifiedRow:
    short = short_type_name(row.type_name)
    source_text = read_source_text(repo_root, row.file_path)
    test_refs = find_test_references(row.type_name, test_index)
    ref_labels = tuple(
        f"{entry.relative_path} ({', '.join(sorted(entry.categories)) or 'no Category trait'})"
        for entry in test_refs[:3]
    )

    if source_text is not None and looks_like_auto_property_dto(source_text, short):
        return ClassifiedRow(row=row, bucket="pure-DTO", test_refs=ref_labels)

    if has_integration_reference(test_refs):
        return ClassifiedRow(row=row, bucket="integration-covered", test_refs=ref_labels)

    if looks_like_small_logic_surface(row.type_name, row.file_path) and (
        has_unit_reference(test_refs) or source_text is not None
    ):
        return ClassifiedRow(row=row, bucket="small-logic", test_refs=ref_labels)

    if has_unit_reference(test_refs):
        return ClassifiedRow(row=row, bucket="small-logic", test_refs=ref_labels)

    return ClassifiedRow(row=row, bucket="genuinely-untested", test_refs=ref_labels)


def classify_api_gap_rows(
    rows: list[GapClassRow],
    repo_root: Path,
    test_index: list[TestFileIndexEntry],
) -> list[ClassifiedRow]:
    return [classify_gap_row(row, repo_root, test_index) for row in rows]


def render_inventory_markdown(classified: list[ClassifiedRow], generated_on: date) -> str:
    counts = Counter(item.bucket for item in classified)
    lines = [
        _INVENTORY_START,
        "",
        f"#### TB-635 Cobertura triage inventory (generated {generated_on.isoformat()})",
        "",
        "Owner-classified inventory for **ArchLucid.Api** classes below 95% line coverage in merged Cobertura.",
        "Prerequisite for **TB-636**–**TB-639**; regenerate with "
        "`python scripts/ci/api_cobertura_triage_inventory.py --write-inventory`.",
        "",
        "| Bucket | Count | Follow-up |",
        "|--------|------:|-----------|",
        f"| pure-DTO | {counts.get('pure-DTO', 0)} | **TB-636** `[ExcludeFromCodeCoverage]` batch |",
        f"| integration-covered | {counts.get('integration-covered', 0)} | **TB-638** measurement-gap doc |",
        f"| small-logic | {counts.get('small-logic', 0)} | **TB-637** cheap unit tests |",
        f"| genuinely-untested | {counts.get('genuinely-untested', 0)} | **TB-639** post-triage tests |",
        "",
        "| Bucket | Class | Line % | Test references (sample) |",
        "|--------|-------|-------:|--------------------------|",
    ]

    for item in classified:
        sample = "; ".join(item.test_refs) if len(item.test_refs) > 0 else "—"
        lines.append(
            f"| {item.bucket} | `{item.row.type_name}` | {item.row.line_pct:.2f} | {sample} |",
        )

    lines.extend(["", _INVENTORY_END, ""])
    return "\n".join(lines)


def upsert_inventory_section(markdown: str, inventory_block: str) -> str:
    if _INVENTORY_START in markdown and _INVENTORY_END in markdown:
        start = markdown.index(_INVENTORY_START)
        end = markdown.index(_INVENTORY_END) + len(_INVENTORY_END)
        return markdown[:start] + inventory_block.rstrip() + markdown[end:]

    anchor = "\n### ArchLucid.Host.Core "
    anchor_index = markdown.find(anchor)
    if anchor_index < 0:
        raise RuntimeError("ArchLucid.Host.Core anchor not found for inventory insertion.")

    return markdown[:anchor_index] + inventory_block + anchor


def render_coverage_exclusions_appendix(classified: list[ClassifiedRow]) -> str:
    counts = Counter(item.bucket for item in classified)
    return (
        "\n## ArchLucid.Api Cobertura triage (TB-635)\n\n"
        "Merged Cobertura understates **ArchLucid.Api** integration coverage because Integration-category "
        "tests run on shards without Coverlet (`test.runsettings`). The classified inventory lives in "
        "[`COVERAGE_GAP_ANALYSIS.md`](../COVERAGE_GAP_ANALYSIS.md) under "
        "**TB-635 Cobertura triage inventory**.\n\n"
        f"| Bucket | Count |\n|--------|------:|\n"
        f"| pure-DTO | {counts.get('pure-DTO', 0)} |\n"
        f"| integration-covered | {counts.get('integration-covered', 0)} |\n"
        f"| small-logic | {counts.get('small-logic', 0)} |\n"
        f"| genuinely-untested | {counts.get('genuinely-untested', 0)} |\n"
    )


def upsert_coverage_exclusions_appendix(markdown: str, appendix: str) -> str:
    marker = "## ArchLucid.Api Cobertura triage (TB-635)"
    if marker in markdown:
        start = markdown.index(marker)
        next_heading = markdown.find("\n## ", start + len(marker))
        if next_heading < 0:
            return markdown[:start] + appendix.rstrip() + "\n"
        return markdown[:start] + appendix.rstrip() + "\n" + markdown[next_heading:]

    return markdown.rstrip() + "\n" + appendix


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--write-inventory",
        action="store_true",
        help="Write inventory into COVERAGE_GAP_ANALYSIS.md and coverage-exclusions.md",
    )
    parser.add_argument(
        "--print-summary",
        action="store_true",
        help="Print bucket counts to stdout",
    )
    args = parser.parse_args(argv)

    if not args.write_inventory and not args.print_summary:
        parser.error("Specify --write-inventory and/or --print-summary.")

    repo_root = find_repository_root()
    gap_path = repo_root / "docs" / "COVERAGE_GAP_ANALYSIS.md"
    exclusions_path = repo_root / "docs" / "library" / "coverage-exclusions.md"
    tests_root = repo_root / "ArchLucid.Api.Tests"

    gap_markdown = gap_path.read_text(encoding="utf-8")
    rows = parse_api_gap_section(gap_markdown)
    test_index = build_api_test_index(tests_root)
    classified = classify_api_gap_rows(rows, repo_root, test_index)
    inventory = render_inventory_markdown(classified, date.today())
    counts = Counter(item.bucket for item in classified)

    if args.print_summary:
        for bucket in ("pure-DTO", "integration-covered", "small-logic", "genuinely-untested"):
            print(f"{bucket}: {counts.get(bucket, 0)}")

    if args.write_inventory:
        gap_path.write_text(upsert_inventory_section(gap_markdown, inventory), encoding="utf-8", newline="\n")
        exclusions_markdown = exclusions_path.read_text(encoding="utf-8")
        exclusions_path.write_text(
            upsert_coverage_exclusions_appendix(
                exclusions_markdown,
                render_coverage_exclusions_appendix(classified),
            ),
            encoding="utf-8",
            newline="\n",
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
