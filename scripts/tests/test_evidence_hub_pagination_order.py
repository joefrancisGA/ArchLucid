"""Source-backed guard for stable evidence-hub page ordering.

The full service behavior remains covered by .NET tests; this narrow check
ensures tie-breaking occurs before Skip/Take.
"""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "ArchLucid.Application/InfraEvidence/CloudResourceEvidenceHubService.cs"


class EvidenceHubPageOrderingTests(unittest.TestCase):
    def test_architecture_findings_have_identity_tie_break_before_paging(self):
        source = SOURCE.read_text(encoding="utf-8")
        ordering = re.search(
            r"return findings\s*\.Where\(.*?\.OrderByDescending\(.*?"
            r"\.ThenBy\(item => item.Title, StringComparer.OrdinalIgnoreCase\)"
            r"\s*\.ThenBy\(item => item.Id, StringComparer.Ordinal\)"
            r"\s*\.ToList\(\);",
            source, re.DOTALL
        )
        self.assertIsNotNone(ordering, "Architecture findings need stable ID ordering")
        self.assertIn("architectureItems.Skip(PaginationDefaults.ToSkip(page, pageSize)).Take(pageSize)",
                      source)


if __name__ == "__main__":
    unittest.main()
