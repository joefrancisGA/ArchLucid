using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Runs;

namespace ArchLucid.Application.Runs;

/// <inheritdoc cref="IRunStateTransitionService"/>
public sealed class RunStateTransitionService : IRunStateTransitionService
{
    private static readonly HashSet<AgentType> RequiredAgentTypes =
        [AgentType.Topology, AgentType.Cost, AgentType.Compliance, AgentType.Critic];

    private static readonly HashSet<ArchitectureRunStatus> ResultSubmissionStatuses =
        [ArchitectureRunStatus.TasksGenerated, ArchitectureRunStatus.WaitingForResults];

    /// <inheritdoc/>
    public IReadOnlySet<AgentType> RequiredAgentTypesForCommit => RequiredAgentTypes;

    /// <inheritdoc/>
    public IReadOnlySet<ArchitectureRunStatus> ResultSubmissionAllowedStatuses => ResultSubmissionStatuses;

    /// <inheritdoc/>
    public RunStateTransitionCheck ValidateCommitAllowed(ArchitectureRunStatus status)
    {
        if (status is ArchitectureRunStatus.ReadyForCommit or ArchitectureRunStatus.TasksGenerated)
            return RunStateTransitionCheck.Allowed();

        if (status is ArchitectureRunStatus.Failed)
            return RunStateTransitionCheck.Denied("is in Failed status and cannot be committed.");

        if (status is ArchitectureRunStatus.ExecutionCompletedQualityRejected)
            return RunStateTransitionCheck.Denied(
                "did not pass the output quality gate and cannot be committed. Re-execute with more context or adjust quality settings.");

        return RunStateTransitionCheck.Denied(
            $"cannot be committed in status '{status}'. Execute the run until it reaches ReadyForCommit.");
    }

    /// <inheritdoc/>
    public RunStateTransitionCheck ValidateCommitAllowedLegacy(string? legacyRunStatus)
    {
        if (string.Equals(legacyRunStatus, nameof(ArchitectureRunStatus.ReadyForCommit), StringComparison.OrdinalIgnoreCase) ||
            string.Equals(legacyRunStatus, nameof(ArchitectureRunStatus.TasksGenerated), StringComparison.OrdinalIgnoreCase))
            return RunStateTransitionCheck.Allowed();

        return RunStateTransitionCheck.Denied(
            $"cannot be finalized in status '{legacyRunStatus ?? "(null)"}'.");
    }

    /// <inheritdoc/>
    public RunStateTransitionCheck ValidateResultSubmissionAllowed(ArchitectureRunStatus status)
    {
        if (ResultSubmissionStatuses.Contains(status))
            return RunStateTransitionCheck.Allowed();

        string allowed = string.Join(" or ", ResultSubmissionStatuses.OrderBy(s => s.ToString()));
        return RunStateTransitionCheck.Denied(
            $"Run is in status '{status}' and does not accept agent results. Only {allowed} runs can receive results.");
    }

    /// <inheritdoc/>
    public bool HasAllRequiredAgentResults(IReadOnlyList<AgentResult> results)
    {
        ArgumentNullException.ThrowIfNull(results);

        if (results.Count != RequiredAgentTypes.Count)
            return false;

        foreach (AgentType required in RequiredAgentTypes)

            if (results.Count(r => r.AgentType == required) != 1)
                return false;


        return true;
    }

    /// <inheritdoc/>
    public ArchitectureRunStatus DeriveStatusAfterResultSubmission(IReadOnlyList<AgentResult> results)
    {
        return HasAllRequiredAgentResults(results)
            ? ArchitectureRunStatus.ReadyForCommit
            : ArchitectureRunStatus.WaitingForResults;
    }

    /// <inheritdoc/>
    public bool IsExecuteIdempotentTerminalStatus(ArchitectureRunStatus status)
    {
        return status is ArchitectureRunStatus.ReadyForCommit or ArchitectureRunStatus.Committed;
    }

    /// <inheritdoc/>
    public bool ShouldPromoteLegacyStatusToReadyForCommit(string? currentLegacyRunStatus)
    {
        if (string.Equals(currentLegacyRunStatus, nameof(ArchitectureRunStatus.ReadyForCommit), StringComparison.OrdinalIgnoreCase) ||
            string.Equals(currentLegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return false;

        return true;
    }

    /// <inheritdoc/>
    public string GetCoordinationLegacyStatusAfterCreate(bool deferredAuthorityPipeline)
    {
        return deferredAuthorityPipeline
            ? nameof(ArchitectureRunStatus.Created)
            : nameof(ArchitectureRunStatus.TasksGenerated);
    }

    /// <inheritdoc/>
    public bool ShouldSkipQueuedAuthorityPipelineCompletion(Guid? contextSnapshotId) => contextSnapshotId is not null;
}
