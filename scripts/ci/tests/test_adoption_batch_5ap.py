"""TB-225 CS-06 stickiness reader drift guards (Batch 5AP, superseded ADR 0037)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AP(unittest.TestCase):
    def test_tb_225_rls_applicator_removed(self) -> None:
        applicator = REPO_ROOT / "ArchLucid.Persistence" / "Connections" / "IRlsSessionContextApplicator.cs"
        sql_applicator = REPO_ROOT / "ArchLucid.Persistence" / "Connections" / "SqlRlsSessionContextApplicator.cs"
        self.assertFalse(applicator.exists())
        self.assertFalse(sql_applicator.exists())

    def test_tb_225_reader_uses_catalog_scoped_connection(self) -> None:
        path = REPO_ROOT / "ArchLucid.Persistence" / "CustomerSuccess" / "SqlOperatorStickinessSnapshotReader.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("IReadOnlyDbConnectionFactory", text)
        self.assertNotIn("IRlsSessionContextApplicator", text)
        self.assertIn("ToNullableUtcDateTime", text)

    def test_tb_225_persistence_tests(self) -> None:
        path = REPO_ROOT / "ArchLucid.Persistence.Tests" / "CustomerSuccess" / "SqlOperatorStickinessSnapshotReaderTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("ToNullableUtcDateTime_ReturnsNull_WhenDbNull", text)


if __name__ == "__main__":
    unittest.main()
