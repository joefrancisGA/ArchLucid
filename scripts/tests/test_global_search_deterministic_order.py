"""Guard the capped global-search SQL against ambiguous ordering on ties.

This is a structural regression check, not a substitute for SQL Server integration.
"""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SQL_SOURCE = ROOT / "ArchLucid.Persistence/Search/SqlGlobalSearchRepository.cs"


class GlobalSearchDeterminismTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        text = SQL_SOURCE.read_text(encoding="utf-8")
        cls.statements = re.findall(
            r"SELECT TOP \\(@Take\\).*?ORDER BY\\s+([^;]+);",
            text, re.IGNORECASE | re.DOTALL
        )

    def test_all_three_capped_categories_have_ordering(self):
        self.assertEqual(3, len(self.statements))

    def test_runs_have_unique_tie_break(self):
        self.assertRegex(self.statements[0], r"CreatedUtc\\s+DESC,\\s*RunId\\s+DESC")

    def test_findings_have_stable_identity_ties(self):
        self.assertRegex(self.statements[1], r"SortOrder\\s+ASC,\\s*r\\.RunId\\s+ASC")
        self.assertRegex(self.statements[1], r"fr\\.FindingId\\s+ASC")
        self.assertRegex(self.statements[1], r"fr\\.FindingsSnapshotId\\s+ASC")

    def test_policy_packs_have_unique_tie_break(self):
        self.assertRegex(self.statements[2], r"CreatedUtc\\s+DESC,\\s*PolicyPackId\\s+DESC")


if __name__ == "__main__":
    unittest.main()
