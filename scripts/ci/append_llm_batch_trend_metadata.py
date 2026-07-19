#!/usr/bin/env python3
"""Append LLM batch routing metadata to TB-683 nightly trend JSON (TB-685)."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--trend-json", required=True, type=Path)
    parser.add_argument("--enabled", choices=("true", "false"), default="false")
    args = parser.parse_args()

    trend_path: Path = args.trend_json
    payload = json.loads(trend_path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise SystemExit("trend JSON root must be an object")

    payload["llmBatch"] = {
        "enabled": args.enabled == "true",
        "mode": "azure_openai_batch_api" if args.enabled == "true" else "sync_fallback",
        "estimatedDiscountRatio": 0.5,
        "monthlySavingsNoteUsd": (
            "~$3–$8/month at current 18-exemplar nightly volume when offline judge refresh uses batch"
            if args.enabled == "true"
            else "Batch path disabled; synchronous completions only"
        ),
    }

    trend_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
