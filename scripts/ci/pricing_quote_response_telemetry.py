#!/usr/bin/env python3
"""Compute pricing quote request-to-first-response and request-to-close telemetry."""

from __future__ import annotations

import statistics
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable

SCHEMA_EXPORT = "archlucid.pricing-quote-requests-export.v1"
SCHEMA_WEEKLY = "archlucid.pricing-quote-response-weekly.v1"

# Aligned with docs/runbooks/MARKETING_PRICING_QUOTE_NOTIFICATIONS.md and
# docs/runbooks/PRICING_QUOTE_RESPONSE_TELEMETRY.md.
FIRST_RESPONSE_WARN_HOURS = 18.0
FIRST_RESPONSE_BREACH_HOURS = 24.0
CLOSE_TARGET_HOURS = 72.0
CLOSE_WARN_HOURS = 120.0
CLOSE_BREACH_HOURS = 168.0

RUNBOOK_DOC = "docs/runbooks/PRICING_QUOTE_RESPONSE_TELEMETRY.md"
NOTIFICATIONS_RUNBOOK_DOC = "docs/runbooks/MARKETING_PRICING_QUOTE_NOTIFICATIONS.md"

TELEMETRY_SQL = """
SELECT
    Id,
    CreatedUtc,
    WorkEmail,
    CompanyName,
    TierInterest,
    Status,
    FirstResponseUtc,
    ClosedUtc,
    AssignedOwner
FROM dbo.MarketingPricingQuoteRequests
WHERE CreatedUtc >= ?
  AND CreatedUtc < ?
ORDER BY CreatedUtc ASC;
"""

DEFAULT_SQL_ENV = "ARCHLUCID_PRICING_QUOTE_TELEMETRY_SQL"


@dataclass(frozen=True)
class QuoteRequestRecord:
    id: str
    created_utc: datetime
    work_email: str
    company_name: str
    tier_interest: str
    status: str
    first_response_utc: datetime | None
    closed_utc: datetime | None
    assigned_owner: str | None


@dataclass(frozen=True)
class IntervalMetrics:
    sample_count: int
    median_hours: float | None
    p95_hours: float | None
    warn_count: int
    breach_count: int
    pending_count: int


def parse_datetime(value: object) -> datetime | None:
    if value is None:
        return None

    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)

        return value.astimezone(timezone.utc)

    text = str(value).strip()

    if not text:
        return None

    if text.endswith("Z"):
        text = text[:-1] + "+00:00"

    parsed = datetime.fromisoformat(text)

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def hours_between(start: datetime, end: datetime) -> float:
    delta = end - start
    return delta.total_seconds() / 3600.0


def classify_first_response_hours(hours: float | None, *, pending: bool) -> str:
    if pending or hours is None:
        return "pending"

    if hours >= FIRST_RESPONSE_BREACH_HOURS:
        return "breach"

    if hours >= FIRST_RESPONSE_WARN_HOURS:
        return "warn"

    return "ok"


def classify_close_hours(hours: float | None, *, pending: bool) -> str:
    if pending or hours is None:
        return "pending"

    if hours >= CLOSE_BREACH_HOURS:
        return "breach"

    if hours >= CLOSE_WARN_HOURS:
        return "warn"

    if hours >= CLOSE_TARGET_HOURS:
        return "behind_target"

    return "ok"


def percentile(values: list[float], ratio: float) -> float | None:
    if not values:
        return None

    if len(values) == 1:
        return values[0]

    ordered = sorted(values)
    index = (len(ordered) - 1) * ratio
    lower = int(index)
    upper = min(lower + 1, len(ordered) - 1)
    weight = index - lower
    return ordered[lower] * (1.0 - weight) + ordered[upper] * weight


def normalize_record(raw: dict[str, Any]) -> QuoteRequestRecord:
    created = parse_datetime(raw.get("createdUtc") or raw.get("CreatedUtc"))

    if created is None:
        raise ValueError("Quote request row is missing CreatedUtc")

    request_id = str(raw.get("id") or raw.get("Id") or "").strip()

    if not request_id:
        raise ValueError("Quote request row is missing Id")

    return QuoteRequestRecord(
        id=request_id,
        created_utc=created,
        work_email=str(raw.get("workEmail") or raw.get("WorkEmail") or "").strip(),
        company_name=str(raw.get("companyName") or raw.get("CompanyName") or "").strip(),
        tier_interest=str(raw.get("tierInterest") or raw.get("TierInterest") or "").strip(),
        status=str(raw.get("status") or raw.get("Status") or "Open").strip(),
        first_response_utc=parse_datetime(raw.get("firstResponseUtc") or raw.get("FirstResponseUtc")),
        closed_utc=parse_datetime(raw.get("closedUtc") or raw.get("ClosedUtc")),
        assigned_owner=(
            str(raw.get("assignedOwner") or raw.get("AssignedOwner")).strip()
            if raw.get("assignedOwner") or raw.get("AssignedOwner")
            else None
        ),
    )


def load_records_from_export(payload: dict[str, Any]) -> list[QuoteRequestRecord]:
    rows = payload.get("rows")

    if not isinstance(rows, list):
        raise ValueError("Export payload must include a rows array")

    return [normalize_record(row) for row in rows if isinstance(row, dict)]


def resolve_week_window(
    *,
    week_start: datetime | None,
    week_end: datetime | None,
    as_of_utc: datetime | None = None,
) -> tuple[datetime, datetime]:
    anchor = as_of_utc or datetime.now(timezone.utc)

    if week_start is not None and week_end is not None:
        start = week_start.astimezone(timezone.utc)
        end = week_end.astimezone(timezone.utc)
        return start, end

    # Previous calendar week: Monday 00:00 UTC through next Monday 00:00 UTC (exclusive end).
    anchor_date = anchor.date()
    days_since_monday = anchor_date.weekday()
    this_monday = anchor_date - timedelta(days=days_since_monday)
    previous_monday = this_monday - timedelta(days=7)
    next_monday = previous_monday + timedelta(days=7)
    start = datetime(previous_monday.year, previous_monday.month, previous_monday.day, tzinfo=timezone.utc)
    end = datetime(next_monday.year, next_monday.month, next_monday.day, tzinfo=timezone.utc)
    return start, end


def filter_records_for_window(
    records: Iterable[QuoteRequestRecord],
    *,
    week_start: datetime,
    week_end: datetime,
) -> list[QuoteRequestRecord]:
    filtered: list[QuoteRequestRecord] = []

    for record in records:
        if week_start <= record.created_utc < week_end:
            filtered.append(record)

    return filtered


def build_row_telemetry(record: QuoteRequestRecord, *, as_of_utc: datetime) -> dict[str, Any]:
    first_response_hours = (
        hours_between(record.created_utc, record.first_response_utc)
        if record.first_response_utc is not None
        else hours_between(record.created_utc, as_of_utc)
    )
    first_response_pending = record.first_response_utc is None
    first_response_status = classify_first_response_hours(
        first_response_hours if not first_response_pending else None,
        pending=first_response_pending,
    )

    close_hours = (
        hours_between(record.created_utc, record.closed_utc)
        if record.closed_utc is not None
        else hours_between(record.created_utc, as_of_utc)
    )
    close_pending = record.status.lower() != "closed" or record.closed_utc is None
    close_status = classify_close_hours(close_hours if not close_pending else None, pending=close_pending)

    return {
        "id": record.id,
        "companyName": record.company_name,
        "tierInterest": record.tier_interest,
        "status": record.status,
        "assignedOwner": record.assigned_owner,
        "createdUtc": record.created_utc.isoformat(),
        "firstResponseUtc": record.first_response_utc.isoformat() if record.first_response_utc else None,
        "closedUtc": record.closed_utc.isoformat() if record.closed_utc else None,
        "timeToFirstResponseHours": round(first_response_hours, 2),
        "timeToCloseHours": round(close_hours, 2),
        "firstResponseSlaStatus": first_response_status,
        "closeSlaStatus": close_status,
    }


def summarize_interval(rows: list[dict[str, Any]], *, status_key: str, hours_key: str) -> IntervalMetrics:
    measured_hours: list[float] = []
    warn_count = 0
    breach_count = 0
    pending_count = 0

    for row in rows:
        status = str(row.get(status_key) or "")
        hours = row.get(hours_key)

        if status == "pending":
            pending_count += 1
            continue

        if status == "warn" or status == "behind_target":
            warn_count += 1

        if status == "breach":
            breach_count += 1

        if isinstance(hours, (int, float)):
            measured_hours.append(float(hours))

    median_hours = statistics.median(measured_hours) if measured_hours else None
    p95_hours = percentile(measured_hours, 0.95)

    return IntervalMetrics(
        sample_count=len(measured_hours),
        median_hours=round(median_hours, 2) if median_hours is not None else None,
        p95_hours=round(p95_hours, 2) if p95_hours is not None else None,
        warn_count=warn_count,
        breach_count=breach_count,
        pending_count=pending_count,
    )


def resolve_weekly_disposition(
    *,
    first_response: IntervalMetrics,
    close_interval: IntervalMetrics,
) -> str:
    if first_response.breach_count > 0 or close_interval.breach_count > 0:
        return "HOLD"

    if first_response.warn_count > 0 or close_interval.warn_count > 0 or close_interval.pending_count > 0:
        return "WARN"

    return "PASS"


def build_weekly_payload(
    records: list[QuoteRequestRecord],
    *,
    week_start: datetime,
    week_end: datetime,
    as_of_utc: datetime | None = None,
    source: str,
) -> dict[str, Any]:
    anchor = as_of_utc or datetime.now(timezone.utc)
    window_records = filter_records_for_window(records, week_start=week_start, week_end=week_end)
    row_telemetry = [build_row_telemetry(record, as_of_utc=anchor) for record in window_records]
    first_response = summarize_interval(
        row_telemetry,
        status_key="firstResponseSlaStatus",
        hours_key="timeToFirstResponseHours",
    )
    close_interval = summarize_interval(
        row_telemetry,
        status_key="closeSlaStatus",
        hours_key="timeToCloseHours",
    )
    disposition = resolve_weekly_disposition(
        first_response=first_response,
        close_interval=close_interval,
    )

    return {
        "schema": SCHEMA_WEEKLY,
        "generatedUtc": anchor.isoformat(),
        "source": source,
        "weekStartUtc": week_start.isoformat(),
        "weekEndUtc": week_end.isoformat(),
        "requestCount": len(window_records),
        "weeklyDisposition": disposition,
        "thresholds": {
            "firstResponseWarnHours": FIRST_RESPONSE_WARN_HOURS,
            "firstResponseBreachHours": FIRST_RESPONSE_BREACH_HOURS,
            "closeTargetHours": CLOSE_TARGET_HOURS,
            "closeWarnHours": CLOSE_WARN_HOURS,
            "closeBreachHours": CLOSE_BREACH_HOURS,
        },
        "firstResponse": {
            "sampleCount": first_response.sample_count,
            "medianHours": first_response.median_hours,
            "p95Hours": first_response.p95_hours,
            "warnCount": first_response.warn_count,
            "breachCount": first_response.breach_count,
            "pendingCount": first_response.pending_count,
        },
        "close": {
            "sampleCount": close_interval.sample_count,
            "medianHours": close_interval.median_hours,
            "p95Hours": close_interval.p95_hours,
            "warnCount": close_interval.warn_count,
            "breachCount": close_interval.breach_count,
            "pendingCount": close_interval.pending_count,
        },
        "rows": row_telemetry,
        "runbookDoc": RUNBOOK_DOC,
        "notificationsRunbookDoc": NOTIFICATIONS_RUNBOOK_DOC,
    }


def render_weekly_markdown(payload: dict[str, Any]) -> str:
    disposition = str(payload.get("weeklyDisposition") or "WARN")
    first_response = payload.get("firstResponse") or {}
    close_interval = payload.get("close") or {}
    thresholds = payload.get("thresholds") or {}

    lines = [
        "# Pricing quote response telemetry (weekly)",
        "",
        f"**Disposition:** **{disposition}** (PASS = within thresholds; WARN = aging or behind close target; HOLD = SLA breach)",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Week start (UTC) | {payload.get('weekStartUtc')} |",
        f"| Week end (UTC) | {payload.get('weekEndUtc')} |",
        f"| Requests created | {payload.get('requestCount')} |",
        f"| Source | {payload.get('source')} |",
        "",
        "## Thresholds",
        "",
        f"- First response warn: **{thresholds.get('firstResponseWarnHours')} h**; breach: **{thresholds.get('firstResponseBreachHours')} h**",
        f"- Close target: **{thresholds.get('closeTargetHours')} h** (3 business days); warn: **{thresholds.get('closeWarnHours')} h**; breach: **{thresholds.get('closeBreachHours')} h**",
        "",
        "## First response",
        "",
        "| Metric | Value |",
        "| --- | --- |",
        f"| Measured responses | {first_response.get('sampleCount')} |",
        f"| Median hours | {first_response.get('medianHours')} |",
        f"| P95 hours | {first_response.get('p95Hours')} |",
        f"| Warn | {first_response.get('warnCount')} |",
        f"| Breach | {first_response.get('breachCount')} |",
        f"| Pending | {first_response.get('pendingCount')} |",
        "",
        "## Close / follow-up",
        "",
        "| Metric | Value |",
        "| --- | --- |",
        f"| Measured closes | {close_interval.get('sampleCount')} |",
        f"| Median hours | {close_interval.get('medianHours')} |",
        f"| P95 hours | {close_interval.get('p95Hours')} |",
        f"| Warn / behind target | {close_interval.get('warnCount')} |",
        f"| Breach | {close_interval.get('breachCount')} |",
        f"| Still open | {close_interval.get('pendingCount')} |",
        "",
        f"Runbook: [`PRICING_QUOTE_RESPONSE_TELEMETRY.md`](../../{payload.get('runbookDoc')})",
        "",
    ]

    rows = payload.get("rows") or []

    if rows:
        lines.extend(
            [
                "## Request detail",
                "",
                "| Company | Tier | First response (h) | Close (h) | First SLA | Close SLA |",
                "| --- | --- | ---: | ---: | --- | --- |",
            ],
        )

        for row in rows:
            lines.append(
                "| {company} | {tier} | {first_hours} | {close_hours} | {first_sla} | {close_sla} |".format(
                    company=row.get("companyName") or "—",
                    tier=row.get("tierInterest") or "—",
                    first_hours=row.get("timeToFirstResponseHours"),
                    close_hours=row.get("timeToCloseHours"),
                    first_sla=row.get("firstResponseSlaStatus"),
                    close_sla=row.get("closeSlaStatus"),
                ),
            )

        lines.append("")

    return "\n".join(lines)


def fetch_records_from_sql(
    odbc_conn_str: str,
    *,
    week_start: datetime,
    week_end: datetime,
) -> list[QuoteRequestRecord]:
    try:
        import pyodbc  # type: ignore[import-not-found]
    except ImportError as ex:
        raise RuntimeError("pyodbc is required for SQL telemetry export") from ex

    connection = pyodbc.connect(odbc_conn_str, timeout=15)

    try:
        cursor = connection.cursor()
        cursor.execute(TELEMETRY_SQL, week_start, week_end)
        columns = [column[0] for column in cursor.description]
        records: list[QuoteRequestRecord] = []

        for fetched in cursor.fetchall():
            raw = {columns[index]: fetched[index] for index in range(len(columns))}
            records.append(normalize_record(raw))

        return records
    finally:
        connection.close()
