"""Tests for procurement deal-ready freshness summary."""

from __future__ import annotations

import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT / "scripts" / "ci") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "scripts" / "ci"))

from report_procurement_deal_ready_freshness import build_summary  # noqa: E402


def test_deferred_scope_docs_classified() -> None:
    summary = build_summary(_REPO_ROOT)
    deferred = [row for row in summary["documents"] if row["classification"] == "DEFERRED_SCOPE"]

    assert deferred
    assert all("deferred" in row["detail"].lower() for row in deferred)
