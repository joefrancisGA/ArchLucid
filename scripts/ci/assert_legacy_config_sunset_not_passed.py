#!/usr/bin/env python3
"""Fail CI when ArchLucidLegacyConfigurationWarnings sunset date has passed; warn within 90 days."""

from __future__ import annotations

import os
import re
import sys
from datetime import date
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _warnings_source_path() -> Path:
    override = os.environ.get("ARCHLUCID_LEGACY_SUNSET_SOURCE_FILE", "").strip()

    if override:
        return Path(override)

    return _repo_root() / "ArchLucid.Host.Core" / "Configuration" / "ArchLucidLegacyConfigurationWarnings.cs"


def _parse_sunset_date(source: str) -> date:
    match = re.search(
        r'LegacyConfigurationKeysHardEnforcementNoEarlierThan\s*=\s*"(\d{4}-\d{2}-\d{2})"',
        source,
    )

    if match is None:
        print(
            "ERROR: could not find LegacyConfigurationKeysHardEnforcementNoEarlierThan date in source",
            file=sys.stderr,
        )
        raise SystemExit(1)

    return date.fromisoformat(match.group(1))


def main() -> int:
    path = _warnings_source_path()

    if not path.is_file():
        print(f"ERROR: {path} not found", file=sys.stderr)
        return 1

    text = path.read_text(encoding="utf-8")
    sunset = _parse_sunset_date(text)
    today = date.today()

    if today > sunset:
        print(
            "ERROR: Legacy configuration sunset date has passed. Remove legacy key handling and update docs/CONFIG_BRIDGE_SUNSET.md.",
            file=sys.stderr,
        )
        print(f"  Sunset: {sunset.isoformat()}, today: {today.isoformat()}", file=sys.stderr)
        return 1

    days_left = (sunset - today).days

    if days_left <= 90:
        print(
            f"::warning::Legacy config hard-enforcement sunset in {days_left} day(s) ({sunset.isoformat()}). "
            "Plan removal of legacy ArchiForge* configuration reads."
        )

    print(f"Legacy config sunset check OK (sunset {sunset.isoformat()}, {days_left} day(s) remaining).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
