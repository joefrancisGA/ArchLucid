#!/usr/bin/env python3
"""Normalize archlucid.k6-production-like-summary.v1 artifacts for trend storage."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def _load(path: Path) -> dict:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError(f"{path} is not a JSON object")
    return payload


def _normalize_one(payload: dict, source: str) -> dict:
    schema = payload.get("schema")
    if schema != "archlucid.k6-production-like-summary.v1":
        raise ValueError(f"{source}: unsupported schema {schema!r}")

    return {
        "schema": schema,
        "source": source,
        "profile": payload.get("profile"),
        "mode": payload.get("mode"),
        "baseUrl": payload.get("baseUrl"),
        "p95Ms": payload.get("p95Ms"),
        "errorRate": payload.get("errorRate"),
        "slowestRouteTag": payload.get("slowestRouteTag"),
        "llmCallCount": payload.get("llmCallCount"),
        "estimatedTokenCostUsd": payload.get("estimatedTokenCostUsd"),
        "evidencePayloadBytes": payload.get("evidencePayloadBytes"),
        "generatedUtc": payload.get("generatedUtc"),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("inputs", nargs="+", help="Summary JSON files")
    parser.add_argument("--out", required=True, help="Normalized JSON array output path")
    args = parser.parse_args()

    rows: list[dict] = []

    for raw in args.inputs:
        path = Path(raw)
        rows.append(_normalize_one(_load(path), str(path)))

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(rows, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(rows)} normalized rows to {out_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1) from exc
