"""Tests for assert_archlucid_ui_next_pin.py."""

from __future__ import annotations

import importlib.util
import json
import pathlib
import sys
import tempfile
import unittest


def load_module():
    script = pathlib.Path(__file__).resolve().parents[1] / "assert_archlucid_ui_next_pin.py"
    spec = importlib.util.spec_from_file_location("assert_archlucid_ui_next_pin", script)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["assert_archlucid_ui_next_pin"] = module
    spec.loader.exec_module(module)
    return module


class AssertArchlucidUiNextPinTests(unittest.TestCase):
    def setUp(self) -> None:
        self.module = load_module()

    def test_passes_when_pin_lockfile_and_node_modules_align(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            (root / "package.json").write_text(
                json.dumps({"dependencies": {"next": "16.3.6"}}),
                encoding="utf-8",
            )
            (root / "package-lock.json").write_text(
                json.dumps({"packages": {"node_modules/next": {"version": "16.3.6"}}}),
                encoding="utf-8",
            )
            next_dir = root / "node_modules" / "next"
            next_dir.mkdir(parents=True)
            (next_dir / "package.json").write_text(json.dumps({"version": "16.3.6"}), encoding="utf-8")

            self.assertEqual(self.module.main(["--prefix", str(root)]), 0)

    def test_fails_when_lockfile_drift_from_pin(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            (root / "package.json").write_text(
                json.dumps({"dependencies": {"next": "16.3.6"}}),
                encoding="utf-8",
            )
            (root / "package-lock.json").write_text(
                json.dumps({"packages": {"node_modules/next": {"version": "16.3.5"}}}),
                encoding="utf-8",
            )

            self.assertEqual(self.module.main(["--prefix", str(root), "--skip-npm-ls"]), 1)

    def test_fails_when_installed_node_modules_is_stale(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            (root / "package.json").write_text(
                json.dumps({"dependencies": {"next": "16.3.6"}}),
                encoding="utf-8",
            )
            (root / "package-lock.json").write_text(
                json.dumps({"packages": {"node_modules/next": {"version": "16.3.6"}}}),
                encoding="utf-8",
            )
            next_dir = root / "node_modules" / "next"
            next_dir.mkdir(parents=True)
            (next_dir / "package.json").write_text(json.dumps({"version": "16.3.5"}), encoding="utf-8")

            self.assertEqual(self.module.main(["--prefix", str(root)]), 1)


if __name__ == "__main__":
    unittest.main()
