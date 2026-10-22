#!/usr/bin/env python3
"""Validate and summarize pilot dismissal-trigger capture for debrief artifacts."""

from __future__ import annotations

import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]
_SCHEMA_PATH = _REPO / "scripts" / "ci" / "data" / "pilot_dismissal_trigger_schema.v1.json"
_PAYLOAD_SCHEMA = "archlucid.pilot-dismissal-trigger.v1"
_REPORT_SCHEMA = "archlucid.pilot-dismissal-trigger-report.v1"


def load_json(path: Path) -> dict[str, object]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"{path} must be a JSON object")

    return payload


def load_schema() -> dict[str, object]:
    return load_json(_SCHEMA_PATH)


def validate_capture(
    payload: dict[str, object],
    schema: dict[str, object],
) -> tuple[str, list[str], list[str], dict[str, object]]:
    errors: list[str] = []
    warnings: list[str] = []

    if payload.get("schema") != _PAYLOAD_SCHEMA:
        errors.append(f"schema must be {_PAYLOAD_SCHEMA}")

    categories = {str(value) for value in schema.get("primaryCategories") or []}
    timing_values = {str(value) for value in schema.get("triggerTimingValues") or []}
    outcome_values = {str(value) for value in schema.get("finalOutcomeValues") or []}
    required_fields = [str(field) for field in schema.get("requiredCaptureFields") or []]

    no_dismissal = payload.get("noDismissalObserved") is True
    capture_raw = payload.get("dismissalCapture")
    capture: dict[str, object] = capture_raw if isinstance(capture_raw, dict) else {}

    if no_dismissal:
        metrics = {
            "dismissalObserved": False,
            "primaryCategory": None,
            "triggerTiming": None,
            "finalOutcome": None,
        }
        disposition = "PASS" if not errors else "HOLD"
        return disposition, errors, warnings, metrics

    for field in required_fields:
        value = capture.get(field)

        if value is None or (isinstance(value, str) and not str(value).strip()):
            errors.append(f"dismissalCapture.{field} is required when noDismissalObserved is false")

    category = str(capture.get("primaryCategory") or "").strip()

    if category and category not in categories:
        errors.append(f"dismissalCapture.primaryCategory must be one of {sorted(categories)}")

    timing = str(capture.get("triggerTiming") or "").strip()

    if timing and timing not in timing_values:
        errors.append(f"dismissalCapture.triggerTiming must be one of {sorted(timing_values)}")

    outcome = str(capture.get("finalOutcome") or "").strip()

    if outcome and outcome not in outcome_values:
        errors.append(f"dismissalCapture.finalOutcome must be one of {sorted(outcome_values)}")

    mitigation = str(capture.get("mitigationAttempted") or "").strip()

    if not mitigation:
        warnings.append("mitigationAttempted is empty — debrief will lack remediation context.")

    metrics = {
        "dismissalObserved": True,
        "primaryCategory": category or None,
        "triggerTiming": timing or None,
        "finalOutcome": outcome or None,
    }

    if errors:
        return "HOLD", errors, warnings, metrics

    if warnings:
        return "WARN", errors, warnings, metrics

    return "PASS", errors, warnings, metrics


def build_report(
    payload: dict[str, object],
    *,
    disposition: str,
    errors: list[str],
    warnings: list[str],
    metrics: dict[str, object],
) -> dict[str, object]:
    capture_raw = payload.get("dismissalCapture")
    capture = capture_raw if isinstance(capture_raw, dict) else {}

    return {
        "schema": _REPORT_SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "sessionId": payload.get("sessionId"),
        "runId": payload.get("runId"),
        "pilotLabel": payload.get("pilotLabel"),
        "paidPilot": payload.get("paidPilot"),
        "noDismissalObserved": payload.get("noDismissalObserved") is True,
        "dismissalCapture": capture,
        "metrics": metrics,
        "validationErrors": errors,
        "validationWarnings": warnings,
        "ownerReviewRequired": disposition != "PASS",
        "ownerReviewNote": (
            "Dismissal triggers are operator-recorded qualification signals; "
            "aggregate monthly before changing GTM narrative."
        ),
    }


def render_markdown(report: dict[str, object]) -> str:
    capture_raw = report.get("dismissalCapture")
    capture = capture_raw if isinstance(capture_raw, dict) else {}
    metrics = report.get("metrics") or {}
    errors = report.get("validationErrors") or []
    warnings = report.get("validationWarnings") or []

    lines = [
        "# Pilot debrief — dismissal trigger capture",
        "",
        f"**Disposition:** **{report.get('disposition')}**",
        "",
        "> Operator-recorded non-adoption / near-dismissal signal — not automated churn scoring.",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Session id | {report.get('sessionId') or 'not supplied'} |",
        f"| Run id | {report.get('runId') or 'not supplied'} |",
        f"| Pilot label | {report.get('pilotLabel') or 'not supplied'} |",
        f"| Dismissal observed | {metrics.get('dismissalObserved')} |",
        f"| No dismissal observed | {report.get('noDismissalObserved')} |",
        "",
        "## Dismissal trigger",
        "",
    ]

    if report.get("noDismissalObserved"):
        lines.append("No dismissal or near-dismissal trigger was recorded for this session.")
        lines.append("")
    else:
        lines.extend(
            [
                f"- **Primary category:** {capture.get('primaryCategory') or 'not recorded'}",
                f"- **Trigger timing:** {capture.get('triggerTiming') or 'not recorded'}",
                f"- **Final outcome:** {capture.get('finalOutcome') or 'not recorded'}",
                f"- **Mitigation attempted:** {capture.get('mitigationAttempted') or 'not recorded'}",
                "",
                "**Evidence snippet (redacted):**",
                "",
                f"> {capture.get('evidenceSnippet') or '_not recorded_'}",
                "",
            ]
        )

    if warnings:
        lines.extend(["## Warnings", ""])

        for warning in warnings:
            lines.append(f"- {warning}")

        lines.append("")

    if errors:
        lines.extend(["## Validation errors", ""])

        for error in errors:
            lines.append(f"- {error}")

        lines.append("")

    lines.extend(
        [
            "## Operator note",
            "",
            str(report.get("ownerReviewNote") or ""),
            "",
        ]
    )

    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--capture-json", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, default=None)
    parser.add_argument("--copy-canonical-to", type=Path, default=None)
    args = parser.parse_args(argv)

    schema = load_schema()
    payload = load_json(args.capture_json)
    disposition, errors, warnings, metrics = validate_capture(payload, schema)
    report = build_report(
        payload,
        disposition=disposition,
        errors=errors,
        warnings=warnings,
        metrics=metrics,
    )

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    markdown_out = args.markdown_out or args.json_out.with_suffix(".md")
    markdown_out.write_text(render_markdown(report), encoding="utf-8")

    if args.copy_canonical_to is not None:
        args.copy_canonical_to.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(args.capture_json, args.copy_canonical_to)

    print(
        f"Wrote pilot dismissal trigger report (disposition={disposition}) "
        f"to {args.json_out.resolve()}",
    )

    return 1 if disposition == "HOLD" else 0


if __name__ == "__main__":
    raise SystemExit(main())
