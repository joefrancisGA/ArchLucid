"""Concurrency guard for authority pipeline finalization."""
from pathlib import Path
import unittest

SOURCE = Path(__file__).resolve().parents[3] / "ArchLucid.Persistence/Sql/RunRepositorySql.ArchiveAndExistence.cs"

class ManifestFinalizationConcurrencyTests(unittest.TestCase):
    def test_competing_manifest_cannot_silently_succeed(self):
        code = SOURCE.read_text(encoding="utf-8").split("public const string MarkAuthorityPipelineCommitted =", 1)[1].split('""";', 1)[0]
        self.assertIn("GoldenManifestId = COALESCE(GoldenManifestId, @GoldenManifestId)", code)
        self.assertIn("AND (GoldenManifestId IS NULL OR GoldenManifestId = @GoldenManifestId)", code)
        self.assertIn("SELECT @@ROWCOUNT;", code)

if __name__ == "__main__":
    unittest.main()
