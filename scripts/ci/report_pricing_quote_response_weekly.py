#!/usr/bin/env python3
"""Generate weekly pricing quote response telemetry JSON/Markdown for owner review."""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from pricing_quote_response_telemetry import (  # noqa: E402
    DEFAULT_SQL_ENV,
    build_weekly_payload,
    fetch_records_from_sql,
    load_records_from_export,
    parse_datetime,
    render_weekly_markdown,
    resolve_week_window,
)
from release_evidence_common import load_json  # noqa: E402


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input-json",
        type=Path,
        help="Fixture or AdminAuthority export with schema archlucid.pricing-quote-requests-export.v1",
    )
    parser.add_argument(
        "--sql-odbc",
        type=str,
        default=None,
        help=f"ODBC connection string for dbo.MarketingPricingQuoteRequests (or env {DEFAULT_SQL_ENV})",
    )
    parser.add_argument("--week-start", type=str, default=None, help="ISO-8601 UTC week start (inclusive)")
    parser.add_argument("--week-end", type=str, default=None, help="ISO-8601 UTC week end (exclusive)")
    parser.add_argument("--as-of", type=str, default=None, help="ISO-8601 UTC anchor for pending intervals")
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit non-zero when weeklyDisposition is HOLD",
    )
    return parser.parse_args(argv)


def resolve_sql_connection_string(explicit: str | None) -> str | None:
    if explicit and explicit.strip():
        return explicit.strip()

    env_value = os.environ.get(DEFAULT_SQL_ENV, "").strip()

    if env_value:
        return env_value

    return None


def load_records(args: argparse.Namespace, *, week_start: datetime, week_end: datetime) -> tuple[list, str]:
    if args.input_json:
        payload = load_json(args.input_json)

        if payload is None:
            raise SystemExit(f"Could not read input JSON: {args.input_json}")

        return load_records_from_export(payload), f"json:{args.input_json}"

    sql_conn = resolve_sql_connection_string(args.sql_odbc)

    if sql_conn:
        return fetch_records_from_sql(sql_conn, week_start=week_start, week_end=week_end), "sql:MarketingPricingQuoteRequests"

    raise SystemExit("Supply --input-json or --sql-odbc / ARCHLUCID_PRICING_QUOTE_TELEMETRY_SQL")


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    week_start = parse_datetime(args.week_start) if args.week_start else None
    week_end = parse_datetime(args.week_end) if args.week_end else None
    as_of_utc = parse_datetime(args.as_of) if args.as_of else datetime.now(timezone.utc)
    resolved_start, resolved_end = resolve_week_window(
        week_start=week_start,
        week_end=week_end,
        as_of_utc=as_of_utc,
    )
    records, source = load_records(args, week_start=resolved_start, week_end=resolved_end)
    payload = build_weekly_payload(
        records,
        week_start=resolved_start,
        week_end=resolved_end,
        as_of_utc=as_of_utc,
        source=source,
    )

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_weekly_markdown(payload), encoding="utf-8")

    print(
        "OK: pricing quote weekly telemetry "
        f"{payload['weeklyDisposition']} "
        f"(requests={payload['requestCount']})",
    )

    if args.strict and payload["weeklyDisposition"] == "HOLD":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
