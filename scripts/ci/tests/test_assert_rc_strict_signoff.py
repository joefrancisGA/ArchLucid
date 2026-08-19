"""Tests for assert_rc_strict_signoff.py fail-closed RC guard."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
CI = REPO_ROOT / "scripts" / "ci"


def run_assert(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(CI / "assert_rc_strict_signoff.py"), *args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class AssertRcStrictSignoffTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="assert-rc-strict-"))

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _write_minimal_pass_bundle(self, bundle: Path) -> None:
        (bundle / "release-confidence-rollup.json").write_text(
            json.dumps(
                {
                    "schema": "archlucid.release-confidence-rollup.v1",
                    "strictDisposition": "PASS",
                    "strictBlockingReasons": [],
                }
            )
            + "\n",
            encoding="utf-8",
        )
        (bundle / "rc-evidence-signoff-bundle.json").write_text(
            json.dumps(
                {
                    "schema": "archlucid.rc-evidence-signoff-bundle.v1",
                    "overallDisposition": "PASS",
                    "references": {
                        "releaseConfidenceRollup": "release-confidence-rollup.json",
                        "rcGoNoGoVerdict": "rc-go-no-go-verdict.json",
                    },
                }
            )
            + "\n",
            encoding="utf-8",
        )
        (bundle / "rc-go-no-go-verdict.json").write_text(
            json.dumps({"schema": "archlucid.rc-go-no-go-verdict.v1", "verdict": "PASS"})
            + "\n",
            encoding="utf-8",
        )
        (bundle / "release-smoke-live-ui-sql-result.json").write_text(
            json.dumps(
                {
                    "schema": "archlucid.release-smoke-result.v1",
                    "profile": "ReleaseCandidate",
                    "evidenceKind": "live-ui-sql-parity",
                    "verdict": "Pass",
                    "status": "PASS",
                }
            )
            + "\n",
            encoding="utf-8",
        )

    def test_require_pass_fails_on_empty_bundle(self) -> None:
        bundle = self.temp_dir / "empty"
        bundle.mkdir()
        result = run_assert("--bundle-dir", str(bundle), "--require-pass")
        self.assertEqual(result.returncode, 1, msg=result.stderr or result.stdout)
        self.assertIn("::error::", result.stderr)

    def test_require_pass_succeeds_with_complete_bundle(self) -> None:
        bundle = self.temp_dir / "pass"
        bundle.mkdir()
        self._write_minimal_pass_bundle(bundle)
        result = run_assert(
            "--bundle-dir",
            str(bundle),
            "--require-pass",
            "--require-live-parity-artifact",
        )
        self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)

    def test_live_parity_artifact_validates_evidence_kind(self) -> None:
        bundle = self.temp_dir / "bad-parity"
        bundle.mkdir()
        self._write_minimal_pass_bundle(bundle)
        (bundle / "release-smoke-live-ui-sql-result.json").write_text(
            json.dumps({"profile": "ReleaseCandidate", "evidenceKind": "release-smoke", "verdict": "Pass"})
            + "\n",
            encoding="utf-8",
        )
        result = run_assert(
            "--bundle-dir",
            str(bundle),
            "--require-pass",
            "--require-live-parity-artifact",
        )
        self.assertEqual(result.returncode, 1, msg=result.stderr or result.stdout)
        self.assertIn("live-ui-sql-parity", result.stderr)


if __name__ == "__main__":
    unittest.main()
