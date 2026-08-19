#!/usr/bin/env python3
"""TB-1264 / M-219: Anti-EF-fixes-tenancy / ORM-under-duress honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "dapper-ddl-satellite-breakdown-signals-honesty: allow"

CONTRACT_REL = Path("docs/library/DAPPER_DDL_SATELLITE_BREAKDOWN_SIGNALS_CONTRACT.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/DAPPER_DDL_SATELLITE_BREAKDOWN_SIGNALS_PA_ONE_PAGER.md")
MANIFEST_REPO_REL = Path("ArchLucid.Persistence/Repositories/SqlGoldenManifestRepository.cs")
QUERY_SHAPES_REL = Path("ArchLucid.Persistence/Sql/HotPathRelationalQueryShapes.cs")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1263**",
    "**TB-1264**",
    "M-219",
    "Forbidden claims",
    "CI anchors for **TB-1264**",
    "HotPathRelationalQueryShapes",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbidden",
    "too strong",
    "strategy ladder",
    "tb-1263",
    "tb-1264",
    "m-219",
    "honesty guard",
    "non-claim",
    "hand-written",
    "≠",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:entity\s+framework|ef\s+core|an?\s+orm)\b[^.\n]{0,80}\b(?:fixes?|solves?|guarantees?)\b"
            r"[^.\n]{0,60}\b(?:tenant\s+)?isolation\b",
            re.IGNORECASE,
        ),
        "ORM does not substitute for ADR 0037 catalog isolation — ladder first (TB-1263).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:entity\s+framework|ef\s+core|an?\s+orm)\b[^.\n]{0,80}\b(?:fixes?|solves?|enforces?)\b"
            r"[^.\n]{0,60}\b(?:deny|sealed|immutab|append-only)\b",
            re.IGNORECASE,
        ),
        "DENY/sealed evidence is ADR 0039/0045 — not an ORM migration (TB-1263).",
    ),
    ClaimPattern(
        re.compile(
            r"\bdual[-\s]write\b[^.\n]{0,60}\bsatellites?\b[^.\n]{0,80}\b(?:halfway|already)\b"
            r"[^.\n]{0,40}\b(?:to\s+)?(?:an?\s+)?orm\b",
            re.IGNORECASE,
        ),
        "Dual-write satellites are intentional provenance — not halfway to ORM (TB-1263).",
    ),
    ClaimPattern(
        re.compile(
            r"\bjson\s+columns?\b[^.\n]{0,80}\b(?:prove|means?|shows?)\b[^.\n]{0,40}\bdapper\b[^.\n]{0,40}\bfailed\b",
            re.IGNORECASE,
        ),
        "JSON columns are compatibility layer — measure LOB/list pain before ORM debate (TB-1263).",
    ),
    ClaimPattern(
        re.compile(
            r"\badopt\s+(?:an?\s+)?(?:entity\s+framework|ef\s+core|orm)\b[^.\n]{0,60}\b(?:now|immediately|next)\b",
            re.IGNORECASE,
        ),
        "Adopt ORM only after ladder + metrics + new ADR — not under duress (TB-1263).",
    ),
    ClaimPattern(
        re.compile(
            r"\bdapper\b[^.\n]{0,60}\b(?:is\s+)?(?:temporary|until)\b[^.\n]{0,40}\b(?:we\s+get|an?\s+)?orm\b",
            re.IGNORECASE,
        ),
        "Dapper + single DDL is intentional — not a temporary stopgap until ORM (TB-1263).",
    ),
)


def _missing_markers(text: str, markers: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    return [marker for marker in markers if marker.lower() not in lowered]


def _line_for_match(text: str, match: re.Match[str]) -> str:
    line_start = text.rfind("\n", 0, match.start()) + 1
    line_end = text.find("\n", match.start())
    return text[line_start:] if line_end == -1 else text[line_start:line_end]


def _line_has_caveat(line_lower: str) -> bool:
    return any(marker in line_lower for marker in _CAVEAT_MARKERS)


def _line_is_allowlisted(line: str) -> bool:
    return ALLOWLIST_MARKER in line.lower()


def _is_markdown_table_data_row(line: str) -> bool:
    stripped = line.lstrip()
    if not stripped.startswith("|"):
        return False
    if re.match(r"^\|[\s|:-]+$", stripped):
        return False
    return stripped.count("|") >= 3


def _match_is_quoted_forbidden_example(line: str, match_start: int, match_end: int) -> bool:
    for open_quote, close_quote in (('"', '"'), ("\u201c", "\u201d"), ("\u2018", "\u2019")):
        cursor = 0
        while cursor < len(line):
            open_index = line.find(open_quote, cursor)
            if open_index < 0:
                break
            close_index = line.find(close_quote, open_index + len(open_quote))
            if close_index < 0:
                break
            quoted_end = close_index + len(close_quote)
            if open_index <= match_start and match_end <= quoted_end:
                return True
            cursor = quoted_end
    return False


def _line_is_forbidden_example(line: str, match_start: int, match_end: int) -> bool:
    if _match_is_quoted_forbidden_example(line, match_start, match_end):
        return True
    stripped = line.lstrip().lower()
    if stripped.startswith(("-", "*")) and ('no "' in stripped or "no \u201c" in stripped):
        return True
    if _is_markdown_table_data_row(line):
        return True
    if stripped.startswith("|") and (
        "unsafe" in stripped or "forbid" in stripped or "too strong" in stripped or "ci anchors" in stripped
    ):
        return True
    return False


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL
    if not path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing Dapper breakdown signals contract (TB-1263)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1264)."
        )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, symbol in (
        (MANIFEST_REPO_REL, "SqlGoldenManifestRepository"),
        (QUERY_SHAPES_REL, "HotPathRelationalQueryShapes"),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing Dapper ladder code anchor (TB-1264).")
            continue
        if symbol not in path.read_text(encoding="utf-8", errors="replace"):
            violations.append(f"{rel.as_posix()}: expected {symbol!r} anchor (TB-1264).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing Dapper breakdown honesty scan target."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for claim in CLAIM_PATTERNS:
        for match in claim.pattern.finditer(text):
            line = _line_for_match(text, match)
            line_lower = line.lower()
            line_start = text.rfind("\n", 0, match.start()) + 1
            match_start_in_line = match.start() - line_start
            match_end_in_line = match.end() - line_start
            if (
                _line_is_allowlisted(line)
                or _line_is_forbidden_example(line, match_start_in_line, match_end_in_line)
                or _line_has_caveat(line_lower)
            ):
                continue
            violations.append(f"{rel.as_posix()}: {claim.message} Matched `{match.group(0)}`.")
    return violations


def dapper_ddl_satellite_breakdown_signals_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(code_anchor_violations(root))
    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))
    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)
    violations = dapper_ddl_satellite_breakdown_signals_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Dapper DDL satellite breakdown honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("Dapper DDL satellite breakdown honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
