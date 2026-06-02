"""TB-076/TB-077 tenancy defense drift guards."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestTenancyDefenseBatch(unittest.TestCase):
    def test_run_child_run_scope_sql_test_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Persistence.Tests" / "RunChildRunScopeSqlTests.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")

    def test_load_run_detail_imports_operator_resource_scope(self) -> None:
        path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "reviews"
            / "[runId]"
            / "_sections"
            / "load-run-detail-page-model.ts"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("operator-resource-scope", text)
        self.assertIn("runProjectMatchesEffectiveScope", text)


if __name__ == "__main__":
    unittest.main()
