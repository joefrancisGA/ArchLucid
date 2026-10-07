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
                "private-beta workflow must include main, master, and RC34 push branches",
                issues,
            )
            self.assertIn(
                "private-beta workflow must run the npm lockfile preflight",
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

            self.assertTrue(any("RC34" in issue for issue in issues))
            self.assertTrue(any("missing contexts" in issue for issue in issues))


if __name__ == "__main__":
    unittest.main()
