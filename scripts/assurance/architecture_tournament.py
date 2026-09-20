#!/usr/bin/env python3
"""Summarize architecture tournament grades while preserving raw dimensions."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from statistics import mean

DIMENSIONS = (
    "recall",
    "precision",
    "severityCalibration",
    "evidenceQuality",
    "tradeoffRecognition",
    "recommendationUsefulness",
    "unsupportedClaimControl",
    "contradictionControl",
    "consistency",
)
HARD_GATES = (
    "inventedEvidence",
    "inventedRegulation",
    "unsupportedCertainty",
    "contradictoryArtifacts",
)


def summarize(payload: dict) -> dict:
    cases = payload.get("cases", [])
    dimension_summary: dict[str, dict[str, float | int | None]] = {}

    for dimension in DIMENSIONS:
        values = [
            float(case["dimensions"][dimension])
            for case in cases
            if dimension in case.get("dimensions", {})
        ]
        dimension_summary[dimension] = {
            "count": len(values),
            "mean": round(mean(values), 6) if values else None,
            "min": round(min(values), 6) if values else None,
            "max": round(max(values), 6) if values else None,
        }

    violations = []
    for case in cases:
        gates = case.get("hardGates", {})
        for gate in HARD_GATES:
            if gates.get(gate) is True:
                violations.append({"caseId": case.get("caseId"), "gate": gate})

    return {
        "schemaVersion": 1,
        "runId": payload.get("runId"),
        "systemLabel": payload.get("systemLabel"),
        "version": payload.get("version"),
        "caseCount": len(cases),
        "dimensions": dimension_summary,
        "hardGatePass": len(violations) == 0,
        "hardGateViolations": violations,
        "totalElapsedSeconds": round(sum(float(case.get("elapsedSeconds", 0)) for case in cases), 3),
        "totalCostUsd": round(sum(float(case.get("costUsd", 0)) for case in cases), 6),
        "totalFindings": sum(int(case.get("findingsCount", 0)) for case in cases),
        "note": "No single overall rating is produced. Raw dimensions and hard gates are the product of record.",
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args(argv)

    summary = summarize(json.loads(args.input.read_text(encoding="utf-8")))
    rendered = json.dumps(summary, indent=2) + "\n"

    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
