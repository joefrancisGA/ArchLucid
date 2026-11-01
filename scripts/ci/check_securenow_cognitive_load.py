#!/usr/bin/env python3
"""Validate SecureNow first-review next-action and terminology contracts."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

TERMINOLOGY = Path("docs/securenow/COGNITIVE_LOAD_TERMINOLOGY.md")
WORK_SUMMARY = Path("archlucid-ui/src/components/product-line/SecureNowHomeWorkSummary.tsx")
ENVIRONMENT_CONTEXT = Path("archlucid-ui/src/components/product-line/SecureNowHomeEnvironmentContext.tsx")
FIRST_HOUR_COPY = Path("archlucid-ui/src/lib/product-line/securenow-first-hour-copy.ts")
PATH_INSPECT_COPY = Path("archlucid-ui/src/lib/product-line/securenow-path-inspect-copy.ts")

CANONICAL_NOUNS = (
    "capture",
    "ranked path",
    "Path inspect",
    "cut point",
    "question",
    "verification",
    "sponsor packaging",
)

FORBIDDEN = (
    "missing capture is clean",
    "stale capture is verified",
    "automatically remediated",
)


def _read(root: Path, relative: Path, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        errors.append(f"missing {relative}")
        return ""
    return path.read_text(encoding="utf-8")


def validate(root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    terminology = _read(root, TERMINOLOGY, errors)
    work_summary = _read(root, WORK_SUMMARY, errors)
    environment_context = _read(root, ENVIRONMENT_CONTEXT, errors)
    first_hour_copy = _read(root, FIRST_HOUR_COPY, errors)
    path_inspect_copy = _read(root, PATH_INSPECT_COPY, errors)

    for noun in CANONICAL_NOUNS:
        if f"| `{noun}` |" not in terminology:
            errors.append(f"{TERMINOLOGY}: missing canonical noun {noun!r}")

    for token in (
        "None assigned to you. Open Priorities & waves",
        "No critical exposure. Open Priorities & waves",
        "No comparison yet. Collect another snapshot",
        "None waiting for a check. Stop until a later capture",
        "Check collection status and try again",
    ):
        if token not in work_summary:
            errors.append(f"{WORK_SUMMARY}: missing next-action token {token!r}")

    for token in ("No collection yet", "Check cloud connections and try again", "Check cloud connections"):
        if token not in environment_context:
            errors.append(f"{ENVIRONMENT_CONTEXT}: missing next-action token {token!r}")

    for relative, text in (
        (FIRST_HOUR_COPY, first_hour_copy),
        (PATH_INSPECT_COPY, path_inspect_copy),
        (TERMINOLOGY, terminology),
        (WORK_SUMMARY, work_summary),
        (ENVIRONMENT_CONTEXT, environment_context),
    ):
        lowered = text.lower()
        for phrase in FORBIDDEN:
            if phrase in lowered:
                errors.append(f"{relative}: contains forbidden phrase {phrase!r}")

    return errors


def main() -> int:
    errors = validate()
    for error in errors:
        print(error)
    if errors:
        return 1
    print("SecureNow cognitive load: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
