# Fix: CI run 27284193311 — all failing jobs (branch `ci/fix-idempotency-concurrency-hang-guard`)

## Overview

CI run **27284193311** on branch `ci/fix-idempotency-concurrency-hang-guard` has five failing jobs producing
seven distinct errors. Fix them in the order listed below — each section is independent except where noted.

---

## Failure 1 — `Operator UI: unit (Vitest)` · 5 tests in `BuyerCtoDemoTourOverlay.test.tsx`

### Symptom

```
[vitest] No "isNextPublicDemoMode" export is defined on the "@/lib/demo-ui-env" mock.
Did you forget to return it from "vi.mock"?
```

All five tests in `BuyerCtoDemoTourOverlay.test.tsx > BuyerCtoDemoTourOverlay` fail with this error.

### Root cause

`archlucid-ui/src/lib/demo-ui-env.ts` was recently modified to add the `isNextPublicDemoMode()` export
(line 18-20). The `BuyerCtoDemoTourOverlay` component now calls it at runtime, but the `vi.mock` for
`@/lib/demo-ui-env` in the test file only returns `{ isBuyerPolishedOperatorShellEnv: () => true }` and
omits `isNextPublicDemoMode`.

Vitest strict-mock mode requires every imported export to appear in the factory return.

### Fix

**File:** `archlucid-ui/src/components/BuyerCtoDemoTourOverlay.test.tsx`

Add `isNextPublicDemoMode: () => false` to the mock factory at the `vi.mock("@/lib/demo-ui-env", ...)` call
(currently lines 16–18):

```typescript
vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
  isNextPublicDemoMode: () => false,
}));
```

If `BuyerCtoDemoTourOverlay` also reads any other export from `demo-ui-env.ts` (e.g.
`isBuyerSafeDemoMarketingChromeEnv`, `isDemoStrictNavigationRedirectsActive`,
`isDemoStrictNavigationRedirectsBypassedForE2E`, `isCompareRouteBlockedUnderDemoStrictShell`,
`isOperatorExperienceFullShellEnv`) that are not yet in the mock, add them with sensible defaults
(`() => false`) so the factory is complete.

### Acceptance criteria

1. `src/components/BuyerCtoDemoTourOverlay.test.tsx` — all 5 previously failing tests pass.
2. No other test file is broken by the change.
3. `npm run typecheck` (or the project's Vitest typecheck pass) reports no errors in the file.

---

## Failure 2 — `CI: guards pre-corset (text)` · `assert_route_tier_policy_nav`

### Symptom

```
assert_route_tier_policy_nav failures:
  - Roi/RoiController.cs: nav_operator_href '/dashboard' not found in *nav-group-builder.ts
    (UI visibility is not authorization; link must exist for operator shell parity)
```

### Root cause

`scripts/ci/assert_route_tier_policy_nav.py` → `parse_nav_hrefs()` uses the regex:

```python
re.finditer(r'href:\s*"([^"]+)"', text)
```

This only matches a **direct string literal** assignment: `href: "/dashboard"`.

In `archlucid-ui/src/lib/pilot-nav-group-builder.ts` (line 43), the href is now in a ternary:

```typescript
href: isCtoDemoPresenterSafeModeEnv() ? getShowcaseExecutiveHref() : "/dashboard",
```

The regex cannot see `"/dashboard"` because `href:` is not immediately followed by a quoted string.
The result: `nav_hrefs` does not contain `/dashboard`, causing the guard to fail.

### Fix

**File:** `scripts/ci/assert_route_tier_policy_nav.py` — `parse_nav_hrefs` function (lines 137–143)

Change the regex to capture any string literal that appears **on the same line as** an `href:` property,
including the false-branch of ternaries:

```python
def parse_nav_hrefs(ui_nav_dir: Path) -> set[str]:
    hrefs: set[str] = set()
    for path in ui_nav_dir.glob("*nav-group-builder.ts"):
        text = path.read_text(encoding="utf-8")
        for line in text.splitlines():
            if "href:" not in line:
                continue
            for m in re.finditer(r'"(/[^"]+)"', line):
                hrefs.add(m.group(1))
    return hrefs
```

This collects every `"/..."`-shaped string literal on any line that contains `href:`, which covers:
- `href: "/dashboard"` (direct literal — existing pattern)
- `href: expr ? getShowcaseExecutiveHref() : "/dashboard"` (ternary false-branch)
- Multi-ternary patterns as long as they stay on one line

The change is **read-only** with respect to CI semantics: it only adds hrefs that were previously missed
due to the ternary.  No overrides or registry changes are needed after this fix.

### Acceptance criteria

1. `python scripts/ci/assert_route_tier_policy_nav.py` exits 0 on the current branch.
2. `/dashboard` is now in the set returned by `parse_nav_hrefs` when called on `archlucid-ui/src/lib/`.
3. No other controller's `nav_operator_href` entries are falsely added or removed by the new pattern
   (verify with `python scripts/ci/assert_route_tier_policy_nav.py --sync` — should show no changes to
   the registry or matrix appendix).

---

## Failure 3 — `.NET integration shards 2/6, 3/6, 4/6` · 75-minute blame hang

### Symptom

Three shards each run for exactly 75 minutes and are then killed by the blame hang collector:

```
Data collector 'Blame' message: The specified inactivity time of 75 minutes has elapsed.
Collecting hang dumps from testhost and its child processes.
```

The test reported by blame as the last-running test when each shard was killed:

| Shard | Last running test (blame — not definitive) |
|-------|---------------------------------------------|
| 2/6 | `RetrievalQuerySmokeIntegrationTests.Index_documents_then_query_returns_matching_hits` |
| 3/6 | `AskThreadIntegrationTests.Ask_without_runId_or_threadId_returns_bad_request` |
| 4/6 | `ArchitectureFindingAskControllerIntegrationTests.AskAboutFinding_returns_bad_request_when_question_missing` |

All three tests involve the **Ask / Retrieval** subsystem. They are integration tests that call the API
with SQL and may await an HTTP call to an AI or retrieval back-end without a bounded test-level timeout.

### Root cause

The blame tool names the *last* test that was running when the dump was taken — it may be a victim of
a stuck predecessor, not the root hang itself. The common thread across all three shards is the Ask /
Retrieval subsystem: tests in this area issue outbound HTTP calls (or wait on a mocked response queue)
without a short per-test cancellation deadline.

The branch under review (`ci/fix-idempotency-concurrency-hang-guard`) added hang guards to
`CreateRunIdempotencyConcurrencyIntegrationTests` but did not address the Ask/Retrieval integration
test group.

### Investigation steps (read-only first)

1. Open each test class and check whether the test method (or its base/helper) accepts a
   `CancellationToken` and whether that token has a test-level timeout set.
2. Check whether `RetrievalQuerySmokeIntegrationTests`, `AskThreadIntegrationTests`, and
   `ArchitectureFindingAskControllerIntegrationTests` share a common `IntegrationTestBase` or factory
   method. If so, a single per-class timeout constant is enough.
3. Confirm whether the hung HTTP call is going to a live external endpoint (Azure OpenAI, AI Search) or
   to an in-process mock. If live, the CI environment may lack those credentials, causing the call to
   block indefinitely on a TCP timeout.
4. Check `GreenfieldSqlIntegrationWarmup` for the `SkipShardOverload()` skip pattern used in
   `fix-audit-trail-warmup-timeout-ci.md` — it may be applicable here too.

### Fix

**Primary approach — per-test timeout:**

For each of the three test classes (`RetrievalQuerySmokeIntegrationTests`,
`AskThreadIntegrationTests`, `ArchitectureFindingAskControllerIntegrationTests`), add a test-level
`CancellationTokenSource` with a timeout of **90 seconds** (or match the pattern used by fast-path Ask
tests in the same project):

```csharp
using CancellationTokenSource cts = new(TimeSpan.FromSeconds(90));
// ... pass cts.Token to the API call / HttpClient
```

If a shared base class / factory method already threads a `CancellationToken` through, set the timeout
there instead to avoid duplication.

**Secondary approach — skip on shard overload:**

If the hang is caused by SQL/warmup overload rather than a missing timeout, apply the
`GreenfieldSqlIntegrationWarmup.SkipShardOverload()` check at the start of each test class fixture
(same pattern as `fix-audit-trail-warmup-timeout-ci.md`).

**Do not** raise the `--blame-hang-timeout` in CI — the current 75-minute limit is already generous;
raising it only defers the underlying hang.

### Acceptance criteria

1. Each of the three test classes completes (pass or explicitly skip) in under 5 minutes per test.
2. No test silently swallows an `OperationCanceledException` — either let it surface as a test failure
   or convert to a `Assert.Inconclusive` / skip with a descriptive reason.
3. `ArchLucid.Backend.slnf` compile check passes.
4. No product/API code changes — test harness timing only.

---

## Failure 4 — `DemoSeedServiceTests` (shard 4/6) · two assertion failures

### Symptom

```
Failed ArchLucid.Api.Tests.DemoSeedServiceTests.SeedAsync_creates_baseline_and_hardened_runs_with_manifests [601 ms]
  Expected baseline.Results not to be empty.

Failed ArchLucid.Api.Tests.DemoSeedServiceTests.SeedAsync_agent_result_compare_produces_deltas [556 ms]
  Expected diff.AgentDeltas not to be empty.
```

### Root cause (hypothesis — confirm with read-only inspection)

Changes on this branch to the idempotency / concurrency path (post-`cd73860ba`) may have altered how
`SeedAsync` creates runs — specifically, the resolution phase that populates `Results` and
`AgentDeltas`.  If `SeedAsync` now relies on the new idempotency guard timing, a fast-path race could
cause those collections to be empty when the assertions run.

### Investigation steps

1. Read `ArchLucid.Api.Tests/DemoSeedServiceTests.cs` and find both test methods.
2. Check whether `SeedAsync` internally calls `CreateRun` with an idempotency key — if so, confirm the
   idempotency guard changes on this branch did not alter the synchronous seeding contract.
3. Confirm `baseline.Results` and `diff.AgentDeltas` are populated by a downstream step that completes
   before `SeedAsync` returns. Look for any newly-added `await` or `Task.Run` that might fire-and-forget.
4. Check whether the failing assertions were introduced by this branch or pre-existing (use
   `git log --oneline ArchLucid.Api.Tests/DemoSeedServiceTests.cs`).

### Fix

After investigation, apply the **smallest** fix:

- If `SeedAsync` is missing an `await` for results hydration after the idempotency guard refactor,
  re-add it.
- If the test assertions are newly too strict (e.g. empty results are valid for a baseline-only seed
  under certain run configs), relax the assertion to match the intended semantic.
- If the failure is a race (results are seeded asynchronously), add an explicit wait / retry in the
  test before asserting.

### Acceptance criteria

1. Both `DemoSeedServiceTests` tests pass.
2. `SeedAsync` still creates a baseline run with at least one result and a compare with at least one
   agent delta under the seeded demo data fixture.
3. No product behavior change — test/seed harness only.

---

## Execution order

Recommended sequence (each fix is independent unless noted):

1. **Failure 1** (Vitest mock) — trivial 2-line change; fixes the fastest CI job.
2. **Failure 2** (nav guard regex) — 10-line change in one Python file.
3. **Failure 4** (DemoSeedServiceTests) — investigate first; fix may reveal branch regression.
4. **Failure 3** (hang guards) — most investigation needed; fix after #4 in case they share a root cause.

## Verification

After all fixes:

```powershell
# UI type-check + unit tests (fast — no SQL)
.\scripts\ci\agent-compile-check.ps1 -Ui

# Nav guard
python scripts/ci/assert_route_tier_policy_nav.py

# .NET scope compile
.\scripts\ci\agent-compile-check.ps1 -ProjectPath "ArchLucid.Backend.slnf"
```

Do **not** run the full slow-shard SQL tests locally unless the user explicitly requests it.

## Related

- Prior fix: `.cursor/prompts/fix-idempotency-concurrency-resolution-timeout-ci.md` (burst/resolution split)
- Skip pattern: `.cursor/prompts/fix-audit-trail-warmup-timeout-ci.md` (SkipShardOverload)
- Nav matrix: `docs/library/ROUTE_TIER_POLICY_NAV_MATRIX.md`
- Overrides: `scripts/ci/data/route_tier_policy_nav_overrides.json`
