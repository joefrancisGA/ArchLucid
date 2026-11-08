# SecureNow analysis-run snapshot cache — isolated before/after comparison

This benchmark compares the **pre-PR #5498 serialized analysis-run snapshot cache** with the newer **per-key single-flight, bounded run-local cache**. The old implementation lives **only** in `tools/SecureNow.AnalysisRunCacheBench/SerializedRunCacheBaseline.cs` and cannot be selected in production. The optimized engine calls the real `SecureNowAnalysisRun.LoadAsync` method from `ArchLucid.Application`.

## Reproducible workload design

The Release-mode standalone .NET 10 executable runs one engine and one scenario per invocation, so different algorithms never share retained static cache state inside a process. Each run uses the same synthetic, scoped repository mock: fixed 25-ms simulated read latency, 300 deterministic-shape inventory resources per snapshot, and a stable tenant/workspace/project identity. Resources have synthetic IDs only; no customer records, secrets or Azure resources are accessed.

* `fanout`: 24 requests in two consecutive waves over six snapshot IDs. Each wave has duplicate concurrent snapshot queries. Both engines can retain all six snapshots; this isolates the effect of independent-key loading, single-flight and serialized baseline contention.
* `retention-pressure`: 24 requests in two consecutive waves over twelve snapshot IDs. The original implementation retains all twelve; the new cache is limited to eight snapshots. **Extra repository reads from bounded-cache eviction are an expected and important trade-off** — not a benchmark failure.

The GitHub Actions workflow `securenow-analysis-run-cache-compare.yml` runs **12 isolated processes** (two engines × two scenarios × three repetitions), each under a 512-MiB Docker container limit and one CPU. Generated JSON evidence is kept in the `securenow-analysis-run-cache-comparison` workflow artifact.

## Measured and checked

Each process records actual calls to the **simulated repository** (NOT SQL query counts), avoided duplicate repository calls, peak simultaneous repository calls, p50/p95 request latency, whole-wave elapsed time, process-wide managed allocated bytes, sampled process RSS, sampled managed heap size, Gen0/1/2 GC collection deltas, runtime identity and result row totals. The Python comparison tool refuses unmatched repetitions, invalid metric types, invalid counters, unequal fixture/runtime identity and inconsistent row totals before calculating per-scenario before/after **medians** and percent changes. A zero baseline yields an undefined percentage rather than artificial improvement.

For local validation, from the repository root:

```sh
dotnet build tools/SecureNow.AnalysisRunCacheBench/SecureNow.AnalysisRunCacheBench.csproj -c Release
python3 -m unittest scripts.ci.test_compare_securenow_analysis_run_cache
```

To reproduce one run without the container:

```sh
dotnet tools/SecureNow.AnalysisRunCacheBench/bin/Release/net10.0/SecureNow.AnalysisRunCacheBench.dll bounded-singleflight fanout 300 1 /tmp/cache-run.json
```

A locally run sample is not automatically comparable to a different runtime, CPU allotment, container configuration or repository delay.

## Interpretation and scope

This supplies a **controlled synthetic comparison**, not a real SQL Server benchmark or proof of improved production p95 latency. The `repositoryReadCalls` field is a mocked repository method-call count and must not be labeled SQL reads. RSS/heap measurements are sampled and may miss short-lived peaks; managed allocations and GC counters are process-wide; very short reads and three repeats have high variance. The retained-size limit in the new cache is a row-count estimate, not a verified CLR heap ceiling. Successful CI does **not** establish a universal speedup: the bounded cache may incur additional reads under 12-snapshot pressure.

Production sizing and architectural rating changes require real SQL-backed analysis workloads with realistic snapshot cardinalities and cold/warm traffic profiles. No production cache policy, schema, authorization behavior or worker configuration is modified by this benchmark.
