"""Unit tests for check_quick_scan_sample_only.py."""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCheckQuickScanSampleOnly(unittest.TestCase):
    def test_guard_passes_on_repo(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "ci" / "check_quick_scan_sample_only.py"),
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)

    def test_const_value_reads_hero_lead(self) -> None:
        sys.path.insert(0, str(REPO_ROOT / "scripts" / "ci"))
        import check_quick_scan_sample_only as sut

        value = sut._const_value(
            'export const QUICK_SCAN_HERO_LEAD =\n  "Sample-only demonstration summary." as const;',
            "QUICK_SCAN_HERO_LEAD",
        )

        self.assertEqual(value, "Sample-only demonstration summary.")

    def test_scan_dir_rejects_uncaveated_anonymous_ai(self) -> None:
        sys.path.insert(0, str(REPO_ROOT / "scripts" / "ci"))
        import check_quick_scan_sample_only as sut

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            folder = root / "archlucid-ui" / "src" / "app" / "(marketing)" / "quick-scan"
            folder.mkdir(parents=True)
            (folder / "copy.ts").write_text('export const BAD = "anonymous AI analysis";\n', encoding="utf-8")

            errors = sut.scan_quick_scan_dir(root)

        self.assertTrue(any("sample-only" in item for item in errors))


if __name__ == "__main__":
    unittest.main()
