# SecureNow dedicated process memory evidence

The `tools/SecureNow.MemoryBench` runner invokes the real structural topology counter on deterministic, sanitized chain, cyclic, branching and dense synthetic graphs in one short-lived process per invocation. The dedicated GitHub Actions workflow runs twelve separate processes (four topology types at 50, 200 and 500 nodes), retaining versioned JSON profiles and `SecureNowPeakMemoryForecast.Sample` values.

The benchmark measures process-wide sampled resident memory, managed-heap observations and managed allocation deltas. Memory readings are not guaranteed true peaks, and sample classifications apply only to an uncontended dedicated process, not to shared production hosts. Truncated samples are excluded by the forecasting engine.

The `MemoryBudgetReport.cs.txt` example illustrates comparing same-cohort advisory planning headroom against an explicitly supplied worker limit. It is **not executable** or an active admission controller. A forecast requires two valid samples bracketing workload size, edge count, prefix count and depth; missing measurements fail closed. The forecast upper planning budget is an assumed headroom factor, not a safe upper bound. No production quotas or infrastructure settings change.
