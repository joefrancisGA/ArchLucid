"""Unit tests for check_sensitive_log_placeholders.py."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parents[1]
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

import check_sensitive_log_placeholders as sut


class CheckSensitiveLogPlaceholdersTests(unittest.TestCase):
    def test_accepts_provider_identifier(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "Service.cs").write_text('logger.LogWarning("Provider {Provider}", provider);\n', encoding="utf-8")
            self.assertEqual(sut.find_sensitive_log_placeholders(root), [])

    def test_rejects_secret_placeholder(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "Service.cs").write_text('logger.LogInformation("API key {ApiKey}", apiKey);\n', encoding="utf-8")
            self.assertEqual(len(sut.find_sensitive_log_placeholders(root)), 1)

    def test_skips_test_projects(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            test_dir = root / "Example.Tests"
            test_dir.mkdir()
            (test_dir / "ServiceTests.cs").write_text('logger.LogInformation("{Token}", token);\n', encoding="utf-8")
            self.assertEqual(sut.find_sensitive_log_placeholders(root), [])


if __name__ == "__main__":
    unittest.main()
