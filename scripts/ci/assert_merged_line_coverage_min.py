#!/usr/bin/env python3
"""
CI guard: merged Cobertura (ReportGenerator output) must meet a minimum line coverage percent.

Coverlet runs per test assembly; enforcing <Threshold> in coverage.runsettings would not
represent solution-wide coverage. The full-regression job merges Cobertura files first.
"""
from __future__ import annotations

import sys
import xml.etree.ElementTree as ET


def _main() -> int:
    if len(sys.argv) < 2:
        print(
            "Usage: assert_merged_line_coverage_min.py <Cobertura.xml> [min_percent]",
            file=sys.stderr,
        )
        return 2

    path = sys.argv[1]
    min_pct = float(sys.argv[2]) if len(sys.argv) > 2 else 70.0

    tree = ET.parse(path)
    root = tree.getroot()
    line_rate_str = root.attrib.get("line-rate")
    if line_rate_str is None:
        print(f"Missing line-rate on root element in {path!r}.", file=sys.stderr)
        return 2

    line_rate = float(line_rate_str)
    pct = line_rate * 100.0

    if pct + 1e-9 < min_pct:
        print(
            f"Merged line coverage {pct:.2f}% is below required minimum {min_pct:.2f}%."
        )
        return 1

    print(f"Merged line coverage gate OK: {pct:.2f}% (minimum {min_pct:.2f}%).")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
