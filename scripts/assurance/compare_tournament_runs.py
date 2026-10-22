#!/usr/bin/env python3
"""Compare two architecture tournament summaries without selecting a winner."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def compare(left: dict, right: dict) -> dict:
    dimension_names = sorted(set(left.get("dimensions", {})) | set(right.get("dimensions", {})))
    dimensions = {}

    for name in dimension_names:
        left_mean = left.get("dimensions", {}).get(name, {}).get("mean")
        right_mean = right.get("dimensions", {}).get(name, {}).get("mean")
        delta = None
        if left_mean is not None and right_mean is not None:
            delta = round(float(right_mean) - float(left_mean), 6)
        dimensions[name] = {
            "leftMean": left_mean,
            "rightMean": right_mean,
            "deltaRightMinusLeft": delta,
        }

    return {
        "schemaVersion": 1,
        "left": {"runId": left.get("runId"), "version": left.get("version")},
        "right": {"runId": right.get("runId"), "version": right.get("version")},
        "dimensions": dimensions,
        "hardGatePass": {
            "left": left.get("hardGatePass"),
            "right": right.get("hardGatePass"),
        },
        "elapsedSeconds": {
            "left": left.get("totalElapsedSeconds"),
            "right": right.get("totalElapsedSeconds"),
        },
        "costUsd": {
            "left": left.get("totalCostUsd"),
            "right": right.get("totalCostUsd"),
        },
        "note": "Comparison reports deltas only; it does not declare an overall winner.",
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("left", type=Path)
    parser.add_argument("right", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args(argv)

    payload = compare(
        json.loads(args.left.read_text(encoding="utf-8")),
        json.loads(args.right.read_text(encoding="utf-8")),
    )
    rendered = json.dumps(payload, indent=2) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
