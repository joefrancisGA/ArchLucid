#!/usr/bin/env python3
"""TB-1507 / M-275: Live vs nightly finding-quality tripwire honesty CI.

Fails dishonest stubs that:
- Claim real-mode-eval-nightly / TB-683 calls production AOAI or detects live model revs.
- Claim quality always degrades in ops before customers without a shipped live canary loop.
- Equate G-REAL-01 / release evidence gate with continuous tripwire monitoring.
- Claim Prometheus alone is a model-rev detector without ModelVersion/canary caveats.

Contract: docs/library/LIVE_VS_NIGHTLY_FINDING_QUALITY_TRIPWIRE_MAP.md (TB-1506).
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "live-vs-nightly-tripwire-honesty: allow"

CONTRACT_REL = Path("docs/library/LIVE_VS_NIGHTLY_FINDING_QUALITY_TRIPWIRE_MAP.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    Path("docs/library/AGENT_EVAL_CORPUS.md"),
    Path("docs/library/AGENT_OUTPUT_EVALUATION.md"),
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**Done**",
    "TB-1506",
    "TB-683",
    "frozen",
    "does **not** call",
    "no shipped",
    "Prometheus",
)

REQUIRED_PROCUREMENT_ANCHORS: tuple[str, ...] = (
    "live-vs-nightly-finding-quality-tripwire-m-276",
    "TB-1506",
    "TB-683",
    "does **not** call Azure OpenAI",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "never ",
    "not promise",
    "not claimed",
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
    "without ",
    "offline",
    "frozen",
    "fixture",
    "exemplar",
    "traffic-dependent",
    "not guaranteed",
    "not a live",
    "not shipped",
    "tb-1506",
    "tb-1507",
    "tb-683",
    "m-275",
    "m-276",
    "honest",
    "gap",
    "missing",
    "partial",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str
    source_of_truth: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\breal[-\s]?mode[-\s]?eval[-\s]?nightly\b[^.\n]{0,120}\b(?:calls?|hits?|uses?)\b[^.\n]{0,60}\b(?:production|live)\b[^.\n]{0,40}\b(?:AOAI|Azure OpenAI|OpenAI)\b",
            re.IGNORECASE,
        ),
        "real-mode-eval-nightly does not call production AOAI — it scores frozen exemplars (TB-683 / TB-1506).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bTB-683\b[^.\n]{0,120}\b(?:detects?|catches?|monitors?)\b[^.\n]{0,80}\b(?:live|production)\b[^.\n]{0,40}\b(?:model|AOAI|Azure)\b",
            re.IGNORECASE,
        ),
        "TB-683 nightly does not detect live Azure model revs — offline fixture scoring only (TB-1506).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bnightly\b[^.\n]{0,80}\b(?:real[-\s]?mode|eval)\b[^.\n]{0,120}\b(?:detects?|catches?|monitors?)\b[^.\n]{0,80}\b(?:model rev|model revision|silent rev)\b",
            re.IGNORECASE,
        ),
        "Do not claim nightly eval catches Azure silent model revisions (TB-1506 / M-275).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:always|we always)\b[^.\n]{0,80}\b(?:detect|know|see)\b[^.\n]{0,80}\bquality\b[^.\n]{0,80}\b(?:before|ahead of)\b[^.\n]{0,40}\bcustomers?\b",
            re.IGNORECASE,
        ),
        "Do not claim quality degradation is always detected before customers without a shipped live canary (TB-1506).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bG-REAL-01\b[^.\n]{0,120}\b(?:continuous|24\s*[×x]\s*7|24/7)\b[^.\n]{0,60}\b(?:monitor|tripwire|surveillance)\b",
            re.IGNORECASE,
        ),
        "G-REAL-01 is a release evidence gate, not continuous tripwire monitoring (TB-1506).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\brelease evidence gate\b[^.\n]{0,120}\bcontinuous\b[^.\n]{0,60}\b(?:monitor|tripwire)\b",
            re.IGNORECASE,
        ),
        "Release evidence gate is point-in-time proof, not continuous tripwire (TB-1506).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bPrometheus\b[^.\n]{0,120}\b(?:alone|by itself)\b[^.\n]{0,80}\b(?:detects?|catches?|proves?)\b[^.\n]{0,60}\bmodel\b",
            re.IGNORECASE,
        ),
        "Prometheus rate alerts are not a standalone model-rev detector — no ModelVersion tripwire shipped (TB-1506).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\blive real[-\s]?mode monitoring\b",
            re.IGNORECASE,
        ),
        "Do not label TB-683 nightly as live real-mode monitoring — use offline exemplar scoring (TB-1506).",
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
        return [f"{CONTRACT_REL.as_posix()}: missing tripwire contract (TB-1506)"]

    text = contract_path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required contract marker {marker!r} (TB-1506 / M-275)."
        )

    return violations


def procurement_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    rel = Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md")
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing procurement packet for M-276 tripwire anchors"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_PROCUREMENT_ANCHORS):
        violations.append(
            f"{rel.as_posix()}: missing required tripwire honesty anchor {marker!r} (M-276 / TB-1507)."
        )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    violations: list[str] = []
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing allowlisted tripwire honesty scan target"]

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


def live_vs_nightly_tripwire_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(procurement_anchor_violations(root))

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

    violations = live_vs_nightly_tripwire_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Live vs nightly tripwire honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Live vs nightly tripwire honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
