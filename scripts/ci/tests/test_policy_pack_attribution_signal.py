#!/usr/bin/env python3
"""Unit tests for scripts/ci/policy_pack_attribution_signal.py (TB-884)."""

from __future__ import annotations

import importlib.util
import json
import sys
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_module():
    path = _CI / "policy_pack_attribution_signal.py"
    spec = importlib.util.spec_from_file_location("policy_pack_attribution_signal", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


MOD = _load_module()


class PolicyPackAttributionSignalTests(unittest.TestCase):
  def test_collect_pack_rule_ids_merges_sources(self) -> None:
    pack = {
      "complianceRuleKeys": ["phi.minimization.intake"],
      "complianceRuleIds": ["11111111-1111-1111-1111-111111111111"],
      "metadata": {
        "pack.curatedRules.v1": json.dumps({"rules": [{"id": "curated-rule-1"}]}),
      },
    }

    rule_ids = MOD.collect_pack_rule_ids(pack)

    self.assertEqual(
      rule_ids,
      {
        "phi.minimization.intake",
        "11111111-1111-1111-1111-111111111111",
        "curated-rule-1",
      },
    )

  def test_is_attributable_matches_case_insensitively(self) -> None:
    pack_rule_ids = {"phi.minimization.intake"}
    finding = {"policyRuleId": " PHI.Minimization.Intake ", "rulesApplied": []}

    self.assertTrue(MOD.is_attributable(finding, pack_rule_ids))

  def test_build_summary_enforce_passes_on_committed_corpus(self) -> None:
    corpus = _REPO / "tests" / "eval-corpus" / "policy-pack-attribution"
    summary = MOD.build_summary(corpus)

    self.assertGreaterEqual(summary["scenarioCount"], 4)
    self.assertTrue(summary["hasZeroPercentScenario"])
    self.assertTrue(summary["hasPositivePercentScenario"])
    self.assertTrue(summary["allScenariosMatchExpected"])
    self.assertEqual(summary["rollup"], "PASS")

  def test_main_enforce_and_check(self) -> None:
    corpus = _REPO / "tests" / "eval-corpus" / "policy-pack-attribution"
    json_out = _REPO / "docs" / "quality" / "policy-pack-attribution-summary.json"
    markdown_out = _REPO / "docs" / "quality" / "policy-pack-attribution-summary.md"

    self.assertEqual(
      MOD.main(
        [
          "--corpus",
          str(corpus),
          "--json-out",
          str(json_out),
          "--markdown-out",
          str(markdown_out),
          "--enforce",
        ]
      ),
      0,
    )

    self.assertTrue(json_out.is_file())
    self.assertTrue(markdown_out.is_file())

    self.assertEqual(
      MOD.main(
        [
          "--corpus",
          str(corpus),
          "--json-out",
          str(json_out),
          "--markdown-out",
          str(markdown_out),
          "--check",
        ]
      ),
      0,
    )


if __name__ == "__main__":
  raise SystemExit(unittest.main())