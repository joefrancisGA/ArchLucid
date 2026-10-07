"""Tests for the non-mutating tenant offboarding plan."""

from __future__ import annotations

import unittest

import sys
from pathlib import Path

CI_ROOT = Path(__file__).resolve().parents[1]

if str(CI_ROOT) not in sys.path:
    sys.path.insert(0, str(CI_ROOT))

import private_beta_offboarding_dry_run as sut


class TestPrivateBetaOffboardingDryRun(unittest.TestCase):
    def test_plan_is_tenant_scoped_and_non_mutating(self) -> None:
        plan = sut.build_plan("11111111-1111-1111-1111-111111111111", "operator-1")

        self.assertTrue(plan["dryRun"])
        self.assertEqual(plan["tenantId"], "11111111-1111-1111-1111-111111111111")
        self.assertEqual(len(plan["steps"]), 4)
        self.assertTrue(all(step["mutatesData"] is False for step in plan["steps"]))

    def test_invalid_tenant_id_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            sut.build_plan("not-a-guid", "operator-1")


if __name__ == "__main__":
    unittest.main()
