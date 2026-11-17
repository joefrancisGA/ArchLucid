"""Unit tests for scripts/ci/check_securenow_cutting_edge.py."""

from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.ci.check_securenow_cutting_edge import ROOT, validate

TRACKED_PATHS = (
    "ArchLucid.Contracts/InfraEvidence/InfraEvidenceAskTopicKinds.cs",
    "ArchLucid.Contracts/InfraEvidence/InfraEvidenceAskRequest.cs",
    "ArchLucid.Application/InfraEvidence/Ask/InfraEvidenceAskIntentResolver.cs",
    "ArchLucid.Application/InfraEvidence/Ask/InfraEvidenceAskPromptBuilder.cs",
    "ArchLucid.Application/InfraEvidence/Ask/InfraEvidenceAskEvidenceCollector.cs",
)


def _copy_tree(destination: Path) -> None:
    for relative in TRACKED_PATHS:
        source = ROOT / relative
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)


class SecureNowCuttingEdgeTests(unittest.TestCase):
    def test_real_repo_passes(self):
        self.assertEqual([], validate())

    def test_missing_ranked_path_topic_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "ArchLucid.Contracts/InfraEvidence/InfraEvidenceAskTopicKinds.cs"
            path.write_text(
                path.read_text(encoding="utf-8").replace(
                    '    public const string RankedPath = "RankedPath";\n\n',
                    "",
                ),
                encoding="utf-8",
            )
            errors = validate(root)
            self.assertTrue(any("ask topic must include RankedPath" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
