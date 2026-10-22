"""Unit tests for check_status_tag_kind_warning.py."""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]

_CI_ROOT = Path(__file__).resolve().parents[1]
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

import check_status_tag_kind_warning as sut


class TestCheckStatusTagKindWarning(unittest.TestCase):
    def test_guard_passes_on_repo(self) -> None:
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "scripts" / "ci" / "check_status_tag_kind_warning.py")],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(
            result.returncode,
            0,
            msg=result.stdout + result.stderr,
        )

    def test_detects_status_tag_warning_kind(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            ui_src = root / "archlucid-ui" / "src"
            ui_src.mkdir(parents=True)
            bad_file = ui_src / "BadClient.tsx"
            bad_file.write_text(
                '<StatusTag kind="warning" label="Unavailable" />\n',
                encoding="utf-8",
            )

            hits = sut.find_violations(root)

            self.assertEqual(len(hits), 1)
            self.assertIn("BadClient.tsx", hits[0][0])


if __name__ == "__main__":
    unittest.main()
