#!/usr/bin/env python3
"""Unit tests for bundled policy pack content quality harness."""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_SCRIPT = _REPO / "scripts" / "ci" / "check_policy_pack_content_quality.py"


def _load_module():
    spec = importlib.util.spec_from_file_location("check_policy_pack_content_quality", _SCRIPT)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load policy pack content quality harness.")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


_harness = _load_module()
policy_pack_content_quality_violations = _harness.policy_pack_content_quality_violations


class PolicyPackContentQualityTests(unittest.TestCase):
    def test_production_bundled_packs_pass_harness(self) -> None:
        violations = policy_pack_content_quality_violations(_REPO)
        self.assertEqual([], violations)

    def test_duplicate_rule_key_is_reported(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            bundled = root / "ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled"
            bundled.mkdir(parents=True)
            docs = root / "docs/go-to-market"
            docs.mkdir(parents=True)

            manifest = {"version": 1, "contentFiles": ["a.json", "b.json"]}
            (bundled / "bundled-policy-packs-v1.manifest.json").write_text(
                json.dumps(manifest),
                encoding="utf-8",
            )

            pack_a = {
                "complianceRuleKeys": ["dup-001"],
                "metadata": {
                    "pack.displayName": "Pack A",
                    "pack.description": "Themes only; not certification.",
                    "frameworkMappingDisclaimer": "Informative mapping only.",
                },
            }
            pack_b = {
                "complianceRuleKeys": ["dup-001"],
                "metadata": {
                    "pack.displayName": "Pack B",
                    "pack.description": "Themes only; not certification.",
                    "frameworkMappingDisclaimer": "Informative mapping only.",
                },
            }

            (bundled / "a.json").write_text(json.dumps(pack_a), encoding="utf-8")
            (bundled / "b.json").write_text(json.dumps(pack_b), encoding="utf-8")
            (docs / "DEFAULT_POLICY_PACKS_V1.md").write_text(
                "manifest still ships **2** content files",
                encoding="utf-8",
            )

            violations = policy_pack_content_quality_violations(root)
            self.assertTrue(any("duplicate complianceRuleKey" in item for item in violations))

    def test_cloud_neutral_pack_requires_multi_cloud_extractor_grounding(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            bundled = root / "ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled"
            samples = root / "docs/samples/policy-packs"
            bundled.mkdir(parents=True)
            samples.mkdir(parents=True)

            manifest = {"version": 1, "contentFiles": ["security-architecture-baseline.json"]}
            (bundled / "bundled-policy-packs-v1.manifest.json").write_text(
                json.dumps(manifest),
                encoding="utf-8",
            )

            curated = {
                "pack": {"name": "Security Architecture Baseline", "description": "Themes only; not certification."},
                "rules": [
                    {
                        "id": "sec-base-001",
                        "description": "MFA for privileged access.",
                        "evidenceHints": ["azureExtractor.manifest.RawJson"],
                    }
                ],
            }
            curated_rel = "docs/samples/policy-packs/security-architecture-baseline-rules-v1.json"
            (samples / "security-architecture-baseline-rules-v1.json").write_text(
                json.dumps(curated),
                encoding="utf-8",
            )

            pack = {
                "complianceRuleKeys": ["sec-base-001"],
                "metadata": {
                    "pack.displayName": "Security Architecture Baseline",
                    "pack.description": "Themes only; not certification.",
                    "frameworkMappingDisclaimer": "Informative mapping only.",
                    "curatedRulesArtifact": curated_rel,
                },
            }
            (bundled / "security-architecture-baseline.json").write_text(json.dumps(pack), encoding="utf-8")

            violations = policy_pack_content_quality_violations(root)
            self.assertTrue(any("cloud-neutral pack must ground" in item for item in violations))


if __name__ == "__main__":
    unittest.main()
