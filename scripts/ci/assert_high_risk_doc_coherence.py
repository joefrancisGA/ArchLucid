"""
Narrow, deterministic documentation coherence checks where contradictions carry sales / security risk.

Does not scan archived assessments or broad markdown corpora.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]


def _read(rel: Path) -> str:
    path = REPO_ROOT / rel
    if not path.is_file():
        raise FileNotFoundError(path)
    return path.read_text(encoding="utf-8")


def _fail(msg: str) -> int:
    print(f"ERROR: {msg}", file=sys.stderr)
    return 1


def main() -> int:
    v1_scope = _read(Path("docs/library/V1_SCOPE.md"))
    v1_deferred = _read(Path("docs/library/V1_DEFERRED.md"))
    trust = _read(Path("docs/go-to-market/TRUST_CENTER.md"))
    philosophy = _read(Path("docs/go-to-market/PRICING_PHILOSOPHY.md"))
    pricing_json = _read(Path("archlucid-ui/public/pricing.json"))

    # MCP: out of V1 in scope narrative and deferred inventory.
    if "**MCP** is **not** V1" not in v1_scope:
        return _fail("V1_SCOPE.md must keep explicit MCP-is-not-V1 posture in the speculative ecosystem row.")

    if "Model Context Protocol (MCP) server" not in v1_scope or "Not in V1" not in v1_scope.split("Model Context Protocol (MCP) server", maxsplit=1)[1][:400]:
        return _fail("V1_SCOPE.md MCP inventory row must state Not in V1 for the shipping boundary.")

    if "**Out of V1.**" not in v1_deferred or "Inbound MCP server" not in v1_deferred:
        return _fail("V1_DEFERRED.md §6d must document MCP as out of V1 (inbound membrane row).")

    # Trust center must not claim CPA-issued SOC 2 is currently available.
    false_claims = (
        "cpa-issued soc 2 type ii report is available",
        "soc 2 type ii report is available for distribution",
        "soc 2 examination report has been issued",
    )
    tl = trust.lower()
    for phrase in false_claims:
        if phrase in tl:
            return _fail(f"TRUST_CENTER.md reads as claiming issued CPA SOC 2 — found '{phrase}'.")

    soc_segment = trust.split("| **SOC 2**", maxsplit=1)[1][:1200]

    if "Deferred" not in soc_segment and "self-assessment" not in soc_segment.lower():
        return _fail("TRUST_CENTER.md SOC 2 row must remain explicitly deferred / self-assessment honest.")
    # Pricing philosophy documents sales-led placeholder posture when URL is non-production.
    locked = philosophy.split("```locked-prices", maxsplit=1)
    if len(locked) < 2:
        return _fail("PRICING_PHILOSOPHY.md missing locked-prices fence.")

    if "teamStripeCheckoutUrlSalesLedPlaceholder" not in locked[1]:
        return _fail(
            "PRICING_PHILOSOPHY.md locked-prices block must include "
            "teamStripeCheckoutUrlSalesLedPlaceholder (see generate_pricing_json.py)."
        )

    # Generated public JSON must carry the explicit sales-led acknowledgement when placeholder URLs are used.
    if "teamStripeCheckoutUrlSalesLedPlaceholder" not in pricing_json:
        return _fail("archlucid-ui/public/pricing.json must include teamStripeCheckoutUrlSalesLedPlaceholder.")

    print("assert_high_risk_doc_coherence: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
