"""Tests for scripts/ci/release_evidence_bundle.py (T2-10)."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
MODULE = REPO_ROOT / "scripts" / "ci" / "release_evidence_bundle.py"
FIXTURES = REPO_ROOT / "scripts" / "ci" / "fixtures" / "release-evidence-bundle"


def run_cli(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(MODULE), *args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class ReleaseEvidenceBundleTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="reb-test-"))

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _copy_complete_fixture(self) -> Path:
        target = self.temp_dir / "complete"
        shutil.copytree(FIXTURES / "complete", target)
        return target

    def test_emit_and_validate_complete_release_readiness_bundle(self) -> None:
        bundle_dir = self._copy_complete_fixture()

        emit = run_cli(
            "emit",
            "--dir",
            str(bundle_dir),
            "--profile",
            "release-readiness",
            "--rollup",
            "PASS",
            "--git-commit-sha",
            "abc123",
        )
        self.assertEqual(emit.returncode, 0, msg=emit.stderr or emit.stdout)

        manifest_path = bundle_dir / "release-evidence-bundle-manifest.json"
        self.assertTrue(manifest_path.is_file())

        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        self.assertEqual(manifest["schema"], "archlucid.release-evidence-bundle.v1")
        self.assertEqual(manifest["profile"], "release-readiness")
        self.assertEqual(manifest["rollup"], "PASS")
        self.assertGreater(len(manifest["artifacts"]), 0)

        validate = run_cli(
            "validate",
            "--dir",
            str(bundle_dir),
            "--profile",
            "release-readiness",
        )
        self.assertEqual(validate.returncode, 0, msg=validate.stderr or validate.stdout)

    def test_validate_fails_on_incomplete_bundle(self) -> None:
        bundle_dir = self.temp_dir / "incomplete"
        bundle_dir.mkdir(parents=True)
        (bundle_dir / "release-readiness-index.json").write_text("{}", encoding="utf-8")

        emit = run_cli(
            "emit",
            "--dir",
            str(bundle_dir),
            "--profile",
            "release-readiness",
            "--rollup",
            "FAIL",
        )
        self.assertEqual(emit.returncode, 0, msg=emit.stderr or emit.stdout)

        validate = run_cli(
            "validate",
            "--dir",
            str(bundle_dir),
            "--profile",
            "release-readiness",
        )
        self.assertEqual(validate.returncode, 2, msg=validate.stderr or validate.stdout)
        self.assertIn("issue(s)", validate.stderr)

    def test_validate_production_readiness_drill_profile(self) -> None:
        bundle_dir = self.temp_dir / "drill"
        config_dir = bundle_dir / "config-lint"
        config_dir.mkdir(parents=True)

        (bundle_dir / "drill-summary.json").write_text("{}", encoding="utf-8")
        (bundle_dir / "drill-summary.md").write_text("# drill", encoding="utf-8")
        (config_dir / "config-lint-production-like-hosted-pilot.json").write_text("{}", encoding="utf-8")

        emit = run_cli(
            "emit",
            "--dir",
            str(bundle_dir),
            "--profile",
            "production-readiness-drill",
            "--rollup",
            "PASS",
        )
        self.assertEqual(emit.returncode, 0, msg=emit.stderr or emit.stdout)

        validate = run_cli(
            "validate",
            "--dir",
            str(bundle_dir),
            "--profile",
            "production-readiness-drill",
        )
        self.assertEqual(validate.returncode, 0, msg=validate.stderr or validate.stdout)


if __name__ == "__main__":
    unittest.main()
