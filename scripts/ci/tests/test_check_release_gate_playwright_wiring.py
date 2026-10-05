"""Unit tests for check_release_gate_playwright_wiring.py."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCheckReleaseGatePlaywrightWiring(unittest.TestCase):
    def test_guard_passes_on_repo(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "ci" / "check_release_gate_playwright_wiring.py"),
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(
            result.returncode,
            0,
            msg=result.stdout + result.stderr,
        )

    def test_release_workflow_restarts_api_after_enterprise_grant(self) -> None:
        text = (REPO_ROOT / ".github/workflows/rc-release-gate.yml").read_text(encoding="utf-8")
        grant = text.find("grant_ci_live_e2e_enterprise_tenant.sh")
        restart = text.find("Restart API after Enterprise grant")
        ready = text.find("wait-for-api-ready.sh", restart)

        self.assertGreaterEqual(grant, 0)
        self.assertGreater(restart, grant)
        self.assertGreater(ready, restart)
        restart_text = text[restart:ready]
        for marker in ('cat "${RUNNER_TEMP}/', "pkill -TERM -P", 'kill "${API_PID}"', "nohup dotnet run --no-build"):
            self.assertIn(marker, restart_text)

    def test_release_workflow_writes_workspace_digest(self) -> None:
        text = (REPO_ROOT / ".github/workflows/rc-release-gate.yml").read_text(encoding="utf-8")

        self.assertIn("report_release_gate_playwright_workspace_digest.py", text)
        self.assertIn("RELEASE_GATE_PLAYWRIGHT_JSON:", text)


if __name__ == "__main__":
    unittest.main()
