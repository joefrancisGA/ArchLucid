"""Unit tests for check_npm_overrides_lockfile_sync.py."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parents[1]
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

import check_npm_overrides_lockfile_sync as sut

REPO_ROOT = Path(__file__).resolve().parents[3]


class CheckNpmOverridesLockfileSyncTests(unittest.TestCase):
    def test_guard_passes_on_repo(self) -> None:
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "scripts" / "ci" / "check_npm_overrides_lockfile_sync.py")],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)

    def test_detects_override_lockfile_mismatch(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "package.json").write_text(
                json.dumps({"overrides": {"@tanstack/query-core": "5.102.8"}}),
                encoding="utf-8",
            )
            (root / "package-lock.json").write_text(
                json.dumps(
                    {
                        "packages": {
                            "": {"name": "archlucid-ui"},
                            "node_modules/@tanstack/query-core": {"version": "5.102.7"},
                        },
                    },
                ),
                encoding="utf-8",
            )

            errors = sut.check_prefix(root)

        self.assertTrue(any("5.102.8" in error and "5.102.7" in error for error in errors))

    def test_skips_dollar_reference_overrides(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "package.json").write_text(
                json.dumps({"overrides": {"openapi-typescript": {"typescript": "$typescript"}}}),
                encoding="utf-8",
            )
            (root / "package-lock.json").write_text(
                json.dumps({"packages": {"": {"name": "archlucid-ui"}}}),
                encoding="utf-8",
            )

            errors = sut.check_prefix(root)

        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
