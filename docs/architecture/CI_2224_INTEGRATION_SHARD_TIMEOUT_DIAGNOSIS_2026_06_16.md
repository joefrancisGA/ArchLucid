> **Scope:** Diagnosis-only investigation of GitHub CI run **#2224** — three Api.Tests integration regression shards timing out alongside two blame-hang failures on the same job matrix. Audience: engineering and CI maintainers; not buyer-facing.
>
> **Run:** [27650027936](https://github.com/joefrancisGA/ArchLucid/actions/runs/27650027936) · **Branch:** `ci/fix-idempotency-concurrency-hang-guard` · **Date:** 2026-06-16  
> **Related:** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (`dotnet-full-regression-core-api-integration`); [`.github/actions/sqlserver-hang-diagnostics`](../../.github/actions/sqlserver-hang-diagnostics); [`.cursor/prompts/fix-ci-run-2152-dotnet-sql-shard-hangs.md`](../../.cursor/prompts/fix-ci-run-2152-dotnet-sql-shard-hangs.md)

# CI #2224 — integration shard timeout diagnosis

## Executive summary

CI **#2224** degraded **5 of 6** Api.Tests integration regression shards. **Three shards (3/6, 5/6, 6/6) hit the 240-minute job ceiling** (`canceled`). **Two shards (2/6, 4/6) failed at ~100–109 minutes** when a single test exceeded the **75-minute blame-hang inactivity** threshold. Only shard **1/6** completed (~9 minutes).

This is a **systemic signal**, not three unrelated failures. The common path is **SQL-backed integration tests** that boot a full **`GreenfieldSqlApiFactory`** host (ephemeral `ArchLucidGreenfield_<guid>` catalog + DbUp greenfield migration) and exercise **`POST /v1/architecture/request`** through create-run idempotency locks, authority pipeline work, audit append, and outbox tables.

The recurring blame-hang entry **`AskThreadIntegrationTests.Ask_with_seeded_run_returns_answer_and_creates_thread`** appears in multiple blame `Sequence_*.xml` dumps but is **not the SQL culprit** — that test uses **`AlertLifecycleWebAppFactory`** (`StorageProvider=InMemory`) and an **8-minute** `IntegrationTestDeadline`. Workflow comments and prior runs indicate blame “current test” is often **the last in-flight test**, not the root cause.

**Leading hypothesis (high confidence):** per-test greenfield SQL host boot + migration cost stacks under CI SQL pressure until shards exceed 240 minutes, amplified by abandoned hosts/connections holding session-scoped `sp_getapplock` resources.

**Critical diagnostic gap:** existing `sqlserver-hang-diagnostics` runs only on `if: failure()` and **does not execute when jobs are `canceled` by `timeout-minutes`** — so the three timed-out shards produced **no** SQL active-request, blocking, tempdb, or container-log snapshot.

---

## 1. Which three shards timed out?

| Shard | Result | Wall time | Failure mode |
|-------|--------|-----------|--------------|
| 1/6 | success | ~9 min | — |
| 2/6 | **failure** | ~101 min | blame-hang (~75 min single-test inactivity + build) |
| 3/6 | **canceled** | **240 min** | job `timeout-minutes: 240` |
| 4/6 | **failure** | ~109 min | blame-hang |
| 5/6 | **canceled** | **240 min** | job ceiling |
| 6/6 | **canceled** | **240 min** | job ceiling |

**The three timed-out shards are 3/6, 5/6, and 6/6.**

---

## 2. Same test area or different areas?

All six shards run the **same job definition** (`dotnet-full-regression-core-api-integration` in `ci.yml`):

- Project: `ArchLucid.Api.Tests`
- Filter: `Category=Integration` and `Category!=Slow`
- Shard: class-based, **6 shards** via `Invoke-ApiIntegrationTestShard.ps1`
- SQL: shared service container per job (`127.0.0.1:1433`, `ArchLucidPersistenceTests` initial catalog env)

The difference between fast shard 1 and slow/hung shards is **how many SQL greenfield test classes** each shard receives, not a different workflow or filter.

---

## 3. Last meaningful application/test log line per shard

Direct #2224 blame artifacts were not fully retrieved in the authoring session (slow `gh` API). Evidence from **prior runs on the same branch** (local blame dumps `_ci2168`, `17defb53-…`) shows both ending on:

```text
ArchLucid.Api.Tests.AskThreadIntegrationTests.Ask_with_seeded_run_returns_answer_and_creates_thread
Completed="False"
```

**Interpretation:** treat this as **last in-flight at kill time**, not proven root cause. The slow-shard API job comment in `ci.yml` explicitly warns that blame “current test” is often the last finished test when the host stalls after tests or during teardown.

For shards **2/6 and 4/6** (which `failure`d, not `canceled`), the **SQL Server hang diagnostics step should have run** — pull those job logs immediately on the next investigation pass for active requests, blocked waiters, and tempdb at the ~75-minute mark.

---

## 4. Common path across all three timed-out shards

```text
POST /v1/architecture/request
  → create-run idempotency (SqlSessionDistributedCreateRunIdempotencyLock / sp_getapplock, Session owner, 180s wait)
  → authority.run / authority pipeline (PipelineTimeout 5 min)
  → DapperAuditRepository.AppendAsync → dbo.AuditEvents
  → outbox writes (AuthorityPipelineWorkOutbox, RunExportBlobPushOutbox, …)
  → BackgroundService outbox processors (RunExportBlobPushOutboxHostedService, …)
  → per-test ephemeral DB ArchLucidGreenfield_<guid> (DbUp + schema bootstrap on every GreenfieldSqlApiFactory boot)
```

`CreateRunIdempotencyConcurrencyIntegrationTests` (`Category=Slow`) exercises this path explicitly on the **slow shard**, not these integration shards — but the **same production lock and timeout stack** applies to create-run POSTs in integration tests.

---

## 5. Common factor: SQL vs authority vs audit vs outbox vs harness?

| Factor | Role in #2224 | Confidence |
|--------|---------------|------------|
| **SQL greenfield host boot + DbUp** | Dominant time sink when many classes share a shard | **High** |
| **Session-scoped sp_getapplock / abandoned connections** | Amplifier within a shard | **Medium–High** |
| **Authority pipeline + audit append** | On critical path per create-run; bounded per op but stacks | **Medium** |
| **Outbox background workers** | Largely mitigated (ShutdownTimeout 15s; many purge loops disabled in base fixture) | **Low** as primary cause |
| **AskThread / InMemory host** | Misleading blame target; lifecycle guards exist for AlertLifecycle factory only | **Low** as root cause |
| **Test harness shutdown (unbounded GreenfieldSql dispose)** | Possible contributor to 75-min blame on shards 2/4 | **Medium** |

---

## 6. Database isolation and collision

- Each `GreenfieldSqlApiFactory` creates **`ArchLucidGreenfield_<guid>`** — **unique per factory instance** (`GreenfieldSqlApiFactory.cs`).
- Each integration shard job has its **own SQL Server service container** — no cross-shard catalog collision.
- Risks are **accumulation** (catalogs not dropped), **tempdb / disk pressure**, and **server-level lock/wait contention** on the single container per shard — not logical cross-test DB name collision.

`DropCatalogIfExists` runs in synchronous `Dispose(bool disposing)`; whether `await using` always invokes that path under `WebApplicationFactory.DisposeAsync()` was **not verified at runtime** in this pass.

---

## 7. Background services started and stopped?

- `BaseIntegrationTestFixture` sets **`HostOptions.ShutdownTimeout = 15s`** and disables several teardown-blocking hosted loops (purge, reaper, OTLP, leader election) citing 75-minute blame-hang risk.
- Outbox hosted services (e.g. `RunExportBlobPushOutboxHostedService`) honor cancellation in their loop.
- **`GreenfieldSqlApiFactory` does not use** `IntegrationTestWebAppFactoryHostLifecycle` bounded dispose (2-minute cap) that was added to `AlertLifecycleWebAppFactory` for CI #2168/#2195.

---

## 8. Tests waiting for outbox drain with no hard timeout?

Not the integration-shard failure mode. The parallel idempotency test with explicit hang guards is **`Category=Slow`** and runs on the slow API shard, not the six integration shards (`Category!=Slow`).

---

## 9. 300-second SQL command timeouts and repeated ~5-minute stalls?

**Yes — consistent with observed pattern.**

From `GreenfieldSqlApiFactory` settings:

- `ArchLucid:Persistence:DefaultSqlCommandTimeoutSeconds` = **300**
- `ArchLucid:CreateRun:DistributedIdempotencyLockTimeoutMilliseconds` = **180000** (3 min)
- `AuthorityPipeline:PipelineTimeout` = **5 min**
- Per-POST HTTP client timeout aligned to greenfield burst budget

Under contention, operations can each approach these ceilings; many greenfield boots and create-run POSTs **stack** into multi-hour shard runtime.

---

## 10. SQL blocking, pool exhaustion, tempdb, deadlocks, container health?

**Not confirmed from #2224 timed-out shards** — diagnostics did not run on `canceled` jobs.

For shards **2/6 and 4/6**, SQL hang diagnostics **should exist in job logs** (failure path). Pending fetch.

---

## 11. Are existing diagnostics sufficient?

**No — for two reasons:**

1. **`if: failure()` excludes `canceled` timeout jobs.** Shards 3/6, 5/6, 6/6 got **zero** SQL session/blocking/tempdb/container evidence despite the action already implementing those queries.
2. **Post-mortem snapshot only** — cannot show which test/request was active when a stall **begins**; blame `Sequence` at job kill is often misleading.

Existing pieces **already present** (do not duplicate without checking):

- `--blame-hang --blame-hang-timeout 75min` via `Invoke-ApiIntegrationTestShard.ps1`
- TRX, vstest diag, integration shard manifest, blame Sequence artifact uploads
- `sqlserver-hang-diagnostics` composite action (active requests, blocked count, ArchLucid catalogs, tempdb, docker logs)
- `IntegrationTestDeadline`, `IntegrationTestHostStartup`, `IntegrationTestWebAppFactoryHostLifecycle` (AlertLifecycle / InMemory path)

---

## Hypotheses with confidence and evidence

### H1 — Per-test greenfield SQL boot + DbUp is the dominant time sink

**Confidence: High**

- **For:** `GreenfieldSqlApiFactory` runs full migration on every host boot; standalone `api-greenfield-boot` ~2m44s for one boot; shard 1 ~9 min vs others 100–240 min implies class distribution + stacked boots.
- **Against:** Would expect more uniform failure if every shard had similar greenfield density (shard manifests should be compared).

### H2 — Abandoned tests/hosts leak Session `sp_getapplock` and connections

**Confidence: Medium–High**

- **For:** `IntegrationTestDeadline.RunAsync` throws on timeout while inner `runTask` continues; lock is `@LockOwner='Session'` until connection closes; comments acknowledge abandoned worker threads.
- **Against:** Per-shard SQL container; `MaxPoolSize=200` on greenfield connection string.

### H3 — Unbounded `GreenfieldSqlApiFactory` dispose vs bounded AlertLifecycle dispose

**Confidence: Medium**

- **For:** Shards 2/4 hit 75-min blame (single-test inactivity); AlertLifecycle has 2-min bounded dispose; GreenfieldSql does not.
- **Against:** Needs #2224 blame dump naming the >75-min test on shards 2/4.

### H4 — Ephemeral DB drop not running → tempdb/disk pressure

**Confidence: Low–Medium**

- **For:** Drop only in `Dispose(bool)`; many catalogs per shard possible.
- **Against:** Not verified; would need SQL catalog list from diagnostics on failed shards.

---

## Smallest next experiment

**Goal:** produce evidence on the timeout path before code changes.

1. Change SQL hang diagnostics trigger to run on **timeout/cancel** as well as failure, e.g. `if: failure() || canceled()` or `if: always()` on that step only — **not a duplicate** of existing queries, just fixing the trigger.
2. **Or** run **one shard** (e.g. 5/6) with **`--blame-hang-timeout 20min`** so blame fires before the 240-minute ceiling and names the staller + hang dump.

Compare at stall time:

- `sp_getapplock` / blocking → supports H2
- No blocking, high CPU/migration → supports H1
- tempdb/version store growth → supports H4

---

## Files and artifacts to inspect next

| Item | Path / command |
|------|----------------|
| Workflow job matrix, timeouts, artifacts | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (~1985–2090) |
| Shard runner + blame flags | [`scripts/ci/Invoke-ApiIntegrationTestShard.ps1`](../../scripts/ci/Invoke-ApiIntegrationTestShard.ps1) |
| SQL diagnostics action | [`.github/actions/sqlserver-hang-diagnostics/action.yml`](../../.github/actions/sqlserver-hang-diagnostics/action.yml) |
| Greenfield factory + timeouts | [`ArchLucid.Api.Tests/GreenfieldSqlApiFactory.cs`](../../ArchLucid.Api.Tests/GreenfieldSqlApiFactory.cs) |
| Idempotency lock | [`ArchLucid.Persistence/Concurrency/SqlSessionDistributedCreateRunIdempotencyLock.cs`](../../ArchLucid.Persistence/Concurrency/SqlSessionDistributedCreateRunIdempotencyLock.cs) |
| Test deadline / abandoned task behavior | [`ArchLucid.Api.Tests/IntegrationTestDeadline.cs`](../../ArchLucid.Api.Tests/IntegrationTestDeadline.cs) |
| Bounded dispose (InMemory only) | [`ArchLucid.Api.Tests/IntegrationTestWebAppFactoryHostLifecycle.cs`](../../ArchLucid.Api.Tests/IntegrationTestWebAppFactoryHostLifecycle.cs) |
| Misleading blame test | [`ArchLucid.Api.Tests/AskThreadIntegrationTests.cs`](../../ArchLucid.Api.Tests/AskThreadIntegrationTests.cs) |
| #2224 blame artifacts | `dotnet-blame-api-integration-shard-{2,3,4,5}` |
| #2224 SQL diag (shards 2/4 only) | Job logs: “SQL Server hang diagnostics (on failure)” step |

---

## Recommended changes (after experiment — not applied in this doc)

1. **CI only (smallest, highest signal):** run `sqlserver-hang-diagnostics` on **`canceled`** timeout jobs.
2. **Defer** until evidence: bounded dispose on `GreenfieldSqlApiFactory`, reducing per-test greenfield boots, or widening timeouts (prior prompts warn against speculative timeout widening).

**Do not:** disable regression coverage to green CI; add duplicate diagnostics equivalent to existing action; assume local disk issues (this was GitHub CI).

---

## Answers to investigation questions (quick reference)

| # | Question | Answer |
|---|----------|--------|
| 1 | Which three shards timed out? | **3/6, 5/6, 6/6** (240 min cancelled) |
| 2 | Same or different areas? | **Same job/filter**; different class sets per shard |
| 3 | Last meaningful log line? | Blame points to **AskThread** (likely last in-flight); fetch #2224 logs for 2/4 |
| 4 | Common path? | **Greenfield SQL + create-run + pipeline + audit/outbox** |
| 5 | Common factor? | **SQL greenfield boot stack** (+ lock leak amplifier) |
| 6 | DB collision? | **No**; unique GUID DBs per factory; per-shard SQL container |
| 7 | Background services stopped? | **Mostly yes**; Greenfield dispose not bounded like AlertLifecycle |
| 8 | Outbox drain without timeout? | **Not** on these shards (Slow category elsewhere) |
| 9 | 300s timeouts → 5 min stalls? | **Yes**, pattern fits stacked bounded waits |
| 10 | Blocking/tempdb/deadlock evidence? | **Missing** on timed-out shards (diag gap) |
| 11 | Diagnostics sufficient? | **No** on cancel path; blame alone insufficient |
