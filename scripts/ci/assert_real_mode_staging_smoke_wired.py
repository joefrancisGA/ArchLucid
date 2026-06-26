#!/usr/bin/env python3
"""Ensure real-mode staging smoke nightly workflow and CLI entry point remain wired."""

from __future__ import annotations

import sys
from pathlib import Path

_WORKFLOW = Path(".github/workflows/real-mode-staging-smoke-nightly.yml")
_RUNBOOK = Path("docs/runbooks/REAL_MODE_STAGING_SMOKE.md")
_PROGRAM = Path("ArchLucid.Cli/Program.cs")
_CLI_COMMAND = Path("ArchLucid.Cli/Commands/RealModeSmokeCommand.cs")

_REQUIRED_WORKFLOW_SNIPPETS = (
    "real-mode smoke --staging",
    "run_golden_cohort_budget_probe_ci.sh",
    "ARCHLUCID_REAL_MODE_STAGING_SMOKE_ENABLED",
    "ARCHLUCID_STAGING_SMOKE_API_KEY",
)

_REQUIRED_PROGRAM_SNIPPETS = (
    'case "real-mode":',
    "RealModeSmokeCommand.RunAsync",
)


def _read(path: Path) -> str:
    if not path.is_file():
        print(f"assert_real_mode_staging_smoke_wired: missing file: {path}", file=sys.stderr)
        raise SystemExit(1)

    return path.read_text(encoding="utf-8")


def main() -> int:
    workflow_text = _read(_WORKFLOW)
    program_text = _read(_PROGRAM)

    if not _CLI_COMMAND.is_file():
        print(f"assert_real_mode_staging_smoke_wired: missing CLI command: {_CLI_COMMAND}", file=sys.stderr)
        return 1

    if not _RUNBOOK.is_file():
        print(f"assert_real_mode_staging_smoke_wired: missing runbook: {_RUNBOOK}", file=sys.stderr)
        return 1

    errors: list[str] = []

    for snippet in _REQUIRED_WORKFLOW_SNIPPETS:
        if snippet not in workflow_text:
            errors.append(f"{_WORKFLOW}: missing snippet: {snippet!r}")

    for snippet in _REQUIRED_PROGRAM_SNIPPETS:
        if snippet not in program_text:
            errors.append(f"{_PROGRAM}: missing snippet: {snippet!r}")

    if errors:
        for line in errors:
            print(f"assert_real_mode_staging_smoke_wired: {line}", file=sys.stderr)

        return 1

    print("assert_real_mode_staging_smoke_wired: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
