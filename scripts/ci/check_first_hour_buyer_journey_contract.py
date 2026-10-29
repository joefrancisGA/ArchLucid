#!/usr/bin/env python3
"""Verify source-level buyer journey guardrails for both product lines.

Presence and coverage contract only. Does not claim Playwright/Vitest execution,
browser first-value timing, or a customer result.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHECKS = {
    "ArchLucid": {
        "archlucid-ui/e2e/first-run-wizard.spec.ts": (
            'page.goto("/architecture/reviews/new")',
            'getByTestId("reviews-new-path-switcher")',
            'getByTestId("reviews-new-job-chooser-section")',
        ),
        "archlucid-ui/e2e/buyer-golden-path.smoke.spec.ts": (
            "BUYER_GOLDEN_PATH_HREFS.sponsor",
            "BUYER_GOLDEN_PATH_HREFS.signedManifestCanonical",
            "BUYER_GOLDEN_PATH_HREFS.evidenceGraph",
            "BUYER_GOLDEN_PATH_HREFS.auditTrail",
            "expectNoGenericErrorBoundary",
        ),
    },
    "SecureNow": {
        "archlucid-ui/e2e/securenow-ui-rate-screenshots.spec.ts": (
            "primeSecureNowProductLineCookie",
            "waitForSecureNowBrandSettled",
            "assertPageFreeOfScreenshotDemoFailures",
        ),
        "archlucid-ui/src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.securenow.test.tsx": (
            "securenow-home-environment-context",
            "securenow-infrastructure-home-section",
            "securenow-findings-home-section",
            "securenow-remediation-home-section",
        ),
    },
}

def audit(root: Path) -> dict:
    rows=[]
    for product, files in CHECKS.items():
        for rel, tokens in files.items():
            file = root / rel
            try:
                content = file.read_text(encoding="utf-8")
            except (OSError, UnicodeError):
                content = ""
            missing = [token for token in tokens if token not in content]
            rows.append({"product": product, "file": rel, "status": "SOURCE_GAP" if missing else
                         "GUARDS_PRESENT_NOT_EXECUTED", "missingSourceSignals": missing})
    return {"schemaVersion": 1,
            "status": "SOURCE_GAP" if any(row["missingSourceSignals"] for row in rows)
                      else "STATIC_GUARDS_PRESENT_NOT_BROWSER_VERIFIED",
            "checks": rows,
            "limitations": "Tokens in source do not prove browser execution, route availability, timings or full buyer utility."}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--root", type=Path, default=ROOT)
    p.add_argument("--output", type=Path, required=True)
    a=p.parse_args()
    result=audit(a.root)
    a.output.parent.mkdir(parents=True, exist_ok=True)
    a.output.write_text(json.dumps(result, indent=2) + "\n")
    print("Buyer-journey source contract:", result["status"])
    return 0 if result["status"] != "SOURCE_GAP" else 1

if __name__=="__main__":
    raise SystemExit(main())
