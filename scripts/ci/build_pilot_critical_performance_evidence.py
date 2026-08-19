#!/usr/bin/env python3
"""Emit pilot-critical performance smoke evidence for RC signoff (TB-319)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from evaluate_first_pilot_performance_budget import _load_timings_ms  # noqa: E402
from release_evidence_common import first_existing, load_json, repo_root  # noqa: E402

_SCHEMA = "archlucid.pilot-critical-performance-evidence.v1"
_READINESS_NOTE = (
    "Pilot-critical smoke evidence only — not a load test, SLA, or capacity proof."
)

# Severe-timeout thresholds are intentionally generous until baseline data exists.
_FLOW_DEFINITIONS: tuple[dict[str, Any], ...] = (
    {
        "id": "create-review",
        "label": "Create review",
        "timingKeys": ("create_run", "create_review", "create-request"),
        "severeTimeoutSeconds": 180,
    },
    {
        "id": "commit-finalize",
        "label": "Commit / finalize",
        "timingKeys": ("commit", "commit_run", "commit-run"),
        "severeTimeoutSeconds": 120,
    },
    {
        "id": "dashboard-roi",
        "label": "Dashboard ROI load",
        "timingKeys": ("dashboard_roi", "analytics_roi", "run_roi", "analytics-roi", "run-roi"),
        "severeTimeoutSeconds": 45,
    },
    {
        "id": "ask-response",
        "label": "Ask response",
        "timingKeys": ("ask", "ask_response", "ask-response"),
        "severeTimeoutSeconds": 180,
    },
    {
        "id": "export-generation",
        "label": "Export generation",
        "timingKeys": ("export", "export_zip", "sponsor_export", "export-zip"),
        "severeTimeoutSeconds": 300,
    },
)


def _resolve_timings_path(root: Path, bundle_dir: Path, explicit: Path | None) -> Path | None:
    if explicit is not None and explicit.is_file():
        return explicit

    candidates = [
        "pilot-critical-timings.json",
        "staging-smoke-results.json",
        "simulator-seeded-timings.json",
        "performance-budget-smoke.json",
        "first-pilot-timing-budget.json",
        "artifacts/performance-budget-smoke/performance-budget-smoke.json",
    ]

    path, _scope = first_existing(root, bundle_dir, candidates)
    return path


def _extract_flow_timing(timings_ms: dict[str, int], timing_keys: tuple[str, ...]) -> int | None:
    for key in timing_keys:
        if key in timings_ms:
            return timings_ms[key]

        normalized = key.replace("-", "_")

        if normalized in timings_ms:
            return timings_ms[normalized]

    return None


def _classify_flow(
    *,
    flow_id: str,
    label: str,
    elapsed_ms: int | None,
    severe_timeout_seconds: int,
) -> dict[str, Any]:
    if elapsed_ms is None:
        return {
            "id": flow_id,
            "label": label,
            "status": "SKIPPED",
            "elapsedMs": None,
            "elapsedSeconds": None,
            "severeTimeoutSeconds": severe_timeout_seconds,
            "reason": "Flow timing not supplied in timings artifact",
        }

    elapsed_seconds = round(elapsed_ms / 1000.0, 2)

    if elapsed_seconds > severe_timeout_seconds:
        return {
            "id": flow_id,
            "label": label,
            "status": "HOLD",
            "elapsedMs": elapsed_ms,
            "elapsedSeconds": elapsed_seconds,
            "severeTimeoutSeconds": severe_timeout_seconds,
            "reason": f"Severe timeout: {elapsed_seconds}s exceeds {severe_timeout_seconds}s pilot-critical threshold",
        }

    if elapsed_seconds > severe_timeout_seconds * 0.75:
        return {
            "id": flow_id,
            "label": label,
            "status": "WARN",
            "elapsedMs": elapsed_ms,
            "elapsedSeconds": elapsed_seconds,
            "severeTimeoutSeconds": severe_timeout_seconds,
            "reason": f"Approaching severe-timeout threshold ({elapsed_seconds}s)",
        }

    return {
        "id": flow_id,
        "label": label,
        "status": "PASS",
        "elapsedMs": elapsed_ms,
        "elapsedSeconds": elapsed_seconds,
        "severeTimeoutSeconds": severe_timeout_seconds,
        "reason": f"Within pilot-critical smoke threshold ({elapsed_seconds}s)",
    }


def build_evidence(
    *,
    timings_ms: dict[str, int],
    meta: dict[str, Any],
    environment_label: str,
) -> dict[str, Any]:
    flows = [
        _classify_flow(
            flow_id=str(defn["id"]),
            label=str(defn["label"]),
            elapsed_ms=_extract_flow_timing(timings_ms, tuple(defn["timingKeys"])),
            severe_timeout_seconds=int(defn["severeTimeoutSeconds"]),
        )
        for defn in _FLOW_DEFINITIONS
    ]

    statuses = [flow["status"] for flow in flows]

    if any(status == "HOLD" for status in statuses):
        disposition = "HOLD"
    elif any(status == "WARN" for status in statuses):
        disposition = "WARN"
    elif all(status in {"PASS", "SKIPPED"} for status in statuses):
        disposition = "PASS"
    else:
        disposition = "WARN"

    execution_mode = str(meta.get("executionModeLabel") or meta.get("executionMode") or "unknown")

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "environmentLabel": environment_label,
        "executionMode": execution_mode.lower() if execution_mode else "unknown",
        "runId": meta.get("runId"),
        "correlationId": meta.get("correlationId"),
        "readinessNote": _READINESS_NOTE,
        "flows": flows,
        "timingsSource": meta.get("sourcePath"),
    }


def render_markdown(payload: dict[str, Any]) -> str:
    lines = [
        "# Pilot-critical performance evidence",
        "",
        _READINESS_NOTE,
        "",
        f"Generated UTC: **{payload['generatedUtc']}**",
        "",
        f"**Disposition:** **{payload['disposition']}**",
        f"Environment: **{payload.get('environmentLabel')}**",
        f"Execution mode: **{payload.get('executionMode')}**",
        "",
        "| Flow | Status | Elapsed (s) | Threshold (s) | Reason |",
        "| --- | --- | ---: | ---: | --- |",
    ]

    for flow in payload.get("flows") or []:
        elapsed = flow.get("elapsedSeconds")
        elapsed_display = "—" if elapsed is None else str(elapsed)
        reason = str(flow.get("reason") or "").replace("|", "/")[:120]
        lines.append(
            f"| {flow.get('label')} | **{flow.get('status')}** | {elapsed_display} | {flow.get('severeTimeoutSeconds')} | {reason} |"
        )

    lines.extend(["", f"Timings source: `{payload.get('timingsSource') or '(none)'}`", ""])
    return "\n".join(lines)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument("--bundle-dir", type=Path, default=None)
    parser.add_argument("--timings-json", type=Path, default=None)
    parser.add_argument("--environment-label", type=str, default="release-readiness")
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument(
        "--strict-rc",
        action="store_true",
        help="Exit non-zero only when disposition is HOLD.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    bundle_dir = (args.bundle_dir or args.json_out.parent).resolve()
    timings_path = _resolve_timings_path(args.repo_root.resolve(), bundle_dir, args.timings_json)

    timings_ms: dict[str, int] = {}
    meta: dict[str, Any] = {}

    if timings_path is not None:
        budget_payload = load_json(timings_path)

        if budget_payload is not None and isinstance(budget_payload.get("steps"), list):
            for step in budget_payload["steps"]:
                if not isinstance(step, dict):
                    continue

                step_key = str(step.get("stepKey") or "")

                if not step_key:
                    continue

                elapsed_ms = step.get("elapsedMs")

                if elapsed_ms is not None:
                    timings_ms[step_key] = int(elapsed_ms)

            meta = {
                "executionMode": budget_payload.get("executionMode"),
                "runId": (budget_payload.get("meta") or {}).get("runId") if isinstance(budget_payload.get("meta"), dict) else None,
                "sourcePath": timings_path.as_posix(),
            }
        else:
            timings_ms, meta = _load_timings_ms(timings_path)

    payload = build_evidence(
        timings_ms=timings_ms,
        meta=meta,
        environment_label=args.environment_label,
    )

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    print(f"Pilot-critical performance evidence: {payload['disposition']}")

    if args.strict_rc and payload["disposition"] == "HOLD":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
