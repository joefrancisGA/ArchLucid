"""Shared validation helpers for pilot readiness-bundle release gates."""

from __future__ import annotations

from pathlib import Path
from typing import Any

def artifact_change_token(path: Path) -> tuple[int, int, int, int] | None:
    """Capture metadata that changes when a bundle report is actually rewritten.

    The caller captures this before a CLI run and compares it afterward. A
    previously committed report must not be accepted as this run's evidence.
    """
    try:
        stat = path.stat()
    except FileNotFoundError:
        return None
    return (stat.st_mtime_ns, stat.st_ctime_ns, stat.st_size, stat.st_ino)


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

    if not isinstance(report, dict):
        return ["bundle report must be a JSON object."]

    slots = report.get("slots")
    if not isinstance(slots, list):
        issues.append("slots must be an array.")
        return issues

    if len(slots) != len(EXPECTED_SLOT_KEYS):
        issues.append(f"expected {len(EXPECTED_SLOT_KEYS)} slots, found {len(slots)}.")

    slot_keys = _slot_keys(slots)
    if len(slot_keys) != len(slots):
        issues.append("each slot must be an object.")
    if len(slot_keys) != len(set(slot_keys)):
        issues.append("slot keys must be unique.")
    for slot in slots:
        if not isinstance(slot, dict):
            continue
        verdict = slot.get("verdict")
        if not isinstance(verdict, str) or verdict not in {"Pass", "Warn", "Fail", "Skipped"}:
            issues.append(f"slot {slot.get('slotKey') or 'unknown-slot'} has invalid verdict.")
        elif verdict == "Fail":
            issues.append(f"slot {slot.get('slotKey') or 'unknown-slot'} verdict is Fail.")
        elif verdict == "Skipped" and slot.get("slotKey") != "ship-gate-evidence":
            issues.append(f"slot {slot.get('slotKey') or 'unknown-slot'} unexpectedly Skipped.")

    for expected_key in EXPECTED_SLOT_KEYS:
        if expected_key not in slot_keys:
            issues.append(f"missing slot key {expected_key}.")
    for key in slot_keys:
        if key not in EXPECTED_SLOT_KEYS:
            issues.append(f"unexpected slot key {key}.")

    return issues


def validate_offline_bundle_report(report: dict[str, Any]) -> list[str]:
    issues = validate_slot_coverage(report)
    if not isinstance(report, dict):
        return issues

    overall = str(report.get("overallVerdict") or "").strip()
    if not overall:
        issues.append("overallVerdict is missing.")
    elif overall == "Fail":
        issues.append("overallVerdict is Fail.")
    elif overall != "Pass":
        issues.append(f"offline overallVerdict must be Pass, found {overall}.")

    safe_slots = report.get("slots")
    if not isinstance(safe_slots, list):
        safe_slots = []

    ship_gate = next(
        (
            slot
            for slot in safe_slots
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


def collect_live_slot_release_blockers(
    slots: list[Any],
    *,
    include_warn: bool,
) -> list[str]:
    blockers: list[str] = []

    if not isinstance(slots, list):
        return blockers

    for slot in slots:
        if not isinstance(slot, dict):
            continue

        slot_key = str(slot.get("slotKey") or "").strip() or "unknown-slot"
        verdict = str(slot.get("verdict") or "").strip()

        if verdict == "Fail":
            blockers.append(f"slot {slot_key} verdict is Fail.")
            continue

        if include_warn and verdict == "Warn":
            blockers.append(f"slot {slot_key} verdict is Warn.")

    return blockers


def validate_live_bundle_report(
    report: dict[str, Any],
    *,
    run_id: str,
    include_warn_slot_blockers: bool = False,
) -> list[str]:
    issues = validate_slot_coverage(report)
    if not isinstance(report, dict):
        return issues

    overall = str(report.get("overallVerdict") or "").strip()
    if not overall:
        issues.append("overallVerdict is missing.")
    elif overall not in {"Pass", "Warn"}:
        issues.append(f"live overallVerdict is invalid or blocking: {overall}.")

    raw_run_id = report.get("runId")
    report_run_id = raw_run_id.strip() if isinstance(raw_run_id, str) else ""
    expected_run_id = run_id.strip() if isinstance(run_id, str) else ""

    if not report_run_id or not expected_run_id:
        issues.append("live bundle runId is required.")
    elif report_run_id.lower() != expected_run_id.lower():
        issues.append(f"bundle runId {report_run_id} does not match requested {expected_run_id}.")

    safe_slots = report.get("slots")
    if not isinstance(safe_slots, list):
        safe_slots = []

    ship_gate = next(
        (
            slot
            for slot in safe_slots
            if isinstance(slot, dict) and slot.get("slotKey") == "ship-gate-evidence"
        ),
        None,
    )

    if isinstance(ship_gate, dict):
        ship_gate_verdict = str(ship_gate.get("verdict") or "").strip()
        if ship_gate_verdict == "Skipped":
            issues.append("live release train expects ship-gate-evidence to run, found Skipped.")

    issues.extend(
        collect_live_slot_release_blockers(
            safe_slots,
            include_warn=include_warn_slot_blockers,
        )
    )

    return issues
