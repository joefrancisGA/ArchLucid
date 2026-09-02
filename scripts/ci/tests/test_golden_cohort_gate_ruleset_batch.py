"""Drift guard: golden-cohort ruleset JSON must require corset + cohort-real-llm-gate + beta-readiness."""

from __future__ import annotations

import json
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
RULESET = REPO_ROOT / ".github" / "rulesets" / "golden-cohort-gate-required-check.json"

REQUIRED_CONTEXTS = (
    "cohort-real-llm-gate",
    "Security: gitleaks (secret scan)",
    ".NET: fast core (corset)",
    "Operator UI: typecheck (blocking)",
    "CI: beta-readiness wiring guards",
)


class TestGoldenCohortGateRulesetBatch(unittest.TestCase):
    def test_ruleset_lists_push_corset_cohort_gate_and_beta_readiness(self) -> None:
        payload = json.loads(RULESET.read_text(encoding="utf-8"))
        checks = payload["rules"][0]["parameters"]["required_status_checks"]
        contexts = [entry["context"] for entry in checks]
        for required in REQUIRED_CONTEXTS:
            self.assertIn(required, contexts, f"missing required check context: {required}")


if __name__ == "__main__":
    unittest.main()
