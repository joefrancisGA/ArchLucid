> **Scope:** Contributor-reference — Developers interpreting in-process `Category=Slow` / core-pilot timing targets in API tests — not production latency SLOs or load-test methodology.

# Performance baselines (in-process)

Targets for the **core pilot flow** regression tests in `ArchLucid.Api.Tests` (`[Trait("Category", "Slow")]`). These are **in-process** measurements against the default API test host: **AgentExecution:Mode=Simulator** and **ArchLucid:StorageProvider=InMemory** — not representative of production (no production SQL, no external clients).

| Operation | Target | Measured (CI / local) | Environment |
|----------|--------|------------------------|-------------|
| Create run | Contributes to E2E < 10s; per-step ms in test output | ~30 ms | In-process simulator + in-memory |
| Seed results | Contributes to E2E < 10s; per-step ms in test output | ~37 ms | Same |
| Commit (incl. findings engine) | Contributes to E2E < 10s; per-step ms in test output | ~763 ms (findings ~221 ms, commit ~305 ms) | Same |
| Retrieve manifest | Contributes to E2E < 10s; per-step ms in test output | ~74 ms | Same |
| Manifest p95 (10× GET) | < 500ms | **164 ms** | Same |

**E2E gate:** create run → seed fake results → commit → retrieve manifest must complete in **< 10 seconds** total (generous in-process cap).

**Last measured:** **2026-04-28** — `dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~CorePilotFlowPerformanceTests" -c Release` **passed** (2 tests, ~11 s test execution after build). Per-step timings are printed by the tests as `[perf] ...=Nms`; copy from CI or local console when you need fresh numbers. **Total E2E wall time** remains **~6 s** (simulator + in-memory, well under the 10 s cap). Prior reference line items (e.g. ~30 ms create, ~763 ms commit) are still representative until replaced from a new log scrape.

**Test class:** `ArchLucid.Api.Tests/Performance/CorePilotFlowPerformanceTests.cs`.

**Run (this class only, from repo root):** `dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~CorePilotFlowPerformanceTests"`.

**Run (all `Category=Slow` in API tests):** `dotnet test ArchLucid.Api.Tests --filter "Category=Slow"`.

**Note:** Filling the "measured" column is optional: copy from test output or CI when comparing branches; no checked-in published baseline file is required for this tier.

---

## SQL shape sentinels (runs list / audit paging)

High-volume relational list paths keep their SQL in **`ArchLucid.Persistence/Sql/HotPathRelationalQueryShapes.cs`** (canonical strings passed into Dapper for **`SqlRunRepository`** dashboard/keyset lists on **`dbo.Runs`** and **`DapperAuditRepository`** scoped reads on **`dbo.AuditEvents`**). **`ArchLucid.Persistence.Tests/Sql/HotPathRelationalQueryShapeTests.cs`** asserts stable fragments (`WITH (NOLOCK)` where intended, tenant/workspace/project scope, **`ArchivedUtc IS NULL`** on runs, **`ORDER BY`** tails) **without** opening a SQL connection — regression-only guardrails, not latency numbers. When you change those queries or indexing assumptions, update the constants and extend assertions in the same PR.

---

## Real-mode E2E benchmark (time-to-value)

For a **defensible, publishable** time-to-value figure using actual Azure OpenAI execution (not simulator), run the dedicated benchmark script:

```bash
ARCHLUCID_BASE_URL=https://staging.archlucid.net \
ARCHLUCID_API_KEY=<staging-key> \
k6 run tests/load/real-mode-e2e-benchmark.js
```

This measures wall-clock time from request creation through real LLM-powered analysis to manifest retrieval. See [`tests/load/README.md`](../../tests/load/README.md) for environment variables, thresholds, and custom metrics.

| Metric | Target | Measured | Environment |
|--------|--------|----------|-------------|
| `e2e_wall_clock_ms` p50 | < 120s | *Run k6 in CI only* — use workflow **`.github/workflows/load-test.yml`** (manual `workflow_dispatch`) or `tests/load/record-baseline.ps1` against Compose; upload artifact **`k6-summary.json`**. Do **not** treat `tests/load/results/baseline-2026-04-24.json` as live production numbers (example layout / merge helper). | Compose + k6 (CI or local automation), not staging |
| `e2e_wall_clock_ms` p95 | < 180s | *Same as p50* | Same |
| `step_poll_wait_ms` p50 | < 90s | *Same as p50* | Same |

**Note (2026-04-28):** Staging host **`https://staging.archlucid.net`** was not used for k6 from this repo’s automated runs; real-mode wall-clock baselines must come from the **k6 workflow artifact** (or a future scheduled job), not from ad-hoc laptop runs against production-like URLs.

---

## Operator INP regression note (TB-2166)

**Scope:** Client-side Interaction to Next Paint (INP) on evidence-graph and compare surfaces — not API in-process timings above.

| Surface | Offload | Deferred input |
|--------|---------|----------------|
| Evidence graph provenance layout (`ProvenanceGraphViewport`) | Web Worker task `provenanceLayout` | Type filter uses `startTransition` in `GraphPageContent` |
| Evidence graph React Flow map (`GraphViewer`) | Web Worker task `graphReactFlowMap` | `useDeferredValue` on type filter |
| Finding evidence graph highlight prep (`FindingEvidenceGraph`) | Web Worker task `findingEvidenceGraphPrep` | — |
| Compare governance diff (`useCompareGovernanceDiff`) | Web Worker task `compareGovernanceDiff` | — |
| Compare manifest line diff (`ArchitectureManifestUnifiedDiffView`) | Web Worker task `manifestLineDiff` | — |

**Local trace gate:** after a deploy that touches these surfaces, capture a Performance recording on graph pan/zoom and compare diff expand; no interaction long task should exceed **200 ms** on a mid-tier laptop. Field Web Vitals (Done **TB-2031**) remain the authoritative INP trend — target **−100 to −300 ms** INP improvement on these routes when field data is available.

**Contract tests:** `archlucid-ui/src/lib/workers/inp-offload-*.test.ts`.

---

## Operator home startup proxy trace (TB-2304)

**Scope:** Browser `GET` calls through the Next.js UI proxy on operator home (`/`) cold start — not RSC/server fetches or production RUM.

| Metric | Budget | Committed baseline |
|--------|--------|-------------------|
| Total proxy GETs (cold `/`) | ≤ 5 (+2 tolerance) | `archlucid-ui/performance/operator-home-startup-proxy-trace-baseline.v1.json` |
| `GET /v1/operator/shell-status` | exactly 1 | same |
| `GET /v1/user/preferences` | ≤ 1 | same (pairs **TB-2303**) |
| Duplicate shell-status concern GETs | 0 | `shellStatusHydratedPaths` in baseline JSON |
| **TB-2302** bootstrap mega-bundle | **no-go** | Documented in baseline + [`operator_home_startup_proxy_trace_tb2304.md`](../architecture/operator_home_startup_proxy_trace_tb2304.md) |

**Check (fixture or fresh capture):**

```bash
cd archlucid-ui
npm run check:operator-home-proxy-trace -- --trace scripts/fixtures/operator-home-startup-proxy-trace.pass.v1.json
```

**Drift guards:** `operator-home-startup-proxy-trace.test.ts`, `operator-shell-status-concern-gate-drift-guard.test.ts`.

**Last measured:** **2026-08-19** — engineering baseline from post shell-status architecture (3 GET pass fixture); refresh with `scripts/dev/capture-operator-home-proxy-trace.ps1` after material home changes.
