"""Tests for scripts/ci/release_evidence_bundle.py (T2-10)."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
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

    def test_missing_real_llm_evidence_reports_simulator_only_boundary(self) -> None:
        bundle_dir = self._copy_complete_fixture()

        emit = run_cli(
            "emit",
            "--dir",
            str(bundle_dir),
            "--profile",
            "release-readiness",
            "--rollup",
            "PASS",
        )
        self.assertEqual(emit.returncode, 0, msg=emit.stderr or emit.stdout)

        manifest = json.loads((bundle_dir / "release-evidence-bundle-manifest.json").read_text(encoding="utf-8"))
        evidence = manifest["realModeAiEvidence"]
        self.assertEqual(evidence["status"], "MISSING")
        self.assertIn("simulator-only", evidence["claimBoundary"])

    def test_real_llm_pass_evidence_reports_full_real_mode(self) -> None:
        bundle_dir = self._copy_complete_fixture()
        self._write_real_llm_evidence(bundle_dir, outcome="PASS", execution_mode="real")

        emit = run_cli(
            "emit",
            "--dir",
            str(bundle_dir),
            "--profile",
            "release-readiness",
            "--rollup",
            "PASS",
        )
        self.assertEqual(emit.returncode, 0, msg=emit.stderr or emit.stdout)

        manifest = json.loads((bundle_dir / "release-evidence-bundle-manifest.json").read_text(encoding="utf-8"))
        evidence = manifest["realModeAiEvidence"]
        self.assertEqual(evidence["status"], "PASS")
        self.assertEqual(evidence["missingAgentPaths"], [])

    def test_real_llm_warn_evidence_reports_partial_wording(self) -> None:
        bundle_dir = self._copy_complete_fixture()
        self._write_real_llm_evidence(bundle_dir, outcome="WARN", execution_mode="partial-real", agent_paths=["Topology"])

        emit = run_cli(
            "emit",
            "--dir",
            str(bundle_dir),
            "--profile",
            "release-readiness",
            "--rollup",
            "WARN",
        )
        self.assertEqual(emit.returncode, 0, msg=emit.stderr or emit.stdout)

        manifest = json.loads((bundle_dir / "release-evidence-bundle-manifest.json").read_text(encoding="utf-8"))
        evidence = manifest["realModeAiEvidence"]
        self.assertEqual(evidence["status"], "WARN")
        self.assertIn("Partial real-mode", evidence["claimBoundary"])
        self.assertIn("cost", evidence["missingAgentPaths"])

    def test_real_llm_hold_evidence_keeps_limited_claim_boundary(self) -> None:
        bundle_dir = self._copy_complete_fixture()
        self._write_real_llm_evidence(bundle_dir, outcome="HOLD", execution_mode="real")

        emit = run_cli(
            "emit",
            "--dir",
            str(bundle_dir),
            "--profile",
            "release-readiness",
            "--rollup",
            "WARN",
        )
        self.assertEqual(emit.returncode, 0, msg=emit.stderr or emit.stdout)

        manifest = json.loads((bundle_dir / "release-evidence-bundle-manifest.json").read_text(encoding="utf-8"))
        evidence = manifest["realModeAiEvidence"]
        self.assertEqual(evidence["status"], "HOLD")
        self.assertIn("claims are limited", evidence["claimBoundary"])

    def test_real_llm_stale_evidence_reports_stale_status(self) -> None:
        bundle_dir = self._copy_complete_fixture()
        stale = datetime.now(timezone.utc) - timedelta(days=45)
        self._write_real_llm_evidence(bundle_dir, outcome="PASS", execution_mode="real", generated_utc=stale)

        emit = run_cli(
            "emit",
            "--dir",
            str(bundle_dir),
            "--profile",
            "release-readiness",
            "--rollup",
            "WARN",
        )
        self.assertEqual(emit.returncode, 0, msg=emit.stderr or emit.stdout)

        validate = run_cli(
            "validate",
            "--dir",
            str(bundle_dir),
            "--profile",
            "release-readiness",
        )
        self.assertEqual(validate.returncode, 0, msg=validate.stderr or validate.stdout)

        manifest = json.loads((bundle_dir / "release-evidence-bundle-manifest.json").read_text(encoding="utf-8"))
        evidence = manifest["realModeAiEvidence"]
        self.assertEqual(evidence["status"], "STALE")
        self.assertFalse(evidence["isCurrent"])

    def _write_real_llm_evidence(
        self,
        bundle_dir: Path,
        *,
        outcome: str,
        execution_mode: str,
        agent_paths: list[str] | None = None,
        generated_utc: datetime | None = None,
    ) -> None:
        generated_utc = generated_utc or datetime.now(timezone.utc)
        agent_paths = agent_paths or ["Topology", "Cost", "Compliance", "Critic"]
        payload = {
            "schema": "archlucid.real-llm-evidence-gate.v2",
            "generatedUtc": generated_utc.isoformat(),
            "overallOutcome": outcome,
            "executionMode": execution_mode,
            "agentPaths": [{"agentPath": path, "outcome": outcome} for path in agent_paths],
        }
        (bundle_dir / "real-llm-evidence-gate.json").write_text(json.dumps(payload), encoding="utf-8")


if __name__ == "__main__":
    unittest.main()
