#!/usr/bin/env python3
"""Summarize TRX suite durations without treating them as isolated capacity calibration."""
import argparse
import json
from pathlib import Path
import xml.etree.ElementTree as ET

def parse_trx(path):
    path = Path(path)
    if not path.is_file():
        return {"status": "MISSING_TRX", "tests": 0, "durationSeconds": None}
    root = ET.parse(path).getroot()
    records = [e for e in root.iter() if e.tag.rsplit("}", 1)[-1] == "UnitTestResult"]
    if not records:
        return {"status": "NO_TEST_RESULTS", "tests": 0, "durationSeconds": None}
    total = 0.0
    failed = 0
    for rec in records:
        elapsed = rec.attrib.get("duration", "00:00:00")
        parts = elapsed.split(":")
        if len(parts) != 3:
            raise ValueError("Malformed TRX duration")
        total += float(parts[0])*3600 + float(parts[1])*60 + float(parts[2])
        failed += rec.attrib.get("outcome") != "Passed"
    return {"status": "PASSED" if not failed else "FAILED", "tests": len(records),
            "failed": failed, "sumTestDurationSeconds": round(total, 6)}

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--vector", required=True)
    p.add_argument("--sql", required=True)
    p.add_argument("--output", required=True)
    a = p.parse_args()
    data = {"schemaVersion": 1, "evidenceStatus": "TRX_SUITE_TIMING_NOT_RESOURCE_CALIBRATION",
            "vector": parse_trx(a.vector), "sql": parse_trx(a.sql),
            "limitations": "Test suite durations include test harness and setup; vector index is in-memory; SQL includes test fixture overhead. Not isolated CPU, memory, production vector database latency, or SLA."}
    out = Path(a.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=2)+"\n", encoding="utf-8")
    print(json.dumps(data, indent=2))
    return 0 if all(data[k]["status"] == "PASSED" for k in ("vector", "sql")) else 1

if __name__ == "__main__":
    raise SystemExit(main())
