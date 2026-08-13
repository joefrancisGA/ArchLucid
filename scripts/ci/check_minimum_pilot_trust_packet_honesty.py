#!/usr/bin/env python3
"""TB-1113 / M-190: Anti-CPA/3P-pen-test-as-pilot-trust-packet honesty CI.

Fails dishonest stubs that:
- Require CPA-issued SOC 2 or a published third-party pen test as the Stage 0
  single-pilot trust bar.
- Equate Trust Center / SOC self-assessment / owner-conducted pen-style summary
  with "SOC 2 certified" or "third-party pen tested."
- Hedge with "SOC 2 ready/almost/in process" or "pen test in flight" without
  ASSURANCE_STATUS_CANONICAL / TB-1112 caveats.
- Mention "pilot trust packet" / paid-pilot security readiness without citing
  TB-1112 / M-191 / the minimum-packet contract.

Contract: docs/library/MINIMUM_PILOT_TRUST_PACKET_WITHOUT_CPA_CONTRACT.md (TB-1112).
Does not reopen Done TB-135 / TB-136 (owner homes remain G-REAL-05 / G-ASSURANCE-02).
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "minimum-pilot-trust-packet-honesty: allow"

CONTRACT_REL = Path("docs/library/MINIMUM_PILOT_TRUST_PACKET_WITHOUT_CPA_CONTRACT.md")
BUYER_PACKET_REL = Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md")
ASSURANCE_STATUS_REL = Path("docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    Path("docs/library/WHAT_NOT_TO_PROMISE_UI_BUYER_RISK_MATRIX_CONTRACT.md"),
    Path("docs/go-to-market/PA_CLAIM_HONESTY_INDEX.md"),
    Path("docs/go-to-market/MINIMUM_PILOT_TRUST_PACKET_WITHOUT_CPA_PA_ONE_PAGER.md"),
    CONTRACT_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1112**",
    "**TB-1113**",
    "G-REAL-05",
    "G-ASSURANCE-02",
    "Include (minimum Stage 0 bar)",
    "Drop / defer",
    "Too-strong vs safe",
    "M-190",
    "M-191",
)

REQUIRED_BUYER_PACKET_MARKERS: tuple[str, ...] = (
    "MINIMUM_PILOT_TRUST_PACKET_WITHOUT_CPA_CONTRACT.md",
    "TB-1112",
    "minimum-pilot-trust-packet-m-191",
)

_PILOT_TRUST_TOPIC_RE = re.compile(
    r"\b(?:pilot\s+trust\s+packet|minimum\s+pilot\s+trust|"
    r"ready\s+for\s+(?:a\s+)?paid\s+pilot\s+security\s+conversation|"
    r"stage\s*0\s+(?:single[- ]pilot\s+)?trust\s+bar)\b",
    re.IGNORECASE,
)

_PILOT_TRUST_CITATION_MARKERS: tuple[str, ...] = (
    "tb-1112",
    "tb-1113",
    "m-190",
    "m-191",
    "minimum_pilot_trust_packet_without_cpa_contract.md",
    "minimum-pilot-trust-packet-m-191",
    "minimum_pilot_trust_packet_without_cpa_pa_one_pager.md",
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
    "drop / defer",
    "not required",
    "not a stage 0",
    "not stage 0",
    "self-attested",
    "self-assessed",
    "labeled as substitutes",
    "g-real-05",
    "g-assurance-02",
    "tb-1112",
    "tb-1113",
    "tb-135",
    "tb-136",
    "tb-005",
    "m-190",
    "m-191",
    "assurance_status_canonical",
    "not issued",
    "not yet",
    "owner-conducted",
    "owner home",
    "without cpa",
    "without cpa/3p",
    "does not reopen",
    "do not reopen",
    "fail stub",
    "intended fail",
    "ci anchor",
    "honesty guard",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str
    source_of_truth: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:pilot\s+trust|stage\s*0\s+(?:single[- ]pilot\s+)?trust|"
            r"single[- ]pilot\s+trust\s+bar)\b[^.\n]{0,120}\b(?:requires?|must\s+include|"
            r"needs?|depends\s+on)\b[^.\n]{0,80}\b(?:cpa(?:[- ]issued)?\s+soc\s*2|"
            r"soc\s*2\s+(?:type\s*[ii12]+\s+)?(?:report|attestation)|"
            r"published\s+third[- ]party\s+pen(?:etration)?\s*test)\b",
            re.IGNORECASE,
        ),
        "Do not require CPA SOC 2 or published 3P pen test as Stage 0 pilot trust (TB-1112 / M-190).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:cpa(?:[- ]issued)?\s+soc\s*2|published\s+third[- ]party\s+pen(?:etration)?\s*test)"
            r"\b[^.\n]{0,120}\b(?:required|mandatory|must[- ]have|gate)\b[^.\n]{0,80}\b"
            r"(?:pilot\s+trust|stage\s*0|single[- ]pilot|paid\s+pilot)\b",
            re.IGNORECASE,
        ),
        "CPA SOC 2 / published 3P pen test is not the Stage 0 single-pilot trust gate (TB-1112).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:trust\s+center|soc\s+self[- ]assessment|owner[- ]conducted\s+pen(?:etration)?[- ]?"
            r"(?:style\s+)?summary)\b[^.\n]{0,100}(?:\s*=\s*|\bequals?\b|\bmeans?\b|\bis\b)[^.\n]{0,60}\b"
            r"(?:soc\s*2\s+certified|third[- ]party\s+pen(?:etration)?\s+tested|"
            r"cpa(?:[- ]issued)?\s+soc\s*2)\b",
            re.IGNORECASE,
        ),
        "Self-attested substitutes ≠ SOC 2 certified / third-party pen tested (TB-1112 / M-190).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:we\s+are|archlucid\s+is)\s+(?:soc\s*2\s+certified|third[- ]party\s+pen(?:etration)?\s+tested)\b",
            re.IGNORECASE,
        ),
        "Do not claim SOC 2 certified or third-party pen tested without published artifacts (TB-1112).",
        ASSURANCE_STATUS_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bindependent\s+pen(?:etration)?\s+test\s+(?:available|complete|published)\b",
            re.IGNORECASE,
        ),
        "Do not claim independent/published pen test availability — owner home is G-ASSURANCE-02 (TB-1112).",
        ASSURANCE_STATUS_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bsoc\s*2\s+(?:ready|almost|in\s+process|in\s+flight)\b",
            re.IGNORECASE,
        ),
        "Forbidden SOC 2 hedge — use ASSURANCE_STATUS_CANONICAL / planned wording (TB-1112 / M-190).",
        ASSURANCE_STATUS_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bpen(?:etration)?\s+test\s+(?:in\s+flight|underway|pending\s+engagement)\b",
            re.IGNORECASE,
        ),
        "Forbidden pen-test-in-flight hedge when only SoW/template exists (TB-1112 / M-190).",
        ASSURANCE_STATUS_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:reopen|re-open)\b[^.\n]{0,80}\b(?:tb-135|tb-136)\b",
            re.IGNORECASE,
        ),
        "Do not reopen Done TB-135/TB-136 — CPA/3P execution stays on G-REAL-05 / G-ASSURANCE-02 (TB-1113).",
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

    if stripped.startswith("|") and (
        "unsafe" in stripped
        or "forbid" in stripped
        or "too strong" in stripped
        or "drop / defer" in stripped
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
        return [f"{CONTRACT_REL.as_posix()}: missing minimum pilot trust packet contract (TB-1112)"]

    text = contract_path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required contract marker {marker!r} (TB-1112 / TB-1113)."
        )

    return violations


def buyer_packet_violations(root: Path) -> list[str]:
    violations: list[str] = []
    path = root / BUYER_PACKET_REL

    if not path.is_file():
        return [f"{BUYER_PACKET_REL.as_posix()}: missing buyer security procurement packet (M-191)"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_BUYER_PACKET_MARKERS):
        violations.append(
            f"{BUYER_PACKET_REL.as_posix()}: missing required M-191 anchor {marker!r} (TB-1112 / TB-1113)."
        )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    violations: list[str] = []
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing allowlisted minimum pilot trust packet honesty scan target"]

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


def scan_pilot_trust_citations(root: Path, rel: Path) -> list[str]:
    """Require TB-1112 / M-191 near pilot-trust-packet topic language."""
    violations: list[str] = []
    path = root / rel

    if not path.is_file():
        return []

    # Contract + buyer packet are the SoT; do not demand self-citation windows.
    if rel in (CONTRACT_REL, BUYER_PACKET_REL):
        return []

    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()

    for index, line in enumerate(lines):
        if not _PILOT_TRUST_TOPIC_RE.search(line):
            continue

        if _line_is_allowlisted(line):
            continue

        window_start = max(0, index - 2)
        window_end = min(len(lines), index + 3)
        window = "\n".join(lines[window_start:window_end]).lower()

        if any(marker in window for marker in _PILOT_TRUST_CITATION_MARKERS):
            continue

        violations.append(
            f"{rel.as_posix()}: pilot-trust-packet language must cite TB-1112 / M-191 / "
            f"MINIMUM_PILOT_TRUST_PACKET_WITHOUT_CPA_CONTRACT.md near the claim. "
            f"Line {index + 1}: {line.strip()[:120]}"
        )

    return violations


def minimum_pilot_trust_packet_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(buyer_packet_violations(root))

    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))
        violations.extend(scan_pilot_trust_citations(root, rel))

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--advisory",
        action="store_true",
        help="Warn-only exit 0 even when violations are found (local exploration).",
    )
    args = parser.parse_args(argv)

    violations = minimum_pilot_trust_packet_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Minimum pilot trust packet honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Minimum pilot trust packet honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
