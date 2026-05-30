"""Tests for custom-handler extensibility readiness guard (improvement #27)."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


def _load_module(relative_path: str, module_name: str):
    script_path = REPO_ROOT / relative_path
    spec = importlib.util.spec_from_file_location(module_name, script_path)

    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {relative_path}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class CustomHandlerExtensibilityReadinessTests(unittest.TestCase):
    def test_guard_passes_for_current_repo(self) -> None:
        module = _load_module(
            "scripts/ci/check_custom_handler_extensibility_readiness.py",
            "check_custom_handler_extensibility_readiness",
        )
        violations = module.custom_handler_extensibility_violations(REPO_ROOT)
        self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
