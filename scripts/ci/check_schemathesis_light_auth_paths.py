#!/usr/bin/env python3
"""ci.yml Schemathesis light fuzz must cover auth/admin/invite paths for private-beta contract smoke."""

from __future__ import annotations

import sys
from pathlib import Path

_REQUIRED_FRAGMENT = (
    "--include-path-regex='^(/v1/auth|/v1/admin|/v1/architecture|/v1/tenant|/scim|/v1/invitations)'"
)
_REQUIRED_AUTH_PATH_FRAGMENTS = (
    "/v1/admin",
    "/scim",
    "--checks=all",
    "--phases=examples",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def collect_violations(workflow_text: str) -> list[str]:
    violations: list[str] = []

    if _REQUIRED_FRAGMENT not in workflow_text:
        violations.append("missing auth/admin include-path-regex in api-schemathesis-light")

    for fragment in _REQUIRED_AUTH_PATH_FRAGMENTS:
        if fragment not in workflow_text:
            violations.append(f"api-schemathesis-light is missing required marker: {fragment}")

    return violations


def main() -> int:
    ci_yml = repo_root() / ".github" / "workflows" / "ci.yml"
    text = ci_yml.read_text(encoding="utf-8", errors="replace")
    violations = collect_violations(text)

    if violations:
        for violation in violations:
            print(f"check_schemathesis_light_auth_paths: {violation}", file=sys.stderr)

        return 1

    print("check_schemathesis_light_auth_paths: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
