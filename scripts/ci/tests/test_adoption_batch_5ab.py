"""TB-211 SAML SP certificate rotation runbook drift guards (Batch 5AB)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AB(unittest.TestCase):
    def test_tb_211_canonical_runbook_exists(self) -> None:
        path = REPO_ROOT / "docs" / "runbooks" / "SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Detection", text)
        self.assertIn("openssl", text)
        self.assertIn("Zero-downtime", text)
        self.assertIn("Rollback", text)

    def test_tb_211_configuration_reference_links_runbook(self) -> None:
        path = REPO_ROOT / "docs" / "library" / "CONFIGURATION_REFERENCE.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md", text)
        self.assertIn("../runbooks/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md", text)

    def test_tb_211_library_stub_points_to_runbook(self) -> None:
        path = REPO_ROOT / "docs" / "library" / "SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("../runbooks/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md", text)

    def test_tb_211_runbooks_index_lists_canonical_path(self) -> None:
        path = REPO_ROOT / "docs" / "runbooks" / "README.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md", text)


if __name__ == "__main__":
    unittest.main()
