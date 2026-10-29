# Dedicated SQL and vector capacity fixtures

The SQL/vector capacity workflow now runs separate benchmark cases for `InMemoryVectorIndex` and SQL Server. Both use bounded seeded datasets (500/2,000 rows or chunks), concurrency 1 or 4, and 15 timed queries per concurrent worker after a warm-up. Each emits a schema-v1 JSON artifact with p50 and p95 query duration, query count and total elapsed time. All samples are within the test runner, not an isolated CPU/memory process.

The SQL case uses scoped, indexed **temporary SQL Server tables** with query execution on the SQL integration fixture. It is a genuine SQL round-trip but **not a production ArchLucid persistence query**. The vector case uses the real `InMemoryVectorIndex` with deterministic 3-dimensional embeddings; it does **not** measure external vector services, embedding API calls, or real query ranking distributions.

These benchmarks are repeatable operator evidence and are **not sufficient to calibrate cloud replica sizing or SLA percentiles**. Compare only within equivalent CI runner, SQL service, corpus and software revisions. Do not infer billed cost, production concurrency capacity or cross-tenant isolation from benchmark timings. No runtime changes or tenant data are involved.
