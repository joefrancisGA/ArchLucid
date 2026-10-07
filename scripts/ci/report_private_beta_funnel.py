#!/usr/bin/env python3
"""Build a tenant-scoped private-beta funnel report from audit JSONL records."""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

MILESTONE_EVENTS: dict[str, frozenset[str]] = {
    "invited": frozenset({"Admin.UserInvitationCreated"}),
    "accepted": frozenset({"Admin.UserInvitationAccepted"}),
    "runCreated": frozenset({"Architecture.RunCreated", "Run.Created"}),
    "finalized": frozenset({"ManifestFinalized", "Run.CommitCompleted"}),
    "exported": frozenset({"RunExported", "Export.DownloadSucceeded"}),
}


def _load_records(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []

    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue

        payload = json.loads(line)

        if not isinstance(payload, dict):
            raise ValueError(f"line {line_number} must contain a JSON object")

        records.append(payload)

    return records


def build_report(records: list[dict[str, Any]]) -> dict[str, object]:
    tenants: dict[str, dict[str, dict[str, object]]] = defaultdict(dict)

    for record in records:
        tenant_id = str(record.get("tenantId", "")).strip()
        event_type = str(record.get("eventType", "")).strip()

        if not tenant_id or not event_type:
            continue

        for milestone, event_types in MILESTONE_EVENTS.items():
            if event_type in event_types:
                tenants[tenant_id][milestone] = {
                    "eventType": event_type,
                    "occurredAtUtc": record.get("occurredAtUtc"),
                    "runId": record.get("runId"),
                    "correlationId": record.get("correlationId"),
                }

    tenant_reports = []

    for tenant_id in sorted(tenants):
        milestones = tenants[tenant_id]
        missing = [milestone for milestone in MILESTONE_EVENTS if milestone not in milestones]
        tenant_reports.append(
            {
                "tenantId": tenant_id,
                "milestones": milestones,
                "missingMilestones": missing,
                "complete": not missing,
            }
        )

    return {
        "milestoneDefinitions": {
            milestone: sorted(event_types)
            for milestone, event_types in MILESTONE_EVENTS.items()
        },
        "tenantCount": len(tenant_reports),
        "completeTenantCount": sum(1 for report in tenant_reports if report["complete"]),
        "tenants": tenant_reports,
    }


def render_markdown(report: dict[str, object]) -> str:
    lines = [
        "# Private-beta funnel report",
        "",
        f"Tenants: **{report['tenantCount']}**  ",
        f"Complete funnels: **{report['completeTenantCount']}**",
        "",
        "| Tenant | Complete | Missing milestones |",
        "| --- | --- | --- |",
    ]

    for tenant in report["tenants"]:
        missing = ", ".join(tenant["missingMilestones"]) or "—"
        lines.append(f"| `{tenant['tenantId']}` | {tenant['complete']} | {missing} |")

    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("records", type=Path)
    parser.add_argument("--json-out", type=Path, default=None)
    parser.add_argument("--markdown-out", type=Path, default=None)
    args = parser.parse_args()

    try:
        report = build_report(_load_records(args.records))
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"ERROR: unable to read funnel records: {error}", file=sys.stderr)
        return 1

    rendered_json = json.dumps(report, indent=2) + "\n"

    if args.json_out is not None:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(rendered_json, encoding="utf-8")

    if args.markdown_out is not None:
        args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
        args.markdown_out.write_text(render_markdown(report), encoding="utf-8")

    print(rendered_json, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
