#!/usr/bin/env python3
"""TB-1121 / M-192: Anti-security-review-ready-without-musts honesty CI.

Fails dishonest stubs that:
- Claim first-security-review readiness with only M-114 (or without M-151 + M-118).
- Treat M-171 / FinOps idempotency as a first-review must without second-pass caveat.
- Equate first security review readiness with CPA SOC 2 / published third-party pen test.
- Mention first-security-review readiness without citing TB-1120 / M-193 ship-order anchors.

Contract: docs/library/FIRST_SECURITY_REVIEW_PA_ONE_PAGER_SHIP_ORDER_CONTRACT.md (TB-1120).
Does not reopen Done TB-135 / TB-136 (owner homes remain G-REAL-05 / G-ASSURANCE-02).
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "security-review-ready-honesty: allow"

CONTRACT_REL = Path("docs/library/FIRST_SECURITY_REVIEW_PA_ONE_PAGER_SHIP_ORDER_CONTRACT.md")
BUYER_PACKET_REL = Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md")
PA_ONE_PAGER_REL = Path(
    "docs/go-to-market/FIRST_SECURITY_REVIEW_PA_ONE_PAGER_SHIP_ORDER_PA_ONE_PAGER.md"
)

DOCS_TO_SCAN: tuple[Path, ...] = (
    BUYER_PACKET_REL,
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    Path("docs/library/WHAT_NOT_TO_PROMISE_UI_BUYER_RISK_MATRIX_CONTRACT.md"),
    Path("docs/go-to-market/PA_CLAIM_HONESTY_INDEX.md"),
    PA_ONE_PAGER_REL,
    CONTRACT_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1120**",
    "**TB-1121**",
    "M-192",
    "M-193",
    "Ship order",
    "Too strong vs safe",
    "CI anchors for **TB-1121**",
    "M-151",
    "M-118",
    "M-114",
)

REQUIRED_BUYER_PACKET_MARKERS: tuple[str, ...] = (
    "FIRST_SECURITY_REVIEW_PA_ONE_PAGER_SHIP_ORDER_CONTRACT.md",
    "TB-1120",
    "first-security-review-ship-order-m-193",
)

_SECURITY_REVIEW_READY_RE = re.compile(
    r"\b(?:ready\s+for\s+(?:the\s+)?first\s+(?:buyer\s+)?security\s+review|"
    r"first\s+(?:buyer\s+)?security\s+review\s+ready|"
    r"security\s+review\s+ready\s+for\s+(?:a\s+)?(?:buyer|controlled)\s+pilot)\b",
    re.IGNORECASE,
)

_SECURITY_REVIEW_CITATION_MARKERS: tuple[str, ...] = (
    "tb-1120",
    "tb-1121",
    "m-192",
    "m-193",
    "first_security_review_pa_one_pager_ship_order_contract.md",
    "first-security-review-ship-order-m-193",
    "first_security_review_pa_one_pager_ship_order_pa_one_pager.md",
    "ship order",
    "must before first security review",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
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
    "unsafe",
    "≠",
    "!=",
    "defer from",
    "deferred",
    "defer (finops",
    "not a first-review must",
    "not required",
    "agenda-dependent",
    "agenda driven",
    "self-attested",
    "g-real-05",
    "g-assurance-02",
    "tb-135",
    "tb-136",
    "finops / second pass",
    "second pass",
    "second-pass",
    "without cpa",
    "without cpa/3p",
    "does not reopen",
    "do not reopen",
    "fail stub",
    "intended fail",
    "ci anchor",
    "honesty guard",
    "separate owner",
    "owner program",
    "owner home",
)


def _is_markdown_table_data_row(line: str) -> bool:
    stripped = line.lstrip()

    if not stripped.startswith("|"):
        return False

    # Separator rows like | --- | --- |
    if re.match(r"^\|[\s|:-]+$", stripped):
        return False

    return stripped.count("|") >= 3


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str
    source_of_truth: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:ready\s+for\s+(?:the\s+)?first\s+(?:buyer\s+)?security\s+review|"
            r"first\s+(?:buyer\s+)?security\s+review\s+ready)\b[^.\n]{0,160}\b(?:only|"
            r"just|with)\b[^.\n]{0,80}\b(?:m-114|isolation\s+one-pager)\b",
            re.IGNORECASE,
        ),
        "First security review readiness requires M-151 + M-118 (+ M-114), not isolation alone (TB-1120).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:ready\s+for\s+(?:the\s+)?first\s+(?:buyer\s+)?security\s+review|"
            r"first\s+(?:buyer\s+)?security\s+review\s+ready)\b[^.\n]{0,120}\b(?:requires?|"
            r"must\s+include|needs?)\b[^.\n]{0,80}\b(?:m-171|process\s+vs\s+provider|"
            r"finops\s+idempotency|provider\s+idempotency)\b",
            re.IGNORECASE,
        ),
        "M-171 / FinOps idempotency is deferred from first security review (TB-1120 / M-192).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:m-171|process\s+vs\s+provider\s+idempotency)\b[^.\n]{0,120}\b(?:required|"
            r"mandatory|must[- ]have|gate)\b[^.\n]{0,80}\b(?:first\s+security\s+review|"
            r"security\s+review\s+ready)\b",
            re.IGNORECASE,
        ),
        "Do not require M-171 as a first security review gate — FinOps / second pass (TB-1120).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:security\s+review\s+ready|ready\s+for\s+(?:the\s+)?first\s+security\s+review)\b"
            r"[^.\n]{0,120}\b(?:=\s*|means?\s+|requires?\s+)\s*(?:cpa|soc\s*2|third[- ]party\s+pen)",
            re.IGNORECASE,
        ),
        "First security review readiness ≠ CPA SOC 2 / published 3P pen test (TB-1120 / G-REAL-05).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\ball\s+pa\s+one[- ]pagers?\s+must\s+ship\s+before\s+(?:the\s+)?first\s+security\s+review\b",
            re.IGNORECASE,
        ),
        "Must handouts are M-151 + M-118 (+ M-114); not every PA one-pager (TB-1120 / M-193).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:reopen|re-open)\b[^.\n]{0,80}\b(?:tb-135|tb-136)\b",
            re.IGNORECASE,
        ),
        "Do not reopen Done TB-135/TB-136 — CPA/3P execution stays on G-REAL-05 / G-ASSURANCE-02 (TB-1121).",
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


def _match_is_quoted_forbidden_example(line: str, match_start: int, match_end: int) -> bool:
    for open_quote, close_quote in (('"', '"'), ("“", "”"), ("‘", "’")):
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

    if stripped.startswith(("-", "*")) and ('no "' in stripped or "no “" in stripped):
        return True

    # Too-strong / Do-not-promise / CI-anchor matrices list forbidden stubs in cells.
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
        return [
            f"{CONTRACT_REL.as_posix()}: missing first security review ship-order contract (TB-1120)"
        ]

    text = contract_path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required contract marker {marker!r} (TB-1120 / TB-1121)."
        )

    return violations


def buyer_packet_violations(root: Path) -> list[str]:
    violations: list[str] = []
    path = root / BUYER_PACKET_REL

    if not path.is_file():
        return [f"{BUYER_PACKET_REL.as_posix()}: missing buyer security procurement packet (M-193)"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_BUYER_PACKET_MARKERS):
        violations.append(
            f"{BUYER_PACKET_REL.as_posix()}: missing required M-193 anchor {marker!r} (TB-1120 / TB-1121)."
        )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    violations: list[str] = []
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing allowlisted security review readiness honesty scan target"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for claim in CLAIM_PATTERNS:
        for match in claim.pattern.finditer(text):
            line = _line_for_match(text, match)
            line_start = text.rfind("\n", 0, match.start()) + 1
            match_start = match.start() - line_start
            match_end = match.end() - line_start
            line_lower = _normalize_line(line)

            if (
                _line_is_allowlisted(line)
                or _line_is_forbidden_example(line, match_start, match_end)
                or _line_has_caveat(line_lower)
            ):
                continue

            violations.append(
                f"{rel.as_posix()}: {claim.message} Matched `{match.group(0)}`. "
                f"Source of truth: {claim.source_of_truth}."
            )

    return violations


def scan_security_review_citations(root: Path, rel: Path) -> list[str]:
    """Require TB-1120 / M-193 near first-security-review-ready topic language."""
    violations: list[str] = []
    path = root / rel

    if not path.is_file():
        return []

    if rel in (CONTRACT_REL, BUYER_PACKET_REL):
        return []

    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()

    for index, line in enumerate(lines):
        if not _SECURITY_REVIEW_READY_RE.search(line):
            continue

        if _line_is_allowlisted(line):
            continue

        window_start = max(0, index - 2)
        window_end = min(len(lines), index + 3)
        window = "\n".join(lines[window_start:window_end]).lower()

        if any(marker in window for marker in _SECURITY_REVIEW_CITATION_MARKERS):
            continue

        violations.append(
            f"{rel.as_posix()}: first-security-review-ready language must cite TB-1120 / M-193 / "
            f"FIRST_SECURITY_REVIEW_PA_ONE_PAGER_SHIP_ORDER_CONTRACT.md near the claim. "
            f"Line {index + 1}: {line.strip()[:120]}"
        )

    return violations


def security_review_ready_without_musts_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(buyer_packet_violations(root))

    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))
        violations.extend(scan_security_review_citations(root, rel))

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--advisory",
        action="store_true",
        help="Warn-only exit 0 even when violations are found (local exploration).",
    )
    args = parser.parse_args(argv)

    violations = security_review_ready_without_musts_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Security review readiness honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Security review readiness honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
