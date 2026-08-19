"""ADR 0037 tenant isolation defense-in-depth guard tests."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TenantIsolationDefenseInDepthGuardTests(unittest.TestCase):
    def test_assert_tenant_isolation_defense_in_depth_passes(self) -> None:
        script = REPO_ROOT / "scripts/ci/assert_tenant_isolation_defense_in_depth.py"
        proc = subprocess.run(
            [sys.executable, str(script)],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(
            0,
            proc.returncode,
            msg=proc.stdout + proc.stderr,
        )


if __name__ == "__main__":
    unittest.main()
