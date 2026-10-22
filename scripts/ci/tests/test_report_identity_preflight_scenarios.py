"""Tests for identity preflight scenario fixtures."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


def _load_module():
    path = REPO_ROOT / "scripts" / "ci" / "report_identity_preflight_scenarios.py"
    spec = importlib.util.spec_from_file_location("report_identity_preflight_scenarios", path)
    module = importlib.util.module_from_spec(spec)
    if spec.loader is None:
        raise RuntimeError("loader missing")
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_load_scenarios_from_repo_fixture() -> None:
    module = _load_module()
    fixture = REPO_ROOT / "scripts" / "ci" / "fixtures" / "identity-preflight-scenarios.json"
    scenarios = module.load_scenarios(fixture)

    assert len(scenarios) >= 5


def test_render_markdown_includes_oidc_runbook_link() -> None:
    module = _load_module()
    fixture = REPO_ROOT / "scripts" / "ci" / "fixtures" / "identity-preflight-scenarios.json"
    body = module.render_markdown(module.load_scenarios(fixture))

    assert "GENERIC_OIDC_SETUP.md" in body
    assert "No secrets" in body or "Redacted" in body
