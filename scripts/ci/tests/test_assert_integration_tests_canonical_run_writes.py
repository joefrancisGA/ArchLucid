"""Unit tests for integration-test canonical run-write guard."""

from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path


def _load_module():
    path = Path(__file__).resolve().parents[1] / "assert_integration_tests_canonical_run_writes.py"
    spec = importlib.util.spec_from_file_location("assert_integration_tests_canonical_run_writes", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Could not load assert_integration_tests_canonical_run_writes.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class TestIntegrationTestsCanonicalRunWrites(unittest.TestCase):
    def test_flags_deprecated_request_path_in_integration_test(self) -> None:
        mod = _load_module()

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            test_file = root / "ArchLucid.Api.Tests" / "SampleIntegrationTests.cs"
            test_file.parent.mkdir(parents=True)
            test_file.write_text(
                'await Client.PostAsync("/v1/requests", content);\n',
                encoding="utf-8",
            )

            original_root = mod.REPO_ROOT
            mod.REPO_ROOT = root
            try:
                violations = mod.scan_integration_tests()
            finally:
                mod.REPO_ROOT = original_root

        self.assertEqual(len(violations), 1)
        self.assertIn("SampleIntegrationTests.cs", violations[0])

    def test_allows_canonical_architecture_request_path(self) -> None:
        mod = _load_module()

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            test_file = root / "ArchLucid.Api.Tests" / "GoodIntegrationTests.cs"
            test_file.parent.mkdir(parents=True)
            test_file.write_text(
                'await Client.PostAsync("/v1/architecture/request", content);\n',
                encoding="utf-8",
            )

            original_root = mod.REPO_ROOT
            mod.REPO_ROOT = root
            try:
                violations = mod.scan_integration_tests()
            finally:
                mod.REPO_ROOT = original_root

        self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
