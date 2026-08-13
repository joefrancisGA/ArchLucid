#!/usr/bin/env python3
"""TB-1004 / M-154: Anti-substitute-for-committed-manifest / fake-chain-hop honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "committed-manifest-substitute-honesty: allow"

CONTRACT_REL = Path("docs/library/COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_PA_ONE_PAGER.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1003**",
    "**TB-1004**",
    "M-154",
    "M-155",
    "Forbidden substitutes",
    "Explicit non-claims",
    "review-backed",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbidden",
    "too strong",
    "illustrative",
    "conversational",
    "draft",
    "working findings",
    "export / projection",
    "uncommitted",
    "before commit",
    "tb-1003",
    "tb-1004",
    "m-154",
    "m-155",
    "review-backed",
    "honesty guard",
    "non-claim",
    "substitute",
    "≠",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:findings?\s+list|ask\s+answer|chat\s+transcript|draft\s+review)\b[^.\n]{0,80}\b"
            r"(?:is|are|equals?)\b[^.\n]{0,60}\b(?:the\s+)?(?:signed|finalized)\b[^.\n]{0,40}\b"
            r"(?:architecture\s+package|review\s+record|decision\s+record)\b",
            re.IGNORECASE,
        ),
        "Findings/Ask/draft are not the committed golden manifest (TB-1003 / M-154).",
    ),
    ClaimPattern(
        re.compile(
            r"\buncommitted\s+(?:run|review)\b[^.\n]{0,80}\b(?:is|counts?\s+as)\b[^.\n]{0,60}\b"
            r"(?:signed|finalized)\b[^.\n]{0,40}\b(?:package|record)\b",
            re.IGNORECASE,
        ),
        "Uncommitted runs are not a finalized architecture package (TB-1003).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:simulator|demo|showcase)\s+output\b[^.\n]{0,80}\b(?:is|are)\b[^.\n]{0,60}\b"
            r"(?:the\s+)?(?:committed|signed|finalized)\b[^.\n]{0,40}\bpackage\b",
            re.IGNORECASE,
        ),
        "Simulator/demo output is illustrative — not the committed package (TB-1003 / M-138).",
    ),
    ClaimPattern(
        re.compile(
            r"\bfull\s+evidence\b[^.\n]{0,80}\b(?:to\s+)?audit\b[^.\n]{0,80}\b(?:for|from)\b[^.\n]{0,40}\b(?:ask|chat|simulator)\b",
            re.IGNORECASE,
        ),
        "Do not claim a full Evidence→audit chain for Ask/chat/Simulator without commit (TB-1003).",
    ),
    ClaimPattern(
        re.compile(
            r"\bsponsor\s+(?:pdf|export)\b[^.\n]{0,80}\b(?:is|are)\b[^.\n]{0,60}\b(?:the\s+)?unit\s+of\s+truth\b",
            re.IGNORECASE,
        ),
        "Sponsor export is a projection — committed manifest is unit of truth (TB-1003).",
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
        return [f"{CONTRACT_REL.as_posix()}: missing committed-manifest contract (TB-1003)."]

    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1004)."
        )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing committed-manifest substitute honesty scan target."]

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


def committed_manifest_substitute_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))

    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)

    violations = committed_manifest_substitute_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Committed-manifest substitute honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Committed-manifest substitute honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
