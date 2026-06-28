#!/usr/bin/env python3
"""Run offline pilot readiness-bundle and fail closed on aggregate FAIL slots."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_GATE_SCHEMA = "archlucid.pilot-readiness-release-train-gate.v1"
_EXPECTED_SLOT_KEYS = (
    "buyer-proof-evidence-ledger",
    "return-trigger-telemetry",
    "decision-owner-scoreboard",
    "frontier-ai-baseline",
    "citation-integrity",
    "tenant-isolation-negative-test",
    "ship-gate-evidence",
)
_OFFLINE_ARTIFACT_RELATIVE = Path(
    "artifacts",
    "pilot-readiness-bundle",
    "offline-fixture",
    "pilot-readiness-bundle.json",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_pilot_readiness_bundle_report(report: dict[str, Any]) -> list[str]:
    issues: list[str] = []

    overall = str(report.get("overallVerdict") or "").strip()
    if not overall:
        issues.append("overallVerdict is missing.")
    elif overall == "Fail":
        issues.append("overallVerdict is Fail.")

    slots = report.get("slots")
    if not isinstance(slots, list):
        issues.append("slots must be an array.")
        return issues

    if len(slots) != len(_EXPECTED_SLOT_KEYS):
        issues.append(f"expected {len(_EXPECTED_SLOT_KEYS)} slots, found {len(slots)}.")

    slot_keys = [
        str(slot.get("slotKey") or "").strip()
        for slot in slots
        if isinstance(slot, dict)
    ]

    for expected_key in _EXPECTED_SLOT_KEYS:
        if expected_key not in slot_keys:
            issues.append(f"missing slot key {expected_key}.")

    ship_gate = next(
        (slot for slot in slots if isinstance(slot, dict) and slot.get("slotKey") == "ship-gate-evidence"),
        None,
    )

    if isinstance(ship_gate, dict):
        ship_gate_verdict = str(ship_gate.get("verdict") or "").strip()
        if ship_gate_verdict != "Skipped":
            issues.append(
                f"offline release train expects ship-gate-evidence SKIPPED, found {ship_gate_verdict or 'missing'}.",
            )

    return issues


def run_offline_bundle(root: Path, *, no_build: bool) -> tuple[int, str]:
    command = [
        "dotnet",
        "run",
        "--project",
        str(root / "ArchLucid.Cli" / "ArchLucid.Cli.csproj"),
        "-c",
        "Release",
        "--",
        "pilot",
        "readiness-bundle",
    ]

    if no_build:
        command.insert(4, "--no-build")

    completed = subprocess.run(
        command,
        cwd=root,
        capture_output=True,
        text=True,
        check=False,
    )

    output = (completed.stdout or "") + (completed.stderr or "")
    return completed.returncode, output


def build_gate_report(
    *,
    bundle_report: dict[str, Any],
    cli_exit_code: int,
    issues: list[str],
) -> dict[str, Any]:
    disposition = "PASS" if cli_exit_code == 0 and not issues else "FAIL"

    return {
        "schema": _GATE_SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "cliExitCode": cli_exit_code,
        "overallVerdict": bundle_report.get("overallVerdict"),
        "slotCount": len(bundle_report.get("slots") or []),
        "issues": issues,
        "bundleJsonArtifactPath": bundle_report.get("jsonArtifactPath"),
        "bundleMarkdownArtifactPath": bundle_report.get("markdownArtifactPath"),
    }


def resolve_bundle_report_path(root: Path, explicit_path: Path | None) -> Path:
    if explicit_path is not None:
        return explicit_path

    return root / _OFFLINE_ARTIFACT_RELATIVE


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run offline archlucid pilot readiness-bundle for release-train CI.",
    )
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument("--bundle-report", type=Path, default=None)
    parser.add_argument("--json-out", type=Path, default=None)
    parser.add_argument("--skip-cli-run", action="store_true")
    parser.add_argument("--allow-build", action="store_true")
    args = parser.parse_args()

    root = args.repo_root.resolve()
    cli_exit_code = 0
    cli_output = ""

    if not args.skip_cli_run:
        cli_exit_code, cli_output = run_offline_bundle(root, no_build=not args.allow_build)

        if cli_exit_code != 0:
            print(
                f"run_pilot_readiness_release_train_gate: pilot readiness-bundle exited {cli_exit_code}",
                file=sys.stderr,
            )
            if cli_output.strip():
                print(cli_output, file=sys.stderr)

    bundle_path = resolve_bundle_report_path(root, args.bundle_report)
    issues: list[str] = []

    if not bundle_path.is_file():
        issues.append(f"bundle report not found: {bundle_path}")
        bundle_report: dict[str, Any] = {}
    else:
        bundle_report = load_json(bundle_path)
        issues.extend(validate_pilot_readiness_bundle_report(bundle_report))

    gate_report = build_gate_report(
        bundle_report=bundle_report,
        cli_exit_code=cli_exit_code,
        issues=issues,
    )

    if args.json_out is not None:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(gate_report, indent=2), encoding="utf-8")

    if gate_report["disposition"] == "PASS":
        print(
            "run_pilot_readiness_release_train_gate: PASS "
            f"(overallVerdict={gate_report.get('overallVerdict')}, slots={gate_report.get('slotCount')})",
        )
        return 0

    print("run_pilot_readiness_release_train_gate: FAIL", file=sys.stderr)
    for issue in issues:
        print(f"  - {issue}", file=sys.stderr)

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
