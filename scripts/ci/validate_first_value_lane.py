#!/usr/bin/env python3
"""Validate first-value lane docs, UI terminology, and regression anchors stay aligned."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]
_LANE_DOC = _REPO / "docs" / "runbooks" / "FIRST_VALUE_LANE.md"
_UI_LIB = _REPO / "archlucid-ui" / "src" / "lib" / "first-pilot-operating-rail-steps.ts"
_UI_PANEL = _REPO / "archlucid-ui" / "src" / "components" / "usability" / "PilotCommandCenterCard.tsx"
_BUILDER_TESTS = _REPO / "ArchLucid.Application.Tests" / "Pilots" / "FirstValueReportBuilderTests.cs"

_REQUIRED_DOC_PHRASES = (
    "First-value lane",
    "Not started",
    "In progress",
    "Completed",
    "Blocked",
    "validate_first_value_lane.py",
)

_REQUIRED_UI_PHRASES = (
    "FIRST_PILOT_OPERATING_RAIL_STEPS",
    "create-review",
    "sponsor-packet",
    "verify-setup",
    "execute-review",
    "finalize-package",
)

_REQUIRED_TEST_ANCHORS = (
    "Decision delta (recommended changes)",
    "Novelty confidence",
)


def _fail(errors: list[str]) -> int:
    for error in errors:
        print(error, file=sys.stderr)

    return 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    errors: list[str] = []

    for path in (_LANE_DOC, _UI_LIB, _UI_PANEL, _BUILDER_TESTS):
        if not path.is_file():
            errors.append(f"missing required path: {path.relative_to(_REPO).as_posix()}")

    if errors:
        return _fail(errors)

    lane_text = _LANE_DOC.read_text(encoding="utf-8")

    for phrase in _REQUIRED_DOC_PHRASES:
        if phrase not in lane_text:
            errors.append(f"FIRST_VALUE_LANE.md missing phrase: {phrase!r}")

    ui_lib_text = _UI_LIB.read_text(encoding="utf-8")

    for phrase in _REQUIRED_UI_PHRASES:
        if phrase not in ui_lib_text:
            errors.append(f"first-pilot-operating-rail-steps.ts missing phrase: {phrase!r}")

    if "PilotCommandCenterCard" not in _UI_PANEL.read_text(encoding="utf-8"):
        errors.append("PilotCommandCenterCard.tsx must define PilotCommandCenterCard")

    home_view = _REPO / "archlucid-ui" / "src" / "app" / "(operator)" / "_sections" / "OperatorHomePageView.tsx"

    if "PilotCommandCenterCardDeferred" not in home_view.read_text(encoding="utf-8"):
        errors.append("Operator home must wire PilotCommandCenterCardDeferred")

    builder_tests = _BUILDER_TESTS.read_text(encoding="utf-8")

    for anchor in _REQUIRED_TEST_ANCHORS:
        if anchor not in builder_tests:
            errors.append(f"FirstValueReportBuilderTests missing sponsor section anchor: {anchor!r}")

    if errors:
        return _fail(errors)

    print("validate_first_value_lane: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
