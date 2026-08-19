"""Tests for scripts/ci/assert_multi_agent_failure_chaos_suite.py."""

from __future__ import annotations

import importlib.util
import subprocess
import sys
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "assert_multi_agent_failure_chaos_suite.py"
REPO_ROOT = Path(__file__).resolve().parents[3]
SUITE_TEST = (
    REPO_ROOT
    / "ArchLucid.Application.Tests"
    / "Orchestration"
    / "MultiAgentFailureModeChaosSuiteTests.cs"
)


def _load_module():
    spec = importlib.util.spec_from_file_location("assert_multi_agent_failure_chaos_suite", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules["assert_multi_agent_failure_chaos_suite"] = module
    spec.loader.exec_module(module)
    return module


class AssertMultiAgentFailureChaosSuiteTests(unittest.TestCase):
    def test_passes_when_inventory_present(self):
        module = _load_module()
        self.assertEqual(module.main([]), 0)

    def test_cli_entrypoint(self):
        completed = subprocess.run(
            [sys.executable, str(SCRIPT)],
            cwd=REPO_ROOT,
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertEqual(completed.returncode, 0, msg=completed.stderr or completed.stdout)

    def test_fails_when_suite_marker_missing(self):
        original = SUITE_TEST.read_text(encoding="utf-8")
        broken = original.replace("TB937_incomplete_quad_agent_batch", "TB937_missing_scenario", 1)
        SUITE_TEST.write_text(broken, encoding="utf-8")

        try:
            completed = subprocess.run(
                [sys.executable, str(SCRIPT)],
                cwd=REPO_ROOT,
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(completed.returncode, 1)
            self.assertIn("TB937", completed.stderr)
        finally:
            SUITE_TEST.write_text(original, encoding="utf-8")


if __name__ == "__main__":
    unittest.main()
