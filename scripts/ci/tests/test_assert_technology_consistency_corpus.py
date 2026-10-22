"""Drift guard — assert_technology_consistency_corpus.py and CI golden test wiring."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAssertTechnologyConsistencyCorpus(unittest.TestCase):
    def test_script_exists(self) -> None:
        script = REPO_ROOT / "scripts" / "ci" / "assert_technology_consistency_corpus.py"
        self.assertTrue(script.is_file())

    def test_ci_workflow_runs_golden_corpus_tests(self) -> None:
        workflow = (REPO_ROOT / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")
        self.assertIn("TechnologyConsistencyGoldenCorpus", workflow)
        self.assertIn("TechnologyConsistencyArtifactGoldenCorpus", workflow)
        self.assertIn("assert_technology_consistency_corpus.py", workflow)

    def test_required_scenarios_registered(self) -> None:
        manifest = (REPO_ROOT / "tests" / "technology-consistency-corpus" / "manifest.json").read_text(
            encoding="utf-8"
        )
        for slug in (
            "finding-engine/azure-coherent-baseline",
            "finding-engine/revision-coherent-to-drift",
            "artifact-lint/unledgered-hyperscaler-token",
        ):
            self.assertIn(slug, manifest)


if __name__ == "__main__":
    unittest.main()
