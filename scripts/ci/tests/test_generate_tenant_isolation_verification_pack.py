#!/usr/bin/env python3
"""Unit tests for tenant isolation verification pack generator."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_SCRIPT = _REPO / "scripts" / "generate_tenant_isolation_verification_pack.py"


def _load_module():
    spec = importlib.util.spec_from_file_location("generate_tenant_isolation_verification_pack", _SCRIPT)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load tenant isolation pack generator.")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class GenerateTenantIsolationVerificationPackTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mod = _load_module()

    def test_build_pack_payload_has_required_sections(self) -> None:
        payload = self.mod.build_pack_payload()
        self.assertEqual(payload["schemaVersion"], 1)
        self.assertIn("topology", payload)
        self.assertIn("isolationLayers", payload)
        self.assertIn("retrieval", payload["isolationLayers"])
        self.assertEqual(payload["missingReferenceDocs"], [])

    def test_render_markdown_includes_topology_mode(self) -> None:
        payload = self.mod.build_pack_payload()
        md = self.mod._render_markdown(payload)
        self.assertIn("SystemWithPerTenantCatalogs", md)
        self.assertIn("Policy-pack safe default", md)


if __name__ == "__main__":
    unittest.main()
