#!/usr/bin/env python3
"""TB-1271 / M-221: Concurrent execute + commit race honesty CI.

Fails dishonest stubs that:
- Claim exactly-once commit/package delivery end-to-end.
- Claim retries never spend LLM tokens at the provider.
- Claim two racing commits can silently create two buyer packages for one run.

Contract: docs/library/CONCURRENT_EXECUTE_AND_COMMIT_RACE_CONTRACT.md (TB-1270).
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "concurrent-execute-commit-honesty: allow"

CONTRACT_REL = Path("docs/library/CONCURRENT_EXECUTE_AND_COMMIT_RACE_CONTRACT.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/CONCURRENT_EXECUTE_AND_COMMIT_RACE_PA_ONE_PAGER.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1270**",
    "first-wins",
    "409",
    "process-idempotent",
    "M-221",
)

REQUIRED_PA_ONE_PAGER_MARKERS: tuple[str, ...] = (
    "CONCURRENT_EXECUTE_AND_COMMIT_RACE_CONTRACT.md",
    "TB-1270",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
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
    "first-wins",
    "first wins",
    "409",
    "concurrency",
    "idempotent replay",
    "process skip",
    "m-170",
    "m-221",
    "m-222",
    "tb-1270",
    "tb-1271",
    "forbid",
    "≠",
    "!=",
    "loser",
    "cas",
    "rowversion",
    "pre-persist",
    "at-least-once",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str
    source_of_truth: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\bexactly[-\s]?once\b[^.\n]{0,120}\b(?:commit|package|manifest|finalize|finalization)\b",
            re.IGNORECASE,
        ),
        "Do not claim exactly-once commit/package delivery (TB-1270 / M-221).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:commit|finalize|finalization)\b[^.\n]{0,120}\bexactly[-\s]?once\b",
            re.IGNORECASE,
        ),
        "Commit is first-wins under CAS — not exactly-once end-to-end (TB-1270).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:idempotent|idempotency)\b[^.\n]{0,80}\b(?:means|implies|guarantees)\b[^.\n]{0,80}\b(?:never|no)\s+409\b",
            re.IGNORECASE,
        ),
        "Idempotent replay does not mean never 409 — losers get conflict (TB-1270).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bretries?\b[^.\n]{0,120}\bnever\s+(?:spend|bill|charge|incur)\b[^.\n]{0,80}\b(?:llm|token|provider|openai|aoai)\b",
            re.IGNORECASE,
        ),
        "Retries may rebill at provider before task persist — process skip only after persist (M-170 / TB-1270).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:retry|retries|replay)\b[^.\n]{0,120}\b(?:never|no)\s+(?:llm|token|provider|openai|aoai)\s+(?:spend|cost|bill)\b",
            re.IGNORECASE,
        ),
        "Do not claim retries never spend at provider (M-170 / TB-1270).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:two|concurrent|racing)\b[^.\n]{0,80}\bcommits?\b[^.\n]{0,120}\b(?:silently|quietly|both)\b[^.\n]{0,80}\b(?:succeed|create|produce)\b[^.\n]{0,80}\b(?:package|manifest)\b",
            re.IGNORECASE,
        ),
        "Concurrent commits cannot silently create two packages — CAS + 409 loser (TB-1270 / TB-1003).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bsilent(?:ly)?\s+double[-\s]?package\b",
            re.IGNORECASE,
        ),
        "Silent double package is forbidden — first-wins CAS (TB-1270).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:two|duplicate)\b[^.\n]{0,80}\b(?:signed|committed|golden)\b[^.\n]{0,80}\b(?:packages?|manifests?)\b[^.\n]{0,80}\b(?:same|one)\s+run\b",
            re.IGNORECASE,
        ),
        "One committed golden manifest per run — no silent duplicate packages (TB-1270 / TB-1003).",
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

    if stripped.startswith("|") and ("unsafe" in stripped or "forbid" in stripped):
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
        return [f"{CONTRACT_REL.as_posix()}: missing concurrent execute/commit race contract (TB-1270)"]

    text = contract_path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required contract marker {marker!r} (TB-1270 / TB-1271)."
        )

    return violations


def pa_one_pager_violations(root: Path) -> list[str]:
    violations: list[str] = []
    path = root / PA_ONE_PAGER_REL

    if not path.is_file():
        return [f"{PA_ONE_PAGER_REL.as_posix()}: missing PA one-pager (M-222)"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_PA_ONE_PAGER_MARKERS):
        violations.append(
            f"{PA_ONE_PAGER_REL.as_posix()}: missing required PA anchor {marker!r} (M-222 / TB-1271)."
        )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    violations: list[str] = []
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing allowlisted concurrent execute/commit honesty scan target"]

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


def concurrent_execute_commit_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(pa_one_pager_violations(root))

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

    violations = concurrent_execute_commit_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Concurrent execute/commit honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Concurrent execute/commit honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
