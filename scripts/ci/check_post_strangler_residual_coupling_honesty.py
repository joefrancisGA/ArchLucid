#!/usr/bin/env python3
"""TB-1205 / M-205: Anti-delete-pins-as-complete / soft-bridge-as-dual-storage honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "post-strangler-residual-coupling-honesty: allow"

CONTRACT_REL = Path(
    "docs/library/POST_STRANGLER_RESIDUAL_COUPLING_AND_DISCIPLINE_TEST_RETIREMENT_CONTRACT.md"
)
PA_ONE_PAGER_REL = Path(
    "docs/go-to-market/POST_STRANGLER_RESIDUAL_COUPLING_DISCIPLINE_TEST_RETIREMENT_PA_ONE_PAGER.md"
)
DUAL_PIPELINE_TEST_REL = Path(
    "ArchLucid.Api.Tests/Startup/DualPipelineRegistrationDisciplineTests.cs"
)
STRANGLER_TEST_REL = Path(
    "ArchLucid.Architecture.Tests/CoordinatorStranglerCompletionArchitectureTests.cs"
)
INVENTORY_REL = Path("docs/architecture/COORDINATOR_STRANGLER_INVENTORY.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/COMPETITIVE_POSITIONING.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1204**",
    "**TB-1205**",
    "M-205",
    "CI anchors for **TB-1205**",
    "DualPipelineRegistrationDisciplineTests",
    "CoordinatorStranglerCompletionArchitectureTests",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "never ",
    "not promise",
    "not claim",
    "forbid",
    "too strong",
    "tb-1204",
    "tb-1205",
    "tb-919",
    "tb-1008",
    "tb-1035",
    "m-205",
    "m-206",
    "honesty guard",
    "non-claim",
    "retirement gate",
    "keep",
    "≠",
    "not dual",
    "gone",
    "retired",
    "hunt",
    "soft bridge",
    "mental model",
    "extension loop",
    "mapping ≠",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:delete|remove|retire)\b[^.\n]{0,60}\b(?:DualPipeline|CoordinatorStrangler)\b"
            r"[^.\n]{0,60}\b(?:because|since|now that)\b[^.\n]{0,60}\b(?:complete|done|TB-919)\b",
            re.IGNORECASE,
        ),
        "Do not delete strangler discipline tests solely because inventory/TB-919 is Done (TB-1204).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:strangler|coordinator)\b[^.\n]{0,40}\b(?:is\s+)?complete\b[^.\n]{0,60}\b"
            r"(?:delete|remove)\b[^.\n]{0,40}\b(?:discipline|DualPipeline|CoordinatorStrangler)\b",
            re.IGNORECASE,
        ),
        "Strangler storage complete does not justify deleting anti-resurrection pins (TB-1204).",
    ),
    ClaimPattern(
        re.compile(
            r"\bdual\s+coordinator\s+storage\b[^.\n]{0,60}\b(?:still\s+)?(?:ships?|live|exists)\b",
            re.IGNORECASE,
        ),
        "Dual coordinator storage is retired — do not claim it still ships (TB-1204).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:execute|result|commit)\b[^.\n]{0,40}\b(?:verbs?|lifecycle)\b[^.\n]{0,60}\b"
            r"(?:prove|means|shows)\b[^.\n]{0,40}\bdual\s+(?:coordinator\s+)?storage\b",
            re.IGNORECASE,
        ),
        "AgentTask verbs are mental-model residue — not proof dual storage repos ship (TB-1204).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:Contracts|Authority)\b[^.\n]{0,60}\b(?:mapper|projection|bridge)\b[^.\n]{0,60}\b"
            r"(?:prove|means|shows)\b[^.\n]{0,40}\bdual\s+(?:pipeline|storage)\b[^.\n]{0,40}\bships?\b",
            re.IGNORECASE,
        ),
        "Contracts↔Authority mappers are soft bridges — not proof dual live storage (TB-1204).",
    ),
    ClaimPattern(
        re.compile(
            r"\bno\s+residual\s+coupling\b[^.\n]{0,40}\b(?:after|from)\b[^.\n]{0,40}\bstorage\b",
            re.IGNORECASE,
        ),
        "Storage strangler Done ≠ no residual coupling — hunt matrix still applies (TB-1204).",
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
            f"{CONTRACT_REL.as_posix()}: missing post-strangler residual coupling contract (TB-1204)."
        ]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1205)."
        )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, needles in (
        (DUAL_PIPELINE_TEST_REL, ("DualPipelineRegistrationDisciplineTests",)),
        (STRANGLER_TEST_REL, ("CoordinatorStranglerCompletionArchitectureTests",)),
        (INVENTORY_REL, ("DualPipelineRegistrationDisciplineTests",)),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing post-strangler code anchor (TB-1205).")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle in needles:
            if needle not in text:
                violations.append(f"{rel.as_posix()}: expected {needle!r} anchor (TB-1205).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing post-strangler honesty scan target."]
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


def post_strangler_residual_coupling_honesty_violations(root: Path) -> list[str]:
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
    violations = post_strangler_residual_coupling_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"post-strangler residual coupling honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("post-strangler residual coupling honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
