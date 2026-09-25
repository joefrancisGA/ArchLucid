"""Unit tests for check_eslint_disable_reasons.py."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parents[1]
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

import check_eslint_disable_reasons as sut


class CheckEslintDisableReasonsTests(unittest.TestCase):
    def test_accepts_documented_suppression(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "sample.ts").write_text(
                "// eslint-disable-next-line no-console -- this fixture verifies logging\n",
                encoding="utf-8",
            )
            self.assertEqual(sut.find_missing_reasons(root), [])

    def test_rejects_undocumented_suppression(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "sample.ts").write_text("/* eslint-disable no-console */\n", encoding="utf-8")
            hits = sut.find_missing_reasons(root)
            self.assertEqual(len(hits), 1)
            self.assertEqual(hits[0][1], 1)


if __name__ == "__main__":
    unittest.main()
