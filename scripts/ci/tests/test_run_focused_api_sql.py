"""Contract checks for the focused SQL runner's result reporting."""

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase

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
            return RUNNER.read_outcome(trx, CASE, exit_code, timed_out)

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
