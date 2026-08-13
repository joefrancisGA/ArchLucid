from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard(script_name: str, module_name: str):
    script = _CI / script_name
    spec = importlib.util.spec_from_file_location(module_name, script)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {script_name}.")
    sys.path.insert(0, str(_CI))
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


POST_STRANGLER = _load_guard(
    "check_post_strangler_residual_coupling_honesty.py",
    "_check_post_strangler_residual_coupling_honesty",
)
FINDING_PROVENANCE = _load_guard(
    "check_decision_grade_finding_provenance_honesty.py",
    "_check_decision_grade_finding_provenance_honesty",
)
PROJECT_PURGE = _load_guard(
    "check_project_soft_delete_sealed_evidence_honesty.py",
    "_check_project_soft_delete_sealed_evidence_honesty",
)
SQL_MIGRATION = _load_guard(
    "check_zero_downtime_sql_migration_honesty.py",
    "_check_zero_downtime_sql_migration_honesty",
)


def _write_contract(root: Path, rel: Path, markers: list[str]) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(markers), encoding="utf-8")


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestPostStranglerResidualCouplingHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = POST_STRANGLER.post_strangler_residual_coupling_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_dual_storage_still_ships_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                POST_STRANGLER.CONTRACT_REL,
                [
                    "**TB-1204**",
                    "**TB-1205**",
                    "M-205",
                    "CI anchors for **TB-1205**",
                    "DualPipelineRegistrationDisciplineTests",
                    "CoordinatorStranglerCompletionArchitectureTests",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "Dual coordinator storage still ships in production.\n",
            )
            violations = POST_STRANGLER.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))
            self.assertTrue(any("dual coordinator storage" in item.lower() for item in violations))


class TestDecisionGradeFindingProvenanceHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = FINDING_PROVENANCE.decision_grade_finding_provenance_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_all_findings_evidence_grounded_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                FINDING_PROVENANCE.CONTRACT_REL,
                [
                    "**TB-1221**",
                    "**TB-1222**",
                    "M-207",
                    "CI anchors for **TB-1222**",
                    "FindingFactory",
                    "AgentResultParser",
                    "AgentOutputQualityGate",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "All findings are evidence-grounded by design.\n",
            )
            violations = FINDING_PROVENANCE.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))
            self.assertTrue(any("all findings" in item.lower() for item in violations))


class TestProjectSoftDeleteSealedEvidenceHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = PROJECT_PURGE.project_soft_delete_sealed_evidence_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_purge_erases_evidence_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                PROJECT_PURGE.CONTRACT_REL,
                [
                    "**TB-1497**",
                    "**TB-1498**",
                    "M-271",
                    "CI anchors for **TB-1498**",
                    "SqlArchitectureProjectRetentionPurgeService",
                    "DapperArchitectureProjectRepository",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "Delete project erases all evidence and audit history.\n",
            )
            violations = PROJECT_PURGE.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))
            self.assertTrue(any("project" in item.lower() and "evidence" in item.lower() for item in violations))


class TestZeroDowntimeSqlMigrationHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = SQL_MIGRATION.zero_downtime_sql_migration_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_separate_migrator_job_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                SQL_MIGRATION.CONTRACT_REL,
                [
                    "**TB-1557**",
                    "**TB-1558**",
                    "M-286",
                    "CI anchors for **TB-1558**",
                    "DatabaseMigrator",
                    "DbUp",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "A separate CD SQL migrator job applies production schema.\n",
            )
            violations = SQL_MIGRATION.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))
            self.assertTrue(any("migrator" in item.lower() for item in violations))


if __name__ == "__main__":
    unittest.main()
