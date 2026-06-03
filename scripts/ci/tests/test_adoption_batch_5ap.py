"""TB-225 CS-06 RLS on stickiness reader drift guards (Batch 5AP)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AP(unittest.TestCase):
    def test_tb_225_rls_applicator_types(self) -> None:
        path = REPO_ROOT / "ArchLucid.Persistence" / "Connections" / "IRlsSessionContextApplicator.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("ApplyAsync", text)
        self.assertIn("al_tenant_id", Path(REPO_ROOT / "ArchLucid.Persistence" / "Connections" / "SqlRlsSessionContextApplicator.cs").read_text(encoding="utf-8"))

    def test_tb_225_reader_applies_rls(self) -> None:
        path = REPO_ROOT / "ArchLucid.Persistence" / "CustomerSuccess" / "SqlOperatorStickinessSnapshotReader.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("IReadOnlyDbConnectionFactory", text)
        self.assertIn("IRlsSessionContextApplicator", text)
        self.assertIn("ApplyAsync", text)
        self.assertIn("ToNullableUtcDateTime", text)

    def test_tb_225_persistence_tests(self) -> None:
        path = REPO_ROOT / "ArchLucid.Persistence.Tests" / "CustomerSuccess" / "SqlOperatorStickinessSnapshotReaderRlsTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("GetOperatorSignalsAsync_AppliesRls", text)
        self.assertIn("GetFunnelSnapshotAsync_AppliesRls", text)
        self.assertIn("ToNullableUtcDateTime_ReturnsNull_WhenDbNull", text)


if __name__ == "__main__":
    unittest.main()
