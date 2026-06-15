"""TB-321: executable snapshot enforcer for route/tier/policy/nav registry."""

from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
GUARD = REPO_ROOT / "scripts" / "ci" / "assert_route_tier_policy_nav.py"
REGISTRY = REPO_ROOT / "scripts" / "ci" / "data" / "route_tier_policy_nav_registry.json"


class TestRouteTierPolicyNavSnapshotEnforcer(unittest.TestCase):
    def test_registry_snapshot_guard_passes(self) -> None:
        proc = subprocess.run(
            [sys.executable, str(GUARD)],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(0, proc.returncode, proc.stderr or proc.stdout)

    def test_registry_has_controller_surfaces(self) -> None:
        payload = json.loads(REGISTRY.read_text(encoding="utf-8"))
        entries = payload.get("entries", [])
        self.assertIsInstance(entries, list)
        self.assertGreater(len(entries), 100)
        self.assertTrue(any("Controller" in entry.get("class_name", "") for entry in entries))


if __name__ == "__main__":
    unittest.main()
