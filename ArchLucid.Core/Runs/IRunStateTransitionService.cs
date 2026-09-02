using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Runs;

/// <summary>
///     Shared coordinator and authority run lifecycle rules (status preconditions, required agent outputs, legacy status names).
/// </summary>
public interface IRunStateTransitionService
{
    /// <summary>Agent types that must each have exactly one result before commit or ReadyForCommit promotion.</summary>
    IReadOnlySet<AgentType> RequiredAgentTypesForCommit { get; }

    /// <summary>Run statuses that allow manual or API agent result submission.</summary>
    IReadOnlySet<ArchitectureRunStatus> ResultSubmissionAllowedStatuses { get; }

    RunStateTransitionCheck ValidateCommitAllowed(ArchitectureRunStatus status);

    RunStateTransitionCheck ValidateCommitAllowedLegacy(string? legacyRunStatus);

    RunStateTransitionCheck ValidateResultSubmissionAllowed(ArchitectureRunStatus status);

    /// <summary>True when each required agent type has exactly one persisted row (may still be degraded/empty).</summary>
    bool HasAllRequiredAgentResults(IReadOnlyList<AgentResult> results);

    /// <summary>True when each required agent has a commit-ready (non-degraded, meaningful) result (TB-937).</summary>
    bool HasCommitReadyAgentResults(IReadOnlyList<AgentResult> results);

    ArchitectureRunStatus DeriveStatusAfterResultSubmission(IReadOnlyList<AgentResult> results);

    /// <summary>Status after an execute attempt completes without a hard orchestrator failure (TB-937).</summary>
    ArchitectureRunStatus DeriveStatusAfterExecuteCompletion(IReadOnlyList<AgentResult> results);

    /// <summary>Failed vs FailedPartial when execute hard-fails with optional partial outputs (TB-937).</summary>
    ArchitectureRunStatus DeriveStatusAfterExecuteFailure(IReadOnlyList<AgentResult>? completedResults);

    bool IsExecuteIdempotentTerminalStatus(ArchitectureRunStatus status);

    bool ShouldPromoteLegacyStatusToReadyForCommit(string? currentLegacyRunStatus);

    /// <summary>
    ///     Deferred outbox may set <see cref="ArchitectureRunStatus.TasksGenerated"/> after task materialize,
    ///     but must not demote a run that already advanced (e.g. seed/execute → ReadyForCommit).
    ///     <see cref="ArchitectureRunStatus.Retrying"/> is allowed so Re-run of a Failed deferred review can continue.
    /// </summary>
    bool ShouldSetTasksGeneratedAfterDeferredMaterialize(string? currentLegacyRunStatus);

    /// <summary>
    ///     True when execute should resume the deferred authority pipeline instead of the agent-task loop:
    ///     no AgentTasks were materialized because create queued authority work (<c>ContextSnapshotId</c> still null).
    /// </summary>
    bool ShouldResumeDeferredAuthorityPipelineOnExecute(
        ArchitectureRunStatus status,
        string? contextSnapshotId,
        int scheduledTaskCount);

    string GetCoordinationLegacyStatusAfterCreate(bool deferredAuthorityPipeline);

    /// <summary>
    ///     Coordination header patch may set <see cref="ArchitectureRunStatus.TasksGenerated"/> or
    ///     <see cref="ArchitectureRunStatus.Created"/> after create, but must not demote a row the inline authority
    ///     pipeline already advanced (e.g. simulator finalize → Committed before k6 seed/commit).
    /// </summary>
    bool ShouldApplyCoordinationLegacyStatusPatch(string? currentLegacyRunStatus, string targetLegacyRunStatus);

    /// <summary>Queued authority work may skip stage execution when context snapshot already exists.</summary>
    bool ShouldSkipQueuedAuthorityPipelineCompletion(Guid? contextSnapshotId);
}
