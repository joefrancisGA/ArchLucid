"""Unit tests for assert_single_npm_dependency_version.py."""

from __future__ import annotations

import json
import pathlib
import tempfile
import unittest
from unittest import mock

import assert_single_npm_dependency_version as sut


class AssertSingleNpmDependencyVersionTests(unittest.TestCase):
    def test_collect_versions_nested_duplicate(self) -> None:
        tree = {
            "name": "archlucid-ui",
            "dependencies": {
                "@tanstack/query-core": {"version": "5.102.7"},
                "@tanstack/react-query": {
                    "version": "5.102.2",
                    "dependencies": {
                        "@tanstack/query-core": {"version": "5.102.2"},
                    },
                },
            },
        }

        versions = sut.collect_versions(tree, "@tanstack/query-core")
        self.assertEqual(versions, {"5.102.7", "5.102.2"})

    def test_collect_versions_single(self) -> None:
        tree = {
            "name": "archlucid-ui",
            "dependencies": {
                "@tanstack/query-core": {"version": "5.102.7"},
            },
        }

        versions = sut.collect_versions(tree, "@tanstack/query-core")
        self.assertEqual(versions, {"5.102.7"})

    def test_main_passes_with_one_version(self) -> None:
        npm_tree = {
            "name": "archlucid-ui",
            "dependencies": {
                "@tanstack/query-core": {"version": "5.102.7"},
            },
        }

        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            (root / "package.json").write_text("{}", encoding="utf-8")

            with mock.patch.object(
                sut.subprocess,
                "run",
                return_value=mock.Mock(stdout=json.dumps(npm_tree), stderr="", returncode=0),
            ):
                self.assertEqual(sut.main(["@tanstack/query-core", "--prefix", str(root)]), 0)

    def test_main_fails_with_multiple_versions(self) -> None:
        npm_tree = {
            "name": "archlucid-ui",
            "dependencies": {
                "@tanstack/query-core": {"version": "5.102.7"},
                "@tanstack/react-query": {
                    "dependencies": {
                        "@tanstack/query-core": {"version": "5.102.2"},
                    },
                },
            },
        }

        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            (root / "package.json").write_text("{}", encoding="utf-8")

            with mock.patch.object(
                sut.subprocess,
                "run",
                return_value=mock.Mock(stdout=json.dumps(npm_tree), stderr="", returncode=1),
            ):
                self.assertEqual(sut.main(["@tanstack/query-core", "--prefix", str(root)]), 1)

    def test_main_fails_when_package_json_missing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            self.assertEqual(sut.main(["lodash", "--prefix", str(root)]), 1)


if __name__ == "__main__":
    unittest.main()
