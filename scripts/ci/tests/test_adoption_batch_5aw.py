"""TB-246 sponsor shell nav drift guards (Batch 5AW)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AW(unittest.TestCase):
    def test_tb_246_nav_links(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "SponsorShellFrame.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("SPONSOR_DASHBOARD_HREF", text)
        self.assertIn("sponsor-shell-nav-dashboard", text)
        self.assertIn("usePathname", text)

    def test_tb_246_vitest(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "SponsorShellFrame.test.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("sponsor-shell-nav-dashboard", text)


if __name__ == "__main__":
    unittest.main()
