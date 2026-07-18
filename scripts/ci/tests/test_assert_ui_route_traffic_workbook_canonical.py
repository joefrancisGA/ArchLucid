"""Unit tests for the route-traffic workbook canonical guard."""

from __future__ import annotations

import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT / "scripts" / "ci") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "scripts" / "ci"))

from assert_ui_route_traffic_workbook_canonical import assert_workbook_canonical  # noqa: E402
from archlucid_ui_route_traffic_table import TEMPLATE_DOC  # noqa: E402


def test_tracked_template_matches_canonical_catalog() -> None:
    errors = assert_workbook_canonical(TEMPLATE_DOC)
    assert errors == [], "\n".join(errors)
