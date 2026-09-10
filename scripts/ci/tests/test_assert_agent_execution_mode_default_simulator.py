"""Tests for assert_agent_execution_mode_default_simulator.py (AS-085)."""

from __future__ import annotations

import importlib.util
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / "scripts" / "ci" / "assert_agent_execution_mode_default_simulator.py"


def load_module():
    spec = importlib.util.spec_from_file_location(
        "assert_agent_execution_mode_default_simulator",
        SCRIPT,
    )
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {SCRIPT}")

    module = importlib.util.module_from_spec(spec)
    sys.modules["assert_agent_execution_mode_default_simulator"] = module
    spec.loader.exec_module(module)

    return module


class AssertAgentExecutionModeDefaultSimulatorTests(unittest.TestCase):
    def test_script_passes_on_repo_defaults(self) -> None:
        completed = subprocess.run(
            [sys.executable, str(SCRIPT)],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(
            completed.returncode,
            0,
            msg=completed.stderr or completed.stdout,
        )

    def test_detector_flags_real_mode_in_default_json(self) -> None:
        module = load_module()

        self.assertTrue(
            module.contains_agent_execution_mode_real(
                '{"AgentExecution": {"Mode": "Real"}}',
            ),
        )
        self.assertTrue(
            module.contains_agent_execution_mode_simulator(
                '{"AgentExecution": {"Mode": "Simulator"}}',
            ),
        )
        self.assertFalse(
            module.contains_agent_execution_mode_real(
                '{"AgentExecution": {"Mode": "Simulator"}}',
            ),
        )


if __name__ == "__main__":
    unittest.main()
