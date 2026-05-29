#!/usr/bin/env python3
"""Emit machine-readable V1 commercial tier boundary index."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
OUT_PATH = REPO_ROOT / "docs" / "library" / "V1_COMMERCIAL_TIER_INDEX.json"


def main() -> int:
    payload = {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "purpose": "Sales-led V1 packaging boundaries — not live marketplace checkout.",
        "salesLedNote": "Request a quote for packaging, fair-use limits, and diligence artifacts; list tiers illustrate scope.",
        "tiers": [
            {
                "id": "team",
                "label": "Team",
                "role": "Small architecture practice; limited review volume.",
                "docs": ["docs/go-to-market/PRICING_PHILOSOPHY.md"],
            },
            {
                "id": "professional",
                "label": "Professional",
                "role": "Typical procurement path for first pilot and ARB evidence packs.",
                "docs": ["docs/go-to-market/ORDER_FORM_TEMPLATE.md", "docs/go-to-market/QUOTE_TO_PROOF_PACKET.md"],
            },
            {
                "id": "enterprise",
                "label": "Enterprise",
                "role": "Hosted pilot, procurement pack, and production-like proof gates.",
                "docs": ["docs/go-to-market/TRUST_CENTER.md", "docs/runbooks/PROCUREMENT_DEAL_READY.md"],
            },
        ],
        "deferredCommerce": [
            "Live marketplace checkout",
            "Self-serve subscription without sales engineering",
            "Reference customer logos in (A) scope",
        ],
        "proofArtifacts": [
            "quote-to-proof-packet.md",
            "procurement-deal-ready-classification.md",
            "commercial-next-step.json",
        ],
    }

    OUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"v1 commercial tier index: wrote {OUT_PATH.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
