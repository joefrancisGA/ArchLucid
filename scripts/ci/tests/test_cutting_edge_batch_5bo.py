"""TB-194 RAG corpus operator health panel drift guards (Batch 5BO)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCuttingEdgeBatch5BO(unittest.TestCase):
    def test_tb_194_admin_rag_health_endpoint(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Admin" / "AdminRagHealthController.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("rag-health", text)
        self.assertIn("GetCorpusFreshnessSummaries", text)
        self.assertIn("IsStale", text)

    def test_tb_194_admin_ui_page(self) -> None:
        path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "admin"
            / "rag-health"
            / "_sections"
            / "RagHealthAdminPageClient.tsx"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("rag-health-admin-page", text)
        self.assertIn("embeddingDimension", text)

    def test_tb_194_admin_nav_link(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "operator-admin-nav-group-builder.ts"
        text = path.read_text(encoding="utf-8")
        self.assertIn("/admin/rag-health", text)


if __name__ == "__main__":
    unittest.main()
