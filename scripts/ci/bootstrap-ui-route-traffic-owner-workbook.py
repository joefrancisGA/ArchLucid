#!/usr/bin/env python3
"""Ensure the gitignored owner UI route traffic workbook exists."""

from __future__ import annotations

import sys

from archlucid_ui_route_traffic_table import OWNER_DOC, ensure_owner_workbook


def main() -> int:
    try:
        path = ensure_owner_workbook(migrate_legacy=True)
    except FileNotFoundError as exc:
        print(exc, file=sys.stderr)
        return 1

    if path.is_file():
        print(f"Owner workbook ready: {path}")
        return 0

    print(f"Failed to create owner workbook at {OWNER_DOC}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
