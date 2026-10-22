#!/usr/bin/env python3
"""Aggregate decision-change rates across pilot decision ledgers under artifacts/pilot-decision-ledger/."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]
_SCHEMA_PATH = _REPO / "scripts" / "ci" / "data" / "pilot_decision_ledger_schema.v1.json"
_SUMMARY_SCHEMA = "archlucid.pilot-decision-ledger-cohort-summary.v1"
_PAYLOAD_SCHEMA = "archlucid.pilot-decision-ledger.v1"


def load_schema() -> dict[str, object]:
    return json.loads(_SCHEMA_PATH.read_text(encoding="utf-8"))


def load_ledger(path: Path) -> dict[str, object] | None:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None

    if not isinstance(payload, dict):
        return None

    if payload.get("schema") != _PAYLOAD_SCHEMA:
        return None

    return payload


def summarize_ledger(path: Path, payload: dict[str, object]) -> dict[str, object]:
    decisions = payload.get("decisionsUnderReview")

    if isinstance(decisions, list):
        decision_count = len([row for row in decisions if isinstance(row, dict)])
    else:
        decision_count = 0

    changes = payload.get("decisionChanges")

    if isinstance(changes, list):
        attributed = len(
            [
                row
                for row in changes
                if isinstance(row, dict) and row.get("changedBecauseOfArchLucidFinding") is True
            ],
        )
    else:
        attributed = 0

    rate = round(attributed / decision_count, 4) if decision_count else 0.0
    sponsor_raw = payload.get("sponsorAcceptance")
    sponsor_outcome = sponsor_raw.get("outcome") if isinstance(sponsor_raw, dict) else None

    return {
        "ledgerPath": str(path),
        "pilotLabel": payload.get("pilotLabel"),
        "runId": payload.get("runId"),
        "decisionCount": decision_count,
        "attributedChangeCount": attributed,
        "decisionChangeRate": rate,
        "noDecisionChangesConfirmed": payload.get("noDecisionChangesConfirmed") is True,
        "sponsorAcceptanceOutcome": sponsor_outcome,
    }


def build_cohort_summary(rows: list[dict[str, object]]) -> dict[str, object]:
    rates = [float(row["decisionChangeRate"]) for row in rows if row.get("decisionCount", 0)]
    attributed_total = sum(int(row.get("attributedChangeCount") or 0) for row in rows)
    decision_total = sum(int(row.get("decisionCount") or 0) for row in rows)
    cohort_rate = round(attributed_total / decision_total, 4) if decision_total else 0.0

    return {
        "schema": _SUMMARY_SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "ledgerCount": len(rows),
        "cohortDecisionChangeRate": cohort_rate,
        "meanDecisionChangeRate": round(sum(rates) / len(rates), 4) if rates else 0.0,
        "attributedChangeTotal": attributed_total,
        "decisionTotal": decision_total,
        "ledgers": rows,
    }


def render_markdown(summary: dict[str, object]) -> str:
    lines = [
        "# Pilot decision-change cohort summary",
        "",
        f"**Ledgers:** {summary.get('ledgerCount')}",
        f"**Cohort decision-change rate:** {summary.get('cohortDecisionChangeRate')}",
        f"**Mean per-pilot rate:** {summary.get('meanDecisionChangeRate')}",
        "",
        "| Pilot | Run id | Decisions | Attributed changes | Rate | Sponsor outcome |",
        "| --- | --- | ---: | ---: | ---: | --- |",
    ]

    for row in summary.get("ledgers") or []:
        if not isinstance(row, dict):
            continue

        lines.append(
            f"| {row.get('pilotLabel') or '—'} | {row.get('runId') or '—'} | "
            f"{row.get('decisionCount')} | {row.get('attributedChangeCount')} | "
            f"{row.get('decisionChangeRate')} | {row.get('sponsorAcceptanceOutcome') or '—'} |",
        )

    lines.append("")
    return "\n".join(lines)


def discover_ledgers(root: Path) -> list[Path]:
    if not root.is_dir():
        return []

    return sorted(root.glob("**/ledger.json"))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--ledgers-root",
        type=Path,
        default=_REPO / "artifacts/pilot-decision-ledger",
    )
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    args = parser.parse_args(argv)

    _ = load_schema()
    rows: list[dict[str, object]] = []

    for path in discover_ledgers(args.ledgers_root):
        payload = load_ledger(path)

        if payload is None:
            continue

        rows.append(summarize_ledger(path, payload))

    summary = build_cohort_summary(rows)

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(summary), encoding="utf-8")

    print(f"OK: aggregated {summary['ledgerCount']} pilot decision ledger(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
