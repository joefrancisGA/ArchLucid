"""Tests for first-pilot performance baseline reporter."""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


def _load_module():
    path = REPO_ROOT / "scripts" / "ci" / "report_first_pilot_performance_baseline.py"
    spec = importlib.util.spec_from_file_location("report_first_pilot_performance_baseline", path)
    module = importlib.util.module_from_spec(spec)
    if spec.loader is None:
        raise RuntimeError("loader missing")
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_build_summary_marks_missing_steps_not_run() -> None:
    module = _load_module()
    summary = module.build_summary(
        timings={"health_ready": 120, "create_run": 450},
        meta={"baseUrl": "http://localhost:5128"},
    )

    assert summary["disposition"] == "COLLECTED"
    assert summary["totalElapsedMs"] == 570

    not_run = [row for row in summary["steps"] if row["status"] == "NOT_RUN"]

    assert len(not_run) >= 1
    assert all(row["elapsedMs"] is None for row in not_run)


def test_render_markdown_includes_not_load_test_wording() -> None:
    module = _load_module()
    body = module.render_markdown({"disposition": "NOT_COLLECTED", "steps": [], "totalElapsedMs": None, "sourcePath": None, "baseUrl": None, "runId": None, "evidenceClass": "x"})

    assert "Not a load test" in body
