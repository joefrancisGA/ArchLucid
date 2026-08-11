"""TB-246 executive shell nav drift guards (Batch 5AW)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AW(unittest.TestCase):
    def test_tb_246_nav_links(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "ExecutiveShellFrame.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("EXECUTIVE_DASHBOARD_HREF", text)
        self.assertIn("executive-shell-nav-dashboard", text)
        self.assertIn("usePathname", text)

    def test_tb_246_vitest(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "ExecutiveShellFrame.test.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("executive-shell-nav-dashboard", text)


if __name__ == "__main__":
    unittest.main()
