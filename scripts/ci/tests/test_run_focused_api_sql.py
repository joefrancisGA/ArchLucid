"""Contract checks for the focused SQL runner's result reporting."""

from contextlib import redirect_stderr, redirect_stdout
from importlib.util import module_from_spec, spec_from_file_location
from io import StringIO
from itertools import count
import json
import os
from pathlib import Path
import signal
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
                elapsed = report["cases"][0]["elapsed_ms"]
                self.assertIs(type(elapsed), int)
                self.assertGreaterEqual(elapsed, 0)
                self.assertEqual(report["cases"], [
                    {"case": names[0], "outcome": "interrupted", "artifact_dir": "01",
                     "exit_code": None, "interruption": "launch-failed",
                     "elapsed_ms": elapsed, "watchdog_budget_ms": 150_000},
                    {"case": names[1], "outcome": "not-started", "artifact_dir": "02"},
                ])
                self.assertFalse((output / "02").exists())

    def test_same_process_exit_code_distinguishes_missing_result_from_watchdog(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            dotnet = root / "dotnet"
            dotnet.write_text(
                f"#!{sys.executable}\n"
                "import os, signal, sys, time\n"
                "if any(arg.endswith('.EarlyExit') for arg in sys.argv):\n"
                "    os.kill(os.getpid(), signal.SIGKILL)\n"
                "else:\n"
                "    time.sleep(30)\n",
                encoding="utf-8",
            )
            dotnet.chmod(0o700)
            with patch.dict(os.environ, {"PATH": str(root)}):
                early = RUNNER.run_case(CASE + ".EarlyExit", root / "01", 5, RUNNER.Cancellation())
                watchdog = RUNNER.run_case(CASE + ".Watchdog", root / "02", 0.5, RUNNER.Cancellation())
            for result, reason in [(early, "missing-result"), (watchdog, "watchdog-timeout")]:
                self.assertEqual(result["exit_code"], -signal.SIGKILL)
                self.assertEqual(result["outcome"], "interrupted")
                self.assertEqual(result["interruption"], reason)

    @skipUnless(sys.platform == "linux", "requires Linux process-group verification")
    def test_early_exit_releases_the_previous_case_lock_before_starting_the_next(self):
        self.assert_previous_case_releases_lock("EarlyExit", "interrupted", 42, "missing-result")

    @skipUnless(sys.platform == "linux", "requires Linux process-group verification")
    def test_successful_exit_releases_the_previous_case_lock_before_starting_the_next(self):
        self.assert_previous_case_releases_lock("PassedWithHelper", "passed", 0, None)

    def assert_previous_case_releases_lock(self, suffix, outcome, exit_code, interruption):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "results"
            marker = output / "01" / "owned.group"
            git = root / "git"
            git.write_text(f"#!/bin/sh\nprintf '%s\\n' '{REVISION}'\n", encoding="utf-8")
            git.chmod(0o700)
            dotnet = root / "dotnet"
            dotnet.write_text(f"#!{sys.executable}\n" + """\
import fcntl
import os
from pathlib import Path
import subprocess
import sys
import time

if sys.argv[1] == '--hold-lock':
    folder = Path(sys.argv[2])
    with (folder / 'fixture.lock').open('w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        (folder / 'owned.group').write_text(str(os.getpgrp()))
        time.sleep(30)
else:
    args = sys.argv
    folder = Path(args[args.index('--results-directory') + 1])
    name = args[args.index('--filter') + 1].split('=', 1)[1]
    if name.endswith(('.EarlyExit', '.PassedWithHelper')):
        child = subprocess.Popen([sys.executable, __file__, '--hold-lock', str(folder)])
        deadline = time.monotonic() + 4
        while not (folder / 'owned.group').is_file() and child.poll() is None and time.monotonic() < deadline:
            time.sleep(0.02)
        if name.endswith('.EarlyExit'):
            os._exit(42)
    else:
        with (folder.parent / '01' / 'fixture.lock').open('r+') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    (folder / 'case.trx').write_text(
        f'<TestRun><Results><UnitTestResult testName="{name}" outcome="Passed"/></Results></TestRun>')
""", encoding="utf-8")
            dotnet.chmod(0o700)
            verified = False
            try:
                completed = subprocess.run(
                    [sys.executable, str(SCRIPT), "--results-dir", str(output),
                     "--case", CASE + "." + suffix, "--case", CASE + ".NextCase"],
                    env=os.environ | {"PATH": str(root), "ARCHLUCID_API_TEST_SQL": "synthetic-fixture"},
                    capture_output=True, text=True, timeout=10,
                )
                self.assertTrue(marker.is_file(), "synthetic helper never acquired the lock")
                report = json.loads((output / "summary.json").read_text(encoding="utf-8"))
                self.assertEqual([row["outcome"] for row in report["cases"]], [outcome, "passed"])
                self.assertEqual(report["cases"][0]["exit_code"], exit_code)
                self.assertEqual(report["cases"][0].get("interruption"), interruption)
                self.assertNotIn("process_cleanup", report["cases"][0])
                self.assertEqual(completed.returncode, 0 if outcome == "passed" else 1, completed.stderr)
                verified = True
            finally:
                # Remove only the synthetic process group if the regression fails.
                if not verified and marker.is_file() and (group := marker.read_text()).isdecimal():
                    try:
                        os.killpg(int(group), signal.SIGKILL)
                    except ProcessLookupError:
                        pass


class FocusedApiSqlResultTests(TestCase):
    def report(self, rows, exit_code, timed_out=False):
        with TemporaryDirectory() as directory:
            trx = Path(directory) / "case.trx"
            if isinstance(rows, str):
                trx.write_text(rows, encoding="utf-8")
            elif rows is not None:
                trx.write_text(
                    '<TestRun xmlns="urn:trx"><Results>' + "".join(
                        f'<UnitTestResult testName="{name}" outcome="{status}" />'
                        for name, status in rows
                    ) + '</Results></TestRun>',
                    encoding="utf-8",
                )
            return RUNNER.read_result(trx, CASE, exit_code, timed_out)

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
                                 ("failed", expected, None))

    def test_diagnostics_fail_closed_on_unrecognized_text(self):
        marker = RUNNER.INVENTORY_STAGE_MARKER
        output = (f"private-database-string\n{marker}untrusted-stage payload\n"
                  f"{marker}repeat-status 200 extra\n{marker}fixture-row-count 123456789\n"
                  f"{marker}control-repeat-status arbitrary-body\n")
        self.assertEqual(self.inventory_report(output), ("failed", {"stage": "not-reported"}, None))

    def test_nonfailures_and_unrelated_tests_do_not_emit_inventory_diagnostics(self):
        output = f"{RUNNER.INVENTORY_STAGE_MARKER}repeat-status 200"
        self.assertEqual(self.inventory_report(output, outcome="Passed"), ("passed", None, None))
        self.assertEqual(self.inventory_report(output, outcome="Skipped"), ("skipped", None, None))
        self.assertEqual(self.inventory_report(output, name=CASE), ("failed", None, None))
        self.assertEqual(self.inventory_report(output, timed_out=True), ("interrupted", None, "watchdog-timeout"))

    def test_distinguishes_pass_fail_and_skip(self):
        for status, code, expected in [("Passed", 0, "passed"), ("Failed", 1, "failed"), ("NotExecuted", 0, "skipped")]:
            with self.subTest(status=status):
                self.assertEqual(self.report([(CASE, status)], code), (expected, None, None))

    def test_timeout_or_nonzero_exit_cannot_turn_a_pass_into_success(self):
        self.assertEqual(self.report([(CASE, "Passed")], 0, timed_out=True), ("interrupted", None, "watchdog-timeout"))
        self.assertEqual(self.report([(CASE, "Passed")], 1), ("interrupted", None, "invalid-result"))

    def test_separates_missing_results_from_unusable_results(self):
        self.assertEqual(self.report(None, 1), ("interrupted", None, "missing-result"))
        for rows in ("<Malformed", '<?xml version="1.0" encoding="unknown-codec"?><TestRun/>',
                     '<?xml version="1.0" encoding="utf-32"?><TestRun/>',
                     [], [(CASE + "Other", "Passed")], [(CASE, "Passed")] * 2,
                     [(CASE, "UnrecognizedOutcome")]):
            with self.subTest(rows=rows):
                self.assertEqual(self.report(rows, 0), ("interrupted", None, "invalid-result"))


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
        self.clock = self.enterContext(patch.object(RUNNER.time, "monotonic_ns", side_effect=count(0, 2_000_000)))
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
        self.assertEqual(result["cases"], [
            {"case": name, "outcome": "not-started", "artifact_dir": f"{index:02d}"}
            for index, name in enumerate(self.names, 1)
        ])

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

    def test_records_a_known_setup_failure_without_changing_case_or_cleanup_data(self):
        self.assertEqual(RUNNER.main(self.args + ["--prepare-only"]), 0)
        self.assertEqual(RUNNER.main(self.args + ["--record-fixture-cleanup", "already-absent"]), 0)
        expected = self.read_summary()
        self.assertEqual(RUNNER.main(self.args + ["--record-fixture-setup-failure", "server-exited"]), 0)
        expected["fixture_setup_failure"] = "server-exited"
        self.assertEqual(self.read_summary(), expected)
        with self.assertRaises(SystemExit) as invalid:
            RUNNER.main(self.args + ["--record-fixture-setup-failure", "raw-docker-output"])
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
        self.assertEqual(result["cases"], [dict(completed, elapsed_ms=2, watchdog_budget_ms=150_000),
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

    def test_records_each_case_elapsed_time_and_the_configured_watchdog_budget(self):
        os.environ["ARCHLUCID_SQL_TEST"] = "synthetic-fixture"
        self.clock.side_effect = [
            100_000_000, 160_999_999, 200_000_000, 37_210_000_000, 38_000_000_000, 38_750_000_000,
        ]
        self.run_case.side_effect = [
            {"case": self.names[0], "outcome": "passed", "exit_code": 0, "artifact_dir": "01"},
            {"case": self.names[1], "outcome": "interrupted", "exit_code": -9, "artifact_dir": "02",
             "interruption": "watchdog-timeout"},
            {"case": self.names[2], "outcome": "passed", "exit_code": 0, "artifact_dir": "03"},
        ]
        self.assertEqual(RUNNER.main(self.args + ["--timeout-seconds", "37"]), 1)
        rows = self.read_summary()["cases"]
        self.assertEqual([row["elapsed_ms"] for row in rows], [60, 37_010, 750])
        self.assertEqual([row["watchdog_budget_ms"] for row in rows], [37_000] * 3)
        self.assertEqual(rows[1]["interruption"], "watchdog-timeout")
        self.assertEqual([call.args[2] for call in self.run_case.call_args_list], [37] * 3)

    def test_stops_the_batch_if_process_cleanup_cannot_be_verified(self):
        os.environ["ARCHLUCID_SQL_TEST"] = "private-fixture-sentinel"
        failure = {"case": self.names[0], "outcome": "interrupted", "exit_code": 42, "artifact_dir": "01",
                   "interruption": "missing-result", "process_cleanup": "unverified"}
        self.run_case.return_value = failure
        self.assertEqual(RUNNER.main(self.args), 1)
        result = self.read_summary()
        self.run_case.assert_called_once()
        self.assertEqual(result["cases"][0], dict(failure, elapsed_ms=2, watchdog_budget_ms=150_000))
        self.assertEqual([row["outcome"] for row in result["cases"]], ["interrupted", "not-started", "not-started"])

    def test_unverified_cleanup_on_the_last_passed_case_still_fails_the_batch(self):
        os.environ["ARCHLUCID_SQL_TEST"] = "private-fixture-sentinel"
        passed = [
            {"case": name, "outcome": "passed", "exit_code": 0, "artifact_dir": f"{index:02d}"}
            for index, name in enumerate(self.names, 1)
        ]
        passed[-1]["process_cleanup"] = "unverified"
        self.run_case.side_effect = passed
        self.assertEqual(RUNNER.main(self.args), 1)
        result = self.read_summary()
        self.assertEqual(result["cases"], [dict(row, elapsed_ms=2, watchdog_budget_ms=150_000) for row in passed])
        self.assertEqual(result["counts"]["passed"], len(self.names))
        self.assertEqual(result["unreported"], 0)

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
