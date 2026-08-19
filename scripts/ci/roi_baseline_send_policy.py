#!/usr/bin/env python3
"""Evaluate ROI baseline completeness and commercial SEND eligibility (Improvement 4)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_POLICY_PATH = Path(__file__).resolve().parent / "data" / "roi_baseline_send_policy.v1.json"
_OVERRIDE_SCHEMA = "archlucid.roi-baseline-send-override.v1"


def load_policy() -> dict[str, Any]:
    return json.loads(_POLICY_PATH.read_text(encoding="utf-8"))


def map_roi_basis_to_completeness(roi_basis_status: str, policy: dict[str, Any] | None = None) -> str:
    policy = policy or load_policy()
    threshold = policy["sendThreshold"]
    normalized = (roi_basis_status or "not-collected").strip().lower()

    if normalized in threshold["roiBasisStatusComplete"]:
        return "COMPLETE"

    if normalized in threshold["roiBasisStatusPartial"]:
        return "PARTIAL"

    if normalized in threshold["roiBasisStatusDefaulted"]:
        return "DEFAULTED"

    return "NOT_COLLECTED"


def validate_override(payload: dict[str, Any], policy: dict[str, Any], *, run_id: str | None) -> list[str]:
    errors: list[str] = []
    override_policy = policy.get("override") or {}

    if payload.get("schema") != override_policy.get("schema"):
        errors.append(f"schema must be {_OVERRIDE_SCHEMA}")

    role = str(payload.get("approvedByRole") or "")

    if role not in override_policy.get("approverRoles", []):
        errors.append(f"approvedByRole {role!r} not in approver list")

    recorder = str(payload.get("recordedBy") or "")

    if recorder not in override_policy.get("recorderRoles", []):
        errors.append(f"recordedBy {recorder!r} not in recorder list")

    for field in override_policy.get("requiredFields", []):
        value = payload.get(field)

        if value is None or (isinstance(value, str) and not value.strip()):
            errors.append(f"missing required field {field}")

    rationale = str(payload.get("rationale") or "")

    if len(rationale.strip()) < int(override_policy.get("rationaleMinLength") or 24):
        errors.append("rationale too short")

    valid_for = str(payload.get("validForRunId") or "").strip()

    if run_id and valid_for and valid_for != run_id.strip():
        errors.append("validForRunId does not match proof runId")

    return errors


def evaluate_send_eligibility(
    summary: dict[str, Any],
    override: dict[str, Any] | None = None,
    *,
    policy: dict[str, Any] | None = None,
) -> dict[str, Any]:
    policy = policy or load_policy()
    threshold = policy["sendThreshold"]
    roi_basis = str(summary.get("roiBasisStatus") or "not-collected")
    roi_safe = summary.get("roiSponsorSafe") is True
    completeness = map_roi_basis_to_completeness(roi_basis, policy)
    block_count = int(summary.get("blockCount") or 0)
    sponsor = str(summary.get("sponsorPacketDisposition") or "HOLD")
    run_id = str(summary.get("runId") or "").strip() or None

    missing_fields: list[str] = []
    field_rows: list[dict[str, Any]] = []

    for field in threshold["requiredBaselineFields"]:
        field_id = str(field["id"])
        collected = completeness == "COMPLETE"

        if field_id == "roiBasisSource":
            collected = roi_basis in threshold["roiBasisStatusComplete"]

        if not collected:
            missing_fields.append(field_id)

        field_rows.append(
            {
                "id": field_id,
                "label": field.get("label"),
                "collected": collected,
                "inferredFrom": "roiBasisStatus" if field_id == "roiBasisSource" else "roiBasisStatus proxy",
            }
        )

    override_valid = False
    override_errors: list[str] = []

    if override is not None:
        override_errors = validate_override(override, policy, run_id=run_id)
        override_valid = len(override_errors) == 0

    send_eligible = False
    send_block_reasons: list[str] = []

    if block_count > 0:
        send_block_reasons.append("blockCount > 0")

    if sponsor in {"HOLD", "READINESS_ONLY"}:
        send_block_reasons.append(f"sponsorPacketDisposition={sponsor}")

    if sponsor == "DEFERRED_SCOPE":
        send_block_reasons.append("sponsorPacketDisposition=DEFERRED_SCOPE")

    if threshold.get("requiresRoiSponsorSafe") and not roi_safe and not override_valid:
        send_block_reasons.append("roiSponsorSafe=false")

    if completeness != "COMPLETE" and not override_valid:
        send_block_reasons.append(f"baselineCompletenessStatus={completeness}")

    if not send_block_reasons:
        send_eligible = True

    proof_disposition = "SEND" if send_eligible else "HOLD"

    if sponsor == "DEFERRED_SCOPE":
        proof_disposition = "DEFERRED_SCOPE"

    return {
        "schema": "archlucid.roi-baseline-send-evaluation.v1",
        "baselineCompletenessStatus": completeness,
        "baselineFieldRows": field_rows,
        "missingRequiredBaselineFields": missing_fields,
        "sendEligible": send_eligible,
        "sendBlockReasons": send_block_reasons,
        "proofDispositionHint": proof_disposition,
        "overrideApplied": override_valid,
        "overrideErrors": override_errors,
        "policyRef": "scripts/ci/data/roi_baseline_send_policy.v1.json",
    }
