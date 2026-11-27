"""Contract checks for the focused SQL runner's result reporting."""

from contextlib import redirect_stderr, redirect_stdout
from importlib.util import module_from_spec, spec_from_file_location
from io import StringIO
import json
import os
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
from unittest import TestCase, skipUnless
from unittest.mock import patch
from xml.sax.saxutils import escape

SCRIPT = Path(__file__).resolve().parents[1] / "run_focused_api_sql.py"
SPEC = spec_from_file_location("run_focused_api_sql", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
RUNNER = module_from_spec(SPEC)
SPEC.loader.exec_module(RUNNER)
CASE = "ArchLucid.Api.Tests.FocusedExample.Test"
REVISION = "a" * 40


@skipUnless(os.name == "posix", "requires a controlled POSIX executable search path")
class FocusedApiSqlLaunchTests(TestCase):
    def test_failed_process_launch_is_reported_and_stops_the_batch(self):
        for missing in (True, False):
            with self.subTest(missing=missing), TemporaryDirectory() as directory:
                root = Path(directory)
                git = root / "git"
                git.write_text(f"#!/bin/sh\nprintf '%s\\n' '{REVISION}'\n", encoding="utf-8")
                git.chmod(0o700)
                if not missing:
                    dotnet = root / "dotnet"
                    dotnet.write_text("#!/bin/sh\nexit 0\n", encoding="utf-8")
                    dotnet.chmod(0o600)
                output = root / "results"
                names = [CASE + ".First", CASE + ".Second"]
                completed = subprocess.run(
                    [sys.executable, str(SCRIPT), "--results-dir", str(output),
                     "--case", names[0], "--case", names[1]],
                    env=os.environ | {"PATH": str(root), "ARCHLUCID_API_TEST_SQL": "synthetic-fixture"},
                    capture_output=True, text=True, timeout=10,
                )
                self.assertEqual(completed.returncode, 1, completed.stderr)
                self.assertIn("Could not start the .NET test process", completed.stderr)
                self.assertNotIn("Traceback", completed.stderr)
                self.assertNotIn(str(root), completed.stderr)
                report = json.loads((output / "summary.json").read_text(encoding="utf-8"))
                self.assertEqual(report["counts"], {"passed": 0, "failed": 0, "skipped": 0, "interrupted": 1})
                self.assertEqual(report["unreported"], 1)
                self.assertEqual(report["cases"], [
                    {"case": names[0], "outcome": "interrupted", "artifact_dir": "01",
                     "exit_code": None, "interruption": "launch-failed"},
                    {"case": names[1], "outcome": "not-started", "artifact_dir": "02"},
                ])
                self.assertFalse((output / "02").exists())


class FocusedApiSqlResultTests(TestCase):
    def report(self, rows, exit_code, timed_out=False):
        with TemporaryDirectory() as directory:
            trx = Path(directory) / "case.trx"
            if rows is not None:
                trx.write_text(
                    '<TestRun xmlns="urn:trx"><Results>' + "".join(
                        f'<UnitTestResult testName="{name}" outcome="{status}" />'
                        for name, status in rows
                    ) + '</Results></TestRun>',
                    encoding="utf-8",
                )
            return RUNNER.read_result(trx, CASE, exit_code, timed_out)[0]

    def inventory_report(self, output, outcome="Failed", name=RUNNER.INVENTORY_CASE, timed_out=False):
        with TemporaryDirectory() as directory:
            trx = Path(directory) / "case.trx"
            trx.write_text(
                '<TestRun xmlns="urn:trx"><Results>'
                f'<UnitTestResult testName="{name}" outcome="{outcome}">'
                '<Output><ErrorInfo><Message>raw-private-assertion</Message></ErrorInfo>'
                f'<StdOut>{escape(output)}</StdOut></Output></UnitTestResult></Results></TestRun>',
                encoding="utf-8",
            )
            return RUNNER.read_result(trx, name, 1 if outcome == "Failed" else 0, timed_out)

    def test_failure_reports_last_valid_stage_and_typed_values(self):
        marker = RUNNER.INVENTORY_STAGE_MARKER
        for event, expected in [
            ("prepare-fixture", {"stage": "prepare-fixture"}),
            ("initial-status 500", {"stage": "initial-status", "expected": "2xx", "actual": 500}),
            ("control-repeat-status 409", {"stage": "control-repeat-status", "expected": "2xx", "actual": 409}),
            ("fixture-row-count -1", {"stage": "fixture-row-count", "expected": 1, "actual": -1}),
            ("repeat-status 200", {"stage": "repeat-status", "expected": 409, "actual": 200}),
        ]:
            with self.subTest(event=event):
                self.assertEqual(self.inventory_report(f"{marker}bootstrap\n  {marker}{event}\n"),
                                 ("failed", expected))

    def test_diagnostics_fail_closed_on_unrecognized_text(self):
        marker = RUNNER.INVENTORY_STAGE_MARKER
        output = (f"private-database-string\n{marker}untrusted-stage payload\n"
                  f"{marker}repeat-status 200 extra\n{marker}fixture-row-count 123456789\n"
                  f"{marker}control-repeat-status arbitrary-body\n")
        self.assertEqual(self.inventory_report(output), ("failed", {"stage": "not-reported"}))

    def test_nonfailures_and_unrelated_tests_do_not_emit_inventory_diagnostics(self):
        output = f"{RUNNER.INVENTORY_STAGE_MARKER}repeat-status 200"
        self.assertEqual(self.inventory_report(output, outcome="Passed"), ("passed", None))
        self.assertEqual(self.inventory_report(output, outcome="Skipped"), ("skipped", None))
        self.assertEqual(self.inventory_report(output, name=CASE), ("failed", None))
        self.assertEqual(self.inventory_report(output, timed_out=True), ("interrupted", None))

    def test_distinguishes_pass_fail_and_skip(self):
        for status, code, expected in [("Passed", 0, "passed"), ("Failed", 1, "failed"), ("NotExecuted", 0, "skipped")]:
            with self.subTest(status=status):
                self.assertEqual(self.report([(CASE, status)], code), expected)

    def test_timeout_or_nonzero_exit_cannot_turn_a_pass_into_success(self):
        self.assertEqual(self.report([(CASE, "Passed")], 0, timed_out=True), "interrupted")
        self.assertEqual(self.report([(CASE, "Passed")], 1), "interrupted")

    def test_missing_wrong_and_duplicate_results_are_interruptions(self):
        self.assertEqual(self.report(None, 1), "interrupted")
        self.assertEqual(self.report([], 0), "interrupted")
        self.assertEqual(self.report([(CASE + "Other", "Passed")], 0), "interrupted")
        self.assertEqual(self.report([(CASE, "Passed")] * 2, 0), "interrupted")


class FocusedApiSqlCheckpointTests(TestCase):
    def setUp(self):
        directory = self.enterContext(TemporaryDirectory())
        self.output = Path(directory) / "results"
        self.summary = self.output / "summary.json"
        self.names = [CASE + suffix for suffix in ("One", "Two", "Three")]
        self.args = ["--results-dir", str(self.output)]
        for name in self.names:
            self.args.extend(("--case", name))
        self.revision = self.enterContext(patch.object(RUNNER.subprocess, "check_output", return_value=REVISION + "\n"))
        self.run_case = self.enterContext(patch.object(RUNNER, "run_case"))
        self.enterContext(patch.dict(os.environ, {}, clear=True))
        self.enterContext(redirect_stdout(StringIO()))
        self.enterContext(redirect_stderr(StringIO()))

    def read_summary(self):
        result = json.loads(self.summary.read_text(encoding="utf-8"))
        self.assertEqual(result["selected"], 3)
        self.assertEqual([row["case"] for row in result["cases"]], self.names)
        return result

    def test_stopped_before_first_case_retains_the_selection_without_sql(self):
        self.assertEqual(RUNNER.main(self.args + ["--prepare-only"]), 0)
        self.run_case.assert_not_called()
        result = self.read_summary()
        self.assertEqual(result["commit"], REVISION)
        self.assertEqual(result["unreported"], 3)
        self.assertEqual([row["outcome"] for row in result["cases"]], ["not-started"] * 3)

    def test_records_only_known_fixture_phases_without_rewriting_case_results(self):
        self.assertEqual(RUNNER.main(self.args + ["--prepare-only"]), 0)
        expected = self.read_summary()
        for phase in ("setup", "cleanup", "cleanup"):
            self.assertEqual(RUNNER.main(self.args + ["--record-fixture-timeout", phase]), 0)
        expected["fixture_timeouts"] = ["setup", "cleanup"]
        self.assertEqual(self.read_summary(), expected)
        with self.assertRaises(SystemExit) as invalid:
            RUNNER.main(self.args + ["--record-fixture-timeout", "raw-fixture-details"])
        self.assertEqual(invalid.exception.code, 2)
        self.assertEqual(self.read_summary(), expected)
        self.run_case.assert_not_called()

    def test_cleanup_verification_only_adds_bounded_metadata_to_the_existing_summary(self):
        self.assertEqual(RUNNER.main(self.args + ["--prepare-only"]), 0)
        expected = self.read_summary()
        self.assertEqual(RUNNER.main(self.args + ["--record-fixture-cleanup", "unverified"]), 0)
        expected["fixture_cleanup"] = "unverified"
        self.assertEqual(self.read_summary(), expected)
        with self.assertRaises(SystemExit) as invalid:
            RUNNER.main(self.args + ["--record-fixture-cleanup", "raw-daemon-output"])
        self.assertEqual(invalid.exception.code, 2)
        self.assertEqual(self.read_summary(), expected)
        self.run_case.assert_not_called()

    def test_interruption_in_second_case_preserves_completed_active_and_pending_rows(self):
        self.assertEqual(RUNNER.main(self.args + ["--prepare-only"]), 0)
        os.environ["ARCHLUCID_API_TEST_SQL"] = "private-fixture-sentinel"
        completed = {"case": self.names[0], "outcome": "passed", "exit_code": 0, "artifact_dir": "01"}
        self.run_case.side_effect = [completed, KeyboardInterrupt()]
        with self.assertRaises(KeyboardInterrupt):
            RUNNER.main(self.args + ["--use-prepared"])
        result = self.read_summary()
        self.assertEqual(result["counts"], {"passed": 1, "failed": 0, "skipped": 0, "interrupted": 0})
        self.assertEqual(result["unreported"], 2)
        self.assertEqual(result["cases"], [completed,
                         {"case": self.names[1], "outcome": "running", "artifact_dir": "02"},
                         {"case": self.names[2], "outcome": "not-started", "artifact_dir": "03"}])
        self.assertEqual(self.run_case.call_count, 2)
        self.assertNotIn("private-fixture-sentinel", self.summary.read_text(encoding="utf-8"))

    def test_interrupted_checkpoint_replacement_preserves_the_previous_summary(self):
        self.assertEqual(RUNNER.main(self.args + ["--prepare-only"]), 0)
        original = self.summary.read_bytes()
        with patch.object(Path, "replace", side_effect=OSError("synthetic checkpoint error")):
            with self.assertRaises(OSError):
                RUNNER.checkpoint(self.summary, {"different": True})
        self.assertEqual(self.summary.read_bytes(), original)
        self.assertEqual(list(self.output.iterdir()), [self.summary])

    def test_direct_run_preserves_final_results_and_does_not_hide_a_timeout(self):
        os.environ["ARCHLUCID_SQL_TEST"] = "private-fixture-sentinel"
        outcomes = ["passed", "interrupted", "passed"]
        self.run_case.side_effect = [
            {"case": name, "outcome": outcome, "exit_code": 0 if outcome == "passed" else -9,
             "artifact_dir": f"{index:02d}"}
            for index, (name, outcome) in enumerate(zip(self.names, outcomes), 1)
        ]
        self.assertEqual(RUNNER.main(self.args), 1)
        result = self.read_summary()
        self.assertEqual(result["unreported"], 0)
        self.assertEqual([row["outcome"] for row in result["cases"]], outcomes)
        self.assertEqual(result["counts"]["interrupted"], 1)

    def test_refuses_changed_revision_or_selection_without_rewriting_the_plan(self):
        self.assertEqual(RUNNER.main(self.args + ["--prepare-only"]), 0)
        original = self.summary.read_bytes()
        with self.assertRaises(SystemExit) as wrong_selection:
            RUNNER.main(self.args[:-2] + ["--use-prepared"])
        self.assertEqual(wrong_selection.exception.code, 2)
        self.revision.return_value = "b" * 40 + "\n"
        with self.assertRaises(SystemExit) as wrong_revision:
            RUNNER.main(self.args + ["--use-prepared"])
        self.assertEqual(wrong_revision.exception.code, 2)
        self.run_case.assert_not_called()
        self.assertEqual(self.summary.read_bytes(), original)
