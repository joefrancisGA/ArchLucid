"""Tests for TB-883 Graph-RAG live-model ablation on committed exemplars."""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path


def _load_ablation_module():
    path = Path(__file__).resolve().parents[1] / "graph_rag_live_ablation.py"
    spec = importlib.util.spec_from_file_location("graph_rag_live_ablation", path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules["graph_rag_live_ablation"] = mod
    spec.loader.exec_module(mod)
    return mod


class GraphRagLiveAblationTests(unittest.TestCase):
    def test_filter_graph_rag_neighbor_hits_removes_neighbor_source_type(self) -> None:
        mod = _load_ablation_module()
        hits = [
            {"sourceId": "base-a", "sourceType": "PlatformDoc", "title": "Base A"},
            {
                "sourceId": "neighbor-b",
                "sourceType": mod.GRAPH_RAG_NEIGHBOR_SOURCE_TYPE,
                "title": "Neighbor B",
            },
        ]

        filtered, removed = mod.filter_graph_rag_neighbor_hits(hits)

        self.assertEqual(removed, 1)
        self.assertEqual([hit["sourceId"] for hit in filtered], ["base-a"])

    def test_summarize_exemplar_computes_delta_when_neighbor_uncited(self) -> None:
        mod = _load_ablation_module()
        doc = {
            "claims": [{"detail": "Use cat-app-service and pattern-front-door.", "evidenceRefs": []}],
            "findings": [],
            "evidenceRefs": [],
            "retrievalHits": [
                {
                    "chunkId": "chunk-a",
                    "sourceId": "cat-app-service",
                    "sourceType": "PlatformDoc",
                    "corpusKind": "ReferenceArchitecture",
                    "score": 0.9,
                    "title": "App Service",
                },
                {
                    "chunkId": "chunk-b",
                    "sourceId": "pattern-front-door",
                    "sourceType": "PlatformDoc",
                    "corpusKind": "ReferenceArchitecture",
                    "score": 0.8,
                    "title": "Front Door",
                },
                {
                    "chunkId": "chunk-neighbor",
                    "sourceId": "pattern-waf-edge-rules",
                    "sourceType": mod.GRAPH_RAG_NEIGHBOR_SOURCE_TYPE,
                    "corpusKind": "ReferenceArchitecture",
                    "score": 0.7,
                    "title": "WAF edge",
                },
            ],
        }

        row = mod.summarize_exemplar_graph_rag_ablation(
            exemplar_path=Path("sample.real.json"),
            doc=doc,
        )

        assert row is not None
        self.assertAlmostEqual(float(row["allOnSupportRatio"]), 2 / 3, places=6)
        self.assertAlmostEqual(float(row["graphRagOffSupportRatio"]), 1.0, places=6)
        self.assertGreater(float(row["deltaVsAllOn"]), 0.0)

    def test_summarize_from_paths_reports_insufficient_data_without_hits(self) -> None:
        mod = _load_ablation_module()

        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "no-hits.real.json"
            path.write_text(
                json.dumps(
                    {
                        "claims": [{"detail": "grounded", "evidenceRefs": ["a"]}],
                        "findings": [{"severity": "Low", "description": "grounded a"}],
                    }
                ),
                encoding="utf-8",
            )

            summary = mod.summarize_graph_rag_ablation_from_paths([path])

        self.assertEqual(summary["status"], "insufficient_data")
        self.assertEqual(summary["exemplarsWithRetrievalHits"], 0)

    def test_summarize_from_paths_computes_when_hits_present(self) -> None:
        mod = _load_ablation_module()
        repo_root = Path(__file__).resolve().parents[3]
        smoke = repo_root / "tests/eval-corpus/agent-results/corpus-real-mode-smoke.real.json"

        summary = mod.summarize_graph_rag_ablation_from_paths([smoke])

        self.assertEqual(summary["status"], "computed")
        self.assertGreaterEqual(summary["exemplarsWithRetrievalHits"], 1)
        self.assertIsNotNone(summary["meanDeltaVsAllOn"])


if __name__ == "__main__":
    unittest.main()
