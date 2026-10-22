"""Tests for data consistency readiness summary."""

from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT / "scripts" / "ci") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "scripts" / "ci"))

from report_data_consistency_mode_readiness import build_summary  # noqa: E402


def test_alert_mode_is_detection_only() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        appsettings = Path(tmp) / "appsettings.Production.json"
        appsettings.write_text(
            json.dumps({"DataConsistency": {"Enforcement": {"Mode": "Alert"}}}),
            encoding="utf-8",
        )

        summary = build_summary(production_appsettings=appsettings, probe_fixture=None)

    assert summary["configuredMode"] == "ALERT"
    assert summary["detectionOnlySignals"] is True
    assert summary["quarantineCapable"] is False


def test_quarantine_mode_is_quarantine_capable() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        appsettings = Path(tmp) / "appsettings.Production.json"
        appsettings.write_text(
            json.dumps({"DataConsistency": {"Enforcement": {"Mode": "Quarantine"}}}),
            encoding="utf-8",
        )

        summary = build_summary(production_appsettings=appsettings, probe_fixture=None)

    assert summary["configuredMode"] == "QUARANTINE"
    assert summary["quarantineCapable"] is True
