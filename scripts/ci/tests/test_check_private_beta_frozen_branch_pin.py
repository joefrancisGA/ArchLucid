"""Tests for the non-blocking private-beta frozen-pin freshness warning."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts.ci import check_private_beta_frozen_branch_pin as pin_check


class TestPrivateBetaFrozenBranchPin(unittest.TestCase):
    def test_reads_valid_pin(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            pin_path = Path(temporary_directory) / "private_beta_frozen_branch.sha"
            pin_path.write_text("pinned_sha=f37771635f\n", encoding="utf-8")

            self.assertEqual(pin_check.read_pinned_sha(pin_path), "f37771635f")

    def test_invalid_pin_is_ignored(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            pin_path = Path(temporary_directory) / "private_beta_frozen_branch.sha"
            pin_path.write_text("pinned_sha=not-a-sha\n", encoding="utf-8")

            self.assertIsNone(pin_check.read_pinned_sha(pin_path))

    @patch.object(pin_check, "is_ancestor", return_value=False)
    @patch.object(pin_check, "git_ref_exists", return_value=True)
    @patch.object(pin_check, "repository_root")
    def test_stale_pin_warns_without_failing(
        self,
        repository_root_mock: object,
        _git_ref_exists_mock: object,
        _is_ancestor_mock: object,
    ) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            pin_path = root / pin_check.PIN_RELATIVE_PATH
            pin_path.parent.mkdir(parents=True)
            pin_path.write_text("pinned_sha=f37771635f\n", encoding="utf-8")
            repository_root_mock.return_value = root  # type: ignore[attr-defined]

            with patch("builtins.print") as print_mock:
                self.assertEqual(pin_check.main(), 0)

            print_mock.assert_called_once()
            self.assertIn("::warning::", print_mock.call_args.args[0])


if __name__ == "__main__":
    unittest.main()
