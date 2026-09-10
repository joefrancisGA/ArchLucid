"""Drift guard: private-beta addon ruleset JSON is ready for owner apply after first green smoke."""

from __future__ import annotations

import json
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
ADDON_RULESET = REPO_ROOT / ".github" / "rulesets" / "golden-cohort-gate-private-beta-addon.json"

REQUIRED_CONTEXTS = (
    "cohort-real-llm-gate",
    "Security: gitleaks (secret scan)",
    ".NET: fast core (corset)",
    "Operator UI: typecheck (blocking)",
    "CI: beta-readiness wiring guards",
    "Operator UI: private-beta access-path (JwtBearer)",
)


class TestGoldenCohortPrivateBetaAddonRulesetBatch(unittest.TestCase):
    def test_addon_ruleset_lists_private_beta_smoke_check(self) -> None:
        payload = json.loads(ADDON_RULESET.read_text(encoding="utf-8"))
        checks = payload["rules"][0]["parameters"]["required_status_checks"]
        contexts = [entry["context"] for entry in checks]
        for required in REQUIRED_CONTEXTS:
            self.assertIn(required, contexts, f"missing required check context: {required}")


if __name__ == "__main__":
    unittest.main()
