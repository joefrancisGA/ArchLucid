#!/usr/bin/env python3
"""Run live archlucid pilot readiness-bundle for RC/release evidence (TB-429)."""

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

from pilot_readiness_bundle_gate_common import validate_live_bundle_report  # noqa: E402

_GATE_SCHEMA = "archlucid.pilot-readiness-live-release-gate.v1"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def resolve_live_bundle_report_path(root: Path, run_id: str) -> Path:
    sanitized_run_id = run_id.strip()
    return (
        root
        / "artifacts"
        / "pilot-readiness-bundle"
        / sanitized_run_id
        / "pilot-readiness-bundle.json"
    )


def build_skipped_gate(*, run_id: str | None, reason: str) -> dict[str, Any]:
    return {
        "schema": _GATE_SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": "SKIPPED",
        "runId": run_id,
        "executionMode": "live",
        "detail": reason,
        "issues": [],
    }


def build_gate_report(
    *,
    bundle_report: dict[str, Any],
    run_id: str,
    cli_exit_code: int,
    issues: list[str],
    include_api: bool,
) -> dict[str, Any]:
    overall = str(bundle_report.get("overallVerdict") or "").strip()

    if issues or cli_exit_code != 0:
        disposition = "FAIL"
    elif overall == "Warn":
        disposition = "WARN"
    elif overall == "Unknown":
        disposition = "WARN"
    else:
        disposition = "PASS"

    return {
        "schema": _GATE_SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "runId": run_id,
        "executionMode": "live",
        "includeApi": include_api,
        "cliExitCode": cli_exit_code,
        "overallVerdict": bundle_report.get("overallVerdict"),
        "slotCount": len(bundle_report.get("slots") or []),
        "issues": issues,
        "bundleJsonArtifactPath": bundle_report.get("jsonArtifactPath"),
        "bundleMarkdownArtifactPath": bundle_report.get("markdownArtifactPath"),
    }


def render_markdown(gate_report: dict[str, Any]) -> str:
    lines = [
        "# Pilot readiness live release gate",
        "",
        f"Generated (UTC): **{gate_report.get('generatedUtc')}**",
        f"Disposition: **{gate_report.get('disposition')}**",
        f"Run id: `{gate_report.get('runId') or '(not supplied)'}`",
        f"Execution mode: **{gate_report.get('executionMode')}**",
        f"Include API: **{gate_report.get('includeApi')}**",
        "",
    ]

    if gate_report.get("overallVerdict"):
        lines.append(f"Overall bundle verdict: **{gate_report.get('overallVerdict')}**")
        lines.append("")

    issues = gate_report.get("issues") or []
    if issues:
        lines.append("## Issues")
        lines.append("")
        for issue in issues:
            lines.append(f"- {issue}")
        lines.append("")

    if gate_report.get("bundleJsonArtifactPath"):
        lines.append(f"Bundle JSON: `{gate_report.get('bundleJsonArtifactPath')}`")

    if gate_report.get("bundleMarkdownArtifactPath"):
        lines.append(f"Bundle Markdown: `{gate_report.get('bundleMarkdownArtifactPath')}`")

    return "\n".join(lines) + "\n"


def run_live_bundle(
    root: Path,
    *,
    run_id: str,
    api_base_url: str | None,
    include_api: bool,
    no_build: bool,
) -> tuple[int, str]:
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
        "--run-id",
        run_id.strip(),
    ]

    if include_api:
        command.append("--include-api")

    if api_base_url:
        command.extend(["--api-base-url", api_base_url.strip()])

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


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run live archlucid pilot readiness-bundle for RC/release evidence.",
    )
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument("--run-id", type=str, default="")
    parser.add_argument("--api-base-url", type=str, default="")
    parser.add_argument("--include-api", action="store_true")
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--bundle-report", type=Path, default=None)
    parser.add_argument("--skip-cli-run", action="store_true")
    parser.add_argument("--allow-build", action="store_true")
    parser.add_argument(
        "--strict-rc",
        action="store_true",
        help="Fail when run id is missing (buyer-facing RC cut).",
    )
    args = parser.parse_args()

    run_id = str(args.run_id or "").strip()
    api_base_url = str(args.api_base_url or "").strip() or None
    include_api = args.include_api or bool(api_base_url)

    if not run_id:
        skipped = build_skipped_gate(
            run_id=None,
            reason="Supply --run-id for a representative completed first-review run after smoke.",
        )
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(skipped, indent=2) + "\n", encoding="utf-8")
        args.markdown_out.write_text(render_markdown(skipped), encoding="utf-8")

        if args.strict_rc:
            print(
                "run_pilot_readiness_live_release_gate: FAIL strict RC requires --run-id",
                file=sys.stderr,
            )
            return 1

        print("run_pilot_readiness_live_release_gate: SKIPPED (no --run-id)")
        return 0

    root = args.repo_root.resolve()
    cli_exit_code = 0
    cli_output = ""

    if not args.skip_cli_run:
        cli_exit_code, cli_output = run_live_bundle(
            root,
            run_id=run_id,
            api_base_url=api_base_url,
            include_api=include_api,
            no_build=not args.allow_build,
        )

        if cli_exit_code != 0:
            print(
                f"run_pilot_readiness_live_release_gate: pilot readiness-bundle exited {cli_exit_code}",
                file=sys.stderr,
            )
            if cli_output.strip():
                print(cli_output, file=sys.stderr)

    bundle_path = args.bundle_report or resolve_live_bundle_report_path(root, run_id)
    issues: list[str] = []

    if not bundle_path.is_file():
        issues.append(f"bundle report not found: {bundle_path}")
        bundle_report: dict[str, Any] = {}
    else:
        bundle_report = load_json(bundle_path)
        issues.extend(
            validate_live_bundle_report(
                bundle_report,
                run_id=run_id,
                include_warn_slot_blockers=args.strict_rc,
            )
        )

        if args.strict_rc:
            overall = str(bundle_report.get("overallVerdict") or "").strip()

            if overall in {"Warn", "Unknown"}:
                issues.append(f"strict RC blocks overallVerdict {overall}.")

    gate_report = build_gate_report(
        bundle_report=bundle_report,
        run_id=run_id,
        cli_exit_code=cli_exit_code,
        issues=issues,
        include_api=include_api,
    )

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(gate_report, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(gate_report), encoding="utf-8")

    if gate_report["disposition"] == "PASS":
        print(
            "run_pilot_readiness_live_release_gate: PASS "
            f"(overallVerdict={gate_report.get('overallVerdict')}, slots={gate_report.get('slotCount')})",
        )
        return 0

    if gate_report["disposition"] == "WARN":
        print(
            "run_pilot_readiness_live_release_gate: WARN "
            f"(overallVerdict={gate_report.get('overallVerdict')}, slots={gate_report.get('slotCount')})",
        )

        if args.strict_rc:
            print("run_pilot_readiness_live_release_gate: FAIL strict RC blocks WARN", file=sys.stderr)
            for issue in issues:
                print(f"  - {issue}", file=sys.stderr)
            return 1

        return 0

    print("run_pilot_readiness_live_release_gate: FAIL", file=sys.stderr)
    for issue in issues:
        print(f"  - {issue}", file=sys.stderr)

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
