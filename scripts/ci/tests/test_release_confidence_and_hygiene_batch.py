"""Batch tests for release confidence rollup and doc hygiene guards."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


def run_script(relative: str, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(REPO_ROOT / relative), *args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class ReleaseConfidenceAndHygieneBatchTests(unittest.TestCase):
    def test_release_confidence_rollup_hold_fixture(self) -> None:
        fixture = REPO_ROOT / "scripts" / "ci" / "fixtures" / "release-confidence-rollup" / "hold"
        temp_dir = Path(tempfile.mkdtemp(prefix="rcr-hold-"))

        try:
            bundle = temp_dir / "bundle"
            shutil.copytree(fixture, bundle)
            json_out = temp_dir / "rollup.json"
            markdown_out = temp_dir / "rollup.md"
            result = subprocess.run(
                [
                    sys.executable,
                    str(REPO_ROOT / "scripts" / "ci" / "build_release_confidence_rollup.py"),
                    "--repo-root",
                    str(temp_dir),
                    "--bundle-dir",
                    str(bundle),
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
            self.assertEqual(result.returncode, 0, msg=result.stderr)
            summary = json.loads(json_out.read_text(encoding="utf-8"))
            self.assertEqual(summary["disposition"], "HOLD")
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def test_slo_threshold_calibration_passes(self) -> None:
        result = run_script("scripts/ci/validate_outbox_retrieval_slo_thresholds.py")
        self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)

    def test_doc_source_of_truth_headers(self) -> None:
        result = run_script("scripts/ci/check_doc_source_of_truth_headers.py")
        self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)

    def test_audit_new_operator_dry_run_docs(self) -> None:
        result = run_script("scripts/ci/audit_new_operator_dry_run_docs.py")
        self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)

    def test_azure_ai_search_release_evidence(self) -> None:
        result = run_script("scripts/ci/check_azure_ai_search_release_evidence.py")
        self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)

    def test_profile_helpers_load_doc_owners(self) -> None:
        sys.path.insert(0, str(REPO_ROOT / "scripts" / "ci"))
        from release_evidence_profile_helpers import profile_doc_owners

        owners = profile_doc_owners("release-readiness")
        self.assertGreaterEqual(len(owners), 1)


if __name__ == "__main__":
    unittest.main()
