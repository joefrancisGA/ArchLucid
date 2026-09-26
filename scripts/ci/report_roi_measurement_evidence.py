#!/usr/bin/env python3
"""Compare recorded pilot baselines with measured outcomes without inventing ROI."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def _positive(value: object) -> float | None:
    if isinstance(value, bool):
        return None
    try:
        number = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    return number if number > 0 and number < float("inf") else None


def _load(path: Path | None) -> dict:
    if path is None or not path.is_file():
        return {}
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError(f"{path} must contain an object")
    return payload


def evaluate(baseline: dict, outcome: dict, *, run_id: str | None = None) -> dict:
    if outcome and outcome.get("schema") != "archlucid.roi-measured-outcomes.v1":
        raise ValueError("outcome schema must be archlucid.roi-measured-outcomes.v1")
    if run_id and outcome and outcome.get("runId") != run_id:
        raise ValueError("outcome runId does not match proof run")
    if run_id and baseline.get("runId") and baseline["runId"] != run_id:
        raise ValueError("baseline runId does not match proof run")
    source = str(baseline.get("baselineReviewCycleSource") or "").strip()
    measured_source = str(outcome.get("sourceArtifact") or "").strip()
    rows = []
    for label, baseline_field, measured_field in (
        ("Review cycle hours", "baselineReviewCycleHours", "reviewCycleHours"),
        ("Architect hours per review", "architectPrepHoursPerReview", "architectHoursPerReview"),
        ("Evidence assembly hours", "evidenceAssemblyEffortHours", "evidenceAssemblyHours"),
    ):
        before, after = _positive(baseline.get(baseline_field)), _positive(outcome.get(measured_field))
        valid_source = bool(source and measured_source and outcome.get("measurementKind") == "observed")
        status = "MEASURED" if before is not None and after is not None and valid_source else "INSUFFICIENT_DATA"
        rows.append({"metric": label, "baselineHours": before, "observedHours": after,
                     "baselineSource": source or None, "outcomeSource": measured_source or None,
                     "hoursSaved": round(before - after, 3) if status == "MEASURED" else None,
                     "status": status})
    return {"schema": "archlucid.roi-measurement-evidence.v1", "runId": run_id,
            "status": "MEASURED" if all(row["status"] == "MEASURED" for row in rows[:2]) else "INSUFFICIENT_DATA",
            "rows": rows, "projectedDollarValue": None,
            "note": "Observed time differences only; no causal attribution or projected dollar ROI."}


def markdown(report: dict) -> str:
    lines = ["# Pilot ROI measurement evidence", "", f"**Status:** {report['status']}", "",
             "| Metric | Baseline hours | Observed hours | Hours difference | Baseline source | Outcome source | Status |",
             "| --- | ---: | ---: | ---: | --- | --- | --- |"]
    for row in report["rows"]:
        value = lambda x: "—" if x is None else str(x)
        lines.append(f"| {row['metric']} | {value(row['baselineHours'])} | {value(row['observedHours'])} | "
                     f"{value(row['hoursSaved'])} | {value(row['baselineSource'])} | "
                     f"{value(row['outcomeSource'])} | {row['status']} |")
    return "\n".join(lines + ["", report["note"], ""])


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline-json", type=Path)
    parser.add_argument("--outcomes-json", type=Path)
    parser.add_argument("--run-id")
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    args = parser.parse_args()
    report = evaluate(_load(args.baseline_json), _load(args.outcomes_json), run_id=args.run_id)
    for path, body in ((args.json_out, json.dumps(report, indent=2) + "\n"),
                       (args.markdown_out, markdown(report))):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(body, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
