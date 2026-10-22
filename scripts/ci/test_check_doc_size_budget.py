"""Unit tests for check_doc_size_budget.py."""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


class CheckDocSizeBudgetTests(unittest.TestCase):
    def test_under_budget_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "small.md"
            p.write_text("a\nb\n", encoding="utf-8")
            code = subprocess.run(
                [sys.executable, str(Path(__file__).resolve().parent / "check_doc_size_budget.py"), "--max-lines", "10", str(p)],
                capture_output=True,
                text=True,
                check=False,
            ).returncode

        self.assertEqual(code, 0)

    def test_over_budget_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "big.md"
            p.write_text("\n".join(["x"] * 12) + "\n", encoding="utf-8")
            code = subprocess.run(
                [sys.executable, str(Path(__file__).resolve().parent / "check_doc_size_budget.py"), "--max-lines", "5", str(p)],
                capture_output=True,
                text=True,
                check=False,
            ).returncode

        self.assertEqual(code, 1)


if __name__ == "__main__":
    unittest.main()
