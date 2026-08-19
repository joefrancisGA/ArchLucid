#!/usr/bin/env python3
"""TB-1233 / M-213: Anti-WHERE-TenantId-equals-isolation / ARCH-alone / RLS honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "tenant-did-erosion-beyond-predicates-honesty: allow"

CONTRACT_REL = Path(
    "docs/library/TENANT_DID_EROSION_AND_ENFORCEMENT_BEYOND_PREDICATES_CONTRACT.md"
)
PA_ONE_PAGER_REL = Path(
    "docs/go-to-market/TENANT_DID_EROSION_BEYOND_PREDICATES_PA_ONE_PAGER.md"
)
SEARCH_CLIENT_REL = Path("ArchLucid.Retrieval/Indexing/AzureSearchSdkClient.cs")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1232**",
    "**TB-1233**",
    "M-213",
    "Explicit non-claims",
    "CI anchors for **TB-1233**",
    "BuildRequiredScopeFilter",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbidden",
    "too strong",
    "layer a",
    "catalog",
    "adr 0037",
    "did",
    "defense in depth",
    "tb-1232",
    "tb-1233",
    "tb-1122",
    "m-213",
    "honesty guard",
    "non-claim",
    "predicate",
    "≠",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\bwhere\s+tenant\s*id\b[^.\n]{0,80}\b(?:is|equals?|equal|proves?|means?)\b"
            r"[^.\n]{0,60}\b(?:tenant\s+)?isolation\b",
            re.IGNORECASE,
        ),
        "`WHERE TenantId` is Layer D DiD — not production paying-client isolation (TB-1232 / ADR 0037).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:scope[-\s]context|tenantid\s+predicates?|per[-\s]query\s+filters?)\b"
            r"[^.\n]{0,80}\b(?:alone|by\s+themselves)\b[^.\n]{0,60}\b"
            r"(?:prove|means?|equals?|guarantee)\b[^.\n]{0,40}\b(?:tenant\s+)?isolation\b",
            re.IGNORECASE,
        ),
        "Scope predicates alone are not the primary isolation boundary (TB-1232).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:netarchtest|arch001|arch006|architecture\s+tests?)\b[^.\n]{0,80}\b"
            r"(?:alone|by\s+themselves)\b[^.\n]{0,60}\b(?:prove|means?|guarantee)\b"
            r"[^.\n]{0,40}\b(?:tenant\s+)?isolation\b",
            re.IGNORECASE,
        ),
        "NetArchTest / ARCH green alone does not prove paying-client isolation (TB-1232 / TB-1005).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:sql\s+)?rls\b[^.\n]{0,80}\b(?:is|are|will\s+be)\b[^.\n]{0,60}\b"
            r"(?:the\s+)?(?:missing|required|beyond[-\s]predicate)\b[^.\n]{0,40}\b(?:control|fix|enforcement)\b",
            re.IGNORECASE,
        ),
        "SQL RLS is not the beyond-predicate fix — catalog routing is primary (TB-1232 / TB-1122).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:reinstat(?:e|ing)|add(?:ing)?)\b[^.\n]{0,40}\b(?:sql\s+)?rls\b[^.\n]{0,80}\b"
            r"(?:fixes?|solves?|enforces?)\b[^.\n]{0,40}\btenan(?:t|cy)\b",
            re.IGNORECASE,
        ),
        "Do not sell RLS reinstatement as tenancy enforcement (TB-1232 / ADR 0037).",
    ),
    ClaimPattern(
        re.compile(
            r"\biscopecontextprovider\b[^.\n]{0,80}\b(?:alone|by\s+itself)\b[^.\n]{0,60}\b"
            r"(?:proves?|means?|equals?)\b[^.\n]{0,40}\b(?:tenant\s+)?isolation\b",
            re.IGNORECASE,
        ),
        "Scope-provider threading alone is not paying-client isolation proof (TB-1232).",
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
        return [
            f"{CONTRACT_REL.as_posix()}: missing tenant DiD erosion contract (TB-1232)."
        ]

    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1233)."
        )

    return violations


def search_client_anchor_violations(root: Path) -> list[str]:
    path = root / SEARCH_CLIENT_REL

    if not path.is_file():
        return [f"{SEARCH_CLIENT_REL.as_posix()}: missing AzureSearchSdkClient anchor (TB-1233)."]

    text = path.read_text(encoding="utf-8", errors="replace")

    if "BuildRequiredScopeFilter" not in text:
        return [
            f"{SEARCH_CLIENT_REL.as_posix()}: expected BuildRequiredScopeFilter call anchor (TB-1233)."
        ]

    return []


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing tenant DiD erosion honesty scan target."]

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


def tenant_did_erosion_beyond_predicates_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(search_client_anchor_violations(root))

    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)

    violations = tenant_did_erosion_beyond_predicates_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Tenant DiD erosion beyond predicates honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Tenant DiD erosion beyond predicates honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
