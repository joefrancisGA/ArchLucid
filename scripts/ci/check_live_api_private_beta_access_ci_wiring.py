#!/usr/bin/env python3
"""Private-beta access path: canonical smoke must stay wired in ci.yml ui-e2e-live-beta-access."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_CI_REL = ".github/workflows/ci.yml"
_SPEC = "live-api-private-beta-access.spec.ts"
_JOB_MARKER = "ui-e2e-live-beta-access"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    ci_path = root / _CI_REL
    spec_path = root / "archlucid-ui" / "e2e" / _SPEC

    errors: list[str] = []

    if not spec_path.is_file():
        errors.append(f"missing private-beta access spec: archlucid-ui/e2e/{_SPEC}")

    if not ci_path.is_file():
        errors.append(f"missing {_CI_REL}")
    else:
        text = ci_path.read_text(encoding="utf-8", errors="replace")

        if _JOB_MARKER not in text:
            errors.append(f"{_CI_REL}: missing job marker {_JOB_MARKER}")

        if _SPEC not in text:
            errors.append(f"{_CI_REL}: missing {_SPEC} playwright invocation")

        if (
            "NEXT_PUBLIC_ARCHLUCID_AUTH_MODE: jwt-bearer" not in text
            and "NEXT_PUBLIC_ARCHLUCID_AUTH_MODE=jwt-bearer" not in text
        ):
            errors.append(
                f"{_CI_REL}: {_JOB_MARKER} must build with NEXT_PUBLIC_ARCHLUCID_AUTH_MODE=jwt-bearer",
            )

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_live_api_private_beta_access_ci_wiring: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
