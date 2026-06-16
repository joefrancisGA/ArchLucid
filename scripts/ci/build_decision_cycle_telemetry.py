#!/usr/bin/env python3
"""Summarize decision-cycle telemetry from local GTM milestone event logs."""

from __future__ import annotations

import argparse
import json
import statistics
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA_PATH = Path(__file__).resolve().parent / "data" / "decision_cycle_telemetry_schema.v1.json"
_PAYLOAD_SCHEMA = "archlucid.decision-cycle-telemetry.v1"
_SUMMARY_SCHEMA = "archlucid.decision-cycle-telemetry-summary.v1"

_CANONICAL_SEQUENCE: tuple[str, ...] = (
    "demo_complete",
    "pilot_start",
    "first_committed_run",
    "sponsor_packet_sent",
    "next_step_decision",
)


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_schema() -> dict[str, Any]:
    return json.loads(_SCHEMA_PATH.read_text(encoding="utf-8"))


def _parse_utc(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def validate_events(payload: dict[str, Any], schema: dict[str, Any] | None = None) -> list[str]:
    schema = schema or _load_schema()
    errors: list[str] = []

    if payload.get("schema") != _PAYLOAD_SCHEMA:
        errors.append(f"schema must be {_PAYLOAD_SCHEMA}")

    events = payload.get("events")

    if not isinstance(events, list) or not events:
        errors.append("events must be a non-empty array")
        return errors

    allowed_types = set(schema.get("allowedEventTypes") or [])
    required = set(schema.get("requiredEventFields") or [])

    for index, event in enumerate(events):
        if not isinstance(event, dict):
            errors.append(f"events[{index}] must be an object")
            continue

        for field in required:
            if field not in event or (isinstance(event[field], str) and not str(event[field]).strip()):
                errors.append(f"events[{index}] missing {field}")

        event_type = str(event.get("eventType") or "")

        if event_type not in allowed_types:
            errors.append(f"events[{index}] invalid eventType: {event_type!r}")

        try:
            _parse_utc(str(event.get("occurredUtc") or ""))
        except ValueError:
            errors.append(f"events[{index}] invalid occurredUtc")

    return errors


def _group_by_account(events: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = {}

    for event in events:
        account = str(event.get("accountLabel") or "unknown")
        grouped.setdefault(account, []).append(event)

    for account in grouped:
        grouped[account].sort(key=lambda row: _parse_utc(str(row["occurredUtc"])))

    return grouped


def _duration_hours(start: datetime, end: datetime) -> float:
    return round((end - start).total_seconds() / 3600.0, 2)


def build_summary(payload: dict[str, Any]) -> dict[str, Any]:
    events = [row for row in payload.get("events") or [] if isinstance(row, dict)]
    grouped = _group_by_account(events)

    account_rows: list[dict[str, Any]] = []
    demo_to_pilot: list[float] = []
    pilot_to_commit: list[float] = []
    commit_to_send: list[float] = []
    send_to_decision: list[float] = []

    for account, rows in sorted(grouped.items()):
        by_type = {str(row.get("eventType")): row for row in rows}
        missing = [event_type for event_type in _CANONICAL_SEQUENCE if event_type not in by_type]
        durations: dict[str, float | None] = {}

        if "demo_complete" in by_type and "pilot_start" in by_type:
            hours = _duration_hours(
                _parse_utc(str(by_type["demo_complete"]["occurredUtc"])),
                _parse_utc(str(by_type["pilot_start"]["occurredUtc"])),
            )
            durations["demoToPilotHours"] = hours
            demo_to_pilot.append(hours)

        if "pilot_start" in by_type and "first_committed_run" in by_type:
            hours = _duration_hours(
                _parse_utc(str(by_type["pilot_start"]["occurredUtc"])),
                _parse_utc(str(by_type["first_committed_run"]["occurredUtc"])),
            )
            durations["pilotToCommitHours"] = hours
            pilot_to_commit.append(hours)

        if "first_committed_run" in by_type and "sponsor_packet_sent" in by_type:
            hours = _duration_hours(
                _parse_utc(str(by_type["first_committed_run"]["occurredUtc"])),
                _parse_utc(str(by_type["sponsor_packet_sent"]["occurredUtc"])),
            )
            durations["commitToSendHours"] = hours
            commit_to_send.append(hours)

        if "sponsor_packet_sent" in by_type and "next_step_decision" in by_type:
            hours = _duration_hours(
                _parse_utc(str(by_type["sponsor_packet_sent"]["occurredUtc"])),
                _parse_utc(str(by_type["next_step_decision"]["occurredUtc"])),
            )
            durations["sendToDecisionHours"] = hours
            send_to_decision.append(hours)

        decision = by_type.get("next_step_decision") or {}
        account_rows.append(
            {
                "accountLabel": account,
                "eventCount": len(rows),
                "missingMilestones": missing,
                "durationsHours": durations,
                "nextStepOutcome": decision.get("outcome"),
            }
        )

    def _median(values: list[float]) -> float | None:
        if not values:
            return None

        return round(statistics.median(values), 2)

    def _outlier_threshold(values: list[float]) -> float | None:
        median = _median(values)

        if median is None:
            return None

        return round(median * 2.0, 2)

    return {
        "schema": _SUMMARY_SCHEMA,
        "generatedUtc": _utc_now(),
        "accountCount": len(grouped),
        "accounts": account_rows,
        "cohortMediansHours": {
            "demoToPilot": _median(demo_to_pilot),
            "pilotToCommit": _median(pilot_to_commit),
            "commitToSend": _median(commit_to_send),
            "sendToDecision": _median(send_to_decision),
        },
        "outlierThresholdsHours": {
            "demoToPilot": _outlier_threshold(demo_to_pilot),
            "pilotToCommit": _outlier_threshold(pilot_to_commit),
            "commitToSend": _outlier_threshold(commit_to_send),
            "sendToDecision": _outlier_threshold(send_to_decision),
        },
        "interpretationNotes": [
            "Outliers above 2× cohort median indicate delay hotspots for roadmap prioritization.",
            "Missing milestones mean the account journey is incomplete — do not infer conversion velocity.",
            "Keep accountLabel pseudonymous; no CRM integration required for V1 telemetry.",
        ],
    }


def render_markdown(summary: dict[str, Any]) -> str:
    medians = summary.get("cohortMediansHours") or {}
    lines = [
        "# Decision-cycle telemetry summary",
        "",
        f"**Accounts:** {summary.get('accountCount')}",
        f"**Generated UTC:** {summary.get('generatedUtc')}",
        "",
        "## Cohort medians (hours)",
        "",
        "| Segment | Median hours | Outlier threshold (2× median) |",
        "| --- | --- | --- |",
    ]

    thresholds = summary.get("outlierThresholdsHours") or {}

    for key, label in (
        ("demoToPilot", "Demo → pilot start"),
        ("pilotToCommit", "Pilot start → first commit"),
        ("commitToSend", "First commit → sponsor packet sent"),
        ("sendToDecision", "Sponsor packet sent → next-step decision"),
    ):
        lines.append(
            f"| {label} | {medians.get(key)} | {thresholds.get(key)} |"
        )

    lines.extend(["", "## Per-account rows", ""])

    for row in summary.get("accounts") or []:
        if not isinstance(row, dict):
            continue

        lines.append(f"### {row.get('accountLabel')}")
        lines.append(f"- Events: {row.get('eventCount')}")
        lines.append(f"- Missing milestones: {', '.join(row.get('missingMilestones') or []) or '(none)'}")
        lines.append(f"- Next-step outcome: {row.get('nextStepOutcome') or 'unknown'}")
        lines.append("")

    lines.extend(["## Interpretation", ""])

    for note in summary.get("interpretationNotes") or []:
        lines.append(f"- {note}")

    lines.append("")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--events-json", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, default=None)
    args = parser.parse_args(argv)

    payload = json.loads(args.events_json.read_text(encoding="utf-8"))
    errors = validate_events(payload)

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    summary = build_summary(payload)
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    if args.markdown_out is not None:
        args.markdown_out.write_text(render_markdown(summary), encoding="utf-8")

    print(f"Decision-cycle telemetry summary written: {args.json_out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
