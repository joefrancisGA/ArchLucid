"""Regression contract: SQL OFFSET pages must use unique identity tie-breaks."""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[3]
CASES = {
    "ArchLucid.Persistence/InfraEvidence/SqlRemediationInstanceRepository.cs":
        (r"ORDER BY UpdatedUtc DESC, InstanceId ASC\s+OFFSET @Skip ROWS", 1),
    "ArchLucid.Persistence/InfraEvidence/SqlOperationalSecurityFindingRepository.cs":
        (r"ORDER BY LastObservedUtc DESC, FindingId ASC\s+OFFSET @Skip ROWS", 2),
    "ArchLucid.Persistence/InfraEvidence/SqlAzureInventorySnapshotRepository.ListResourcesPaged.cs":
        (r"ORDER BY AzureResourceId ASC, ResourceRowId ASC\s+OFFSET @Skip ROWS", 1),
}


class InfraPaginationStableOrdering(unittest.TestCase):
    def test_ordering_contracts(self):
        for path, (pattern, expected) in CASES.items():
            with self.subTest(path=path):
                sql = (ROOT / path).read_text(encoding="utf-8")
                self.assertEqual(expected, len(re.findall(pattern, sql)))


if __name__ == "__main__":
    unittest.main()
