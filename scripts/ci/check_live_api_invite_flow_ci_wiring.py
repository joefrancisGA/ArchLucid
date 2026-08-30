#!/usr/bin/env python3
"""Private-beta access path: live invite-flow e2e must stay wired in ci.yml JWT and ApiKey jobs."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_CI_REL = ".github/workflows/ci.yml"
_SPEC = "live-api-invite-flow.spec.ts"
_REQUIRED_JOB_MARKERS = (
    "ui-e2e-live-jwt",
    "ui-e2e-live-apikey",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    ci_path = root / _CI_REL

    if not ci_path.is_file():
        print(f"missing {_CI_REL}", file=sys.stderr)
        return 1

    text = ci_path.read_text(encoding="utf-8", errors="replace")
    errors: list[str] = []

    if _SPEC not in text:
        errors.append(f"{_CI_REL}: missing {_SPEC}")

    for marker in _REQUIRED_JOB_MARKERS:
        if marker not in text:
            errors.append(f"{_CI_REL}: missing job marker {marker}")

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_live_api_invite_flow_ci_wiring: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
