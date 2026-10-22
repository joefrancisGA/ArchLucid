# CI chronic failure remediation (2026-06-24)

> **Scope:** Contributor / release-engineering diagnosis of multi-week CI redness (integration shard chunk watchdog timeouts, pre-corset guards, mock Playwright), fixes landed on **`master`** in commit **`f6ff02a31`**, and follow-up structural work still open.
>
> **Related:** [`CI_INTEGRATION_SHARD_TESTHOST_HANG_2026_06_23.md`](./CI_INTEGRATION_SHARD_TESTHOST_HANG_2026_06_23.md) (testhost shutdown wedge), [`CI_2224_INTEGRATION_SHARD_TIMEOUT_DIAGNOSIS_2026_06_16.md`](./CI_2224_INTEGRATION_SHARD_TIMEOUT_DIAGNOSIS_2026_06_16.md), [`CI_2268_INTEGRATION_SHARD_TIMEOUT_DIAGNOSIS_2026_06_20.md`](./CI_2268_INTEGRATION_SHARD_TIMEOUT_DIAGNOSIS_2026_06_20.md), [`../runbooks/CI_RELEASE_GATE.md`](../runbooks/CI_RELEASE_GATE.md), [`../library/TEST_EXECUTION_MODEL.md`](../library/TEST_EXECUTION_MODEL.md), [`../../archlucid-ui/docs/TESTING_AND_TROUBLESHOOTING.md`](../../archlucid-ui/docs/TESTING_AND_TROUBLESHOOTING.md).

## Sponsor summary

From late May through 2026-06-24, **full CI (`workflow_dispatch` on `master`) had not passed in 500+ consecutive runs**. Failures were **not a single regression** — they came from three independent categories:

| Category | Symptom | Tactical fix (2026-06-24) |
|----------|---------|---------------------------|
| **A — Pre-corset guards** | Python guard suite fails before .NET build | Addressed in prior commits on `master` (`915fb35fc`, `bdac6fe3a`, migration rename to `259_*`); re-verify with `bash scripts/ci/run_guards_pre_corset.sh` |
| **B — Integration shard chunk watchdog** | Five of six Api.Tests integration shards hit **20-minute chunk timeout** | Move five hanging test **classes** to **`Category=Slow`** (slow shard, longer budget) — commit **`f6ff02a31`** |
| **C — Mock Playwright** | `Operator UI: Playwright mock functional (mock API)` fails on branded 404, sponsor ROI export wait, audit screenshot gate | E2E spec / helper updates — commit **`f6ff02a31`** |

Structural fixes (bounded factory startup, bootstrap-budget wiring for execute/commit pipelines) remain **recommended** so those tests can safely return to the integration shard pool without relying on the Slow escape hatch alone.

---

## How to read CI logs (avoid false conclusions)

### Sticky `$shardFailed` flag

In `scripts/ci/Invoke-ApiIntegrationTestShard.ps1`, once any chunk fails, **`$shardFailed` stays true** for all subsequent chunks in that shard. Log lines like:

```text
[Shard 3/6: chunk 4/4] Chunk 4/4 finalized at … (failed: True)
```

do **not** prove chunk 4 failed — only that an **earlier** chunk in the same shard failed. Always inspect the chunk that hit the watchdog or the TRX for the failing test name.

### Chunk watchdog vs blame-hang

Each integration chunk runs under `scripts/ci/ApiIntegrationTestChunkWatchdog.ps1` with a default **`ChunkTimeout` of 20 minutes**. When the deadline is reached, the watchdog captures hang dumps, SQL diagnostics, and kills the `dotnet test` process tree.

This is **separate** from the in-process `--blame-hang` issue documented in [`CI_INTEGRATION_SHARD_TESTHOST_HANG_2026_06_23.md`](./CI_INTEGRATION_SHARD_TESTHOST_HANG_2026_06_23.md).

---

## Category B — Integration shard hangs

### Observed pattern (run `28108922709`, commit `e2c31707e`)

| Shard | Last chunk hang | Class at timeout |
|-------|-----------------|------------------|
| 1/6 | Chunk 4/4 | `ArchLucid.Api.Tests.Security.AuditTrailCommitIntegrityIntegrationTests` |
| 2/6 | — | **Passed** (no full-pipeline hang class in failing chunk) |
| 3/6 | Last chunk | `ArchLucid.Api.Tests.GreenfieldSqlBootIntegrationTests` |
| 4/6 | Last chunk | `ArchLucid.Api.Tests.Security.RbacBoundaryIntegrationTests` |
| 5/6 | Last chunk | `ArchLucid.Api.Tests.HostedAzureExtractorRunEndpointTests` |
| 6/6 | Last chunk | `ArchLucid.Api.Tests.Integrations.InboundWebhookHmacSignatureIntegrationTests` |

Each failing shard logged `Chunk watchdog timeout (00:20:00)` with **little or no stdout** from the hanging test — the process wedged before emitting useful test output.

### Root causes (by class type)

#### 1. Full execute → commit → poll pipeline without shard overload token

**Example:** `AuditTrailCommitIntegrityIntegrationTests`

- Calls `PostExecuteWithGreenfieldTransientRetryAsync` and `PostCommitWithGreenfieldTransientRetryAsync` with **`CancellationToken.None`** (default).
- Per-attempt budget inside those helpers is **`GreenfieldSqlArchitectureRequestBurstHttpTimeout` (15 minutes)**; failures are swallowed and retried (up to 10 / 25 attempts).
- The test's `catch (WarmupTimedOutException)` block is **dead code** — `WarmupTimedOutException` is only thrown from `RunUnderGreenfieldHostBootstrapBudgetAsync`, which is **not** on this call stack.
- Result: the test runs until the **external 20-minute chunk watchdog** kills the process.

**Relevant code:**

- `ArchLucid.Api.Tests/ArchitectureRequestConcurrencyTestSupport.cs` — burst timeouts, bootstrap budget (50 min), transient retry helpers
- `ArchLucid.Api.Tests/GreenfieldCommittedRunReadinessPoll.cs` — bounded polls (~34 s max for audit search)
- `ArchLucid.Api.Tests/GreenfieldSqlIntegrationWarmup.cs` — `ShardWarmupTimedOut`, `RecordAndReturnOnShardOverload` (CI shard 3/6 hang, run #2234)

#### 2. Unbounded greenfield factory startup

**Example:** `GreenfieldSqlBootIntegrationTests` (shard 3/6)

- `GreenfieldSqlApiFactory` has **no `IAsyncLifetime.InitializeAsync`**.
- `WebApplicationFactory` host starts lazily on first `CreateClient()`; DbUp migrations run with **no timeout** bound to the shard overload mechanism.
- Under CI SQL load (six parallel integration shards), startup can exceed the chunk watchdog.

#### 3. Other shard-specific classes

`RbacBoundaryIntegrationTests`, `HostedAzureExtractorRunEndpointTests`, and `InboundWebhookHmacSignatureIntegrationTests` were moved to Slow with the same tactical rationale: each was the **identified hanging class** in its shard's final chunk on the failing run above.

### Tactical fix — Slow shard relocation (`f6ff02a31`)

Added **`[Trait("Category", "Slow")]`** alongside existing **`[Trait("Category", "Integration")]`** on:

| File |
|------|
| `ArchLucid.Api.Tests/Security/AuditTrailCommitIntegrityIntegrationTests.cs` |
| `ArchLucid.Api.Tests/GreenfieldSqlBootIntegrationTests.cs` |
| `ArchLucid.Api.Tests/Security/RbacBoundaryIntegrationTests.cs` |
| `ArchLucid.Api.Tests/HostedAzureExtractorRunEndpointTests.cs` |
| `ArchLucid.Api.Tests/Integrations/InboundWebhookHmacSignatureIntegrationTests.cs` |

**Filter semantics:** Full regression runs integration shards with `Category=Integration&Category!=Slow`. Slow API/domain shards run `Category=Slow` with a longer blame-hang / job budget. Both traits must remain on these classes.

### Tactical fix — Slow shard relocation (2026-06-25, run `28157522256`)

Three additional Api.Tests integration shards failed on full CI after the `f6ff02a31` batch:

| Shard | Symptom | Class relocated |
|-------|---------|-----------------|
| 1/6 | Chunk 3/4 — 20-minute watchdog, zero test stdout | `ItsmOutboundIssuesWireMockEndpointIntegrationTests` (WireMock + SQL factory seed) |
| 4/6 | Chunk 3/4 — 20-minute watchdog; chunk filter led with `JwtLocalSigningIntegrationTests` | `JwtLocalSigningIntegrationTests` (`JwtLocalSigningWebAppFactory` startup under parallel SQL load) |
| 6/6 | `IntegrationTestDeadline` 150s exceeded (not external watchdog) | `PolicyPackRequestValidationTests` (`ArchLucidApiFactory`) |

Added **`[Trait("Category", "Slow")]`** on:

| File |
|------|
| `ArchLucid.Api.Tests/Integrations/ItsmOutboundIssuesWireMockEndpointIntegrationTests.cs` |
| `ArchLucid.Api.Tests/JwtLocalSigningIntegrationTests.cs` |
| `ArchLucid.Api.Tests/PolicyPackRequestValidationTests.cs` |

**Note:** Shard 4/6 chunk 3 contained eight classes; relocation targets the leading factory in the chunk filter (`JwtLocalSigningIntegrationTests`). If chunk 3 hangs recur, evaluate the remaining seven classes in that chunk (`OperatorSavedViewsIntegrationTests`, `PolicyPackExplainEndpointTests`, …) for the same Slow escape hatch.

### Structural follow-up (recommended)

| Priority | Work | Target |
|----------|------|--------|
| 1 | Implement **`IAsyncLifetime`** on `GreenfieldSqlApiFactory`; wrap first `CreateClient()` + `HealthReadyProbe.EnsureReadyAsync` in `RunUnderGreenfieldHostBootstrapBudgetAsync`; record `WarmupTimedOutException` via `GreenfieldSqlIntegrationWarmup` | Shard 3 factory startup hang |
| 2 | Wrap `AuditTrailCommitIntegrityIntegrationTests` (and similar) test bodies in `RunUnderGreenfieldHostBootstrapBudgetAsync`; pass **`ct`** into all execute/commit HTTP helpers | Dead `WarmupTimedOutException` catch blocks; 15 min × N retry loops |
| 3 | After structural fixes are verified green, **remove `Category=Slow`** from classes that no longer need the escape hatch | Restore integration shard coverage density |

Optional hardening: add a **timeout to `IntegrationTestStorageProviderHostGate.RunExclusiveAsync`** so gate waits cannot block indefinitely (identified in shard 3 analysis, run `28095984745`).

---

## Category A — Pre-corset guard failures

On run `28095984745` (commit `86bcbc4a`), **`CI: guards pre-corset (text)`** failed with:

| Failure | Detail |
|---------|--------|
| Migration numbering | Duplicate prefix **`250`**: `250_AgentExecutionTraces_…` and `250_SealCommittedRunHeader.sql` — fixed locally by renaming seal migration to **`259_SealCommittedRunHeader.sql`** (`fcff635ba`) |
| `test_tb_222_pilot_nav_link` | Missing `operate-operations-nav-group-builder.ts` — addressed in `915fb35fc` |
| `test_tb_194_admin_nav_link` | `/admin/rag-health` missing from admin nav builder — addressed in `915fb35fc` |
| `test_check_doc_links_exits_zero` | Four broken doc links — addressed in `915fb35fc` / `bdac6fe3a` |
| `test_live_repo_accessibility_guard_passes` | Stale accessibility route evidence — addressed in `e2c31707e` |

**Local verify:**

```bash
bash scripts/ci/run_guards_pre_corset.sh
```

---

## Category C — Mock Playwright failures

Job: **`Operator UI: Playwright mock functional (mock API)`** (`playwright.mock.config.ts`).

### Failure 1 — Branded 404 (`demo-readiness.spec.ts`)

- **Error:** `expect(page.getByTestId("branded-not-found")).toBeVisible()` — element not found / not visible.
- **Cause:** `OperatorBrandedNotFound` renders the marker as **`sr-only`** (`data-testid="branded-not-found"`). Playwright **`toBeVisible()`** requires visible layout; sr-only nodes fail that check even when the 404 page rendered correctly.
- **Fix (`f6ff02a31`):** `expectBrandedNotFoundSurface()` — assert visible heading *"We could not find that ArchLucid artifact"* plus **`toBeAttached()`** on the sr-only marker.

### Failure 2 — Sponsor ROI dashboard export wait (`sponsor-roi-dashboard.spec.ts`)

- **Error:** `page.waitForResponse: Timeout 60000ms exceeded` for `/v1/roi/sponsor-summary` and `/export`.
- **Cause:** Buyer-polished **`/dashboard`** uses portfolio layout; `ExecutiveRoiEnvironmentSavingsSection` (export fetch) mounts only **after** summary hydration (`hasCommittedReviews`). Waiting on network alone races cold CI agents. A prior fix (`86bcbc4aa`) added a **"Savings by environment"** visibility wait; **`76439bb8b`** removed it — regression.
- **Fix (`f6ff02a31`):** Restored scroll + **`expect(…"Savings by environment").toBeVisible()`** after summary response wait in `e2e/helpers/sponsor-roi-dashboard.ts`.
- **Mock payloads:** `e2e/fixtures/sponsor-roi-dashboard-mock.ts` via `e2e/screenshot-mock-fallback.ts` and `e2e/mock-archlucid-api-server.ts`.

### Failure 3 — Audit screenshot gate (`capture-all-screenshots.spec.ts`)

- **Error:** `assertPageFreeOfScreenshotDemoFailures` — 90 s poll timeout on `/audit`.
- **Cause:** Buyer-polished audit tucks search behind collapsible filters; auto-prime can race initial `runSearch()` on cold agents. Summary stays at **"Showing 0 events"** until search resolves.
- **Fix (`f6ff02a31`):** `auditScreenshotHasPopulatedResults()` — accept summary rows, timeline cards, or buyer sample timeline chip + retry priming in `e2e/screenshot-demo-quality-gates.ts`.

**Local verify (mock Playwright):**

```powershell
cd archlucid-ui
npx playwright install --with-deps chromium
npx playwright test -c playwright.mock.config.ts e2e/demo-readiness.spec.ts e2e/sponsor-roi-dashboard.spec.ts
```

---

## CI run triggered for verification

After **`f6ff02a31`**:

- **Workflow:** `CI` — `workflow_dispatch` on `master`
- **Example run:** [Actions run 28118218375](https://github.com/joefrancisGA/ArchLucid/actions/runs/28118218375)

**Trigger full CI manually:**

```bash
gh workflow run ci.yml --ref master
```

Note: **`ci.yml`** runs full regression on **`workflow_dispatch`** and **`pull_request`** — not on ordinary **`push`** to `master`.

---

## Debugging artifacts (integration shards)

When a chunk hits the watchdog, download from the failing job:

| Artifact | Contents |
|----------|----------|
| `chunk-console-api-integration-shard-<n>` | Per-chunk stdout/stderr |
| `dotnet-trx-full-core-api-integration-shard-<n>` | TRX results |
| `vstest-diag-api-integration-shard-<n>` | VSTest diagnostics |
| `dotnet-hang-dump-api-integration-shard-<n>` | Hang dumps (when captured) |

**Useful log grep patterns:**

```text
Chunk watchdog timeout
Starting chunk
finalized at
FullyQualifiedName~
```

---

## Change log

| Date | Commit | Summary |
|------|--------|---------|
| 2026-06-24 | `f6ff02a31` | Slow shard relocation for five Api.Tests classes; Playwright branded-404, sponsor ROI, audit screenshot fixes |
| 2026-06-24 | `915fb35fc` | Pre-corset nav drift + doc link fixes |
| 2026-06-24 | `fcff635ba` | Rename duplicate migration `250_SealCommittedRunHeader` → `259_*` |
| 2026-06-23 | (see linked doc) | Remove in-process `--blame-hang` from chunk runner; testhost shutdown wedge |

---

## Open items

- [ ] Confirm **`28118218375`** (or latest `workflow_dispatch`) is green end-to-end.
- [ ] Implement **`GreenfieldSqlApiFactory` `IAsyncLifetime`** bounded startup (structural).
- [ ] Wire **`RunUnderGreenfieldHostBootstrapBudgetAsync`** through execute/commit integration tests (structural).
- [ ] Re-evaluate **`Category=Slow`** on relocated classes after structural fixes land.
- [ ] **`CodeQL (javascript)`** and other non-mock jobs — track separately if still red after this batch.
