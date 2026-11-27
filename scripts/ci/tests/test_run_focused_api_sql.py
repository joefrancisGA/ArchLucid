"""Contract checks for the focused SQL runner's result reporting."""

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase
from xml.sax.saxutils import escape

SCRIPT = Path(__file__).resolve().parents[1] / "run_focused_api_sql.py"
SPEC = spec_from_file_location("run_focused_api_sql", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
RUNNER = module_from_spec(SPEC)
SPEC.loader.exec_module(RUNNER)
CASE = "ArchLucid.Api.Tests.FocusedExample.Test"


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
            ("fixture-row-count -1", {"stage": "fixture-row-count", "expected": 1, "actual": -1}),
            ("repeat-status 200", {"stage": "repeat-status", "expected": 409, "actual": 200}),
            ("repeat-detail missing", {"stage": "repeat-detail", "expected": "present", "actual": "missing"}),
        ]:
            with self.subTest(event=event):
                self.assertEqual(self.inventory_report(f"{marker}bootstrap\n  {marker}{event}\n"),
                                 ("failed", expected))

    def test_diagnostics_fail_closed_on_unrecognized_text(self):
        marker = RUNNER.INVENTORY_STAGE_MARKER
        output = (f"private-database-string\n{marker}untrusted-stage payload\n"
                  f"{marker}repeat-status 200 extra\n{marker}fixture-row-count 123456789\n"
                  f"{marker}repeat-detail arbitrary-body\n")
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
