"""Unit tests for scripts/ci/check_securenow_cognitive_load.py."""

from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.ci.check_securenow_cognitive_load import ROOT, validate

TRACKED_PATHS = (
    "docs/securenow/COGNITIVE_LOAD_TERMINOLOGY.md",
    "archlucid-ui/src/components/product-line/SecureNowHomeWorkSummary.tsx",
    "archlucid-ui/src/components/product-line/SecureNowHomeEnvironmentContext.tsx",
    "archlucid-ui/src/lib/product-line/securenow-first-hour-copy.ts",
    "archlucid-ui/src/lib/product-line/securenow-path-inspect-copy.ts",
)


def _copy_tree(destination: Path) -> None:
    for relative in TRACKED_PATHS:
        source = ROOT / relative
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)


class SecureNowCognitiveLoadTests(unittest.TestCase):
    def test_real_repo_passes(self) -> None:
        self.assertEqual([], validate())

    def test_missing_next_action_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "archlucid-ui/src/components/product-line/SecureNowHomeWorkSummary.tsx"
            path.write_text(
                path.read_text(encoding="utf-8").replace(
                    "No comparison yet. Collect another snapshot",
                    "No comparison yet",
                ),
                encoding="utf-8",
            )
            errors = validate(root)
            self.assertTrue(any("next-action token" in error for error in errors))

    def test_missing_canonical_noun_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/COGNITIVE_LOAD_TERMINOLOGY.md"
            path.write_text(
                path.read_text(encoding="utf-8").replace("| `question` |", "| `prompt` |"),
                encoding="utf-8",
            )
            errors = validate(root)
            self.assertTrue(any("canonical noun 'question'" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
