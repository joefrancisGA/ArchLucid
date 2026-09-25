"""Unit tests for check_direct_clock_access.py."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parents[1]
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

import check_direct_clock_access as sut


class CheckDirectClockAccessTests(unittest.TestCase):
    def test_accepts_time_provider_usage(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "ClockedService.cs").write_text("timeProvider.GetUtcNow();\n", encoding="utf-8")
            self.assertEqual(sut.find_direct_clock_access(root), [])

    def test_rejects_direct_clock_usage(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "ClockedService.cs").write_text("var now = DateTime.UtcNow;\n", encoding="utf-8")
            hits = sut.find_direct_clock_access(root)
            self.assertEqual(len(hits), 1)
            self.assertEqual(hits[0][1], 1)

    def test_skips_test_projects(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            test_dir = root / "Example.Tests"
            test_dir.mkdir()
            (test_dir / "ClockedServiceTests.cs").write_text("DateTime.UtcNow;\n", encoding="utf-8")
            self.assertEqual(sut.find_direct_clock_access(root), [])


if __name__ == "__main__":
    unittest.main()
