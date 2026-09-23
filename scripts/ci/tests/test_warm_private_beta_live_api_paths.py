"""Unit tests for warm_private_beta_live_api_paths.sh invite-wave skip behavior."""

from __future__ import annotations

import subprocess
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
WARM_SCRIPT = REPO_ROOT / "scripts" / "ci" / "warm_private_beta_live_api_paths.sh"


class TestWarmPrivateBetaLiveApiPaths(unittest.TestCase):
    def test_invite_wave_mode_skips_draft_and_gates_create_run_warm(self) -> None:
        script_text = WARM_SCRIPT.read_text(encoding="utf-8")

        self.assertIn("LIVE_E2E_PRIVATE_BETA_ACCESS=1", script_text)
        self.assertIn("Skipping draft inventory shell warm", script_text)
        self.assertIn("health/ready", script_text)
        self.assertIn("warm_path_post_optional \\", script_text)
        self.assertIn("warm_suffix=", script_text)
        self.assertIn("PrivateBetaPipelineWarm-${warm_suffix}", script_text)
        self.assertIn("HTTP 000", script_text)
        self.assertIn("Skipping remaining warms", script_text)
        self.assertIn("warm_status", script_text)
        self.assertIn("Optional warm skipped for ${label}", script_text)
        self.assertNotIn("Required warm failed because the API is unreachable", script_text)
        self.assertIn("refresh_private_beta_ci_jwt.sh", script_text)
        self.assertNotIn("Skipping draft inventory and create-run shell warm", script_text)

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
