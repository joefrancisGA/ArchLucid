#!/usr/bin/env python3
"""TB-1464 / M-263: Weekly buyer-claim drift honesty CI.

Fails reintroduction of Critical drift class phrases from
``docs/library/WEEKLY_BUYER_CLAIM_DRIFT_2026_07_27.md`` (C1/C2/C3/C4/C5).

Contract: ``## TB-1463`` inventory + ``PUBLIC_CLAIM_BOUNDARY_GUIDE.md``.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "weekly-claim-drift-honesty: allow"

INVENTORY_REL = Path("docs/library/WEEKLY_BUYER_CLAIM_DRIFT_2026_07_27.md")

FILES_TO_SCAN: tuple[Path, ...] = (
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("archlucid-ui/src/lib/live-demo-page-copy.ts"),
    Path("archlucid-ui/src/lib/see-it-page-copy.ts"),
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "never ",
    "not use",
    "without ",
    "m-245",
    "open m-245",
    "g-real-05",
    "deferred",
    "illustrative",
    "fabricated",
    "sample",
    "marketing overview",
    "not the full governed",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"V1\.1\s+connectors\s*\(\s*Jira",
            re.IGNORECASE,
        ),
        "Stale connector row: native Jira/ServiceNow/Teams are V1 GA per V1_SCOPE — do not label topic V1.1-only (C1).",
    ),
    ClaimPattern(
        re.compile(
            r"do\s+not\s+promise\s+GA\s+in\s+V1",
            re.IGNORECASE,
        ),
        "Stale connector denial: do not promise native connectors absent from V1 after GA promotion (C1).",
    ),
    ClaimPattern(
        re.compile(
            r"TB-135\s+V1\.1\s+backlog",
            re.IGNORECASE,
        ),
        "Stale SOC row: TB-135 engineering is Done; point CPA deferral to G-REAL-05 (C2).",
    ),
    ClaimPattern(
        re.compile(
            r"two\s+weeks?\b[^.\n]{0,60}\btwo\s+hours?",
            re.IGNORECASE,
        ),
        "Unguarded quantified review-time ROI (two weeks → two hours) without M-245 basis (C3).",
    ),
    ClaimPattern(
        re.compile(
            r'LIVE_DEMO_PAGE_TITLE\s*=\s*["\']Live demo["\']',
            re.IGNORECASE,
        ),
        "Live demo must not be the primary H1/title — use sample-walkthrough honesty (C4 / TB-1265).",
    ),
    ClaimPattern(
        re.compile(
            r'LIVE_DEMO_PAGE_METADATA_TITLE[^"\n]*["\'][^"\n]*\blive demo\b',
            re.IGNORECASE,
        ),
        "Live demo must not appear in metadata title (C4 / TB-1265).",
    ),
    ClaimPattern(
        re.compile(
            r"SEE_IT_MARKETING_PDF_DOWNLOAD_LABEL[^;\n]*evidence bundle",
            re.IGNORECASE,
        ),
        "Marketing PDF download must not be labeled evidence bundle (C5 / TB-1283).",
    ),
    ClaimPattern(
        re.compile(
            r"SEE_IT_PAGE_TITLE[^;\n]*30\s+seconds?",
            re.IGNORECASE,
        ),
        "See-it title must not promise a 30-second micro-demo (C5 / TB-1280).",
    ),
)


def _line_for_match(text: str, match: re.Match[str]) -> str:
    line_start = text.rfind("\n", 0, match.start()) + 1
    line_end = text.find("\n", match.start())

    if line_end == -1:
        line_end = len(text)

    return text[line_start:line_end]


def _line_is_allowlisted(line: str) -> bool:
    return ALLOWLIST_MARKER in line.lower()


def _line_has_caveat(line: str) -> bool:
    lowered = line.lower()
    return any(marker in lowered for marker in _CAVEAT_MARKERS)


def weekly_buyer_claim_drift_honesty_errors(root: Path) -> list[str]:
    errors: list[str] = []

    inventory_path = root / INVENTORY_REL

    if not inventory_path.is_file():
        errors.append(f"missing inventory contract: {INVENTORY_REL}")
    else:
        inventory_text = inventory_path.read_text(encoding="utf-8", errors="replace")

        if "TB-1463" not in inventory_text or "C1" not in inventory_text:
            errors.append(f"{INVENTORY_REL}: missing TB-1463 / C1 inventory anchors")

    for rel in FILES_TO_SCAN:
        path = root / rel

        if not path.is_file():
            errors.append(f"missing scanned surface: {rel}")
            continue

        text = path.read_text(encoding="utf-8", errors="replace")

        for claim in CLAIM_PATTERNS:
            for match in claim.pattern.finditer(text):
                line = _line_for_match(text, match)

                if _line_is_allowlisted(line) or _line_has_caveat(line):
                    continue

                errors.append(
                    f"{rel}: {claim.message} Matched `{match.group(0)}`."
                )

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    errors = weekly_buyer_claim_drift_honesty_errors(REPO_ROOT)

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_weekly_buyer_claim_drift_honesty: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
