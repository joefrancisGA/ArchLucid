using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Runs;

/// <summary>
///     Documented lifecycle events for <see cref="ArchitectureRunStatus" /> transitions.
///     <see cref="CommitFinalized" /> is the separate CAS finalize verb (TB-1311) — never an execute/orchestrator activity.
/// </summary>
public enum ArchitectureRunStatusLifecycleEvent
{
    TasksMaterialized = 1,
    ExecuteMarksWaitingForResults = 2,
    ExecuteCompletesToReadyForCommit = 3,
    ExecuteCompletesToPartiallyCompleted = 4,
    ExecuteFailsToFailed = 5,
    ExecuteFailsToFailedPartial = 6,
    QualityGateRejectsOutput = 7,
    AgentResultsDeriveToWaitingForResults = 8,
    AgentResultsDeriveToReadyForCommit = 9,

    /// <summary>Commit/finalize CAS only — ReadyForCommit → Committed.</summary>
    CommitFinalized = 10,

    CoordinationPatchToCreated = 11,
    CoordinationPatchToTasksGenerated = 12,
    OwnershipLeaseExpiredReconcileToFailed = 13,
    OwnershipLeaseExpiredReconcileToFailedPartial = 14,
    RetryRequested = 15,
}
