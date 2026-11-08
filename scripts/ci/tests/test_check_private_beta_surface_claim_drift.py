"""Tests for final landing/showcase route claim drift."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import sys

CI_ROOT = Path(__file__).resolve().parents[1]

if str(CI_ROOT) not in sys.path:
    sys.path.insert(0, str(CI_ROOT))

import check_private_beta_surface_claim_drift as sut


class TestPrivateBetaSurfaceClaimDrift(unittest.TestCase):
    def test_repository_inventory_passes(self) -> None:
        self.assertEqual(sut.collect_violations(sut.REPO_ROOT), [])

    def _fixture(self, root: Path) -> None:
        for route, documents in sut.ROUTE_INVENTORY.items():
            for document in documents:
                path = root / document
                path.parent.mkdir(parents=True, exist_ok=True)
                previous = path.read_text(encoding="utf-8") if path.exists() else ""
                path.write_text(previous + "\n" + route, encoding="utf-8")

    def test_symlinked_claim_document_is_not_trusted(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self._fixture(root)
            document = next(iter(sut.ROUTE_INVENTORY.values()))[0]
            target = root / document
            external = root / "external.md"
            external.write_text(target.read_text(encoding="utf-8"), encoding="utf-8")
            target.unlink()
            target.symlink_to(external)
            issues = sut.collect_violations(root)
            self.assertTrue(any("symlinked claim source" in issue for issue in issues))

    def test_invalid_utf8_document_fails_as_violation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self._fixture(root)
            document = next(iter(sut.ROUTE_INVENTORY.values()))[0]
            (root / document).write_bytes(b"\xff\xfe")
            issues = sut.collect_violations(root)
            self.assertTrue(any("claim source unreadable" in issue for issue in issues))

    def test_missing_route_is_reported(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for document in {path for paths in sut.ROUTE_INVENTORY.values() for path in paths}:
                path = root / document
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("/see-it\n", encoding="utf-8")

            violations = sut.collect_violations(root)

        self.assertTrue(any("/showcase/customer-intake-modernization" in violation for violation in violations))


if __name__ == "__main__":
    unittest.main()
