#!/usr/bin/env python3
"""Ensure ArchLucid.Persistence/Pilots baseline repos exist before API Docker build."""

from __future__ import annotations

import sys
from pathlib import Path

_REQUIRED = (
    "ArchLucid.Persistence/Pilots/InMemoryPilotBaselineRepository.cs",
    "ArchLucid.Persistence/Pilots/DapperPilotBaselineRepository.cs",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def main() -> int:
    root = repo_root()
    missing = [rel for rel in _REQUIRED if not (root / rel).is_file()]

    if not missing:
        print(
            "assert_persistence_pilots_docker_context: OK "
            f"({len(_REQUIRED)} required Pilots source(s) present)."
        )
        return 0

    print("assert_persistence_pilots_docker_context: FAILED — missing required file(s):", file=sys.stderr)

    for rel in missing:
        print(f"  {rel}", file=sys.stderr)

    print(
        "\nFix: commit the Pilots persistence sources and build from repo root "
        "(docker build -f ArchLucid.Api/Dockerfile .).",
        file=sys.stderr,
    )

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
