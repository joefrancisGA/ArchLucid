"""Unit tests for check_live_e2e_simulator_azure_openai_env.py."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parents[1]
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

import check_live_e2e_simulator_azure_openai_env as sut

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCheckLiveE2eSimulatorAzureOpenaiEnv(unittest.TestCase):
    def test_guard_covers_rc_gate_and_nightly_workflows(self) -> None:
        self.assertIn(".github/workflows/rc-release-gate.yml", sut._WORKFLOW_PATHS)
        self.assertIn(".github/workflows/live-e2e-nightly.yml", sut._WORKFLOW_PATHS)

    def test_check_workflow_requires_empty_azure_openai_on_simulator_start(self) -> None:
        errors: list[str] = []
        block = (
            "      - name: Start ArchLucid.Api (background)\n"
            "        env:\n"
            "          AgentExecution__Mode: Simulator\n"
            "        run: echo start\n"
        )

        sut._check_workflow("rc-release-gate.yml", block, errors)

        self.assertTrue(any("AzureOpenAI__Endpoint" in error for error in errors))

    def test_check_workflow_accepts_empty_azure_openai_on_simulator_start(self) -> None:
        errors: list[str] = []
        block = (
            "      - name: Start ArchLucid.Api (background)\n"
            "        env:\n"
            "          AgentExecution__Mode: Simulator\n"
            '          AzureOpenAI__Endpoint: ""\n'
            '          AzureOpenAI__ApiKey: ""\n'
            '          AzureOpenAI__DeploymentName: ""\n'
            '          AzureOpenAI__EmbeddingDeploymentName: ""\n'
            "        run: echo start\n"
        )

        sut._check_workflow("rc-release-gate.yml", block, errors)

        self.assertEqual(errors, [])

    def test_guard_passes_on_repo(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "ci" / "check_live_e2e_simulator_azure_openai_env.py"),
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
