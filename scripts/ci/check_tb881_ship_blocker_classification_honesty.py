#!/usr/bin/env python3
"""TB-1372 / M-249: Anti-TB-881-blocks-pilots / reopen-Done-TB-881 honesty CI + OPEN hygiene."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "tb881-ship-blocker-classification-honesty: allow"

CONTRACT_REL = Path("docs/library/TB881_ORG_REGISTRATION_RACE_SHIP_BLOCKER_CLASSIFICATION_CONTRACT.md")
OPEN_INVENTORY_REL = Path("docs/library/TECH_BACKLOG_OPEN.md")
PA_ONE_PAGER_REL = Path(
    "docs/go-to-market/TB881_ORG_REGISTRATION_RACE_SHIP_BLOCKER_CLASSIFICATION_PA_ONE_PAGER.md"
)
ASSEMBLY_ATTRS_REL = Path("ArchLucid.Api.Tests/AssemblyAttributes.cs")
XUNIT_RUNNER_REL = Path("ArchLucid.Api.Tests/xunit.runner.json")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-881**",
    "**TB-1371**",
    "**TB-1372**",
    "M-249",
    "CI anchors for **TB-1372**",
    "IntegrationTestSqlCatalogEnvironment",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbid",
    "too strong",
    "m-249",
    "m-250",
    "honesty guard",
    "non-claim",
    "done",
    "closed",
    "ci/test",
    "signup-stress",
    "signup stress",
    "not a v1 pilot",
    "not pilot",
    "sequential",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\bTB-881\b[^.\n]{0,80}\b(?:blocks?|blocker|ship\s+gate|pilot\s+gate)\b",
            re.IGNORECASE,
        ),
        "TB-881 is Done CI/test isolation — not a pilot ship blocker (TB-1371).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:open|reopen)\b[^.\n]{0,40}\bTB-881\b[^.\n]{0,60}\b(?:pilot|v1|ship)",
            re.IGNORECASE,
        ),
        "Do not reopen Done TB-881 for pilots — signup-stress class only (TB-1371).",
    ),
    ClaimPattern(
        re.compile(
            r"\breopen\b[^.\n]{0,40}\bDone\b[^.\n]{0,20}\bTB-881\b",
            re.IGNORECASE,
        ),
        "Done TB-881 must not be reopened for V1 pilots (TB-1371).",
    ),
    ClaimPattern(
        re.compile(
            r"\borg\s+registration\b[^.\n]{0,60}\bbroken\b[^.\n]{0,60}\bproduction\b[^.\n]{0,40}\b"
            r"(?:parallel|rc12|env[-\s]?pin)",
            re.IGNORECASE,
        ),
        "RC12 parallel-test env-pin race ≠ production pilot registration failure (TB-1371).",
    ),
    ClaimPattern(
        re.compile(
            r"\bRC12\b[^.\n]{0,60}\b(?:open|ship)\b[^.\n]{0,40}\b(?:blocker|gate)\b[^.\n]{0,40}\bTB-881\b",
            re.IGNORECASE,
        ),
        "TB-881 RC12 class is Done — not an open pilot blocker (TB-1371).",
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
        "forbid" in stripped or "too strong" in stripped or "ci anchors" in stripped or "do not say" in stripped
    ):
        return True
    return False


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL
    if not path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing TB-881 classification contract (TB-1371)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1372)."
        )
    return violations


def open_inventory_violations(root: Path) -> list[str]:
    path = root / OPEN_INVENTORY_REL
    if not path.is_file():
        return [f"{OPEN_INVENTORY_REL.as_posix()}: missing OPEN inventory for TB-881 hygiene."]
    violations: list[str] = []
    for line_no, line in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), start=1):
        if "TB-881" not in line:
            continue
        lowered = line.lower()
        if "done" in lowered or "~~" in line or "closed" in lowered:
            continue
        if "open" in lowered and ("blocker" in lowered or "rc12" in lowered or "ship" in lowered):
            violations.append(
                f"{OPEN_INVENTORY_REL.as_posix()}:{line_no}: TB-881 listed as open ship blocker — "
                "must stay Done/closed (TB-1372)."
            )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, needles in (
        (ASSEMBLY_ATTRS_REL, ("DisableTestParallelization",)),
        (XUNIT_RUNNER_REL, ("parallelizeTestCollections",)),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing TB-881 regression code anchor (TB-1372).")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle in needles:
            if needle not in text:
                violations.append(f"{rel.as_posix()}: expected {needle!r} anchor (TB-1372).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing TB-881 classification honesty scan target."]
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


def tb881_ship_blocker_classification_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(open_inventory_violations(root))
    violations.extend(code_anchor_violations(root))
    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))
    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)
    violations = tb881_ship_blocker_classification_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"TB-881 ship-blocker classification honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("TB-881 ship-blocker classification honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
