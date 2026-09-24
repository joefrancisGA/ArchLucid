"""Unit tests for check_ui_lint_toolchain.py."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parents[1]
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

import check_ui_lint_toolchain as sut


def write_package(path: Path, version: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"name": path.parent.name, "version": version}), encoding="utf-8")


class CheckUiLintToolchainTests(unittest.TestCase):
    def create_tree(self, root: Path, eslint_version: str = "9.39.5") -> None:
        (root / "package.json").write_text(
            json.dumps(
                {
                    "devDependencies": {
                        "eslint": "^9.39.5",
                        "typescript": "npm:@typescript/typescript6@^6.0.2",
                        "@typescript/native": "npm:typescript@^7.0.2",
                    }
                }
            ),
            encoding="utf-8",
        )
        write_package(root / "node_modules/eslint/package.json", eslint_version)
        write_package(root / "node_modules/typescript/package.json", "6.0.2")
        write_package(root / "node_modules/@typescript/native/package.json", "7.0.2")
        write_package(root / "node_modules/eslint-config-next/node_modules/typescript-eslint/package.json", "8.67.0")

    def test_accepts_supported_toolchain(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.create_tree(root)
            self.assertEqual(sut.check_prefix(root), [])

    def test_rejects_eslint_10(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.create_tree(root, eslint_version="10.10.0")
            self.assertTrue(any("eslint is 10.10.0" in error for error in sut.check_prefix(root)))


if __name__ == "__main__":
    unittest.main()
