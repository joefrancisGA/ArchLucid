"""Tests for trial-to-paid test-mode evidence reporter."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


def _load_module():
    path = REPO_ROOT / "scripts" / "ci" / "report_trial_to_paid_test_mode_evidence.py"
    spec = importlib.util.spec_from_file_location("report_trial_to_paid_test_mode_evidence", path)
    module = importlib.util.module_from_spec(spec)
    if spec.loader is None:
        raise RuntimeError("loader missing")
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_collect_guard_status_passes_on_repo() -> None:
    module = _load_module()
    violations, notes = module.collect_guard_status(REPO_ROOT)

    assert violations == []
    assert notes


def test_render_markdown_includes_deferred_live_commerce() -> None:
    module = _load_module()
    body = module.render_markdown(disposition="PASS", violations=[], notes=["fixture note"])

    assert "Deferred (not V1 product failure)" in body
    assert "Live Stripe/Marketplace checkout" in body
    assert "fixture note" in body
