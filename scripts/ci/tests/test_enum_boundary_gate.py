"""Focused tests of the enum CI ratchet. These do not require the .NET SDK."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import enum_boundary_audit as audit
import enum_boundary_gate as gate


def row(path="ArchLucid.Core/C.cs", rule="ENUM001", digest="a" * 64):
    return dict(rule=rule, path=path, line=4, column=10, sha256=digest, message="cast")


class EnumBoundaryGateTests(unittest.TestCase):
    def test_legacy_untouched_cast_is_inventoried_not_approved(self):
        finding = row()
        blocked, legacy, stale = gate.classify([finding], set(), set(), "changed-files")
        self.assertEqual([], blocked)
        self.assertEqual([finding], legacy)
        self.assertEqual(set(), stale)

    def test_touched_file_blocks_unreviewed_conversion(self):
        finding = row()
        self.assertEqual([finding], gate.classify(
            [finding], set(), {finding["path"]}, "changed-files")[0])

    def test_strict_mode_blocks_untouched_conversion(self):
        self.assertEqual([row()], gate.classify([row()], set(), set(), "all")[0])

    def test_raw_parse_never_excepted(self):
        finding = row(rule="ENUM002")
        self.assertEqual([finding], gate.classify(
            [finding], {audit.key(finding)}, set(), "inventory")[0])

    def test_reviewed_exception_is_exact_and_stale_fingerprint_fails(self):
        finding = row()
        allowed = {audit.key(finding)}
        self.assertEqual(([], [], set()), gate.classify(
            [finding], allowed, {finding["path"]}, "changed-files"))
        altered = row(digest="b" * 64)
        blocked, _, stale = gate.classify([altered], allowed, {altered["path"]}, "changed-files")
        self.assertEqual([altered], blocked)
        self.assertEqual(allowed, stale)

    def test_exception_validation(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "exceptions.json"
            valid = {**row(), "rationale": "Checked range before cast."}
            for invalid in [{**valid, "rule": "ENUM002"}, {**valid, "rationale": ""},
                            {**valid, "sha256": "wrong"}, {**valid, "line": 0}]:
                path.write_text(json.dumps([invalid]))
                with self.assertRaises(ValueError):
                    gate.load_exceptions(path)
            path.write_text(json.dumps([valid, valid]))
            with self.assertRaises(ValueError):
                gate.load_exceptions(path)
            path.write_text(json.dumps([valid]))
            self.assertEqual({audit.key(valid)}, gate.load_exceptions(path))

    def test_missing_analyzer_marker_cannot_pass_coverage(self):
        with tempfile.TemporaryDirectory() as tmp:
            reports = Path(tmp)
            report = reports / "ArchLucid.Core-net10.0.sarif"
            report.write_text('{"runs":[{"results":[]}]}')
            with patch.object(audit.subprocess, "check_output", return_value="ArchLucid.Core/ArchLucid.Core.csproj\n"):
                with self.assertRaises(SystemExit):
                    audit.check_report_coverage(reports)
                report.write_text(json.dumps({"runs":[{"results":[{
                    "ruleId":"ENUM000","message":{"text":"Enum boundary analyzer executed for 'ArchLucid.Core'"}
                }]}]}))
                self.assertEqual(1, audit.check_report_coverage(reports))

    def test_compiler_enum_diagnostic_without_a_location_cannot_disappear(self):
        with tempfile.TemporaryDirectory() as tmp:
            reports = Path(tmp)
            (reports / "ArchLucid.Core-net10.0.sarif").write_text(json.dumps({
                "runs": [{"results": [{"ruleId": "ENUM002"}]}],
            }))
            with self.assertRaisesRegex(ValueError, "exact compiler source location"):
                audit.findings_from_reports(reports)

    def test_failed_build_and_missing_coverage_publish_failure_receipt(self):
        with tempfile.TemporaryDirectory() as tmp:
            reports = Path(tmp)
            exc = reports / "exceptions.json"
            exc.write_text("[]")
            policy = reports / "policy.json"
            policy.write_text('{"mode":"changed-files"}')
            argv = ["gate", "--reports", str(reports), "--exceptions", str(exc),
                    "--policy", str(policy), "--inventory-only"]
            with patch.object(audit, "git", return_value="compiled-commit"), patch.object(
                audit, "check_report_coverage", side_effect=SystemExit("Missing Core report")
            ), patch.object(sys, "argv", [*argv, "--build-exit-code", "1"]):
                self.assertEqual(1, gate.main())
            receipt = json.loads((reports / "enum-gate-result.json").read_text())
            self.assertEqual("compiled-commit", receipt["commit"])
            self.assertEqual(1, receipt["build_exit_code"])
            self.assertTrue(any("Missing Core report" in error for error in receipt["evidence_errors"]))
            self.assertIsNone(receipt["projects"])

    def test_existing_lane_cannot_pass_on_nonzero_compiler_exit_or_downgrade_all_mode(self):
        with tempfile.TemporaryDirectory() as tmp:
            reports = Path(tmp)
            exc = reports / "exceptions.json"
            exc.write_text("[]")
            policy = reports / "policy.json"
            policy.write_text('{"mode":"all"}')
            argv = ["gate", "--reports", str(reports), "--exceptions", str(exc),
                    "--policy", str(policy), "--inventory-only"]
            with patch.object(audit, "git", return_value="compiled-commit"), patch.object(
                audit, "check_report_coverage", return_value=1
            ), patch.object(audit, "findings_from_reports", return_value=([], 1)):
                with patch.object(sys, "argv", argv):
                    self.assertEqual(0, gate.main())
                with patch.object(sys, "argv", [*argv, "--build-exit-code", "7"]):
                    self.assertEqual(1, gate.main())
            with patch.object(audit, "git", return_value="compiled-commit"), patch.object(
                audit, "check_report_coverage", return_value=1
            ), patch.object(audit, "findings_from_reports", return_value=([row()], 1)), patch.object(sys, "argv", argv):
                self.assertEqual(1, gate.main())
            receipt = json.loads((reports / "enum-gate-result.json").read_text())
            self.assertEqual("all", receipt["mode"])
            self.assertEqual([row()], receipt["blocking"])

    def test_ci_focused_suite_rejects_missing_or_skipped_result_without_rebuilding(self):
        import xml.etree.ElementTree as ET

        for reported, allowed in [[["Passed"], True], [["NotExecuted"], False], [["Passed", "NotExecuted"], False]]:
            with self.subTest(reported=reported), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                def emit(*cmd):
                    self.assertIn("--no-build", cmd)
                    self.assertIn("--no-restore", cmd)
                    target = Path(cmd[cmd.index("--results-directory") + 1])
                    xml = ET.Element("TestRun")
                    results = ET.SubElement(xml, "Results")
                    for outcome in reported:
                        ET.SubElement(results, "UnitTestResult", outcome=outcome, testName="Probe.ExpectedClass.Case")
                    ET.ElementTree(xml).write(target / "test.trx")
                with patch.object(audit, "run", side_effect=emit):
                    if allowed:
                        audit.run_focused_tests(root, {"Probe": ["ExpectedClass"]}, require_all_passed=True)
                        self.assertTrue((root / "focused-tests.json").exists())
                    else:
                        with self.assertRaises(SystemExit):
                            audit.run_focused_tests(root, {"Probe": ["ExpectedClass"]}, require_all_passed=True)

    def test_actual_git_diff_includes_renamed_or_added_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            def git(*args):
                return subprocess.check_output(["git", *args], cwd=root, text=True).strip()
            git("init", "-q")
            git("config", "user.email", "test@example.invalid")
            git("config", "user.name", "Enum gate test")
            (root / "old.cs").write_text("old")
            git("add", ".")
            git("commit", "-qm", "base")
            base = git("rev-parse", "HEAD")
            (root / "old.cs").rename(root / "new.cs")
            git("add", "-A")
            git("commit", "-qm", "rename")
            self.assertEqual({"old.cs", "new.cs"}, gate.changed_files(base, root))
            with self.assertRaises(subprocess.CalledProcessError):
                gate.changed_files("missing-base", root)


if __name__ == "__main__":
    unittest.main()
