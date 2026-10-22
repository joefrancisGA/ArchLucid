#!/usr/bin/env python3
"""Emit a reproducible release-signal health report for critical CI jobs (advisory)."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.ci-release-signal-health.v1"

# Merge-blocking or release-relevant jobs tracked for flake/hang triage.
CRITICAL_JOBS: tuple[str, ...] = (
    "dotnet-full-regression-core-complete",
    "dotnet-full-regression-slow-api",
    "dotnet-full-regression-slow-domain",
    "ui-e2e-live",
    "ui-e2e-live-apikey",
    "ui-e2e-live-jwt",
    "ui-e2e-live-beta-access",
    "openapi-contract-snapshot",
    "release-smoke-rc",
    "rc-signoff-gate",
)

_FAILURE_CLASS_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("timeout", re.compile(r"timeout|timed out|deadline exceeded", re.I)),
    ("hang", re.compile(r"hang|blame-hang|did not complete|stuck", re.I)),
    ("assertion", re.compile(r"assert|expected|should be|fail(ed)?\s+test", re.I)),
    ("infra", re.compile(r"connection refused|503|502|docker|sql server|service container", re.I)),
    ("config", re.compile(r"config|environment variable|missing secret|invalid profile", re.I)),
)


def classify_failure(text: str) -> str:
    for label, pattern in _FAILURE_CLASS_PATTERNS:
        if pattern.search(text):
            return label

    return "unknown"


def parse_needs_json(raw: str) -> dict[str, Any]:
    payload = json.loads(raw)

    if not isinstance(payload, dict):
        raise ValueError("needs JSON must be an object")

    return payload


def build_report(*, needs: dict[str, Any], log_excerpt: str | None) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []

    for job_id in CRITICAL_JOBS:
        entry = needs.get(job_id) or {}
        result = str(entry.get("result") or "not_run").lower()
        failure_class = "none"

        if result in {"failure", "canceled", "timed_out"}:
            failure_class = classify_failure(log_excerpt or result)

        rows.append(
            {
                "jobId": job_id,
                "result": result,
                "failureClass": failure_class,
                "releaseRelevant": True,
            }
        )

    failed = [row for row in rows if row["result"] not in {"success", "skipped", "not_run"}]

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "criticalJobCount": len(CRITICAL_JOBS),
        "failedCount": len(failed),
        "rows": rows,
        "summary": (
            "All tracked release-signal jobs succeeded or were skipped."
            if not failed
            else f"{len(failed)} critical job(s) need triage — see failureClass buckets."
        ),
    }


def render_markdown(payload: dict[str, Any]) -> str:
    lines = [
        "# CI release-signal health",
        "",
        f"Generated UTC: **{payload['generatedUtc']}**",
        "",
        f"**Summary:** {payload['summary']}",
        "",
        "| Job | Result | Failure class |",
        "| --- | --- | --- |",
    ]

    for row in payload.get("rows") or []:
        lines.append(
            f"| {row['jobId']} | {row['result']} | {row['failureClass']} |"
        )

    lines.append("")
    return "\n".join(lines)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--needs-json", type=Path, help="GitHub Actions needs JSON (from toJSON(needs)).")
    parser.add_argument("--log-excerpt", type=Path, help="Optional failing log excerpt for classification.")
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    needs: dict[str, Any] = {}

    if args.needs_json and args.needs_json.is_file():
        needs = parse_needs_json(args.needs_json.read_text(encoding="utf-8"))

    log_excerpt = None

    if args.log_excerpt and args.log_excerpt.is_file():
        log_excerpt = args.log_excerpt.read_text(encoding="utf-8", errors="replace")[:8000]

    payload = build_report(needs=needs, log_excerpt=log_excerpt)

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    print(payload["summary"])

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
