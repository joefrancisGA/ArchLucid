#!/usr/bin/env python3
"""Aggregate multiple blind-insight session summaries into a cohort report."""

from __future__ import annotations

import argparse
import json
import statistics
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.blind-insight-cohort-summary.v1"
_MIN_SESSIONS_FOR_MESSAGING = 3


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_summary(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"Expected JSON object in {path}")

    schema = str(payload.get("schema") or "")

    if schema != "archlucid.blind-insight-validation-summary.v1":
        raise ValueError(f"Unsupported session summary schema in {path}: {schema or '(missing)'}")

    return payload


def _discover_session_summaries(sessions_dir: Path) -> list[Path]:
    if not sessions_dir.is_dir():
        raise FileNotFoundError(f"Sessions directory not found: {sessions_dir}")

    direct = sorted(sessions_dir.glob("*/session-summary.json"))

    if direct:
        return direct

    nested = sorted(sessions_dir.rglob("session-summary.json"))

    if not nested:
        raise FileNotFoundError(f"No session-summary.json files under {sessions_dir}")

    return nested


def _aggregate_sessions(summaries: list[dict[str, Any]]) -> dict[str, Any]:
    per_source: dict[str, dict[str, Any]] = {}
    session_ids: list[str] = []

    for summary in summaries:
        session_id = str(summary.get("sessionId") or "unknown")
        session_ids.append(session_id)

        for arm in summary.get("armSummaries") or []:
            if not isinstance(arm, dict):
                continue

            source_key = str(arm.get("sourceKey") or arm.get("armCode") or "unknown")
            bucket = per_source.setdefault(
                source_key,
                {
                    "sourceKey": source_key,
                    "sessionCount": 0,
                    "nonObviousShares": [],
                    "surpriseFactors": [],
                    "decisionImpacts": [],
                    "classificationTotals": {"O": 0, "U": 0, "N": 0, "X": 0, "S": 0},
                },
            )
            bucket["sessionCount"] += 1

            if arm.get("nonObviousShare") is not None:
                bucket["nonObviousShares"].append(float(arm["nonObviousShare"]))

            means = arm.get("means") or {}

            if means.get("surpriseFactor") is not None:
                bucket["surpriseFactors"].append(float(means["surpriseFactor"]))

            if means.get("decisionImpact") is not None:
                bucket["decisionImpacts"].append(float(means["decisionImpact"]))

            counts = arm.get("classificationCounts") or {}

            for code in bucket["classificationTotals"]:
                bucket["classificationTotals"][code] += int(counts.get(code) or 0)

    cohort_arms: list[dict[str, Any]] = []

    for source_key in sorted(per_source):
        bucket = per_source[source_key]
        n_shares = bucket["nonObviousShares"]
        surprise = bucket["surpriseFactors"]
        impact = bucket["decisionImpacts"]
        cohort_arms.append(
            {
                "sourceKey": source_key,
                "sessionCount": bucket["sessionCount"],
                "meanNonObviousShare": round(statistics.mean(n_shares), 3) if n_shares else None,
                "medianSurpriseFactor": round(statistics.median(surprise), 2) if surprise else None,
                "medianDecisionImpact": round(statistics.median(impact), 2) if impact else None,
                "classificationTotals": bucket["classificationTotals"],
            }
        )

    sample_size = len(summaries)
    messaging_ready = sample_size >= _MIN_SESSIONS_FOR_MESSAGING

    guardrails = [
        f"Sample size: {sample_size} session(s) — require ≥{_MIN_SESSIONS_FOR_MESSAGING} before claim-readiness messaging updates.",
        "Demo-derived fixtures illustrate protocol shape only — not customer proof.",
        "Any critical X finding in a session elevates engineering priority over GTM expansion.",
    ]

    if not messaging_ready:
        guardrails.append("Hold differentiated-value narrative changes until cohort threshold is met.")

    return {
        "schema": _SCHEMA,
        "generatedUtc": _utc_now(),
        "sessionCount": sample_size,
        "sessionIds": session_ids,
        "messagingReady": messaging_ready,
        "minSessionsForMessaging": _MIN_SESSIONS_FOR_MESSAGING,
        "cohortArms": cohort_arms,
        "interpretationGuardrails": guardrails,
        "claimReadinessPath": [
            "Score sessions with scripts/assemble_blind_validation_packet.py summarize",
            "Aggregate with scripts/ci/aggregate_blind_insight_sessions.py",
            "Update docs/go-to-market/CLAIM_READINESS_STATUS.md only when messagingReady=true and engineering signoff recorded",
        ],
    }


def render_markdown(payload: dict[str, Any]) -> str:
    lines = [
        "# Blind insight validation — cohort aggregate",
        "",
        f"**Sessions aggregated:** {payload.get('sessionCount')}",
        f"**Messaging ready (≥{payload.get('minSessionsForMessaging')} sessions):** {payload.get('messagingReady')}",
        f"**Generated UTC:** {payload.get('generatedUtc')}",
        "",
        "## Per-source aggregates",
        "",
        "| Source | Sessions | Mean N-share | Median surprise | Median decision impact |",
        "| --- | --- | --- | --- | --- |",
    ]

    for arm in payload.get("cohortArms") or []:
        if not isinstance(arm, dict):
            continue

        lines.append(
            "| {source} | {count} | {nshare} | {surprise} | {impact} |".format(
                source=arm.get("sourceKey"),
                count=arm.get("sessionCount"),
                nshare=arm.get("meanNonObviousShare"),
                surprise=arm.get("medianSurpriseFactor"),
                impact=arm.get("medianDecisionImpact"),
            )
        )

    lines.extend(["", "## Guardrails", ""])

    for guardrail in payload.get("interpretationGuardrails") or []:
        lines.append(f"- {guardrail}")

    lines.append("")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--sessions-dir",
        type=Path,
        required=True,
        help="Directory containing per-session folders with session-summary.json files.",
    )
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, default=None)
    args = parser.parse_args(argv)

    summary_paths = _discover_session_summaries(args.sessions_dir)
    summaries = [_load_summary(path) for path in summary_paths]
    payload = _aggregate_sessions(summaries)

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    if args.markdown_out is not None:
        args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    print(f"Wrote blind insight cohort aggregate ({payload['sessionCount']} sessions) to {args.json_out.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
