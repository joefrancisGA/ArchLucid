"""Tests for route/tier/policy/nav git surface change detection."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

_CI_DIR = Path(__file__).resolve().parents[1]
if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from detect_route_tier_policy_nav_changes import (
    detect_changed_surfaces,
    path_matches_surface,
)


class TestDetectRouteTierPolicyNavChanges(unittest.TestCase):
    def test_path_matches_operator_nav_surface(self) -> None:
        self.assertTrue(path_matches_surface("archlucid-ui/src/lib/operator-nav/foo.ts"))

    def test_path_matches_registry_json(self) -> None:
        self.assertTrue(
            path_matches_surface("scripts/ci/data/route_tier_policy_nav_registry.json"),
        )

    def test_unrelated_path_does_not_match(self) -> None:
        self.assertFalse(path_matches_surface("docs/README.md"))

    @patch("detect_route_tier_policy_nav_changes.git_diff_name_only")
    def test_detect_changed_surfaces_flags_registry_edit(self, git_diff) -> None:
        git_diff.return_value = [
            "scripts/ci/data/route_tier_policy_nav_registry.json",
            "docs/README.md",
        ]

        payload = detect_changed_surfaces("origin/main")

        self.assertTrue(payload["surfaces_changed"])
        self.assertEqual(len(payload["changed_paths"]), 1)


if __name__ == "__main__":
    unittest.main()
