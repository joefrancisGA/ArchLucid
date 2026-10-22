#!/usr/bin/env python3
"""Generate the daily App Insights / Log Analytics error digest for owner email."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from app_insights_daily_error_telemetry import (  # noqa: E402
    KQL_EXCEPTIONS,
    KQL_FAILED_DEPENDENCIES,
    KQL_FAILED_REQUESTS,
    build_report_payload,
    format_kql,
    load_baseline_file,
    mark_new_rows,
    merge_rows_into_baseline,
    parse_log_analytics_response,
    render_email_subject,
    render_markdown_report,
    rows_from_exceptions,
    rows_from_failed_dependencies,
    rows_from_failed_requests,
    utc_now,
)
from release_evidence_common import load_json  # noqa: E402


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace-id", type=str, default=None, help="Log Analytics workspace customer ID")
    parser.add_argument("--environment", type=str, default="dev")
    parser.add_argument("--window-hours", type=int, default=24)
    parser.add_argument("--limit", type=int, default=40)
    parser.add_argument("--baseline-in", type=Path, default=None)
    parser.add_argument("--baseline-out", type=Path, default=None)
    parser.add_argument("--fixture-dir", type=Path, default=None, help="Offline mode: directory with query JSON fixtures")
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    return parser.parse_args(argv)


def resolve_workspace_id(explicit: str | None) -> str:
    value = (explicit or os.environ.get("ARCHLUCID_LOG_ANALYTICS_WORKSPACE_ID", "")).strip()

    if not value:
        raise SystemExit(
            "Log Analytics workspace id required: --workspace-id or ARCHLUCID_LOG_ANALYTICS_WORKSPACE_ID"
        )

    return value


def run_log_analytics_query(workspace_id: str, query: str) -> dict[str, Any]:
    completed = subprocess.run(
        [
            "az",
            "monitor",
            "log-analytics",
            "query",
            "--workspace",
            workspace_id,
            "--analytics-query",
            query,
            "-o",
            "json",
        ],
        check=False,
        capture_output=True,
        text=True,
    )

    if completed.returncode != 0:
        raise SystemExit(
            "Log Analytics query failed.\n"
            f"query={query}\n"
            f"stderr={completed.stderr.strip()}\n"
            f"stdout={completed.stdout.strip()}"
        )

    payload = json.loads(completed.stdout)

    return payload


def load_fixture_query(fixture_dir: Path, name: str) -> dict[str, Any]:
    path = fixture_dir / name
    payload = load_json(path)

    if payload is None:
        raise SystemExit(f"Fixture missing or invalid JSON: {path}")

    return payload


def collect_rows(
    *,
    workspace_id: str,
    window_hours: int,
    limit: int,
    fixture_dir: Path | None,
) -> tuple[list, str]:
    if fixture_dir is not None:
        exceptions_payload = load_fixture_query(fixture_dir, "exceptions.json")
        requests_payload = load_fixture_query(fixture_dir, "failed-requests.json")
        dependencies_payload = load_fixture_query(fixture_dir, "failed-dependencies.json")
        source = f"fixture:{fixture_dir}"
    else:
        exceptions_payload = run_log_analytics_query(
            workspace_id,
            format_kql(KQL_EXCEPTIONS, hours=window_hours, limit=limit),
        )
        requests_payload = run_log_analytics_query(
            workspace_id,
            format_kql(KQL_FAILED_REQUESTS, hours=window_hours, limit=limit),
        )
        dependencies_payload = run_log_analytics_query(
            workspace_id,
            format_kql(KQL_FAILED_DEPENDENCIES, hours=window_hours, limit=limit),
        )
        source = f"log-analytics:{workspace_id}"

    rows = []
    rows.extend(rows_from_exceptions(parse_log_analytics_response(exceptions_payload)))
    rows.extend(rows_from_failed_requests(parse_log_analytics_response(requests_payload)))
    rows.extend(rows_from_failed_dependencies(parse_log_analytics_response(dependencies_payload)))
    rows.sort(key=lambda row: (-row.count, row.signature))

    return rows, source


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    workspace_id = resolve_workspace_id(args.workspace_id)
    as_of_utc = utc_now()
    baseline_before = load_baseline_file(args.baseline_in)
    rows, source = collect_rows(
        workspace_id=workspace_id,
        window_hours=args.window_hours,
        limit=args.limit,
        fixture_dir=args.fixture_dir,
    )
    marked_rows = mark_new_rows(rows, baseline_before)
    payload = build_report_payload(
        rows=marked_rows,
        window_hours=args.window_hours,
        workspace_id=workspace_id,
        source=source,
        as_of_utc=as_of_utc,
        environment=args.environment,
    )
    payload["emailSubject"] = render_email_subject(payload)
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown_report(payload) + "\n", encoding="utf-8")

    if args.baseline_out is not None:
        baseline_after = merge_rows_into_baseline(baseline_before, marked_rows, as_of_utc=as_of_utc)
        args.baseline_out.parent.mkdir(parents=True, exist_ok=True)
        args.baseline_out.write_text(json.dumps(baseline_after, indent=2) + "\n", encoding="utf-8")

    totals = payload.get("totals") or {}
    print(
        "App Insights daily digest: "
        f"signatures={totals.get('signatureCount', 0)} "
        f"new={totals.get('newSignatureCount', 0)} "
        f"events={totals.get('eventCount', 0)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
