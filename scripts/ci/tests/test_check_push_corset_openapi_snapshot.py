"""Unit tests for check_push_corset_openapi_snapshot.py."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parents[1]
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

import check_push_corset_openapi_snapshot as sut

REPO_ROOT = Path(__file__).resolve().parents[3]

_REVERTED_ALWAYS_CACHE = """#!/usr/bin/env bash
# GITHUB_ACTIONS still mentioned so a token-only guard would pass.
CACHE_ROOT="$ROOT/.cache"
NUGET_PACKAGES="$CACHE_ROOT/nuget-packages"
mkdir -p "$NUGET_PACKAGES"
export NUGET_PACKAGES
"""


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

    def test_github_actions_nuget_cache_branch_is_required(self) -> None:
        script = (
            REPO_ROOT / "scripts" / "ci" / "ensure_openapi_contract_build.sh"
        ).read_text(encoding="utf-8")

        self.assertEqual(sut.collect_github_actions_nuget_cache_errors(script), [])

    def test_comment_only_github_actions_token_does_not_pass(self) -> None:
        errors = sut.collect_github_actions_nuget_cache_errors(_REVERTED_ALWAYS_CACHE)

        self.assertTrue(
            errors,
            msg="reverted .cache NUGET_PACKAGES redirect must fail even when GITHUB_ACTIONS remains in a comment",
        )
        self.assertTrue(
            any("GITHUB_ACTIONS" in error for error in errors),
            msg=errors,
        )


if __name__ == "__main__":
    unittest.main()
