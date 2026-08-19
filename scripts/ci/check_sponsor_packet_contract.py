#!/usr/bin/env python3
"""Verify one-command sponsor packet generator contract is wired (T2-1)."""

from __future__ import annotations

import sys
from pathlib import Path

_REQUIRED_ARTIFACTS: tuple[str, ...] = (
    "index.md",
    "first-value-report.md",
    "sponsor-report.json",
    "limitations.md",
    "provenance-references.json",
    "pack-manifest.json",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def main() -> int:
    root = repo_root()
    errors: list[str] = []

    wrapper = root / "scripts" / "Invoke-SponsorPacket.ps1"
    command = root / "ArchLucid.Cli" / "Commands" / "SponsorPacketCommand.cs"
    catalog = root / "ArchLucid.Cli" / "Commands" / "SponsorPacketArtifactCatalog.cs"
    runbook = root / "docs" / "runbooks" / "SPONSOR_PACKET.md"

    for path in (wrapper, command, catalog, runbook):
        if not path.is_file():
            errors.append(f"missing required sponsor packet file: {path.relative_to(root)}")

    if command.is_file():
        command_text = command.read_text(encoding="utf-8", errors="replace")

        if "SponsorPacketCommand" not in command_text:
            errors.append("SponsorPacketCommand.cs: command entry missing")

    if catalog.is_file():
        catalog_text = catalog.read_text(encoding="utf-8", errors="replace")

        for artifact in _REQUIRED_ARTIFACTS:
            if artifact not in catalog_text:
                errors.append(f"SponsorPacketArtifactCatalog.cs: missing artifact {artifact}")

    program = root / "ArchLucid.Cli" / "Program.cs"

    if program.is_file():
        program_text = program.read_text(encoding="utf-8", errors="replace")

        if 'case "sponsor-packet":' not in program_text:
            errors.append("Program.cs: sponsor-packet command not registered")

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_sponsor_packet_contract: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
