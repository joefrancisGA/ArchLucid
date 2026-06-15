"""Tests for architecture invariant RC enforcement summary."""

from __future__ import annotations

import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT / "scripts" / "ci") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "scripts" / "ci"))

from report_architecture_invariant_enforcement import build_summary, load_registry  # noqa: E402


def test_registry_loads_and_flags_p0_attention() -> None:
    registry = load_registry(_REPO_ROOT)
    summary = build_summary(registry)

    assert summary["schema"] == "archlucid.architecture-invariant-rc-summary.v1"
    assert summary["p0OpenCount"] >= 1
    assert summary["disposition"] in {"WARN", "HOLD"}
    assert any(row["id"] == "INV-001" for row in summary["attentionItems"])
