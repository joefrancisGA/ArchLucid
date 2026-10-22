#!/usr/bin/env python3
"""TB-994 / M-144: Outbox at-least-once honesty CI.

Fails dishonest stubs that:
- Claim exactly-once delivery or exactly-once integration events without caveat.
- Claim duplicate-proof eventing for Service Bus / outbox paths.

Contract: docs/library/TRANSACTIONAL_OUTBOX_REPLAY_VS_IDEMPOTENCY_CONTRACT.md (TB-992).
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "outbox-exactly-once-honesty: allow"

CONTRACT_REL = Path("docs/library/TRANSACTIONAL_OUTBOX_REPLAY_VS_IDEMPOTENCY_CONTRACT.md")
CATALOG_REL = Path("docs/library/INTEGRATION_EVENT_CATALOG.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    CATALOG_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-992**",
    "at-least-once",
    "MessageId",
    "MarkProcessedAsync",
    "Exactly-once integration events",
)

REQUIRED_CATALOG_MARKERS: tuple[str, ...] = (
    "TRANSACTIONAL_OUTBOX_REPLAY_VS_IDEMPOTENCY_CONTRACT.md",
    "TB-992",
    "Handle duplicates",
    "idempotent",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "never ",
    "not promise",
    "not claim",
    "too strong",
    "forbidden",
    "anti-claim",
    "do-not-promise",
    "does not",
    "doesn't",
    "cannot",
    "can't",
    "not ",
    "no ",
    "unsafe",
    "honest",
    "at-least-once",
    "at least once",
    "tb-992",
    "tb-993",
    "tb-994",
    "m-144",
    "m-145",
    "replay",
    "idempotent",
    "duplicate detection",
    "short",
    "window",
    "consumer",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str
    source_of_truth: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(r"\bexactly-once\s+delivery\b", re.IGNORECASE),
        "Do not claim exactly-once delivery for outbox / Service Bus paths (TB-992 / M-144).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(r"\bexactly-once\s+integration\s+events?\b", re.IGNORECASE),
        "Do not claim exactly-once integration events (TB-992 / M-145).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(r"\bduplicate-proof\s+eventing\b", re.IGNORECASE),
        "Do not claim duplicate-proof eventing — consumers must be idempotent (TB-992).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bservice\s+bus\b[^.\n]{0,120}\b(?:dedupe|dedup)\w*\b[^.\n]{0,80}\bforever\b",
            re.IGNORECASE,
        ),
        "Service Bus duplicate detection is a short broker window, not forever dedupe (TB-992).",
        CONTRACT_REL.as_posix(),
    ),
)


def _normalize_line(line: str) -> str:
    normalized = line

    for marker in ("*", "_", "`"):
        normalized = normalized.replace(marker, "")

    return normalized.lower()


def _line_for_match(text: str, match: re.Match[str]) -> str:
    line_start = text.rfind("\n", 0, match.start()) + 1
    line_end = text.find("\n", match.start())

    if line_end == -1:
        line_end = len(text)

    return text[line_start:line_end]


def _match_is_quoted_forbidden_example(line: str, match: re.Match[str]) -> bool:
    if "|" not in line:
        return False

    parts = line.split("|")

    if len(parts) < 4:
        return False

    cells = [part.strip() for part in parts[1:-1]]

    if len(cells) < 2:
        return False

    for cell in cells:
        for open_quote, close_quote in (('"', '"'), ("“", "”")):
            open_index = cell.find(open_quote)

            if open_index < 0:
                continue

            close_index = cell.find(close_quote, open_index + len(open_quote))

            if close_index < 0:
                continue

            cell_start = line.find(cell)

            if cell_start < 0:
                continue

            quoted_start = cell_start + open_index
            quoted_end = cell_start + close_index + len(close_quote)

            if quoted_start <= match.start() and match.end() <= quoted_end:
                return True

    return False


def _line_is_forbidden_example(line: str, match: re.Match[str]) -> bool:
    if _match_is_quoted_forbidden_example(line, match):
        return True

    stripped = line.lstrip().lower()

    if stripped.startswith(("-", "*")) and ('no "' in stripped or "no “" in stripped):
        return True

    if stripped.startswith("|") and "unsafe" in stripped.lower():
        return True

    return False


def _line_has_caveat(line_lower: str) -> bool:
    return any(marker in line_lower for marker in _CAVEAT_MARKERS)


def _line_is_allowlisted(line: str) -> bool:
    return ALLOWLIST_MARKER in line.lower()


def _missing_markers(text: str, markers: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    missing: list[str] = []

    for marker in markers:
        if marker.lower() not in lowered:
            missing.append(marker)

    return missing


def contract_violations(root: Path) -> list[str]:
    violations: list[str] = []
    contract_path = root / CONTRACT_REL

    if not contract_path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing outbox replay contract (TB-992)"]

    text = contract_path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required contract marker {marker!r} (TB-992 / TB-994)."
        )

    return violations


def catalog_violations(root: Path) -> list[str]:
    violations: list[str] = []
    catalog_path = root / CATALOG_REL

    if not catalog_path.is_file():
        return [f"{CATALOG_REL.as_posix()}: missing integration event catalog"]

    text = catalog_path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_CATALOG_MARKERS):
        violations.append(
            f"{CATALOG_REL.as_posix()}: missing required consumer guidance anchor {marker!r} (TB-992 / TB-994)."
        )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    violations: list[str] = []
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing allowlisted outbox honesty scan target"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for claim in CLAIM_PATTERNS:
        for match in claim.pattern.finditer(text):
            line = _line_for_match(text, match)
            line_lower = _normalize_line(line)

            if _line_is_allowlisted(line) or _line_is_forbidden_example(line, match) or _line_has_caveat(line_lower):
                continue

            violations.append(
                f"{rel.as_posix()}: {claim.message} Matched `{match.group(0)}`. "
                f"Source of truth: {claim.source_of_truth}."
            )

    return violations


def outbox_exactly_once_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(catalog_violations(root))

    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--advisory",
        action="store_true",
        help="Warn-only exit 0 even when violations are found (local exploration).",
    )
    args = parser.parse_args(argv)

    violations = outbox_exactly_once_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Outbox exactly-once honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Outbox exactly-once honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
