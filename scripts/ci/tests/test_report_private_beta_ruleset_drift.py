"""Tests for private-beta ruleset drift reporting."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

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

    def test_warn_only_writes_hold_report_without_failing(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            repository_path = root / "repository.json"
            live_path = root / "live.json"
            output_path = root / "report.json"
            repository_path.write_text(
                '{"conditions":{"ref_name":{"include":["refs/heads/RC35"]}},'
                '"rules":[{"parameters":{"required_status_checks":[{"context":"corset"}]}}]}',
                encoding="utf-8",
            )
            live_path.write_text(
                '{"conditions":{"ref_name":{"include":["refs/heads/master"]}},'
                '"rules":[{"parameters":{"required_status_checks":[]}}]}',
                encoding="utf-8",
            )

            with patch.object(
                sys,
                "argv",
                [
                    "report_private_beta_ruleset_drift.py",
                    "--repository-ruleset",
                    str(repository_path),
                    "--live-ruleset",
                    str(live_path),
                    "--json-out",
                    str(output_path),
                    "--warn-only",
                ],
            ):
                with patch("builtins.print") as print_mock:
                    self.assertEqual(sut.main(), 0)

            self.assertEqual(json.loads(output_path.read_text(encoding="utf-8"))["disposition"], "HOLD")
            self.assertIn("::warning::", print_mock.call_args.args[0])


if __name__ == "__main__":
    unittest.main()
