"""CI smoke for TB-946 scale micro-drill harness files."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
LOAD_DIR = REPO_ROOT / "scripts" / "load"
DOC_PATH = REPO_ROOT / "docs" / "architecture" / "SCALE_MICRO_DRILL.md"

DRILL_SCRIPTS = (
    "scale-drill-a-http-llm-wait.js",
    "scale-drill-b-cpu-bound.js",
    "scale-drill-c-worker-backlog.js",
)

ALL_DRILL_SCRIPTS = ("scale-drill-k6-common.js",) + DRILL_SCRIPTS


class TestScaleMicroDrillScripts(unittest.TestCase):
    def test_scale_micro_drill_scripts_exist(self) -> None:
        for name in ALL_DRILL_SCRIPTS:
            path = LOAD_DIR / name
            self.assertTrue(path.is_file(), f"missing {path}")

    def test_scale_micro_drill_runbook_links_scripts(self) -> None:
        text = DOC_PATH.read_text(encoding="utf-8")
        for name in DRILL_SCRIPTS:
            self.assertIn(name, text, f"runbook should reference {name}")

    def test_scale_micro_drill_a_targets_retrieval(self) -> None:
        source = (LOAD_DIR / "scale-drill-a-http-llm-wait.js").read_text(encoding="utf-8")
        common = (LOAD_DIR / "scale-drill-k6-common.js").read_text(encoding="utf-8")
        self.assertIn("retrievalSearch", source)
        self.assertIn("retrieval/search", common)
        self.assertIn("TB-946", source)

    def test_scale_micro_drill_b_targets_compare_and_governance(self) -> None:
        source = (LOAD_DIR / "scale-drill-b-cpu-bound.js").read_text(encoding="utf-8")
        self.assertIn("/v1/compare", source)
        self.assertIn("governance/dashboard", source)

    def test_scale_micro_drill_c_targets_worker_export_paths(self) -> None:
        source = (LOAD_DIR / "scale-drill-c-worker-backlog.js").read_text(encoding="utf-8")
        self.assertIn("analysis-report/export", source)
        self.assertIn("/v1/audit/export", source)


if __name__ == "__main__":
    unittest.main()
