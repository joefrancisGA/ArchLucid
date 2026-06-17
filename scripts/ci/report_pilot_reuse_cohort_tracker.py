#!/usr/bin/env python3
"""Validate pilot 30-day reuse cohort tracker capture for follow-up artifacts."""

from __future__ import annotations

import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]
_SCHEMA_PATH = _REPO / "scripts" / "ci" / "data" / "pilot_reuse_cohort_tracker_schema.v1.json"
_PAYLOAD_SCHEMA = "archlucid.pilot-reuse-cohort-tracker.v1"
_REPORT_SCHEMA = "archlucid.pilot-reuse-cohort-tracker-report.v1"


def load_json(path: Path) -> dict[str, object]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"{path} must be a JSON object")

    return payload


def load_schema() -> dict[str, object]:
    return load_json(_SCHEMA_PATH)


def checkpoint_detail(
    payload: dict[str, object],
    key: str,
) -> dict[str, object]:
    follow_up_raw = payload.get("followUp")
    follow_up = follow_up_raw if isinstance(follow_up_raw, dict) else {}
    checkpoint_raw = follow_up.get(key)
    checkpoint = checkpoint_raw if isinstance(checkpoint_raw, dict) else {}

    return checkpoint


def validate_checkpoint(
    checkpoint: dict[str, object],
    *,
    key: str,
    usage_states: set[str],
    assistance_modes: set[str],
    required_fields: list[str],
    tracking_complete: bool,
) -> tuple[list[str], list[str], dict[str, object]]:
    errors: list[str] = []
    warnings: list[str] = []

    usage_state = str(checkpoint.get("usageState") or "").strip()
    assistance_mode = str(checkpoint.get("assistanceMode") or "").strip()
    reason = str(checkpoint.get("continuationOrDropoffReason") or "").strip()
    return_count_raw = checkpoint.get("voluntaryReturnCount")

    if not usage_state:
        errors.append(f"followUp.{key}.usageState is required")
    elif usage_state not in usage_states:
        errors.append(f"followUp.{key}.usageState must be one of {sorted(usage_states)}")

    if usage_state == "not-yet-due":
        metrics = {
            "usageState": usage_state,
            "voluntaryReturnCount": return_count_raw,
            "assistanceMode": assistance_mode or None,
            "recorded": False,
        }

        if tracking_complete:
            errors.append(f"followUp.{key} cannot be not-yet-due when trackingComplete is true")

        return errors, warnings, metrics

    if not isinstance(return_count_raw, int) or return_count_raw < 0:
        errors.append(f"followUp.{key}.voluntaryReturnCount must be a non-negative integer")

    for field in required_fields:
        if field in ("usageState", "voluntaryReturnCount"):
            continue

        value = checkpoint.get(field)

        if value is None or (isinstance(value, str) and not str(value).strip()):
            errors.append(f"followUp.{key}.{field} is required when usageState is not not-yet-due")

    if assistance_mode and assistance_mode not in assistance_modes:
        errors.append(f"followUp.{key}.assistanceMode must be one of {sorted(assistance_modes)}")

    if usage_state in {"continuing-voluntarily", "returned-voluntarily"} and assistance_mode == "not-applicable":
        warnings.append(f"{key}: assistanceMode is not-applicable despite active voluntary usage.")

    if usage_state in {"dropped", "inactive-no-return"} and not reason:
        warnings.append(f"{key}: continuationOrDropoffReason should explain dropoff/inactivity.")

    metrics = {
        "usageState": usage_state or None,
        "voluntaryReturnCount": return_count_raw if isinstance(return_count_raw, int) else None,
        "assistanceMode": assistance_mode or None,
        "recorded": True,
    }

    return errors, warnings, metrics


def validate_tracker(
    payload: dict[str, object],
    schema: dict[str, object],
) -> tuple[str, list[str], list[str], dict[str, object]]:
    errors: list[str] = []
    warnings: list[str] = []

    if payload.get("schema") != _PAYLOAD_SCHEMA:
        errors.append(f"schema must be {_PAYLOAD_SCHEMA}")

    usage_states = {str(value) for value in schema.get("usageStateValues") or []}
    assistance_modes = {str(value) for value in schema.get("assistanceModeValues") or []}
    checkpoint_keys = [str(value) for value in schema.get("checkpointKeys") or []]
    required_fields = [str(field) for field in schema.get("requiredCheckpointFields") or []]
    tracking_complete = payload.get("trackingComplete") is True

    checkpoint_metrics: dict[str, object] = {}
    recorded_count = 0

    for key in checkpoint_keys:
        checkpoint = checkpoint_detail(payload, key)
        checkpoint_errors, checkpoint_warnings, metrics = validate_checkpoint(
            checkpoint,
            key=key,
            usage_states=usage_states,
            assistance_modes=assistance_modes,
            required_fields=required_fields,
            tracking_complete=tracking_complete,
        )
        errors.extend(checkpoint_errors)
        warnings.extend(checkpoint_warnings)
        checkpoint_metrics[key] = metrics

        if metrics.get("recorded") is True:
            recorded_count += 1

    day30_raw = checkpoint_metrics.get("day30")
    day30 = day30_raw if isinstance(day30_raw, dict) else {}
    day30_state = str(day30.get("usageState") or "")

    summary_metrics: dict[str, object] = {
        "trackingComplete": tracking_complete,
        "recordedCheckpointCount": recorded_count,
        "day30UsageState": day30_state or None,
        "day30VoluntaryReturnCount": day30.get("voluntaryReturnCount"),
        "day30AssistanceMode": day30.get("assistanceMode"),
        "checkpoints": checkpoint_metrics,
    }

    if errors:
        return "HOLD", errors, warnings, summary_metrics

    if tracking_complete and recorded_count < len(checkpoint_keys):
        warnings.append("trackingComplete is true but not all checkpoints are recorded.")

    if not tracking_complete and recorded_count == 0:
        warnings.append("No follow-up checkpoints recorded yet — expected early in pilot lifecycle.")

    if warnings:
        return "WARN", errors, warnings, summary_metrics

    return "PASS", errors, warnings, summary_metrics


def build_report(
    payload: dict[str, object],
    *,
    disposition: str,
    errors: list[str],
    warnings: list[str],
    metrics: dict[str, object],
) -> dict[str, object]:
    return {
        "schema": _REPORT_SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "sessionId": payload.get("sessionId"),
        "runId": payload.get("runId"),
        "pilotLabel": payload.get("pilotLabel"),
        "pilotStartUtc": payload.get("pilotStartUtc"),
        "paidPilot": payload.get("paidPilot"),
        "trackingComplete": payload.get("trackingComplete") is True,
        "followUp": payload.get("followUp"),
        "metrics": metrics,
        "validationErrors": errors,
        "validationWarnings": warnings,
        "ownerReviewRequired": disposition != "PASS",
        "ownerReviewNote": (
            "Reuse cohort checkpoints are operator-recorded voluntary-usage signals; "
            "aggregate across pilots before changing retention narrative."
        ),
    }


def render_markdown(report: dict[str, object]) -> str:
    metrics = report.get("metrics") or {}
    checkpoints = metrics.get("checkpoints") or {}
    errors = report.get("validationErrors") or []
    warnings = report.get("validationWarnings") or []

    lines = [
        "# Pilot follow-up — 30-day reuse cohort tracker",
        "",
        f"**Disposition:** **{report.get('disposition')}**",
        "",
        "> Operator-recorded day-7 / day-14 / day-30 voluntary usage checkpoints — not automated product telemetry.",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Session id | {report.get('sessionId') or 'not supplied'} |",
        f"| Run id | {report.get('runId') or 'not supplied'} |",
        f"| Pilot label | {report.get('pilotLabel') or 'not supplied'} |",
        f"| Pilot start UTC | {report.get('pilotStartUtc') or 'not supplied'} |",
        f"| Tracking complete | {report.get('trackingComplete')} |",
        f"| Recorded checkpoints | {metrics.get('recordedCheckpointCount')} |",
        "",
        "## Follow-up checkpoints",
        "",
        "| Checkpoint | Usage state | Voluntary returns | Assistance mode | Reason |",
        "| --- | --- | --- | --- | --- |",
    ]

    for key in ("day7", "day14", "day30"):
        checkpoint_raw = checkpoints.get(key)
        checkpoint = checkpoint_raw if isinstance(checkpoint_raw, dict) else {}
        follow_up_raw = report.get("followUp")
        follow_up = follow_up_raw if isinstance(follow_up_raw, dict) else {}
        detail_raw = follow_up.get(key)
        detail = detail_raw if isinstance(detail_raw, dict) else {}
        reason = str(detail.get("continuationOrDropoffReason") or "").strip() or "_not recorded_"

        lines.append(
            "| {checkpoint} | {state} | {returns} | {assistance} | {reason} |".format(
                checkpoint=key,
                state=checkpoint.get("usageState") or "not recorded",
                returns=checkpoint.get("voluntaryReturnCount"),
                assistance=checkpoint.get("assistanceMode") or "not recorded",
                reason=reason.replace("|", "/"),
            )
        )

    lines.append("")

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
    parser.add_argument("--tracker-json", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, default=None)
    parser.add_argument("--copy-canonical-to", type=Path, default=None)
    args = parser.parse_args(argv)

    schema = load_schema()
    payload = load_json(args.tracker_json)
    disposition, errors, warnings, metrics = validate_tracker(payload, schema)
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
        shutil.copy2(args.tracker_json, args.copy_canonical_to)

    print(
        f"Wrote pilot reuse cohort tracker report (disposition={disposition}) "
        f"to {args.json_out.resolve()}",
    )

    return 1 if disposition == "HOLD" else 0


if __name__ == "__main__":
    raise SystemExit(main())
