#!/usr/bin/env python3
"""TB-1625 / M-298: Anti-WASM-rule-sandbox / anti-pack-RCE / anti-platform-wide-degrade honesty CI.

Fails dishonest stubs that:
- Claim customer policy-pack rules execute in a WASM / Firecracker / per-rule process sandbox
  without naming the declarative in-process interpreter.
- Claim pack JSON is a general scripting / RCE surface.
- Claim broken packs cannot affect reviews (self-degrade is allowed for the authoring tenant).
- Claim a malicious pack equals platform-wide outage or cross-tenant data rewrite without
  naming tenant scoping + OrganizationPrivate.
- Equate execute-time resolve with durable pre-commit pack-version pin (commit snapshot is the pin).

Contract: docs/library/POLICY_PACK_CUSTOMER_RULE_SANDBOX_PIN_BLAST_RADIUS_CLAIM_MAP.md (TB-1624).
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "policy-pack-customer-rule-sandbox-honesty: allow"

CONTRACT_REL = Path("docs/library/POLICY_PACK_CUSTOMER_RULE_SANDBOX_PIN_BLAST_RADIUS_CLAIM_MAP.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/POLICY_PACK_CUSTOMER_RULE_SANDBOX_PA_ONE_PAGER.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1624**",
    "**TB-1625**",
    "M-298",
    "WASM",
    "RuleSetHash",
    "EffectiveGovernanceAtCommit",
    "DecisionRuleCriteriaEvaluator",
    "**TB-1324**",
)

REQUIRED_PA_ONE_PAGER_MARKERS: tuple[str, ...] = (
    "POLICY_PACK_CUSTOMER_RULE_SANDBOX_PIN_BLAST_RADIUS_CLAIM_MAP.md",
    "TB-1624",
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
    "not ",
    "no ",
    "not shipped",
    "not a wasm",
    "not wasm",
    "≠",
    "!=",
    "m-298",
    "m-299",
    "tb-1624",
    "tb-1625",
    "tb-1324",
    "tb-082",
    "forbid",
    "unsafe",
    "honest",
    "declarative",
    "in-process",
    "bounded",
    "tenant-local",
    "tenant-scoped",
    "self-degrade",
    "commit-time",
    "commit snapshot",
    "contrast only",
    "review finding",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str
    source_of_truth: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:customer\s+)?(?:policy[-\s]?pack\s+)?(?:rules?|packs?)\b[^.\n]{0,80}\b"
            r"(?:run|execute|executes?|evaluated?|evaluation)\b[^.\n]{0,80}\b"
            r"(?:in\s+)?(?:a\s+)?(?:secure\s+)?(?:wasm|webassembly|firecracker)\b",
            re.IGNORECASE,
        ),
        "Do not claim policy-pack rules run in a WASM/Firecracker sandbox (TB-1624 / M-298).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:wasm|webassembly|firecracker)\b[^.\n]{0,80}\b(?:sandbox|isolation)\b[^.\n]{0,80}\b"
            r"(?:for\s+)?(?:policy[-\s]?pack|customer\s+rules?|pack\s+rules?)\b",
            re.IGNORECASE,
        ),
        "WASM/Firecracker sandbox is not the policy-pack evaluation model (TB-1624 / TB-1625).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bper[-\s]?rule\b[^.\n]{0,60}\b(?:process|container|job)\b[^.\n]{0,60}\b"
            r"(?:sandbox|isolation|isolate[sd]?)\b",
            re.IGNORECASE,
        ),
        "Per-rule process/container isolation is not shipped for pack evaluation (TB-1624).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:pack|policy[-\s]?pack)\s+json\b[^.\n]{0,80}\b"
            r"(?:is|are|provides?|enables?|allows?)\b(?!\s+not\b)[^.\n]{0,80}\b"
            r"(?:arbitrary\s+)?(?:code|rce|remote\s+code|script(?:ing)?|eval)\b",
            re.IGNORECASE,
        ),
        "Pack JSON is declarative data — not a scripting/RCE surface (TB-1624 / M-298).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:customer\s+)?(?:policy[-\s]?packs?)\b[^.\n]{0,40}\b"
            r"(?:are|is)\b(?!\s+not\b)[^.\n]{0,40}\b(?:a\s+)?(?:general\s+)?(?:scripting|rce|turing)\b",
            re.IGNORECASE,
        ),
        "Do not claim packs are a general scripting / RCE / Turing surface (TB-1624 / TB-1324).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bbroken\s+packs?\b[^.\n]{0,80}\bcannot\s+affect\b[^.\n]{0,40}\breviews?\b",
            re.IGNORECASE,
        ),
        "Broken packs can affect the authoring tenant's reviews — self-degrade is allowed (TB-1624).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bbroken\s+(?:or\s+malicious\s+)?(?:rules?|packs?)\b[^.\n]{0,80}\b"
            r"(?:never|cannot|can't|do\s+not)\b[^.\n]{0,60}\b(?:affect|degrade)\b[^.\n]{0,40}\breviews?\b",
            re.IGNORECASE,
        ),
        "Do not claim broken packs never affect reviews without tenant-scope nuance (TB-1624 / M-298).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bmalicious\s+packs?\b[^.\n]{0,100}\b"
            r"(?:takes?\s+down|degrades?|compromises?|outages?)\b[^.\n]{0,80}\b"
            r"(?:the\s+)?(?:platform|all\s+tenants?|other\s+tenants?|cross[-\s]?tenant)\b",
            re.IGNORECASE,
        ),
        "Malicious packs do not equal platform-wide / cross-tenant outage (TB-1624 / M-298).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:platform[-\s]?wide|all[-\s]?tenant)\b[^.\n]{0,80}\b"
            r"(?:outage|degrade|degradation|compromise)\b[^.\n]{0,80}\b"
            r"(?:via|from|by)\b[^.\n]{0,40}\b(?:malicious\s+)?(?:policy[-\s]?)?packs?\b",
            re.IGNORECASE,
        ),
        "Do not claim pack content causes platform-wide degrade without tenant scoping (TB-1624).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:execute[-\s]?time|at\s+execute)\b[^.\n]{0,80}\b"
            r"(?:durable[-\s]?)?(?:pre[-\s]?commit\s+)?(?:pack[-\s]?version\s+)?pin(?:s|ned)?\b",
            re.IGNORECASE,
        ),
        "Execute-time resolve is not the durable pack-version pin — commit snapshot is (TB-1624).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:pack[-\s]?versions?|policy[-\s]?pack\s+versions?)\b[^.\n]{0,80}\b"
            r"(?:are|is)\b[^.\n]{0,60}\b(?:durable(?:ly)?\s+)?(?:pinned|pin)\b[^.\n]{0,60}\b"
            r"(?:at\s+)?(?:execute|execution|resolve)\b",
            re.IGNORECASE,
        ),
        "Do not equate execute-time resolve with durable commit-time pack pin (TB-1624 / TB-1625).",
        CONTRACT_REL.as_posix(),
    ),
)


@dataclass(frozen=True)
class _LineRelativeMatch:
    start: int
    end: int


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


def _match_is_quoted_forbidden_example(line: str, match: _LineRelativeMatch) -> bool:
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

            if quoted_start <= match.start and match.end <= quoted_end:
                return True

    return False


def _match_in_final_table_cell(line: str, match: _LineRelativeMatch) -> bool:
    """Contrast tables put forbidden phrasing in the last column (What it is not / Too strong)."""
    if "|" not in line:
        return False

    parts = line.split("|")

    if len(parts) < 4:
        return False

    cells = [part.strip() for part in parts[1:-1]]

    if len(cells) < 3:
        return False

    last_cell = cells[-1]

    if not last_cell:
        return False

    cell_start = line.rfind(last_cell)

    if cell_start < 0:
        return False

    cell_end = cell_start + len(last_cell)

    return cell_start <= match.start and match.end <= cell_end


def _line_is_forbidden_example(line: str, match: _LineRelativeMatch) -> bool:
    if _match_is_quoted_forbidden_example(line, match):
        return True

    if _match_in_final_table_cell(line, match):
        return True

    stripped = line.lstrip().lower()

    if stripped.startswith(("-", "*")) and ('no "' in stripped or "no “" in stripped):
        return True

    if stripped.startswith("|") and (
        "unsafe" in stripped or "forbid" in stripped or "too strong" in stripped
    ):
        return True

    return False


def _line_has_caveat(line_lower: str, matched_lower: str) -> bool:
    # Strip the matched claim so words like "cannot" inside an overclaim do not self-exempt.
    remainder = line_lower.replace(matched_lower, " ", 1)

    return any(marker in remainder for marker in _CAVEAT_MARKERS)


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
            f"{CONTRACT_REL.as_posix()}: missing policy-pack customer-rule sandbox claim map (TB-1624)"
        ]

    text = contract_path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required contract marker {marker!r} (TB-1624 / TB-1625)."
        )

    return violations


def pa_one_pager_violations(root: Path) -> list[str]:
    violations: list[str] = []
    path = root / PA_ONE_PAGER_REL

    if not path.is_file():
        return [f"{PA_ONE_PAGER_REL.as_posix()}: missing PA one-pager (M-299)"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_PA_ONE_PAGER_MARKERS):
        violations.append(
            f"{PA_ONE_PAGER_REL.as_posix()}: missing required PA anchor {marker!r} (M-299 / TB-1625)."
        )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    violations: list[str] = []
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing allowlisted policy-pack sandbox honesty scan target"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for claim in CLAIM_PATTERNS:
        for match in claim.pattern.finditer(text):
            line = _line_for_match(text, match)
            line_start = text.rfind("\n", 0, match.start()) + 1
            line_match = _LineRelativeMatch(match.start() - line_start, match.end() - line_start)
            line_lower = _normalize_line(line)

            matched_lower = _normalize_line(match.group(0))

            if (
                _line_is_allowlisted(line)
                or _line_is_forbidden_example(line, line_match)
                or _line_has_caveat(line_lower, matched_lower)
            ):
                continue

            violations.append(
                f"{rel.as_posix()}: {claim.message} Matched `{match.group(0)}`. "
                f"Source of truth: {claim.source_of_truth}."
            )

    return violations


def policy_pack_customer_rule_sandbox_honesty_violations(root: Path) -> list[str]:
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

    violations = policy_pack_customer_rule_sandbox_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Policy-pack customer-rule sandbox honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Policy-pack customer-rule sandbox honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
