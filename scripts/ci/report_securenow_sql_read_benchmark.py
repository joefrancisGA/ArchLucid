#!/usr/bin/env python3
"""Extract SQL-backed SecureNow path read measurements from TRX test output."""
import argparse
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

PATTERN = re.compile(r"SECURENOW_SQL_READ_BENCHMARK paths=(\d+) hops=(\d+) repository_calls=(\d+) elapsed_ms=([0-9.]+)")

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--trx", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    a = p.parse_args()
    try:
        root = ET.parse(a.trx).getroot()
        hits = []
        for node in root.iter():
            if node.tag.rsplit("}", 1)[-1] == "UnitTestResult":
                match = PATTERN.search(" ".join(node.itertext()))
                if match:
                    paths, hops, calls, ms = match.groups()
                    hits.append({"path_count": int(paths), "hop_count": int(hops),
                                 "repository_calls": int(calls), "elapsed_ms": float(ms),
                                 "test_outcome": node.attrib.get("outcome", "Unknown")})
        result = {"measurement": "SQL-backed snapshot path/hop read", "scope": "1,001 synthetic path/hop pairs; not live Azure inventory; no SQL command interception",
                  "status": "MEASURED" if hits and all(x["test_outcome"] == "Passed" for x in hits) else "NOT_MEASURED",
                  "samples": hits}
    except (OSError, ET.ParseError) as ex:
        result = {"status": "NOT_MEASURED", "error": str(ex)}
    a.output.parent.mkdir(parents=True, exist_ok=True)
    a.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if result["status"] == "MEASURED" else 1

if __name__ == "__main__":
    raise SystemExit(main())
