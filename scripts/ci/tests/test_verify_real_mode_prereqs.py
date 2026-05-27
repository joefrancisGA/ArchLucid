from __future__ import annotations

import subprocess
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_SCRIPT = _REPO / "scripts" / "ci" / "verify_real_mode_prereqs.ps1"


class TestVerifyRealModePrereqs(unittest.TestCase):
    def test_script_runs_and_prints_skip_guidance(self):
        completed = subprocess.run(
            [
                "powershell",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(_SCRIPT),
                "-Profile",
                "CiLiveAoai",
            ],
            cwd=_REPO,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(completed.returncode, 0, completed.stderr or completed.stdout)
        self.assertIn("RealAzureOpenAIEndToEndTests", completed.stdout)
        self.assertIn("ARCHLUCID_CI_REAL_AOAI_ENABLED", completed.stdout)
        self.assertNotIn("sk-", completed.stdout.lower())


if __name__ == "__main__":
    unittest.main()
