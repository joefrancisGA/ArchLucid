"""Tests for FND-011 authorized snapshot projection boundary."""
import importlib.util
from pathlib import Path
import unittest

PATH = Path(__file__).resolve().parents[1] / "integration" / "fnd011_snapshot_adapter.py"
spec = importlib.util.spec_from_file_location("fnd011_snapshot_adapter", PATH)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

RUN = "44444444-4444-4444-8444-444444444444"
SCOPE = {"tenantId": "11111111-1111-4111-8111-111111111111",
         "workspaceId": "22222222-2222-4222-8222-222222222222",
         "projectId": "33333333-3333-4333-8333-333333333333"}
GRAPH = {"schemaVersion": 1, "graphSnapshotId": "55555555-5555-4555-8555-555555555555",
         "contextSnapshotId": "66666666-6666-4666-8666-666666666666",
         "runId": RUN, "createdUtc": "2026-11-22T08:00:00Z",
         "nodes": [{"nodeId": "n1", "nodeType": "Resource"}],
         "edges": [], "warnings": ["source partial"]}

class AdapterTests(unittest.TestCase):
    def adapt(self, **kwargs):
        return mod.adapt_authorized_snapshot(GRAPH, authorized_scope=SCOPE,
            expected_run_id=RUN, evaluated_at="2026-11-22T09:00:00Z", **kwargs)

    def test_unknown_freshness_and_lineage(self):
        result = self.adapt()
        self.assertEqual(result["freshness"]["status"], "unknown")
        self.assertEqual(result["lineage"]["sourceEvidenceRefs"], [])
        self.assertTrue(result["readOnly"])
        self.assertEqual(result["warnings"], ["source partial"])

    def test_current_and_stale(self):
        self.assertEqual(self.adapt(max_age_seconds=3600)["freshness"]["status"], "current")
        self.assertEqual(self.adapt(max_age_seconds=3599)["freshness"]["status"], "stale")

    def test_reject_run_mismatch(self):
        with self.assertRaisesRegex(ValueError, "Run identity mismatch"):
            mod.adapt_authorized_snapshot(GRAPH, authorized_scope=SCOPE,
                expected_run_id="other", evaluated_at="2026-11-22T09:00:00Z")

    def test_reject_missing_scope(self):
        with self.assertRaisesRegex(ValueError, "Missing authenticated scope"):
            mod.adapt_authorized_snapshot(GRAPH, authorized_scope={"tenantId": SCOPE["tenantId"]},
                expected_run_id=RUN, evaluated_at="2026-11-22T09:00:00Z")

    def test_reject_dangling_edges(self):
        graph = dict(GRAPH, edges=[{"fromNodeId": "n1", "toNodeId": "n2", "edgeType": "RELATES_TO"}])
        with self.assertRaisesRegex(ValueError, "Dangling"):
            mod.adapt_authorized_snapshot(graph, authorized_scope=SCOPE,
                expected_run_id=RUN, evaluated_at="2026-11-22T09:00:00Z")

    def test_does_not_mutate_source(self):
        import copy
        original = copy.deepcopy(GRAPH)
        self.adapt(source_evidence_refs=["evidence:trusted"])
        self.assertEqual(GRAPH, original)

    def test_reject_future_snapshot(self):
        with self.assertRaisesRegex(ValueError, "predates"):
            mod.adapt_authorized_snapshot(GRAPH, authorized_scope=SCOPE,
                expected_run_id=RUN, evaluated_at="2026-11-21T09:00:00Z")

if __name__ == "__main__":
    unittest.main()
