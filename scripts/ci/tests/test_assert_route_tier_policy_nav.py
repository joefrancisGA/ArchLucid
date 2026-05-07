"""Smoke test: route/tier/policy/nav registry check runs cleanly."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parents[1]
if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from assert_route_tier_policy_nav import repo_root, run_check


class TestAssertRouteTierPolicyNav(unittest.TestCase):
    def test_run_check_succeeds_in_repo(self) -> None:
        root = repo_root()
        self.assertTrue((root / "ArchLucid.Api").is_dir())

        errors = run_check(root)
        self.assertEqual(errors, [], msg=";\n".join(errors))


if __name__ == "__main__":
    unittest.main()
