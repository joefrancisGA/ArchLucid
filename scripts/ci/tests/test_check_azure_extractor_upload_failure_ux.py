"""Tests for Azure extractor upload failure UX acceptance."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


def _load_module():
    path = REPO_ROOT / "scripts" / "ci" / "check_azure_extractor_upload_failure_ux.py"
    spec = importlib.util.spec_from_file_location("check_azure_extractor_upload_failure_ux", path)
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
