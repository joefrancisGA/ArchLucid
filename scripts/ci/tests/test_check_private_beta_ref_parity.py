"""Tests for private-beta ref parity checks."""

from __future__ import annotations

import unittest
from unittest.mock import patch

import sys
from pathlib import Path

CI_ROOT = Path(__file__).resolve().parents[1]

if str(CI_ROOT) not in sys.path:
    sys.path.insert(0, str(CI_ROOT))

import check_private_beta_ref_parity as sut


class TestPrivateBetaRefParity(unittest.TestCase):
    def test_accepts_required_contracts_on_both_refs(self) -> None:
        workflow = "\n".join(sut.REQUIRED_MARKERS)
        spec = "TB-927 JwtBearer"

        def fake_show(ref: str, path: str) -> str:
            return workflow if path == sut.WORKFLOW_PATH else spec

        with patch.object(sut, "_show_ref", side_effect=fake_show):
            self.assertEqual(sut.compare_refs("base", "release"), [])

    def test_reports_missing_ref_contract(self) -> None:
        with patch.object(sut, "_show_ref", side_effect=ValueError("missing")):
            issues = sut.compare_refs("base", "release")

        self.assertEqual(len(issues), 2)


if __name__ == "__main__":
    unittest.main()
