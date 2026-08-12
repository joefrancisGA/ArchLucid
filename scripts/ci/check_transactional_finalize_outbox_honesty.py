#!/usr/bin/env python3
"""TB-1012 / M-162: Anti-committed-equals-indexed / all-audit-transactional honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "transactional-finalize-outbox-honesty: allow"

CONTRACT_REL = Path("docs/library/TRANSACTIONAL_FINALIZE_VS_OUTBOX_CONTRACT.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/TRANSACTIONAL_FINALIZE_VS_OUTBOX_PA_ONE_PAGER.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1011**",
    "**TB-1012**",
    "M-162",
    "M-163",
    "Non-claims",
    "CI anchors for **TB-1012**",
    "Never silent best-effort",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbidden",
    "too strong",
    "may lag",
    "disclose",
    "informational",
    "required vs",
    "tb-1011",
    "tb-1012",
    "m-162",
    "m-163",
    "honesty guard",
    "non-claim",
    "at-least-once",
    "follow-on honesty",
    "≠",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\bcommit(?:\s+success|\s+succeeds?|ted)?\b[^.\n]{0,80}\b(?:means?|implies?|guarantees?)\b[^.\n]{0,60}\b"
            r"(?:search\s+)?indexed\b",
            re.IGNORECASE,
        ),
        "Commit seals package + enqueues intent — Search indexing may lag (TB-1011 / M-162).",
    ),
    ClaimPattern(
        re.compile(
            r"\bcommit(?:\s+success|\s+succeeds?|ted)?\b[^.\n]{0,80}\b(?:means?|implies?|guarantees?)\b[^.\n]{0,60}\b"
            r"(?:webhook|ticket|itsm)\b[^.\n]{0,40}\bdelivered\b",
            re.IGNORECASE,
        ),
        "Integration delivery is async outbox work — not proven by commit alone (TB-1011).",
    ),
    ClaimPattern(
        re.compile(
            r"\bcommit(?:\s+success|\s+succeeds?|ted)?\b[^.\n]{0,80}\b(?:means?|implies?|guarantees?)\b[^.\n]{0,60}\b"
            r"(?:cosmos|graph|projection)\b[^.\n]{0,40}\b(?:projected|updated|current)\b",
            re.IGNORECASE,
        ),
        "Cosmos/graph projections lag finalize — cite outbox/async split (TB-1011).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:every|all)\s+audit\b[^.\n]{0,60}\b(?:is\s+)?transactional\b",
            re.IGNORECASE,
        ),
        "Required vs informational audit split — not every event is transactional (INV-003 / TB-001).",
    ),
    ClaimPattern(
        re.compile(
            r"\bno\s+best[-\s]effort\s+audit\b",
            re.IGNORECASE,
        ),
        "Informational audit may be best-effort — disclose Required vs informational (TB-1011).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:every|all)\s+outbox\b[^.\n]{0,60}\b(?:enqueue|intent)\b[^.\n]{0,60}\b(?:is\s+)?fail[-\s]closed\b",
            re.IGNORECASE,
        ),
        "Integration enqueue has Try* fail-open residual — distinguish retrieval vs integration (TB-1011 §6).",
    ),
    ClaimPattern(
        re.compile(
            r"\bexactly[-\s]once\b[^.\n]{0,60}\b(?:integration|webhook|delivery)\b[^.\n]{0,60}\bon\s+commit\b",
            re.IGNORECASE,
        ),
        "Delivery is at-least-once with consumer idempotency — not exactly-once on commit (TB-992).",
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
        "unsafe" in stripped
        or "forbid" in stripped
        or "too strong" in stripped
        or "intended fail" in stripped
        or "ci anchors" in stripped
    ):
        return True

    return False


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL

    if not path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing transactional finalize vs outbox contract (TB-1011)."]

    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1012)."
        )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing transactional finalize outbox honesty scan target."]

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


def transactional_finalize_outbox_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))

    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)

    violations = transactional_finalize_outbox_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Transactional finalize outbox honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Transactional finalize outbox honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
