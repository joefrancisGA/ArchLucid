#!/usr/bin/env python3
"""Emit machine-readable V1 navigation index for docs router drift checks."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
OUT_PATH = REPO_ROOT / "docs" / "library" / "V1_NAVIGATION_INDEX.json"


def main() -> int:
    payload: dict[str, object] = {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "purpose": "Machine-readable router index — canonical paths for V1 scope, pilot, proof, deferred, and commercial boundaries.",
        "entryHub": {
            "path": "docs/START_HERE.md",
            "role": "Single repo entry hub for buyer, contributor, and security routing.",
        },
        "operatorChecklist": {
            "path": "docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md",
            "role": "Canonical first-pilot READY/WARN/HOLD checklist (only operational checklist).",
        },
        "oneSittingPath": {
            "path": "docs/runbooks/FIRST_CREDIBLE_REVIEW_ONE_SITTING.md",
            "role": "Time-boxed narrative with timing guidance (not a second checklist).",
        },
        "narrativeOnly": [
            {"path": "docs/CORE_PILOT.md", "role": "Four-step narrative — not a second checklist."},
            {"path": "docs/onboarding/EVALUATION_GUIDE.md", "role": "Depth reference — not a second checklist."},
        ],
        "scopeContracts": [
            {"path": "docs/library/V1_SCOPE.md", "role": "In-scope V1 product boundary."},
            {"path": "docs/library/V1_DEFERRED.md", "role": "Deferred V1.1/V2 and owner-only items."},
            {"path": "docs/library/V1_DEFERRED_SCOPE_INDEX.json", "role": "Machine-readable deferred-scope index (build_v1_deferred_scope_index.py)."},
            {"path": "docs/library/V1_MAGIC_GUARDRAILS.md", "role": "Bounded V1 demo magic vs future autonomy."},
            {"path": "docs/library/ARCHITECTURE_INVARIANTS_ONE_PAGE.md", "role": "One-page architecture invariants and anti-patterns gate."},
        ],
        "proofArtifacts": {
            "primaryStatus": "first-pilot-command-center.md",
            "fullFindings": "go-no-go-summary.md",
            "commercialHandoff": [
                "quote-to-proof-packet.md",
                "commercial-next-step.json",
                "procurement-deal-ready-classification.md",
            ],
            "reliabilityRollup": "environment-reliability-rollup.md",
            "traceChain": "committed-review-trace-chain-summary.md",
            "collectScript": "scripts/collect-first-pilot-proof.ps1",
        },
        "commercialTierDocs": [
            "docs/go-to-market/PRICING_PHILOSOPHY.md",
            "docs/go-to-market/ORDER_FORM_TEMPLATE.md",
            "docs/go-to-market/QUOTE_TO_PROOF_PACKET.md",
        ],
        "commercialTierIndex": "docs/library/V1_COMMERCIAL_TIER_INDEX.json",
        "procurementPack": {
            "canonicalList": "scripts/procurement_pack_canonical.json",
            "buildScript": "scripts/build_procurement_pack.py",
            "securityOnePager": "docs/go-to-market/SECURITY_REVIEWER_ONE_PAGER.md",
        },
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"v1 navigation index: wrote {OUT_PATH.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
