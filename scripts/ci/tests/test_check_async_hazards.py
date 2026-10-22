"""Unit tests for check_async_hazards.py."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parents[1]
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

import check_async_hazards as sut


class CheckAsyncHazardsTests(unittest.TestCase):
    def test_accepts_awaitable_method(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "Service.cs").write_text("public async Task RunAsync() => await Task.CompletedTask;\n", encoding="utf-8")
            self.assertEqual(sut.find_async_hazards(root), [])

    def test_rejects_blocking_wait(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "Service.cs").write_text("task.Wait();\n", encoding="utf-8")
            self.assertEqual(sut.find_async_hazards(root)[0][3], "blocking Task.Wait call")

    def test_rejects_async_void(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "Service.cs").write_text("public async void Fire() {}\n", encoding="utf-8")
            self.assertEqual(sut.find_async_hazards(root)[0][3], "async void method")

    def test_skips_test_projects(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            test_dir = root / "Example.Tests"
            test_dir.mkdir()
            (test_dir / "ServiceTests.cs").write_text("task.Wait();\n", encoding="utf-8")
            self.assertEqual(sut.find_async_hazards(root), [])


if __name__ == "__main__":
    unittest.main()
