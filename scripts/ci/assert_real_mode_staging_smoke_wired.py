#!/usr/bin/env python3
"""Ensure real-mode staging smoke nightly workflow and CLI entry point remain wired."""

from __future__ import annotations

import sys
from pathlib import Path

_WORKFLOW = Path(".github/workflows/real-mode-staging-smoke-nightly.yml")
_RUNBOOK = Path("docs/runbooks/REAL_MODE_STAGING_SMOKE.md")
_PROGRAM = Path("ArchLucid.Cli/Program.cs")
_COMMAND_REGISTRY = Path("ArchLucid.Cli/CommandRegistry.cs")
_CLI_HANDLERS = Path("ArchLucid.Cli/CliCommandHandlers.Misc.cs")
_CLI_COMMAND = Path("ArchLucid.Cli/Commands/RealModeSmokeCommand.cs")

_REQUIRED_WORKFLOW_SNIPPETS = (
    "real-mode smoke --staging",
    "run_golden_cohort_budget_probe_ci.sh",
    "ARCHLUCID_REAL_MODE_STAGING_SMOKE_ENABLED",
    "ARCHLUCID_STAGING_SMOKE_API_KEY",
)

_REQUIRED_REGISTRY_SNIPPETS = (
    'new CommandDescriptor("real-mode"',
    "CliCommandHandlers.HandleRealMode",
)

_REQUIRED_HANDLER_SNIPPETS = (
    "RealModeSmokeCommand.RunAsync",
)


def _read(path: Path) -> str:
    if not path.is_file():
        print(f"assert_real_mode_staging_smoke_wired: missing file: {path}", file=sys.stderr)
        raise SystemExit(1)

    return path.read_text(encoding="utf-8")


def main() -> int:
    workflow_text = _read(_WORKFLOW)
    registry_text = _read(_COMMAND_REGISTRY)
    handlers_text = _read(_CLI_HANDLERS)

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

    for snippet in _REQUIRED_REGISTRY_SNIPPETS:
        if snippet not in registry_text:
            errors.append(f"{_COMMAND_REGISTRY}: missing snippet: {snippet!r}")

    for snippet in _REQUIRED_HANDLER_SNIPPETS:
        if snippet not in handlers_text:
            errors.append(f"{_CLI_HANDLERS}: missing snippet: {snippet!r}")

    if errors:
        for line in errors:
            print(f"assert_real_mode_staging_smoke_wired: {line}", file=sys.stderr)

        return 1

    print("assert_real_mode_staging_smoke_wired: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
