#!/usr/bin/env python3
"""Paired decision-utility rubric for controlled buyer comparisons.

Requires explicit scored cases for BOTH options; reports descriptive statistics
only and never claims general competitive superiority or customer ROI.
"""
from __future__ import annotations
import argparse
import json
import math
import statistics
from pathlib import Path

RUBRIC = ("evidenceTraceability", "decisionUsefulness", "timeEfficiency",
          "uncertaintyHonesty", "actionability")
PRODUCTS = {"ArchLucid": "ManualOrGenericAI", "SecureNow": "ExistingCSPMWorkflow"}


def compare(payload: dict) -> dict:
    if not isinstance(payload, dict) or payload.get("schema") != "archlucid.blinded-comparison-input.v1":
        raise ValueError("Unsupported blinded comparison schema")
    product = payload.get("product")
    if product not in PRODUCTS:
        raise ValueError("Unknown product")
    if payload.get("cohortClass") not in ("SYNTHETIC", "INTERNAL_DOGFOOD", "AUTHORIZED_BUYER_REVIEW"):
        raise ValueError("Cohort class required")
    cases = payload.get("cases")
    if not isinstance(cases, list) or len(cases) > 1000:
        raise ValueError("Invalid paired cases")
    paired = {}
    for row in cases:
        if not isinstance(row, dict):
            raise ValueError("Invalid case")
        case = row.get("caseId")
        evaluator = row.get("evaluatorId")
        option = row.get("option")
        scores = row.get("scores")
        if not isinstance(case, str) or not case or not isinstance(evaluator, str) or not evaluator:
            raise ValueError("Missing case/evaluator")
        if option not in (product, PRODUCTS[product]) or not isinstance(scores, dict):
            raise ValueError("Unexpected option/scores")
        if set(scores) != set(RUBRIC) or any(type(scores[k]) is not int or not 0 <= scores[k] <= 5 for k in RUBRIC):
            raise ValueError("Scores require each 0..5 rubric dimension exactly once")
        key = (case, evaluator)
        if option in paired.setdefault(key, {}):
            raise ValueError("Duplicate scored option")
        paired[key][option] = scores
    if any(set(v) != {product, PRODUCTS[product]} for v in paired.values()):
        raise ValueError("Every case/evaluator must score both options")
    if len(paired) < 3:
        return {"status": "INSUFFICIENT_MATCHED_REVIEWS", "matchedPairs": len(paired),
                "winner": None, "cohortClass": payload["cohortClass"], "dimensionDeltas": {}}
    medians = {}
    for dim in RUBRIC:
        differences = [rows[product][dim] - rows[PRODUCTS[product]][dim] for rows in paired.values()]
        medians[dim] = {"medianDelta": statistics.median(differences),
                        "pairedCount": len(differences), "minDelta": min(differences),
                        "maxDelta": max(differences)}
    return {
        "status": "DESCRIPTIVE_MATCHED_EVALUATION_NOT_MARKET_PROOF",
        "cohortClass": payload["cohortClass"], "matchedPairs": len(paired),
        "product": product, "alternative": PRODUCTS[product],
        "dimensionDeltas": medians,
        "winner": None,
        "limitations": "Paired rubric differences are not statistically validated, blinded independently, or attributable to the whole market.",
    }


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--input", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    a=p.parse_args()
    if a.input.stat().st_size > 3_000_000:
        raise ValueError("Oversized input")
    report=compare(json.loads(a.input.read_text(encoding="utf-8")))
    a.output.parent.mkdir(parents=True, exist_ok=True)
    a.output.write_text(json.dumps(report, indent=2) + "\n")
    print("Paired evaluation:", report["status"], "; no superiority claim")

if __name__=="__main__":
    main()
