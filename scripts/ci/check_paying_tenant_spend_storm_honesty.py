#!/usr/bin/env python3
"""TB-1571 / M-294: Anti-unbounded-key-spend / anti-product-meter-equals-Azure-invoice honesty CI.

Fails dishonest stubs that:
- Claim paying tenants or API keys cannot create an LLM spend storm.
- Claim stolen API keys cannot burn money or that spend is per-key isolated.
- Claim product AI usage equals Azure OpenAI invoices or automated dispute reconciliation ships.
- Claim Azure RG consumption budgets hard-stop product LLM.
- Conflate Quick Scan anonymous gates with the paid-tenant control plane.

Contract: docs/library/PAYING_TENANT_LLM_SPEND_STORM_AND_BILLING_DISPUTE_CLAIM_MAP.md (TB-1570).
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "paying-tenant-spend-storm-honesty: allow"

CONTRACT_REL = Path("docs/library/PAYING_TENANT_LLM_SPEND_STORM_AND_BILLING_DISPUTE_CLAIM_MAP.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/PAYING_TENANT_LLM_SPEND_STORM_PA_ONE_PAGER.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1570**",
    "compromised API key",
    "estimated",
    "M-294",
    "**TB-1571**",
    "LlmCompletionAccountingClient",
    "**TB-1287**",
)

REQUIRED_PA_ONE_PAGER_MARKERS: tuple[str, ...] = (
    "PAYING_TENANT_LLM_SPEND_STORM_AND_BILLING_DISPUTE_CLAIM_MAP.md",
    "TB-1570",
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
    "unsafe",
    "honest",
    "≠",
    "!=",
    "m-294",
    "m-295",
    "tb-1570",
    "tb-1571",
    "tb-1287",
    "m-225",
    "forbid",
    "estimated",
    "showback",
    "until revoke",
    "headroom",
    "different plane",
    "contrast only",
    "notify",
    "not shipped",
    "not dispute-grade",
    "not unbounded forever",
    "not per-key",
    "no per-key",
    "optional",
    "when enabled",
    "default off",
    "fail-closed",
    "quick scan",
    "anonymous",
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
            r"\b(?:paying\s+)?tenants?\b[^.\n]{0,120}\b(?:cannot|can't|do not|don't)\b[^.\n]{0,80}\b(?:create|cause|trigger|run)\b[^.\n]{0,80}\b(?:an?\s+)?(?:llm\s+)?spend\s+storm\b",
            re.IGNORECASE,
        ),
        "Do not claim paying tenants cannot create an LLM spend storm (TB-1570 / M-294).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bapi\s+keys?\b[^.\n]{0,120}\b(?:cannot|can't|do not|don't)\b[^.\n]{0,80}\b(?:create|cause|trigger|run)\b[^.\n]{0,80}\b(?:an?\s+)?(?:llm\s+)?spend\s+storm\b",
            re.IGNORECASE,
        ),
        "Do not claim API keys cannot create an LLM spend storm (TB-1570 / M-294).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:paying\s+)?tenants?\b[^.\n]{0,80}\b(?:/|or)\s+api\s+keys?\b[^.\n]{0,120}\b(?:cannot|can't|do not|don't)\b[^.\n]{0,80}\b(?:create|cause)\b[^.\n]{0,80}\bspend\s+storm\b",
            re.IGNORECASE,
        ),
        "Paying tenants/API keys can burn headroom until gates trip — do not deny spend storms (TB-1570).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bstolen\s+api\s+key\b[^.\n]{0,120}\b(?:cannot|can't|do not|don't)\b[^.\n]{0,80}\b(?:burn|spend)\b[^.\n]{0,60}\b(?:money|usd|dollars?)\b",
            re.IGNORECASE,
        ),
        "Stolen API keys can burn tenant headroom until revoke (TB-1570 / M-294).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:a\s+)?stolen\s+(?:api\s+)?key\b[^.\n]{0,120}\b(?:cannot|can't|do not|don't)\b[^.\n]{0,80}\b(?:burn|spend)\b",
            re.IGNORECASE,
        ),
        "Stolen keys can spend until budgets trip or key is removed (TB-1570).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bper[-\s]?key\s+(?:spend\s+)?isolation\b",
            re.IGNORECASE,
        ),
        "Per-key spend isolation is not shipped — tenant bucket controls only (TB-1570).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:each|every)\s+api\s+key\b[^.\n]{0,80}\b(?:has|gets?|receives?)\b[^.\n]{0,80}\b(?:own|separate|isolated|dedicated)\b[^.\n]{0,60}\b(?:spend|budget|quota|cap)\b",
            re.IGNORECASE,
        ),
        "Spend caps are tenant-scoped — not per API key (TB-1570 / M-294).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bproduct\b[^.\n]{0,80}\b(?:ai\s+)?usage\b[^.\n]{0,80}\b(?:=|equals?|matches?|is)\b[^.\n]{0,80}\b(?:the\s+)?(?:azure\s+openai\s+)?(?:bill|invoice)\b",
            re.IGNORECASE,
        ),
        "Product AI usage is estimated — not equal to Azure OpenAI invoices (TB-1570).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:ai\s+)?usage\s+metering\b[^.\n]{0,80}\b(?:=|equals?|matches?)\b[^.\n]{0,80}\b(?:azure\s+openai\s+)?(?:bill|invoice)\b",
            re.IGNORECASE,
        ),
        "Metering is estimated showback — not invoice reconciliation (TB-1570 / API_CONTRACTS).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bautomated\b[^.\n]{0,80}\b(?:billing[-\s]?dispute|invoice)\b[^.\n]{0,80}\b(?:reconcil|reconciliation|match)\b",
            re.IGNORECASE,
        ),
        "Automated billing-dispute reconciliation is not shipped (TB-1570 / M-294).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:billing[-\s]?dispute|invoice)\b[^.\n]{0,80}\b(?:reconcil|reconciliation)\b[^.\n]{0,80}\b(?:ships?|shipped|automated|built[-\s]?in)\b",
            re.IGNORECASE,
        ),
        "Invoice reconcile pipeline is not shipped — manual evidence only (TB-1570).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bwe\s+have\b[^.\n]{0,80}\bautomated\b[^.\n]{0,80}\b(?:billing[-\s]?dispute|invoice)\b[^.\n]{0,80}\breconcil",
            re.IGNORECASE,
        ),
        "Do not claim automated billing-dispute reconciliation (TB-1570 / M-294).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bazure\b[^.\n]{0,80}\b(?:consumption\s+)?budget\b[^.\n]{0,120}\b(?:hard[-\s]?stop|stops?|blocks?)\b[^.\n]{0,80}\b(?:product\s+)?llm\b",
            re.IGNORECASE,
        ),
        "Azure RG consumption budget notifies — does not hard-stop product LLM (TB-1570).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:consumption\s+)?budget\b[^.\n]{0,80}\bhard[-\s]?stop\b[^.\n]{0,80}\b(?:product\s+)?llm\b",
            re.IGNORECASE,
        ),
        "Product LLM hard-stop is app quota/budget — not Azure consumption budget alone (TB-1570).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bquick\s+scan\b[^.\n]{0,120}\b(?:protects?|covers?|gates?|secures?)\b[^.\n]{0,80}\b(?:paying\s+)?tenants?\b",
            re.IGNORECASE,
        ),
        "Quick Scan anonymous plane ≠ paying-tenant controls (TB-1570 / M-294).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:paying\s+)?tenants?\b[^.\n]{0,120}\b(?:use|share|same as)\b[^.\n]{0,80}\bquick\s+scan\b[^.\n]{0,80}\b(?:gates?|protection|plane)\b",
            re.IGNORECASE,
        ),
        "Paying tenants use tenant quotas/budgets — not Quick Scan anonymous gates (TB-1570).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bmonthly\s+(?:usd\s+)?(?:dollar\s+)?budget\b[^.\n]{0,80}\b(?:always|default)\s+on\b[^.\n]{0,80}\bproduction\b",
            re.IGNORECASE,
        ),
        "Monthly USD budget is optional in Production.json — not always on (TB-1570).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bproduction\b[^.\n]{0,80}\bmonthly\s+(?:usd\s+)?(?:dollar\s+)?budget\b[^.\n]{0,80}\b(?:always|enabled by default)\b",
            re.IGNORECASE,
        ),
        "Production overlay defaults leave monthly dollar budget off unless overridden (TB-1570).",
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

    if stripped.startswith("|") and ("unsafe" in stripped or "forbid" in stripped or "too strong" in stripped):
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
        return [f"{CONTRACT_REL.as_posix()}: missing paying-tenant spend-storm claim map (TB-1570)"]

    text = contract_path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required contract marker {marker!r} (TB-1570 / TB-1571)."
        )

    return violations


def pa_one_pager_violations(root: Path) -> list[str]:
    violations: list[str] = []
    path = root / PA_ONE_PAGER_REL

    if not path.is_file():
        return [f"{PA_ONE_PAGER_REL.as_posix()}: missing PA one-pager (M-295)"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_PA_ONE_PAGER_MARKERS):
        violations.append(
            f"{PA_ONE_PAGER_REL.as_posix()}: missing required PA anchor {marker!r} (M-295 / TB-1571)."
        )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    violations: list[str] = []
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing allowlisted paying-tenant spend-storm honesty scan target"]

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


def paying_tenant_spend_storm_honesty_violations(root: Path) -> list[str]:
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

    violations = paying_tenant_spend_storm_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Paying-tenant spend-storm honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Paying-tenant spend-storm honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
