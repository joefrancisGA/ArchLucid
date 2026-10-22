"""Unit tests for assert_manifest_hash_hasher_baseline_locked.py."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

_SCRIPT = Path(__file__).resolve().parents[1] / "assert_manifest_hash_hasher_baseline_locked.py"
_SPEC = importlib.util.spec_from_file_location("assert_manifest_hash_hasher_baseline_locked", _SCRIPT)
assert _SPEC and _SPEC.loader
_MOD = importlib.util.module_from_spec(_SPEC)
sys.modules[_SPEC.name] = _MOD
_SPEC.loader.exec_module(_MOD)


class AssertManifestHashHasherBaselineLockedTests(unittest.TestCase):
    def test_skips_when_service_not_in_diff(self) -> None:
        code, _ = _MOD.evaluate_changed_paths(["docs/README.md"])
        self.assertEqual(code, 0)

    def test_fails_when_service_changes_without_baseline(self) -> None:
        code, message = _MOD.evaluate_changed_paths(
            [_MOD.SERVICE_REL]
        )
        self.assertEqual(code, 1)
        self.assertIn("baseline", message.lower())

    def test_passes_when_baseline_json_updated(self) -> None:
        code, _ = _MOD.evaluate_changed_paths(
            [_MOD.SERVICE_REL, _MOD.BASELINE_JSON_REL]
        )
        self.assertEqual(code, 0)

    def test_passes_when_baseline_doc_updated(self) -> None:
        code, _ = _MOD.evaluate_changed_paths(
            [_MOD.SERVICE_REL, _MOD.BASELINE_DOC_REL]
        )
        self.assertEqual(code, 0)


if __name__ == "__main__":
    unittest.main()
