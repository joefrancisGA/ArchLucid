"""Unit tests for check_schemathesis_light_auth_paths.py."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(REPO_ROOT / "scripts" / "ci"))

import check_schemathesis_light_auth_paths as sut

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCheckSchemathesisLightAuthPaths(unittest.TestCase):
    def test_guard_passes_on_repo(self) -> None:
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "scripts" / "ci" / "check_schemathesis_light_auth_paths.py")],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)

    def test_guard_requires_examples_and_all_checks(self) -> None:
        workflow = sut._REQUIRED_FRAGMENT

        violations = sut.collect_violations(workflow)

        self.assertTrue(any("--checks=all" in violation for violation in violations))
        self.assertTrue(any("--phases=examples" in violation for violation in violations))

    def test_guard_requires_auth_and_scim_path_scope(self) -> None:
        workflow = "\n".join(
            (
                sut._REQUIRED_FRAGMENT,
                "--checks=all",
                "--phases=examples",
            )
        )

        violations = sut.collect_violations(workflow)

        self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
