#!/usr/bin/env python3
"""TB-1370 / M-247: Anti-Simulator-decide-differently-gated / schema-equals-provenance honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "agenttask-decisioning-ungated-leak-honesty: allow"

CONTRACT_REL = Path("docs/library/AGENTTASK_DECISIONING_UNGATED_LEAK_SEAMS_CONTRACT.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/AGENTTASK_DECISIONING_UNGATED_LEAK_SEAMS_PA_ONE_PAGER.md")
GRAPH_MERGE_REL = Path("ArchLucid.Application/Runs/Orchestration/AgentTopologyProposalGraphMerge.cs")
MANIFEST_MERGER_REL = Path("ArchLucid.Decisioning/Merge/AgentProposalManifestMerger.cs")
MERGE_GATE_REL = Path("ArchLucid.Decisioning/Merge/DecisionMergeInputGate.cs")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1369**",
    "**TB-1370**",
    "M-247",
    "Forbid",
    "CI anchors for **TB-1370**",
    "DecisionMergeInputGate",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbid",
    "too strong",
    "tb-1369",
    "tb-1370",
    "tb-1196",
    "tb-1221",
    "m-247",
    "m-248",
    "honesty guard",
    "non-claim",
    "≠",
    "schema-only",
    "mode-blind",
    "same code",
    "same path",
    "residual",
    "intent",
    "chokepoint",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\bsimulator\b[^.\n]{0,80}\b(?:fail[-\s]?closed|gated\s+differently|decide\s+differently)\b",
            re.IGNORECASE,
        ),
        "Simulator and Real share mode-blind AgentTask seams — not fail-closed differently (TB-1369).",
    ),
    ClaimPattern(
        re.compile(
            r"\breal\b[^.\n]{0,80}\b(?:fail[-\s]?closed|gated\s+differently)\b[^.\n]{0,40}\b(?:simulator|overlay|agenttask)",
            re.IGNORECASE,
        ),
        "Real vs Simulator overlay/merge paths are mode-blind today (TB-1369).",
    ),
    ClaimPattern(
        re.compile(
            r"\bDecisionMergeInputGate\b[^.\n]{0,80}\b(?:provenance|typed|domain)\b",
            re.IGNORECASE,
        ),
        "DecisionMergeInputGate is schema-only — not provenance/typed gating (TB-1369).",
    ),
    ClaimPattern(
        re.compile(
            r"\bschema[-\s]?valid(?:ated)?\b[^.\n]{0,60}\bAgentResult\b[^.\n]{0,60}\b"
            r"(?:provenance|decision[-\s]?grade|typed)",
            re.IGNORECASE,
        ),
        "Schema-valid AgentResult ≠ provenance-gated decision input (TB-1196/TB-1221).",
    ),
    ClaimPattern(
        re.compile(
            r"\bschema\s+validation\b[^.\n]{0,60}\b(?:closes?|prevents?|blocks?)\b[^.\n]{0,40}\b"
            r"(?:overlay|leak|agenttask)",
            re.IGNORECASE,
        ),
        "Schema validation alone does not close AgentTask overlay leaks (TB-1369).",
    ),
    ClaimPattern(
        re.compile(
            r"\bINV-002\b[^.\n]{0,60}\b(?:closes?|gates?|isolates?)\b[^.\n]{0,40}\b(?:overlay|agenttask|decide)",
            re.IGNORECASE,
        ),
        "INV-002 mode labels do not add overlay gates (TB-1369).",
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
        "forbid" in stripped or "too strong" in stripped or "ci anchors" in stripped or "schema-only" in stripped
    ):
        return True
    return False


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL
    if not path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing AgentTask leak seams contract (TB-1369)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1370)."
        )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, needles in (
        (GRAPH_MERGE_REL, ("WithMergedTopologyProposals",)),
        (MANIFEST_MERGER_REL, ("ApplyFindingsToGovernance",)),
        (MERGE_GATE_REL, ("DecisionMergeInputGate",)),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing AgentTask leak seam code anchor (TB-1370).")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle in needles:
            if needle not in text:
                violations.append(f"{rel.as_posix()}: expected {needle!r} anchor (TB-1370).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing AgentTask leak seam honesty scan target."]
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


def agenttask_decisioning_ungated_leak_honesty_violations(root: Path) -> list[str]:
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
    violations = agenttask_decisioning_ungated_leak_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"AgentTask decisioning ungated leak honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("AgentTask decisioning ungated leak honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
