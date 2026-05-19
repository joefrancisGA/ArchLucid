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

    bool HasAllRequiredAgentResults(IReadOnlyList<AgentResult> results);

    ArchitectureRunStatus DeriveStatusAfterResultSubmission(IReadOnlyList<AgentResult> results);

    bool IsExecuteIdempotentTerminalStatus(ArchitectureRunStatus status);

    bool ShouldPromoteLegacyStatusToReadyForCommit(string? currentLegacyRunStatus);

    string GetCoordinationLegacyStatusAfterCreate(bool deferredAuthorityPipeline);

    /// <summary>Queued authority work may skip stage execution when context snapshot already exists.</summary>
    bool ShouldSkipQueuedAuthorityPipelineCompletion(Guid? contextSnapshotId);
}
