#!/usr/bin/env python3
"""TB-1417 / M-253: Anti-decide-once-equals-package-truth / triad-closed honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "decide-once-triad-honesty: allow"

CONTRACT_REL = Path(
    "docs/library/INV001_DECIDE_ONCE_COMMITTED_MANIFEST_PA_TRIAD_CHALLENGE_MATRIX.md"
)
PA_ONE_PAGER_REL = Path(
    "docs/go-to-market/INV001_DECIDE_ONCE_COMMITTED_MANIFEST_PA_TRIAD_ONE_PAGER.md"
)
SCOPE_CONTEXT_REL = Path("ArchLucid.Core/Scoping/ScopeContext.cs")
MANIFEST_HASH_REL = Path("ArchLucid.Decisioning/Services/ManifestHashService.cs")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1416**",
    "**TB-1417**",
    "M-253",
    "Explicit non-claims",
    "CI anchors for **TB-1417**",
    "INV-001",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "not equate",
    "not sell",
    "forbidden",
    "too strong",
    "tb-1416",
    "tb-1417",
    "tb-999",
    "tb-1003",
    "m-253",
    "honesty guard",
    "non-claim",
    "≠",
    "separately bounded",
    "residual",
    "not closed",
    "remain open",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\binv[-\s]?001\b[^.\n]{0,80}\b(?:means?|equals?|is)\b[^.\n]{0,60}\b"
            r"(?:the\s+)?architecture\b[^.\n]{0,40}\b(?:was\s+)?decided\s+once\b",
            re.IGNORECASE,
        ),
        "INV-001 is tenant scope decide-once — not architecture decided once (TB-1416).",
    ),
    ClaimPattern(
        re.compile(
            r"\bdecide[-\s]once\b[^.\n]{0,80}\b(?:means?|equals?|proves?)\b[^.\n]{0,60}\b"
            r"(?:the\s+)?(?:signed|committed|finalized)\b[^.\n]{0,40}\bpackage\b",
            re.IGNORECASE,
        ),
        "Decide-once vocabulary must not fuse with committed package truth (TB-1416).",
    ),
    ClaimPattern(
        re.compile(
            r"\bcommitted\b[^.\n]{0,40}\b(?:golden\s+)?manifest\b[^.\n]{0,80}\bproves?\b[^.\n]{0,60}\b"
            r"(?:semantic\s+)?(?:faithful|evidence[-\s]grounded|zero\s+agent|no\s+overlay|crypto)",
            re.IGNORECASE,
        ),
        "Committed manifest = finalization identity + hash lineage — not content purity (TB-1003).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:triad|inv[-\s]?001\s+triad)\b[^.\n]{0,60}\b(?:is\s+)?(?:fully\s+)?"
            r"(?:closed|complete|done|shipped|solved)\b",
            re.IGNORECASE,
        ),
        "Do not sell the decide-once / committed-manifest triad as closed (TB-1416 / M-253).",
    ),
    ClaimPattern(
        re.compile(
            r"\bcommitted\b[^.\n]{0,60}\b(?:package|manifest)\b[^.\n]{0,60}\b"
            r"(?:proves?|guarantees?)\b[^.\n]{0,40}\b(?:crypto|tenant)\s+isolation\b",
            re.IGNORECASE,
        ),
        "Committed manifest does not prove crypto tenant isolation (TB-1416).",
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
        return [f"{CONTRACT_REL.as_posix()}: missing INV-001 triad challenge matrix (TB-1416)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1417)."
        )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, needles in (
        (SCOPE_CONTEXT_REL, ("ScopeContext",)),
        (MANIFEST_HASH_REL, ("ManifestHashService", "ManifestDocument")),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing decide-once triad code anchor (TB-1417).")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle in needles:
            if needle not in text:
                violations.append(f"{rel.as_posix()}: expected {needle!r} anchor (TB-1417).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing decide-once triad honesty scan target."]
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


def decide_once_triad_honesty_violations(root: Path) -> list[str]:
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
    violations = decide_once_triad_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Decide-once triad honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("Decide-once triad honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
