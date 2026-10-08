"""Tests for private-beta access-path coverage inventory."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

CI_ROOT = Path(__file__).resolve().parents[1]

if str(CI_ROOT) not in sys.path:
    sys.path.insert(0, str(CI_ROOT))

import check_private_beta_access_coverage as sut


class TestPrivateBetaAccessCoverage(unittest.TestCase):
    def test_repository_inventory_passes(self) -> None:
        self.assertEqual(sut.collect_violations(sut.REPO_ROOT), [])

    def test_missing_marker_is_reported(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / sut.SCENARIO_MARKERS[0][0]
            path.parent.mkdir(parents=True)
            path.write_text("OIDC callback failure", encoding="utf-8")

            violations = sut.collect_violations(root)

        self.assertTrue(any("missing coverage markers" in violation for violation in violations))


if __name__ == "__main__":
    unittest.main()
