# Risk & Tradeoffs — Step 6: RiskSnapshot, Persistence, and Metrics Infrastructure

## Context

Implement durable persistence for the `RiskSnapshot` and the two decoupled
metric streams described in `docs/architecture/analyzer_component.md` §8, §11.3,
§11.4–11.5 (rev 7). This is the system-of-record substrate — build it early
because defensibility only compounds once it exists.

Prerequisites: Steps 1–5 must be complete.

## Two metric streams — keep them separate

| Stream | Type | Purpose | Trains the model? |
|--------|------|---------|-------------------|
| `RiskBehaviorChangeEvent` | Leading, commercial | Did the product influence a decision? | **Never** |
| `RiskOutcomeCaptureEvent` | Lagging, epistemic | Was the finding actually right? | **Yes — exclusively** |

These must never be conflated. Different tables, different repositories, different
query surfaces.

## What to build

### SQL DDL — add to `ArchLucid.Persistence/Scripts/ArchLucid.sql`

```sql
-- Risk snapshots (one immutable record per review run)
CREATE TABLE dbo.RiskSnapshots
(
    SnapshotId      NVARCHAR(32)        NOT NULL PRIMARY KEY,
    ReviewRunId     NVARCHAR(32)        NOT NULL,
    TenantId        NVARCHAR(128)       NOT NULL,
    CreatedAt       DATETIMEOFFSET      NOT NULL,
    SnapshotJson    NVARCHAR(MAX)       NOT NULL,   -- serialised RiskSnapshot
    SchemaVersion   SMALLINT            NOT NULL DEFAULT 1
);

CREATE INDEX IX_RiskSnapshots_ReviewRunId ON dbo.RiskSnapshots (ReviewRunId);
CREATE INDEX IX_RiskSnapshots_TenantId    ON dbo.RiskSnapshots (TenantId, CreatedAt DESC);

-- Behavior-change events (leading commercial metric — never trains the model)
CREATE TABLE dbo.RiskBehaviorChangeEvents
(
    EventId         NVARCHAR(32)        NOT NULL PRIMARY KEY,
    SnapshotId      NVARCHAR(32)        NOT NULL,
    ItemId          NVARCHAR(32)        NOT NULL,
    TenantId        NVARCHAR(128)       NOT NULL,
    OccurredAt      DATETIMEOFFSET      NOT NULL,
    ActionTaken     NVARCHAR(64)        NOT NULL    -- ChangeRequirement | AcceptCounterfactual | ManifestRevision
);

CREATE INDEX IX_RiskBCE_SnapshotId ON dbo.RiskBehaviorChangeEvents (SnapshotId);
CREATE INDEX IX_RiskBCE_TenantId   ON dbo.RiskBehaviorChangeEvents (TenantId, OccurredAt DESC);

-- Outcome-capture events (lagging validity signal — feeds the flywheel)
CREATE TABLE dbo.RiskOutcomeCaptureEvents
(
    EventId         NVARCHAR(32)        NOT NULL PRIMARY KEY,
    SnapshotId      NVARCHAR(32)        NOT NULL,
    ItemId          NVARCHAR(32)        NOT NULL,
    TenantId        NVARCHAR(128)       NOT NULL,
    OccurredAt      DATETIMEOFFSET      NOT NULL,
    OutcomeVerdict  NVARCHAR(32)        NOT NULL,   -- ConfirmedCorrect | ConfirmedIncorrect | Inconclusive
    Notes           NVARCHAR(1000)      NULL
);

CREATE INDEX IX_RiskOCE_SnapshotId ON dbo.RiskOutcomeCaptureEvents (SnapshotId);
CREATE INDEX IX_RiskOCE_TenantId   ON dbo.RiskOutcomeCaptureEvents (TenantId, OccurredAt DESC);

-- Requirement smell dispositions (the "raised once" guarantee)
CREATE TABLE dbo.RequirementSmellDispositions
(
    DispositionId   NVARCHAR(32)        NOT NULL PRIMARY KEY,
    TenantId        NVARCHAR(128)       NOT NULL,
    RequirementId   NVARCHAR(256)       NOT NULL,
    DisposedAt      DATETIMEOFFSET      NOT NULL,
    Verdict         NVARCHAR(32)        NOT NULL    -- Accepted | Dismissed
);

CREATE UNIQUE INDEX UX_SmellDisposition ON dbo.RequirementSmellDispositions (TenantId, RequirementId);

-- Per-tenant dismiss-rate cache (updated by background aggregation or on append)
CREATE TABLE dbo.RiskDismissRates
(
    TenantId        NVARCHAR(128)       NOT NULL PRIMARY KEY,
    ConcernBucket   DECIMAL(5,4)        NOT NULL DEFAULT 0,  -- fraction dismissed
    UpdatedAt       DATETIMEOFFSET      NOT NULL
);
```

### Repositories (Dapper, follow existing patterns)

`IRiskSnapshotRepository`
- `Task SaveAsync(RiskSnapshot snapshot)`
- `Task<RiskSnapshot?> GetByReviewRunIdAsync(string reviewRunId, string tenantId)`
- `Task<RiskSnapshot?> GetBySnapshotIdAsync(string snapshotId, string tenantId)`

`IRiskBehaviorChangeEventRepository`
- `Task AppendAsync(RiskBehaviorChangeEvent evt)`
- `Task<IReadOnlyList<RiskBehaviorChangeEvent>> GetBySnapshotIdAsync(string snapshotId, string tenantId)`

`IRiskOutcomeCaptureRepository`
- `Task AppendAsync(RiskOutcomeCaptureEvent evt)`
- `Task<IReadOnlyList<RiskOutcomeCaptureEvent>> GetBySnapshotIdAsync(string snapshotId, string tenantId)`

`IRequirementSmellDispositionRepository`
- `Task<bool> IsAlreadyDispositionedAsync(string tenantId, string requirementId)`
- `Task RecordDispositionAsync(string tenantId, string requirementId, string verdict)`

`ISmellDismissRateRepository`
- `Task<decimal> GetDismissRateAsync(string tenantId)`
- `Task UpdateDismissRateAsync(string tenantId, decimal newRate)`

### Orchestrator — `RiskSnapshotService`

`ArchLucid.Application/Risk/RiskSnapshotService.cs`

```csharp
public sealed class RiskSnapshotService
{
    // Orchestrates detection engines, assembles a RiskSnapshot, saves it.
    // Called after a review run completes.
    public Task<RiskSnapshot> BuildAndSaveAsync(
        string reviewRunId,
        string tenantId,
        ManifestDocument manifest,
        TransparencyTrail trail,
        IReadOnlyList<string> statedRequirements,
        string? businessOutcome,
        CancellationToken cancellationToken = default);
}
```

Internally calls (in order): `ITradeoffDetectionEngine`, `IRequirementSmellEngine`,
`ISuggestedConcernSynthesizer`, then saves via `IRiskSnapshotRepository`.

### Delta

Implement `Task<RiskSnapshotDelta> CompareAsync(string snapshotIdA, string snapshotIdB, string tenantId)`:
- New items in B not in A.
- Resolved items in A not in B.
- Changed items (status change).

Reuse `/compare` if an existing comparison surface already exists in the codebase.

## Disposition

Wire behavior-change and outcome-capture event appending through the existing
`FindingReviewTrailAppendService` pattern — or create a parallel `RiskReviewTrailService`
if the finding trail is tightly coupled to `Finding` types. Use append-only;
never mutate existing rows.

## Guardrails

- All SQL in `ArchLucid.sql` (single-file DDL rule).
- `RiskSnapshot` is stored as serialised JSON — no decomposed column tables for
  individual tradeoffs. The snapshot is the unit; querying individual items
  happens in-process after deserialisation.
- Behavior-change events and outcome-capture events are never mixed in queries.
- All repository methods are tenant-scoped (`TenantId` on every query).
- No background workers — all writes are synchronous to the caller's request.

## Acceptance criteria

- DDL added to `ArchLucid.sql` and compiles without error.
- `RiskSnapshotService.BuildAndSaveAsync` writes a readable `RiskSnapshot` to the
  DB and retrieves it by `ReviewRunId`.
- Behavior-change events append and are retrievable separately from outcome-capture events.
- `IsAlreadyDispositionedAsync` returns `true` after `RecordDispositionAsync` is called.
