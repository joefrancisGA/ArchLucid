"""Text-level guards for scripts/Emit-ReleaseReadinessEvidence.ps1."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]


class TestReleaseReadinessEvidenceScript(unittest.TestCase):
    def test_summary_names_required_evidence_fields(self) -> None:
        text = (_REPO / "scripts" / "Emit-ReleaseReadinessEvidence.ps1").read_text(encoding="utf-8")

        self.assertIn("environment = $Environment", text)
        self.assertIn("gitCommitSha = $gitCommitSha", text)
        self.assertIn("Health readiness (live API)", text)
        self.assertIn("Version endpoint (live API)", text)
        self.assertIn("DB migration status", text)
        self.assertIn("k6 smoke status", text)
        self.assertIn("does not claim production SLA compliance", text)
        self.assertIn("Invoke-WriteReleaseEvidenceBundleManifest.ps1", text)
        self.assertIn("Invoke-ValidateReleaseEvidenceBundle.ps1", text)
        self.assertIn("release-evidence-bundle-manifest.json", text)
        self.assertIn("Real-mode AI evidence artifact (claim boundary)", text)
        self.assertIn("real-llm-evidence-gate.json", text)


if __name__ == "__main__":
    unittest.main()
