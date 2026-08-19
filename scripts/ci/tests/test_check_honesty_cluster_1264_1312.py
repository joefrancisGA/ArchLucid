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


DAPPER = _load_guard(
    "check_dapper_ddl_satellite_breakdown_signals_honesty.py",
    "_check_dapper_ddl_satellite_breakdown_signals_honesty",
)
FT_PROMOTION = _load_guard(
    "check_fine_tuning_promotion_decision_record_honesty.py",
    "_check_fine_tuning_promotion_decision_record_honesty",
)
AOAI_THROTTLE = _load_guard(
    "check_real_execute_aoai_throttle_policy_honesty.py",
    "_check_real_execute_aoai_throttle_policy_honesty",
)
ASYNC_ORCH = _load_guard(
    "check_async_orchestration_first_force_honesty.py",
    "_check_async_orchestration_first_force_honesty",
)


def _write_contract(root: Path, rel: Path, markers: list[str]) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(markers), encoding="utf-8")


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestDapperDdlSatelliteBreakdownSignalsHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = DAPPER.dapper_ddl_satellite_breakdown_signals_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_ef_fixes_isolation_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                DAPPER.CONTRACT_REL,
                [
                    "**TB-1263**",
                    "**TB-1264**",
                    "M-219",
                    "Forbidden claims",
                    "CI anchors for **TB-1264**",
                    "HotPathRelationalQueryShapes",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "Entity Framework fixes tenant isolation for every paying client.\n",
            )
            violations = DAPPER.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))
            self.assertTrue(any("isolation" in item.lower() for item in violations))


class TestFineTuningPromotionDecisionRecordHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = FT_PROMOTION.fine_tuning_promotion_decision_record_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_cache_eviction_audit_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                FT_PROMOTION.CONTRACT_REL,
                [
                    "**TB-1292**",
                    "**TB-1293**",
                    "M-227",
                    "Safe vs too-strong claims",
                    "CI anchors for **TB-1293**",
                    "GoldenCohortFineTuningPromotionGate",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
                "Cache eviction is the audit record for model promotion.\n",
            )
            violations = FT_PROMOTION.scan_doc_claims(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
            )
            self.assertTrue(any("cache eviction" in item.lower() for item in violations))


class TestRealExecuteAoaiThrottlePolicyHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = AOAI_THROTTLE.real_execute_aoai_throttle_policy_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_queued_real_success_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                AOAI_THROTTLE.CONTRACT_REL,
                [
                    "**TB-1299**",
                    "**TB-1300**",
                    "M-229",
                    "## Forbidden",
                    "CI anchors for **TB-1300**",
                    "FallbackAgentCompletionClient",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/trust-center.md"),
                "A deferred retry queue means Real success for the architecture package.\n",
            )
            violations = AOAI_THROTTLE.scan_doc_claims(root, Path("docs/go-to-market/trust-center.md"))
            self.assertTrue(any("real success" in item.lower() for item in violations))


class TestAsyncOrchestrationFirstForceHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = ASYNC_ORCH.async_orchestration_first_force_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_v1_requires_dtf_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                ASYNC_ORCH.CONTRACT_REL,
                [
                    "**TB-1311**",
                    "**TB-1312**",
                    "M-231",
                    "Explicit non-claims",
                    "CI anchors for **TB-1312**",
                    "AuthorityRunOrchestrator",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "V1 requires DTF for agents to ship production reviews.\n",
            )
            violations = ASYNC_ORCH.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))
            self.assertTrue(any("dtf" in item.lower() for item in violations))


if __name__ == "__main__":
    unittest.main()
