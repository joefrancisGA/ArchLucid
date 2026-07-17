#!/usr/bin/env python3
"""Helpers for the nightly SQL dependency latency digest (AppDependencies)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

SCHEMA_REPORT = "archlucid.sql-dependency-latency-report.v1"

# In Log Analytics, table column Type is always "AppDependencies". SQL calls from
# Microsoft.Data.SqlClient often land as DependencyType="Other" with an Azure SQL Target.
KQL_SQL_DEPENDENCY_LATENCY = """
AppDependencies
| where TimeGenerated > ago({hours}h)
| where Target has "database.windows.net"
    or DependencyType in ("SQL", "sql", "Microsoft.Data.SqlClient")
| summarize
    Count = count(),
    p50 = percentile(DurationMs, 50),
    p95 = percentile(DurationMs, 95),
    p99 = percentile(DurationMs, 99)
  by Name, Target, DependencyType
| order by p95 desc
| take {limit}
""".strip()


@dataclass(frozen=True)
class SqlLatencyRow:
    name: str
    target: str
    dependency_type: str
    count: int
    p50_ms: float
    p95_ms: float
    p99_ms: float


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def format_kql(template: str, *, hours: int, limit: int) -> str:
    return template.format(hours=hours, limit=limit)


def parse_number(value: Any) -> float:
    if isinstance(value, bool):
        return float(int(value))

    if isinstance(value, (int, float)):
        return float(value)

    if isinstance(value, str):
        text = value.strip()

        if not text:
            return 0.0

        try:
            return float(text)
        except ValueError:
            return 0.0

    return 0.0


def truncate(value: str, *, max_len: int = 180) -> str:
    text = " ".join(value.split())

    if len(text) <= max_len:
        return text

    return text[: max_len - 3] + "..."


def rows_from_records(records: list[dict[str, Any]]) -> list[SqlLatencyRow]:
    rows: list[SqlLatencyRow] = []

    for record in records:
        rows.append(
            SqlLatencyRow(
                name=str(record.get("Name") or "unknown"),
                target=str(record.get("Target") or ""),
                dependency_type=str(record.get("DependencyType") or ""),
                count=int(parse_number(record.get("Count", 0))),
                p50_ms=parse_number(record.get("p50")),
                p95_ms=parse_number(record.get("p95")),
                p99_ms=parse_number(record.get("p99")),
            )
        )

    rows.sort(key=lambda row: (-row.p95_ms, -row.count, row.name))
    return rows


def build_report_payload(
    *,
    rows: list[SqlLatencyRow],
    window_hours: int,
    workspace_id: str,
    source: str,
    as_of_utc: datetime,
    environment: str,
) -> dict[str, Any]:
    return {
        "schema": SCHEMA_REPORT,
        "generatedAtUtc": as_of_utc.isoformat(),
        "environment": environment,
        "workspaceId": workspace_id,
        "windowHours": window_hours,
        "source": source,
        "totals": {
            "rowCount": len(rows),
            "eventCount": sum(row.count for row in rows),
            "maxP95Ms": max((row.p95_ms for row in rows), default=0.0),
        },
        "rows": [
            {
                "name": row.name,
                "target": row.target,
                "dependencyType": row.dependency_type,
                "count": row.count,
                "p50Ms": row.p50_ms,
                "p95Ms": row.p95_ms,
                "p99Ms": row.p99_ms,
            }
            for row in rows
        ],
    }


def render_email_subject(payload: dict[str, Any]) -> str:
    totals = payload.get("totals") or {}
    environment = str(payload.get("environment") or "dev")
    generated = str(payload.get("generatedAtUtc") or "")
    day = generated[:10] if len(generated) >= 10 else "today"
    row_count = int(totals.get("rowCount") or 0)
    max_p95 = float(totals.get("maxP95Ms") or 0.0)

    if row_count == 0:
        return f"[ArchLucid] {environment}: SQL latency nightly — no SQL deps — {day}"

    return (
        f"[ArchLucid] {environment}: SQL latency nightly — "
        f"{row_count} statements, max p95 {max_p95:.0f}ms — {day}"
    )


def render_markdown_report(payload: dict[str, Any]) -> str:
    totals = payload.get("totals") or {}
    rows = payload.get("rows") or []
    lines = [
        "# SQL dependency latency (nightly)",
        "",
        f"- Generated (UTC): `{payload.get('generatedAtUtc', '')}`",
        f"- Environment: `{payload.get('environment', 'unknown')}`",
        f"- Log Analytics workspace: `{payload.get('workspaceId', '')}`",
        f"- Window: last `{payload.get('windowHours', 24)}` hours",
        f"- Distinct statements: **{totals.get('rowCount', 0)}**",
        f"- Total dependency events: **{totals.get('eventCount', 0)}**",
        f"- Max p95 (ms): **{float(totals.get('maxP95Ms') or 0.0):.1f}**",
        "",
        "Source: `AppDependencies` targeting `*.database.windows.net` (or DependencyType SQL).",
        "",
    ]

    if not rows:
        lines.extend(["_No SQL dependency samples in this window._", ""])
    else:
        lines.extend(
            [
                "| p95 (ms) | p50 | p99 | Count | Name | Target |",
                "| ---: | ---: | ---: | ---: | --- | --- |",
            ]
        )

        for row in rows:
            lines.append(
                "| {p95:.1f} | {p50:.1f} | {p99:.1f} | {count} | `{name}` | `{target}` |".format(
                    p95=float(row.get("p95Ms") or 0.0),
                    p50=float(row.get("p50Ms") or 0.0),
                    p99=float(row.get("p99Ms") or 0.0),
                    count=int(row.get("count") or 0),
                    name=truncate(str(row.get("name") or ""), max_len=80).replace("|", "/"),
                    target=truncate(str(row.get("target") or ""), max_len=80).replace("|", "/"),
                )
            )

        lines.append("")

    lines.extend(
        [
            "---",
            "Generated by `.github/workflows/sql-dependency-latency-nightly.yml`.",
            "Runbook: `docs/runbooks/SQL_DEPENDENCY_LATENCY_NIGHTLY.md`.",
        ]
    )

    return "\n".join(lines)
