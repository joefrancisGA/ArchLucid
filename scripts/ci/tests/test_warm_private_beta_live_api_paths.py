"""Unit tests for warm_private_beta_live_api_paths.sh invite-wave skip behavior."""

from __future__ import annotations

import subprocess
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
WARM_SCRIPT = REPO_ROOT / "scripts" / "ci" / "warm_private_beta_live_api_paths.sh"


class TestWarmPrivateBetaLiveApiPaths(unittest.TestCase):
    def test_invite_wave_mode_skips_draft_and_create_run_warm(self) -> None:
        script_text = WARM_SCRIPT.read_text(encoding="utf-8")

        self.assertIn("LIVE_E2E_PRIVATE_BETA_ACCESS=1", script_text)
        self.assertIn("Skipping draft inventory and create-run shell warm", script_text)
        self.assertNotIn("warm_path_post_optional \\", script_text)

    def test_script_syntax_is_valid(self) -> None:
        result = subprocess.run(
            ["bash", "-n", str(WARM_SCRIPT)],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, msg=result.stderr)


if __name__ == "__main__":
    unittest.main()
