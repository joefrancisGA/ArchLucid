"""Tests for the repository-side private-beta readiness contract."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import sys

CI_ROOT = Path(__file__).resolve().parents[1]

if str(CI_ROOT) not in sys.path:
    sys.path.insert(0, str(CI_ROOT))

import check_private_beta_readiness as sut


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]


class TestPrivateBetaReadiness(unittest.TestCase):
    def test_repository_contract_passes(self) -> None:
        self.assertEqual(sut.collect_issues(REPOSITORY_ROOT), [])

    def test_workflow_requires_rc34_and_lockfile_preflight(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            workflow_path = root / ".github/workflows/private-beta-access-on-push.yml"
            workflow_path.parent.mkdir(parents=True)
            workflow_path.write_text(
                "branches: [main, master]\nnpm ci\n",
                encoding="utf-8",
            )

            issues = sut._check_workflow(root)

            self.assertIn(
                "private-beta workflow must include main, master, and RC35 push branches",
                issues,
            )
            self.assertIn(
                "private-beta workflow must run the npm lockfile preflight",
                issues,
            )
            self.assertIn(
                "private-beta workflow must raise the auth-routing invitation-validate rate limit for CI",
                issues,
            )

    def test_workflow_requires_auth_routing_permit_in_both_api_start_blocks(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            workflow_path = root / ".github/workflows/private-beta-access-on-push.yml"
            workflow_path.parent.mkdir(parents=True)
            workflow_path.write_text(
                "\n".join(
                    [
                        "      - name: Start ArchLucid.Api (background, JwtBearer + local PEM)",
                        "        env:",
                        '          RateLimiting__AuthRouting__PermitLimit: "500"',
                        "        run: echo start",
                        "      - name: Restart API after Enterprise grant (refresh tenant-tier cache)",
                        "        env:",
                        '          RateLimiting__AuthRouting__PermitLimit: "10"',
                        "        run: echo restart",
                    ]
                )
                + "\n",
                encoding="utf-8",
            )

            issues = sut._check_workflow(root)

            self.assertIn(
                'private-beta workflow must set RateLimiting__AuthRouting__PermitLimit: "500" '
                "in both API-start environment blocks",
                issues,
            )

    def test_workflow_ignores_auth_routing_permit_on_unrelated_steps(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            workflow_path = root / ".github/workflows/private-beta-access-on-push.yml"
            workflow_path.parent.mkdir(parents=True)
            workflow_path.write_text(
                "\n".join(
                    [
                        "      - name: Start ArchLucid.Api (background, JwtBearer + local PEM)",
                        "        env:",
                        "          ASPNETCORE_URLS: http://127.0.0.1:5128",
                        "        run: echo start",
                        "      - name: Unrelated diagnostic",
                        "        env:",
                        '          RateLimiting__AuthRouting__PermitLimit: "500"',
                        "        run: echo diag",
                        "      - name: Restart API after Enterprise grant (refresh tenant-tier cache)",
                        "        env:",
                        "          ASPNETCORE_URLS: http://127.0.0.1:5128",
                        "        run: echo restart",
                    ]
                )
                + "\n",
                encoding="utf-8",
            )

            issues = sut._check_workflow(root)

            self.assertIn(
                'private-beta workflow must set RateLimiting__AuthRouting__PermitLimit: "500" '
                "in both API-start environment blocks",
                issues,
            )

    def test_workflow_parses_comments_inside_api_start_env_blocks(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            workflow_path = root / ".github/workflows/private-beta-access-on-push.yml"
            workflow_path.parent.mkdir(parents=True)
            workflow_path.write_text(
                "\n".join(
                    [
                        "      - name: Start ArchLucid.Api (background, JwtBearer + local PEM)",
                        "        env:",
                        "          # comment before permit",
                        '          RateLimiting__AuthRouting__PermitLimit: "500"',
                        "        run: echo start",
                        "      - name: Restart API after Enterprise grant (refresh tenant-tier cache)",
                        "        env:",
                        "          # comment before permit",
                        '          RateLimiting__AuthRouting__PermitLimit: "500"',
                        "        run: echo restart",
                    ]
                )
                + "\n",
                encoding="utf-8",
            )

            issues = sut._check_auth_routing_ci_permit(workflow_path.read_text(encoding="utf-8"))

            self.assertEqual(issues, [])

    def test_workflow_requires_auth_routing_rate_limit(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            workflow_path = root / ".github/workflows/private-beta-access-on-push.yml"
            release_gate_path = root / ".github/workflows/rc-release-gate.yml"
            workflow_path.parent.mkdir(parents=True)
            workflow_path.write_text(
                'branches: [main, master, RC35]\nRateLimiting__AuthRouting__PermitLimit: "500"\n',
                encoding="utf-8",
            )
            release_gate_path.write_text("workflow: rc\n", encoding="utf-8")

            issues = sut._check_workflow(root)

            self.assertIn(
                "RC release gate must raise auth-routing rate limits for invite-wave CI",
                issues,
            )

    def test_workflow_requires_auth_routing_rate_limit(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            workflow_path = root / ".github/workflows/private-beta-access-on-push.yml"
            release_gate_path = root / ".github/workflows/rc-release-gate.yml"
            workflow_path.parent.mkdir(parents=True)
            workflow_path.write_text(
                'branches: [main, master, RC35]\nRateLimiting__AuthRouting__PermitLimit: "500"\n',
                encoding="utf-8",
            )
            release_gate_path.write_text("workflow: rc\n", encoding="utf-8")

            issues = sut._check_workflow(root)

            self.assertIn(
                "RC release gate must raise auth-routing rate limits for invite-wave CI",
                issues,
            )

    def test_workflow_requires_witness_queue_concurrency(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            workflow_path = root / ".github/workflows/private-beta-access-on-push.yml"
            corset_path = root / ".github/workflows/ui-typecheck-on-push.yml"
            workflow_path.parent.mkdir(parents=True)
            workflow_path.write_text("cancel-in-progress: false\n", encoding="utf-8")
            corset_path.write_text("cancel-in-progress: true\n", encoding="utf-8")

            issues = sut._check_workflow(root)

            self.assertIn(
                "UI typecheck workflow must queue active witnesses instead of cancelling them",
                issues,
            )

    def test_ruleset_requires_rc34_and_all_contexts(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            ruleset_path = root / ".github/rulesets/golden-cohort-gate-required-check.json"
            ruleset_path.parent.mkdir(parents=True)
            ruleset_path.write_text(
                json.dumps(
                    {
                        "conditions": {"ref_name": {"include": ["refs/heads/master"]}},
                        "rules": [{"parameters": {"required_status_checks": []}}],
                    }
                ),
                encoding="utf-8",
            )

            issues = sut._check_ruleset(root)

            self.assertTrue(any("RC35" in issue for issue in issues))
            self.assertTrue(any("missing contexts" in issue for issue in issues))

    def test_staging_contract_requires_owner_approved_sha_dispatch(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            workflow_path = root / ".github/workflows/cd-staging-on-merge.yml"
            workflow_path.parent.mkdir(parents=True)
            workflow_path.write_text("workflow_run:\n", encoding="utf-8")

            issues = sut._check_staging_dispatch(root)

            self.assertTrue(any("target_sha" in issue for issue in issues))


if __name__ == "__main__":
    unittest.main()
