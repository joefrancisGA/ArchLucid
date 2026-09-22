#!/usr/bin/env python3
"""Deterministic 'that cannot be right' credibility reviewer for finding snapshots."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

CERTAINTY = re.compile(r"\b(proven|confirmed|observed|secure|compliant|reachable|vulnerable|protected|impossible|complete)\b", re.I)


def review(payload: dict) -> list[dict]:
    issues: list[dict] = []
    findings = list(payload.get("findings", [])) + list(payload.get("checklistCoverage", []))
    failures = payload.get("engineFailures", []) or []
    generation = str(payload.get("generationStatus", ""))

    if failures and generation.lower() == "complete":
        issues.append({
            "code": "FAILURE_PRESENT_BUT_COMPLETE",
            "message": "Engine failures exist while generation status is Complete.",
        })

    by_id: dict[str, list[dict]] = {}
    for finding in findings:
        finding_id = str(finding.get("findingId", "")).strip()
        if finding_id:
            by_id.setdefault(finding_id, []).append(finding)

        evidence = [str(x).strip() for x in (finding.get("evidenceRefs") or []) if str(x).strip()]
        text = " ".join([
            str(finding.get("title", "")),
            str(finding.get("rationale", "")),
        ])
        if CERTAINTY.search(text) and not evidence and not finding.get("policyRuleId"):
            issues.append({
                "code": "CERTAINTY_WITHOUT_EVIDENCE",
                "findingId": finding_id or None,
                "message": "Strong certainty language has no evidence ref or policy rule.",
            })

        if not str(finding.get("engineType", "")).strip():
            issues.append({
                "code": "MISSING_ENGINE",
                "findingId": finding_id or None,
                "message": "Finding has no engine identity.",
            })

    for finding_id, rows in by_id.items():
        severities = {str(row.get("severity")) for row in rows}
        titles = {str(row.get("title")) for row in rows}
        if len(severities) > 1 or len(titles) > 1:
            issues.append({
                "code": "DUPLICATE_ID_DISAGREEMENT",
                "findingId": finding_id,
                "message": "The same FindingId has conflicting title or severity.",
            })

    return issues


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("snapshot", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args(argv)

    issues = review(json.loads(args.snapshot.read_text(encoding="utf-8")))
    payload = {"schemaVersion": 1, "issueCount": len(issues), "issues": issues}
    rendered = json.dumps(payload, indent=2) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    return 1 if args.enforce and issues else 0


if __name__ == "__main__":
    raise SystemExit(main())
