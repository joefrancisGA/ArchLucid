#!/usr/bin/env python3
"""Validate and summarize the first confirmed non-obvious finding moment for pilot debriefs."""

from __future__ import annotations

import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]
_SCHEMA_PATH = _REPO / "scripts" / "ci" / "data" / "first_non_obvious_moment_schema.v1.json"
_PAYLOAD_SCHEMA = "archlucid.first-non-obvious-moment.v1"
_REPORT_SCHEMA = "archlucid.first-non-obvious-moment-report.v1"


def load_json(path: Path) -> dict[str, object]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"{path} must be a JSON object")

    return payload


def load_schema() -> dict[str, object]:
    return load_json(_SCHEMA_PATH)


def validate_moment(
    payload: dict[str, object],
    schema: dict[str, object],
    *,
    strict_paid_pilot: bool,
) -> tuple[str, list[str], list[str], dict[str, object]]:
    errors: list[str] = []
    warnings: list[str] = []

    if payload.get("schema") != _PAYLOAD_SCHEMA:
        errors.append(f"schema must be {_PAYLOAD_SCHEMA}")

    not_yet_observed = payload.get("notYetObserved") is True
    rationale = str(payload.get("notYetObservedRationale") or "").strip()
    moment_raw = payload.get("firstNonObviousMoment")
    moment: dict[str, object] = moment_raw if isinstance(moment_raw, dict) else {}
    confidence_values = {str(value).lower() for value in schema.get("correctnessConfidenceValues") or []}
    required_fields = [str(field) for field in schema.get("requiredMomentFields") or []]

    if not_yet_observed:
        if not rationale:
            errors.append("notYetObservedRationale is required when notYetObserved is true")

        disposition = "WARN" if not errors else "HOLD"
        metrics = {
            "observed": False,
            "changedPlannedAction": False,
            "correctnessConfidence": None,
            "findingId": None,
            "timestampUtc": None,
            "participantQuoteCaptured": False,
        }
        return disposition, errors, warnings, metrics

    for field in required_fields:
        value = moment.get(field)

        if value is None or (isinstance(value, str) and not str(value).strip()):
            errors.append(f"firstNonObviousMoment.{field} is required when notYetObserved is false")

    confidence = str(moment.get("correctnessConfidence") or "").strip().lower()

    if confidence and confidence not in confidence_values:
        errors.append(
            f"firstNonObviousMoment.correctnessConfidence must be one of {sorted(confidence_values)}",
        )

    quote = str(moment.get("participantQuote") or "").strip()

    if not quote:
        warnings.append("participantQuote is empty — debrief narrative will lack direct participant voice.")

    changed_action = moment.get("changedPlannedAction") is True

    if strict_paid_pilot and confidence == "low":
        warnings.append("correctnessConfidence is low — treat insight-density claims as directional only.")

    metrics = {
        "observed": True,
        "changedPlannedAction": changed_action,
        "correctnessConfidence": confidence or None,
        "findingId": moment.get("findingId"),
        "timestampUtc": moment.get("timestampUtc"),
        "participantQuoteCaptured": bool(quote),
    }

    if errors:
        return "HOLD", errors, warnings, metrics

    if warnings or not changed_action:
        if not changed_action:
            warnings.append("changedPlannedAction is false — moment did not alter planned action.")

        return "WARN", errors, warnings, metrics

    return "PASS", errors, warnings, metrics


def build_report(
    payload: dict[str, object],
    *,
    disposition: str,
    errors: list[str],
    warnings: list[str],
    metrics: dict[str, object],
    strict_paid_pilot: bool,
) -> dict[str, object]:
    moment_raw = payload.get("firstNonObviousMoment")
    moment = moment_raw if isinstance(moment_raw, dict) else {}

    return {
        "schema": _REPORT_SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "strictPaidPilot": strict_paid_pilot,
        "sessionId": payload.get("sessionId"),
        "runId": payload.get("runId"),
        "pilotLabel": payload.get("pilotLabel"),
        "paidPilot": payload.get("paidPilot"),
        "notYetObserved": payload.get("notYetObserved") is True,
        "firstNonObviousMoment": moment,
        "metrics": metrics,
        "validationErrors": errors,
        "validationWarnings": warnings,
        "ownerReviewRequired": disposition != "PASS",
        "ownerReviewNote": (
            "First non-obvious moment is operator-recorded session evidence; "
            "do not treat a single moment as cohort proof of insight density."
        ),
    }


def render_markdown(report: dict[str, object]) -> str:
    moment_raw = report.get("firstNonObviousMoment")
    moment = moment_raw if isinstance(moment_raw, dict) else {}
    metrics = report.get("metrics") or {}
    errors = report.get("validationErrors") or []
    warnings = report.get("validationWarnings") or []

    lines = [
        "# Pilot debrief — first non-obvious moment",
        "",
        f"**Disposition:** **{report.get('disposition')}**",
        "",
        "> Operator-recorded insight-density signal from session debrief — not automated product scoring.",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Session id | {report.get('sessionId') or 'not supplied'} |",
        f"| Run id | {report.get('runId') or 'not supplied'} |",
        f"| Pilot label | {report.get('pilotLabel') or 'not supplied'} |",
        f"| Moment observed | {metrics.get('observed')} |",
        f"| Not yet observed | {report.get('notYetObserved')} |",
        "",
        "## First non-obvious moment",
        "",
    ]

    if report.get("notYetObserved"):
        lines.extend(
            [
                "No confirmed non-obvious moment was recorded for this session.",
                "",
                f"**Rationale:** {report.get('notYetObservedRationale') or 'not recorded'}",
                "",
            ]
        )
    else:
        lines.extend(
            [
                f"- **Timestamp (UTC):** {moment.get('timestampUtc') or 'not recorded'}",
                f"- **Finding id:** {moment.get('findingId') or 'not recorded'}",
                f"- **Correctness confidence:** {moment.get('correctnessConfidence') or 'not recorded'}",
                f"- **Changed planned action:** {moment.get('changedPlannedAction')}",
                "",
                "**Participant quote (redacted):**",
                "",
                f"> {moment.get('participantQuote') or '_not recorded_'}",
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
    parser.add_argument("--moment-json", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, default=None)
    parser.add_argument("--copy-canonical-to", type=Path, default=None)
    parser.add_argument(
        "--strict-paid-pilot",
        action="store_true",
        help="Treat missing moment capture as HOLD for paid pilot debrief.",
    )
    args = parser.parse_args(argv)

    schema = load_schema()
    payload = load_json(args.moment_json)
    disposition, errors, warnings, metrics = validate_moment(
        payload,
        schema,
        strict_paid_pilot=args.strict_paid_pilot,
    )
    report = build_report(
        payload,
        disposition=disposition,
        errors=errors,
        warnings=warnings,
        metrics=metrics,
        strict_paid_pilot=args.strict_paid_pilot,
    )

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    markdown_out = args.markdown_out or args.json_out.with_suffix(".md")
    markdown_out.write_text(render_markdown(report), encoding="utf-8")

    if args.copy_canonical_to is not None:
        args.copy_canonical_to.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(args.moment_json, args.copy_canonical_to)

    print(
        f"Wrote first non-obvious moment report (disposition={disposition}) "
        f"to {args.json_out.resolve()}",
    )

    if disposition == "HOLD" and args.strict_paid_pilot:
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
