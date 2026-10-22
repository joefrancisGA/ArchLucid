#!/usr/bin/env python3
"""Ensure API auth behavior docs match the authoritative contract (Improvement #15)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CONTRACT = REPO_ROOT / "docs/library/API_AUTH_BEHAVIOR_CONTRACT.md"
DOC_TARGETS = (
    REPO_ROOT / "docs/REPOSITORY_README.md",
    REPO_ROOT / "docs/library/CONFIGURATION_REFERENCE.md",
)

REQUIRED_PHRASES = (
    "Authentication:ApiKey:Enabled",
    "DevelopmentBypass",
    "JwtBearer",
    "fail closed",
    "X-Api-Key",
)


def api_auth_doc_contract_violations(root: Path) -> list[str]:
    violations: list[str] = []

    if not CONTRACT.is_file():
        return ["docs/library/API_AUTH_BEHAVIOR_CONTRACT.md: missing"]

    contract_text = CONTRACT.read_text(encoding="utf-8")

    for phrase in REQUIRED_PHRASES:
        if phrase.lower() not in contract_text.lower():
            violations.append(f"{CONTRACT.relative_to(root)}: missing phrase {phrase!r}")

    for path in DOC_TARGETS:
        if not path.is_file():
            violations.append(f"{path.relative_to(root)}: missing")
            continue

        text = path.read_text(encoding="utf-8")

        for phrase in ("ApiKey", "DevelopmentBypass", "JwtBearer"):
            if phrase not in text:
                violations.append(f"{path.relative_to(root)}: missing auth mode {phrase!r}")

        if "fail closed" not in text.lower() and "rejected" not in text.lower():
            violations.append(
                f"{path.relative_to(root)}: missing fail-closed ApiKey wording (fail closed or rejected)"
            )

    return violations


def main() -> int:
    violations = api_auth_doc_contract_violations(REPO_ROOT)

    if violations:
        print("API auth doc contract FAILED:", file=sys.stderr)

        for item in violations:
            print(f"  - {item}", file=sys.stderr)

        return 1

    print("API auth doc contract: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
