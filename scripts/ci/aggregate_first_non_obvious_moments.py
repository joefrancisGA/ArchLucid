#!/usr/bin/env python3
"""Aggregate first non-obvious moment captures across pilot sessions."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]
_SCHEMA_PATH = _REPO / "scripts" / "ci" / "data" / "first_non_obvious_moment_schema.v1.json"
_PAYLOAD_SCHEMA = "archlucid.first-non-obvious-moment.v1"
_OUTPUT_SCHEMA = "archlucid.first-non-obvious-moment-cohort-summary.v1"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_schema() -> dict[str, object]:
    payload = json.loads(_SCHEMA_PATH.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"Expected JSON object in {_SCHEMA_PATH}")

    return payload


def discover_moments(root: Path) -> list[Path]:
    if not root.is_dir():
        return []

    return sorted(root.rglob("moment.json"))


def load_moment(path: Path) -> dict[str, object]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"Expected JSON object in {path}")

    if payload.get("schema") != _PAYLOAD_SCHEMA:
        raise ValueError(f"Unsupported schema in {path}")

    return payload


def aggregate(moments: list[dict[str, object]]) -> dict[str, object]:
    observed = 0
    changed_action = 0
    not_yet_observed = 0
    session_ids: list[str] = []

    for moment in moments:
        session_ids.append(str(moment.get("sessionId") or moment.get("runId") or "unknown"))

        if moment.get("notYetObserved") is True:
            not_yet_observed += 1
            continue

        observed += 1
        detail = moment.get("firstNonObviousMoment")

        if isinstance(detail, dict) and detail.get("changedPlannedAction") is True:
            changed_action += 1

    total = len(moments)
    observation_rate = round(observed / total, 3) if total else None
    action_change_rate = round(changed_action / total, 3) if total else None

    return {
        "schema": _OUTPUT_SCHEMA,
        "generatedUtc": utc_now(),
        "sessionCount": total,
        "sessionIds": session_ids,
        "observedCount": observed,
        "notYetObservedCount": not_yet_observed,
        "changedPlannedActionCount": changed_action,
        "observationRate": observation_rate,
        "changedPlannedActionRate": action_change_rate,
        "interpretationGuardrails": [
            "Single-session non-obvious moments are directional — require multiple sessions before messaging updates.",
            "Participant quotes must stay redacted; do not publish customer-identifying content from artifacts.",
            "A not-yet-observed session is insight-density signal, not a product failure by itself.",
        ],
    }


def render_markdown(payload: dict[str, object]) -> str:
    lines = [
        "# First non-obvious moment — cohort summary",
        "",
        f"**Generated UTC:** {payload.get('generatedUtc')}",
        f"**Sessions:** {payload.get('sessionCount')}",
        f"**Moments observed:** {payload.get('observedCount')}",
        f"**Not yet observed:** {payload.get('notYetObservedCount')}",
        f"**Changed planned action:** {payload.get('changedPlannedActionCount')}",
        f"**Observation rate:** {payload.get('observationRate')}",
        f"**Action-change rate:** {payload.get('changedPlannedActionRate')}",
        "",
        "## Guardrails",
        "",
    ]

    for guardrail in payload.get("interpretationGuardrails") or []:
        lines.append(f"- {guardrail}")

    lines.append("")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    schema = load_schema()
    default_root = _REPO / str(schema.get("storageRoot") or "artifacts/first-non-obvious-moment")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--moments-root", type=Path, default=default_root)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, default=None)
    args = parser.parse_args(argv)

    paths = discover_moments(args.moments_root)
    moments = [load_moment(path) for path in paths]
    payload = aggregate(moments)

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    markdown_out = args.markdown_out or args.json_out.with_suffix(".md")
    markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    print(f"Wrote first non-obvious moment cohort summary ({payload['sessionCount']} sessions)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
