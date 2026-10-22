#!/usr/bin/env python3
"""Audit finding snapshots for certainty stronger than their evidence/provenance."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

STRONG = re.compile(r"\b(proven|confirmed|observed|definitely|guaranteed|compliant|secure|compromised|exploited)\b", re.I)
WEAK_PROVENANCE = {"aiinference", "deterministicinference"}


def audit(payload: dict) -> list[dict]:
    findings = list(payload.get("findings", [])) + list(payload.get("checklistCoverage", []))
    issues = []

    for finding in findings:
        finding_id = finding.get("findingId")
        text = " ".join([str(finding.get("title", "")), str(finding.get("rationale", ""))])
        evidence = [x for x in (finding.get("evidenceRefs") or []) if str(x).strip()]
        provenance = str(
            finding.get("provenanceKind")
            or finding.get("properties", {}).get("provenanceKind")
            or ""
        ).lower()

        if STRONG.search(text) and not evidence and not finding.get("policyRuleId"):
            issues.append({
                "code": "STRONG_LANGUAGE_WITHOUT_EVIDENCE",
                "findingId": finding_id,
                "text": text,
            })

        if STRONG.search(text) and provenance in WEAK_PROVENANCE:
            issues.append({
                "code": "STRONG_LANGUAGE_ON_INFERENCE",
                "findingId": finding_id,
                "provenanceKind": provenance,
            })

    return issues


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("snapshot", type=Path)
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args(argv)
    issues = audit(json.loads(args.snapshot.read_text(encoding="utf-8")))
    print(json.dumps({"schemaVersion": 1, "issueCount": len(issues), "issues": issues}, indent=2))
    return 1 if args.enforce and issues else 0


if __name__ == "__main__":
    raise SystemExit(main())
