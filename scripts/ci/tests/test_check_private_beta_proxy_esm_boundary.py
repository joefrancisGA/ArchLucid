"""Unit tests for check_private_beta_proxy_esm_boundary.py."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCheckPrivateBetaProxyEsmBoundary(unittest.TestCase):
    def test_guard_passes_on_repo(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "ci" / "check_private_beta_proxy_esm_boundary.py"),
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)

    def test_scan_rejects_help_content_import(self) -> None:
        sys.path.insert(0, str(REPO_ROOT / "scripts" / "ci"))
        import check_private_beta_proxy_esm_boundary as sut

        errors: list[str] = []
        sut._scan(
            "archlucid-ui/src/lib/host-gate.ts",
            'import { LEGACY_GETTING_STARTED_PATH } from "@/lib/getting-started-help-guide-content";',
            errors,
        )

        self.assertTrue(any("getting-started-help-guide-content" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
