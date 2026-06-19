#!/usr/bin/env python3
"""Aggregate pilot dismissal-trigger captures into a monthly cohort summary."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]
_SCHEMA_PATH = _REPO / "scripts" / "ci" / "data" / "pilot_dismissal_trigger_schema.v1.json"
_PAYLOAD_SCHEMA = "archlucid.pilot-dismissal-trigger.v1"
_OUTPUT_SCHEMA = "archlucid.pilot-dismissal-trigger-cohort-summary.v1"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_schema() -> dict[str, object]:
    payload = json.loads(_SCHEMA_PATH.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"Expected JSON object in {_SCHEMA_PATH}")

    return payload


def discover_captures(root: Path) -> list[Path]:
    if not root.is_dir():
        return []

    return sorted(root.rglob("dismissal.json"))


def load_capture(path: Path) -> dict[str, object]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"Expected JSON object in {path}")

    if payload.get("schema") != _PAYLOAD_SCHEMA:
        raise ValueError(f"Unsupported schema in {path}")

    return payload


def parse_month(value: object) -> str | None:
    text = str(value or "").strip()

    if len(text) < 7:
        return None

    return text[:7]


def trend_direction(current: int, previous: int) -> str:
    if current > previous:
        return "up"

    if current < previous:
        return "down"

    return "flat"


def aggregate_captures(
    captures: list[dict[str, object]],
    *,
    target_month: str | None,
) -> dict[str, object]:
    if not target_month:
        target_month = datetime.now(timezone.utc).strftime("%Y-%m")

    month_counts: Counter[str] = Counter()
    prior_month = (
        datetime.strptime(f"{target_month}-01", "%Y-%m-%d").replace(tzinfo=timezone.utc)
    )
    if prior_month.month == 1:
        prior_month_label = f"{prior_month.year - 1}-12"
    else:
        prior_month_label = f"{prior_month.year}-{prior_month.month - 1:02d}"

    prior_counts: Counter[str] = Counter()
    session_ids: list[str] = []
    dismissal_observed = 0
    no_dismissal = 0

    for capture in captures:
        session_ids.append(str(capture.get("sessionId") or capture.get("runId") or "unknown"))
        month = parse_month(capture.get("sessionUtc"))

        if capture.get("noDismissalObserved") is True:
            no_dismissal += 1
            continue

        dismissal_observed += 1
        capture_raw = capture.get("dismissalCapture")
        detail = capture_raw if isinstance(capture_raw, dict) else {}
        category = str(detail.get("primaryCategory") or "unknown")

        if month == target_month:
            month_counts[category] += 1
        elif month == prior_month_label:
            prior_counts[category] += 1

    top_current = month_counts.most_common(5)
    trends: list[dict[str, object]] = []

    for category, count in top_current:
        previous = prior_counts.get(category, 0)
        trends.append(
            {
                "primaryCategory": category,
                "currentMonthCount": count,
                "priorMonthCount": previous,
                "trendDirection": trend_direction(count, previous),
            }
        )

    return {
        "schema": _OUTPUT_SCHEMA,
        "generatedUtc": utc_now(),
        "targetMonth": target_month,
        "priorMonth": prior_month_label,
        "sessionCount": len(captures),
        "sessionIds": session_ids,
        "dismissalObservedCount": dismissal_observed,
        "noDismissalObservedCount": no_dismissal,
        "topTriggers": trends,
        "interpretationGuardrails": [
            "Dismissal-trigger prevalence is qualification signal — not proof of product failure by itself.",
            "Compare month-over-month trends only after consistent capture discipline is in place.",
            "Do not publish customer quotes from evidenceSnippet without redaction review.",
        ],
    }


def render_markdown(payload: dict[str, object]) -> str:
    lines = [
        "# Pilot dismissal triggers — monthly aggregate",
        "",
        f"**Generated UTC:** {payload.get('generatedUtc')}",
        f"**Target month:** {payload.get('targetMonth')}",
        f"**Prior month:** {payload.get('priorMonth')}",
        f"**Sessions in corpus:** {payload.get('sessionCount')}",
        f"**Dismissals observed:** {payload.get('dismissalObservedCount')}",
        f"**No dismissal observed:** {payload.get('noDismissalObservedCount')}",
        "",
        "## Top dismissal triggers (target month)",
        "",
        "| Category | Count | Prior month | Trend |",
        "| --- | --- | --- | --- |",
    ]

    for row in payload.get("topTriggers") or []:
        if not isinstance(row, dict):
            continue

        lines.append(
            "| {category} | {count} | {prior} | {trend} |".format(
                category=row.get("primaryCategory"),
                count=row.get("currentMonthCount"),
                prior=row.get("priorMonthCount"),
                trend=row.get("trendDirection"),
            )
        )

    if not payload.get("topTriggers"):
        lines.append("| _none recorded_ | 0 | 0 | flat |")

    lines.extend(["", "## Guardrails", ""])

    for guardrail in payload.get("interpretationGuardrails") or []:
        lines.append(f"- {guardrail}")

    lines.append("")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    schema = load_schema()
    default_root = _REPO / str(schema.get("storageRoot") or "artifacts/pilot-dismissal-triggers")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--captures-root", type=Path, default=default_root)
    parser.add_argument("--month", type=str, default=None, help="Target month in YYYY-MM format.")
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, default=None)
    args = parser.parse_args(argv)

    paths = discover_captures(args.captures_root)
    captures = [load_capture(path) for path in paths]
    payload = aggregate_captures(captures, target_month=args.month)

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    markdown_out = args.markdown_out or args.json_out.with_suffix(".md")
    markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    print(
        f"Wrote pilot dismissal trigger monthly aggregate "
        f"({payload['sessionCount']} sessions, month={payload['targetMonth']})",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
