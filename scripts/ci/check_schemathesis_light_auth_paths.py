#!/usr/bin/env python3
"""ci.yml Schemathesis light fuzz must cover auth/admin/invite paths for private-beta contract smoke."""

from __future__ import annotations

import sys
from pathlib import Path

_REQUIRED_FRAGMENT = (
    "--include-path-regex='^(/v1/auth|/v1/admin|/scim|/v1/invitations)'"
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def main() -> int:
    ci_yml = repo_root() / ".github" / "workflows" / "ci.yml"
    text = ci_yml.read_text(encoding="utf-8", errors="replace")

    if _REQUIRED_FRAGMENT not in text:
        print(
            "check_schemathesis_light_auth_paths: missing auth/admin include-path-regex in api-schemathesis-light",
            file=sys.stderr,
        )
        return 1

    print("check_schemathesis_light_auth_paths: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
