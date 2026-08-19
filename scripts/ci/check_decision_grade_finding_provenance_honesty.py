#!/usr/bin/env python3
"""TB-1222 / M-207: Anti-all-findings-evidence-grounded / empty-EvidenceRefs-as-proof honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "decision-grade-finding-provenance-honesty: allow"

CONTRACT_REL = Path("docs/library/DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_CONTRACT.md")
PA_ONE_PAGER_REL = Path(
    "docs/go-to-market/DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_PA_ONE_PAGER.md"
)
FINDING_FACTORY_REL = Path("ArchLucid.Decisioning/Findings/Factories/FindingFactory.cs")
AGENT_PARSER_REL = Path("ArchLucid.AgentRuntime/AgentResultParser.cs")
QUALITY_GATE_REL = Path("ArchLucid.AgentRuntime/Evaluation/AgentOutputQualityGate.cs")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/DIFFERENTIATION_PROOF_PACKET.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1221**",
    "**TB-1222**",
    "M-207",
    "CI anchors for **TB-1222**",
    "FindingFactory",
    "AgentResultParser",
    "AgentOutputQualityGate",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbid",
    "too strong",
    "tb-1221",
    "tb-1222",
    "tb-1228",
    "m-207",
    "m-208",
    "honesty guard",
    "non-claim",
    "exempt",
    "checklist",
    "advisory",
    "while empty",
    "until gates",
    "follow-on",
    "not shipped",
    "not live",
    "not today",
    "not substitute",
    "not alone",
    "not proof",
    "probabilistic",
    "heuristic",
    "structural",
    "provenancekind",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\ball\s+findings\b[^.\n]{0,60}\b(?:are\s+)?(?:citation[-\s]bound|evidence[-\s]grounded)\b",
            re.IGNORECASE,
        ),
        "Empty EvidenceRefs can still emit — do not claim all findings are evidence-grounded (TB-1221).",
    ),
    ClaimPattern(
        re.compile(
            r"\bevery\s+finding\b[^.\n]{0,60}\b(?:has\s+)?(?:a\s+)?(?:citation|evidence|trace)\b",
            re.IGNORECASE,
        ),
        "Do not claim every finding has traceable provenance without shipped gates (TB-1221).",
    ),
    ClaimPattern(
        re.compile(
            r"\bcritic\b[^.\n]{0,40}\b(?:low|confidence)\b[^.\n]{0,60}\b(?:guarantees?|proves?|ensures?)\b"
            r"[^.\n]{0,40}\b(?:citation|provenance|evidence)\b",
            re.IGNORECASE,
        ),
        "Critic Low confidence is not per-finding provenance guarantee (TB-1221).",
    ),
    ClaimPattern(
        re.compile(
            r"\bAgentResult\.EvidenceRefs\b[^.\n]{0,60}\b(?:guarantees?|proves?|ensures?)\b"
            r"[^.\n]{0,40}\b(?:per[-\s]finding|each\s+finding)\b",
            re.IGNORECASE,
        ),
        "Top-level AgentResult.EvidenceRefs alone is not per-finding provenance (TB-1221).",
    ),
    ClaimPattern(
        re.compile(
            r"\bprompt\b[^.\n]{0,60}\b(?:instructions?|text)\b[^.\n]{0,60}\b(?:fail[-\s]closed|guarantees?)\b"
            r"[^.\n]{0,40}\b(?:provenance|citation|evidence)\b",
            re.IGNORECASE,
        ),
        "Prompt instructions are not fail-closed structural provenance (TB-1221).",
    ),
    ClaimPattern(
        re.compile(
            r"\bcommitted\s+package\b[^.\n]{0,60}\b(?:proves?|guarantees?)\b[^.\n]{0,40}\b"
            r"(?:every\s+finding|all\s+findings)\b[^.\n]{0,40}\b(?:cited|grounded)\b",
            re.IGNORECASE,
        ),
        "Committed package does not prove every finding is cited today (TB-1221).",
    ),
    ClaimPattern(
        re.compile(
            r"\bempty\s+EvidenceRefs\b[^.\n]{0,40}\b(?:cannot|can'?t|never)\b[^.\n]{0,40}\b(?:emit|persist)\b",
            re.IGNORECASE,
        ),
        "Empty EvidenceRefs can still schema-valid emit — do not overclaim (TB-1221).",
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
            f"{CONTRACT_REL.as_posix()}: missing decision-grade finding provenance contract (TB-1221)."
        ]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1222)."
        )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, needles in (
        (FINDING_FACTORY_REL, ("FindingFactory",)),
        (AGENT_PARSER_REL, ("AgentResultParser",)),
        (QUALITY_GATE_REL, ("AgentOutputQualityGate", "FindingCitationCoverageRatio")),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing finding provenance code anchor (TB-1222).")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle in needles:
            if needle not in text:
                violations.append(f"{rel.as_posix()}: expected {needle!r} anchor (TB-1222).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing finding provenance honesty scan target."]
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


def decision_grade_finding_provenance_honesty_violations(root: Path) -> list[str]:
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
    violations = decision_grade_finding_provenance_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"decision-grade finding provenance honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("decision-grade finding provenance honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
