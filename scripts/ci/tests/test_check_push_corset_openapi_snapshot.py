"""Unit tests for check_push_corset_openapi_snapshot.py."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCheckPushCorsetOpenapiSnapshot(unittest.TestCase):
    def test_api_tests_project_references_application_tests(self) -> None:
        csproj = (
            REPO_ROOT / "ArchLucid.Api.Tests" / "ArchLucid.Api.Tests.csproj"
        ).read_text(encoding="utf-8")

        self.assertIn(
            r"..\ArchLucid.Application.Tests\ArchLucid.Application.Tests.csproj",
            csproj,
        )

    def test_guard_passes_on_repo(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "ci" / "check_push_corset_openapi_snapshot.py"),
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(
            result.returncode,
            0,
            msg=result.stdout + result.stderr,
        )


if __name__ == "__main__":
    unittest.main()
