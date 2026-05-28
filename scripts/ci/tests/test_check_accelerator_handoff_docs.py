"""Tests for Specialty accelerator handoff acceptance checks."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


def _load_module():
    path = REPO_ROOT / "scripts" / "ci" / "check_accelerator_handoff_docs.py"
    spec = importlib.util.spec_from_file_location("check_accelerator_handoff_docs", path)
    module = importlib.util.module_from_spec(spec)
    if spec.loader is None:
        raise RuntimeError("loader missing")
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_run_checks_passes_on_repo() -> None:
    module = _load_module()
    violations = module.run_checks(REPO_ROOT)

    assert violations == []


def test_scan_v11_requirements_allows_optional_markers() -> None:
    module = _load_module()
    text = "Jira connector is not required for V1 pilot success.\n"
    violations = module._scan_v11_requirements(Path("sample.md"), text)

    assert violations == []


def test_scan_v11_requirements_flags_required_connector_wording() -> None:
    module = _load_module()
    text = "This walkthrough requires Jira connector setup before commit.\n"
    violations = module._scan_v11_requirements(Path("sample.md"), text)

    assert len(violations) == 1
