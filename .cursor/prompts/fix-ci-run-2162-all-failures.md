# Fix: CI run 27446727186 (#2162) — all failing checks

> Branch: `ci/fix-idempotency-concurrency-hang-guard`. Run #2162 (commit `023dc725`) failed **3**
> jobs. Two are a recurrence of the Ask-host integration hang already diagnosed in
> `.cursor/prompts/fix-ci-run-2138-ask-host-lifecycle-hang.md` (same two tests, still unfixed). One
> is a fresh batch of Operator UI Vitest failures from the buyer-adoption UX churn plus one genuine
> runtime bug. Read "Evidence" under each concern before changing anything — do not re-diagnose from
> scratch.

## Failing jobs (run id `27446727186`)

| # | Job | Failed step | Class of failure |
|---|-----|-------------|------------------|
| A | `Operator UI: unit (Vitest)` | Install & run unit tests | 4 failed test files + 1 unhandled rejection |
| B | `.NET: full regression — Api.Tests integration shard 3/6 (SQL)` (matrix `shard=2`) | Test — ArchLucid.Api.Tests (Integration shard) | 75-min blame-hang abort |
| C | `.NET: full regression — Api.Tests integration shard 4/6 (SQL)` (matrix `shard=3`) | Test — ArchLucid.Api.Tests (Integration shard) | 75-min blame-hang abort |

All three are independent; fix A as a self-contained change and B+C together.

---

## Concern A — Operator UI Vitest: 4 failing files + 1 unhandled error

`Test Files 4 failed | 607 passed (611)` · `Tests 4 failed | 2315 passed (2319)` · `Errors 1 error`.

Three of these are **stale tests** left behind by the buyer-adoption UX commits
(`42c2e3170 feat(ui): UX/IA improvements…`, `deeb8c14a Reduce enterprise buyer adoption friction…`):
the shipped UI copy/labels/CTAs changed but the assertions were not updated. **One is a genuine
runtime bug** that must be fixed in product code, not the test.

For each stale test, confirm the current source copy is the **intended** buyer-polished wording
(it lines up with the surrounding `buyerPolished` branches and the centralized label/copy modules) —
then update the assertion to match. Do not "fix" by reverting intentional UX copy.

### A1 — GENUINE BUG: `teamChecklist.some is not a function` (the `1 error`)

```
TypeError: teamChecklist.some is not a function
 ❯ load src/components/usability/InProductEvidenceChecklist.tsx:46:41
This error originated in "src/app/(operator)/operator-client-pages-render-gate.test.tsx"
```

- `src/components/usability/InProductEvidenceChecklist.tsx` line 32–46 does
  `fetchCorePilotTeamChecklist().catch(() => [])` then `teamChecklist.some(...)` (lines 46 and 73).
- `fetchCorePilotTeamChecklist()` is typed `Promise<CorePilotChecklistStepDto[]>`
  (`src/lib/api/tenant-customer-success.ts:61`), but on the **success** path it returns whatever
  `apiGet` yields. The render-gate test's generic fetch mock resolves a **non-array** body, so
  `.some` throws an **unhandled rejection** (Vitest flags it as a run error → red build).
- Fix in the component (honors the "Always check nulls" rule and hardens against malformed API
  bodies): coerce to an array before `.some`, e.g.
  `const steps = Array.isArray(teamChecklist) ? teamChecklist : [];` and use `steps` for both
  `.some(...)` calls. This is the only **product-code** change in Concern A.
- Add/extend a unit test asserting the component renders without throwing when
  `fetchCorePilotTeamChecklist` resolves a non-array (regression guard).

### A2 — STALE: `src/components/SidebarNav.test.tsx`

`shows compact Review work group by default…` expects `getByRole("link", { name: "Review packages" })`
but the nav now renders **"Architecture reviews"**.

- Source of truth: `OPERATOR_NAV_LINK_LABELS.reviewPackage = "Architecture reviews"`
  (`src/lib/i18n.ts:111`), consumed in `src/lib/pilot-nav-group-builder.ts:52`.
- Fix: update the test to assert the `OPERATOR_NAV_LINK_LABELS.reviewPackage` value (prefer importing
  the constant over hard-coding the string, so the next rename does not re-break it).

### A3 — STALE: `src/app/(operator)/page.test.tsx`

`HomePage (55R smoke — landing) > renders Reviews panel, maturity layer cards, and workflow panel`
fails with `Found multiple elements with the role "link" and name "Open the example review package"`.

- The home page now renders **two** links named "Open the example review package" (a text link with
  `data-testid="pilot-command-center-example"` and a button-styled CTA, both → `/reviews/claims-intake-modernization`).
- Fix: scope the assertion to the intended one (`getByTestId("pilot-command-center-example")`) or use
  `getAllByRole(...)` and assert the expected count/`href`. Confirm two CTAs is intended (it matches
  the buyer command-center design); if so, the test — not the page — is wrong.

### A4 — STALE: `src/components/operator-home/RunsDashboardPanel.test.tsx`

`shows empty state when there are no runs` expects text `/Import your Azure environment to get started/i`.
That string now exists **only in the test** — the empty-state copy was changed in the source.

- Fix: update the assertion to the current empty-state copy rendered by `RunsDashboardPanel.tsx`
  (and the empty-state preset module it pulls from). Verify against the rendered output, not a guess.

### A5 — STALE: `src/app/(operator)/reviews/RunsListClient.test.tsx`

`buyer-polished: uses finalized section heading and scope chips` expects a heading
`/finalized review packages/i`; the source heading is now **"Finalized architecture reviews"**
(`RunsListClient.tsx:646`). The same test also trips the "multiple Open the example review package"
matcher.

- Fix: update the heading assertion to "Finalized architecture reviews" and resolve the duplicate-link
  matcher the same way as A3.

### Concern A acceptance criteria

1. `InProductEvidenceChecklist` never throws on a non-array checklist body; new regression test added.
2. The 4 stale tests assert the **shipped** buyer-polished copy/labels (prefer referencing the
   centralized label/copy constants over duplicating literals).
3. From `archlucid-ui/`: the affected files pass —
   `npm run test -- src/app/\(operator\)/operator-client-pages-render-gate.test.tsx src/components/SidebarNav.test.tsx "src/app/(operator)/page.test.tsx" src/components/operator-home/RunsDashboardPanel.test.tsx "src/app/(operator)/reviews/RunsListClient.test.tsx"`
   (adjust quoting for the parenthesized App Router paths). `Test Files`/`Tests` report **0 failed**
   and **0 errors**.
4. No product behavior change beyond the A1 array guard.

---

## Concern B + C — Api.Tests integration shards 3/6 and 4/6 blame-hang (recurrence of #2138)

### Evidence (do not re-diagnose — this is the same hang as #2138)

Both shards aborted at the **75-minute** `--blame-hang-timeout` ceiling
(`scripts/ci/Invoke-ApiIntegrationTestShard.ps1`), and the blame collector named the same two tests
as in run #2138:

| Job (matrix) | Last-running test (`Completed="False"`) | Factory |
|--------------|------------------------------------------|---------|
| shard 4/6 (`shard=3`) | `ArchLucid.Api.Tests.ArchitectureFindingAskControllerIntegrationTests.AskAboutFinding_returns_bad_request_when_question_missing` (46 passed in 21s, then host sat idle 75 min) | `AlertLifecycleWebAppFactory` (InMemory) |
| shard 3/6 (`shard=2`) | `ArchLucid.Api.Tests.AskThreadIntegrationTests.Ask_with_seeded_run_returns_answer_and_creates_thread` (69 passed/2 skipped over 1h41m, then aborted) | `AlertLifecycleWebAppFactory` (InMemory) |

`AskAboutFinding_returns_bad_request_when_question_missing` is a pure 400-validation test that never
reaches the LLM/retrieval pipeline, and every HTTP/seed call is already bound by a 90s token
(`IntegrationTestHttpCancellation`). So — exactly as concluded in #2138 — the hang is **outside** the
bounded HTTP call: the **unbounded `WebApplicationFactory` host start / `await using` dispose** of
`AlertLifecycleWebAppFactory`. Under heavy parallel CI load the last-scheduled InMemory-factory test
in each shard tips over when an `IHostedService` blocks `StartAsync`/`StopAsync`.

### What changed since #2138 (so you do not redo landed work)

The #2138 fixes that **did** land:
- `BaseIntegrationTestFixture.cs` now also disables exemplar-corpus startup indexing
  (`Retrieval:ExemplarCorpus:IndexOnStartup=false`, line 72) and trial preseed
  (`TrialArchitecturePreseedOptions…Enabled=false`, line 83), on top of PlatformDocs/PolicyPack,
  Demo, ServiceBus, OTLP/console, leader election, and the purge/reaper loops.
- `scripts/ci/Invoke-ApiIntegrationTestShard.ps1` now passes `--blame-hang-dump-type mini` (line 113),
  so **#2162 captured managed mini dumps** (e.g. `dotnet_5163_…_hangdump.dmp` on shard 4) — evidence
  #2138 did not have. **Use them** (see Step 1).

The #2138 fixes that **did NOT land** (still open, almost certainly why this recurs):
- **The root-cause hosted service was never identified/fixed** — the hang repeats on the same tests.
- **`AlertLifecycleWebAppFactory` still has no bounded dispose guard** (Step 3 of #2138). It is a thin
  subclass of `BaseIntegrationTestFixture` with no `DisposeAsync` override
  (`ArchLucid.Api.Tests/AlertLifecycleWebAppFactory.cs`).

### Step 1 — analyze the captured mini dumps (new for #2162; do this first)

Download the blame artifacts from run `27446727186` and open the `*_hangdump.dmp` to get the managed
stack of the wedged thread (this is exactly what #2138 lacked):

```powershell
gh run download 27446727186 --dir ./_ci2162 --pattern "dotnet-blame-api-integration-shard-2" --pattern "dotnet-blame-api-integration-shard-3"
```

Open each `.dmp` (VS / `dotnet-dump analyze` → `clrstack -all`, look for a thread parked in an
`IHostedService.StartAsync`/`StopAsync`/`ExecuteAsync` or a `.Wait()`/`.Result`/`GetAwaiter().GetResult()`
on the host build/dispose path). Also read the `vstest-diag-api-integration-shard-{2,3}` logs. The dump
should name the offending service directly — fix that service rather than guessing.

If for any reason the dumps are unusable, reproduce locally (these classes are InMemory — **no SQL**):

```powershell
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj -c Release `
    --filter 'FullyQualifiedName~AskThreadIntegrationTests|FullyQualifiedName~ArchitectureFindingAskControllerIntegrationTests' `
    --blame-hang --blame-hang-timeout 3min --blame-hang-dump-type mini
```

### Step 2 — fix the blocking hosted service

From the dump, identify the `IHostedService` active under **InMemory** that blocks startup/shutdown
and is **not** already disabled by `BaseIntegrationTestFixture`. Highest-probability culprits are the
retrieval/embedding startup services the Ask feature depends on, registered in
`ArchLucid.Host.Composition/.../ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs`
(e.g. `RetrievalEmbeddingDriftStartupValidator`, the corpus startup indexers — confirm their
`IndexOnStartup=false` flags truly short-circuit `StartAsync` and that they honor the stopping token
while waiting). Also check anything doing inline async work in `StartAsync`.

For the offender: make `StartAsync` return promptly (do work in the background loop, not inline) and
make `ExecuteAsync`/`StopAsync` honor `stoppingToken` / the host shutdown token so
`HostOptions.ShutdownTimeout = 15s` (`BaseIntegrationTestFixture.cs:94`) can release it. Follow the
already-token-correct `BackgroundService` implementations under `ArchLucid.Host.Core/Hosted/`. If the
service is genuinely startup-critical, disable it for integration hosts via a config key the same way
the base fixture disables the others. Any product-code change must keep cancellation honored without
changing API behavior.

### Step 3 — defensive bounded-lifecycle guard (Step 3 of #2138, still not done)

So no single host start/dispose can ever burn the 75-min blame budget again, add a bounded guard to
`AlertLifecycleWebAppFactory` (ideally a shared helper reused by the other InMemory factories):

- Override `DisposeAsync` to run `base.DisposeAsync()` under a hard deadline
  (`Task.WhenAny(base.DisposeAsync().AsTask(), Task.Delay(timeout))`); if the deadline wins, log a
  diagnostic naming the factory so a future hang is attributable in seconds, not 75 minutes.
- Reuse the `IntegrationTestHttpCancellation` timeout constant (no new magic number); keep it well
  under 75 min (2–3 min — InMemory start/dispose should take seconds).
- Note: a truly wedged `Dispose` cannot be force-aborted on a background thread — Step 2 is the real
  fix; Step 3 converts any future regression into a fast, named failure.

### Concern B + C acceptance criteria

1. All 5 `AskThreadIntegrationTests` and all `ArchitectureFindingAskControllerIntegrationTests`
   complete (pass or assertion-fail — never hang). Host start and `await using` dispose of
   `AlertLifecycleWebAppFactory` return within seconds.
2. The offending `IHostedService` honors its stopping/shutdown token (or is disabled for integration
   hosts); host shutdown completes within `HostOptions.ShutdownTimeout` (15s).
3. Shards 3/6 and 4/6 finish within the 75-min blame budget; no `Sequence_*.xml` with
   `Completed="False"`. Do **not** raise the 75-min `--blame-hang-timeout`.
4. No product/API behavior change beyond making a hosted service honor cancellation.
5. `ArchLucid.Backend.slnf` compile check passes
   (`.\scripts\ci\agent-compile-check.ps1 -ProjectPath "ArchLucid.Backend.slnf"`).

### Verification (read-only — do not run the full shard suite)

- Run only the two Ask classes locally per Step 1; confirm clean, fast start/dispose and shutdown
  within 15s.
- `Grep` the chosen hosted service for `stoppingToken` / `StopAsync` to confirm token propagation.

---

## Reference artifacts (CI #2162, run id `27446727186`)

- Blame dumps (managed mini, name hung test + stack): `dotnet-blame-api-integration-shard-2`,
  `dotnet-blame-api-integration-shard-3`
- Shard class manifests: `integration-shard-manifest-2`, `integration-shard-manifest-3`
- vstest diag logs: `vstest-diag-api-integration-shard-2`, `vstest-diag-api-integration-shard-3`

## Related

- `.cursor/prompts/fix-ci-run-2138-ask-host-lifecycle-hang.md` (same two tests; this prompt carries
  its unfinished Step 2 + Step 3 forward, now with mini dumps)
- `.cursor/prompts/fix-idempotency-concurrency-resolution-timeout-ci.md` (separate slow-shard burst)
- CI workflow: `.github/workflows/ci.yml` (`dotnet-full-regression-core-api-integration`,
  `timeout-minutes: 240`, `-BlameHangTimeout 75min`)
