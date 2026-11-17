import json
import tempfile
import unittest
from pathlib import Path

from scripts.ci.compare_securenow_analysis_run_cache import analyze


def artifact(engine, repetition, scenario="fanout", reads=6, p95=80.0, rows=300):
    return {
        "schemaVersion": 1,
        "benchmarkKind": "SECURENOW_ANALYSIS_RUN_CACHE_COMPARISON",
        "engine": engine, "scenario": scenario,
        "rowsPerSnapshot": rows,
        "distinctSnapshots": 6 if scenario == "fanout" else 12,
        "repetition": repetition,
        "requests": 24,
        "repositoryReadCalls": reads,
        "reuseAvoidedRepositoryReads": 24 - reads,
        "maxConcurrentRepositoryCalls": 1 if engine == "serialized-baseline" else 4,
        "validatedRowsReturned": 24 * rows,
        "simulatedRepositoryDelayMs": 25,
        "p50RequestLatencyMs": p95 / 2,
        "p95RequestLatencyMs": p95,
        "wallMilliseconds": p95 * 2,
        "managedAllocatedBytes": 1000000,
        "maxSampledWorkingSetBytes": 100000000,
        "maxSampledManagedHeapBytes": 15000000,
        "workingSetBeforeBytes": 80000000,
        "workingSetAfterBytes": 90000000,
        "sampledWorkingSetObservations": 6,
        "gcGen0Collections": 2, "gcGen1Collections": 1, "gcGen2Collections": 0,
        "runtime": ".NET 10.0", "processorCount": 1,
        "measurementStatus": "SYNTHETIC_REPOSITORY_NOT_SQL_PROCESS_SAMPLED_RSS",
    }


def fixtures(directory, scenario="fanout", optimized_reads=6):
    for repetition in range(1, 4):
        for engine in ("serialized-baseline", "bounded-singleflight"):
            data = artifact(engine, repetition, scenario=scenario,
                            reads=6 if engine == "serialized-baseline" else optimized_reads,
                            p95=100 if engine == "serialized-baseline" else 50)
            Path(directory, f"cache-{scenario}-{engine}-run{repetition}.json").write_text(json.dumps(data))


class CacheComparisonTests(unittest.TestCase):
    def test_paired_samples_report_reuse_and_p95_without_sql_claims(self):
        with tempfile.TemporaryDirectory() as d:
            fixtures(d)
            report = analyze(d, expected_scenarios=1)
            metrics = report["results"][0]["metrics"]
            self.assertEqual(-50.0, metrics["p95RequestLatencyMs"]["percentChange"])
            self.assertEqual(0, metrics["repositoryReadCalls"]["delta"])
            self.assertEqual(1, report["scenarioCount"])
            self.assertIn("NOT_SQL", report["evidenceStatus"])

    def test_extra_repository_reads_are_not_misreported_as_savings(self):
        with tempfile.TemporaryDirectory() as d:
            fixtures(d, optimized_reads=12)
            metrics = analyze(d)["results"][0]["metrics"]
            self.assertGreater(metrics["repositoryReadCalls"]["delta"], 0)

    def test_mismatch_in_row_semantics_fails_closed(self):
        with tempfile.TemporaryDirectory() as d:
            fixtures(d)
            file = Path(d, "cache-fanout-bounded-singleflight-run1.json")
            data = json.loads(file.read_text())
            data["validatedRowsReturned"] -= 1
            file.write_text(json.dumps(data))
            with self.assertRaisesRegex(ValueError, "semantic"):
                analyze(d)

    def test_mismatched_runtime_or_request_count_fails_closed(self):
        with tempfile.TemporaryDirectory() as d:
            fixtures(d)
            file = Path(d, "cache-fanout-bounded-singleflight-run1.json")
            data = json.loads(file.read_text())
            data["runtime"] = "different"
            file.write_text(json.dumps(data))
            with self.assertRaisesRegex(ValueError, "mismatch"):
                analyze(d)

    def test_missing_repetitions_and_matrix_fail_closed(self):
        with tempfile.TemporaryDirectory() as d:
            fixtures(d)
            Path(d, "cache-fanout-bounded-singleflight-run3.json").unlink()
            with self.assertRaises(ValueError):
                analyze(d)
        with tempfile.TemporaryDirectory() as d:
            fixtures(d)
            with self.assertRaisesRegex(ValueError, "matrix"):
                analyze(d, expected_scenarios=2)

    def test_zero_baseline_does_not_create_percentage(self):
        with tempfile.TemporaryDirectory() as d:
            fixtures(d)
            for path in Path(d).glob("cache-*-serialized-baseline-*.json"):
                data = json.loads(path.read_text())
                data["gcGen2Collections"] = 0
                path.write_text(json.dumps(data))
            self.assertIsNone(analyze(d)["results"][0]["metrics"]["gcGen2Collections"]["percentChange"])

    def test_ignores_unrelated_artifacts_but_rejects_duplicate_samples(self):
        with tempfile.TemporaryDirectory() as d:
            fixtures(d)
            Path(d, "summary.json").write_text("{}")
            self.assertEqual(1, analyze(d)["scenarioCount"])
            original = Path(d, "cache-fanout-bounded-singleflight-run1.json")
            Path(d, "cache-duplicate.json").write_text(original.read_text())
            with self.assertRaisesRegex(ValueError, "Duplicate"):
                analyze(d)


if __name__ == "__main__":
    unittest.main()
