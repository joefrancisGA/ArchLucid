"""Tests for scripts/ci/build_ai_quality_release_summary.py."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
MODULE = REPO_ROOT / "scripts" / "ci" / "build_ai_quality_release_summary.py"
FIXTURES = REPO_ROOT / "scripts" / "ci" / "fixtures" / "ai-quality-release-summary"


def run_cli(bundle_dir: Path, json_out: Path, markdown_out: Path, repo_root: Path | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
            sys.executable,
            str(MODULE),
            "--repo-root",
            str(repo_root or REPO_ROOT),
            "--bundle-dir",
            str(bundle_dir),
            "--json-out",
            str(json_out),
            "--markdown-out",
            str(markdown_out),
        ],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class AiQualityReleaseSummaryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="ai-quality-summary-"))

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _copy_fixture(self, name: str) -> Path:
        target = self.temp_dir / name
        shutil.copytree(FIXTURES / name, target)
        return target

    def test_complete_bundle_rolls_up_pass_with_labeled_sources(self) -> None:
        bundle = self._copy_fixture("complete")
        json_out = self.temp_dir / "summary.json"
        markdown_out = self.temp_dir / "summary.md"

        result = run_cli(bundle, json_out, markdown_out, repo_root=self.temp_dir / "empty-repo")
        self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)

        summary = json.loads(json_out.read_text(encoding="utf-8"))
        self.assertEqual(summary["schema"], "archlucid.ai-quality-release-summary.v1")
        self.assertEqual(summary["rollup"], "PASS")
        self.assertEqual(summary["signals"]["retrievalIr"]["evidenceMode"], "offline-fixture")
        self.assertEqual(summary["signals"]["retrievalGrounding"]["evidenceMode"], "committed-run")
        self.assertEqual(summary["signals"]["realModeAiEvidence"]["evidenceMode"], "live-real-mode")
        self.assertEqual(summary["signals"]["materialFindingFaithfulness"]["evidenceMode"], "offline-fixture")
        self.assertEqual(summary["signals"]["materialFindingFaithfulness"]["status"], "PASS")
        self.assertIn("Offline fixture passes do not prove live model behavior", markdown_out.read_text(encoding="utf-8"))

    def test_partial_bundle_reports_partial_when_committed_run_is_missing(self) -> None:
        bundle = self._copy_fixture("partial")
        json_out = self.temp_dir / "summary.json"
        markdown_out = self.temp_dir / "summary.md"

        result = run_cli(bundle, json_out, markdown_out, repo_root=self.temp_dir / "empty-repo")
        self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)

        summary = json.loads(json_out.read_text(encoding="utf-8"))
        self.assertEqual(summary["rollup"], "PARTIAL")
        self.assertEqual(summary["signals"]["retrievalGrounding"]["status"], "MISSING")
        self.assertEqual(summary["signals"]["realModeAiEvidence"]["status"], "MISSING")
        self.assertEqual(summary["signals"]["materialFindingFaithfulness"]["status"], "MISSING")

    def test_missing_bundle_reports_not_collected(self) -> None:
        bundle = self.temp_dir / "missing"
        bundle.mkdir()
        json_out = self.temp_dir / "summary.json"
        markdown_out = self.temp_dir / "summary.md"

        result = run_cli(bundle, json_out, markdown_out, repo_root=self.temp_dir / "empty-repo")
        self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)

        summary = json.loads(json_out.read_text(encoding="utf-8"))
        self.assertEqual(summary["rollup"], "NOT_COLLECTED")


if __name__ == "__main__":
    unittest.main()
