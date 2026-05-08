"""Unit tests for connector readiness matrix path guard."""
from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]


class TestAssertConnectorReadinessMatrixPaths(unittest.TestCase):
    def test_matrix_path_guard_repo_passes(self):
        script = _REPO / "scripts/ci/assert_connector_readiness_matrix_paths.py"
        result = subprocess.run(
            [sys.executable, str(script)],
            cwd=_REPO,
            check=False,
            capture_output=True,
            text=True,
        )

        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)


if __name__ == "__main__":
    unittest.main()
