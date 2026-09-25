"""Unit tests for check_temporary_behavior_registry.py."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parents[1]
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

import check_temporary_behavior_registry as sut


def entry(expires_on: str = "2027-01-01") -> dict[str, str]:
    return {
        "id": "example",
        "owner": "platform",
        "expiresOn": expires_on,
        "reason": "temporary compatibility behavior",
        "replacement": "remove after upstream support lands",
    }


class CheckTemporaryBehaviorRegistryTests(unittest.TestCase):
    def write_registry(self, root: Path, payload: object) -> Path:
        path = root / "temporary-behaviors.json"
        path.write_text(json.dumps(payload), encoding="utf-8")
        return path

    def test_accepts_owned_unexpired_entry(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = self.write_registry(Path(tmp), [entry()])
            self.assertEqual(sut.check_registry(path, today=date(2026, 9, 24)), [])

    def test_rejects_expired_entry(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = self.write_registry(Path(tmp), [entry("2026-09-23")])
            errors = sut.check_registry(path, today=date(2026, 9, 24))
            self.assertTrue(any("expired" in error for error in errors))

    def test_rejects_duplicate_ids(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = self.write_registry(Path(tmp), [entry(), entry()])
            errors = sut.check_registry(path, today=date(2026, 9, 24))
            self.assertTrue(any("duplicate id" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
