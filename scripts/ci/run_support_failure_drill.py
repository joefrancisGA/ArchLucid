#!/usr/bin/env python3
"""Rehearse detection, triage, and recovery using synthetic support events."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from evaluate_support_bundle_status import evaluate as evaluate_bundle  # noqa: E402

EXPECTED = {
    "ingestion-failure": ("FAILED", "RECOVERED"),
    "delayed-job": ("STALLED", "RECOVERED"),
    "partial-export": ("INCOMPLETE", "RECOVERED"),
}


def synthetic_events() -> list[dict]:
    return [
        {"scenario": scenario, "state": state, "correlationId": f"synthetic-{scenario}",
         "artifactId": f"fixture-{scenario}"}
        for scenario, states in EXPECTED.items() for state in states
    ]


def classify(events: list[dict]) -> dict:
    rows = []
    for scenario, expected in EXPECTED.items():
        matching = [event for event in events if event.get("scenario") == scenario]
        observed = [event.get("state") if event.get("state") in {"FAILED", "STALLED", "INCOMPLETE", "RECOVERED"}
                    else "UNRECOGNIZED" for event in matching]
        complete = observed == list(expected) and all(event.get("correlationId") and event.get("artifactId")
                                                      for event in matching)
        fingerprint = lambda value: hashlib.sha256(str(value).encode()).hexdigest()[:12]
        rows.append({"scenario": scenario, "status": "PASS" if complete else "HOLD",
                     "observedStates": observed, "expectedStates": list(expected),
                     "correlationFingerprints": [fingerprint(event.get("correlationId")) for event in matching],
                     "artifactFingerprints": [fingerprint(event.get("artifactId")) for event in matching]})
    return {"schema": "archlucid.support-failure-drill.v1",
            "status": "PASS" if all(row["status"] == "PASS" for row in rows) else "HOLD", "rows": rows}


def run(output: Path, events: list[dict], *, synthetic: bool) -> dict:
    output.mkdir(parents=True, exist_ok=True)
    report = classify(events)
    report["evidenceClass"] = "synthetic-rehearsal" if synthetic else "provided-events-unverified"
    report["limitations"] = "This drill validates triage and recovery evidence shape; it does not inject faults into a live system."
    # Never copy arbitrary event bodies into the shareable support summary.
    lines = ["# Support bundle summary", "", f"Drill status: {report['status']}",
             f"Evidence class: {report['evidenceClass']}", "", "| Scenario | Status | Transition |",
             "| --- | --- | --- |"]
    for row in report["rows"]:
        lines.append(f"| {row['scenario']} | {row['status']} | {' → '.join(row['observedStates'])} |")
    (output / "support-bundle-summary.md").write_text("\n".join(lines + ["", report["limitations"], ""]), encoding="utf-8")
    bundle_status = evaluate_bundle(output)
    report["bundleStatus"] = bundle_status["status"]
    report["redactionStatus"] = bundle_status["redactionStatus"]
    if bundle_status["status"] != "PASS":
        report["status"] = "HOLD"
    (output / "support-failure-drill.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--events-json", type=Path, help="Optional observed event sequence; never copied into the support bundle")
    args = parser.parse_args()
    events = json.loads(args.events_json.read_text()) if args.events_json else synthetic_events()
    if not isinstance(events, list) or not all(isinstance(event, dict) for event in events):
        parser.error("events JSON must be an array of objects")
    report = run(args.output_dir, events, synthetic=args.events_json is None)
    print(f"Support failure drill: {report['status']} ({report['evidenceClass']})")
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
