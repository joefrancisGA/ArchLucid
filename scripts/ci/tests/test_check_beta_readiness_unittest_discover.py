"""Unit tests for check_beta_readiness_unittest_discover.py."""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parents[1]
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

import check_beta_readiness_unittest_discover as sut

REPO_ROOT = Path(__file__).resolve().parents[3]

_WORKFLOW_TEMPLATE = """
jobs:
  beta-readiness-guards:
    steps:
      - name: Sponsor export + private-beta + release-gate + insight-density guards
        run: |
          python3 scripts/ci/check_beta_readiness_unittest_discover.py
      - name: Beta-readiness guard unit tests
        run: |
          python3 -m unittest discover -s scripts/ci/tests -p "{pattern}"
"""

_UNITTEST_MODULE = """
import unittest

class SampleTests(unittest.TestCase):
    def test_ok(self) -> None:
        self.assertTrue(True)
"""

_PYTEST_ONLY_MODULE = """
def test_build_summary_lists_triage_steps() -> None:
    assert True
"""

_EMPTY_TESTCASE_MODULE = """
import unittest

class SampleTests(unittest.TestCase):
    def helper(self) -> None:
        return None
"""


class TestCheckBetaReadinessUnittestDiscover(unittest.TestCase):
    def test_guard_passes_on_repo(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "ci" / "check_beta_readiness_unittest_discover.py"),
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        self.assertIn("check_beta_readiness_unittest_discover: OK", result.stdout)

    def test_pytest_only_module_is_rejected(self) -> None:
        errors = sut.collect_module_errors(
            ["test_report_private_beta_playwright_failure_triage.py"],
            self._write_tests(
                {
                    "test_report_private_beta_playwright_failure_triage.py": _PYTEST_ONLY_MODULE,
                }
            ),
        )

        self.assertTrue(errors)
        self.assertTrue(any("unittest.TestCase" in item for item in errors), msg=errors)

    def test_missing_module_is_rejected(self) -> None:
        errors = sut.collect_module_errors(["test_missing.py"], self._write_tests({}))

        self.assertTrue(any("missing" in item for item in errors), msg=errors)

    def test_testcase_without_test_methods_is_rejected(self) -> None:
        errors = sut.collect_module_errors(
            ["test_empty_case.py"],
            self._write_tests({"test_empty_case.py": _EMPTY_TESTCASE_MODULE}),
        )

        self.assertTrue(any("no test_* methods" in item for item in errors), msg=errors)

    def test_valid_testcase_module_passes(self) -> None:
        errors = sut.collect_module_errors(
            ["test_ok.py"],
            self._write_tests({"test_ok.py": _UNITTEST_MODULE}),
        )

        self.assertEqual(errors, [])

    def test_empty_discover_list_is_rejected(self) -> None:
        errors = sut.collect_module_errors([], self._write_tests({}))

        self.assertTrue(errors)

    def test_glob_pattern_is_rejected(self) -> None:
        errors = sut.collect_module_errors(["test_*.py"], self._write_tests({}))

        self.assertTrue(any("no globs" in item for item in errors), msg=errors)

    def test_parse_discover_patterns_skips_comments(self) -> None:
        text = (
            '          python3 -m unittest discover -s scripts/ci/tests -p "test_ok.py"\n'
            '          # python3 -m unittest discover -s scripts/ci/tests -p "test_commented.py"\n'
        )

        self.assertEqual(sut.parse_discover_patterns(text), ["test_ok.py"])

    def test_scan_rejects_unwired_workflow(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            workflow = root / ".github" / "workflows"
            tests_dir = root / "scripts" / "ci" / "tests"
            workflow.mkdir(parents=True)
            tests_dir.mkdir(parents=True)
            (tests_dir / "test_ok.py").write_text(_UNITTEST_MODULE, encoding="utf-8")
            (workflow / "ui-typecheck-on-push.yml").write_text(
                _WORKFLOW_TEMPLATE.format(pattern="test_ok.py"),
                encoding="utf-8",
            )

            errors = sut.scan(root)

        self.assertTrue(
            any("test_check_beta_readiness_unittest_discover.py" in item for item in errors),
            msg=errors,
        )

    def _write_tests(self, files: dict[str, str]) -> Path:
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        tests_dir = Path(tmp.name)
        tests_dir.mkdir(parents=True, exist_ok=True)

        for name, contents in files.items():
            (tests_dir / name).write_text(contents, encoding="utf-8")

        return tests_dir


if __name__ == "__main__":
    unittest.main()
