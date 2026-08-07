# Fix: post-generation architecture package fails to open — `workspace-mismatch` false positive

> Diagnosed 2026-07-07 from a screenshot of the architect workspace (`Claims Intake Demo` workspace, local
> dev) showing:
>
> - Page title: **"Architecture review — package could not be opened"** / **"We could not open the
>   review that was just generated"**
> - Body: *"The review exists but is not visible in the current workspace. Confirm the workspace
>   selector matches where the review was created."*
> - Diagnostics panel: `Attempted route: /reviews/c85c9b3ffb2342878f669f8cf2c3c5eb`, `Workspace ID:
>   22222222-2222-2222-2222-222222222222`, `Project ID: 33333333-3333-3333-3333-333333333333`,
>   `Failure kind: workspace-mismatch`.
>
> This prompt documents a **confirmed, fully-traced root cause** found by static code reading (not
> guessed) — **do not re-diagnose from scratch**; verify Step 0, then implement Step 1–3.

## Symptom

Any review generated through the normal architect-workspace wizard (Quick review / Socratic intake / etc.) and
then opened via the post-generation redirect (`/reviews/{runId}?fromGeneration=1`) shows the
`workspace-mismatch` failure screen instead of the review, **even when the user never changed
workspaces** between generating and opening it. `Workspace ID` / `Project ID` in the diagnostics panel
match `archlucid-ui/src/lib/scope.ts`'s `DEV_SCOPE_WORKSPACE_ID` / `DEV_SCOPE_PROJECT_ID` exactly —
i.e. this reproduces under the plain local-dev default scope, with no scope switcher involved. This
predicts the bug fires for **every** freshly generated review, not an edge case.

## Root cause (fully traced, cited below — this is a wrong-field comparison bug, not a scope/cookie bug)

The `workspace-mismatch` check is a deliberate defense-in-depth IDOR guard added by **TB-077**
("Architect workspace resource ownership checks" — backlog title may still say Operator UI; shipped 2026-06-01):

```155:161:archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/load-run-detail-page-model.ts
  if (
    !isPinnedDemoWorkspaceRunId(runId)
    && !isShowcaseStaticDemoRunId(runId)
    && !runProjectMatchesEffectiveScope(resolvedDetail.run.projectId, effectiveProjectId)
  ) {
    return { kind: "not-found", reason: "workspace-mismatch" };
  }
```

`runProjectMatchesEffectiveScope` (`archlucid-ui/src/lib/operator-resource-scope.ts`) does a simple
case-insensitive string-equality check. The bug: **`resolvedDetail.run.projectId` is bound to the wrong
backend field.** It is *not* the tenant/workspace/project scoping GUID — it is an unrelated
human-readable "project slug" that will essentially never equal the scope GUID header for a real run.

### The two distinct fields on `RunRecord` (this is intentional in the domain model, documented inline)

```19:32:ArchLucid.Core/Persistence/ApplicationPorts/Models/RunRecord.cs
    /// <summary>Scoped solution/project boundary (GUID). Distinct from <see cref="ProjectId" /> slug.</summary>
    public Guid ScopeProjectId
    ...
    public string ProjectId
```

- **`ScopeProjectId`** (`Guid`) — the real tenant/workspace/project isolation boundary. Used everywhere
  in SQL for scoping (`ArchLucid.Persistence/Repositories/SqlRunRepository.cs`, `RunListSql.cs`,
  `HotPathRelationalQueryShapes.cs`, etc. — dozens of `WHERE ScopeProjectId = @ScopeProjectId`
  predicates). This is what `x-project-id` / `effectiveProjectId` in the UI actually represents.
- **`ProjectId`** (`string`) — a "project slug" used for **context-ingestion grouping/reuse** (finding
  the most recent `ContextSnapshot` for the same system-under-review), populated from the request's
  free-text system name:

```6:19:ArchLucid.ContextIngestion/Mapping/ContextIngestionRequestMapper.cs
///     <see cref="ArchitectureRequest.SystemName" /> becomes <see cref="ContextIngestionRequest.ProjectId" />.
...
            ProjectId = request.SystemName,
```

The inline Authority pipeline (which runs synchronously during non-deferred `POST
/v1/architecture/request` — confirmed by CI log evidence in
`.cursor/prompts/fix-ci-run-2529-live-api-extended-shard2-decision-trace-reuse-collision.md`, "Authority
pipeline completed" logged *during* request creation, before `/execute`/`/commit`) builds the
persisted `RunRecord` like this:

```119:129:ArchLucid.Application/Runs/Orchestration/AuthorityRunOrchestrator.cs
            ScopeContext scope = scopeContextProvider.GetCurrentScope();
            RunRecord run = new()
            {
                RunId = Guid.NewGuid(),
                ArchitectureRequestId = request.ArchitectureRequestId,
                ProjectId = request.ProjectId,
                ...
            };
            ApplyScope(run, scope);
```

```546:551:ArchLucid.Application/Runs/Orchestration/AuthorityRunOrchestrator.cs
    private static void ApplyScope(RunRecord run, ScopeContext scope)
    {
        run.TenantId = scope.TenantId;
        run.WorkspaceId = scope.WorkspaceId;
        run.ScopeProjectId = scope.ProjectId;
    }
```

So `Runs.ProjectId` (the slug) ends up holding the request's system-name-derived value (or a literal
default like `"default"` — see the fixture at `ArchLucid.Application.Tests/Runs/RunDetailBuyerMapperTests.cs:22`,
`ProjectId = "default"`), while `Runs.ScopeProjectId` (the Guid) correctly holds the ambient
tenant/workspace/project scope. **These are never the same value for a real run.**

### Both API surfaces the UI reads from leak the slug as `projectId`, never the scope GUID

1. **Plain run detail** (`getRunDetail`, non-buyer-polished env) — `RunRecord` is serialized to JSON
   directly (see doc comment: *"Returned directly from GET api/authority/runs/{runId}
   (AuthorityQueryController) as JSON"*, `ArchLucid.Core/Persistence/ApplicationPorts/Queries/RunDetailDto.cs:20-27`).
   The generated OpenAPI schema confirms the wire shape has **both** fields, and only one has a GUID
   format:

```38233:38247:archlucid-ui/src/lib/api-types.generated.ts
            projectId: string;
            ...
            /** Format: uuid */
            scopeProjectId?: string;
```

   (`projectId` has **no** `Format: uuid` annotation — it is the slug. `scopeProjectId` does.)

2. **Buyer-polished run detail** (`getBuyerRunDetailSummary`, used when
   `isBuyerPolishedOperatorShellEnv()` is true — very likely the active path given the screenshot's
   polished copy/nav) — the mapper copies the wrong field **and doesn't expose the right one at all**:

```20:26:ArchLucid.Application/Runs/RunDetailBuyerMapper.cs
        return new BuyerRunDetailSummaryDto
        {
            Run = new BuyerRunDetailRunDto
            {
                RunId = run.RunId,
                ProjectId = run.ProjectId,
```

   `BuyerRunDetailRunDto` (`ArchLucid.Contracts/Runs/BuyerRunDetailRunDto.cs`) has **no**
   `ScopeProjectId` property at all — the correct field is not on the wire for this path, full stop.

3. **The UI type** binds `run.projectId: string` (`archlucid-ui/src/types/authority.ts:235`) straight
   to this slug field, and `load-run-detail-page-model.ts:158` compares it against the real scope GUID.

### Why TB-077's own tests didn't catch this

`RunDetailBuyerMapperTests.Map_copies_whitelisted_proof_fields_and_omits_snapshots` builds its
`RunRecord` fixture with `ProjectId = "default"` and **never sets `ScopeProjectId`** — so nothing in
the existing test suite ever asserts the mapper (or the SSR loader) uses the scope-GUID field. This is
a coverage gap, not a contradiction of the diagnosis above.

## Fix

### Step 0 — confirm locally before coding (~10 minutes)

1. Start API + UI locally (`archlucid-ui/docs/TESTING_AND_TROUBLESHOOTING.md`), dev-default scope
   (no scope switcher change).
2. Generate a review via the Quick review wizard (or any wizard) and let it redirect to
   `/reviews/{runId}?fromGeneration=1`.
3. Confirm you hit the `workspace-mismatch` screen. Then call `GET /v1/architecture/review/{runId}`
   directly (or whichever endpoint the active env uses — check `isBuyerPolishedOperatorShellEnv()`) and
   confirm the JSON `run.projectId` is a non-GUID slug (e.g. the system name you typed, or `"default"`)
   while `run.scopeProjectId` (if present in the JSON at all) matches `33333333-3333-3333-3333-333333333333`
   (or whatever your effective `x-project-id` is). If this does **not** match, stop and report what you
   observe instead of proceeding blindly.

### Step 1 — UI: compare the correct field

In `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/load-run-detail-page-model.ts`, change
the ownership check to compare `resolvedDetail.run.scopeProjectId` (the real scope GUID), not
`resolvedDetail.run.projectId` (the slug):

```ts
&& !runProjectMatchesEffectiveScope(resolvedDetail.run.scopeProjectId, effectiveProjectId)
```

- `runProjectMatchesEffectiveScope` already treats an empty/missing left-hand side as "assume match"
  (`archlucid-ui/src/lib/operator-resource-scope.ts:14-16`), so this degrades safely if
  `scopeProjectId` is ever absent on older data — it will not introduce new false positives, only fix
  the current systemic false positive.
- `runProjectMatchesEffectiveScope` has exactly **one** call site in the whole UI (confirmed by grep) —
  this is the only place to change in `archlucid-ui/**`. Do not go looking for other comparison sites;
  there aren't any using this helper.
- Regenerate/inspect `archlucid-ui/src/lib/api-types.generated.ts` — `RunRecord.scopeProjectId` is
  already present on this schema (`getRunDetail` path), so no backend contract change is required for
  the **non-buyer** path.

### Step 2 — Backend: expose the scope GUID on the buyer-polished path too

The buyer-polished path (`getBuyerRunDetailSummary` → `BuyerRunDetailRunDto`) has no `ScopeProjectId`
field at all. Add one so Step 1's fix works when `isBuyerPolishedOperatorShellEnv()` is true (the
likely-active path given the screenshot):

1. `ArchLucid.Contracts/Runs/BuyerRunDetailRunDto.cs` — add a `Guid ScopeProjectId { get; set; }`
   property alongside the existing `ProjectId` (keep `ProjectId` — it may still be used for display/
   grouping elsewhere; do not remove it, only add the missing field).
2. `ArchLucid.Application/Runs/RunDetailBuyerMapper.cs` — set `ScopeProjectId = run.ScopeProjectId` in
   the `BuyerRunDetailRunDto` initializer (line ~25, next to the existing `ProjectId = run.ProjectId`).
3. Regenerate the OpenAPI snapshot/UI types per `archlucid-ui/AGENTS.md` (`npm run generate:api-types`
   → `src/lib/api-types.generated.ts`) and refresh
   `ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json` per the process documented on
   `RunDetailDto` (`ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT=1 dotnet test --filter OpenApiContractSnapshotTests`
   — check the actual test name/filter for the buyer contract before running; it may differ).
4. Confirm `archlucid-ui/src/types/authority.ts`'s `RunDetail`/buyer summary type (wherever
   `BuyerRunDetailRunDto` is consumed on the TS side) now carries `scopeProjectId`, and that Step 1's
   loader code path picks the right field regardless of which of the two fetch functions
   (`getRunDetail` vs `getBuyerRunDetailSummary`) was used — both response shapes must expose
   `scopeProjectId` after this step.

### Step 3 — regression tests

1. **`ArchLucid.Application.Tests/Runs/RunDetailBuyerMapperTests.cs`** — extend the existing fixture to
   set `ScopeProjectId` on the source `RunRecord` to a **different** value than `ProjectId` (mirroring
   real data, where the slug and the scope GUID are never the same), and assert
   `mapped.Run.ScopeProjectId` equals the source's `ScopeProjectId` (not the slug).
2. **`archlucid-ui` unit test** for `load-run-detail-page-model.ts` (or extend
   `archlucid-ui/src/lib/operator-resource-scope.test.ts` if the loader itself isn't easily unit-tested
   in isolation — check existing test scaffolding first) covering two cases:
   - `run.projectId` (slug) differs from the effective scope, but `run.scopeProjectId` **matches** →
     must **not** return `workspace-mismatch` (this is the exact bug being fixed; it must fail on the
     pre-fix code and pass post-fix).
   - `run.scopeProjectId` genuinely differs from the effective scope → **must still** return
     `workspace-mismatch` (do not regress the TB-077 IDOR defense while fixing the false positive).
3. Do not weaken `runProjectMatchesEffectiveScope` itself — it is correct; only the field fed into it at
   the one call site was wrong.

## Acceptance criteria

1. Step 0's local repro is completed and its outcome stated explicitly before Step 1 is attempted.
2. Generating a review through the normal wizard flow and following the post-generation redirect opens
   the architecture package successfully — no `workspace-mismatch` screen — under the plain dev-default
   scope, with **no** scope-switcher interaction.
3. A run whose `scopeProjectId` genuinely does not match the caller's effective project scope still
   produces the `workspace-mismatch` screen (IDOR defense preserved — verify with a manual cross-scope
   check or the new test from Step 3).
4. New/updated tests from Step 3 fail on pre-fix code and pass on post-fix code.
5. `npm run generate:api-types` output is committed if the backend contract changed (Step 2), and the
   OpenAPI contract snapshot test passes.
6. Relevant test projects (`ArchLucid.Application.Tests`, `archlucid-ui` unit tests) pass locally (see
   `.cursor/rules/shell-hygiene.mdc` for compile/test invocation discipline — one scoped run, not a full
   solution build unless necessary).

## Verification

After the fix, repeat Step 0's manual repro at least twice (once under `isBuyerPolishedOperatorShellEnv()
= true`, once `= false`, if you can toggle it locally — check `archlucid-ui/src/lib/demo-ui-env.ts` for
how that flag is controlled) and confirm the generated review opens immediately without the
`workspace-mismatch` screen in both configurations.

## Related

- `docs/library/TECH_BACKLOG.md` — **TB-077** ("Operator UI resource ownership checks + governance
  mutation hardening", done 2026-06-01) introduced the check this bug lives in. This prompt is a
  bugfix on top of TB-077, not a revert — the ownership check itself is correct in intent and must be
  preserved (see Step 3, criterion 3).
- `docs/library/TECH_BACKLOG.md` — **TB-075** ("Operator UI server-side scope") — unrelated to this bug
  (that item is about *who* controls the scope headers; this bug is about *which field* gets compared
  once headers are already resolved). Do not conflate the two or pull TB-075 work into this fix.
- `ArchLucid.Application.Tests/Runs/RunDetailBuyerMapperTests.cs` — existing test whose fixture gap
  (never setting `ScopeProjectId`) is why this shipped unnoticed; extend, don't rewrite.
