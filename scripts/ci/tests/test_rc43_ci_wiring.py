"""Fail closed when nondeploying release-candidate full-CI wiring drifts."""

from pathlib import Path
import re
import unittest

WORKFLOW = Path(__file__).resolve().parents[3] / ".github" / "workflows" / "ci.yml"


class ReleaseCandidateCiWiringTests(unittest.TestCase):
    def test_full_non_deploying_ci_uses_explicit_dispatch_not_rc_pushes(self) -> None:
        workflow = WORKFLOW.read_text(encoding="utf-8")
        # A release-candidate push must never initiate a costly full CI run.
        self.assertNotRegex(workflow, r"(?m)^  push:\s*$")
        self.assertRegex(workflow, r"(?m)^  workflow_dispatch:\s*$")
        self.assertRegex(workflow, r"(?m)^  pull_request:\n    branches: \[main, master\]$")
        self.assertRegex(workflow, r"(?m)^  merge_group:\n    branches: \[main, master\]$")
        # RC49 manual runs remain serial and uncancelled rather than silently skipped.
        self.assertIn("'rc49-dispatch'", workflow)
        self.assertIn("github.ref == 'refs/heads/RC49'", workflow)
        self.assertNotIn("branches: [master]", workflow)
        self.assertNotIn("branches: [main]", workflow)
        self.assertNotIn("branches: [RC41]", workflow)
        self.assertNotIn("branches: [RC40]", workflow)
        self.assertNotIn("branches: [RC36]", workflow)


    def test_repair_branches_keep_focused_checks_and_explicit_full_validation(self) -> None:
        workflow = WORKFLOW.read_text(encoding="utf-8")
        repair = WORKFLOW.with_name("rc45-repair.yml").read_text(encoding="utf-8")
        self.assertRegex(repair, r"(?m)^  push:\n    branches: \[RC45\]$")
        self.assertIn("if: github.ref == 'refs/heads/RC45' || github.ref == 'refs/heads/RC46'", repair)
        self.assertIn("bash scripts/ci/run_guards_pre_corset.sh", repair)
        self.assertNotIn("continue-on-error:", repair)
        self.assertIn("group: rc45-repair-${{ github.event_name }}-${{ github.ref }}", repair)
        self.assertIn("cancel-in-progress: true", repair)
        self.assertIn("if: github.event_name == 'workflow_dispatch' && inputs.test_project != ''", repair)
        self.assertIn("needs: guards", repair)
        self.assertIn('--filter "$TEST_FILTER"', repair)
        self.assertIn("The filter did not execute any tests.", repair)
        self.assertIn("if: inputs.sql", repair)
        for text in (workflow, repair):
            self.assertRegex(text, r"(?m)^  workflow_dispatch:$")
        # Full release checks remain manually dispatchable; no RC push trigger.
        for job in ("gitleaks", "guards-pre-corset", "dotnet-fast-core-build",
                    "sql-dbup-empty-catalog", "dotnet-full-regression-core-complete", "ui-unit"):
            self.assertRegex(workflow, rf"(?m)^  {re.escape(job)}:$")
        self.assertRegex(workflow, r"(?m)^  pull_request:\n    branches: \[main, master\]$")
        self.assertRegex(workflow, r"(?m)^  merge_group:\n    branches: \[main, master\]$")

    def test_live_azure_openai_cannot_run_on_release_branches(self) -> None:
        workflow = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("github.ref != 'refs/heads/RC43'", workflow)
        self.assertIn("github.ref != 'refs/heads/RC44'", workflow)
        self.assertIn("github.ref != 'refs/heads/RC45'", workflow)
        self.assertIn("github.ref != 'refs/heads/RC46'", workflow)
        self.assertIn("github.ref != 'refs/heads/RC47'", workflow)
        self.assertNotIn("github.ref != 'refs/heads/RC41'", workflow)
        self.assertNotIn("refs/heads/RC40", workflow)
        self.assertNotIn("refs/heads/RC36", workflow)

    def test_vitest_cohorts_cover_every_test_file_without_skips(self) -> None:
        """Four required shards must collectively run all 64 disjoint cohorts."""
        workflow = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn('first_shard="$((16 * (shard_index - 1) + 1))"', workflow)
        self.assertIn('last_shard="$((16 * shard_index))"', workflow)
        self.assertIn('--shard="${shard_in_cohort}/64"', workflow)
        self.assertIn("failed=1", workflow)
        self.assertIn('exit "${failed}"', workflow)
        cohorts = [
            cohort
            for shard_index in range(1, 5)
            for cohort in range(16 * (shard_index - 1) + 1, 16 * shard_index + 1)
        ]
        self.assertEqual(cohorts, list(range(1, 65)))

    def test_release_candidate_diagnostics_do_not_hide_openapi_failure(self) -> None:
        workflow = WORKFLOW.read_text(encoding="utf-8")

        def job_block(job_name: str) -> str:
            match = re.search(rf"(?m)^  {re.escape(job_name)}:\s*$", workflow)
            self.assertIsNotNone(match)
            return re.split(r"(?m)^  [a-z][a-z0-9-]*:\s*$", workflow[match.end():], maxsplit=1)[0]

        snapshot = job_block("openapi-contract-snapshot")
        build = job_block("dotnet-fast-core-build")
        # This is additional diagnostic execution, not an OpenAPI gate bypass.
        self.assertNotIn("continue-on-error:", snapshot)
        self.assertIn("bash scripts/ci/check_openapi_contract_snapshot.sh", snapshot)
        self.assertIn("- openapi-contract-snapshot", build)
        self.assertIn("!cancelled()", build)
        self.assertIn("github.ref == 'refs/heads/RC43'", build)
        self.assertIn("github.ref == 'refs/heads/RC44'", build)
        self.assertIn("github.ref == 'refs/heads/RC46'", build)
        self.assertIn("github.ref == 'refs/heads/RC47'", build)
        self.assertIn("github.ref == 'refs/heads/RC49'", build)
        self.assertIn("needs.openapi-contract-snapshot.result == 'success'", build)
        for prerequisite in (
            "gitleaks",
            "ci-path-lanes",
            "terraform-validate-private",
            "terraform-validate-public-stacks",
            "guards-pre-corset",
        ):
            self.assertIn(f"needs.{prerequisite}.result == 'success'", build)
        self.assertIn("bash scripts/ci/run_dotnet_fast_core_build.sh", build)


if __name__ == "__main__":
    unittest.main()
