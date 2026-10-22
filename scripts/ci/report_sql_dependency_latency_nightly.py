#!/usr/bin/env python3
"""Generate the nightly SQL dependency latency digest for owner email."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from app_insights_daily_error_telemetry import parse_log_analytics_response  # noqa: E402
from log_analytics_query import resolve_workspace_id, run_log_analytics_query  # noqa: E402
from sql_dependency_latency_telemetry import (  # noqa: E402
    KQL_SQL_DEPENDENCY_LATENCY,
    build_report_payload,
    format_kql,
    render_email_subject,
    render_markdown_report,
    rows_from_records,
    utc_now,
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace-id", type=str, default=None)
    parser.add_argument("--environment", type=str, default="dev")
    parser.add_argument("--window-hours", type=int, default=24)
    parser.add_argument("--limit", type=int, default=40)
    parser.add_argument(
        "--fixture-json",
        type=Path,
        default=None,
        help="Offline mode: Log Analytics query JSON (CLI array or tables object)",
    )
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    return parser.parse_args(argv)


def load_query_payload(*, workspace_id: str, window_hours: int, limit: int, fixture_json: Path | None) -> tuple[Any, str]:
    if fixture_json is not None:
        # Accept both CLI array shape and classic { "tables": [...] } payloads.
        raw = json.loads(fixture_json.read_text(encoding="utf-8-sig"))
        return raw, f"fixture:{fixture_json}"

    query = format_kql(KQL_SQL_DEPENDENCY_LATENCY, hours=window_hours, limit=limit)
    return run_log_analytics_query(workspace_id, query), f"log-analytics:{workspace_id}"


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    workspace_id = resolve_workspace_id(args.workspace_id)
    as_of_utc = utc_now()
    payload_raw, source = load_query_payload(
        workspace_id=workspace_id,
        window_hours=args.window_hours,
        limit=args.limit,
        fixture_json=args.fixture_json,
    )
    rows = rows_from_records(parse_log_analytics_response(payload_raw))
    report = build_report_payload(
        rows=rows,
        window_hours=args.window_hours,
        workspace_id=workspace_id,
        source=source,
        as_of_utc=as_of_utc,
        environment=args.environment,
    )
    report["emailSubject"] = render_email_subject(report)
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown_report(report) + "\n", encoding="utf-8")
    totals = report.get("totals") or {}
    print(
        "SQL dependency latency digest: "
        f"rows={totals.get('rowCount', 0)} "
        f"events={totals.get('eventCount', 0)} "
        f"maxP95Ms={totals.get('maxP95Ms', 0)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
