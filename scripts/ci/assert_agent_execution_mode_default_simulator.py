#!/usr/bin/env python3
"""AS-085 / ADR 0086 — fail when default host configs flip AgentExecution:Mode to Real.

Career vs Rehearsal is Working product chrome; G-REAL-06 is owner execution, not a repo
default flip. Only allowlisted named environments may set Real (pilot overlay, samples, explicit
real-aoai compose overlay).
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

# ADR 0086 — host default stays Simulator unless file is on the allowlist below.
ALLOWLIST_RELATIVE_PATHS = frozenset(
    {
        "ArchLucid.Api/appsettings.Pilot.json",
        "ArchLucid.Api/appsettings.Real.sample.json",
        "ArchLucid.Api/appsettings.KeyVault.sample.json",
        "docker-compose.real-aoai.yml",
    }
)

DEFAULT_MUST_NOT_FLIP_TO_REAL_RELATIVE_PATHS = (
    "ArchLucid.Api/appsettings.json",
    "ArchLucid.Api/appsettings.Development.json",
    "ArchLucid.Api/appsettings.Production.json",
    "ArchLucid.Api/appsettings.Staging.json",
    "ArchLucid.Api/appsettings.Advanced.json",
    "ArchLucid.Worker/appsettings.json",
    "ArchLucid.Worker/appsettings.Development.json",
    "docker-compose.demo.yml",
    "docker-compose.yml",
)

EXPLICIT_SIMULATOR_REQUIRED_RELATIVE_PATHS = frozenset(
    {
        "ArchLucid.Api/appsettings.json",
        "ArchLucid.Api/appsettings.Development.json",
        "docker-compose.demo.yml",
    }
)

JSON_AGENT_EXECUTION_MODE_REAL = re.compile(
    r'"AgentExecution"\s*:\s*\{[^}]*?"Mode"\s*:\s*"Real"',
    re.IGNORECASE | re.DOTALL,
)

YAML_AGENT_EXECUTION_MODE_REAL = re.compile(
    r"(?:AgentExecution__Mode|ArchLucid__AgentExecution__Mode)\s*:\s*\"?Real\"?",
    re.IGNORECASE,
)

JSON_AGENT_EXECUTION_MODE_SIMULATOR = re.compile(
    r'"AgentExecution"\s*:\s*\{[^}]*?"Mode"\s*:\s*"Simulator"',
    re.IGNORECASE | re.DOTALL,
)

YAML_AGENT_EXECUTION_MODE_SIMULATOR = re.compile(
    r"(?:AgentExecution__Mode|ArchLucid__AgentExecution__Mode)\s*:\s*\"?Simulator\"?",
    re.IGNORECASE,
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def contains_agent_execution_mode_real(text: str) -> bool:
    return bool(
        JSON_AGENT_EXECUTION_MODE_REAL.search(text)
        or YAML_AGENT_EXECUTION_MODE_REAL.search(text)
    )


def contains_agent_execution_mode_simulator(text: str) -> bool:
    return bool(
        JSON_AGENT_EXECUTION_MODE_SIMULATOR.search(text)
        or YAML_AGENT_EXECUTION_MODE_SIMULATOR.search(text)
    )


def main() -> int:
    root = repo_root()
    failed = False

    for relative in DEFAULT_MUST_NOT_FLIP_TO_REAL_RELATIVE_PATHS:
        path = root / relative
        if not path.is_file():
            print(f"AGENT_EXECUTION_MODE missing required file: {relative}", file=sys.stderr)
            failed = True
            continue

        text = path.read_text(encoding="utf-8")
        if contains_agent_execution_mode_real(text):
            print(
                f"AGENT_EXECUTION_MODE {relative} must not default to Real "
                "(ADR 0086 / AS-085; add to ALLOWLIST only for named Real environments).",
                file=sys.stderr,
            )
            failed = True
            continue

        if relative in EXPLICIT_SIMULATOR_REQUIRED_RELATIVE_PATHS and not contains_agent_execution_mode_simulator(
            text
        ):
            print(
                f"AGENT_EXECUTION_MODE {relative} must explicitly set AgentExecution:Mode=Simulator "
                "(ADR 0086 / AS-085).",
                file=sys.stderr,
            )
            failed = True

    for relative in sorted(ALLOWLIST_RELATIVE_PATHS):
        path = root / relative
        if not path.is_file():
            print(f"AGENT_EXECUTION_MODE allowlist file missing: {relative}", file=sys.stderr)
            failed = True

    if failed:
        return 1

    print("AGENT_EXECUTION_MODE default posture OK (Simulator unless allowlisted Real overlay)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
