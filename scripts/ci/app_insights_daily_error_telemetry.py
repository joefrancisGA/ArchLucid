#!/usr/bin/env python3
"""Shared helpers for the daily App Insights / Log Analytics error digest."""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

SCHEMA_BASELINE = "archlucid.app-insights-error-baseline.v1"
SCHEMA_REPORT = "archlucid.app-insights-daily-error-report.v1"

KQL_EXCEPTIONS = """
AppExceptions
| where TimeGenerated > ago({hours}h)
| summarize
    Count = count(),
    SampleOuterMessage = take_any(OuterMessage),
    SampleOperation = take_any(OperationName),
    SampleRole = take_any(AppRoleName)
  by Type, ProblemId
| order by Count desc
| take {limit}
""".strip()

KQL_FAILED_REQUESTS = """
AppRequests
| where TimeGenerated > ago({hours}h)
| where Success == false and toint(ResultCode) >= 500
| summarize Count = count() by Name, ResultCode
| order by Count desc
| take {limit}
""".strip()

KQL_FAILED_DEPENDENCIES = """
AppDependencies
| where TimeGenerated > ago({hours}h)
| where Success == false
| summarize Count = count() by Type, Name, ResultCode
| order by Count desc
| take {limit}
""".strip()

_GUID_RE = re.compile(
    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
)
_NUMBER_RE = re.compile(r"\b\d+\b")
_WHITESPACE_RE = re.compile(r"\s+")


@dataclass(frozen=True)
class ErrorRow:
    category: str
    signature: str
    count: int
    label: str
    detail: str
    is_new: bool = False


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def format_kql(template: str, *, hours: int, limit: int) -> str:
    return template.format(hours=hours, limit=limit)


def normalize_message(value: Any, *, max_len: int = 160) -> str:
    if not isinstance(value, str):
        return ""

    text = value.strip().splitlines()[0] if value.strip() else ""
    text = _GUID_RE.sub("<guid>", text)
    text = _NUMBER_RE.sub("<n>", text)
    text = _WHITESPACE_RE.sub(" ", text).strip().lower()

    if len(text) > max_len:
        return text[: max_len - 3] + "..."

    return text


def build_exception_signature(
    exception_type: Any,
    problem_id: Any,
    outer_message: Any,
) -> str:
    type_part = str(exception_type or "unknown").strip()
    problem_part = str(problem_id or "unknown").strip()
    message_part = normalize_message(outer_message)

    return f"ex:{type_part}|{problem_part}|{message_part}"


def build_request_signature(name: Any, result_code: Any) -> str:
    return f"req:{str(name or 'unknown').strip()}|{str(result_code or 'unknown').strip()}"


def build_dependency_signature(dep_type: Any, name: Any, result_code: Any) -> str:
    return (
        f"dep:{str(dep_type or 'unknown').strip()}|"
        f"{str(name or 'unknown').strip()}|"
        f"{str(result_code or 'unknown').strip()}"
    )


def parse_log_analytics_response(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        records: list[dict[str, Any]] = []

        for row in payload:
            if not isinstance(row, dict):
                continue

            record = dict(row)
            record.pop("TableName", None)
            records.append(record)

        return records

    if not isinstance(payload, dict):
        return []

    tables = payload.get("tables")

    if not isinstance(tables, list) or not tables:
        return []

    primary = tables[0]

    if not isinstance(primary, dict):
        return []

    columns = primary.get("columns")
    rows = primary.get("rows")

    if not isinstance(columns, list) or not isinstance(rows, list):
        return []

    names: list[str] = []

    for column in columns:
        if isinstance(column, dict) and isinstance(column.get("name"), str):
            names.append(column["name"])
        else:
            names.append("")

    records = []

    for row in rows:
        if not isinstance(row, list):
            continue

        record: dict[str, Any] = {}

        for index, name in enumerate(names):
            if not name:
                continue

            if index < len(row):
                record[name] = row[index]

        records.append(record)

    return records


def parse_count(value: Any) -> int:
    if isinstance(value, bool):
        return int(value)

    if isinstance(value, int):
        return value

    if isinstance(value, float):
        return int(value)

    if isinstance(value, str) and value.strip().isdigit():
        return int(value.strip())

    return 0


def rows_from_exceptions(records: list[dict[str, Any]]) -> list[ErrorRow]:
    parsed: list[ErrorRow] = []

    for record in records:
        count = parse_count(record.get("Count", 0))
        exception_type = record.get("Type")
        problem_id = record.get("ProblemId")
        outer_message = record.get("SampleOuterMessage")
        operation = record.get("SampleOperation")
        role = record.get("SampleRole")
        signature = build_exception_signature(exception_type, problem_id, outer_message)
        label = str(exception_type or "Exception")
        detail_parts = [
            f"problemId={problem_id}",
            f"operation={operation}",
            f"role={role}",
            f"sample={outer_message}",
        ]
        parsed.append(
            ErrorRow(
                category="exception",
                signature=signature,
                count=count,
                label=label,
                detail=" | ".join(part for part in detail_parts if part and not part.endswith("=None")),
            )
        )

    return parsed


def rows_from_failed_requests(records: list[dict[str, Any]]) -> list[ErrorRow]:
    parsed: list[ErrorRow] = []

    for record in records:
        count = parse_count(record.get("Count", 0))
        name = record.get("Name")
        result_code = record.get("ResultCode")
        signature = build_request_signature(name, result_code)
        parsed.append(
            ErrorRow(
                category="failed_request",
                signature=signature,
                count=count,
                label=str(name or "request"),
                detail=f"resultCode={result_code}",
            )
        )

    return parsed


def rows_from_failed_dependencies(records: list[dict[str, Any]]) -> list[ErrorRow]:
    parsed: list[ErrorRow] = []

    for record in records:
        count = parse_count(record.get("Count", 0))
        dep_type = record.get("Type")
        name = record.get("Name")
        result_code = record.get("ResultCode")
        signature = build_dependency_signature(dep_type, name, result_code)
        parsed.append(
            ErrorRow(
                category="failed_dependency",
                signature=signature,
                count=count,
                label=f"{dep_type}:{name}",
                detail=f"resultCode={result_code}",
            )
        )

    return parsed


def empty_baseline(*, as_of_utc: datetime | None = None) -> dict[str, Any]:
    stamp = (as_of_utc or utc_now()).isoformat()

    return {
        "schema": SCHEMA_BASELINE,
        "updatedAtUtc": stamp,
        "signatures": {},
    }


def load_baseline_file(path: Path | None) -> dict[str, Any]:
    if path is None:
        return empty_baseline()

    try:
        payload = json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, json.JSONDecodeError):
        return empty_baseline()

    if not isinstance(payload, dict):
        return empty_baseline()

    signatures = payload.get("signatures")

    if not isinstance(signatures, dict):
        return empty_baseline()

    return {
        "schema": SCHEMA_BASELINE,
        "updatedAtUtc": payload.get("updatedAtUtc") or utc_now().isoformat(),
        "signatures": signatures,
    }


def merge_rows_into_baseline(
    baseline: dict[str, Any],
    rows: list[ErrorRow],
    *,
    as_of_utc: datetime,
) -> dict[str, Any]:
    signatures = dict(baseline.get("signatures") or {})
    stamp = as_of_utc.isoformat()

    for row in rows:
        existing = signatures.get(row.signature)

        if isinstance(existing, dict):
            signatures[row.signature] = {
                "firstSeenUtc": existing.get("firstSeenUtc") or stamp,
                "lastSeenUtc": stamp,
                "category": row.category,
                "label": row.label,
            }
        else:
            signatures[row.signature] = {
                "firstSeenUtc": stamp,
                "lastSeenUtc": stamp,
                "category": row.category,
                "label": row.label,
            }

    return {
        "schema": SCHEMA_BASELINE,
        "updatedAtUtc": stamp,
        "signatures": signatures,
    }


def mark_new_rows(rows: list[ErrorRow], baseline: dict[str, Any]) -> list[ErrorRow]:
    known = baseline.get("signatures") or {}
    marked: list[ErrorRow] = []

    for row in rows:
        is_new = row.signature not in known
        marked.append(
            ErrorRow(
                category=row.category,
                signature=row.signature,
                count=row.count,
                label=row.label,
                detail=row.detail,
                is_new=is_new,
            )
        )

    return marked


def build_report_payload(
    *,
    rows: list[ErrorRow],
    window_hours: int,
    workspace_id: str,
    source: str,
    as_of_utc: datetime,
    environment: str,
) -> dict[str, Any]:
    new_rows = [row for row in rows if row.is_new]
    total_events = sum(row.count for row in rows)

    return {
        "schema": SCHEMA_REPORT,
        "generatedAtUtc": as_of_utc.isoformat(),
        "environment": environment,
        "workspaceId": workspace_id,
        "windowHours": window_hours,
        "source": source,
        "totals": {
            "signatureCount": len(rows),
            "newSignatureCount": len(new_rows),
            "eventCount": total_events,
            "newEventCount": sum(row.count for row in new_rows),
        },
        "signatures": [
            {
                "category": row.category,
                "signature": row.signature,
                "count": row.count,
                "label": row.label,
                "detail": row.detail,
                "isNew": row.is_new,
            }
            for row in rows
        ],
    }


def render_markdown_report(payload: dict[str, Any]) -> str:
    totals = payload.get("totals") or {}
    generated = payload.get("generatedAtUtc", "")
    environment = payload.get("environment", "unknown")
    window_hours = payload.get("windowHours", 24)
    workspace_id = payload.get("workspaceId", "")
    signatures = payload.get("signatures") or []

    lines = [
        "# App Insights daily error digest",
        "",
        f"- Generated (UTC): `{generated}`",
        f"- Environment: `{environment}`",
        f"- Log Analytics workspace: `{workspace_id}`",
        f"- Window: last `{window_hours}` hours",
        f"- Distinct signatures: **{totals.get('signatureCount', 0)}**",
        f"- New signatures: **{totals.get('newSignatureCount', 0)}**",
        f"- Total events (sum of counts): **{totals.get('eventCount', 0)}**",
        "",
    ]

    new_rows = [row for row in signatures if row.get("isNew")]
    recurring_rows = [row for row in signatures if not row.get("isNew")]

    if new_rows:
        lines.extend(["## New error signatures", ""])

        for row in new_rows:
            lines.append(
                f"- **{row.get('label')}** (`{row.get('category')}`, count={row.get('count')}) — {row.get('detail')}"
            )

        lines.append("")
    else:
        lines.extend(["## New error signatures", "", "_No new signatures in this window._", ""])

    if recurring_rows:
        lines.extend(["## Recurring signatures (already in baseline)", ""])

        for row in recurring_rows[:25]:
            lines.append(
                f"- {row.get('label')} (`{row.get('category')}`, count={row.get('count')}) — {row.get('detail')}"
            )

        if len(recurring_rows) > 25:
            lines.append(f"- … and {len(recurring_rows) - 25} more recurring signatures")

        lines.append("")

    lines.extend(
        [
            "---",
            "Generated by `.github/workflows/app-insights-daily-error-report.yml`.",
            "Runbook: `docs/runbooks/APP_INSIGHTS_DAILY_ERROR_REPORT.md`.",
        ]
    )

    return "\n".join(lines)


def render_email_subject(payload: dict[str, Any]) -> str:
    totals = payload.get("totals") or {}
    new_count = int(totals.get("newSignatureCount") or 0)
    generated = str(payload.get("generatedAtUtc") or "")
    day = generated[:10] if len(generated) >= 10 else "today"
    environment = str(payload.get("environment") or "dev")

    if new_count > 0:
        return f"[ArchLucid] {environment}: {new_count} new App Insights error signature(s) — {day}"

    return f"[ArchLucid] {environment}: no new App Insights errors — {day}"


def render_email_plain(payload: dict[str, Any]) -> str:
    return render_markdown_report(payload).replace("**", "")


def stable_report_id(payload: dict[str, Any]) -> str:
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()

    return digest[:12]
