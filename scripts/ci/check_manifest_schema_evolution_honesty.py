#!/usr/bin/env python3
"""TB-1278 / M-223: GoldenManifest content-schema evolution honesty CI.

Fails dishonest stubs that:
- Claim SQL/CLR SchemaVersion alone keeps old committed manifests readable/upgraded.
- Claim dual-write windows migrate or rewrite historical sealed manifest content.
- Claim shipping new sections/columns rewrites sealed packages in place.

Contract: docs/library/MANIFEST_CONTENT_SCHEMA_EVOLUTION_CONTRACT.md (TB-1277).
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "manifest-schema-evolution-honesty: allow"

CONTRACT_REL = Path("docs/library/MANIFEST_CONTENT_SCHEMA_EVOLUTION_CONTRACT.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/MANIFEST_CONTENT_SCHEMA_EVOLUTION_PA_ONE_PAGER.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1277**",
    "tolerant",
    "upcasting",
    "dual-write",
    "never rewritten",
    "default-empty",
    "M-223",
)

REQUIRED_PA_ONE_PAGER_MARKERS: tuple[str, ...] = (
    "MANIFEST_CONTENT_SCHEMA_EVOLUTION_CONTRACT.md",
    "TB-1277",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "never ",
    "not promise",
    "not claim",
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
    "unsafe",
    "honest",
    "tolerant",
    "upcasting",
    "default-empty",
    "default empty",
    "activate-or-retire",
    "activate or retire",
    "storage layout",
    "storage-layout",
    "storage compat",
    "append-only",
    "never rewritten",
    "tb-1277",
    "tb-1278",
    "m-223",
    "m-224",
    "forbid",
    "≠",
    "!=",
    "not a migration",
    "not content migration",
    "not rewrite",
    "without rewrite",
    "without migrating",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str
    source_of_truth: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\bSchemaVersion\b[^.\n]{0,120}\b(?:upgrades?|migrates?|rewrites?)\b[^.\n]{0,80}\b(?:history|historical|sealed|old)\b",
            re.IGNORECASE,
        ),
        "Do not claim SchemaVersion upgrades or rewrites historical sealed manifests (TB-1277 / M-223).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bschema[-\s]?version\b[^.\n]{0,120}\b(?:alone|by itself|automatically)\b[^.\n]{0,80}\b(?:keeps?|makes?|ensures?)\b[^.\n]{0,80}\b(?:readable|compatible|upgraded)\b",
            re.IGNORECASE,
        ),
        "SchemaVersion alone is not the V1 readability mechanism — tolerant readers are primary (TB-1277).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bdual[-\s]?write\b[^.\n]{0,120}\b(?:upgrades?|migrates?|rewrites?)\b[^.\n]{0,80}\b(?:sealed|historical|history|committed)\b",
            re.IGNORECASE,
        ),
        "Dual-write is storage-layout compat only — it does not migrate sealed manifest content (TB-1277 / TB-1263).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bdual[-\s]?write\b[^.\n]{0,120}\b(?:content migration|migrates? content|upgrades? content)\b",
            re.IGNORECASE,
        ),
        "Do not equate dual-write windows with sealed-content migration (TB-1277).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:new|shipping)\s+(?:section|column)s?\b[^.\n]{0,120}\b(?:rewrites?|updates?|migrates?)\b[^.\n]{0,80}\bsealed\b",
            re.IGNORECASE,
        ),
        "Shipping new sections/columns must not rewrite sealed packages — append-only / tolerant readers (TB-1277 / ADR 0039).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\brewrites?\s+sealed\s+(?:packages?|manifests?|rows?)\b",
            re.IGNORECASE,
        ),
        "Sealed golden manifests are never rewritten in place (TB-1277 / M-223).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:in[-\s]?place|automatic)\b[^.\n]{0,80}\b(?:schema|content)\s+(?:upgrade|migration)\b[^.\n]{0,80}\b(?:sealed|committed|historical)\b",
            re.IGNORECASE,
        ),
        "Do not claim in-place schema/content upgrades of sealed committed manifests (TB-1277).",
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

    if stripped.startswith("|") and ("unsafe" in stripped or "forbid" in stripped):
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
        return [f"{CONTRACT_REL.as_posix()}: missing manifest schema evolution contract (TB-1277)"]

    text = contract_path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required contract marker {marker!r} (TB-1277 / TB-1278)."
        )

    return violations


def pa_one_pager_violations(root: Path) -> list[str]:
    violations: list[str] = []
    path = root / PA_ONE_PAGER_REL

    if not path.is_file():
        return [f"{PA_ONE_PAGER_REL.as_posix()}: missing PA one-pager (M-224)"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_PA_ONE_PAGER_MARKERS):
        violations.append(
            f"{PA_ONE_PAGER_REL.as_posix()}: missing required PA anchor {marker!r} (M-224 / TB-1278)."
        )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    violations: list[str] = []
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing allowlisted manifest schema evolution honesty scan target"]

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


def manifest_schema_evolution_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(pa_one_pager_violations(root))

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

    violations = manifest_schema_evolution_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Manifest schema evolution honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Manifest schema evolution honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
