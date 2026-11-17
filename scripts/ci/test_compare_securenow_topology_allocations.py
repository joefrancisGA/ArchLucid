import json
import tempfile
import unittest
from pathlib import Path
from scripts.ci.compare_securenow_topology_allocations import analyze

def artifact(engine, repetition, *, prefixes=100, allocated=2000, edges=150, truncated=False):
    return {
        "schemaVersion": 1,
        "benchmarkKind": "SECURENOW_TOPOLOGY_ALGORITHM_COMPARISON",
        "engine": engine,
        "cohort": "branching",
        "nodes": 200, "edgeCount": 750, "depth": 8, "maxPrefixes": 20000,
        "repetition": repetition,
        "framework": ".NET 10", "processorCount": 1,
        "profile": {
            "PrefixCount": prefixes, "TraversedEdges": edges,
            "VisitedNodes": 50, "Truncated": truncated,
            "EvidenceStatus": "TOPOLOGY_STRUCTURAL_ONLY" if not truncated else "TOPOLOGY_PREFIX_COUNT_TRUNCATED",
            "ManagedAllocatedBytes": allocated,
            "ElapsedMilliseconds": 12.5,
            "ProcessCpuMillisecondsDelta": 10.0,
            "MaximumSampledWorkingSetBytes": 150000000,
            "MaximumSampledManagedHeapBytes": 3000000,
        },
        "gcGen0Collections": 2, "gcGen1Collections": 1, "gcGen2Collections": 0,
    }

def fixtures(directory, *, optimized_prefixes=100, old_allocated=2000, new_allocated=1000):
    for i in (1, 2, 3):
        for engine, allocated in [("copying-baseline", old_allocated), ("optimized-dfs", new_allocated)]:
            row = artifact(engine, i, prefixes=optimized_prefixes if engine == "optimized-dfs" else 100,
                           allocated=allocated)
            Path(directory, f"comparison-{engine}-branching-200-run{i}.json").write_text(json.dumps(row))

class TopologyAllocationCompareTests(unittest.TestCase):
    def test_matched_repetitions_measure_reduction_without_peak_claim(self):
        with tempfile.TemporaryDirectory() as d:
            fixtures(d)
            report = analyze(d, expected_cohorts=1)
            result = report["results"][0]
            self.assertTrue(result["semanticEquivalenceVerified"])
            self.assertEqual(-50, result["metrics"]["managedAllocatedBytes"]["percentChange"])
            self.assertEqual(3, result["repetitions"])
            self.assertIn("NOT_PRODUCTION", report["status"])
    def test_mismatch_fails_closed(self):
        with tempfile.TemporaryDirectory() as d:
            fixtures(d, optimized_prefixes=99)
            with self.assertRaisesRegex(ValueError, "semantics"):
                analyze(d)
    def test_no_results_does_not_imply_zero_allocations(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError):
                analyze(d)
    def test_incomplete_repetitions_fail(self):
        with tempfile.TemporaryDirectory() as d:
            fixtures(d)
            Path(d, "comparison-optimized-dfs-branching-200-run3.json").unlink()
            with self.assertRaises(ValueError):
                analyze(d)
    def test_undefined_percentage_for_zero_baseline(self):
        with tempfile.TemporaryDirectory() as d:
            fixtures(d, old_allocated=0)
            result = analyze(d)["results"][0]
            self.assertIsNone(result["metrics"]["managedAllocatedBytes"]["percentChange"])
    def test_expected_matrix_size_required(self):
        with tempfile.TemporaryDirectory() as d:
            fixtures(d)
            with self.assertRaises(ValueError):
                analyze(d, expected_cohorts=12)

if __name__ == "__main__":
    unittest.main()
