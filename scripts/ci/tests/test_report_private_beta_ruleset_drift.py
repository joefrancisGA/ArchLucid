"""Tests for private-beta ruleset drift reporting."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

CI_ROOT = Path(__file__).resolve().parents[1]

if str(CI_ROOT) not in sys.path:
    sys.path.insert(0, str(CI_ROOT))

import report_private_beta_ruleset_drift as sut


def _ruleset(*, branch: str = "refs/heads/RC35", contexts: tuple[str, ...] = ("beta",)) -> dict[str, object]:
    return {
        "conditions": {"ref_name": {"include": [branch]}},
        "rules": [
            {
                "parameters": {
                    "required_status_checks": [{"context": context} for context in contexts]
                }
            }
        ],
    }


class TestPrivateBetaRulesetDrift(unittest.TestCase):
    def test_matching_rulesets_pass(self) -> None:
        result = sut.compare_rulesets(_ruleset(), _ruleset())

        self.assertEqual(result["disposition"], "PASS")
        self.assertEqual(result["issues"], [])

    def test_missing_context_and_branch_are_reported(self) -> None:
        result = sut.compare_rulesets(
            _ruleset(contexts=("beta", "corset")),
            _ruleset(branch="refs/heads/master", contexts=("beta",)),
        )

        self.assertEqual(result["disposition"], "HOLD")
        self.assertIn("live ruleset is missing required context: corset", result["issues"])
        self.assertIn("live ruleset does not include the RC35 release-cut branch", result["issues"])


if __name__ == "__main__":
    unittest.main()
