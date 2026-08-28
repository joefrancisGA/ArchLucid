> **Scope:** One copy-paste Composer/Cursor prompt that closes the Failed-review name-occupancy hole. Internal engineering only — not buyer-facing copy.
> **Incident:** Operator is told to **Re-run review** after a Failed create, then **Continue to clarifications** 409s because `ArchLucid` is still owned by the Failed `dbo.Runs` row.
> **Already shipped (do not redo):** Guided-intake `rerun=` prefill — `eeb590fe95` / PR **#666**.

# Failed-rerun name collision — Composer prompt

**Created:** 2026-08-28 · **Status:** ready to run (one prompt, one chat).

Paste the **Prompt** block below into a **fresh** Composer / Cloud Agent session. Do not implement from this heading file in the same chat that only authored the prompt.

**Suggested branch:** `cursor/failed-rerun-name-occupancy-e493` (or the Cloud Agent suffix in force). Name that branch in any commit/push request.

---

## Why this is still open after #666 and after recovery SQL

PR **#666** made **Re-run review** prefill system name / intent / actors / scope from the prior package. It did **not** change workspace name uniqueness.

A Failed create stub (`LegacyRunStatus = Failed`, `ArchitectureId` null, no snapshots) still occupies `dbo.Runs.ProjectId`. `Continue to clarifications` patches `systemName` and `WorkspaceSystemNameCollisionGuard` 409s: *A review or architecture named 'X' already exists in this workspace.*

The operator may have **archived** the leftover Failed row (`ArchivedUtc` set) to unblock **this** name. That is data recovery only. The next Failed create will trap the name again until this prompt ships.

`CompletedUtc` on Failed rows is set by `TryMarkAdmittedCreateFailedAsync`. It does **not** mean the review succeeded.

---

## Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Implement the Failed / quality-rejected workspace name-occupancy fix so "Re-run review" can start a new guided intake with the same system name. Do not redesign intake, uniqueness for committed architectures, or in-place Failed→Retrying.

## Incident (already assessed — do not re-assess, implement)

Operator REAL workspace "Customer Intake Demo" (TenantId 11111111-1111-1111-1111-111111111111, WorkspaceId 22222222-2222-2222-2222-222222222222). Start review step 1 → Continue to clarifications → HTTP 409 Conflict: "A review or architecture named 'ArchLucid' already exists in this workspace."

dbo.Runs row that caused it (forensic; may already be archived by the operator):
- RunId F1329B7E-5168-4ED2-96AA-03E8FC09EB1B
- ProjectId ArchLucid
- LegacyRunStatus Failed
- ArchivedUtc was NULL at incident time
- ArchitectureId NULL, all snapshot/manifest FKs NULL
- CompletedUtc set ~1.3s after CreatedUtc
- LastFailureReason: SqlException column/value count mismatch on a LATER persist (Runs insert succeeded; TryMarkAdmittedCreateFailedAsync marked the stub Failed)

UI copy already tells them to start a new review with the same intake:
- resolve-review-package-do-this-next.ts: "Assessment failed — … start a new review with the same intake."
- Re-run review → /architecture/reviews/new?path=guided-intake&rerun={runId}
- #666 (eeb590fe95) already prefills the form from the prior package. Do NOT redo prefill.

Collision SQL Occupies ANY non-archived run with matching ProjectId. It does NOT filter LegacyRunStatus. Failed is terminal (RunRepositoryCore.LegacyRunStatusIsNonTerminal is false) but still 409s.

Sibling query CountActiveRunsForArchitectureRequest already excludes Failed / Committed / QualityRejected. Align name occupancy with "Failed does not occupy" while KEEPING Committed occupancy for a brand-new name.

## Authoritative product rule

A workspace system name is TAKEN when any of these exist (same TenantId + WorkspaceId):

1. A non-archived run whose ProjectId matches (trim + case-insensitive) AND LegacyRunStatus is NOT Failed and NOT ExecutionCompletedQualityRejected, unless excludeRunId is that run.
2. A mutable draft (Drafting or Admitted) whose document.systemName matches, unless excludeDraftId is that draft.

Therefore:
- Failed and ExecutionCompletedQualityRejected MUST NOT occupy the name. New intake with the same name must succeed.
- Committed MUST still occupy the name for a brand-new architecture (no PriorRunId / no excludeRunId).
- In-flight statuses (Created, TasksGenerated, WaitingForResults, Retrying, ReadyForCommit, PartiallyCompleted, FailedPartial) still occupy the name unless excludeRunId matches.
- rerun= / document.PriorRunId / ArchitectureRequest.PriorRunId MUST be passed as excludeRunId on every name check for that intake (draft patch, draft submit, create-run, synthesis generate). Reuse ArchitectureReviewSourceRunResolver.TryParseRunGuid — do not invent a second parser.
- excludeDraftId stays as today (self-rename / self-submit).

Do NOT auto-archive Failed rows in this change. Archiving hides the review the operator uses to click Re-run. Status filter + excludeRunId is the fix. Operator already ran recovery SQL for the leftover stub.

## Constraints

- Each class in its own file. Prefer LINQ. Prefer concrete types over var. Blank line before if / foreach unless first line of a method. Always check nulls. Comment anything a two-year developer would not follow.
- No ConfigureAwait(false) in tests.
- Before editing tracked files, run .\scripts\agent\check-working-tree-path.ps1 on those paths.
- Stage only files this prompt changes. No git add -A. Do not push to master unless the user named master in the same request.
- Tenant isolation stays database-per-tenant (ADR 0037). Collision stays workspace-scoped (TenantId + WorkspaceId). Do not drop tenant from the SQL.
- Do not change OpenAPI unless you add a stable error code that already has a home in ProblemTypes / API_CONTRACTS.md. Prefer keeping HTTP 409 + existing ProblemTypes.Conflict.
- Do not add a TECH_BACKLOG row unless you need an ID for the PR title; code + tests are the deliverable.
- One scoped compile check; one retry on exit code 1. Use .\scripts\ci\agent-compile-check.ps1 with a narrow -ProjectPath (Application + Persistence test projects you touch).

## Read first

- ArchLucid.Application/Architecture/WorkspaceSystemNameCollisionGuard.cs
- ArchLucid.Application/Architecture/IWorkspaceSystemNameCollisionGuard.cs
- ArchLucid.Application/Architecture/ArchitectureReviewSourceRunResolver.cs (TryParseRunGuid)
- ArchLucid.Persistence/Sql/RunRepositorySql.cs (ExistsActiveRunWithSystemNameInWorkspace vs CountActiveRunsForArchitectureRequest)
- ArchLucid.Persistence/Repositories/InMemoryRunRepository.Query.cs (ExistsActiveRunWithSystemNameInWorkspaceAsync)
- ArchLucid.Persistence/Repositories/RunRepositoryCore.cs (LegacyRunStatusIsNonTerminal)
- ArchLucid.Persistence/Repositories/SqlRunRepository.Query.cs
- ArchLucid.Core/Persistence/ApplicationPorts/Interfaces/IRunRepository.cs (XML docs currently say "non-archived" — update to the product rule)
- ArchLucid.Application/Drafts/DraftRequestCrudService.cs (PatchAsync name check — excludeDraftId only today)
- ArchLucid.Application/Drafts/DraftAdmissionService.cs (SubmitAsync name check — excludeDraftId only today)
- ArchLucid.Application/Runs/Orchestration/ArchitectureRunCreateOrchestrator.cs (EnsureAvailableAsync; CompleteAsync already excludes its own runId)
- ArchLucid.Application/Architecture/ArchitectureSynthesisKernel.cs (GenerateAsync name check — no exclude today)
- ArchLucid.Contracts/Requests/ArchitectureRequest.cs (PriorRunId)
- ArchLucid.Contracts/Drafts/DraftRequestDocument.cs (PriorRunId)
- ArchLucid.Host.Core/ProblemDetails/ProblemSupportHints.cs (generic Conflict hint is wrong for name collisions)
- ArchLucid.Application.Tests/Architecture/WorkspaceSystemNameCollisionGuardTests.cs
- ArchLucid.Persistence.Tests/Sql/RunRepositoryWorkspaceSystemNameSqlTests.cs
- ArchLucid.Persistence.Tests/Repositories/RunRepositoryCoreTests.cs
- archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/resolve-review-package-do-this-next.ts
- docs/library/STATE_MACHINES.md §2 (Failed is terminal; user retry is Failed→Retrying — do not implement that path here)

## Work

1. Occupancy SQL + InMemory
   - ExistsActiveRunWithSystemNameInWorkspace (SQL and InMemory) must ignore Failed and ExecutionCompletedQualityRejected the same way CountActiveRunsForArchitectureRequest ignores those terminals.
   - Keep ArchivedUtc IS NULL.
   - Keep excludeRunId.
   - Keep TenantId + WorkspaceId.
   - Committed rows still match (occupy) unless excluded.
   - Update IRunRepository / IWorkspaceSystemNameCollisionGuard XML comments so "active" means this rule, not "any non-archived row".
   - Add a SQL-shape test that the occupancy query names Failed + ExecutionCompletedQualityRejected (or binds the same status parameters CountActive already uses). Do not rely on stringly status in app code if CountActive already has parameters — reuse those names.

2. excludeRunId on replacement intake
   - DraftRequestCrudService.PatchAsync: when document.PriorRunId parses, pass excludeRunId.
   - DraftAdmissionService.SubmitAsync: same.
   - ArchitectureRunCreateOrchestrator create paths that call EnsureAvailableAsync without excludeRunId: pass ArchitectureReviewSourceRunResolver.TryResolveSourceRunId(request) (covers PriorRunId and recurrence- request ids). CompleteAsyncAcceptedCreateRunAsync already excludes the stub runId — if both prior and stub exist, exclude the stub as today; also exclude prior if it differs (if the guard only takes one excludeRunId, exclude the stub on CompleteAsync and exclude prior on the pre-create EnsureAvailableAsync calls).
   - ArchitectureSynthesisKernel.GenerateAsync: pass TryResolveSourceRunId(request).
   - Do not require the caller to pass excludeRunId when PriorRunId is already on the request/document — resolve it at the call site.

3. Conflict operator copy (small)
   - The generic ProblemTypes.Conflict hint says "new run / idempotency key / execute before commit". That is wrong for this 409.
   - Special-case ONLY when the conflict detail contains "already exists in this workspace" (the guard message). Next-step must say: an in-progress or committed review/architecture already uses this name; open that review or use Re-run review from it. A failed or quality-rejected review with this name should not block — retry after refresh if you just archived one.
   - Do not change the hint for other ConflictException callers (commit/idempotency).
   - Keep the 409 title/detail sentence that names the system name.

4. Tests (required — this hole survived because none existed)
   - InMemory: Failed run with ProjectId "ArchLucid", ArchivedUtc null → ExistsActiveRunWithSystemNameInWorkspaceAsync returns false.
   - InMemory: ExecutionCompletedQualityRejected same → false.
   - InMemory: Committed same name → true.
   - InMemory: Created / WaitingForResults same name → true.
   - InMemory: Committed same name + excludeRunId = that run → false.
   - InMemory: Failed still false even without excludeRunId.
   - Guard unit test: repository returns false for Failed occupancy → EnsureAvailableAsync succeeds (if you keep the guard as a pass-through, the InMemory tests are enough; still add a guard test if you change guard logic).
   - Draft patch/submit (unit, existing test-double style): PriorRunId is forwarded as excludeRunId.
   - Create orchestrator: request.PriorRunId forwarded as excludeRunId on the pre-create EnsureAvailableAsync call.
   - SQL shape: occupancy query excludes Failed + quality-rejected statuses; still requires ArchivedUtc IS NULL and TenantId/WorkspaceId.
   - ProblemSupportHints (or the mapper you touch): name-collision detail gets the new next-step; a generic "duplicate idempotency" Conflict does not.

## Out of scope (do not do)

- Guided-intake prefill / use-guided-intake-prior-run-prefill.ts (#666).
- In-place Failed → Retrying execute retry.
- Auto-archive or DELETE of Failed rows.
- Diagnosing or fixing the original SqlException INSERT column/value mismatch (separate persist bug; Runs insert already succeeded).
- Allowing two Committed architectures with the same workspace name.
- Changing draft occupancy rules beyond passing excludeRunId.
- GTM / assessment scoring / SOC 2 / pen test / #2 #3 #5 #6 cohorts.
- UI wizard redesign. No new "Re-run" button. The existing href is correct once the API allows the name.
- Broad ProblemTypes.Conflict rewrite.

## Verify

- dotnet test --filter FullyQualifiedName~WorkspaceSystemNameCollisionGuardTests
- dotnet test --filter FullyQualifiedName~RunRepositoryWorkspaceSystemNameSqlTests
- dotnet test --filter FullyQualifiedName~RunRepositoryCoreTests
- Plus any new test class you add for draft/orchestrator excludeRunId forwarding.
- .\scripts\ci\agent-compile-check.ps1 scoped to projects you compiled for those tests.
- Do not run full solution test.

## Done when

1. A Failed (or quality-rejected) non-archived run named ArchLucid does not 409 a new draft patch / create-run with systemName ArchLucid.
2. A Committed run named ArchLucid still 409s a brand-new intake with that name.
3. The same Committed (or Failed) run does NOT 409 when PriorRunId / rerun= / excludeRunId is that run.
4. Conflict next-step for this message is about name occupancy, not idempotency.
5. #666 prefill files are untouched.
```

---

## Sequencing

One chat. One PR. If you split, occupancy SQL/InMemory + tests first; excludeRunId forwarding second; copy last. Do not ship copy-only.

## Out of this prompt (later, only if owner asks)

| Item | Why deferred |
|------|----------------|
| In-place `Failed` → `Retrying` | State machine already exists; UI chose new intake |
| Auto-archive Failed create stubs | Would hide the review used for Re-run |
| Original INSERT column/value SqlException | Separate persist bug; not what 409s Continue to clarifications |
| Second-review attach to `ArchitectureId` for committed packages | Needed for a richer follow-on review; `excludeRunId` is enough for V1 rerun |
