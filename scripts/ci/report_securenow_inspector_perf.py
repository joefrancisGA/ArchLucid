#!/usr/bin/env python3
"""Report SecureNow inspector regression latency from TRX (not an HTTP/SQL benchmark)."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import xml.etree.ElementTree as ET

TEST_NAME = "TryGetPathDetailAsync_does_not_query_fanout_finding_ids_per_path"

def inspect(paths: list[Path]) -> dict:
    matches = []
    for path in paths:
        root = ET.parse(path).getroot()
        for case in root.iter():
            if case.tag.rsplit("}", 1)[-1] != "UnitTestResult":
                continue
            if TEST_NAME not in case.attrib.get("testName", ""):
                continue
            matches.append({
                "file": path.name,
                "test": case.attrib.get("testName"),
                "outcome": case.attrib.get("outcome", "Unknown"),
                "duration": case.attrib.get("duration"),
            })
    return {
        "scope": "in-memory path-inspector regression, not production HTTP latency",
        "metric": "TRX test-case wall-clock duration, includes test overhead",
        "query_count": "asserted zero single-path finding lookups in regression fixture; not measured SQL queries",
        "tests": matches,
        "status": "PASS" if matches and all(x["outcome"] == "Passed" for x in matches) else "NO_EVIDENCE_OR_FAIL",
    }

def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--trx", type=Path, action="append", required=True)
    p.add_argument("--out", type=Path, required=True)
    args = p.parse_args()
    try:
        report = inspect(args.trx)
    except (OSError, ET.ParseError) as exc:
        report = {"status": "NO_EVIDENCE_OR_FAIL", "error": str(exc)}
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["status"] == "PASS" else 1

if __name__ == "__main__":
    raise SystemExit(main())
