#!/usr/bin/env python3
"""TB-1500 / M-273: AOAI model retirement reproducibility honesty CI.

Fails dishonest stubs that:
- Claim bit-identical Real re-execute / same ManifestHash forever across model retirement.
- Equate comparison artifact/stored-source verify with live LLM re-run.
- Claim auto-upgrade preserves ManifestHash / package continuity.
- Rubber-stamp cohort SHA re-lock for silent model swaps without intentional-change ritual.

Contract: docs/library/AOAI_MODEL_RETIREMENT_REPRO_CLAIM_MAP.md (TB-1499).
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "aoai-retirement-repro-honesty: allow"

CONTRACT_REL = Path("docs/library/AOAI_MODEL_RETIREMENT_REPRO_CLAIM_MAP.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    Path("docs/library/COMPARISON_REPLAY_IMMUTABLE_SNAPSHOT_CONTRACT.md"),
    Path("docs/library/RUNBOOK_REPLAY_DRIFT.md"),
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**Done**",
    "TB-1499",
    "artifact",
    "regenerate",
    "auto-upgrade",
    "TB-1172",
    "TB-1024",
    "Bit-identical",
)

REQUIRED_PROCUREMENT_ANCHORS: tuple[str, ...] = (
    "aoai-model-retirement-repro-m-274",
    "TB-1499",
    "Bit-identical Real re-execution",
    "Auto-upgrade preserves ManifestHash",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "never ",
    "not promise",
    "not claimed",
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
    "without migration",
    "without deliberate",
    "not re-call",
    "stored-source",
    "stored source",
    "quietly",
    "rubber stamp",
    "rubber-stamp",
    "tb-1172",
    "tb-1499",
    "tb-1500",
    "m-273",
    "m-274",
    "survives",
    "break",
    "at risk",
    "safe",
    "honest",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str
    source_of_truth: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\bbit[-\s]?identical\b[^.\n]{0,120}\b(?:re[-\s]?execut|reproduc)\w*\b[^.\n]{0,80}\b(?:forever|perpetual|always)\b",
            re.IGNORECASE,
        ),
        "Do not claim bit-identical Real re-execution forever across AOAI model retirement (TB-1499 / M-273).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:same|identical)\s+ManifestHash\b[^.\n]{0,120}\b(?:after|across|following)\b[^.\n]{0,80}\b(?:model retirement|retired pin|retired model)\b",
            re.IGNORECASE,
        ),
        "Do not claim the same ManifestHash after model retirement without migration caveats (TB-1499).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bre[-\s]?execut(?:e|ing|ion)?\b[^.\n]{0,80}\bReal\b[^.\n]{0,80}\b(?:same|identical)\s+ManifestHash\b",
            re.IGNORECASE,
        ),
        "Do not promise Real re-execute yields the same ManifestHash across model pins (TB-1499).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bcomparison\s+replay\b[^.\n]{0,120}\b(?:proves|confirms|shows)\b[^.\n]{0,80}\b(?:same|unchanged)\s+(?:model|LLM|pin)\b",
            re.IGNORECASE,
        ),
        "Comparison replay artifact/verify uses stored sources — do not claim it proves the LLM pin still exists (TB-1024 / TB-1499).",
        "docs/library/COMPARISON_REPLAY_IMMUTABLE_SNAPSHOT_CONTRACT.md",
    ),
    ClaimPattern(
        re.compile(
            r"\bartifact\b[^.\n]{0,80}\b(?:re[-\s]?run|re[-\s]?execut)\w*\b[^.\n]{0,80}\b(?:live|LLM|Azure OpenAI|AOAI)\b",
            re.IGNORECASE,
        ),
        "Comparison artifact mode does not re-call Azure OpenAI — do not equate with live LLM re-run (RUNBOOK_REPLAY_DRIFT / TB-1499).",
        "docs/library/RUNBOOK_REPLAY_DRIFT.md",
    ),
    ClaimPattern(
        re.compile(
            r"\bauto[-\s]?upgrade\b[^.\n]{0,120}\b(?:preserves|maintains|keeps)\b[^.\n]{0,80}\b(?:ManifestHash|package continuity|output identity)\b",
            re.IGNORECASE,
        ),
        "Auto-upgrade preserves availability, not ManifestHash continuity — do not claim otherwise (TB-1499 / M-273).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:silent|automatic)\s+model\s+(?:swap|upgrade)\b[^.\n]{0,120}\b(?:re[-\s]?lock|baseline)\b[^.\n]{0,40}\bwithout\b",
            re.IGNORECASE,
        ),
        "Do not rubber-stamp cohort SHA re-lock for silent model swaps without intentional-change ritual (TB-1172).",
        "docs/library/AOAI_MODEL_RETIREMENT_REPRO_CLAIM_MAP.md",
    ),
    ClaimPattern(
        re.compile(
            r"\bgolden\s+cohort\b[^.\n]{0,120}\bperpetual\s+model\s+reproducibility\b",
            re.IGNORECASE,
        ),
        "Golden cohort does not prove perpetual live Real pin reproducibility (TB-1499).",
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
        return [f"{CONTRACT_REL.as_posix()}: missing AOAI retirement repro contract (TB-1499)"]

    text = contract_path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required contract marker {marker!r} (TB-1499 / M-273)."
        )

    return violations


def procurement_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    rel = Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md")
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing procurement packet for M-274 AOAI retirement anchors"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_PROCUREMENT_ANCHORS):
        violations.append(
            f"{rel.as_posix()}: missing required AOAI retirement honesty anchor {marker!r} (M-274 / TB-1500)."
        )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    violations: list[str] = []
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing allowlisted AOAI retirement honesty scan target"]

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


def aoai_retirement_repro_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(procurement_anchor_violations(root))

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

    violations = aoai_retirement_repro_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"AOAI retirement repro honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("AOAI retirement repro honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
