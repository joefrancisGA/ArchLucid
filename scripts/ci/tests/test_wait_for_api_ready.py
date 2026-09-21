"""Unit tests for wait-for-api-ready.sh readiness polling."""

from __future__ import annotations

import subprocess
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
WAIT_SCRIPT = REPO_ROOT / "scripts" / "ci" / "wait-for-api-ready.sh"


class TestWaitForApiReady(unittest.TestCase):
    def test_script_fail_fasts_consecutive_http_000(self) -> None:
        script_text = WAIT_SCRIPT.read_text(encoding="utf-8")

        self.assertIn("ARCHLUCID_API_READY_UNREACHABLE_FAIL_AFTER", script_text)
        self.assertIn("HTTP 000", script_text)
        self.assertIn("API process is not running", script_text)
        self.assertIn("unreachable_streak", script_text)
        self.assertIn('2>/dev/null || true)', script_text)
        self.assertNotIn('2>/dev/null || echo "000")', script_text)

    def test_active_api_process_does_not_increment_unreachable_streak(self) -> None:
        script_text = WAIT_SCRIPT.read_text(encoding="utf-8")

        self.assertIn("api_process_is_running", script_text)
        self.assertIn("if api_process_is_running; then", script_text)
        self.assertIn("unreachable_streak=0", script_text)

    def test_script_syntax_is_valid(self) -> None:
        result = subprocess.run(
            ["bash", "-n", str(WAIT_SCRIPT)],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, msg=result.stderr)


if __name__ == "__main__":
    unittest.main()
