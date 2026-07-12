#!/usr/bin/env python3
"""Fail CI when pdfStatus: public product documentation markdown is not buyer-safe for PDF export (TB-725)."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_TS = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "product-documentation-registry.ts"

ALLOWLIST_MARKER = "public-pdf-safety: allow"


@dataclass(frozen=True)
class PublicPdfRegistryEntry:
    slug: str
    source_paths: tuple[str, ...]
    section_anchors: tuple[str, ...]
    include_intro_with_sections: bool


@dataclass(frozen=True)
class SafetyViolation:
    slug: str
    source_path: str
    line_number: int
    message: str
    excerpt: str


def _parse_registry_entries(registry_text: str) -> list[PublicPdfRegistryEntry]:
    entries: list[PublicPdfRegistryEntry] = []

    for match in re.finditer(r'pdfStatus:\s*"public"', registry_text):
        block_start = registry_text.rfind("\n  {", 0, match.start())

        if block_start < 0:
            block_start = registry_text.find("{", 0, match.start())

        block_end = registry_text.find("\n  },", match.end())

        if block_end < 0:
            continue

        block = registry_text[block_start:block_end]
        slug_match = re.search(r'slug:\s*"([^"]+)"', block)

        if slug_match is None:
            continue

        source_paths = tuple(re.findall(r'"(docs/[^"]+\.md)"', block))
        anchors_match = re.search(r"sectionAnchors:\s*\[([^\]]*)\]", block, re.DOTALL)
        section_anchors: tuple[str, ...] = ()

        if anchors_match is not None:
            section_anchors = tuple(re.findall(r'"([^"]+)"', anchors_match.group(1)))

        include_intro = "includeIntroWithSections: true" in block

        entries.append(
            PublicPdfRegistryEntry(
                slug=slug_match.group(1),
                source_paths=source_paths,
                section_anchors=section_anchors,
                include_intro_with_sections=include_intro,
            )
        )

    return entries


def _strip_internal_engineering_batch_labels(markdown: str) -> str:
    lines: list[str] = []

    for line in markdown.split("\n"):
        cleaned = re.sub(r"\s*\(Change Set \d+[A-Z]\)", "", line, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*—\s*Change Set \d+[A-Z]", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*-\s*Change Set \d+[A-Z]", "", cleaned, flags=re.IGNORECASE)
        lines.append(cleaned)

    return "\n".join(lines)


def _strip_duplicate_markdown_title(markdown: str) -> str:
    lines = markdown.split("\n")
    index = 0

    while index < len(lines) and lines[index].strip() == "":
        index += 1

    if index < len(lines) and lines[index].startswith("# ") and not lines[index].startswith("## "):
        index += 1

    while index < len(lines) and lines[index].strip() == "":
        index += 1

    return "\n".join(lines[index:]).lstrip()


def _strip_leading_contributor_blockquote(markdown: str) -> str:
    lines = markdown.split("\n")
    index = 0

    while index < len(lines):
        line = lines[index]

        if line.strip() == "":
            index += 1
            continue

        if line.startswith("> "):
            index += 1
            continue

        break

    return "\n".join(lines[index:]).lstrip()


def _prepare_help_source_markdown(markdown: str) -> str:
    result = _strip_leading_contributor_blockquote(markdown)
    result = _strip_internal_engineering_batch_labels(result)
    result = _strip_duplicate_markdown_title(result)

    return result.lstrip()


def _extract_markdown_sections_by_anchor(
    markdown: str,
    section_anchors: tuple[str, ...],
    include_intro: bool,
) -> str:
    if len(section_anchors) == 0:
        return markdown

    anchor_set = {
        anchor.strip().lower()
        for anchor in section_anchors
        if anchor.strip() != ""
    }

    if len(anchor_set) == 0:
        return markdown

    lines = markdown.replace("\r\n", "\n").split("\n")
    intro_lines: list[str] = []
    sections: list[tuple[str, list[str]]] = []
    current_anchor = ""
    current_lines: list[str] | None = None
    index = 0

    while index < len(lines):
        line = lines[index]

        if line.startswith("## ") and not line.startswith("###"):
            if current_lines is not None:
                sections.append((current_anchor, current_lines))

            anchor_match = re.search(r"\{#([^}]+)\}", line)
            current_anchor = (anchor_match.group(1) if anchor_match else "").strip().lower()
            current_lines = [line]
            index += 1
            continue

        if current_lines is None:
            intro_lines.append(line)
        else:
            current_lines.append(line)

        index += 1

    if current_lines is not None:
        sections.append((current_anchor, current_lines))

    chunks: list[str] = []

    if include_intro:
        intro = "\n".join(intro_lines).strip()

        if intro != "":
            chunks.append(intro)

    for anchor, section_lines in sections:

        if anchor in anchor_set:
            chunks.append("\n".join(section_lines).strip())

    return "\n\n---\n\n".join(chunk for chunk in chunks if chunk != "")


def _read_repo_relative_markdown(relative_path: str, repo_root: Path) -> str | None:
    normalized = relative_path.lstrip("/").strip()

    if not normalized.startswith("docs/"):
        return None

    absolute = (repo_root / Path(normalized)).resolve()
    repo_resolved = repo_root.resolve()

    try:
        absolute.relative_to(repo_resolved)
    except ValueError:
        return None

    if not absolute.is_file():
        return None

    return absolute.read_text(encoding="utf-8").replace("\r\n", "\n")


def resolve_public_pdf_markdown(entry: PublicPdfRegistryEntry, repo_root: Path) -> str:
    chunks: list[str] = []

    for source_path in entry.source_paths:
        body = _read_repo_relative_markdown(source_path, repo_root)

        if body is not None and body.strip() != "":
            chunks.append(_prepare_help_source_markdown(body))

    if len(chunks) == 0:
        raise FileNotFoundError(
            f'No markdown sources resolved for public PDF slug "{entry.slug}".',
        )

    markdown = "\n\n---\n\n".join(chunks)

    if len(entry.section_anchors) > 0:
        markdown = _extract_markdown_sections_by_anchor(
            markdown,
            entry.section_anchors,
            entry.include_intro_with_sections,
        )

    return markdown


_RELATIVE_INTERNAL_ROUTE = re.compile(
    r"(?:^|[\s(\[`'\"])(/(?:api|v1)/)",
    re.IGNORECASE,
)

_SOURCE_FILE_PATH = re.compile(
    r"(?:^|[\s(\[`'\"])([\w./\\-]+\.(?:cs|ts|tsx|csproj))\b",
    re.IGNORECASE,
)

_INTERNAL_SECTION_LABEL = re.compile(r"^##\s+Internal(?:\s|$)", re.IGNORECASE | re.MULTILINE)

_LOCALHOST = re.compile(r"\blocalhost\b", re.IGNORECASE)

_ENV_VAR = re.compile(
    r"\b(?:ARCHLUCID_[A-Z0-9_]+|NEXT_PUBLIC_[A-Z0-9_]+|ConnectionStrings:[A-Za-z0-9]+)\b",
)

_CODE_NAME = re.compile(
    r"(?:`|\b)(ArchLucid\.[A-Za-z0-9_.]+|`[A-Z][A-Za-z0-9]+(?:Controller|Service|Repository|Options|Extensions)`|\b[A-Z][A-Za-z0-9]+Controller\b)",
)


def _line_has_allow_marker(line: str) -> bool:
    return ALLOWLIST_MARKER in line


def _scan_line_for_violations(line: str) -> list[str]:
    if _line_has_allow_marker(line):
        return []

    violations: list[str] = []

    if _RELATIVE_INTERNAL_ROUTE.search(line) is not None:
        violations.append("internal API route path (/api/ or /v1/)")

    if _SOURCE_FILE_PATH.search(line) is not None:
        violations.append("source file path (.cs/.ts/.tsx/.csproj)")

    if _INTERNAL_SECTION_LABEL.search(line) is not None:
        violations.append('"Internal" H2 section label')

    if _LOCALHOST.search(line) is not None:
        violations.append("localhost reference")

    if _ENV_VAR.search(line) is not None:
        violations.append("environment-variable-looking string")

    if _CODE_NAME.search(line) is not None:
        violations.append("internal code name")

    return violations


def scan_public_pdf_markdown(
    *,
    slug: str,
    source_path: str,
    markdown: str,
) -> list[SafetyViolation]:
    violations: list[SafetyViolation] = []

    for line_number, line in enumerate(markdown.split("\n"), start=1):
        for message in _scan_line_for_violations(line):
            excerpt = line.strip()

            if len(excerpt) > 160:
                excerpt = f"{excerpt[:157]}..."

            violations.append(
                SafetyViolation(
                    slug=slug,
                    source_path=source_path,
                    line_number=line_number,
                    message=message,
                    excerpt=excerpt,
                )
            )

    return violations


def public_pdf_safety_violations(root: Path | None = None) -> list[SafetyViolation]:
    repo = root or REPO_ROOT
    registry_path = repo / REGISTRY_TS.relative_to(REPO_ROOT)

    if not registry_path.is_file():
        raise FileNotFoundError(registry_path)

    registry_text = registry_path.read_text(encoding="utf-8")
    violations: list[SafetyViolation] = []

    for entry in _parse_registry_entries(registry_text):
        try:
            markdown = resolve_public_pdf_markdown(entry, repo)
        except FileNotFoundError as ex:
            violations.append(
                SafetyViolation(
                    slug=entry.slug,
                    source_path=",".join(entry.source_paths),
                    line_number=0,
                    message=str(ex),
                    excerpt="",
                )
            )
            continue

        primary_source = entry.source_paths[0] if len(entry.source_paths) > 0 else entry.slug
        violations.extend(
            scan_public_pdf_markdown(
                slug=entry.slug,
                source_path=primary_source,
                markdown=markdown,
            )
        )

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=REPO_ROOT,
        help="Repository root (defaults to monorepo root).",
    )
    args = parser.parse_args(argv)

    violations = public_pdf_safety_violations(args.repo_root)

    if violations:
        print("check_public_pdf_safety: FAILED", file=sys.stderr)

        for violation in violations:
            location = (
                f"{violation.source_path}:{violation.line_number}"
                if violation.line_number > 0
                else violation.source_path
            )
            print(
                f"  - [{violation.slug}] {location}: {violation.message}"
                + (f' — "{violation.excerpt}"' if violation.excerpt else ""),
                file=sys.stderr,
            )

        print(
            f"Fix buyer-unsafe copy or add `{ALLOWLIST_MARKER}` on the intentional line.",
            file=sys.stderr,
        )

        return 1

    print("check_public_pdf_safety: OK")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
