#!/usr/bin/env python3
"""TB-173: Offline dry-run for all templates/starter-proof-packs/* (metadata + contracts)."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def run_command(command: list[str], root: Path) -> int:
    print("+", " ".join(command), flush=True)
    completed = subprocess.run(command, cwd=root, check=False)
    return int(completed.returncode)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--with-dotnet-tests",
        action="store_true",
        help="Also run StarterProofPack* unit tests (Contracts, Decisioning, Application).",
    )
    parser.add_argument(
        "--json-out",
        type=Path,
        default=None,
        help="Optional validation JSON from check_starter_proof_packs.py",
    )
    args = parser.parse_args(argv)

    root = repo_root()
    check_cmd = [sys.executable, "scripts/ci/check_starter_proof_packs.py"]

    if args.json_out is not None:
        check_cmd.extend(["--json-out", str(args.json_out)])

    exit_code = run_command(check_cmd, root)

    if exit_code != 0:
        return exit_code

    if not args.with_dotnet_tests:
        print("OK: starter proof pack metadata dry-run (Python gate only)")
        return 0

    dotnet_filters: list[tuple[str, str]] = [
        ("ArchLucid.Contracts.Tests/ArchLucid.Contracts.Tests.csproj", "StarterProofPack"),
        ("ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj", "StarterProofPack"),
        ("ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj", "StarterProofPack"),
    ]

    for project, name_filter in dotnet_filters:
        exit_code = run_command(
            [
                "dotnet",
                "test",
                project,
                "--filter",
                f"FullyQualifiedName~{name_filter}",
                "-v",
                "q",
                "--nologo",
            ],
            root,
        )

        if exit_code != 0:
            return exit_code

    print("OK: starter proof pack dry-run (Python gate + StarterProofPack* tests)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
