"""Tests for scripts/ci/build_material_finding_faithfulness_summary.py."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
MODULE = REPO_ROOT / "scripts" / "ci" / "build_material_finding_faithfulness_summary.py"


class MaterialFindingFaithfulnessSummaryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="material-finding-"))

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_offline_corpus_produces_pass_or_warn_rollup(self) -> None:
        json_out = self.temp_dir / "material.json"
        md_out = self.temp_dir / "material.md"
        result = subprocess.run(
            [
                sys.executable,
                str(MODULE),
                "--corpus",
                str(REPO_ROOT / "tests" / "eval-corpus"),
                "--json-out",
                str(json_out),
                "--markdown-out",
                str(md_out),
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)
        summary = json.loads(json_out.read_text(encoding="utf-8"))
        self.assertEqual(summary["schema"], "archlucid.material-finding-faithfulness-summary.v1")
        self.assertIn(summary["rollup"], {"PASS", "WARN", "HOLD"})
        self.assertGreaterEqual(summary["citationCoverage"]["scenariosRequiringEvidenceRefs"], 1)
        self.assertIn("Material finding faithfulness", md_out.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
