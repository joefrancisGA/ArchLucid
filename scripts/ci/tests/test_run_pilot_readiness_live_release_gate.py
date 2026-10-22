"""Tests for scripts/ci/run_pilot_readiness_live_release_gate.py."""

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
MODULE = REPO_ROOT / "scripts" / "ci" / "run_pilot_readiness_live_release_gate.py"
COMMON = REPO_ROOT / "scripts" / "ci" / "pilot_readiness_bundle_gate_common.py"
FIXTURES = REPO_ROOT / "scripts" / "ci" / "fixtures" / "pilot-readiness-bundle"


def _load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load module from {path}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class PilotReadinessLiveReleaseGateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.module = _load_module(MODULE, "run_pilot_readiness_live_release_gate")
        cls.common = _load_module(COMMON, "pilot_readiness_bundle_gate_common")

    def test_validate_live_pass_fixture_has_no_issues(self) -> None:
        report = json.loads((FIXTURES / "live-pass-bundle.json").read_text(encoding="utf-8"))
        issues = self.common.validate_live_bundle_report(
            report,
            run_id="11111111-1111-1111-1111-111111111111",
        )
        self.assertEqual(issues, [])

    def test_warn_slot_blocks_when_strict(self) -> None:
        report = json.loads((FIXTURES / "live-warn-bundle.json").read_text(encoding="utf-8"))
        issues = self.common.validate_live_bundle_report(
            report,
            run_id="11111111-1111-1111-1111-111111111111",
            include_warn_slot_blockers=True,
        )
        self.assertTrue(any("frontier-ai-baseline" in issue for issue in issues))

    def test_validate_fail_on_skipped_ship_gate(self) -> None:
        report = json.loads((FIXTURES / "live-pass-bundle.json").read_text(encoding="utf-8"))
        report["slots"][-1]["verdict"] = "Skipped"
        issues = self.common.validate_live_bundle_report(
            report,
            run_id="11111111-1111-1111-1111-111111111111",
        )
        self.assertTrue(any("ship-gate-evidence" in issue for issue in issues))

    def test_skip_without_run_id_writes_skipped_gate(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            json_out = temp_path / "gate.json"
            md_out = temp_path / "gate.md"

            completed = subprocess.run(
                [
                    sys.executable,
                    str(MODULE),
                    "--json-out",
                    str(json_out),
                    "--markdown-out",
                    str(md_out),
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )

            self.assertEqual(completed.returncode, 0, completed.stderr)
            gate = json.loads(json_out.read_text(encoding="utf-8"))
            self.assertEqual(gate["schema"], "archlucid.pilot-readiness-live-release-gate.v1")
            self.assertEqual(gate["disposition"], "SKIPPED")

    def test_skip_cli_run_with_fixture_report_passes(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            json_out = temp_path / "gate.json"
            md_out = temp_path / "gate.md"

            completed = subprocess.run(
                [
                    sys.executable,
                    str(MODULE),
                    "--run-id",
                    "11111111-1111-1111-1111-111111111111",
                    "--bundle-report",
                    str(FIXTURES / "live-pass-bundle.json"),
                    "--json-out",
                    str(json_out),
                    "--markdown-out",
                    str(md_out),
                    "--skip-cli-run",
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )

            self.assertEqual(completed.returncode, 0, completed.stderr)
            gate = json.loads(json_out.read_text(encoding="utf-8"))
            self.assertEqual(gate["disposition"], "PASS")
            self.assertEqual(gate["slotCount"], 8)

    def test_strict_rc_fails_on_warn_slot(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            json_out = temp_path / "gate.json"
            md_out = temp_path / "gate.md"

            completed = subprocess.run(
                [
                    sys.executable,
                    str(MODULE),
                    "--run-id",
                    "11111111-1111-1111-1111-111111111111",
                    "--bundle-report",
                    str(FIXTURES / "live-warn-bundle.json"),
                    "--json-out",
                    str(json_out),
                    "--markdown-out",
                    str(md_out),
                    "--skip-cli-run",
                    "--strict-rc",
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )

            self.assertEqual(completed.returncode, 1, completed.stderr)
            gate = json.loads(json_out.read_text(encoding="utf-8"))
            self.assertEqual(gate["disposition"], "FAIL")


if __name__ == "__main__":
    unittest.main()
