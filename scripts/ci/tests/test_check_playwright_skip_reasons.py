"""Unit tests for check_playwright_skip_reasons.py."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parents[1]
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

import check_playwright_skip_reasons as sut


class CheckPlaywrightSkipReasonsTests(unittest.TestCase):
    def test_accepts_skip_with_reason(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "sample.spec.ts").write_text(
                'test.skip(process.env.CI !== "true", "requires the live environment");\n',
                encoding="utf-8",
            )
            self.assertEqual(sut.find_missing_reasons(root), [])

    def test_rejects_bare_skip_and_fixme(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "sample.spec.ts").write_text("test.skip();\ntest.fixme( );\n", encoding="utf-8")
            hits = sut.find_missing_reasons(root)
            self.assertEqual([hit[1] for hit in hits], [1, 2])

    def test_rejects_bare_skip_split_across_lines(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "sample.spec.ts").write_text("test.skip(\n  );\n", encoding="utf-8")
            hits = sut.find_missing_reasons(root)
            self.assertEqual([hit[1] for hit in hits], [1])


if __name__ == "__main__":
    unittest.main()
