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


DEMO_READ_PLANE = _load_guard(
    "check_demo_anonymous_read_plane_honesty.py",
    "_check_demo_anonymous_read_plane_honesty",
)
ELEVATOR_PITCH = _load_guard(
    "check_elevator_pitch_v1_claim_honesty.py",
    "_check_elevator_pitch_v1_claim_honesty",
)
AGENTTASK_LEAK = _load_guard(
    "check_agenttask_decisioning_ungated_leak_honesty.py",
    "_check_agenttask_decisioning_ungated_leak_honesty",
)
TB881_CLASS = _load_guard(
    "check_tb881_ship_blocker_classification_honesty.py",
    "_check_tb881_ship_blocker_classification_honesty",
)


def _write_contract(root: Path, rel: Path, markers: list[str]) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(markers), encoding="utf-8")


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestDemoAnonymousReadPlaneHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = DEMO_READ_PLANE.demo_anonymous_read_plane_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_allowanonymous_safe_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                DEMO_READ_PLANE.CONTRACT_REL,
                [
                    "**TB-1251**",
                    "**TB-1252**",
                    "M-217",
                    "Forbid",
                    "CI anchors for **TB-1252**",
                    "DemoScopes",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "[AllowAnonymous] on demo routes proves tenant-safe reads.\n",
            )
            violations = DEMO_READ_PLANE.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))
            self.assertTrue(any("allowanonymous" in item.lower() for item in violations))


class TestElevatorPitchV1ClaimHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = ELEVATOR_PITCH.elevator_pitch_v1_claim_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_two_weeks_two_hours_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                ELEVATOR_PITCH.CONTRACT_REL,
                [
                    "**TB-1367**",
                    "**TB-1368**",
                    "M-245",
                    "CI anchors for **TB-1368**",
                    "cut / hedge / prove",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
                "Reviews that took two weeks now take two hours.\n",
            )
            violations = ELEVATOR_PITCH.scan_doc_claims(
                root, Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md")
            )
            self.assertTrue(any("two weeks" in item.lower() for item in violations))


class TestAgenttaskDecisioningUngatedLeakHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = AGENTTASK_LEAK.agenttask_decisioning_ungated_leak_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_simulator_fail_closed_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                AGENTTASK_LEAK.CONTRACT_REL,
                [
                    "**TB-1369**",
                    "**TB-1370**",
                    "M-247",
                    "Forbid",
                    "CI anchors for **TB-1370**",
                    "DecisionMergeInputGate",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/trust-center.md"),
                "Simulator decide is fail-closed differently from Real on overlay merge.\n",
            )
            violations = AGENTTASK_LEAK.scan_doc_claims(root, Path("docs/go-to-market/trust-center.md"))
            self.assertTrue(any("simulator" in item.lower() for item in violations))


class TestTb881ShipBlockerClassificationHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = TB881_CLASS.tb881_ship_blocker_classification_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_tb881_blocks_pilots_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                TB881_CLASS.CONTRACT_REL,
                [
                    "**TB-881**",
                    "**TB-1371**",
                    "**TB-1372**",
                    "M-249",
                    "CI anchors for **TB-1372**",
                    "IntegrationTestSqlCatalogEnvironment",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "TB-881 blocks pilots until registration is fixed.\n",
            )
            violations = TB881_CLASS.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))
            self.assertTrue(any("tb-881" in item.lower() for item in violations))


if __name__ == "__main__":
    unittest.main()
