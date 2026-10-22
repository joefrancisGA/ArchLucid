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


CONFIG_ARCH = _load_guard(
    "check_configuration_architecture_precedence_honesty.py",
    "_check_configuration_architecture_precedence_honesty",
)
WORKER_ROLLING = _load_guard(
    "check_worker_rolling_deploy_drain_handoff_honesty.py",
    "_check_worker_rolling_deploy_drain_handoff_honesty",
)


def _write_contract(root: Path, rel: Path, markers: list[str]) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(markers), encoding="utf-8")


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestConfigurationArchitecturePrecedenceHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = CONFIG_ARCH.configuration_architecture_precedence_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_appsettings_sot_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                CONFIG_ARCH.CONTRACT_REL,
                [
                    "**TB-1561**",
                    "**TB-1562**",
                    "M-290",
                    "CI anchors for **TB-1562**",
                    "ArchLucidConfigurationRules",
                    "**TB-881**",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "appsettings.json is deployment SoT for all hosted pilots.\n",
            )
            violations = CONFIG_ARCH.configuration_architecture_precedence_honesty_violations(root)
            self.assertTrue(any("appsettings" in v.lower() for v in violations))


class TestWorkerRollingDeployDrainHandoffHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = WORKER_ROLLING.worker_rolling_deploy_drain_handoff_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_drain_to_completion_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                WORKER_ROLLING.CONTRACT_REL,
                [
                    "**TB-1563**",
                    "**TB-1564**",
                    "M-292",
                    "CI anchors for **TB-1564**",
                    "AddArchLucidGracefulShutdown",
                    "ShutdownTimeout",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "Worker rolling deploy drains in-flight reviews to completion on every revision roll.\n",
            )
            violations = WORKER_ROLLING.worker_rolling_deploy_drain_handoff_honesty_violations(root)
            self.assertTrue(any("drain" in v.lower() for v in violations))


if __name__ == "__main__":
    unittest.main()
