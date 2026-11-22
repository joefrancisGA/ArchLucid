"""Static, fail-closed FND-004 guard checks; no .NET build required."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GATE = ROOT / "ArchLucid.Core/Configuration/ExperimentalCapabilityGate.cs"
LEGACY = ROOT / "ArchLucid.Host.Core/Authority/FeatureManagementAuthorityPipelineModeResolver.cs"

class ExperimentalIsolationGuards(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.gate = GATE.read_text(encoding="utf-8")
        cls.legacy = LEGACY.read_text(encoding="utf-8")

    def test_kill_switch_precedes_provider(self):
        self.assertIn("if (!globalEnabled || killSwitch || !tenantAuthorized)", self.gate)
        self.assertLess(self.gate.index("if (!globalEnabled || killSwitch || !tenantAuthorized)"),
                        self.gate.index("featureFlags.IsEnabledAsync"))

    def test_unknown_capability_rejected(self):
        self.assertIn('&& capability != "ExtensionDiscoveryV2"', self.gate)
        self.assertIn("return false;", self.gate)

    def test_existing_feature_provider_reused(self):
        self.assertIn("IFeatureFlags featureFlags", self.gate)
        self.assertIn('featureFlags.IsEnabledAsync("Experimental2:" + capability', self.gate)

    def test_legacy_sql_default_unchanged(self):
        self.assertIn('GetSection("FeatureManagement:FeatureFlags:AsyncAuthorityPipeline")', self.legacy)
        self.assertIn("if (!flagSection.Exists())\n            return true;", self.legacy)

if __name__ == "__main__":
    unittest.main()
