"""Tests for scripts/ci/validate_rc_golden_path.py."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
MODULE = REPO_ROOT / "scripts" / "ci" / "validate_rc_golden_path.py"


def run_cli(bundle_dir: Path, json_out: Path, markdown_out: Path, *, enforce: bool = False) -> subprocess.CompletedProcess[str]:
    args = [
        sys.executable,
        str(MODULE),
        "--bundle-dir",
        str(bundle_dir),
        "--json-out",
        str(json_out),
        "--markdown-out",
        str(markdown_out),
    ]

    if enforce:
        args.append("--enforce")

    return subprocess.run(
        args,
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class ValidateRcGoldenPathTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="rc-golden-path-"))

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _write_pass_bundle(self, bundle: Path) -> None:
        bundle.mkdir(parents=True, exist_ok=True)

        for artifact, payload in {
            "release-readiness-index.json": {"rollup": "PASS"},
            "rc-go-no-go-verdict.json": {"overallVerdict": "PASS"},
            "real-mode-claim-gate.json": {
                "disposition": "PASS",
                "claimWordingClass": "simulator-only",
            },
            "release-smoke-live-ui-sql-result.json": {"status": "PASS"},
            "data-consistency-readiness.json": {"disposition": "PASS"},
            "first-pilot-timing-budget.json": {"disposition": "PASS"},
            "simulator-live-divergence-summary.json": {"disposition": "PASS"},
        }.items():
            (bundle / artifact).write_text(json.dumps(payload) + "\n", encoding="utf-8")

    def test_missing_sponsor_critical_artifact_is_hold(self) -> None:
        bundle = self.temp_dir / "empty-bundle"
        bundle.mkdir()
        json_out = self.temp_dir / "golden.json"
        md_out = self.temp_dir / "golden.md"

        result = run_cli(bundle, json_out, md_out, enforce=True)
        summary = json.loads(json_out.read_text(encoding="utf-8"))

        self.assertEqual(summary["rollup"], "HOLD")
        self.assertEqual(result.returncode, 1)
        self.assertTrue(any(row["verdict"] == "HOLD" for row in summary["rows"]))

    def test_complete_bundle_passes(self) -> None:
        bundle = self.temp_dir / "pass-bundle"
        self._write_pass_bundle(bundle)
        json_out = self.temp_dir / "golden-pass.json"
        md_out = self.temp_dir / "golden-pass.md"

        result = run_cli(bundle, json_out, md_out, enforce=True)
        summary = json.loads(json_out.read_text(encoding="utf-8"))

        self.assertEqual(summary["rollup"], "PASS")
        self.assertEqual(summary["claimWordingClass"], "simulator-only")
        self.assertEqual(result.returncode, 0)

    def test_optional_missing_artifact_does_not_hold_when_critical_pass(self) -> None:
        bundle = self.temp_dir / "optional-missing"
        self._write_pass_bundle(bundle)
        (bundle / "first-pilot-timing-budget.json").unlink()
        json_out = self.temp_dir / "golden-warn.json"
        md_out = self.temp_dir / "golden-warn.md"

        result = run_cli(bundle, json_out, md_out, enforce=True)
        summary = json.loads(json_out.read_text(encoding="utf-8"))

        timing_row = next(row for row in summary["rows"] if row["artifact"] == "first-pilot-timing-budget.json")
        self.assertEqual(timing_row["verdict"], "MISSING")
        self.assertEqual(summary["rollup"], "PASS")
        self.assertEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
