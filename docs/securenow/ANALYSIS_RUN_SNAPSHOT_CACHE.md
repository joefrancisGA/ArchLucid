# SecureNow analysis-run snapshot reuse: bounded per-key single-flight

The `SecureNowAnalysisRun` helper is only active inside an explicitly opened `Begin()` analysis pipeline. It caches **enriched inventory snapshot details** by repository object identity and **tenant + workspace + project + snapshot**; it never caches canonical reads or mutable path, finding, assertion and ranking records. Outside the run, every lookup reads the repository directly. Separate overlapping runs do not share objects.

## Concurrent loads

Reads of the **same exact key** coalesce into one in-flight repository load, while different snapshot keys can be read concurrently. A run-wide semaphore caps simultaneous snapshot repository reads at **four**, avoiding unconstrained SQL fan-out. Canceling a waiting caller cancels its wait only; the shared load uses the run's lifetime token. When the owning run disposes, pending shared reads are canceled, completed entries are released, and late results cannot repopulate the closed cache. Exceptions and canceled loads are never cached.

## Bounded retention

The run retains at most **eight completed snapshots**, **16 total tracked keys** (completed + pending), **8 MiB estimated per retained snapshot** and **16 MiB total retained estimated size**. Completed entries are managed in least-recently-used order. When the key table is full, oldest completed entries are evicted. If every tracked entry is still pending, further keys bypass caching and are read from the authoritative repository subject to the same four-slot concurrency limit.

The size estimate is **1 KiB per snapshot + 512 bytes per data row**, counting all 20 snapshot row collections. It is an **advisory row-count proxy, not a strict CLR heap or RSS limit**; long strings, collection overhead, lazily materialized indexes and transient concurrent reads may exceed it. Oversized snapshots are returned to the caller but **not retained**. The run owns no global cache or Redis persistence, so no mutable evidence survives into another analysis run.

## Tests and validation

Regression tests cover same-key coalescing, different-key parallelism, canceled waiters, failed and canceled loads, tenant/workspace/project/repository isolation, LRU eviction, oversized bypass, four-slot read concurrency, run disposal and existing declared-connection freshness. Real SQL benchmarks are still needed before claiming reduced p95 time, lower SQL load or reduced peak managed heap. There is no new cross-run reuse or change to authorization and snapshot sealing behavior.
