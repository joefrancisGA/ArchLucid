"""Unit tests for the in-tenant SecureNow name guard."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


def _load():
    path = Path(__file__).resolve().parent.parent / "assert_securenow_in_tenant_names.py"
    spec = importlib.util.spec_from_file_location("assert_securenow_in_tenant_names", path)

    if spec is None or spec.loader is None:
        raise RuntimeError("Could not load assert_securenow_in_tenant_names.py")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class AssertSecureNowInTenantNamesTests(unittest.TestCase):
    def test_repo_root_passes(self) -> None:
        module = _load()
        root = Path(__file__).resolve().parents[3] / "infra" / "terraform-securenow-in-tenant"
        self.assertEqual(module.name_violations(root), [])

    def test_missing_root_fails(self) -> None:
        module = _load()
        failures = module.name_violations(Path("/tmp/does-not-exist-securenow-root"))
        self.assertTrue(any("missing Terraform root" in failure for failure in failures))


if __name__ == "__main__":
    unittest.main()
