#!/usr/bin/env python3
"""TB-1428 / M-259: Anti-live-demo-as-live-product / ladder-closed honesty CI.

Fails dishonest stubs that:
- Call `/live-demo` a live / Real / tenant product demo without fabricated-sample caveats.
- Narrate offline curated fallback as a live API session.
- Claim the see-it ladder or live-demo honesty is done while open ladder rows remain.
- Pair Contoso preview routes with Healthcare Claims chrome on `/live-demo` surfaces.

Contract: docs/library/LIVE_DEMO_SEE_IT_LADDER_HONESTY.md (TB-1427 / TB-1428).
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "live-demo-see-it-ladder-honesty: allow"

CONTRACT_REL = Path("docs/library/LIVE_DEMO_SEE_IT_LADDER_HONESTY.md")

LIVE_DEMO_SCAN_ROOT = Path("archlucid-ui/src/app/(marketing)/live-demo")

EXTRA_LIVE_DEMO_FILES: tuple[Path, ...] = (
    Path("archlucid-ui/src/lib/live-demo-page-copy.ts"),
    Path("archlucid-ui/src/lib/live-demo-see-it-ladder-copy.ts"),
    Path("archlucid-ui/src/lib/live-demo-evidence-copy.ts"),
)

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/DEMO_QUICKSTART.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    Path("docs/library/WEEKLY_BUYER_CLAIM_DRIFT_2026_07_27.md"),
)

GLOB_EXCLUDES: tuple[str, ...] = (
    ".test.ts",
    ".test.tsx",
    ".spec.ts",
    ".spec.tsx",
    ".fixtures.ts",
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1427**",
    "**TB-1428**",
    "Guided sample walkthrough",
    "fabricated sample",
    "Explicit non-claims",
    "check_live_demo_see_it_ladder_honesty.py",
)

REQUIRED_PROCUREMENT_ANCHORS: tuple[str, ...] = (
    "live-demo-see-it-ladder-m-260",
    "TB-1427",
    "TB-1428",
    "Guided fabricated sample walkthrough",
)

REQUIRED_LIVE_DEMO_COPY_MARKERS: tuple[str, ...] = (
    'LIVE_DEMO_PAGE_TITLE = "Guided sample walkthrough"',
    "fabricated",
)

OPEN_LADDER_ROW_PATTERN = re.compile(
    r"\|\s*\*\*TB-(\d+)\*\*\s*\|[^|\n]+\|\s*\*\*Open\*\*",
    re.IGNORECASE,
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "never ",
    "not promise",
    "not sell",
    "not a live",
    "not an authenticated",
    "forbidden",
    "anti-claim",
    "do-not-promise",
    "does not",
    "doesn't",
    "cannot",
    "can't",
    "not ",
    "no ",
    "without ",
    "fabricated sample",
    "fabricated",
    "illustrative",
    "anonymous public",
    "review finding",
    "residual",
    "remain open",
    "while tb-",
    "except ",
    "unless ",
    "tb-1428",
    "tb-1427",
    "m-259",
    "m-260",
    "honest",
    "live-demo-see-it-ladder-honesty: allow",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str
    source_of_truth: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"/live-demo\b[^.\n]{0,160}\b(?:live|real)\b[^.\n]{0,80}\b(?:product|tenant)\b[^.\n]{0,40}\bdemo\b",
            re.IGNORECASE,
        ),
        "Do not sell `/live-demo` as a live / Real / tenant product demo (TB-1427 / TB-1428).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:live|real)\b[^.\n]{0,80}\b(?:product|tenant)\b[^.\n]{0,80}\bdemo\b[^.\n]{0,80}/live-demo\b",
            re.IGNORECASE,
        ),
        "Do not sell `/live-demo` as a live / Real / tenant product demo (TB-1427 / TB-1428).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\boffline\b[^.\n]{0,120}\b(?:curated\s+)?(?:sample|fallback)\b[^.\n]{0,120}\b(?:live|real)\b[^.\n]{0,40}\bapi\b",
            re.IGNORECASE,
        ),
        "Do not narrate offline curated fallback as a live API session (TB-1427 / TB-1428).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:live|real)\b[^.\n]{0,40}\bapi\b[^.\n]{0,120}\boffline\b[^.\n]{0,80}\b(?:curated|fallback)\b",
            re.IGNORECASE,
        ),
        "Do not narrate offline curated fallback as a live API session (TB-1427 / TB-1428).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:see[-\s]?it\s+)?ladder\s+(?:is\s+)?(?:done|complete|finished|shipped|closed)\b",
            re.IGNORECASE,
        ),
        "Do not claim the see-it ladder is done while open ladder rows remain (TB-1428).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\blive[-\s]?demo\s+honesty\s+(?:is\s+)?(?:done|complete|finished|shipped)\b",
            re.IGNORECASE,
        ),
        "Do not claim live-demo honesty is done while open ladder rows remain (TB-1428).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"/live-demo\b[^.\n]{0,160}\bcontoso\b[^.\n]{0,120}\b(?:healthcare\s+)?claims\b",
            re.IGNORECASE,
        ),
        "Do not pair Contoso preview payload with Healthcare Claims chrome on `/live-demo` (TB-1029 class).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:healthcare\s+)?claims\b[^.\n]{0,120}\bcontoso\b[^.\n]{0,80}/live-demo\b",
            re.IGNORECASE,
        ),
        "Do not pair Contoso preview payload with Healthcare Claims chrome on `/live-demo` (TB-1029 class).",
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

    if stripped.startswith("|") and "forbidden" in stripped:
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


def _parse_open_ladder_row_ids(contract_text: str) -> list[str]:
    return sorted({match.group(1) for match in OPEN_LADDER_ROW_PATTERN.finditer(contract_text)})


def _ladder_closure_claim_allowed(line_lower: str, open_row_ids: list[str]) -> bool:
    if not open_row_ids:
        return True

    if "review finding" in line_lower:
        return True

    return any(f"tb-{row_id}" in line_lower for row_id in open_row_ids)


def contract_violations(root: Path) -> list[str]:
    violations: list[str] = []
    contract_path = root / CONTRACT_REL

    if not contract_path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing live-demo see-it ladder contract (TB-1427)."]

    text = contract_path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required contract marker {marker!r} (TB-1428 / M-259)."
        )

    return violations


def procurement_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    rel = Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md")
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing procurement packet for M-260 ladder anchors"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_PROCUREMENT_ANCHORS):
        violations.append(
            f"{rel.as_posix()}: missing required ladder honesty anchor {marker!r} (M-259 / TB-1428)."
        )

    return violations


def live_demo_copy_violations(root: Path) -> list[str]:
    violations: list[str] = []
    rel = Path("archlucid-ui/src/lib/live-demo-page-copy.ts")
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing live-demo page copy module (TB-1265)."]

    text = path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_LIVE_DEMO_COPY_MARKERS):
        violations.append(
            f"{rel.as_posix()}: missing required honest title marker {marker!r} (TB-1265 / TB-1428)."
        )

    if re.search(r'LIVE_DEMO_PAGE_TITLE\s*=\s*["\']Live demo["\']', text, re.IGNORECASE):
        violations.append(
            f"{rel.as_posix()}: LIVE_DEMO_PAGE_TITLE must not be Live demo (TB-1265 / TB-1428)."
        )

    return violations


def _should_skip(path: Path) -> bool:
    name = path.name.lower()
    return any(fragment in name for fragment in GLOB_EXCLUDES)


def _collect_live_demo_files(root: Path) -> list[Path]:
    files: list[Path] = []

    for rel in EXTRA_LIVE_DEMO_FILES:
        path = root / rel

        if path.is_file():
            files.append(path)

    scan_root = root / LIVE_DEMO_SCAN_ROOT

    if scan_root.is_dir():
        for candidate in scan_root.rglob("*"):
            if not candidate.is_file():
                continue

            if candidate.suffix.lower() not in (".ts", ".tsx"):
                continue

            if _should_skip(candidate):
                continue

            files.append(candidate)

    return sorted(set(files))


def scan_live_demo_file(root: Path, path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8", errors="replace")
    display = path.relative_to(root).as_posix() if path.is_relative_to(root) else str(path)
    violations: list[str] = []

    for line_no, line in enumerate(text.splitlines(), start=1):
        if _line_is_allowlisted(line):
            continue

        line_lower = _normalize_line(line)

        if re.search(r'["\']Live demo["\']', line) and "not" not in line_lower:
            violations.append(
                f"{display}:{line_no}: customer-facing Live demo title on `/live-demo` surface (TB-1265 / TB-1428)."
            )

        if "/demo/preview" in line and "contoso" in line_lower and "claims" in line_lower:
            if not _line_has_caveat(line_lower):
                violations.append(
                    f"{display}:{line_no}: Contoso preview must not pair with Claims chrome on `/live-demo` (TB-1428)."
                )

    return violations


def scan_doc_claims(root: Path, rel: Path, open_row_ids: list[str]) -> list[str]:
    violations: list[str] = []
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing allowlisted live-demo ladder honesty scan target"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for claim in CLAIM_PATTERNS:
        for match in claim.pattern.finditer(text):
            line = _line_for_match(text, match)
            line_lower = _normalize_line(line)

            if _line_is_allowlisted(line) or _line_is_forbidden_example(line, match):
                continue

            if _line_has_caveat(line_lower):
                continue

            if claim.message.startswith("Do not claim") and not _ladder_closure_claim_allowed(
                line_lower, open_row_ids
            ):
                violations.append(
                    f"{rel.as_posix()}: {claim.message} Matched `{match.group(0)}`. "
                    f"Open ladder rows: {', '.join(f'TB-{row_id}' for row_id in open_row_ids)}. "
                    f"Source of truth: {claim.source_of_truth}."
                )
                continue

            if not claim.message.startswith("Do not claim"):
                violations.append(
                    f"{rel.as_posix()}: {claim.message} Matched `{match.group(0)}`. "
                    f"Source of truth: {claim.source_of_truth}."
                )

    return violations


def live_demo_see_it_ladder_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(procurement_anchor_violations(root))
    violations.extend(live_demo_copy_violations(root))

    contract_path = root / CONTRACT_REL
    open_row_ids: list[str] = []

    if contract_path.is_file():
        contract_text = contract_path.read_text(encoding="utf-8", errors="replace")
        open_row_ids = _parse_open_ladder_row_ids(contract_text)

    for path in _collect_live_demo_files(root):
        violations.extend(scan_live_demo_file(root, path))

    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel, open_row_ids))

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--advisory",
        action="store_true",
        help="Warn-only exit 0 even when violations are found (local exploration).",
    )
    args = parser.parse_args(argv)

    violations = live_demo_see_it_ladder_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Live demo see-it ladder honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Live demo see-it ladder honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
