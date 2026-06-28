"""Shared validation helpers for pilot readiness-bundle release gates."""

from __future__ import annotations

from typing import Any

EXPECTED_SLOT_KEYS: tuple[str, ...] = (
    "buyer-proof-evidence-ledger",
    "return-trigger-telemetry",
    "decision-owner-scoreboard",
    "frontier-ai-baseline",
    "citation-integrity",
    "tenant-isolation-negative-test",
    "itsm-pull-forward-gate",
    "ship-gate-evidence",
)


def _slot_keys(slots: list[Any]) -> list[str]:
    return [
        str(slot.get("slotKey") or "").strip()
        for slot in slots
        if isinstance(slot, dict)
    ]


def validate_slot_coverage(report: dict[str, Any]) -> list[str]:
    issues: list[str] = []

    slots = report.get("slots")
    if not isinstance(slots, list):
        issues.append("slots must be an array.")
        return issues

    if len(slots) != len(EXPECTED_SLOT_KEYS):
        issues.append(f"expected {len(EXPECTED_SLOT_KEYS)} slots, found {len(slots)}.")

    slot_keys = _slot_keys(slots)

    for expected_key in EXPECTED_SLOT_KEYS:
        if expected_key not in slot_keys:
            issues.append(f"missing slot key {expected_key}.")

    return issues


def validate_offline_bundle_report(report: dict[str, Any]) -> list[str]:
    issues = validate_slot_coverage(report)

    overall = str(report.get("overallVerdict") or "").strip()
    if not overall:
        issues.append("overallVerdict is missing.")
    elif overall == "Fail":
        issues.append("overallVerdict is Fail.")

    ship_gate = next(
        (
            slot
            for slot in report.get("slots") or []
            if isinstance(slot, dict) and slot.get("slotKey") == "ship-gate-evidence"
        ),
        None,
    )

    if isinstance(ship_gate, dict):
        ship_gate_verdict = str(ship_gate.get("verdict") or "").strip()
        if ship_gate_verdict != "Skipped":
            issues.append(
                "offline release train expects ship-gate-evidence SKIPPED, "
                f"found {ship_gate_verdict or 'missing'}.",
            )

    return issues


def validate_live_bundle_report(report: dict[str, Any], *, run_id: str) -> list[str]:
    issues = validate_slot_coverage(report)

    overall = str(report.get("overallVerdict") or "").strip()
    if not overall:
        issues.append("overallVerdict is missing.")
    elif overall == "Fail":
        issues.append("overallVerdict is Fail.")

    report_run_id = str(report.get("runId") or "").strip()
    expected_run_id = run_id.strip()

    if report_run_id and report_run_id.lower() != expected_run_id.lower():
        issues.append(f"bundle runId {report_run_id} does not match requested {expected_run_id}.")

    ship_gate = next(
        (
            slot
            for slot in report.get("slots") or []
            if isinstance(slot, dict) and slot.get("slotKey") == "ship-gate-evidence"
        ),
        None,
    )

    if isinstance(ship_gate, dict):
        ship_gate_verdict = str(ship_gate.get("verdict") or "").strip()
        if ship_gate_verdict == "Skipped":
            issues.append("live release train expects ship-gate-evidence to run, found Skipped.")
        elif ship_gate_verdict == "Fail":
            issues.append("ship-gate-evidence slot verdict is Fail.")

    return issues
