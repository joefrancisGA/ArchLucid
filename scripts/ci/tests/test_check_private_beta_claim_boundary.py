"""Unit tests for check_private_beta_claim_boundary.py."""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parents[1]
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

import check_private_beta_claim_boundary as sut

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCheckPrivateBetaClaimBoundary(unittest.TestCase):
    def test_guard_passes_on_repo(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "ci" / "check_private_beta_claim_boundary.py"),
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)

    def test_scan_rejects_uncaveated_soc2_certified(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            for rel in sut._DOCS:
                path = root / rel
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("ArchLucid is SOC 2 certified.\n", encoding="utf-8")

            violations = sut.scan_docs(root)

        self.assertTrue(any("SOC 2 certified" in item for item in violations))

    def test_scan_allows_caveated_line(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            for rel in sut._DOCS:
                path = root / rel
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("Do not claim SOC 2 certified.\n", encoding="utf-8")

            violations = sut.scan_docs(root)

        self.assertEqual(violations, [])

    def test_scan_buyer_surfaces_rejects_uncaveated_overclaim(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for rel in sut._BUYER_SURFACES:
                path = root / rel
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("ArchLucid is SOC 2 certified.\n", encoding="utf-8")

            violations = sut.scan_buyer_surfaces(root)

        self.assertEqual(len(violations), len(sut._BUYER_SURFACES))
        self.assertTrue(all("SOC 2 certified" in item for item in violations))

    def test_founder_demo_requires_recovery_honesty_markers(self) -> None:
        errors = sut.require_founder_demo_recovery(REPO_ROOT)

        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
