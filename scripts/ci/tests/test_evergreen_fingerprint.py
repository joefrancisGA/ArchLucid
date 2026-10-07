"""Unit tests for evergreen.fingerprint."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parent.parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

from evergreen.failure_digest import FailedJob, FailureDigest  # noqa: E402
from evergreen.fingerprint import FingerprintCalculator  # noqa: E402


def _digest(jobs: list[FailedJob], branch: str = "master", workflow: str = "W") -> FailureDigest:
    return FailureDigest(
        repository="o/r",
        workflow_name=workflow,
        run_id=1,
        run_url="u",
        event="push",
        conclusion="failure",
        head_branch=branch,
        head_sha="deadbeef",
        failed_jobs=jobs,
    )


def _job(name: str, lines: list[str], steps: list[str] | None = None) -> FailedJob:
    return FailedJob(name=name, failed_steps=steps or ["build"], error_lines=lines, url="j")


_ARCH_A = "##[error]/home/runner/work/A/A/P/Alerts/X.cs(57,39): error ARCH006: Tenant-scoped table 'dbo.A' [P.csproj]"
_ARCH_B = "##[error]/home/runner/work/A/A/P/Advisory/Y.cs(93,13): error ARCH006: Tenant-scoped table 'dbo.B' [P.csproj]"


class TestFingerprintCalculator(unittest.TestCase):
    def test_same_breakage_in_different_order_and_files_matches(self) -> None:
        calculator = FingerprintCalculator()

        first = calculator.compute(_digest([_job("build", [_ARCH_A, _ARCH_B])]))
        second = calculator.compute(_digest([_job("build", [_ARCH_B, _ARCH_A, _ARCH_A])]))

        self.assertEqual(first, second)
        self.assertEqual(len(first), 12)

    def test_different_diagnostic_code_differs(self) -> None:
        calculator = FingerprintCalculator()

        arch = calculator.compute(_digest([_job("build", [_ARCH_A])]))
        typescript = calculator.compute(_digest([_job("build", ["src/a.ts(1,2): error TS2345: nope"])]))

        self.assertNotEqual(arch, typescript)

    def test_branch_workflow_job_and_step_participate(self) -> None:
        calculator = FingerprintCalculator()
        base = calculator.compute(_digest([_job("build", [_ARCH_A])]))

        self.assertNotEqual(base, calculator.compute(_digest([_job("build", [_ARCH_A])], branch="bugsmash")))
        self.assertNotEqual(base, calculator.compute(_digest([_job("build", [_ARCH_A])], workflow="CI")))
        self.assertNotEqual(base, calculator.compute(_digest([_job("other", [_ARCH_A])])))
        self.assertNotEqual(base, calculator.compute(_digest([_job("build", [_ARCH_A], steps=["test"])])))

    def test_job_order_does_not_matter(self) -> None:
        calculator = FingerprintCalculator()
        a = _job("a", [_ARCH_A])
        b = _job("b", ["npm ERR! code ELIFECYCLE"])

        self.assertEqual(calculator.compute(_digest([a, b])), calculator.compute(_digest([b, a])))

    def test_signature_kinds(self) -> None:
        self.assertEqual(FingerprintCalculator.signature(_ARCH_A), "code:ARCH006")
        self.assertEqual(FingerprintCalculator.signature("RuleID:      Generic-API-Key"), "rule:generic-api-key")
        self.assertEqual(
            FingerprintCalculator.signature("##[error]Process completed with exit code 1."),
            "##[error]process completed with exit code n.",
        )
        self.assertEqual(
            FingerprintCalculator.normalise("/home/runner/work/A/A/x.cs at deadbeefcafe line 12"),
            "x.cs at sha line n",
        )

    def test_family_ignores_error_text_but_not_workflow_branch_or_jobs(self) -> None:
        calculator = FingerprintCalculator()
        base = calculator.family(_digest([_job("build", [_ARCH_A])]))

        self.assertEqual(len(base), 12)
        self.assertEqual(base, calculator.family(_digest([_job("build", ["totally different error"], steps=["test"])])))
        self.assertEqual(base, calculator.family(_digest([_job("build", [_ARCH_A]), _job("build", [_ARCH_B])])))
        self.assertNotEqual(base, calculator.family(_digest([_job("other", [_ARCH_A])])))
        self.assertNotEqual(base, calculator.family(_digest([_job("build", [_ARCH_A])], branch="bugsmash")))
        self.assertNotEqual(base, calculator.family(_digest([_job("build", [_ARCH_A])], workflow="CI")))

    def test_log_clock_times_do_not_split_keys(self) -> None:
        calculator = FingerprintCalculator()
        morning = _job("gitleaks", ["11:40AM WRN leaks found: 7", "RuleID:      generic-api-key"])
        afternoon = _job("gitleaks", ["12:58PM WRN leaks found: 3", "RuleID:      generic-api-key"])

        self.assertEqual(calculator.compute(_digest([morning])), calculator.compute(_digest([afternoon])))
        self.assertEqual(FingerprintCalculator.normalise("13:05:22.123 build failed"), "time build failed")

    def test_job_signatures_are_sorted_unique_and_capped(self) -> None:
        job = _job("build", ["z Error: 1", "a Error: 2", "a Error: 2", ""])

        self.assertEqual(FingerprintCalculator().job_signatures(job), ["a error: n", "z error: n"])
        self.assertEqual(FingerprintCalculator(max_signatures_per_job=1).job_signatures(job), ["a error: n"])

    def test_rejects_non_positive_configuration(self) -> None:
        with self.assertRaises(ValueError):
            FingerprintCalculator(max_signatures_per_job=0)

        with self.assertRaises(ValueError):
            FingerprintCalculator(digest_length=0)


if __name__ == "__main__":
    unittest.main()
