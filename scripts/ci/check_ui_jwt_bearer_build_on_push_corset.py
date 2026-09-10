#!/usr/bin/env python3
"""Master/main push corset must compile the Operator UI with jwt-bearer client env."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_PUSH_REL = ".github/workflows/ui-typecheck-on-push.yml"
_JOB_NAME = "Operator UI: jwt-bearer production build (blocking)"
_JWT_BEARER_ENV_MARKERS = (
    "NEXT_PUBLIC_ARCHLUCID_AUTH_MODE: jwt-bearer",
    "NEXT_PUBLIC_ARCHLUCID_AUTH_MODE=jwt-bearer",
)
_E2E_DEMO_MARKER = "NEXT_PUBLIC_E2E_ALLOW_DEMO_BLOCKED_ROUTES"
_LOCKFILE_GUARD = "check_npm_overrides_lockfile_sync.py"
_QUERY_CORE_ASSERT = "assert_single_npm_dependency_version.py @tanstack/query-core"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    push_path = root / _PUSH_REL
    errors: list[str] = []

    if not push_path.is_file():
        errors.append(f"missing {_PUSH_REL}")
    else:
        text = push_path.read_text(encoding="utf-8", errors="replace")

        if "push:" not in text:
            errors.append(f"{_PUSH_REL}: missing on.push trigger")

        if _JOB_NAME not in text:
            errors.append(f"{_PUSH_REL}: missing job name {_JOB_NAME}")

        if not any(marker in text for marker in _JWT_BEARER_ENV_MARKERS):
            errors.append(
                f"{_PUSH_REL}: {_JOB_NAME} must set NEXT_PUBLIC_ARCHLUCID_AUTH_MODE=jwt-bearer",
            )

        if _E2E_DEMO_MARKER not in text:
            errors.append(
                f"{_PUSH_REL}: {_JOB_NAME} must set {_E2E_DEMO_MARKER} "
                "(parity with private-beta-access-on-push build)",
            )

        if "npm run build:live-e2e" not in text:
            errors.append(
                f"{_PUSH_REL}: {_JOB_NAME} must use npm run build:live-e2e "
                "(parity with private-beta-access-on-push; skip build:docs-pdf)",
            )

        if _LOCKFILE_GUARD not in text:
            errors.append(
                f"{_PUSH_REL}: {_JOB_NAME} must run {_LOCKFILE_GUARD} before npm ci "
                "(parity with typecheck and private-beta lanes)",
            )

        if _QUERY_CORE_ASSERT not in text:
            errors.append(
                f"{_PUSH_REL}: {_JOB_NAME} must assert a single @tanstack/query-core version after npm ci",
            )

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_ui_jwt_bearer_build_on_push_corset: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
