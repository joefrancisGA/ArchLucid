#!/usr/bin/env python3
"""Compare private-beta contracts between a base ref and the RC34 release ref."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

WORKFLOW_PATH = ".github/workflows/private-beta-access-on-push.yml"
SPEC_PATH = "archlucid-ui/e2e/live-api-private-beta-access.spec.ts"
HELPER_PATH = "archlucid-ui/e2e/helpers/live-private-beta-access.ts"
REQUIRED_MARKERS = (
    "branches: [main, master, RC34]",
    "LIVE_E2E_PRIVATE_BETA_ACCESS",
    "live-api-private-beta-access.spec.ts",
)
REQUIRED_SPEC_MARKERS = ("TB-927", "JwtBearer", "getRunDetailsWithTransientRetries")
REQUIRED_HELPER_MARKERS = ("LIVE_JWT_TOKEN", "private-beta", "resolveLiveJwtMode")


def _show_ref(ref: str, path: str) -> str:
    result = subprocess.run(
        ["git", "show", f"{ref}:{path}"],
        check=False,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise ValueError(f"{ref}:{path} is unavailable: {result.stderr.strip()}")

    return result.stdout


def compare_refs(base_ref: str, release_ref: str) -> list[str]:
    issues: list[str] = []

    for ref in (base_ref, release_ref):
        try:
            workflow = _show_ref(ref, WORKFLOW_PATH)
            spec = _show_ref(ref, SPEC_PATH)
            helper = _show_ref(ref, HELPER_PATH)
        except ValueError as error:
            issues.append(str(error))
            continue

        for marker in REQUIRED_MARKERS:
            if marker not in workflow:
                issues.append(f"{ref}:{WORKFLOW_PATH} is missing marker: {marker}")

        for marker in REQUIRED_SPEC_MARKERS:
            if marker not in spec:
                issues.append(f"{ref}:{SPEC_PATH} is missing marker: {marker}")

        for marker in REQUIRED_HELPER_MARKERS:
            if marker not in helper:
                issues.append(f"{ref}:{HELPER_PATH} is missing marker: {marker}")

    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-ref", default="origin/master")
    parser.add_argument("--release-ref", default="origin/RC34")
    args = parser.parse_args()
    issues = compare_refs(args.base_ref, args.release_ref)

    if issues:
        for issue in issues:
            print(f"ERROR: {issue}", file=sys.stderr)

        return 1

    print(f"Private-beta ref parity: PASS ({args.base_ref} vs {args.release_ref})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
