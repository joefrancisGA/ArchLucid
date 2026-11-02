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
QUESTION_EMPTY_COPY = Path("archlucid-ui/src/lib/product-line/securenow-question-queue-empty-copy.ts")
QUESTION_QUEUE = Path("archlucid-ui/src/components/infra-evidence/SecureNowQuestionQueue.tsx")
WAVES_EMPTY_COPY = Path("archlucid-ui/src/lib/product-line/securenow-remediation-waves-empty-copy.ts")
REMEDIATION_WORKBENCH = Path(
    "archlucid-ui/src/app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchClient.tsx"
)
SHARED_WAVES_COPY = Path("archlucid-ui/src/lib/remediation-wave-list-copy.ts")

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
    question_empty_copy = _read(root, QUESTION_EMPTY_COPY, errors)
    question_queue = _read(root, QUESTION_QUEUE, errors)
    waves_empty_copy = _read(root, WAVES_EMPTY_COPY, errors)
    remediation_workbench = _read(root, REMEDIATION_WORKBENCH, errors)
    shared_waves_copy = _read(root, SHARED_WAVES_COPY, errors)

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
        (QUESTION_EMPTY_COPY, question_empty_copy),
        (QUESTION_QUEUE, question_queue),
        (WAVES_EMPTY_COPY, waves_empty_copy),
        (REMEDIATION_WORKBENCH, remediation_workbench),
        (SHARED_WAVES_COPY, shared_waves_copy),
    ):
        lowered = text.lower()
        for phrase in FORBIDDEN:
            if phrase in lowered:
                errors.append(f"{relative}: contains forbidden phrase {phrase!r}")

    if "An empty list is not a clean environment." not in question_empty_copy:
        errors.append("question queue empty state: missing 'An empty list is not a clean environment.'")
    if "Clear the filter" not in question_empty_copy:
        errors.append("question queue empty state: missing 'Clear the filter'")
    if "SECURENOW_QUESTION_QUEUE_EMPTY_FILTER" not in question_queue:
        errors.append(f"{QUESTION_QUEUE}: missing empty-state copy reference")
    if "A blank list is not a clean result." not in waves_empty_copy:
        errors.append(f"{WAVES_EMPTY_COPY}: missing blank-list boundary")
    for token in ('productLine === "security"', "SECURENOW_REMEDIATION_WAVES_EMPTY_LABEL", "REMEDIATION_WAVES_EMPTY_LABEL"):
        if token not in remediation_workbench:
            errors.append(f"{REMEDIATION_WORKBENCH}: missing {token!r}")
    if 'REMEDIATION_WAVES_EMPTY_LABEL = "No remediation waves yet."' not in shared_waves_copy:
        errors.append(f"{SHARED_WAVES_COPY}: shared empty label changed")

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
