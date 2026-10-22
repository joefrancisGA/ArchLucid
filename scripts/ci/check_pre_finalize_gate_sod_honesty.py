#!/usr/bin/env python3
"""TB-1023 / M-172: Anti-pack-equals-certification / priorityFloor-blocks / SoD-on-commit honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "pre-finalize-gate-sod-honesty: allow"

CONTRACT_REL = Path("docs/library/PRE_FINALIZE_GATE_BLOCK_VS_ADVISORY_SOD_CONTRACT.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/PRE_FINALIZE_GATE_BLOCK_VS_ADVISORY_SOD_PA_ONE_PAGER.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1022**",
    "**TB-1023**",
    "M-172",
    "M-173",
    "Non-claims",
    "CI anchors for **TB-1023**",
    "PreCommitGateEnabled",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbidden",
    "too strong",
    "optional",
    "default false",
    "advisory",
    "warn-only",
    "not a certification",
    "tb-1022",
    "tb-1023",
    "m-172",
    "m-173",
    "honesty guard",
    "non-claim",
    "submitter",
    "approver",
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
            r"\b(?:every|all)\s+policy\s+packs?\b[^.\n]{0,60}\bblock(?:s)?\b[^.\n]{0,40}\b(?:finalize|commit)\b",
            re.IGNORECASE,
        ),
        "Only enforcing assignments block when gate is on — not every pack (TB-1022).",
    ),
    ClaimPattern(
        re.compile(
            r"\bpolicy\s+packs?\b[^.\n]{0,60}\b(?:are|is|equals?|equal)\b[^.\n]{0,60}\b"
            r"(?:hipaa|pci|soc\s*2|certification|certified)\b",
            re.IGNORECASE,
        ),
        "Policy packs are content overlays — not third-party certification (TB-1022 / M-172).",
    ),
    ClaimPattern(
        re.compile(
            r"\bpriority\s*floor\b[^.\n]{0,60}\bblock(?:s)?\b[^.\n]{0,40}\b(?:finalize|commit)\b",
            re.IGNORECASE,
        ),
        "`priorityFloor` narrows evaluation surface — not a commit gate (TB-1022 §4).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:sod|segregation\s+of\s+dut(?:y|ies))\b[^.\n]{0,80}\b(?:requires?|means?)\b[^.\n]{0,60}\b"
            r"(?:a\s+)?different\s+committer\b",
            re.IGNORECASE,
        ),
        "Platform SoD is approval submitter≠approver — not commit actor (ADR 0034 / TB-1022).",
    ),
    ClaimPattern(
        re.compile(
            r"\bpre[-\s]finalize\s+gate\b[^.\n]{0,60}\b(?:is\s+)?always\s+on\b",
            re.IGNORECASE,
        ),
        "Pre-finalize gate defaults off (`PreCommitGateEnabled` false) — optional control (TB-1022).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:pre[-\s]commit|pre[-\s]finalize)\s+gate\b[^.\n]{0,60}\b(?:enabled|on)\b[^.\n]{0,40}\b(?:by\s+default|in\s+production)\b",
            re.IGNORECASE,
        ),
        "Gate is optional — default `PreCommitGateEnabled` is false (TB-1022).",
    ),
    ClaimPattern(
        re.compile(
            r"\badvisory\s+findings?\b[^.\n]{0,60}\bblock(?:s)?\b[^.\n]{0,40}\bcommit\b",
            re.IGNORECASE,
        ),
        "Advisory findings are excluded from blocking set (TB-1022 / PreCommitGateEvaluator).",
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
        return [f"{CONTRACT_REL.as_posix()}: missing pre-finalize gate contract (TB-1022)."]

    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1023)."
        )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing pre-finalize gate SoD honesty scan target."]

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


def pre_finalize_gate_sod_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))

    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)

    violations = pre_finalize_gate_sod_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Pre-finalize gate SoD honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Pre-finalize gate SoD honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
