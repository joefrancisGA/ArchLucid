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
    # A reviewer can score many cases and many reviewers can score one case.
    # Treating every (case, reviewer) pair as an independent scenario lets a
    # heavily reviewed single case determine the apparent comparative result.
    distinct_cases = {case for case, _ in paired}
    distinct_evaluators = {evaluator for _, evaluator in paired}
    if len(paired) < 3 or len(distinct_cases) < 3:
        return {
            "status": ("INSUFFICIENT_DISTINCT_CASES" if len(distinct_cases) < 3
                       and len(paired) >= 3 else "INSUFFICIENT_MATCHED_REVIEWS"),
            "matchedPairs": len(paired),
            "distinctCases": len(distinct_cases),
            "distinctEvaluators": len(distinct_evaluators),
            "winner": None, "cohortClass": payload["cohortClass"],
            "dimensionDeltas": {},
        }

    # Each case contributes equally: first take the median across its
    # evaluators, then the median across distinct cases. This reports
    # descriptive rubric signals, never an independently validated trial.
    by_case = {}
    for (case, _evaluator), rows in paired.items():
        differences = {
            dim: rows[product][dim] - rows[PRODUCTS[product]][dim]
            for dim in RUBRIC
        }
        by_case.setdefault(case, []).append(differences)
    medians = {}
    for dim in RUBRIC:
        case_deltas = [
            statistics.median(row[dim] for row in evaluations)
            for evaluations in by_case.values()
        ]
        medians[dim] = {
            "medianDelta": statistics.median(case_deltas),
            "pairedCount": len(paired),
            "independentCaseCount": len(case_deltas),
            "minDelta": min(case_deltas),
            "maxDelta": max(case_deltas),
        }
    return {
        "status": "DESCRIPTIVE_MATCHED_EVALUATION_NOT_MARKET_PROOF",
        "cohortClass": payload["cohortClass"], "matchedPairs": len(paired),
        "distinctCases": len(distinct_cases),
        "distinctEvaluators": len(distinct_evaluators),
        "aggregation": "ONE_EQUAL_WEIGHT_PER_DISTINCT_CASE",
        "product": product, "alternative": PRODUCTS[product],
        "dimensionDeltas": medians,
        "winner": None,
        "limitations": (
            "Scores are descriptive case-balanced medians, not statistically validated "
            "or independently blinded. Repeated evaluators, uneven case selection "
            "and the review cohort cannot establish market superiority."
        ),
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
