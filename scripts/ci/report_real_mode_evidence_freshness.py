#!/usr/bin/env python3
"""Report real-mode evidence freshness for CI and release rollups."""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from check_release_real_mode_claim import evaluate_release_real_mode_claim  # noqa: E402
from release_evidence_bundle import evaluate_real_mode_ai_evidence  # noqa: E402

_SCHEMA = "archlucid.real-mode-evidence-freshness.v1"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def resolve_strict_mode(args_strict: bool) -> bool:
    if args_strict:
        return True

    env = os.environ.get("ARCHLUCID_BUYER_SURFACE_STRICT", "").strip().lower()

    return env in {"1", "true", "yes"}


def evaluate_freshness(
    *,
    bundle_dir: Path,
    agent_results_dir: Path,
    gate_json: Path | None,
    waiver_json: Path | None,
    allow_simulator_only: bool,
    max_gate_age_days: int,
) -> dict[str, object]:
    bundle_eval = evaluate_real_mode_ai_evidence(bundle_dir)
    disposition, rows, wording = evaluate_release_real_mode_claim(
        agent_results_dir=agent_results_dir,
        gate_json=gate_json,
        require_gate=False,
        max_gate_age_days=max_gate_age_days,
        allow_simulator_only=allow_simulator_only,
        waiver_json=waiver_json,
    )

    reason_codes: list[str] = []

    if allow_simulator_only:
        reason_codes.append("SIMULATOR_ONLY_OVERRIDE")
        freshness_status = "SIMULATOR_ONLY"
    elif disposition == "PASS" and wording == "full-real-mode":
        reason_codes.append("FRESH")
        freshness_status = "FRESH"
    elif bundle_eval.get("status") == "STALE":
        reason_codes.append("STALE")
        freshness_status = "STALE"
    elif bundle_eval.get("status") == "MISSING" and gate_json is None:
        reason_codes.append("MISSING")
        freshness_status = "MISSING"
    elif wording == "waived-not-verified":
        reason_codes.append("WAIVED")
        freshness_status = "WAIVED"
    elif disposition in {"WARN", "HOLD"}:
        reason_codes.append("PARTIAL_OR_HOLD")
        freshness_status = "STALE" if bundle_eval.get("status") == "STALE" else "MISSING"
    else:
        reason_codes.append("UNKNOWN")
        freshness_status = "MISSING"

    blocking_reasons = [
        f"{row['check']}: {row['detail']}"
        for row in rows
        if row.get("result") == "FAIL"
    ]

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "freshnessStatus": freshness_status,
        "reasonCodes": reason_codes,
        "claimWordingClass": wording,
        "claimDisposition": disposition,
        "bundleRealModeStatus": bundle_eval.get("status"),
        "bundleDetail": bundle_eval.get("detail"),
        "simulatorOnlyOverridePresent": bundle_eval.get("simulatorOnlyOverridePresent", False),
        "blockingReasons": blocking_reasons,
        "checks": rows,
    }


def render_markdown(summary: dict[str, object]) -> str:
    lines = [
        "# Real-mode evidence freshness",
        "",
        f"Generated (UTC): **{summary['generatedUtc']}**",
        "",
        f"**Freshness status:** **{summary['freshnessStatus']}**",
        f"**Reason codes:** {', '.join(summary.get('reasonCodes', []))}",
        f"**Claim wording class:** {summary.get('claimWordingClass')}",
        "",
        "| Check | Result | Detail |",
        "| --- | --- | --- |",
    ]

    for row in summary.get("checks", []):
        if not isinstance(row, dict):
            continue

        detail = str(row.get("detail", "")).replace("|", "/")
        lines.append(f"| {row.get('check', '')} | {row.get('result', '')} | {detail} |")

    blocking = summary.get("blockingReasons", [])

    if isinstance(blocking, list) and blocking:
        lines.extend(["", "**Blocking reasons:**"])

        for reason in blocking:
            lines.append(f"- {reason}")

    lines.append("")
    return "\n".join(lines)


def should_fail(summary: dict[str, object], *, strict: bool) -> bool:
    if not strict:
        return False

    status = str(summary.get("freshnessStatus", "")).upper()
    allowed = {"FRESH", "SIMULATOR_ONLY", "WAIVED"}

    return status not in allowed


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    root = repo_root()
    parser.add_argument("--bundle-dir", type=Path, default=root / "artifacts" / "release")
    parser.add_argument(
        "--agent-results-dir",
        type=Path,
        default=root / "tests" / "eval-corpus" / "agent-results",
    )
    parser.add_argument(
        "--gate-json",
        type=Path,
        default=root / "artifacts" / "release" / "real-llm-evidence-gate.json",
    )
    parser.add_argument("--waiver-json", type=Path, default=None)
    parser.add_argument("--max-gate-age-days", type=int, default=30)
    parser.add_argument(
        "--allow-simulator-only",
        action="store_true",
        help="Honest simulator-only posture — do not fail when intentionally simulator-only.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Fail when freshness is stale/missing (also ARCHLUCID_BUYER_SURFACE_STRICT=1).",
    )
    parser.add_argument("--json-out", type=Path, default=None)
    parser.add_argument("--markdown-out", type=Path, default=None)
    args = parser.parse_args(argv)

    gate_path = args.gate_json if args.gate_json.is_file() else None
    strict = resolve_strict_mode(args.strict)
    summary = evaluate_freshness(
        bundle_dir=args.bundle_dir,
        agent_results_dir=args.agent_results_dir,
        gate_json=gate_path,
        waiver_json=args.waiver_json,
        allow_simulator_only=args.allow_simulator_only,
        max_gate_age_days=args.max_gate_age_days,
    )
    summary["strictMode"] = strict

    if args.json_out is not None:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    if args.markdown_out is not None:
        args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
        args.markdown_out.write_text(render_markdown(summary), encoding="utf-8")

    print(
        f"real-mode evidence freshness: {summary['freshnessStatus']} "
        f"({summary.get('claimWordingClass')}); strict={strict}"
    )

    if should_fail(summary, strict=strict):
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
