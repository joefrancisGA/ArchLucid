"""Unit tests for ``check_no_legacy_archiforge_dirs.find_legacy_dirs``.

Pure-helper coverage. Run with::

    python -m unittest scripts/ci/test_check_no_legacy_archiforge_dirs.py
"""

from __future__ import annotations

import pathlib
import tempfile
import unittest

from check_no_legacy_archiforge_dirs import find_legacy_dirs, SKIP_DIRS


class FindLegacyDirsTests(unittest.TestCase):
    def test_empty_tree_returns_empty_list(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)

            result = find_legacy_dirs(root, frozenset(), SKIP_DIRS)

            self.assertEqual([], result)

    def test_finds_top_level_legacy_dir(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            (root / "ArchiForge.Api").mkdir()
            (root / "ArchLucid.Api").mkdir()

            result = find_legacy_dirs(root, frozenset(), SKIP_DIRS)

            self.assertEqual(1, len(result))
            self.assertEqual("ArchiForge.Api", result[0].name)

    def test_skips_archive_subtree(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            (root / "docs" / "archive" / "ArchiForge.LegacyNotes").mkdir(parents=True)

            result = find_legacy_dirs(root, frozenset(), SKIP_DIRS)

            self.assertEqual([], result)

    def test_respects_allow_list(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            (root / "ArchiForge.AuthorizedCarveOut").mkdir()

            result = find_legacy_dirs(
                root,
                frozenset({"ArchiForge.AuthorizedCarveOut"}),
                SKIP_DIRS,
            )

            self.assertEqual([], result)

    def test_skips_build_artifact_dirs(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            (root / "obj" / "ArchiForge.Generated").mkdir(parents=True)
            (root / "node_modules" / "ArchiForge.Junk").mkdir(parents=True)

            result = find_legacy_dirs(root, frozenset(), SKIP_DIRS)

            self.assertEqual([], result)

    def test_finds_nested_legacy_dir_outside_skip_and_archive(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            (root / "src" / "ArchiForge.Hidden").mkdir(parents=True)

            result = find_legacy_dirs(root, frozenset(), SKIP_DIRS)

            self.assertEqual(1, len(result))
            self.assertEqual("ArchiForge.Hidden", result[0].name)

    def test_case_sensitive_does_not_match_archlucid_or_lowercase(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            (root / "archiforge.junk").mkdir()
            (root / "ArchLucid.Api").mkdir()

            result = find_legacy_dirs(root, frozenset(), SKIP_DIRS)

            self.assertEqual([], result)

    def test_returns_sorted_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            (root / "ArchiForge.Z").mkdir()
            (root / "ArchiForge.A").mkdir()
            (root / "ArchiForge.M").mkdir()

            result = find_legacy_dirs(root, frozenset(), SKIP_DIRS)

            self.assertEqual(["ArchiForge.A", "ArchiForge.M", "ArchiForge.Z"], [p.name for p in result])

    def test_raises_on_missing_root(self) -> None:
        with self.assertRaises(FileNotFoundError):
            find_legacy_dirs(pathlib.Path("/no/such/path/12345"), frozenset(), SKIP_DIRS)

    def test_raises_on_non_directory(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            file_path = root / "somefile.txt"
            file_path.write_text("hello")

            with self.assertRaises(NotADirectoryError):
                find_legacy_dirs(file_path, frozenset(), SKIP_DIRS)


if __name__ == "__main__":
    unittest.main()
