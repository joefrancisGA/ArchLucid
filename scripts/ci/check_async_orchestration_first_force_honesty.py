#!/usr/bin/env python3
"""TB-1312 / M-231: Anti-everything-in-process / DTF-required / commit-in-orchestrator honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "async-orchestration-first-force-honesty: allow"

CONTRACT_REL = Path(
    "docs/library/ASYNC_ORCHESTRATION_FIRST_FORCE_AND_RUN_STATE_MACHINE_CONTRACT.md"
)
PA_ONE_PAGER_REL = Path(
    "docs/go-to-market/ASYNC_ORCHESTRATION_FIRST_FORCE_AND_RUN_STATE_MACHINE_PA_ONE_PAGER.md"
)
AUTHORITY_ORCHESTRATOR_REL = Path(
    "ArchLucid.Application/Runs/Orchestration/AuthorityRunOrchestrator.cs"
)
EXECUTE_ORCHESTRATOR_REL = Path(
    "ArchLucid.Application/Runs/Orchestration/ArchitectureRunExecuteOrchestrator.cs"
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
    "**TB-1311**",
    "**TB-1312**",
    "M-231",
    "Explicit non-claims",
    "CI anchors for **TB-1312**",
    "AuthorityRunOrchestrator",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbidden",
    "too strong",
    "adr 0038",
    "sql outbox",
    "tb-1311",
    "tb-1312",
    "tb-921",
    "m-231",
    "honesty guard",
    "non-claim",
    "≠",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:everything|all)\s+runs?\b[^.\n]{0,60}\b(?:fully\s+)?in[-\s]process\b",
            re.IGNORECASE,
        ),
        "Authority pipeline uses SQL queue/outbox default — not all in-process (TB-1311 / ADR 0038).",
    ),
    ClaimPattern(
        re.compile(
            r"\bv1\b[^.\n]{0,60}\b(?:requires?|needs?)\b[^.\n]{0,60}\b(?:dtf|durable\s+tasks?|service\s+bus)\b"
            r"[^.\n]{0,40}\b(?:for\s+)?agents?\b",
            re.IGNORECASE,
        ),
        "V1 does not require DTF/Service Bus agent orchestration — TB-921 / V1_DEFERRED (TB-1311).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:commit|finalize)\b[^.\n]{0,60}\b(?:is|becomes?|must\s+be)\b[^.\n]{0,60}\b"
            r"(?:an?\s+)?orchestrat(?:or|ion)\s+activit",
            re.IGNORECASE,
        ),
        "Commit stays separate CAS verb — not an orchestrator activity (TB-1311).",
    ),
    ClaimPattern(
        re.compile(
            r"\basync\s+agent\s+execute\b[^.\n]{0,80}\b(?:requires?|means?)\b[^.\n]{0,60}\b"
            r"(?:rewriting|folding)\b[^.\n]{0,40}\b(?:commit|finalize)\b",
            re.IGNORECASE,
        ),
        "Async execute does not require folding finalize into orchestrator (TB-1311).",
    ),
    ClaimPattern(
        re.compile(
            r"\bintegration[-\s](?:event\s+)?service\s+bus\b[^.\n]{0,80}\b(?:is|equals?)\b[^.\n]{0,60}\b"
            r"(?:the\s+)?agent\s+orchestrat",
            re.IGNORECASE,
        ),
        "Integration-event Service Bus ≠ agent orchestration substrate (TB-1311).",
    ),
    ClaimPattern(
        re.compile(
            r"\babsence\s+of\s+(?:dtf|durable\s+tasks?)\b[^.\n]{0,80}\b(?:is|are)\b[^.\n]{0,40}\b"
            r"(?:a\s+)?v1\s+(?:defect|gap|blocker)\b",
            re.IGNORECASE,
        ),
        "Missing DTF is deferred V1.1 — not a V1 defect (TB-1311 / TB-921).",
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
        return [
            f"{CONTRACT_REL.as_posix()}: missing async orchestration contract (TB-1311)."
        ]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1312)."
        )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, symbol in (
        (AUTHORITY_ORCHESTRATOR_REL, "AuthorityRunOrchestrator"),
        (EXECUTE_ORCHESTRATOR_REL, "ArchitectureRunExecuteOrchestrator"),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing async orchestration code anchor (TB-1312).")
            continue
        if symbol not in path.read_text(encoding="utf-8", errors="replace"):
            violations.append(f"{rel.as_posix()}: expected {symbol!r} anchor (TB-1312).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing async orchestration honesty scan target."]
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


def async_orchestration_first_force_honesty_violations(root: Path) -> list[str]:
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
    violations = async_orchestration_first_force_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Async orchestration first-force honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("Async orchestration first-force honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
