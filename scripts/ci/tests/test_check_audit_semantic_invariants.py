#!/usr/bin/env python3
"""Unit tests for audit semantic invariant guard."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_SCRIPT = _REPO / "scripts" / "ci" / "check_audit_semantic_invariants.py"


def _load_module():
    spec = importlib.util.spec_from_file_location("check_audit_semantic_invariants", _SCRIPT)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load check_audit_semantic_invariants.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


_harness = _load_module()


class AuditSemanticInvariantTests(unittest.TestCase):
    def test_production_fixture_passes(self) -> None:
        violations = _harness.audit_semantic_invariant_violations(_REPO)
        self.assertEqual([], violations)


if __name__ == "__main__":
    unittest.main()
