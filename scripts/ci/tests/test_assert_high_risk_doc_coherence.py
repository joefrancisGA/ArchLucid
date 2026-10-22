"""Tests for high-risk doc coherence guard (fixtures + subprocess smoke)."""
from __future__ import annotations

import importlib.util
import subprocess
import sys
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "assert_high_risk_doc_coherence.py"
    spec = importlib.util.spec_from_file_location("_high_risk_doc_coherence", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load guard module.")

    # Ensure sibling imports resolve the same way as `python scripts/ci/...`.
    sys.path.insert(0, str(_CI))

    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    return mod


G = _load_guard()


class TestAssertHighRiskDocCoherence(unittest.TestCase):
    def test_coherence_repo_passes(self):
        script = _CI / "assert_high_risk_doc_coherence.py"
        result = subprocess.run(
            [sys.executable, str(script)],
            cwd=_REPO,
            check=False,
            capture_output=True,
            text=True,
        )

        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)

    def test_trust_fails_on_iso_certified_fixture(self):
        bad = "Our ISO 27001 certified posture is excellent.\n| **SOC 2** | **Deferred** | self-assessment |"

        errs = G.check_trust_center_vs_deferred_posture(bad)

        self.assertTrue(any("iso 27001 certified" in e.lower() for e in errs))

    def test_trust_passes_minimal_deferred_soc_row(self):
        ok = "| **SOC 2** | **Deferred** — interim self-assessment | notes |"

        self.assertEqual(G.check_trust_center_vs_deferred_posture(ok), [])

    def test_mcp_joint_update_detects_scope_only_edit(self):
        scope = "No MCP line here."
        deferred = "foo **Inbound MCP server** bar | **Out of V1.** | baz"

        errs = G.check_mcp_scope_deferred_joint_update(scope, deferred)

        self.assertEqual(len(errs), 1)

    def test_pricing_locked_must_match_public_fixture(self):
        # extract_locked_prices_json requires a line-start ```locked-prices fence (see generate_pricing_json.py).
        philosophy = """Preamble line so the fence is preceded by a newline.

```locked-prices
{"schemaVersion": 1, "teamStripeCheckoutUrlSalesLedPlaceholder": true, "packages": []}
```
"""
        pricing_same = '{"schemaVersion": 1, "teamStripeCheckoutUrlSalesLedPlaceholder": true, "packages": []}'
        pricing_diff = '{"schemaVersion": 1, "teamStripeCheckoutUrlSalesLedPlaceholder": false, "packages": []}'

        self.assertEqual(
            G.check_pricing_locked_json_matches_public(philosophy, pricing_same),
            [],
        )

        drift = G.check_pricing_locked_json_matches_public(philosophy, pricing_diff)

        self.assertTrue(any("must exactly match" in e for e in drift))

    def test_inner_synthetic_contradiction_trust_and_mcp(self):
        v1_scope = "| **Model Context Protocol (MCP) server** | Not in V1: no MCP. |"
        v1_scope = "> S\n\n**MCP** is **not** V1 foo.\n" + v1_scope
        v1_deferred = "## 6d\n| **Inbound MCP server** x | **In V1** | y |\n"
        trust = "iso 27001 certified\n| **SOC 2** | **Deferred** | self-assessment |"
        philosophy = """Intro

```locked-prices
{"schemaVersion": 1, "packages": [], "teamStripeCheckoutUrlSalesLedPlaceholder": true}
```
"""
        pricing_json = '{"schemaVersion": 1, "packages": [], "teamStripeCheckoutUrlSalesLedPlaceholder": true}'

        errs = G.assert_high_risk_doc_coherence_inner(
            v1_scope=v1_scope,
            v1_deferred=v1_deferred,
            trust=trust,
            philosophy=philosophy,
            pricing_json=pricing_json,
        )

        self.assertGreaterEqual(len(errs), 2)
