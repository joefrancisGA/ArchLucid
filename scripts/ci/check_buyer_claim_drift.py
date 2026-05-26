#!/usr/bin/env python3
"""Warn on high-risk buyer-facing claim drift in a narrow allowlisted doc set."""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/PRICING_PHILOSOPHY.md"),
    Path("docs/go-to-market/TRUST_CENTER.md"),
    Path("docs/go-to-market/SOC2_ROADMAP.md"),
    Path("docs/go-to-market/INTEGRATION_CATALOG.md"),
    Path("docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md"),
    Path("docs/go-to-market/CURRENT_ASSURANCE_POSTURE.md"),
    Path("docs/go-to-market/PROCUREMENT_FAQ.md"),
    Path("docs/go-to-market/SOC2_STATUS_PROCUREMENT.md"),
)


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(r"generic\s+OIDC\s*\([^)]*roadmap[^)]*\)", re.IGNORECASE),
        "generic OIDC must not be described as roadmap-only; V1 supports generic OIDC configuration.",
    ),
    ClaimPattern(
        re.compile(r"SOC\s*2\s+Type\s*(?:I|II|1|2)\s+(?:report|opinion)\s+(?:is\s+)?(?:issued|available|published)", re.IGNORECASE),
        "SOC 2 CPA reports must not be described as issued, available, or published.",
    ),
    ClaimPattern(
        re.compile(r"third-party\s+pen(?:etration)?\s+test\s+(?:completed|executed|passed)\s+(?:for|against)\s+V1", re.IGNORECASE),
        "third-party penetration testing is V2, not completed for V1.",
    ),
    ClaimPattern(
        re.compile(r"Marketplace\s+(?:SaaS\s+)?offer\s+(?:is\s+)?(?:published|live)", re.IGNORECASE),
        "Marketplace publication is owner-gated and must not be claimed as currently published.",
    ),
    ClaimPattern(
        re.compile(r"(?:public\s+)?(?:Stripe\s+)?checkout\s+(?:is\s+)?live", re.IGNORECASE),
        "public live checkout must not be claimed while live Stripe cutover is owner-gated.",
    ),
)


def buyer_claim_drift_violations(root: Path) -> list[str]:
    violations: list[str] = []

    for rel in DOCS_TO_SCAN:
        path = root / rel

        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing allowlisted buyer-facing doc")
            continue

        text = path.read_text(encoding="utf-8", errors="replace")

        for claim in CLAIM_PATTERNS:
            match = claim.pattern.search(text)

            if match is None:
                continue

            violations.append(f"{rel.as_posix()}: {claim.message} Matched `{match.group(0)}`.")

    return violations


def main() -> int:
    violations = buyer_claim_drift_violations(REPO_ROOT)

    if violations:
        print("Buyer-facing doc claim drift warnings:", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 1

    print("Buyer-facing doc claim drift: OK")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
