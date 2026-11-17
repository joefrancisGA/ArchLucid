"""Tests for the warn-only SecureNow AI/Agent Readiness source guard."""

from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.ci.check_securenow_agent_readiness import validate


ROOT = Path(__file__).resolve().parents[2]
REQUIRED_FILES = (
    "archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx",
    "ArchLucid.Application/InfraEvidence/SecurityEvidencePathExplanationService.cs",
    "ArchLucid.Application/InfraEvidence/InfraEvidenceAskGroundingService.cs",
    "archlucid-ui/src/lib/product-line/securenow-path-inspect-copy.ts",
)


def copy_guard_inputs(destination: Path) -> None:
    for relative_path in REQUIRED_FILES:
        source = ROOT / relative_path
        target = destination / relative_path
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)


class SecureNowAgentReadinessCheckerTests(unittest.TestCase):
    def test_real_tree_passes(self) -> None:
        self.assertEqual(validate(ROOT), [])

    def test_missing_real_mode_post_fails(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            copy_guard_inputs(root)
            panel = root / REQUIRED_FILES[0]
            panel.write_text(
                panel.read_text(encoding="utf-8").replace(
                    "const useSimulatorForExplanation =\n    mode === \"Real\" && !isAgentExecutionModeLoading\n      ? false\n      : true;",
                    "const useSimulatorForExplanation = true;",
                ),
                encoding="utf-8",
            )

            errors = validate(root)

            self.assertTrue(any("live mode" in error for error in errors))

    def test_missing_token_cap_fails(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            copy_guard_inputs(root)
            service = root / REQUIRED_FILES[1]
            service.write_text(
                service.read_text(encoding="utf-8").replace(
                    "public const int PathExplanationMaxOutputTokens = 800;",
                    "public const int PathExplanationMaxOutputTokens = 1000;",
                ),
                encoding="utf-8",
            )

            errors = validate(root)

            self.assertTrue(any("800-token cap" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
