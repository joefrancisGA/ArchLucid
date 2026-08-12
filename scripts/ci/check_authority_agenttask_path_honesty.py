#!/usr/bin/env python3
"""TB-1008 / M-158: Anti-always-execute / dual-pipeline-alive honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "authority-agenttask-path-honesty: allow"

CONTRACT_REL = Path("docs/library/AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/AUTHORITY_VS_AGENTTASK_LOOP_PA_ONE_PAGER.md")
FLOW_REL = Path("docs/library/ARCHITECTURE_FLOWS.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    Path("docs/library/API_CONTRACTS.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1007**",
    "**TB-1008**",
    "M-158",
    "M-159",
    "Forbidden / must-not-finish-with",
    "Explicit non-claims",
)

REQUIRED_FLOW_MARKERS: tuple[str, ...] = (
    "Flow A1",
    "AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbidden",
    "too strong",
    "not required",
    "authority",
    "task loop",
    "retired",
    "adr 0030",
    "tb-919",
    "tb-1007",
    "tb-1008",
    "m-158",
    "m-159",
    "honesty guard",
    "non-claim",
    "≠",
    "when valid",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:every|always)\s+create\b[^.\n]{0,80}\brequires?\s+execute\b",
            re.IGNORECASE,
        ),
        "Not every create requires execute — Authority path can complete without task loop (TB-1007).",
    ),
    ClaimPattern(
        re.compile(
            r"\bexecute\b[^.\n]{0,80}\b(?:is\s+)?required\b[^.\n]{0,60}\bafter\s+(?:every\s+)?create\b",
            re.IGNORECASE,
        ),
        "Execute is not required after every create (TB-1007 / Flow A1).",
    ),
    ClaimPattern(
        re.compile(
            r"\bdual\s+(?:coordinator|authority)\b[^.\n]{0,80}\b(?:storage\s+)?pipeline\b[^.\n]{0,60}\b(?:still\s+)?(?:live|ships?|default)\b",
            re.IGNORECASE,
        ),
        "Dual coordinator/authority storage pipelines were retired (ADR 0030 / TB-919).",
    ),
    ClaimPattern(
        re.compile(
            r"\bdual\s+golden[-\s]manifest\s+storage\b[^.\n]{0,80}\b(?:still\s+)?(?:live|ships?)\b",
            re.IGNORECASE,
        ),
        "Dual golden-manifest storage is not live (TB-1007 / ADR 0030).",
    ),
    ClaimPattern(
        re.compile(
            r"\b`?result`?\b[^.\n]{0,80}\b(?:finaliz(?:e|es)|commits?)\b[^.\n]{0,60}\b(?:the\s+)?(?:run|package|review)\b",
            re.IGNORECASE,
        ),
        "`result` does not finalize/commit an Authority-finalized run (TB-1007 / ADR 0042).",
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


def _line_is_forbidden_example(line: str, match: re.Match[str]) -> bool:
    if "|" in line and ("too strong" in line.lower() or "forbid" in line.lower()):
        return True

    prefix = line[: match.start()]
    return sum(prefix.count(ch) for ch in ('"', '"', "\u201c", "\u201d")) % 2 == 1


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL

    if not path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing Authority vs AgentTask contract (TB-1007)."]

    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1008)."
        )

    return violations


def flow_anchor_violations(root: Path) -> list[str]:
    path = root / FLOW_REL

    if not path.is_file():
        return [f"{FLOW_REL.as_posix()}: missing architecture flows doc."]

    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []

    for marker in _missing_markers(text, REQUIRED_FLOW_MARKERS):
        violations.append(f"{FLOW_REL.as_posix()}: missing TB-1008 bridge marker {marker!r}.")

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing Authority path honesty scan target."]

    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []

    for claim in CLAIM_PATTERNS:
        for match in claim.pattern.finditer(text):
            line = _line_for_match(text, match)
            line_lower = line.lower()

            if _line_is_allowlisted(line) or _line_is_forbidden_example(line, match) or _line_has_caveat(line_lower):
                continue

            violations.append(f"{rel.as_posix()}: {claim.message} Matched `{match.group(0)}`.")

    return violations


def authority_agenttask_path_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(flow_anchor_violations(root))

    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)

    violations = authority_agenttask_path_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Authority AgentTask path honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Authority AgentTask path honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
