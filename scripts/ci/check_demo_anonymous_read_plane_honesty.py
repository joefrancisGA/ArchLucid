#!/usr/bin/env python3
"""TB-1252 / M-217: Anti-AllowAnonymous-equals-safe / DemoScopes-pin / empty-demo-scope honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "demo-anonymous-read-plane-honesty: allow"

CONTRACT_REL = Path("docs/library/DEMO_ANONYMOUS_READ_PLANE_CONTRACT.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/DEMO_ANONYMOUS_READ_PLANE_PA_ONE_PAGER.md")
DEMO_SCOPES_REL = Path("ArchLucid.Host.Core/Demo/DemoScopes.cs")
DEMO_EXPLAIN_REL = Path("ArchLucid.Api/Controllers/Demo/DemoExplainController.cs")
DEMO_READ_MODEL_REL = Path("ArchLucid.Host.Core/Demo/DemoReadModelClient.cs")
SQL_FACTORY_REL = Path("ArchLucid.Persistence/Connections/ScopedRoutingSqlConnectionFactory.cs")
PROD_SAFETY_REL = Path(
    "ArchLucid.Host.Core/Startup/Validation/Rules/ProductionSafetyRules.cs"
)
STATIC_SHOWCASE_REL = Path("archlucid-ui/src/lib/showcase-static-demo.ts")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1251**",
    "**TB-1252**",
    "M-217",
    "Forbid",
    "CI anchors for **TB-1252**",
    "DemoScopes",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbid",
    "too strong",
    "tb-1251",
    "tb-1252",
    "m-217",
    "m-218",
    "honesty guard",
    "non-claim",
    "≠",
    "not structural",
    "not enough",
    "convention",
    "filter",
    "predicate",
    "exception plane",
    "residual",
    "target",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\[AllowAnonymous\][^.\n]{0,80}\b(?:safe|tenant[-\s]?safe|cannot\s+read|can'?t\s+read)\b",
            re.IGNORECASE,
        ),
        "[AllowAnonymous] does not prove paying-tenant isolation (TB-1251).",
    ),
    ClaimPattern(
        re.compile(
            r"\bAllowAnonymous\b[^.\n]{0,80}\b(?:proves?|guarantees?|ensures?)\b[^.\n]{0,40}\b"
            r"(?:tenant|isolation|paying)",
            re.IGNORECASE,
        ),
        "AllowAnonymous attribute does not establish tenant isolation (TB-1251).",
    ),
    ClaimPattern(
        re.compile(
            r"\bDemoScopes\b[^.\n]{0,80}\b(?:structural|catalog\s+isolation|cannot\s+open|proves?)\b",
            re.IGNORECASE,
        ),
        "DemoScopes hard-pin alone is convention + predicates, not catalog isolation (TB-1251).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:hard[-\s]?pin|demo\s+scope)\b[^.\n]{0,80}\b(?:structural|catalog\s+isolation|tenant[-\s]?safe)\b",
            re.IGNORECASE,
        ),
        "Demo scope pin is not structural catalog isolation (TB-1251).",
    ),
    ClaimPattern(
        re.compile(
            r"\bempty\b[^.\n]{0,40}\b(?:demo|ambient)\b[^.\n]{0,60}\b(?:no\s+data|returns?\s+nothing|zero\s+rows)\b",
            re.IGNORECASE,
        ),
        "Empty demo ambient scope can route to system catalog — not no data (M-168/M-169).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:anonymous|unauthenticated)\b[^.\n]{0,60}\bdemo\b[^.\n]{0,60}\b(?:cannot|can'?t)\b[^.\n]{0,40}\b"
            r"(?:read|access)\b[^.\n]{0,40}\b(?:tenant|paying)",
            re.IGNORECASE,
        ),
        "Anonymous demo paths are filter/convention today — not structural paying-tenant deny (TB-1251).",
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
        "forbid" in stripped or "too strong" in stripped or "ci anchors" in stripped or "not enough" in stripped
    ):
        return True
    return False


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL
    if not path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing demo/anonymous read plane contract (TB-1251)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1252)."
        )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, needles in (
        (DEMO_SCOPES_REL, ("BuildDemoScope",)),
        (DEMO_EXPLAIN_REL, ("DemoExplainController",)),
        (DEMO_READ_MODEL_REL, ("DemoReadModelClient",)),
        (SQL_FACTORY_REL, ("ScopedRoutingSqlConnectionFactory",)),
        (PROD_SAFETY_REL, ("CollectDemoDisallowedInProductionProfile",)),
        (STATIC_SHOWCASE_REL, ("showcase",)),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing demo read-plane code anchor (TB-1252).")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle in needles:
            if needle not in text:
                violations.append(f"{rel.as_posix()}: expected {needle!r} anchor (TB-1252).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing demo read-plane honesty scan target."]
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


def demo_anonymous_read_plane_honesty_violations(root: Path) -> list[str]:
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
    violations = demo_anonymous_read_plane_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Demo anonymous read plane honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("Demo anonymous read plane honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
