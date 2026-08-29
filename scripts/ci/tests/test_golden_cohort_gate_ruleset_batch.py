"""Drift guard: golden-cohort ruleset JSON must require corset + cohort-real-llm-gate."""

from __future__ import annotations

import json
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
RULESET = REPO_ROOT / ".github" / "rulesets" / "golden-cohort-gate-required-check.json"

REQUIRED_CONTEXTS = (
    "cohort-real-llm-gate",
    "Security: gitleaks (secret scan)",
    ".NET: push corset (build + fast core Core/Decisioning)",
    "Operator UI: typecheck (blocking)",
)


class TestGoldenCohortGateRulesetBatch(unittest.TestCase):
    def test_ruleset_lists_push_corset_and_cohort_gate(self) -> None:
        payload = json.loads(RULESET.read_text(encoding="utf-8"))
        checks = payload["rules"][0]["parameters"]["required_status_checks"]
        contexts = [entry["context"] for entry in checks]
        for required in REQUIRED_CONTEXTS:
            self.assertIn(required, contexts, f"missing required check context: {required}")


if __name__ == "__main__":
    unittest.main()
