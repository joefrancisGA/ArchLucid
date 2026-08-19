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

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from pilot_readiness_bundle_gate_common import (  # noqa: E402
    EXPECTED_SLOT_KEYS,
    validate_offline_bundle_report,
)

_GATE_SCHEMA = "archlucid.pilot-readiness-release-train-gate.v1"
_OFFLINE_ARTIFACT_RELATIVE = Path(
    "artifacts",
    "pilot-readiness-bundle",
    "offline-fixture",
    "pilot-readiness-bundle.json",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def validate_pilot_readiness_bundle_report(report: dict[str, Any]) -> list[str]:
    return validate_offline_bundle_report(report)


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
