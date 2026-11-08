"""Tests for scripts/ci/run_pilot_readiness_release_train_gate.py."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

REPO_ROOT = Path(__file__).resolve().parents[3]
MODULE = REPO_ROOT / "scripts" / "ci" / "run_pilot_readiness_release_train_gate.py"
FIXTURES = REPO_ROOT / "scripts" / "ci" / "fixtures" / "pilot-readiness-bundle"


def _load_module():
    import importlib.util

    spec = importlib.util.spec_from_file_location("run_pilot_readiness_release_train_gate", MODULE)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load module from {MODULE}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class PilotReadinessReleaseTrainGateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.module = _load_module()

    def test_validate_offline_pass_fixture_has_no_issues(self) -> None:
        report = json.loads((FIXTURES / "offline-pass.json").read_text(encoding="utf-8"))
        issues = self.module.validate_pilot_readiness_bundle_report(report)
        self.assertEqual(issues, [])

    def test_validate_fail_on_missing_ship_gate_skip(self) -> None:
        report = json.loads((FIXTURES / "offline-pass.json").read_text(encoding="utf-8"))
        report["slots"][-1]["verdict"] = "Pass"
        issues = self.module.validate_pilot_readiness_bundle_report(report)
        self.assertTrue(any("ship-gate-evidence SKIPPED" in issue for issue in issues))

    def test_validate_fail_on_overall_fail(self) -> None:
        report = json.loads((FIXTURES / "offline-pass.json").read_text(encoding="utf-8"))
        report["overallVerdict"] = "Fail"
        issues = self.module.validate_pilot_readiness_bundle_report(report)
        self.assertIn("overallVerdict is Fail.", issues)

    def test_offline_warn_names_the_specific_slot(self) -> None:
        report = json.loads((FIXTURES / "offline-pass.json").read_text(encoding="utf-8"))
        report["overallVerdict"] = "Warn"
        report["slots"][3]["verdict"] = "Warn"
        issues = self.module.validate_pilot_readiness_bundle_report(report)
        self.assertIn("offline overallVerdict must be Pass, found Warn.", issues)
        self.assertIn("offline slot frontier-ai-baseline verdict is Warn.", issues)

    def test_offline_warn_fails_even_if_overall_says_pass(self) -> None:
        report = json.loads((FIXTURES / "offline-pass.json").read_text(encoding="utf-8"))
        report["slots"][1]["verdict"] = "Warn"
        issues = self.module.validate_pilot_readiness_bundle_report(report)
        self.assertIn("offline slot return-trigger-telemetry verdict is Warn.", issues)

    def test_malformed_json_and_scalar_slots_emit_fail_artifact(self) -> None:
        payloads = [
            "{", "[", "null", "[]", "42", '"text"',
            '{"slots": 17, "overallVerdict": "Pass"}',
            '{"slots": true, "overallVerdict": "Pass"}',
        ]
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            bundle = root / "bundle.json"
            output = root / "result.json"
            for index, payload in enumerate(payloads):
                with self.subTest(index=index):
                    bundle.write_text(payload, encoding="utf-8")
                    result = subprocess.run([
                        sys.executable, str(MODULE), "--bundle-report", str(bundle),
                        "--json-out", str(output), "--skip-cli-run",
                    ], cwd=REPO_ROOT, capture_output=True, text=True, check=False)
                    self.assertEqual(result.returncode, 1)
                    gate = json.loads(output.read_text(encoding="utf-8"))
                    self.assertEqual(gate["disposition"], "FAIL")
                    self.assertTrue(gate["issues"])

    def test_cli_must_rewrite_preexisting_bundle_artifact(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            bundle = root / "bundle.json"
            output = root / "result.json"
            bundle.write_text(
                (FIXTURES / "offline-pass.json").read_text(encoding="utf-8"),
                encoding="utf-8",
            )
            with patch.object(sys, "argv", [
                "run_pilot_readiness_release_train_gate.py",
                "--repo-root", str(root), "--bundle-report", str(bundle),
                "--json-out", str(output),
            ]), patch.object(self.module, "run_offline_bundle", return_value=(0, "")):
                status = self.module.main()
            self.assertEqual(status, 1)
            gate = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual(gate["disposition"], "FAIL")
            self.assertTrue(any("did not refresh" in issue for issue in gate["issues"]))

    def test_forty_malformed_or_nonobject_reports_fail_closed(self) -> None:
        invalid_json = [
            "", "{", "}", "[", "]", "{oops}", '{"slots":',
            '{"overallVerdict":', 'not json', '{"a": 1,,}',
        ]
        malformed = [space + candidate for space in ("", " ", "\n") for candidate in invalid_json]
        nonobjects = ["null", "false", "true", "42", '"string"']
        malformed.extend(nonobjects * 2)
        self.assertEqual(len(malformed), 40)
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            report_path = root / "bundle.json"
            output = root / "out.json"
            for index, report_content in enumerate(malformed):
                with self.subTest(fixture=index):
                    report_path.write_text(report_content, encoding="utf-8")
                    completed = subprocess.run([
                        sys.executable, str(MODULE), "--repo-root", str(REPO_ROOT),
                        "--bundle-report", str(report_path), "--json-out", str(output),
                        "--skip-cli-run",
                    ], cwd=REPO_ROOT, capture_output=True, text=True, check=False)
                    self.assertNotEqual(completed.returncode, 0)
                    result = json.loads(output.read_text(encoding="utf-8"))
                    self.assertEqual(result["disposition"], "FAIL")
                    self.assertTrue(result["issues"])

    def test_skip_cli_requires_explicit_report(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "gate.json"
            with patch.object(sys, "argv", [
                str(MODULE), "--repo-root", temp_dir,
                "--skip-cli-run", "--json-out", str(output),
            ]):
                self.assertEqual(self.module.main(), 1)
            self.assertIn("requires explicit", " ".join(
                json.loads(output.read_text(encoding="utf-8"))["issues"]))

    def test_recent_but_unchanged_bundle_cannot_certify_new_cli_run(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            report_path = root / "bundle.json"
            report_path.write_text(
                (FIXTURES / "offline-pass.json").read_text(encoding="utf-8"),
                encoding="utf-8")
            output = root / "gate.json"
            with patch.object(sys, "argv", [
                str(MODULE), "--repo-root", temp_dir,
                "--bundle-report", str(report_path), "--json-out", str(output),
            ]), patch.object(self.module, "run_offline_bundle", return_value=(0, "")):
                self.assertEqual(self.module.main(), 1)
            result = json.loads(output.read_text(encoding="utf-8"))
            self.assertTrue(any("not refreshed" in issue for issue in result["issues"]))

    def test_cli_success_cannot_reuse_stale_bundle_report(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            report_path = root / "bundle.json"
            report_path.write_text(
                (FIXTURES / "offline-pass.json").read_text(encoding="utf-8"),
                encoding="utf-8")
            os.utime(report_path, (1000000000, 1000000000))
            output = root / "gate.json"
            with patch.object(sys, "argv", [
                str(MODULE), "--repo-root", temp_dir,
                "--bundle-report", str(report_path), "--json-out", str(output),
            ]), patch.object(self.module, "run_offline_bundle", return_value=(0, "")):
                self.assertEqual(self.module.main(), 1)
            result = json.loads(output.read_text(encoding="utf-8"))
            self.assertTrue(any("stale evidence" in issue for issue in result["issues"]))

    def test_skip_cli_run_with_fixture_report_passes(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            bundle_path = temp_path / "pilot-readiness-bundle.json"
            bundle_path.write_text(
                (FIXTURES / "offline-pass.json").read_text(encoding="utf-8"),
                encoding="utf-8",
            )
            json_out = temp_path / "gate.json"

            completed = subprocess.run(
                [
                    sys.executable,
                    str(MODULE),
                    "--repo-root",
                    str(REPO_ROOT),
                    "--bundle-report",
                    str(bundle_path),
                    "--json-out",
                    str(json_out),
                    "--skip-cli-run",
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )

            self.assertEqual(completed.returncode, 0, completed.stderr)
            gate = json.loads(json_out.read_text(encoding="utf-8"))
            self.assertEqual(gate["schema"], "archlucid.pilot-readiness-release-train-gate.v1")
            self.assertEqual(gate["disposition"], "PASS")


if __name__ == "__main__":
    unittest.main()
