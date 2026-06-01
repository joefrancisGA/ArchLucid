"""Unit tests for vertical policy-pack packManifest validation (TB-175)."""

from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_LIB = _REPO / "scripts" / "ci" / "policy_pack_manifest_lib.py"
_spec = importlib.util.spec_from_file_location("policy_pack_manifest_lib", _LIB)
assert _spec and _spec.loader
_lib = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_lib)


class PolicyPackManifestLibTests(unittest.TestCase):
    def test_repo_vertical_packs_pass(self) -> None:
        violations = _lib.policy_pack_manifest_violations(_REPO)
        self.assertEqual([], violations)

    def test_missing_pack_manifest_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            pack_dir = root / "templates" / "policy-packs" / "demo"
            pack_dir.mkdir(parents=True)
            (pack_dir / "policy-pack.json").write_text(
                json.dumps({"complianceRuleKeys": ["demo-1"], "metadata": {}}),
                encoding="utf-8",
            )
            (pack_dir / "compliance-rules.json").write_text("{}", encoding="utf-8")

            violations = _lib.policy_pack_manifest_violations(root)

            self.assertTrue(any("missing packManifest" in item for item in violations))


if __name__ == "__main__":
    unittest.main()
