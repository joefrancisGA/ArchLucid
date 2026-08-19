#!/usr/bin/env python3
"""TB-1368 / M-245: Anti-two-weeks-to-two-hours / every-finding-trace / gate-always-on honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "elevator-pitch-v1-claim-honesty: allow"

CONTRACT_REL = Path("docs/go-to-market/ELEVATOR_PITCH_V1_CLAIM_AUDIT_PA_ONE_PAGER.md")
PA_PACKET_REL = Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/ELEVATOR_PITCH.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_PACKET_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1367**",
    "**TB-1368**",
    "M-245",
    "CI anchors for **TB-1368**",
    "cut / hedge / prove",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbid",
    "too strong",
    "tb-1367",
    "tb-1368",
    "m-245",
    "m-246",
    "open m-245",
    "honesty guard",
    "non-claim",
    "where gates enforce",
    "where present",
    "when present",
    "sponsor-facing",
    "optional gate",
    "advisory",
    "committed run",
    "committed manifest",
    "comparison/replay",
    "compare/replay",
    "hedge",
    "cut",
    "examples to cut",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"two\s+weeks?\b[^.\n]{0,80}\btwo\s+hours?",
            re.IGNORECASE,
        ),
        "Unguarded two weeks → two hours compression without measured pilot baseline (M-245).",
    ),
    ClaimPattern(
        re.compile(
            r"\bevery\s+finding\b[^.\n]{0,80}\b(?:always|carries?|has)\b[^.\n]{0,40}\b"
            r"(?:explainability|trace)",
            re.IGNORECASE,
        ),
        "Not every finding always has explainability trace — hedge per M-245/TB-1221.",
    ),
    ClaimPattern(
        re.compile(
            r"\bExplainabilityTrace\b[^.\n]{0,40}\bon\s+every\s+finding\b",
            re.IGNORECASE,
        ),
        "ExplainabilityTrace on every finding overclaims — cite where gates enforce (M-245).",
    ),
    ClaimPattern(
        re.compile(
            r"\bpre[-\s]?(?:commit|finalize)\s+gate\b[^.\n]{0,60}\b(?:always|default[-\s]?on|always\s+on)\b",
            re.IGNORECASE,
        ),
        "Pre-finalize gates are optional/config — not always on (M-173/M-245).",
    ),
    ClaimPattern(
        re.compile(
            r"\bgates?\b[^.\n]{0,40}\b(?:always|default)\b[^.\n]{0,40}\bon\b",
            re.IGNORECASE,
        ),
        "Governance gates are not universally always-on (M-245).",
    ),
    ClaimPattern(
        re.compile(
            r"\breplayable\b[^.\n]{0,60}\b(?:absolute|guaranteed|immutable)\b[^.\n]{0,40}\b"
            r"(?:architecture|stability|package)",
            re.IGNORECASE,
        ),
        "Replayable is not absolute architecture stability — compare committed manifests (M-174).",
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
        "forbid" in stripped or "cut" in stripped or "hedge" in stripped or "ci anchors" in stripped
    ):
        return True
    return False


def contract_violations(root: Path) -> list[str]:
    violations: list[str] = []
    alias_path = root / CONTRACT_REL
    packet_path = root / PA_PACKET_REL
    if not alias_path.is_file():
        violations.append(f"{CONTRACT_REL.as_posix()}: missing elevator pitch V1 claim audit alias (TB-1367).")
    else:
        alias_text = alias_path.read_text(encoding="utf-8", errors="replace")
        for marker in _missing_markers(alias_text, REQUIRED_CONTRACT_MARKERS):
            violations.append(
                f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1368)."
            )
    if not packet_path.is_file():
        violations.append(f"{PA_PACKET_REL.as_posix()}: missing procurement packet elevator audit section.")
    else:
        packet_text = packet_path.read_text(encoding="utf-8", errors="replace")
        if "elevator-pitch-v1-claim-audit-m-246" not in packet_text.lower():
            violations.append(
                f"{PA_PACKET_REL.as_posix()}: missing elevator pitch V1 claim audit section (TB-1367)."
            )
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing elevator pitch honesty scan target."]
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


def elevator_pitch_v1_claim_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))
    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)
    violations = elevator_pitch_v1_claim_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Elevator pitch V1 claim honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("Elevator pitch V1 claim honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
