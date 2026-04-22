"""Unit tests for assert_golden_cohort_baseline_locked.py."""

from __future__ import annotations

import json
import pathlib
import tempfile
import unittest
from unittest import mock

import assert_golden_cohort_baseline_locked as sut


class AssertGoldenCohortBaselineLockedTests(unittest.TestCase):
    def test_skips_when_env_not_locked(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            cohort = root / "tests" / "golden-cohort" / "cohort.json"
            cohort.parent.mkdir(parents=True)
            cohort.write_text(
                json.dumps(
                    {
                        "items": [
                            {
                                "id": "gc-001",
                                "expectedCommittedManifestSha256": "0" * 64,
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )

            with mock.patch.object(sut, "REPO_ROOT", root):
                with mock.patch.dict("os.environ", {}, clear=True):
                    self.assertEqual(sut.main(), 0)

    def test_passes_when_locked_and_non_placeholder(self) -> None:
        good_sha = "a" * 64

        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            cohort = root / "tests" / "golden-cohort" / "cohort.json"
            cohort.parent.mkdir(parents=True)
            cohort.write_text(
                json.dumps({"items": [{"id": "gc-001", "expectedCommittedManifestSha256": good_sha}]}),
                encoding="utf-8",
            )

            with mock.patch.object(sut, "REPO_ROOT", root):
                with mock.patch.dict("os.environ", {"ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED": "true"}):
                    self.assertEqual(sut.main(), 0)

    def test_fails_when_locked_and_placeholder(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            cohort = root / "tests" / "golden-cohort" / "cohort.json"
            cohort.parent.mkdir(parents=True)
            cohort.write_text(
                json.dumps(
                    {
                        "items": [
                            {
                                "id": "gc-001",
                                "expectedCommittedManifestSha256": sut.PLACEHOLDER_SHA256,
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )

            with mock.patch.object(sut, "REPO_ROOT", root):
                with mock.patch.dict("os.environ", {"ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED": "true"}):
                    self.assertEqual(sut.main(), 1)


if __name__ == "__main__":
    unittest.main()
