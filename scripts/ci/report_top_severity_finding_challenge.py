#!/usr/bin/env python3
"""Validate top-severity finding challenge capture and export sponsor-packet appendix."""

from __future__ import annotations

import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]
_SCHEMA_PATH = _REPO / "scripts" / "ci" / "data" / "top_severity_finding_challenge_schema.v1.json"
_PAYLOAD_SCHEMA = "archlucid.top-severity-finding-challenge.v1"
_REPORT_SCHEMA = "archlucid.top-severity-finding-challenge-report.v1"
_APPENDIX_SCHEMA = "archlucid.top-severity-finding-challenge-appendix.v1"


def load_json(path: Path) -> dict[str, object]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"{path} must be a JSON object")

    return payload


def load_schema() -> dict[str, object]:
    return load_json(_SCHEMA_PATH)


def validate_challenge(
    payload: dict[str, object],
    schema: dict[str, object],
    *,
    strict_sponsor_handoff: bool,
) -> tuple[str, list[str], list[str], dict[str, object]]:
    errors: list[str] = []
    warnings: list[str] = []

    if payload.get("schema") != _PAYLOAD_SCHEMA:
        errors.append(f"schema must be {_PAYLOAD_SCHEMA}")

    adjudication_values = {str(value) for value in schema.get("adjudicationValues") or []}

    for field in schema.get("requiredFields") or []:
        field_name = str(field)
        value = payload.get(field_name)

        if field_name == "evidenceChainComplete":
            if not isinstance(value, bool):
                errors.append("evidenceChainComplete must be true or false")
            continue

        if value is None or (isinstance(value, str) and not str(value).strip()):
            errors.append(f"{field_name} is required")

    adjudication = str(payload.get("adjudication") or "").strip().lower()

    if adjudication and adjudication not in adjudication_values:
        errors.append(f"adjudication must be one of {sorted(adjudication_values)}")

    chain_complete = payload.get("evidenceChainComplete") is True
    chain_notes = str(payload.get("evidenceChainCompletenessNotes") or "").strip()

    if not chain_complete and not chain_notes:
        detail = "evidenceChainCompletenessNotes required when evidenceChainComplete is false"

        if strict_sponsor_handoff:
            errors.append(detail)
        else:
            warnings.append(detail)

    if adjudication == "confirmed" and not chain_complete:
        warnings.append(
            "adjudication is confirmed but evidenceChainComplete is false — sponsor appendix will flag partial chain.",
        )

    if adjudication == "rejected" and chain_complete:
        warnings.append("finding rejected despite complete evidence chain — confirm counter-argument is documented.")

    metrics = {
        "findingId": payload.get("findingId"),
        "evidenceChainId": payload.get("evidenceChainId"),
        "evidenceChainComplete": chain_complete,
        "adjudication": adjudication or None,
        "reviewerIdentity": payload.get("reviewerIdentity"),
    }

    if errors:
        return "HOLD", errors, warnings, metrics

    if warnings:
        return "WARN", errors, warnings, metrics

    return "PASS", errors, warnings, metrics


def render_appendix(payload: dict[str, object], report: dict[str, object]) -> str:
    lines = [
        "# Sponsor packet appendix — top-severity finding challenge",
        "",
        "> Review-close adjudication for the highest-severity finding on the committed review.",
        "",
        f"**Run id:** {payload.get('runId') or 'not supplied'}",
        f"**Pilot label:** {payload.get('pilotLabel') or 'not supplied'}",
        f"**Challenge UTC:** {payload.get('challengeUtc') or 'not recorded'}",
        f"**Reviewer identity:** {payload.get('reviewerIdentity') or 'not recorded'}",
        "",
        "## Finding under challenge",
        "",
        f"- **Finding id:** {payload.get('findingId') or 'not recorded'}",
        f"- **Title:** {payload.get('findingTitle') or 'not recorded'}",
        f"- **Severity:** {payload.get('severity') or 'not recorded'}",
        f"- **Evidence chain id:** {payload.get('evidenceChainId') or 'not recorded'}",
        f"- **Evidence chain complete:** {payload.get('evidenceChainComplete')}",
        "",
    ]

    if not payload.get("evidenceChainComplete"):
        lines.extend(
            [
                "**Evidence chain completeness notes:**",
                "",
                str(payload.get("evidenceChainCompletenessNotes") or "_not recorded_"),
                "",
            ]
        )

    lines.extend(
        [
            "## Challenge record",
            "",
            "**Counter-argument considered:**",
            "",
            f"> {payload.get('counterArgument') or '_not recorded_'}",
            "",
            f"**Final adjudication:** {payload.get('adjudication') or 'not recorded'}",
            "",
            "**Rationale:**",
            "",
            str(payload.get("adjudicationRationale") or "_not recorded_"),
            "",
            f"**Validation disposition:** {report.get('disposition')}",
            "",
            str(report.get("ownerReviewNote") or ""),
            "",
        ]
    )

    return "\n".join(lines)


def render_report_markdown(report: dict[str, object]) -> str:
    metrics = report.get("metrics") or {}
    errors = report.get("validationErrors") or []
    warnings = report.get("validationWarnings") or []

    lines = [
        "# Top-severity finding challenge (generated)",
        "",
        f"**Disposition:** **{report.get('disposition')}**",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Run id | {report.get('runId') or 'not supplied'} |",
        f"| Finding id | {metrics.get('findingId') or 'not recorded'} |",
        f"| Evidence chain id | {metrics.get('evidenceChainId') or 'not recorded'} |",
        f"| Evidence chain complete | {metrics.get('evidenceChainComplete')} |",
        f"| Adjudication | {metrics.get('adjudication') or 'not recorded'} |",
        f"| Reviewer identity | {metrics.get('reviewerIdentity') or 'not recorded'} |",
        "",
        "Sponsor packet appendix: `sponsor-packet-appendix-top-severity-finding-challenge.md`",
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

    return "\n".join(lines)


def build_report(
    payload: dict[str, object],
    *,
    disposition: str,
    errors: list[str],
    warnings: list[str],
    metrics: dict[str, object],
    strict_sponsor_handoff: bool,
) -> dict[str, object]:
    return {
        "schema": _REPORT_SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "strictSponsorHandoff": strict_sponsor_handoff,
        "runId": payload.get("runId"),
        "pilotLabel": payload.get("pilotLabel"),
        "metrics": metrics,
        "validationErrors": errors,
        "validationWarnings": warnings,
        "appendixFileName": "sponsor-packet-appendix-top-severity-finding-challenge.md",
        "ownerReviewRequired": disposition != "PASS",
        "ownerReviewNote": (
            "Top-severity finding challenge is operator-recorded adjudication; "
            "attach appendix to sponsor packet only after disposition is PASS or WARN with documented rationale."
        ),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--challenge-json", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, default=None)
    parser.add_argument("--appendix-out", type=Path, default=None)
    parser.add_argument("--copy-canonical-to", type=Path, default=None)
    parser.add_argument(
        "--strict-sponsor-handoff",
        action="store_true",
        help="Treat incomplete evidence-chain documentation as HOLD for sponsor handoff.",
    )
    args = parser.parse_args(argv)

    schema = load_schema()
    payload = load_json(args.challenge_json)
    disposition, errors, warnings, metrics = validate_challenge(
        payload,
        schema,
        strict_sponsor_handoff=args.strict_sponsor_handoff,
    )
    report = build_report(
        payload,
        disposition=disposition,
        errors=errors,
        warnings=warnings,
        metrics=metrics,
        strict_sponsor_handoff=args.strict_sponsor_handoff,
    )

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    markdown_out = args.markdown_out or args.json_out.with_suffix(".md")
    markdown_out.write_text(render_report_markdown(report), encoding="utf-8")

    appendix_out = args.appendix_out or args.json_out.with_name(
        "sponsor-packet-appendix-top-severity-finding-challenge.md",
    )
    appendix_payload = {
        "schema": _APPENDIX_SCHEMA,
        "generatedUtc": report["generatedUtc"],
        "disposition": disposition,
        "markdown": render_appendix(payload, report),
    }
    appendix_out.write_text(str(appendix_payload["markdown"]), encoding="utf-8")

    if args.copy_canonical_to is not None:
        args.copy_canonical_to.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(args.challenge_json, args.copy_canonical_to)

    print(
        f"Wrote top-severity finding challenge report (disposition={disposition}) "
        f"to {args.json_out.resolve()}",
    )

    if disposition == "HOLD" and args.strict_sponsor_handoff:
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
