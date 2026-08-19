"""Tests for scripts/ci/build_release_confidence_rollup.py."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
MODULE = REPO_ROOT / "scripts" / "ci" / "build_release_confidence_rollup.py"
FIXTURES = REPO_ROOT / "scripts" / "ci" / "fixtures" / "release-confidence-rollup"


def run_cli(bundle_dir: Path, json_out: Path, markdown_out: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
            sys.executable,
            str(MODULE),
            "--repo-root",
            str(bundle_dir / "empty-repo"),
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


class ReleaseConfidenceRollupTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="release-confidence-"))

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_pass_when_release_evidence_validation_present(self) -> None:
        bundle = self.temp_dir / "pass"
        shutil.copytree(FIXTURES / "pass", bundle)
        json_out = self.temp_dir / "rollup.json"
        markdown_out = self.temp_dir / "rollup.md"

        result = run_cli(bundle, json_out, markdown_out)
        self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)

        summary = json.loads(json_out.read_text(encoding="utf-8"))
        self.assertEqual(summary["schema"], "archlucid.release-confidence-rollup.v1")
        self.assertIn(summary["disposition"], {"PASS", "PARTIAL", "WARN"})
        evidence_lane = next(lane for lane in summary["lanes"] if lane["id"] == "release-evidence-tests")
        self.assertEqual(evidence_lane["status"], "PASS")

    def test_hold_when_validation_fails(self) -> None:
        bundle = self.temp_dir / "hold"
        shutil.copytree(FIXTURES / "hold", bundle)
        json_out = self.temp_dir / "rollup.json"
        markdown_out = self.temp_dir / "rollup.md"

        result = run_cli(bundle, json_out, markdown_out)
        self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)

        summary = json.loads(json_out.read_text(encoding="utf-8"))
        self.assertEqual(summary["disposition"], "HOLD")

    def test_not_collected_when_no_lane_artifacts(self) -> None:
        bundle = self.temp_dir / "missing"
        bundle.mkdir()
        json_out = self.temp_dir / "rollup.json"
        markdown_out = self.temp_dir / "rollup.md"

        result = run_cli(bundle, json_out, markdown_out)
        self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)

        summary = json.loads(json_out.read_text(encoding="utf-8"))
        self.assertEqual(summary["disposition"], "NOT_COLLECTED")


if __name__ == "__main__":
    unittest.main()
