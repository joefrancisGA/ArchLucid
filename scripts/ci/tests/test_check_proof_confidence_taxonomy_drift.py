"""Unit tests for proof-confidence taxonomy drift guard."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
_CI = _REPO_ROOT / "scripts" / "ci"


def _load_module():
    script = _CI / "check_proof_confidence_taxonomy_drift.py"
    spec = importlib.util.spec_from_file_location("_check_proof_confidence_taxonomy_drift", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load proof-confidence taxonomy drift guard.")

    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)

    return module


class ProofConfidenceTaxonomyDriftTests(unittest.TestCase):
    def test_clean_repo_has_no_violations(self) -> None:
        module = _load_module()
        violations = module.proof_confidence_taxonomy_violations(_REPO_ROOT)
        self.assertEqual(violations, [], msg="\n".join(violations))


if __name__ == "__main__":
    unittest.main()
