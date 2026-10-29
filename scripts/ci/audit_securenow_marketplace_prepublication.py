#!/usr/bin/env python3
"""Fail-closed product entitlement review for a future SecureNow Marketplace SaaS offer.

This is a static implementation/gap audit, NOT a Partner Center registration
or an attempt to modify the shared runtime billing provider.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def audit(root: Path, candidate: dict | None = None) -> dict:
    files = {
        "sharedProvider": "ArchLucid.Persistence/Billing/AzureMarketplace/AzureMarketplaceBillingProvider.WebhookDispatch.cs",
        "billingOptions": "ArchLucid.Core/Configuration/AzureMarketplaceBillingOptions.cs",
        "securenowHold": "docs/securenow/CONTROLLED_PILOT_OFFER.md",
        "prepublicationContract": "docs/securenow/MARKETPLACE_PREPUBLICATION_CONTRACT.md",
    }
    contents = {}
    for key, rel in files.items():
        path = root / rel
        try:
            contents[key] = path.read_text(encoding="utf-8")
        except (OSError, UnicodeError):
            contents[key] = ""

    signals = {
        "sharedWebhookHandlesActions": "DispatchMarketplaceActionAsync" in contents["sharedProvider"],
        "globalOfferIdOptionExists": "MarketplaceOfferId" in contents["billingOptions"],
        "securenowPilotMarkedNotApproved": "NOT AN APPROVED CUSTOMER OFFER" in contents["securenowHold"],
        "productSpecificOfferContract": "Fail closed" in contents["prepublicationContract"],
        "webhookOfferIdCheckedBeforeMutation": False,
        "crossProductEntitlementNegativeTestsObserved": False,
        "ownerApprovedPlanAndPricing": False,
        "betaReleaseGoObserved": False,
    }

    # Do NOT infer a secure offer binding from a global MarketplaceOfferId option.
    # The present shared dispatch path validates a bearer token then routes
    # lifecycle mutations by tenant; proof of SecureNow product-line isolation
    # must come from a separate implementation and negative tests.
    blockers = [name for name, passed in signals.items()
                if name in ("webhookOfferIdCheckedBeforeMutation",
                            "crossProductEntitlementNegativeTestsObserved",
                            "ownerApprovedPlanAndPricing", "betaReleaseGoObserved")
                and not passed]
    missing_files = [rel for key, rel in files.items() if not contents[key]]
    if missing_files:
        blockers.append("REQUIRED_SOURCE_MISSING")
    if candidate is not None:
        if not isinstance(candidate, dict) or candidate.get("productLine") != "security":
            raise ValueError("Candidate must specify productLine=security")
        # Only structural preview; self-supplied values never confer authorization.
        if candidate.get("offerId") and candidate.get("offerId") == candidate.get("archlucidOfferId"):
            blockers.append("CROSS_PRODUCT_OFFER_ID_COLLISION")
        if candidate.get("billingEnabled") is True:
            blockers.append("LIVE_BILLING_ENABLED_WITHOUT_RELEASE_APPROVAL")
    return {
        "schemaVersion": 1,
        "product": "SecureNow",
        "status": "HOLD_NO_PUBLICATION",
        "evidenceClass": "STATIC_SOURCE_INSPECTION_ONLY",
        "signals": signals,
        "blockers": sorted(set(blockers)),
        "missingSources": missing_files,
        "marketplaceProductEnabled": False,
        "ownerApprovalVerified": False,
        "note": "Shared ArchLucid provider must not infer SecureNow entitlements. No payment, tenant, or webhook is modified.",
    }


def main() -> int:
    p=argparse.ArgumentParser()
    p.add_argument("--root", type=Path, default=ROOT)
    p.add_argument("--candidate", type=Path)
    p.add_argument("--output", type=Path, required=True)
    a=p.parse_args()
    candidate=None
    if a.candidate is not None:
        if not a.candidate.is_file() or a.candidate.stat().st_size > 65536:
            raise ValueError("Missing or oversized candidate manifest")
        candidate=json.loads(a.candidate.read_text(encoding="utf-8"))
    report=audit(a.root, candidate)
    a.output.parent.mkdir(parents=True, exist_ok=True)
    a.output.write_text(json.dumps(report, indent=2) + "\n")
    print("SecureNow Marketplace:", report["status"],
          "; blockers:", len(report["blockers"]))
    return 0  # Reports hold without changing live billing or existing CI release gates.


if __name__=="__main__":
    raise SystemExit(main())
