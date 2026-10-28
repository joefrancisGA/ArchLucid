#!/usr/bin/env python3
"""Extract SQL-backed SecureNow path read measurements from TRX test output."""
import argparse
import json
import math
import re
import xml.etree.ElementTree as ET
from pathlib import Path

EXPECTED_TEST = "Batch_insert_preserves_every_path_and_hop_across_buffer_boundaries"
PATTERN = re.compile(r"SECURENOW_SQL_READ_BENCHMARK paths=(\d+) hops=(\d+) repository_calls=(\d+) elapsed_ms=([0-9.]+)")

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--trx", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--measurement-file", type=Path, help="Dedicated test-produced measurement artifact; not TRX stdout")
    a = p.parse_args()
    try:
        root = ET.parse(a.trx).getroot()
        hits = []
        passed_tests = []
        for node in root.iter():
            if node.tag.rsplit("}", 1)[-1] == "UnitTestResult" and node.attrib.get("testName", "").rsplit(".", 1)[-1] == EXPECTED_TEST:
                outcome = node.attrib.get("outcome", "Unknown")
                passed_tests.append(outcome)
                output = a.measurement_file.read_text(encoding="utf-8") if a.measurement_file else " ".join(node.itertext())
                matches = PATTERN.findall(output)
                match = matches[0] if len(matches) == 1 else None
                if match:
                    paths, hops, calls, ms = match
                    hits.append({"path_count": int(paths), "hop_count": int(hops),
                                 "repository_calls": int(calls), "elapsed_ms": float(ms),
                                 "test_outcome": outcome})
        # Do not accept a spoofed line from another test or an invalid/partial workload.
        valid = (
            len(passed_tests) == 1 and passed_tests[0] == "Passed"
            and len(hits) == 1
            and hits[0]["test_outcome"] == "Passed"
            and hits[0]["path_count"] == 1001
            and hits[0]["hop_count"] == 1001
            and hits[0]["repository_calls"] == 1
            and math.isfinite(hits[0]["elapsed_ms"])
            and hits[0]["elapsed_ms"] > 0
        )
        result = {"measurement": "SQL-backed snapshot path/hop read", "scope": "1,001 synthetic path/hop pairs; not live Azure inventory; no SQL command interception",
                  "status": "MEASURED" if valid else "NOT_MEASURED",
                  "samples": hits}
    except (OSError, ET.ParseError) as ex:
        result = {"status": "NOT_MEASURED", "error": str(ex)}
    a.output.parent.mkdir(parents=True, exist_ok=True)
    a.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if result["status"] == "MEASURED" else 1

if __name__ == "__main__":
    raise SystemExit(main())
