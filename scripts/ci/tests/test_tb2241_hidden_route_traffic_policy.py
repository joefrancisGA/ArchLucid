"""CI drift guard for TB-2241 hidden low-traffic route policy (batch 1)."""

from __future__ import annotations

import re
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
CATALOG = REPO_ROOT / "scripts" / "ci" / "archlucid_ui_route_catalog.py"
TRAFFIC_TABLE = REPO_ROOT / "scripts" / "ci" / "archlucid_ui_route_traffic_table.py"
TEMPLATE = REPO_ROOT / "docs" / "architecture" / "ui_route_traffic_estimates.template.md"
NAV_REGISTRY_TS = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "nav-contextual-only-operator-paths.ts"
PILOT_NAV_BUILDER = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "pilot-nav-group-builder.ts"


class TestTb2241HiddenRouteTrafficPolicy(unittest.TestCase):
    def test_contextual_only_registry_matches_python_catalog(self) -> None:
        catalog = CATALOG.read_text(encoding="utf-8")
        ts = NAV_REGISTRY_TS.read_text(encoding="utf-8")
        self.assertIn("CONTEXTUAL_ONLY_OPERATOR_NAV_PATHS", catalog)
        self.assertIn("/architecture/architecture-intelligence", catalog)
        self.assertIn("CONTEXTUAL_ONLY_OPERATOR_NAV_PATHS", ts)
        self.assertIn("/architecture/architecture-intelligence", ts)

    def test_internal_platform_paths_excluded_from_buyer_traffic_rollups(self) -> None:
        catalog = CATALOG.read_text(encoding="utf-8")
        traffic = TRAFFIC_TABLE.read_text(encoding="utf-8")
        self.assertIn("/internal/agent-model-catalog", catalog)
        self.assertIn("/internal/platform-bundled-policy-packs", catalog)
        self.assertIn("is_buyer_facing_traffic_row", traffic)
        self.assertIn("INTERNAL_UX_RANKING_EXCLUDED_PATHS", traffic)

    def test_pilot_nav_builder_does_not_register_contextual_only_hrefs(self) -> None:
        builder = PILOT_NAV_BUILDER.read_text(encoding="utf-8")
        self.assertNotIn("ARCHITECTURE_INTELLIGENCE_PATH", builder)
        self.assertNotRegex(
            builder,
            re.compile(r'href:\s*"/architecture/architecture-intelligence"'),
        )

    def test_traffic_template_documents_tb2241_policy(self) -> None:
        template = TEMPLATE.read_text(encoding="utf-8")
        self.assertIn("TB-2241", template)
        self.assertIn("contextual-only nav", template, msg="AIN row should document contextual-only nav")


if __name__ == "__main__":
    unittest.main()
