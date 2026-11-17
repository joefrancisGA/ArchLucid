#!/usr/bin/env python3
"""Validate the SecureNow fixture-walk operator copy."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCENARIO_COPY = Path(
    "archlucid-ui/src/lib/product-line/securenow-scenario-walks-copy.ts"
)
SCENARIO_HOME_COPY = Path(
    "archlucid-ui/src/lib/product-line/securenow-scenario-home-copy.ts"
)

REQUIRED_IDS = (
    "public-storage-path",
    "collection-gap",
    "advisory-cut-no-write",
    "later-capture-not-verified",
    "contributor-role-between-snapshots",
)


def _read(root: Path, relative: Path, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        errors.append(f"missing {relative}")
        return ""
    return path.read_text(encoding="utf-8")


def validate(root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    copy = _read(root, SCENARIO_COPY, errors)
    home_copy = _read(root, SCENARIO_HOME_COPY, errors)

    if copy:
        for token in (*REQUIRED_IDS, "Not customer evidence", "NO_GO", "not a starter proof pack"):
            if token not in copy:
                errors.append(f"{SCENARIO_COPY}: missing {token!r}")
        if "later-capture-not-verified" in copy:
            later_row = copy.split("later-capture-not-verified", 1)[1]
            if "NOT VERIFIED" not in later_row:
                errors.append(f"{SCENARIO_COPY}: later-capture-not-verified must say NOT VERIFIED")
            if "verified clean" in later_row.lower():
                errors.append(f"{SCENARIO_COPY}: later-capture-not-verified claims verified clean")
            if "remediation succeeded" in later_row.lower():
                errors.append(f"{SCENARIO_COPY}: later-capture-not-verified claims remediation succeeded")
        if "$" in copy:
            errors.append(f"{SCENARIO_COPY}: contains '$'")
        if "customer outcome" in copy and "not a customer outcome" not in copy:
            errors.append(f"{SCENARIO_COPY}: contains an unqualified customer outcome claim")
        if "starter-proof-packs" in copy:
            errors.append(f"{SCENARIO_COPY}: references starter-proof-packs")
        if "READY_TO_PUBLISH" in copy:
            errors.append(f"{SCENARIO_COPY}: contains READY_TO_PUBLISH")

    if home_copy and "/administration/securenow-scenario-walks" not in home_copy:
        errors.append(f"{SCENARIO_HOME_COPY}: missing scenario-walks route")

    return errors


def main() -> int:
    errors = validate()
    for error in errors:
        print(error)
    if errors:
        return 1
    print("SecureNow scenario walks: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
