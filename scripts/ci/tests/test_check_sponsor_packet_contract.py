"""Unit tests for check_sponsor_packet_contract.py (T2-1)."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class CheckSponsorPacketContractTests(unittest.TestCase):
    def test_contract_script_passes_on_repo(self) -> None:
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "scripts" / "ci" / "check_sponsor_packet_contract.py")],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(0, result.returncode, msg=result.stderr or result.stdout)


if __name__ == "__main__":
    unittest.main()
