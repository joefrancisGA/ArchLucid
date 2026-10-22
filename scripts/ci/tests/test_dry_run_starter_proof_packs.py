"""Tests for scripts/ci/dry_run_starter_proof_packs.py."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


class TestDryRunStarterProofPacks(unittest.TestCase):
    def test_repo_packs_pass_python_gate(self) -> None:
        script = _repo_root() / "scripts" / "ci" / "dry_run_starter_proof_packs.py"
        result = subprocess.run(
            [sys.executable, str(script)],
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)


if __name__ == "__main__":
    unittest.main()
