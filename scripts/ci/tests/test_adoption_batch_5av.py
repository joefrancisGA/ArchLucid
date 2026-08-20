"""TB-243 sponsor proof delivery tracking drift guards (Batch 5AV)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AV(unittest.TestCase):
    def test_tb_243_audit_event(self) -> None:
        audit_dir = REPO_ROOT / "ArchLucid.Core" / "Audit"
        text = "\n".join(path.read_text(encoding="utf-8") for path in sorted(audit_dir.glob("AuditEventTypes*.cs")))
        self.assertIn("SponsorEvidencePackSent", text)

    def test_tb_243_api_endpoint(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Pilots" / "PilotsController.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("sponsor-pack-sent", text)
        self.assertIn("SponsorEvidencePackSent", text)

    def test_tb_243_ui_cta(self) -> None:
        banner_path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "EmailRunToSponsorBanner.tsx"
        hook_path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "use-email-run-to-sponsor-banner.ts"
        banner_text = banner_path.read_text(encoding="utf-8")
        hook_text = hook_path.read_text(encoding="utf-8")
        self.assertIn("markSponsorPackSent", hook_text)
        self.assertIn("email-run-to-sponsor-mark-sent", banner_text)


if __name__ == "__main__":
    unittest.main()
