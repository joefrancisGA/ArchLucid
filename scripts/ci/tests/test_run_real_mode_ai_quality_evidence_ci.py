"""Integration tests for scripts/ci/run_real_mode_ai_quality_evidence_ci.sh."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "ci" / "run_real_mode_ai_quality_evidence_ci.sh"
BUDGET_PROBE = REPO_ROOT / "scripts" / "golden_cohort_budget_probe.py"


def _bash_available() -> bool:
    return shutil.which("bash") is not None


def _bash_path(path: Path) -> str:
    return path.resolve().as_posix()


def _bash_can_run_repo_script() -> bool:
    if os.name != "nt":
        return True

    probe = subprocess.run(
        ["bash", "-lc", f"test -f '{SCRIPT.as_posix()}'"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    return probe.returncode == 0


class RunRealModeAiQualityEvidenceCiTests(unittest.TestCase):
    def setUp(self) -> None:
        if not _bash_available():
            self.skipTest("bash not on PATH")

        if not SCRIPT.is_file():
            self.skipTest(f"missing script: {SCRIPT}")

        if not _bash_can_run_repo_script():
            self.skipTest("bash cannot resolve repo script path on this host (Linux CI covers integration)")

    def test_committed_exemplar_profile_writes_summary_artifact(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output_dir = Path(tmp) / "evidence"
            result = subprocess.run(
                ["bash", "-lc", f"bash '{_bash_path(SCRIPT)}' --output-dir '{_bash_path(output_dir)}'"],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )

            self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)

            summary_path = output_dir / "ai-quality-release-summary.json"
            self.assertTrue(summary_path.is_file(), msg=result.stderr or result.stdout)

            summary = json.loads(summary_path.read_text(encoding="utf-8"))
            self.assertEqual(summary["schema"], "archlucid.ai-quality-release-summary.v1")
            self.assertIn(summary["rollup"], {"PASS", "PARTIAL", "WARN"})

            gate_path = output_dir / "real-llm-evidence-gate.json"
            self.assertTrue(gate_path.is_file())
            gate = json.loads(gate_path.read_text(encoding="utf-8"))
            self.assertEqual(gate["executionMode"], "committed-exemplar")
            self.assertEqual(gate["overallOutcome"], "PASS")

    def test_budget_kill_switch_skips_live_invoke(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output_dir = Path(tmp) / "evidence"
            env = os.environ.copy()
            env.pop("ARCHLUCID_GOLDEN_COHORT_BUDGET_PROBE_SIMULATE_MTD_USD", None)

            result = subprocess.run(
                [
                    "bash",
                    "-lc",
                    (
                        f"bash '{_bash_path(SCRIPT)}' --output-dir '{_bash_path(output_dir)}' "
                        "--invoke-live-when-budget-allows --budget-probe-simulate-mtd-usd 14.50"
                    ),
                ],
                cwd=REPO_ROOT,
                env=env,
                capture_output=True,
                text=True,
                check=False,
            )

            self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)
            self.assertIn("live_invoke_skipped=budget_probe_2", (output_dir / "budget-probe-summary.txt").read_text(encoding="utf-8"))
            self.assertFalse((output_dir / "real-llm-evidence-gate-live.json").exists())

            committed_gate = json.loads((output_dir / "real-llm-evidence-gate.json").read_text(encoding="utf-8"))
            self.assertEqual(committed_gate["executionMode"], "committed-exemplar")


class GoldenCohortBudgetProbeSimulateTests(unittest.TestCase):
    def test_simulated_kill_threshold_returns_exit_two(self) -> None:
        if not BUDGET_PROBE.is_file():
            self.skipTest("budget probe missing")

        env = os.environ.copy()
        env["ARCHLUCID_GOLDEN_COHORT_BUDGET_PROBE_SIMULATE_MTD_USD"] = "14.50"

        result = subprocess.run(
            [sys.executable, str(BUDGET_PROBE), "--usage-ledger", str(REPO_ROOT / "tests/golden-cohort/usage-mtd.json")],
            cwd=REPO_ROOT,
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 2, msg=result.stderr or result.stdout)


if __name__ == "__main__":
    unittest.main()
