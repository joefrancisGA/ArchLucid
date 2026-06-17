#!/usr/bin/env python3
"""Validate and summarize paid-pilot decision-change attribution ledgers (TB decision-advantage)."""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]
_SCHEMA_PATH = _REPO / "scripts" / "ci" / "data" / "pilot_decision_ledger_schema.v1.json"
_PAYLOAD_SCHEMA = "archlucid.pilot-decision-ledger.v1"
_REPORT_SCHEMA = "archlucid.pilot-decision-ledger-report.v1"


def load_json(path: Path) -> dict[str, object]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"{path} must be a JSON object")

    return payload


def load_schema() -> dict[str, object]:
    return load_json(_SCHEMA_PATH)


def validate_ledger(
    payload: dict[str, object],
    schema: dict[str, object],
    *,
    strict_paid_pilot: bool,
) -> tuple[str, list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    if payload.get("schema") != _PAYLOAD_SCHEMA:
        errors.append(f"schema must be {_PAYLOAD_SCHEMA}")

    decisions_raw = payload.get("decisionsUnderReview")

    if not isinstance(decisions_raw, list):
        errors.append("decisionsUnderReview must be an array")
        decisions: list[dict[str, object]] = []
    else:
        decisions = [row for row in decisions_raw if isinstance(row, dict)]

    max_decisions = int(schema.get("maxDecisionsUnderReview") or 3)
    required_decision_fields = list(schema.get("requiredDecisionFields") or [])
    required_change_fields = list(schema.get("requiredAttributedChangeFields") or [])
    confidence_values = set(schema.get("attributionConfidenceValues") or [])
    sponsor_outcomes = set(schema.get("sponsorAcceptanceOutcomes") or [])

    if strict_paid_pilot and not decisions:
        errors.append("decisionsUnderReview must include at least one decision for paid pilot closeout")

    if len(decisions) > max_decisions:
        warnings.append(
            f"decisionsUnderReview has {len(decisions)} entries; top {max_decisions} recommended",
        )

    for index, decision in enumerate(decisions):
        for field in required_decision_fields:
            value = decision.get(field)

            if value is None or (isinstance(value, str) and not value.strip()):
                errors.append(f"decisionsUnderReview[{index}] missing {field}")

    changes_raw = payload.get("decisionChanges")

    if not isinstance(changes_raw, list):
        errors.append("decisionChanges must be an array")
        changes: list[dict[str, object]] = []
    else:
        changes = [row for row in changes_raw if isinstance(row, dict)]

    attributed_changes: list[dict[str, object]] = []

    for index, change in enumerate(changes):
        if change.get("changedBecauseOfArchLucidFinding") is not True:
            continue

        attributed_changes.append(change)

        for field in required_change_fields:
            value = change.get(field)

            if value is None or (isinstance(value, str) and not value.strip()):
                errors.append(f"decisionChanges[{index}] missing {field} for attributed change")

        confidence = str(change.get("attributionConfidence") or "").strip().lower()

        if confidence and confidence not in confidence_values:
            errors.append(
                f"decisionChanges[{index}] attributionConfidence must be one of "
                f"{sorted(confidence_values)}",
            )

    no_change_confirmed = payload.get("noDecisionChangesConfirmed") is True

    if strict_paid_pilot and not attributed_changes and not no_change_confirmed:
        errors.append(
            "decisionChanges empty without noDecisionChangesConfirmed=true — "
            "record explicit no-change confirmation or attribute at least one decision change",
        )

    sponsor_raw = payload.get("sponsorAcceptance")

    if not isinstance(sponsor_raw, dict):
        sponsor: dict[str, object] = {}
    else:
        sponsor = sponsor_raw

    if attributed_changes:
        outcome = str(sponsor.get("outcome") or "").strip().lower()

        if not outcome:
            errors.append(
                "sponsorAcceptance.outcome required when ArchLucid-attributed decision changes exist",
            )
        elif outcome not in sponsor_outcomes:
            errors.append(
                f"sponsorAcceptance.outcome must be one of {sorted(sponsor_outcomes)}",
            )

    disposition = "PASS" if not errors else "HOLD"

    return disposition, errors, warnings


def build_metrics(
    payload: dict[str, object],
    attributed_count: int,
) -> dict[str, object]:
    decisions_raw = payload.get("decisionsUnderReview")

    if isinstance(decisions_raw, list):
        decision_count = len([row for row in decisions_raw if isinstance(row, dict)])
    else:
        decision_count = 0

    decision_change_rate = round(attributed_count / decision_count, 4) if decision_count else 0.0

    return {
        "decisionCount": decision_count,
        "attributedChangeCount": attributed_count,
        "decisionChangeRate": decision_change_rate,
    }


def build_report(
    payload: dict[str, object],
    *,
    disposition: str,
    errors: list[str],
    warnings: list[str],
    strict_paid_pilot: bool,
) -> dict[str, object]:
    changes_raw = payload.get("decisionChanges")

    if isinstance(changes_raw, list):
        attributed_count = len(
            [
                row
                for row in changes_raw
                if isinstance(row, dict) and row.get("changedBecauseOfArchLucidFinding") is True
            ],
        )
    else:
        attributed_count = 0

    metrics = build_metrics(payload, attributed_count)
    sponsor_raw = payload.get("sponsorAcceptance")

    sponsor_outcome = None

    if isinstance(sponsor_raw, dict):
        sponsor_outcome = sponsor_raw.get("outcome")

    return {
        "schema": _REPORT_SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "strictPaidPilot": strict_paid_pilot,
        "pilotLabel": payload.get("pilotLabel"),
        "runId": payload.get("runId"),
        "paidPilot": payload.get("paidPilot"),
        "noDecisionChangesConfirmed": payload.get("noDecisionChangesConfirmed") is True,
        "decisionChangeRate": metrics["decisionChangeRate"],
        "metrics": metrics,
        "sponsorAcceptanceOutcome": sponsor_outcome,
        "validationErrors": errors,
        "validationWarnings": warnings,
        "ownerReviewRequired": True,
        "ownerReviewNote": (
            "Decision-change attribution is operator-recorded market evidence; "
            "do not treat as automated product scoring."
        ),
    }


def render_markdown(report: dict[str, object]) -> str:
    metrics = report.get("metrics") or {}
    errors = report.get("validationErrors") or []
    warnings = report.get("validationWarnings") or []

    lines = [
        "# Pilot decision-change ledger (generated)",
        "",
        f"**Disposition:** **{report.get('disposition')}**",
        "",
        "> Operator-recorded attribution for paid pilot closeout — not automated product scoring.",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Pilot label | {report.get('pilotLabel') or 'not supplied'} |",
        f"| Run id | {report.get('runId') or 'not supplied'} |",
        f"| Paid pilot | {report.get('paidPilot')} |",
        f"| Decisions under review | {metrics.get('decisionCount')} |",
        f"| Attributed changes | {metrics.get('attributedChangeCount')} |",
        f"| Decision-change rate | {metrics.get('decisionChangeRate')} |",
        f"| No-change confirmed | {report.get('noDecisionChangesConfirmed')} |",
        f"| Sponsor acceptance | {report.get('sponsorAcceptanceOutcome') or 'not recorded'} |",
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
            "Template: "
            "[`pilot-decision-ledger.template.json`](../../docs/go-to-market/templates/pilot-decision-ledger.template.json)",
            "",
        ],
    )

    return "\n".join(lines)


def resolve_default_ledger_path(run_id: str, storage_root: Path) -> Path:
    normalized = run_id.strip()
    return storage_root / normalized / "ledger.json"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ledger-json", type=Path, default=None)
    parser.add_argument("--run-id", type=str, default="")
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--strict-paid-pilot", action="store_true")
    parser.add_argument(
        "--copy-canonical-to",
        type=Path,
        default=None,
        help="Optional path to copy validated ledger JSON (e.g. artifacts/pilot-decision-ledger/<runId>/ledger.json)",
    )
    args = parser.parse_args(argv)

    schema = load_schema()
    storage_root = _REPO / str(schema.get("storageRoot") or "artifacts/pilot-decision-ledger")

    ledger_path = args.ledger_json

    if ledger_path is None:
        if not args.run_id.strip():
            print("ERROR: supply --ledger-json or --run-id", file=sys.stderr)
            return 2

        ledger_path = resolve_default_ledger_path(args.run_id, storage_root)

    if not ledger_path.is_file():
        print(f"ERROR: ledger not found: {ledger_path}", file=sys.stderr)
        return 2

    payload = load_json(ledger_path)
    disposition, errors, warnings = validate_ledger(
        payload,
        schema,
        strict_paid_pilot=args.strict_paid_pilot,
    )
    report = build_report(
        payload,
        disposition=disposition,
        errors=errors,
        warnings=warnings,
        strict_paid_pilot=args.strict_paid_pilot,
    )

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(report), encoding="utf-8")

    if args.copy_canonical_to is not None:
        args.copy_canonical_to.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ledger_path, args.copy_canonical_to)

    print(f"OK: pilot decision ledger {disposition} (rate={report['decisionChangeRate']})")

    if args.strict_paid_pilot and disposition != "PASS":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
