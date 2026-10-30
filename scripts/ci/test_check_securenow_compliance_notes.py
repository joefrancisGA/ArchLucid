"""Unit tests for scripts/ci/check_securenow_compliance_notes.py."""

from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.ci.check_securenow_compliance_notes import ROOT, validate


def _copy_tree(destination: Path) -> None:
    for relative in (
        "docs/securenow/CONTROL_EVIDENCE_RESPONSIBILITY.md",
        "docs/securenow/FRAMEWORK_COVERAGE.md",
        "archlucid-ui/src/lib/audit-evidence-control-lineage-markdown.ts",
    ):
        source = ROOT / relative
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)


class SecureNowComplianceNotesTests(unittest.TestCase):
    def test_real_repo_passes(self):
        self.assertEqual([], validate())

    def test_missing_not_verified_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/CONTROL_EVIDENCE_RESPONSIBILITY.md"
            path.write_text(
                path.read_text(encoding="utf-8").replace("NOT VERIFIED", "UNVERIFIED"),
                encoding="utf-8",
            )
            errors = validate(root)
            self.assertTrue(any("NOT VERIFIED" in error for error in errors))

    def test_certification_phrase_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/FRAMEWORK_COVERAGE.md"
            path.write_text(
                path.read_text(encoding="utf-8") + "\nSOC 2 certified.\n",
                encoding="utf-8",
            )
            errors = validate(root)
            self.assertTrue(any("forbidden certification" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
