#!/usr/bin/env python3
"""Report SecureNow analysis regression timings from real TRX test results.

Durations include fixture/setup overhead and are NOT production latency or microbenchmarks.
Missing/failed/duplicate cases fail closed rather than fabricating measurements.
"""
import argparse
import datetime as dt
import json
from pathlib import Path
import xml.etree.ElementTree as ET

REQUIRED = {
    "PathRankingEngineTests": "RunAsync_loads_defender_posture_for_blast_radius_ranking",
    "CutPointAnalysisEngineTests": "RunAsync_empty_snapshot_clears_cut_points_without_error",
}


def collect(path: Path) -> dict:
    root = ET.parse(path).getroot()
    tests = []
    for node in root.iter():
        if node.tag.rsplit("}", 1)[-1] != "UnitTestResult":
            continue
        name = node.attrib.get("testName", "")
        for fixture, case in REQUIRED.items():
            if fixture in name and case in name:
                duration = node.attrib.get("duration", "")
                try:
                    seconds = dt.timedelta(
                        hours=int(duration.split(":")[0]),
                        minutes=int(duration.split(":")[1]),
                        seconds=float(duration.split(":")[2]),
                    ).total_seconds()
                except (ValueError, IndexError, OverflowError):
                    seconds = -1
                tests.append({
                    "fixture": fixture,
                    "case": case,
                    "outcome": node.attrib.get("outcome", "Unknown"),
                    "duration_ms": round(seconds * 1000, 3) if seconds >= 0 else None,
                })
    counts = {fixture: sum(t["fixture"] == fixture for t in tests) for fixture in REQUIRED}
    valid = (
        all(v == 1 for v in counts.values())
        and all(t["outcome"] == "Passed" and t["duration_ms"] is not None for t in tests)
    )
    return {
        "status": "RECORDED" if valid else "MISSING_OR_FAILED",
        "measurement": "TRX unit-test duration including test setup",
        "environment": "CI Release, mocked/in-memory analysis dependencies",
        "not_a_measurement_of": ["production p95", "SQL latency", "algorithm-only runtime"],
        "required_cases": len(REQUIRED),
        "tests": sorted(tests, key=lambda t: t["fixture"]),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--trx", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        report = collect(args.trx)
    except (OSError, ET.ParseError) as ex:
        report = {"status": "MISSING_OR_FAILED", "error": str(ex)}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["status"] == "RECORDED" else 1


if __name__ == "__main__":
    raise SystemExit(main())
