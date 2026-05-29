"""Contract and disposition checks for consolidated AI readiness gate."""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
GATE_MODULE = REPO_ROOT / "scripts" / "FirstPilotConsolidatedAiReadinessGate.ps1"
PROOF_SCRIPT = REPO_ROOT / "scripts" / "collect-first-pilot-proof.ps1"
PESTER_TESTS = REPO_ROOT / "scripts" / "ci/tests/FirstPilotConsolidatedAiReadinessGate.Tests.ps1"


def test_gate_module_exports_core_functions() -> None:
    text = GATE_MODULE.read_text(encoding="utf-8-sig")

    assert "function Build-ConsolidatedAiReadinessGate" in text
    assert "function Resolve-ConsolidatedAiReadinessDisposition" in text
    assert "function Write-ConsolidatedAiReadinessGateArtifacts" in text
    assert "'PASS'" in text
    assert "'WARN'" in text
    assert "'HOLD'" in text
    assert "simulatorOnlyPosture" in text


def test_proof_pipeline_wires_consolidated_gate() -> None:
    text = PROOF_SCRIPT.read_text(encoding="utf-8-sig")

    assert "FirstPilotConsolidatedAiReadinessGate.ps1" in text
    assert "Add-ConsolidatedAiReadinessGateFinding" in text
    assert "aiReadinessGate" in text
    assert "ai-readiness-gate.json" in text
    assert "## Consolidated AI readiness gate" in GATE_MODULE.read_text(encoding="utf-8-sig")


def test_pester_disposition_suite_exists() -> None:
    text = PESTER_TESTS.read_text(encoding="utf-8-sig")

    assert "Returns PASS when sponsor-safe" in text
    assert "Returns HOLD on sponsor handoff" in text
    assert "Returns WARN for simulator-only" in text


def test_pester_disposition_cases_pass() -> None:
    completed = subprocess.run(
        [
            "pwsh",
            "-NoProfile",
            "-Command",
            (
                f"Set-Location -LiteralPath '{REPO_ROOT}'; "
                "Invoke-Pester -Strict -EnableExit "
                "-Path 'scripts/ci/tests/FirstPilotConsolidatedAiReadinessGate.Tests.ps1'"
            ),
        ],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        timeout=120,
        check=False,
    )

    assert completed.returncode == 0, completed.stdout + completed.stderr
