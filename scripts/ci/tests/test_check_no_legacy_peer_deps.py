"""Unit tests for check_no_legacy_peer_deps.py."""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parents[1]
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

import check_no_legacy_peer_deps as sut

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCheckNoLegacyPeerDeps(unittest.TestCase):
    def test_guard_passes_on_repo(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "ci" / "check_no_legacy_peer_deps.py"),
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)

    def test_scan_rejects_npmrc_legacy_peer_deps(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".npmrc").write_text("legacy-peer-deps=true\n", encoding="utf-8")

            errors = sut.scan(root)

        self.assertTrue(any("legacy-peer-deps" in item for item in errors))


if __name__ == "__main__":
    unittest.main()
