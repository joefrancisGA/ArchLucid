"""Unit tests for check_roi_surface_consistency.py (T2-3)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
CI = REPO_ROOT / "scripts" / "ci"

import sys

sys.path.insert(0, str(CI))

from check_roi_surface_consistency import check_docs, check_scope_labeler_source  # noqa: E402


class CheckRoiSurfaceConsistencyTests(unittest.TestCase):
    def test_repo_docs_and_labeler_pass(self) -> None:
        doc_errors = check_docs(REPO_ROOT)
        labeler_errors = check_scope_labeler_source(REPO_ROOT)
        self.assertEqual([], doc_errors, msg="\n".join(doc_errors))
        self.assertEqual([], labeler_errors, msg="\n".join(labeler_errors))


if __name__ == "__main__":
    unittest.main()
