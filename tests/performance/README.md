# Named-query performance gate (TECH_BACKLOG TB-003)

**Metric:** OpenTelemetry histogram `archlucid_query_p95_ms` (label **`query_name`**) via `ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds`.

**Allowlist:** `tests/performance/query-allowlist.json` — each row defines a stable `name` (must equal a `NamedQueryTelemetryNames` constant **value**) and `p95ThresholdMs` for CI/exported percentile checks.

**CI script:** `scripts/ci/assert_query_performance.py`

- **`--dry-run`** — synthesizes measurements at 50% of each threshold (used on every PR today; verifies allowlist parses).
- **`--measurements-json path`** — production-style gate: JSON shaped as `{ "queries": [ { "name": "…", "p95Ms": 12.3 } ] }`; fails if any allowlisted query is missing or over threshold. Unknown names in the measurements file print as informational only.

**Refresh checklist (when adding or renaming a monitored query):**

1. Add a **stable string constant** on `NamedQueryTelemetryNames` (human-readable PascalCase matching existing entries).
2. Wrap the SQL path in **`try` / `finally`** with **`Stopwatch`** and call **`RecordNamedQueryLatencyMilliseconds`** (see `SqlRunRepository`, `DapperAuditRepository`).
3. Add a matching **`{ "name": "...", "p95ThresholdMs": N }`** row to **`query-allowlist.json`** (justify `N` from staging metrics, load tests, or SQL profiling).
4. Run **`python scripts/ci/assert_query_performance.py --dry-run`** and **`dotnet test ArchLucid.Persistence.Tests --filter FullyQualifiedName~NamedQueryTelemetryAllowlistAlignmentTests`**.

Cross-links: **`docs/library/OBSERVABILITY.md`** (instrument table), **`docs/library/TECH_BACKLOG.md`** (TB-003).
