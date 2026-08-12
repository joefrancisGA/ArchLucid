#!/usr/bin/env python3
"""TB-1010 / M-160: Anti-editable-audit / in-place-seal-rewrite / platform-WORM honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "append-only-sealed-evidence-honesty: allow"

CONTRACT_REL = Path("docs/library/APPEND_ONLY_AND_SEALED_EVIDENCE_CONTRACT.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/APPEND_ONLY_SEALED_EVIDENCE_PA_ONE_PAGER.md")
SEALED_REGISTRY_REL = Path("ArchLucid.Core/Persistence/SealedEvidenceTableRegistry.cs")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1009**",
    "**TB-1010**",
    "M-160",
    "M-161",
    "Non-claims",
    "CI anchors for **TB-1010**",
    "INV-011",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbidden",
    "too strong",
    "application-enforced",
    "not whole-product",
    "not platform",
    "customer-owned",
    "adr 0040",
    "tb-1009",
    "tb-1010",
    "m-160",
    "m-161",
    "honesty guard",
    "non-claim",
    "append correction",
    "legitimately mutable",
    "≠",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(r"\bedit(?:able)?\s+audit\s+log\b", re.IGNORECASE),
        "Audit events are append-only under app principal — not editable (TB-1009 / M-160).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:operators?|admins?)\s+can\s+edit\b[^.\n]{0,60}\b(?:the\s+)?audit\b",
            re.IGNORECASE,
        ),
        "Do not claim operators can edit audit history (TB-1009).",
    ),
    ClaimPattern(
        re.compile(
            r"\bfix\b[^.\n]{0,60}\bfindings?\b[^.\n]{0,60}\bafter\s+commit\b[^.\n]{0,40}\bin\s+place\b",
            re.IGNORECASE,
        ),
        "Do not claim in-place finding fixes after commit (TB-1009 / sealed evidence).",
    ),
    ClaimPattern(
        re.compile(
            r"\bplatform[-\s]operated\b[^.\n]{0,60}\bworm\b",
            re.IGNORECASE,
        ),
        "Platform-operated WORM is not shipped — ADR 0040 customer-export path (TB-1009).",
    ),
    ClaimPattern(
        re.compile(
            r"\barchlucid\b[^.\n]{0,80}\b(?:provides?|includes?|ships?)\b[^.\n]{0,60}\b(?:platform\s+)?worm\b",
            re.IGNORECASE,
        ),
        "ArchLucid does not ship platform WORM for all proof (TB-1009 / ADR 0040).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:whole[-\s]product|end[-\s]to[-\s]end)\b[^.\n]{0,60}\bappend[-\s]only\b",
            re.IGNORECASE,
        ),
        "Whole-product append-only overclaim — many surfaces are legitimately mutable (TB-1009).",
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
        return [f"{CONTRACT_REL.as_posix()}: missing append-only sealed evidence contract (TB-1009)."]

    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1010)."
        )

    return violations


def sealed_registry_anchor_violations(root: Path) -> list[str]:
    path = root / SEALED_REGISTRY_REL

    if not path.is_file():
        return [f"{SEALED_REGISTRY_REL.as_posix()}: missing SealedEvidenceTableRegistry (TB-1010)."]

    text = path.read_text(encoding="utf-8", errors="replace")

    if "SealedEvidenceTableRegistry" not in text:
        return [f"{SEALED_REGISTRY_REL.as_posix()}: expected sealed evidence registry anchor (TB-1010)."]

    return []


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing append-only sealed evidence honesty scan target."]

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


def append_only_sealed_evidence_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(sealed_registry_anchor_violations(root))

    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)

    violations = append_only_sealed_evidence_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Append-only sealed evidence honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Append-only sealed evidence honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
