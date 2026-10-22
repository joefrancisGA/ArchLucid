#!/usr/bin/env python3
"""Validate paid-pilot ROI baseline capture readiness before kickoff or sponsor handoff."""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]
_SCHEMA_PATH = _REPO / "scripts" / "ci" / "data" / "paid_pilot_baseline_schema.v1.json"
_PAYLOAD_SCHEMA = "archlucid.paid-pilot-baseline.v1"
_REPORT_SCHEMA = "archlucid.paid-pilot-baseline-readiness-report.v1"


def load_json(path: Path) -> dict[str, object]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"{path} must be a JSON object")

    return payload


def load_schema() -> dict[str, object]:
    return load_json(_SCHEMA_PATH)


def _normalize_source(value: object) -> str:
    return str(value or "").strip().lower()


def _positive_number(value: object) -> float | None:
    try:
        number = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None

    if number <= 0:
        return None

    return number


def validate_baseline(
    payload: dict[str, object],
    schema: dict[str, object],
    *,
    strict_paid_pilot: bool,
) -> tuple[str, list[str], list[str], dict[str, object]]:
    errors: list[str] = []
    warnings: list[str] = []

    if payload.get("schema") != _PAYLOAD_SCHEMA:
        errors.append(f"schema must be {_PAYLOAD_SCHEMA}")

    for field in schema.get("requiredFields") or []:
        value = payload.get(str(field))

        if value is None or (isinstance(value, str) and not value.strip()):
            errors.append(f"{field} is required")

    waiver_raw = payload.get("waiver")
    waiver: dict[str, object] = waiver_raw if isinstance(waiver_raw, dict) else {}
    waived = waiver.get("waived") is True
    waiver_rationale = str(waiver.get("rationale") or "").strip()

    if waived and not waiver_rationale:
        errors.append("waiver.rationale is required when waiver.waived is true")

    hours = _positive_number(payload.get("baselineReviewCycleHours"))
    source = _normalize_source(payload.get("baselineReviewCycleSource"))
    strong_sources = {_normalize_source(value) for value in schema.get("strongSourceValues") or []}
    partial_sources = {_normalize_source(value) for value in schema.get("partialSourceValues") or []}
    blocked_sources = {_normalize_source(value) for value in schema.get("blockedSourceValues") or []}
    allowed_sources = {_normalize_source(value) for value in schema.get("baselineReviewCycleSourceValues") or []}

    if source and source not in allowed_sources:
        errors.append(
            f"baselineReviewCycleSource must be one of {sorted(value for value in allowed_sources if value)}",
        )

    projected_dollar_ready = False

    if hours is not None and source in strong_sources:
        projected_dollar_ready = _positive_number(payload.get("architectHourlyCost")) is not None

    metrics: dict[str, object] = {
        "baselineReviewCycleHours": hours,
        "baselineReviewCycleSource": source or None,
        "waiverApplied": waived,
        "projectedDollarClaimsSponsorSafe": projected_dollar_ready,
        "optionalFieldsCaptured": {
            "architectPrepHoursPerReview": _positive_number(payload.get("architectPrepHoursPerReview")) is not None,
            "evidenceAssemblyEffortHours": _positive_number(payload.get("evidenceAssemblyEffortHours")) is not None,
            "architectHourlyCost": _positive_number(payload.get("architectHourlyCost")) is not None,
        },
    }

    if waived:
        warnings.append("Baseline capture waived — sponsor materials must stay qualitative until baselines are recorded.")
        disposition = "WARN"
        return disposition, errors, warnings, metrics

    if hours is None:
        detail = "baselineReviewCycleHours is missing or not a positive number"

        if strict_paid_pilot:
            errors.append(detail)
        else:
            warnings.append(detail)

    if not source:
        detail = "baselineReviewCycleSource is required when baseline is not waived"

        if strict_paid_pilot:
            errors.append(detail)
        else:
            warnings.append(detail)

    if source in blocked_sources:
        detail = f"baselineReviewCycleSource '{source}' is not kickoff-ready without waiver"

        if strict_paid_pilot:
            errors.append(detail)
        else:
            warnings.append(detail)

    if source in partial_sources and hours is not None:
        warnings.append(
            f"baselineReviewCycleSource '{source}' supports directional ROI only — label as low-confidence estimate.",
        )

    if errors:
        return "HOLD", errors, warnings, metrics

    if warnings or source in partial_sources:
        return "WARN", errors, warnings, metrics

    if hours is not None and source in strong_sources:
        return "PASS", errors, warnings, metrics

    return "HOLD", errors + ["Baseline posture is incomplete for paid pilot kickoff."], warnings, metrics


def build_report(
    payload: dict[str, object],
    *,
    disposition: str,
    errors: list[str],
    warnings: list[str],
    metrics: dict[str, object],
    strict_paid_pilot: bool,
) -> dict[str, object]:
    return {
        "schema": _REPORT_SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "strictPaidPilot": strict_paid_pilot,
        "pilotLabel": payload.get("pilotLabel"),
        "tenantId": payload.get("tenantId"),
        "runId": payload.get("runId"),
        "paidPilot": payload.get("paidPilot"),
        "metrics": metrics,
        "validationErrors": errors,
        "validationWarnings": warnings,
        "ownerReviewRequired": disposition != "PASS",
        "ownerReviewNote": (
            "Baseline capture is operator-recorded buyer evidence; "
            "do not quote projected dollar savings when disposition is HOLD or waiver applies."
        ),
    }


def render_markdown(report: dict[str, object]) -> str:
    metrics = report.get("metrics") or {}
    optional = metrics.get("optionalFieldsCaptured") or {}
    errors = report.get("validationErrors") or []
    warnings = report.get("validationWarnings") or []

    lines = [
        "# Paid-pilot baseline readiness (generated)",
        "",
        f"**Disposition:** **{report.get('disposition')}**",
        "",
        "> Operator-recorded ROI baseline posture — not automated financial attestation.",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Pilot label | {report.get('pilotLabel') or 'not supplied'} |",
        f"| Tenant id | {report.get('tenantId') or 'not supplied'} |",
        f"| Run id | {report.get('runId') or 'not supplied'} |",
        f"| Paid pilot | {report.get('paidPilot')} |",
        f"| Review-cycle hours | {metrics.get('baselineReviewCycleHours')} |",
        f"| Review-cycle source | {metrics.get('baselineReviewCycleSource') or 'not recorded'} |",
        f"| Waiver applied | {metrics.get('waiverApplied')} |",
        f"| Projected dollars sponsor-safe | {metrics.get('projectedDollarClaimsSponsorSafe')} |",
        "",
        "## Optional fields captured",
        "",
        f"- Architect prep hours: {optional.get('architectPrepHoursPerReview')}",
        f"- Evidence assembly hours: {optional.get('evidenceAssemblyEffortHours')}",
        f"- Architect hourly cost: {optional.get('architectHourlyCost')}",
        "",
    ]

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
    parser.add_argument("--baseline-json", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, default=None)
    parser.add_argument("--copy-canonical-to", type=Path, default=None)
    parser.add_argument(
        "--strict-paid-pilot",
        action="store_true",
        help="Treat missing baseline or blocked source labels as HOLD for paid pilot kickoff.",
    )
    args = parser.parse_args(argv)

    schema = load_schema()
    payload = load_json(args.baseline_json)
    disposition, errors, warnings, metrics = validate_baseline(
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
        shutil.copy2(args.baseline_json, args.copy_canonical_to)

    print(
        f"Wrote paid-pilot baseline readiness report (disposition={disposition}) "
        f"to {args.json_out.resolve()}",
    )

    if disposition == "HOLD" and args.strict_paid_pilot:
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
