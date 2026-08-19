"""Unit tests for terraform_advisory_snippets_validate mirroring ArtifactSynthesis emit rules."""
from __future__ import annotations

import importlib.util
import json
import sys
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]

_SPEC = importlib.util.spec_from_file_location(
    "terraform_advisory_snippets_validate",
    _REPO / "scripts" / "ci" / "terraform_advisory_snippets_validate.py",
)
if _SPEC is None or _SPEC.loader is None:
    raise RuntimeError("Could not load terraform_advisory_snippets_validate.py")
_mod = importlib.util.module_from_spec(_SPEC)
sys.modules["terraform_advisory_snippets_validate"] = _mod
_SPEC.loader.exec_module(_mod)


def _normalize_for_snapshot(text: str) -> str:
    return "\n".join(text.replace("\r\n", "\n").splitlines()).rstrip() + "\n"


class TestSnippetParity(unittest.TestCase):
    def test_stub_matches_known_baseline(self) -> None:
        expected = (
            "# ArchLucid advisory \u2013 review before apply\n"
            "# No decommission-style decisions in this manifest \u2014 no removal blocks emitted.\n"
        )
        self.assertEqual(_normalize_for_snapshot(_mod.build_no_decommission_manifest_stub()), expected)

    def test_decision_related_nodes_matches_snapshot_baseline(self) -> None:
        decision = {
            "decisionId": "dec-node-1",
            "category": "Lifecycle",
            "title": "Decommission test workload",
            "selectedOption": "Option A",
            "rationale": "Cost",
            "relatedNodeIds": ["graph-node-1", "graph-node-2"],
        }

        snapshot_path = (
            _REPO
            / "ArchLucid.Application.Tests"
            / "TerraformAdvisory"
            / "TerraformAdvisoryEmitSnapshotTests.Decommission_snippet_uses_related_node_ids_as_address_hint.verified.txt"
        )
        snippet = snapshot_path.read_text(encoding="utf-8")

        self.assertEqual(_normalize_for_snapshot(_mod.build_decision_section(decision)), _normalize_for_snapshot(snippet))

    def test_synthesize_two_sections_matches_known_baseline(self) -> None:
        fixtures_path = _REPO / "scripts" / "ci" / "fixtures" / "sample_terraform_advisory_manifest.json"
        doc = json.loads(fixtures_path.read_text(encoding="utf-8"))
        scenario = next(s for s in doc["artifactScenarios"] if s["id"] == "two-decommission-sections")

        synthesized = _mod.synthesize_artifact_content(scenario["decisions"])

        artifact_snapshot = (
            _REPO
            / "ArchLucid.Application.Tests"
            / "TerraformAdvisory"
            / "TerraformAdvisoryEmitSnapshotTests.Artifact_generator_emits_sections_for_decommission_decisions.verified.txt"
        )
        snippet = artifact_snapshot.read_text(encoding="utf-8")

        self.assertEqual(_normalize_for_snapshot(synthesized), _normalize_for_snapshot(snippet))

    def test_looks_like_decommission_request(self) -> None:
        idle = {"title": "x", "category": "Cost", "selectedOption": "y", "rationale": "z"}
        self.assertFalse(_mod.looks_like_decommission_request(idle))

        with_marker = dict(idle, title="Decommission sandbox")
        self.assertTrue(_mod.looks_like_decommission_request(with_marker))


if __name__ == "__main__":
    unittest.main()
