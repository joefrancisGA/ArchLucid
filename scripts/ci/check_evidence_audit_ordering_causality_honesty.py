#!/usr/bin/env python3
"""TB-1551 / M-284: Anti-DB-sequence / anti-Lamport / anti-UI-as-forensic honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "evidence-audit-ordering-causality-honesty: allow"

CONTRACT_REL = Path("docs/library/EVIDENCE_AUDIT_ORDERING_CAUSALITY_CLAIM_MAP.md")
PA_ONE_PAGER_REL = Path(
    "docs/go-to-market/EVIDENCE_AUDIT_ORDERING_CAUSALITY_PA_ONE_PAGER.md"
)
AUDIT_QUERY_REL = Path("ArchLucid.Persistence/Sql/HotPathRelationalQueryShapes.cs")
AUDIT_UI_REL = Path(
    "archlucid-ui/src/app/(operator)/governance/audit/audit-ui-helpers.ts"
)

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1550**",
    "**TB-1551**",
    "M-284",
    "Too strong",
    "CI anchors for **TB-1551**",
    "OccurredUtc",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbidden",
    "too strong",
    "tb-1550",
    "tb-1551",
    "tb-1009",
    "m-284",
    "honesty guard",
    "non-claim",
    "≠",
    "best-effort",
    "wall-clock",
    "lifecycle",
    "re-sort",
    "append-only",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\baudit\b[^.\n]{0,40}\b(?:order|ordering|trail)\b[^.\n]{0,60}\b(?:is\s+)?(?:a\s+)?"
            r"(?:db\s+)?(?:sequence|insert\s+order|lamport)\b",
            re.IGNORECASE,
        ),
        "Audit order is wall-clock OccurredUtc + EventId — not sequence/Lamport (TB-1550).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:tenant\s+)?audit\b[^.\n]{0,60}\b(?:timestamps?|rows?)\b[^.\n]{0,40}\b"
            r"(?:are|is)\s+sql\s+sysutcdatetime\b",
            re.IGNORECASE,
        ),
        "Tenant audit OccurredUtc is app TimeProvider — not SQL SYSUTCDATETIME (TB-1550).",
    ),
    ClaimPattern(
        re.compile(
            r"\bevent\s*id\b[^.\n]{0,60}\b(?:proves?|guarantees?)\b[^.\n]{0,40}\bcaus",
            re.IGNORECASE,
        ),
        "EventId is a random GUID tie-break — not causal proof (TB-1550).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:buyer|audit)\s+ui\b[^.\n]{0,60}\b(?:is|equals?|represents?)\b[^.\n]{0,40}\b"
            r"(?:forensic|chronological)\s+order\b",
            re.IGNORECASE,
        ),
        "Buyer-polished audit UI may lifecycle re-sort — not forensic order (TB-1550).",
    ),
    ClaimPattern(
        re.compile(
            r"\bappend[-\s]only\b[^.\n]{0,60}\b(?:means?|implies?|guarantees?)\b[^.\n]{0,40}\b"
            r"(?:causal|hash[-\s]chained)\b[^.\n]{0,40}\baudit\b",
            re.IGNORECASE,
        ),
        "Append-only immutability ≠ causal/hash-chained audit rows (TB-1550 / ADR 0040).",
    ),
    ClaimPattern(
        re.compile(
            r"\bretry\b[^.\n]{0,40}\b(?:cannot|can'?t)\b[^.\n]{0,40}\b(?:mis[-\s]?order|reorder)\b[^.\n]{0,40}\bcaus",
            re.IGNORECASE,
        ),
        "Late persist with earlier stamp can invert perceived causality (TB-1550).",
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
        return [f"{CONTRACT_REL.as_posix()}: missing audit ordering/causality claim map (TB-1550)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1551)."
        )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, needles in (
        (AUDIT_QUERY_REL, ("OccurredUtc", "EventId")),
        (AUDIT_UI_REL, ("auditEventLifecycleSortKey",)),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing audit ordering code anchor (TB-1551).")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle in needles:
            if needle not in text:
                violations.append(f"{rel.as_posix()}: expected {needle!r} anchor (TB-1551).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing audit ordering honesty scan target."]
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


def evidence_audit_ordering_causality_honesty_violations(root: Path) -> list[str]:
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
    violations = evidence_audit_ordering_causality_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Evidence audit ordering/causality honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("Evidence audit ordering/causality honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
