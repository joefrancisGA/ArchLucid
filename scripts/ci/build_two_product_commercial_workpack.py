#!/usr/bin/env python3
"""Offline engineering workpack for ten low-scoring commercial readiness gaps.

Reads only repository sources and optional explicit operator exports. It never
contacts buyers, changes billing, provisions Azure, updates a lead, or upgrades
a beta/marketing claim. All output is aggregate or synthetic, with no PII.
"""
from __future__ import annotations

import argparse
import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = "archlucid.commercial-readiness.workpack.v1"
SHA = re.compile(r"^[a-fA-F0-9]{40}$")
RISKY = (
    ("guaranteed_outcome", re.compile(r"\bguarantee(?:d|s)?\s+(?:ROI|savings|breach prevention|breach avoidance)\b", re.I)),
    ("unsupported_certification", re.compile(r"\b(?:SOC\s*2|ISO\s*27001)\s+certified\b", re.I)),
    ("autonomous_remediation", re.compile(r"\b(?:automatically|autonomously)\s+(?:apply|remediate|fix)\b", re.I)),
    ("proven_customer_roi", re.compile(r"\bproven\s+customer\s+(?:ROI|savings)\b", re.I)),
)


def read_text(root: Path, path: str) -> str:
    target = root / path
    return target.read_text(encoding="utf-8") if target.is_file() else ""


def no_fake_pass(result: dict) -> None:
    if result["status"] == "PASS" and result.get("proof") is None:
        raise ValueError("PASS requires an observed proof record")


def source_check(root: Path, paths: list[str]) -> dict:
    found = [p for p in paths if (root / p).is_file()]
    return {"present": found, "missing": [p for p in paths if p not in found],
            "status": "CODE_PRESENT_NOT_EXECUTED" if len(found) == len(paths) else "SOURCE_GAP"}


def pilot_proof(root: Path, index: dict | None = None) -> dict:
    text = read_text(root, "docs/go-to-market/CLAIM_READINESS_STATUS.md")
    current_hold = bool(re.search(r"\|\s*\*\*G4\*\*\*\s*\|[^\n]*\*\*HOLD\*\*", text))
    entries = index.get("runs", []) if isinstance(index, dict) else []
    if not isinstance(entries, list) or len(entries) > 100:
        raise ValueError("Invalid run index")
    observed = []
    for run in entries:
        if not isinstance(run, dict):
            raise ValueError("Run index rows must be objects")
        # Source content is not trusted to certify a real external transaction.
        candidate = all(run.get(key) is True for key in
                        ("committed", "realModeAttested", "proofPacketGenerated",
                         "redactionReviewed", "ownerReviewed")) and bool(
                             SHA.fullmatch(str(run.get("testedSha", "")))) and bool(
                                 re.fullmatch(r"[0-9a-fA-F-]{36}", str(run.get("runId", ""))))
        observed.append({"candidateForOwnerVerification": candidate,
                         "missingRequirements": [key for key in
                           ("committed", "realModeAttested", "proofPacketGenerated",
                            "redactionReviewed", "ownerReviewed")
                           if run.get(key) is not True]})
    return {
        "gate": "G4", "recordedGateHold": current_hold,
        "candidateCount": sum(x["candidateForOwnerVerification"] for x in observed),
        "requiredDistinctRealRuns": 3, "status": "HOLD_FOR_REAL_PILOT_AND_OWNER",
        "source": "docs/go-to-market/CLAIM_READINESS_STATUS.md",
        "runChecks": observed,
        "note": "A supplied index is untrusted self-report, never promotion of the official gate.",
    }


def synthetic_demo() -> dict:
    return {
        "schema": "securenow.demo.synthetic-decision-path.v1",
        "source": "SYNTHETIC_ILLUSTRATIVE_ONLY", "noCustomerEvidence": True,
        "scenario": "Hypothetical storage exposure review",
        "baseline": {
            "evidenceClass": "SyntheticFixture",
            "asset": "example-storage-account",
            "observedProperty": "publicNetworkAccess=Enabled (fixture only)",
            "pathClaim": "POSSIBLE_REACHABILITY_NOT_OBSERVED_TRAFFIC",
            "confidence": "ORDINAL_UNCALIBRATED",
        },
        "advisory": {
            "cutPoint": "Review public network access policy with owner",
            "actionMode": "EXTERNAL_HUMAN_APPROVAL_REQUIRED",
            "platformMutation": False,
        },
        "verification": {
            "state": "NOT_VERIFIED",
            "reason": "No real later authorized capture, analysis completion or human attestation",
            "requiredInputs": ["laterCaptureId", "laterCaptureTimestamp",
                               "analysisComplete", "substantivePostcondition", "externalChangeAttestation"],
        },
        "buyerDecision": "Evaluate evidence usefulness; no savings or incident prevention claimed",
    }


def buyer_journeys(root: Path) -> dict:
    paths = {
        "ArchLucid": [
            "archlucid-ui/e2e/first-run-wizard.spec.ts",
            "archlucid-ui/e2e/buyer-golden-path.smoke.spec.ts",
            "archlucid-ui/e2e/live-api-buyer-golden-path.spec.ts",
        ],
        "SecureNow": [
            "docs/securenow/BUYER_PROOF_DEMO.md",
            "docs/securenow/CONTROLLED_PILOT_OFFER.md",
            "docs/securenow/BETA_DEPLOYMENT_SMOKE.md",
        ],
    }
    return {
        "status": "STATIC_INVENTORY_NOT_E2E_EXECUTION",
        "products": {product: source_check(root, selected)
                     for product, selected in paths.items()},
        "missingLiveProof": ["signed-in first useful package", "buyer first-path review",
                             "time-to-value elapsed", "release SHA and test artifact"],
    }


def pilot_offer(root: Path) -> dict:
    text = read_text(root, "docs/securenow/CONTROLLED_PILOT_OFFER.md")
    return {
        "status": "DRAFT_NOT_APPROVED",
        "sourcePresent": bool(text),
        "requiresOwnerDecisions": ["customer scope and authorization", "price and commercial terms",
                                   "DPA/support/retention", "22-row beta and live staging gates",
                                   "release owner go/no-go"],
        "mustKeep": ["Reader-only collection", "external human change",
                     "no verified closure without later capture", "no customer ROI without measurements"],
        "publicationAllowed": False,
    }


def quote_followup(root: Path, weekly: dict | None) -> dict:
    existing = source_check(root, [
        "scripts/ci/pricing_quote_response_telemetry.py",
        "scripts/ci/report_pricing_quote_response_weekly.py",
        "docs/runbooks/PRICING_QUOTE_RESPONSE_TELEMETRY.md",
    ])
    if weekly is None:
        return {"status": "NO_LIVE_QUOTE_EXPORT", "existingInfrastructure": existing,
                "nextAction": "Run existing weekly telemetry on authorized SQL or export; do not invent leads."}
    if not isinstance(weekly, dict) or weekly.get("schemaVersion") not in (None, 1):
        raise ValueError("Unsupported quote telemetry payload")
    # The optional weekly report may contain PII: never re-export individual rows.
    request_count = weekly.get("requestCount")
    disposition = weekly.get("weeklyDisposition")
    if type(request_count) is not int or request_count < 0 or disposition not in ("PASS", "WARN", "HOLD"):
        raise ValueError("Invalid weekly quote summary")
    return {
        "status": "AGGREGATED_SELF_REPORTED_NOT_VERIFIED",
        "existingInfrastructure": existing, "requestCount": request_count,
        "weeklyDisposition": disposition,
        "containsCustomerIdentifiers": False,
        "note": "No contact, acknowledgement or CRM mutation performed.",
    }


def economics(usage: dict | None) -> dict:
    if usage is None:
        return {"status": "NO_MEASURED_COST_INPUT", "entries": [],
                "note": "No unit economics or gross margin estimated from missing revenue/invoice data."}
    if not isinstance(usage, dict) or usage.get("schema") != "archlucid.unit-economics-input.v1":
        raise ValueError("Invalid unit economics input schema")
    records = usage.get("entries")
    if not isinstance(records, list) or len(records) > 500:
        raise ValueError("Expected bounded economics entries")
    items = []
    for x in records:
        if not isinstance(x, dict) or x.get("product") not in ("ArchLucid", "SecureNow"):
            raise ValueError("Invalid economics product")
        cost, units = x.get("totalCostUsd"), x.get("units")
        basis = x.get("basis")
        if (type(cost) not in (int, float) or not math.isfinite(cost) or cost < 0 or
                type(units) is not int or units <= 0 or basis not in
                ("MODELED", "METERED_UNRECONCILED", "INVOICE_RECONCILED")):
            raise ValueError("Invalid economics cost, unit count or provenance")
        items.append({"product": x["product"], "basis": basis,
                      "units": units, "costPerUnitUsd": round(cost / units, 4),
                      "status": "OPERATOR_SUPPLIED_NOT_INDEPENDENTLY_ATTESTED"})
    return {"status": "PROVENANCE_LABELED_INPUT_ONLY", "entries": items,
            "grossMargin": None, "note": "No revenue supplied, and invoice labels require external verification."}


def competitive_evidence(root: Path) -> dict:
    return {
        "status": "COMPARISON_PROTOCOL_PREPARED_NOT_EXECUTED",
        "archlucid": {"alternative": "generic AI/manual architecture review",
                      "test": "same sanitized brief, equal human time, blinded reviewer scores evidence/actionability",
                      "sourcePresent": bool(read_text(root, "docs/go-to-market/DIFFERENTIATION_PROOF_PACKET.md")),
                      "winner": None},
        "securenow": {"alternative": "existing Defender/CSPM workflow",
                      "test": "same authorized Azure scope, compare decision utility, cited paths and analyst minutes",
                      "sourcePresent": bool(read_text(root, "docs/securenow/BUYER_PROOF_DEMO.md")),
                      "winner": None},
        "note": "No unrun head-to-head tests or synthetic findings may be represented as market superiority.",
    }


def marketplace(root: Path) -> dict:
    marketplace_text = read_text(root, "docs/go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md")
    pilot_text = read_text(root, "docs/securenow/CONTROLLED_PILOT_OFFER.md")
    return {
        "status": "HOLD_NO_PUBLICATION",
        "existingArchLucidFulfillmentScaffold": bool(marketplace_text),
        "secureNowOffer": "NOT_CONFIGURED",
        "secureNowProductEntitlementIsolation": "UNVERIFIED",
        "ownerPublisherFieldsStillPlaceholder": "<<MPN_ID>>" in marketplace_text or "<<OFFER_ID>>" in marketplace_text,
        "betaGo": False, "commercialTermsApproved": False,
        "secureNowPilotProposalPresent": bool(pilot_text),
        "nextEngineeringChecks": ["distinct product offer ID", "product-specific entitlement isolation",
                                  "no cross-product billing activation", "fulfillment retries and rollback",
                                  "separate pricing/legal approval"],
        "noProductionMarketplaceWrite": True,
    }


def claims(root: Path) -> dict:
    sources = {
        "ArchLucid": ["docs/go-to-market/POSITIONING.md", "docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"],
        "SecureNow": ["docs/securenow/BUYER_PROOF_DEMO.md", "docs/securenow/CONTROLLED_PILOT_OFFER.md"],
    }
    findings = []
    missing = []
    for product, docs in sources.items():
        for path in docs:
            content = read_text(root, path)
            if not content:
                missing.append(path)
                continue
            for line_no, line in enumerate(content.splitlines(), 1):
                # Negative statements and quoted "do not say" examples are
                # explicitly prohibited claims, not endorsement of those claims.
                negated = bool(re.search(r"\b(?:no|not|never|cannot|can't|do not|must not|without|don't)\b", line, re.I))
                if negated:
                    continue
                for label, pattern in RISKY:
                    if pattern.search(line):
                        findings.append({"product": product, "source": path,
                                         "line": line_no, "risk": label})
    return {
        "status": "REVIEW_NEEDED" if findings or missing else "STATIC_GUARD_CLEAR_NOT_MARKET_VALIDATED",
        "findings": findings, "missingSources": missing,
        "limitations": "Heuristic keyword check only, not legal review, truth assessment or publication permission.",
    }


def build(root: Path, *, quote: dict | None = None,
          usage: dict | None = None, pilot_index: dict | None = None) -> dict:
    beta_matrix = json.loads(read_text(root, "docs/securenow/BETA_EVIDENCE_MATRIX.json"))
    from check_securenow_beta_evidence import validate
    beta_errors = validate(beta_matrix)
    if beta_errors:
        raise ValueError("Invalid beta matrix: " + "; ".join(beta_errors[:3]))
    beta = {"status": "NO_GO", "requirements": len(beta_matrix["requirements"]),
            "unknownRequirements": sum(x.get("status") != "PASS" for x in beta_matrix["requirements"]),
            "attributionPath": "scripts/ci/report_securenow_beta_requirement_attribution.py",
            "liveGates": "NOT_VERIFIED"}
    lanes = [
        ("01", "SecureNow", "Beta release requirement attribution", beta),
        ("02", "ArchLucid", "Three Real proof packet prerequisites", pilot_proof(root, pilot_index)),
        ("03", "SecureNow", "Deterministic synthetic buyer demonstration", synthetic_demo()),
        ("04", "Both", "First-hour buyer journey test inventory", buyer_journeys(root)),
        ("05", "SecureNow", "Controlled pilot offer and owner decisions", pilot_offer(root)),
        ("06", "ArchLucid", "Existing sales quote response and aging telemetry", quote_followup(root, quote)),
        ("07", "Both", "Provenance-labeled unit economics", economics(usage)),
        ("08", "Both", "Competitive side-by-side evaluation protocol", competitive_evidence(root)),
        ("09", "SecureNow", "Azure Marketplace non-transactable readiness", marketplace(root)),
        ("10", "Both", "Public marketing claim drift scanning", claims(root)),
    ]
    return {
        "schema": SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "claimBoundary": "ENGINEERING_READINESS_ONLY_NO_CUSTOMER_OUTCOMES_OR_BETA_APPROVAL",
        "lanes": [{"priority": number, "product": product, "work": work, "evidence": evidence}
                  for number, product, work, evidence in lanes],
        "humanOnly": ["live customer authorization", "real pilot execution and real mode attestation",
                      "founder release signoff", "banking/legal/pricing and Partner Center",
                      "customer purchases, references and renewals"],
    }


def render_markdown(result: dict) -> str:
    lines = ["# ArchLucid + SecureNow commercial workpack", "",
             "**Status:** Engineering preparation only; no live customer or release assertions.", "",
             "| Priority | Product | Work | Evidence status |", "|---|---|---|---|"]
    for lane in result["lanes"]:
        status = lane["evidence"].get("status", "NOT_VERIFIED")
        lines.append(f"| {lane['priority']} | {lane['product']} | {lane['work']} | {status} |")
    lines.extend(["", "## Owner-only blockers", ""])
    lines.extend(f"- {value}" for value in result["humanOnly"])
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--quote-weekly", type=Path)
    parser.add_argument("--economics-input", type=Path)
    parser.add_argument("--pilot-index", type=Path)
    parser.add_argument("--out-dir", type=Path, required=True)
    a = parser.parse_args()
    def load_optional(path):
        if path is None:
            return None
        if not path.is_file() or path.stat().st_size > 2_000_000:
            raise ValueError("Missing or oversized input")
        return json.loads(path.read_text(encoding="utf-8"))
    result = build(a.root, quote=load_optional(a.quote_weekly),
                   usage=load_optional(a.economics_input),
                   pilot_index=load_optional(a.pilot_index))
    a.out_dir.mkdir(parents=True, exist_ok=True)
    (a.out_dir / "commercial-readiness.json").write_text(json.dumps(result, indent=2) + "\n")
    (a.out_dir / "commercial-readiness.md").write_text(render_markdown(result))
    (a.out_dir / "securenow-synthetic-demo.json").write_text(
        json.dumps(result["lanes"][2]["evidence"], indent=2) + "\n")
    print("Ten-lane engineering workpack generated; no commercial GO or customer claims.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
