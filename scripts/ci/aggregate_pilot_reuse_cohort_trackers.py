#!/usr/bin/env python3
"""Aggregate pilot reuse cohort trackers into an sponsor cohort rollup."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]
_SCHEMA_PATH = _REPO / "scripts" / "ci" / "data" / "pilot_reuse_cohort_tracker_schema.v1.json"
_PAYLOAD_SCHEMA = "archlucid.pilot-reuse-cohort-tracker.v1"
_OUTPUT_SCHEMA = "archlucid.pilot-reuse-cohort-tracker-cohort-summary.v1"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_schema() -> dict[str, object]:
    payload = json.loads(_SCHEMA_PATH.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"Expected JSON object in {_SCHEMA_PATH}")

    return payload


def discover_trackers(root: Path) -> list[Path]:
    if not root.is_dir():
        return []

    return sorted(root.rglob("tracker.json"))


def load_tracker(path: Path) -> dict[str, object]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"Expected JSON object in {path}")

    if payload.get("schema") != _PAYLOAD_SCHEMA:
        raise ValueError(f"Unsupported schema in {path}")

    return payload


def checkpoint_detail(payload: dict[str, object], key: str) -> dict[str, object]:
    follow_up_raw = payload.get("followUp")
    follow_up = follow_up_raw if isinstance(follow_up_raw, dict) else {}
    checkpoint_raw = follow_up.get(key)
    checkpoint = checkpoint_raw if isinstance(checkpoint_raw, dict) else {}

    return checkpoint


def aggregate_trackers(trackers: list[dict[str, object]]) -> dict[str, object]:
    session_ids: list[str] = []
    tracking_complete = 0
    day30_recorded = 0
    day30_continuing = 0
    day30_returned = 0
    day30_dropped = 0
    day30_inactive = 0
    independent_day30 = 0
    founder_assisted_day30 = 0
    voluntary_return_total = 0
    continuation_reasons: Counter[str] = Counter()
    dropoff_reasons: Counter[str] = Counter()

    for tracker in trackers:
        session_ids.append(str(tracker.get("sessionId") or tracker.get("runId") or "unknown"))

        if tracker.get("trackingComplete") is True:
            tracking_complete += 1

        day30 = checkpoint_detail(tracker, "day30")
        usage_state = str(day30.get("usageState") or "").strip()
        assistance_mode = str(day30.get("assistanceMode") or "").strip()
        reason = str(day30.get("continuationOrDropoffReason") or "").strip()
        return_count_raw = day30.get("voluntaryReturnCount")
        return_count = return_count_raw if isinstance(return_count_raw, int) else 0

        if usage_state and usage_state != "not-yet-due":
            day30_recorded += 1
            voluntary_return_total += return_count

            if usage_state == "continuing-voluntarily":
                day30_continuing += 1

                if reason:
                    continuation_reasons[reason[:120]] += 1

            elif usage_state == "returned-voluntarily":
                day30_returned += 1

                if reason:
                    continuation_reasons[reason[:120]] += 1

            elif usage_state == "dropped":
                day30_dropped += 1

                if reason:
                    dropoff_reasons[reason[:120]] += 1

            elif usage_state == "inactive-no-return":
                day30_inactive += 1

                if reason:
                    dropoff_reasons[reason[:120]] += 1

            if assistance_mode == "independent":
                independent_day30 += 1
            elif assistance_mode in {"founder-assisted", "mixed"}:
                founder_assisted_day30 += 1

    total = len(trackers)
    day30_retention_rate = round((day30_continuing + day30_returned) / day30_recorded, 3) if day30_recorded else None
    independent_rate = round(independent_day30 / day30_recorded, 3) if day30_recorded else None
    avg_voluntary_returns = round(voluntary_return_total / day30_recorded, 2) if day30_recorded else None

    return {
        "schema": _OUTPUT_SCHEMA,
        "generatedUtc": utc_now(),
        "pilotCount": total,
        "sessionIds": session_ids,
        "trackingCompleteCount": tracking_complete,
        "day30RecordedCount": day30_recorded,
        "day30ContinuingCount": day30_continuing,
        "day30ReturnedVoluntarilyCount": day30_returned,
        "day30DroppedCount": day30_dropped,
        "day30InactiveCount": day30_inactive,
        "day30RetentionRate": day30_retention_rate,
        "independentUsageDay30Count": independent_day30,
        "founderAssistedDay30Count": founder_assisted_day30,
        "independentUsageRate": independent_rate,
        "averageVoluntaryReturnsAtDay30": avg_voluntary_returns,
        "topContinuationReasons": [
            {"reason": reason, "count": count}
            for reason, count in continuation_reasons.most_common(5)
        ],
        "topDropoffReasons": [
            {"reason": reason, "count": count}
            for reason, count in dropoff_reasons.most_common(5)
        ],
        "interpretationGuardrails": [
            "Voluntary reuse is operator-recorded — not inferred from product telemetry.",
            "Do not treat day-30 retention rate as PMF proof until trackingComplete discipline is consistent.",
            "Founder-assisted usage must be separated from independent returns before scaling narrative.",
            "Redact customer-identifying content from reason fields before sponsor circulation.",
        ],
    }


def render_markdown(payload: dict[str, object]) -> str:
    lines = [
        "# Pilot reuse cohort — sponsor rollup",
        "",
        f"**Generated UTC:** {payload.get('generatedUtc')}",
        f"**Pilots in corpus:** {payload.get('pilotCount')}",
        f"**Tracking complete:** {payload.get('trackingCompleteCount')}",
        f"**Day-30 checkpoints recorded:** {payload.get('day30RecordedCount')}",
        "",
        "## Day-30 voluntary usage summary",
        "",
        "| Metric | Value |",
        "| --- | --- |",
        f"| Continuing voluntarily | {payload.get('day30ContinuingCount')} |",
        f"| Returned voluntarily | {payload.get('day30ReturnedVoluntarilyCount')} |",
        f"| Dropped | {payload.get('day30DroppedCount')} |",
        f"| Inactive (no return) | {payload.get('day30InactiveCount')} |",
        f"| Retention rate (continuing + returned / recorded) | {payload.get('day30RetentionRate')} |",
        f"| Independent usage at day 30 | {payload.get('independentUsageDay30Count')} |",
        f"| Founder-assisted / mixed at day 30 | {payload.get('founderAssistedDay30Count')} |",
        f"| Independent usage rate | {payload.get('independentUsageRate')} |",
        f"| Average voluntary returns at day 30 | {payload.get('averageVoluntaryReturnsAtDay30')} |",
        "",
        "## Top continuation reasons",
        "",
    ]

    continuation_rows = payload.get("topContinuationReasons") or []

    if continuation_rows:
        for row in continuation_rows:
            if not isinstance(row, dict):
                continue

            lines.append(f"- ({row.get('count')}) {row.get('reason')}")
    else:
        lines.append("- _none recorded_")

    lines.extend(["", "## Top dropoff reasons", ""])

    dropoff_rows = payload.get("topDropoffReasons") or []

    if dropoff_rows:
        for row in dropoff_rows:
            if not isinstance(row, dict):
                continue

            lines.append(f"- ({row.get('count')}) {row.get('reason')}")
    else:
        lines.append("- _none recorded_")

    lines.extend(["", "## Guardrails", ""])

    for guardrail in payload.get("interpretationGuardrails") or []:
        lines.append(f"- {guardrail}")

    lines.append("")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    schema = load_schema()
    default_root = _REPO / str(schema.get("storageRoot") or "artifacts/pilot-reuse-cohort")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--trackers-root", type=Path, default=default_root)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, default=None)
    args = parser.parse_args(argv)

    paths = discover_trackers(args.trackers_root)
    trackers = [load_tracker(path) for path in paths]
    payload = aggregate_trackers(trackers)

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    markdown_out = args.markdown_out or args.json_out.with_suffix(".md")
    markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    print(
        f"Wrote pilot reuse cohort rollup ({payload['pilotCount']} pilots) "
        f"to {args.json_out.resolve()}",
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
