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


FAITHFULNESS = _load_guard(
    "check_faithfulness_support_ratio_scoring_lane_honesty.py",
    "_check_faithfulness_support_ratio_scoring_lane_honesty",
)
DEFENSE_PLANE = _load_guard(
    "check_shared_hallucination_defense_plane_honesty.py",
    "_check_shared_hallucination_defense_plane_honesty",
)
TENANT_DID = _load_guard(
    "check_tenant_did_erosion_beyond_predicates_honesty.py",
    "_check_tenant_did_erosion_beyond_predicates_honesty",
)
AZURE_PE = _load_guard(
    "check_azure_workload_privilege_escalation_seam_honesty.py",
    "_check_azure_workload_privilege_escalation_seam_honesty",
)


def _write_contract(root: Path, rel: Path, markers: list[str]) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(markers), encoding="utf-8")


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestFaithfulnessSupportRatioScoringLaneHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = FAITHFULNESS.faithfulness_support_ratio_scoring_lane_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_semantic_commit_gate_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                FAITHFULNESS.CONTRACT_REL,
                [
                    "**TB-1228**",
                    "**TB-1229**",
                    "M-209",
                    "M-210",
                    "Forbidden claims",
                    "CI anchors for **TB-1229**",
                    "AgentOutputQualityGate",
                    "GoldenCohortFineTuningPromotionGate",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "Semantic faithfulness is the golden-manifest commit gate for every buyer.\n",
            )

            violations = FAITHFULNESS.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))
            self.assertTrue(any("commit gate" in item.lower() for item in violations))


class TestSharedHallucinationDefensePlaneHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = DEFENSE_PLANE.shared_hallucination_defense_plane_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_simulator_real_safe_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                DEFENSE_PLANE.CONTRACT_REL,
                [
                    "**TB-1230**",
                    "**TB-1231**",
                    "M-211",
                    "Explicit non-claims",
                    "CI anchors for **TB-1231**",
                    "AgentOutputTraceQualityEvaluator",
                    "SkipWhenSimulator",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
                "Simulator PilotStrict green means Real-safe for sponsor reviews.\n",
            )

            violations = DEFENSE_PLANE.scan_doc_claims(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
            )
            self.assertTrue(any("real-safe" in item.lower() for item in violations))


class TestTenantDidErosionBeyondPredicatesHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = TENANT_DID.tenant_did_erosion_beyond_predicates_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_where_tenantid_isolation_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                TENANT_DID.CONTRACT_REL,
                [
                    "**TB-1232**",
                    "**TB-1233**",
                    "M-213",
                    "Explicit non-claims",
                    "CI anchors for **TB-1233**",
                    "BuildRequiredScopeFilter",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "WHERE TenantId equals tenant isolation for every paying client.\n",
            )

            violations = TENANT_DID.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))
            self.assertTrue(any("where tenantid" in item.lower() for item in violations))


class TestAzureWorkloadPrivilegeEscalationSeamHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = AZURE_PE.azure_workload_privilege_escalation_seam_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_pe_equals_private_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                AZURE_PE.CONTRACT_REL,
                [
                    "**TB-1244**",
                    "**TB-1245**",
                    "M-215",
                    "Explicit non-claims",
                    "CI anchors for **TB-1245**",
                    "enable_api_sql_runtime_identity",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/trust-center.md"),
                "Private endpoints alone equal private data plane for all workloads.\n",
            )

            violations = AZURE_PE.scan_doc_claims(root, Path("docs/go-to-market/trust-center.md"))
            self.assertTrue(any("private data plane" in item.lower() for item in violations))


if __name__ == "__main__":
    unittest.main()
