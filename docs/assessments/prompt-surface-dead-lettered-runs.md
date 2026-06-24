# Implementation Prompt: Surface Dead-Lettered Runs to the Operator UI

**Objective:**
Expose dead-lettered background orchestrator tasks (`AuthorityPipelineWork`) to the Operator UI so that runs with permanently failed pipelines show a definitive "Failed" state instead of relying purely on a time-elapsed check (`detectStalledReview`) which displays an endless spinner.

**Context:**
Currently, when `AuthorityPipelineWorkProcessor.OnProcessingFailedAsync` exhausts retries, it marks the outbox entry as dead-lettered via `workOutbox.RecordDeadLetterAsync(entry.OutboxId...)`. However, it *does not* update the `RunRecord`'s status, leaving the run permanently stuck in `TasksGenerated` or similar non-terminal states.

**Steps to Implement:**

### 1. Update the Background Processor to Mark the Run as Failed
*   **File:** `ArchLucid.Host.Core/Hosted/AuthorityPipelineWorkProcessor.cs`
*   **Action:** In `OnProcessingFailedAsync`, immediately after `await workOutbox.RecordDeadLetterAsync(...)` is called, retrieve the associated `RunRecord` using `IRunRepository.GetByIdAsync(scope, entry.RunId, ...)`. You will need to construct a `ScopeContext` using the entry's Tenant/Workspace/Project IDs.
*   **Action:** Update the run's status:
    *   Set `run.LegacyRunStatus = nameof(ArchitectureRunStatus.Failed)`.
    *   Set `run.CompletedUtc = _timeProvider.UtcNowDateTime()`.
*   **Action:** Save the updated run via `IRunRepository.UpdateAsync(...)`. Note: `IRunRepository` is already resolved inside `ProcessEntryAsync`, you may need to resolve it inside `ProcessPendingBatchAsync` and pass it down to `OnProcessingFailedAsync`.

### 2. Expose `IsDeadLettered` on the API Contracts
*   **Files:** `ArchLucid.Contracts/Metadata/ArchitectureRun.cs`, `ArchLucid.Contracts/Architecture/RunSummary.cs`, `ArchLucid.Contracts/Runs/BuyerRunDetailSummaryDto.cs`
*   **Action:** Add `public bool IsDeadLettered { get; set; }` to these contracts.

### 3. Populate `IsDeadLettered` in the Query Service
*   **File:** `ArchLucid.Application/RunDetailQueryService.cs`
*   **Action:** In `GetRunDetailAsync` and the list methods (`ListRunSummariesAsync`, etc.), map `IsDeadLettered = (r.LegacyRunStatus == nameof(ArchitectureRunStatus.Failed))` (or similar robust heuristic, as runs failing here are effectively dead-lettered). Alternatively, for a more robust approach, you could extend `RunRecord` to have a dedicated boolean, but inferring from the terminal failure state is sufficient for V1.1 to prevent UI hang.

### 4. Update the Frontend UI Logic
*   **Action:** Re-generate API types in `archlucid-ui`: `npm run generate:api-types`.
*   **File:** `archlucid-ui/src/lib/usability/stalled-review-detection.ts`
*   **Action:** Modify `detectStalledReview` to accept an `isDeadLettered: boolean` argument. If `isDeadLettered` is true, immediately return `{ isStalled: false, elapsedMinutes: 0 }` so the UI does not show the stalled warning, but instead relies on the terminal "Failed" state logic.
*   **File:** `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/RunDetailPageView.tsx`
*   **Action:** Pass the new `isDeadLettered` flag into `detectStalledReview` (via `m.resolvedDetail.run.isDeadLettered`). 

**Important Guidelines:**
*   Do NOT perform N+1 queries to the `AuthorityPipelineWorkOutbox` table. Updating the `RunRecord` status when the dead-letter event occurs is the most scalable approach.
*   Run `dotnet build ArchLucid.Backend.slnf` to verify backend compilation.
*   Run `npm run generate:api-types` in `archlucid-ui` to sync the frontend contracts.