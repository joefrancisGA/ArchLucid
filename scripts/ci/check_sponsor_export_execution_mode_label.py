#!/usr/bin/env python3
"""G1 hardening: sponsor Markdown export surfaces must use SponsorExecutionModeMarkdownFormatter."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_FORMATTER = "SponsorExecutionModeMarkdownFormatter"

# Markdown export composers that must delegate execution-mode copy to the shared formatter.
_REQUIRED_SURFACES: dict[str, tuple[str, ...]] = {
    "ArchLucid.Application/Exports/SponsorReviewPacketComposer.cs": (
        _FORMATTER,
        "AppendMarkdownSection",
    ),
    "ArchLucid.Application/Pilots/FirstValueReportSponsorStatusSectionFormatter.cs": (
        _FORMATTER,
        "FormatSponsorExecutionMode",
        "Execution mode",
    ),
    "ArchLucid.Application/Pilots/SponsorExecutionModeMarkdownFormatter.cs": (
        "## Execution mode",
        "FormatSponsorExecutionMode",
    ),
    "ArchLucid.Application.Tests/Exports/SponsorReviewPacketGoldenFixtureTests.cs": (
        "## Execution mode",
    ),
}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _missing_anchors(text: str, anchors: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    missing: list[str] = []

    for anchor in anchors:
        if anchor.lower() not in lowered:
            missing.append(anchor)

    return missing


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    errors: list[str] = []

    for rel_path, anchors in _REQUIRED_SURFACES.items():
        path = root / rel_path

        if not path.is_file():
            errors.append(f"missing sponsor export surface: {rel_path}")
            continue

        text = path.read_text(encoding="utf-8", errors="replace")
        missing = _missing_anchors(text, anchors)

        for anchor in missing:
            errors.append(f"{rel_path}: missing required anchor '{anchor}'")

    # Forbid ad-hoc execution-mode sections outside the formatter in export composers.
    forbidden_paths = [
        root / "ArchLucid.Application/Exports",
        root / "ArchLucid.Application/Pilots",
    ]

    for directory in forbidden_paths:
        if not directory.is_dir():
            continue

        for path in directory.rglob("*.cs"):
            if path.name == "SponsorExecutionModeMarkdownFormatter.cs":
                continue

            text = path.read_text(encoding="utf-8", errors="replace")

            if "## Execution mode" in text and _FORMATTER not in text:
                errors.append(
                    f"{path.relative_to(root)}: contains '## Execution mode' without {_FORMATTER}"
                )

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_sponsor_export_execution_mode_label: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
