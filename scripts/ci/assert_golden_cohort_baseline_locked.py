#!/usr/bin/env python3
"""
Merge-blocking guard for golden-cohort baseline state.

When ``ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED`` is truthy (same semantics as the
.NET CLI / GitHub Actions string ``"true"``), every row in
``tests/golden-cohort/cohort.json`` must carry a **non-placeholder**
``expectedCommittedManifestSha256``.

This pairs with ``.github/workflows/golden-cohort-nightly.yml`` (drift job runs
only when the repository variable is set) so a PR cannot reintroduce all-zero
SHAs while the repo is marked locked.
"""

from __future__ import annotations

import json
import os
import pathlib
import re
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]

COHORT_REL = pathlib.Path("tests/golden-cohort/cohort.json")

# Must match ArchLucid.Application.GoldenCohort.GoldenCohortBaselineConstants.UnlockedManifestSha256Placeholder
PLACEHOLDER_SHA256 = "0" * 64

_SHA256_HEX = re.compile(r"^[0-9a-fA-F]{64}$")


def _is_truthy_locked(raw: str | None) -> bool:
    if raw is None:
        return False

    v = raw.strip()

    if not v:
        return False

    return v.lower() in ("1", "true", "yes")


def assert_cohort_locked_no_placeholders(cohort_path: pathlib.Path) -> list[str]:
    """Returns human-readable error lines; empty means success."""

    errors: list[str] = []

    if not cohort_path.is_file():
        errors.append(f"missing cohort file: {cohort_path}")
        return errors

    try:
        payload = json.loads(cohort_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as ex:
        errors.append(f"invalid JSON in {cohort_path}: {ex}")
        return errors

    items = payload.get("items")

    if not isinstance(items, list):
        errors.append("cohort.json: 'items' must be a list")
        return errors

    for index, row in enumerate(items):
        if not isinstance(row, dict):
            errors.append(f"items[{index}] must be an object")
            continue

        item_id = row.get("id", f"index-{index}")
        sha_raw = row.get("expectedCommittedManifestSha256")

        if not isinstance(sha_raw, str):
            errors.append(f"{item_id}: expectedCommittedManifestSha256 must be a string")
            continue

        sha = sha_raw.strip()

        if not sha:
            errors.append(f"{item_id}: expectedCommittedManifestSha256 is empty")
            continue

        if not _SHA256_HEX.match(sha):
            errors.append(f"{item_id}: expectedCommittedManifestSha256 must be 64 hex chars")
            continue

        if sha.lower() == PLACEHOLDER_SHA256:
            errors.append(
                f"{item_id}: expectedCommittedManifestSha256 is still the unlocked placeholder "
                f"({PLACEHOLDER_SHA256}). Run `archlucid golden-cohort lock-baseline --write` "
                "against a Simulator API host after owner approval, or clear "
                "ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED if intentionally unlocking."
            )

    return errors


def main() -> int:
    locked = _is_truthy_locked(
        # GitHub Actions passes "true" as a string in env; local shells may omit.
        os.environ.get("ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED")
    )

    if not locked:
        return 0

    cohort_path = REPO_ROOT / COHORT_REL
    errors = assert_cohort_locked_no_placeholders(cohort_path)

    if errors:
        print(
            "error: ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED is true but cohort.json "
            "fails the non-placeholder SHA guard:",
            file=sys.stderr,
        )

        for line in errors:
            print(f"  - {line}", file=sys.stderr)

        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
