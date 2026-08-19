"""TB-194 RAG corpus operator health panel drift guards (Batch 5BO)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCuttingEdgeBatch5BO(unittest.TestCase):
    def test_tb_194_admin_rag_health_endpoint(self) -> None:
        controller_path = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Admin" / "AdminRagHealthController.cs"
        controller_text = controller_path.read_text(encoding="utf-8")
        self.assertIn("rag-health", controller_text)
        self.assertIn("IAdminRagHealthQuery", controller_text)

        query_path = REPO_ROOT / "ArchLucid.Retrieval" / "Admin" / "AdminRagHealthQuery.cs"
        query_text = query_path.read_text(encoding="utf-8")
        self.assertIn("GetCorpusFreshnessSummaries", query_text)
        self.assertIn("IsStale", query_text)

    def test_tb_194_admin_ui_page(self) -> None:
        path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "internal"
            / "rag-health"
            / "_sections"
            / "RagHealthAdminPageClient.tsx"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("rag-health-admin-page", text)
        self.assertIn("embeddingDimension", text)

    def test_tb_194_admin_nav_link(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "operator" / "operator-system-admin-nav-group-builder.ts"
        text = path.read_text(encoding="utf-8")
        self.assertIn("INTERNAL_RAG_HEALTH_PATH", text)
        routes = (REPO_ROOT / "archlucid-ui" / "src" / "lib" / "internal-ops-route-paths.ts").read_text(
            encoding="utf-8"
        )
        self.assertIn("/internal/rag-health", routes)


if __name__ == "__main__":
    unittest.main()
