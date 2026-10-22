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


CRASH_RECOVERY = _load_guard(
    "check_crash_recovery_long_running_review_honesty.py",
    "_check_crash_recovery_long_running_review_honesty",
)
ITSM_DELIVERY = _load_guard(
    "check_itsm_outbox_dlq_delivery_honesty.py",
    "_check_itsm_outbox_dlq_delivery_honesty",
)
MID_RUN_REVOKE = _load_guard(
    "check_mid_run_authority_revocation_honesty.py",
    "_check_mid_run_authority_revocation_honesty",
)
AUDIT_ORDERING = _load_guard(
    "check_evidence_audit_ordering_causality_honesty.py",
    "_check_evidence_audit_ordering_causality_honesty",
)


def _write_contract(root: Path, rel: Path, markers: list[str]) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(markers), encoding="utf-8")


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestCrashRecoveryLongRunningReviewHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = CRASH_RECOVERY.crash_recovery_long_running_review_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_worker_resumes_execute_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                CRASH_RECOVERY.CONTRACT_REL,
                [
                    "**TB-1523**",
                    "**TB-1524**",
                    "M-277",
                    "Too strong",
                    "CI anchors for **TB-1524**",
                    "AuthorityPipelineWorkOutbox",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "The Worker resumes agent execute after every crash.\n",
            )
            violations = CRASH_RECOVERY.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))
            self.assertTrue(any("worker" in item.lower() for item in violations))


class TestItsmOutboxDlqDeliveryHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = ITSM_DELIVERY.itsm_outbox_dlq_delivery_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_exactly_once_itsm_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                ITSM_DELIVERY.CONTRACT_REL,
                [
                    "**TB-1530**",
                    "**TB-1531**",
                    "M-280",
                    "Too strong",
                    "CI anchors for **TB-1531**",
                    "IntegrationEventOutbox",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/trust-center.md"),
                "Jira integration provides exactly-once ITSM ticket creation.\n",
            )
            violations = ITSM_DELIVERY.scan_doc_claims(root, Path("docs/go-to-market/trust-center.md"))
            self.assertTrue(any("exactly-once" in item.lower() for item in violations))


class TestMidRunAuthorityRevocationHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = MID_RUN_REVOKE.mid_run_authority_revocation_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_instant_global_revoke_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                MID_RUN_REVOKE.CONTRACT_REL,
                [
                    "**TB-1537**",
                    "**TB-1538**",
                    "M-282",
                    "Too strong",
                    "CI anchors for **TB-1538**",
                    "IOptionsMonitor",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "Revoke instantly stops in-flight LLM execute for every tenant.\n",
            )
            violations = MID_RUN_REVOKE.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))
            self.assertTrue(any("revoke" in item.lower() for item in violations))


class TestEvidenceAuditOrderingCausalityHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = AUDIT_ORDERING.evidence_audit_ordering_causality_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_lamport_audit_order_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                AUDIT_ORDERING.CONTRACT_REL,
                [
                    "**TB-1550**",
                    "**TB-1551**",
                    "M-284",
                    "Too strong",
                    "CI anchors for **TB-1551**",
                    "OccurredUtc",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/trust-center.md"),
                "Audit trail ordering is Lamport causality across all tenants.\n",
            )
            violations = AUDIT_ORDERING.scan_doc_claims(root, Path("docs/go-to-market/trust-center.md"))
            self.assertTrue(any("lamport" in item.lower() or "sequence" in item.lower() for item in violations))


if __name__ == "__main__":
    unittest.main()
