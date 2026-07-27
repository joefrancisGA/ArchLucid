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
        [
            ArchitectureRunStatus.TasksGenerated,
            ArchitectureRunStatus.WaitingForResults,
            ArchitectureRunStatus.PartiallyCompleted,
            ArchitectureRunStatus.FailedPartial,
        ];

    /// <inheritdoc/>
    public IReadOnlySet<AgentType> RequiredAgentTypesForCommit => RequiredAgentTypes;

    /// <inheritdoc/>
    public IReadOnlySet<ArchitectureRunStatus> ResultSubmissionAllowedStatuses => ResultSubmissionStatuses;

    /// <inheritdoc/>
    public RunStateTransitionCheck ValidateCommitAllowed(ArchitectureRunStatus status)
    {
        if (status is ArchitectureRunStatus.ReadyForCommit)
            return RunStateTransitionCheck.Allowed();

        if (status is ArchitectureRunStatus.Failed)
            return RunStateTransitionCheck.Denied("is in Failed status and cannot be committed.");

        if (status is ArchitectureRunStatus.FailedPartial)
            return RunStateTransitionCheck.Denied(
                "is Partially failed (FailedPartial): one or more required agents did not succeed. Re-execute missing agents before commit.");

        if (status is ArchitectureRunStatus.PartiallyCompleted)
            return RunStateTransitionCheck.Denied(
                "is PartiallyCompleted: required agent results are incomplete. Re-execute until all required agents succeed.");

        if (status is ArchitectureRunStatus.ExecutionCompletedQualityRejected)
            return RunStateTransitionCheck.Denied(
                "did not pass the output quality gate and cannot be committed. Re-execute with more context or adjust quality settings.");

        if (status is ArchitectureRunStatus.TasksGenerated)
            return RunStateTransitionCheck.Denied(
                "cannot be committed in status 'TasksGenerated' until execute produces commit-ready results for all required agents.");

        return RunStateTransitionCheck.Denied(
            $"cannot be committed in status '{status}'. Execute the run until it reaches ReadyForCommit.");
    }

    /// <inheritdoc/>
    public RunStateTransitionCheck ValidateCommitAllowedLegacy(string? legacyRunStatus)
    {
        if (string.Equals(legacyRunStatus, nameof(ArchitectureRunStatus.ReadyForCommit), StringComparison.OrdinalIgnoreCase))
            return RunStateTransitionCheck.Allowed();

        if (string.Equals(legacyRunStatus, nameof(ArchitectureRunStatus.FailedPartial), StringComparison.OrdinalIgnoreCase))
            return RunStateTransitionCheck.Denied(
                "cannot be finalized in status 'FailedPartial'. Re-execute missing or failed required agents first.");

        if (string.Equals(legacyRunStatus, nameof(ArchitectureRunStatus.PartiallyCompleted), StringComparison.OrdinalIgnoreCase))
            return RunStateTransitionCheck.Denied(
                "cannot be finalized in status 'PartiallyCompleted'. Re-execute until all required agents succeed.");

        if (string.Equals(legacyRunStatus, nameof(ArchitectureRunStatus.TasksGenerated), StringComparison.OrdinalIgnoreCase))
            return RunStateTransitionCheck.Denied(
                "cannot be finalized in status 'TasksGenerated' until execute produces commit-ready results for all required agents.");

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
        {
            if (results.Count(r => r.AgentType == required) != 1)
                return false;
        }

        return true;
    }

    /// <inheritdoc/>
    public bool HasCommitReadyAgentResults(IReadOnlyList<AgentResult> results)
    {
        ArgumentNullException.ThrowIfNull(results);

        IReadOnlyList<AgentExecutionOutcome> outcomes = RequiredAgentExecutionOutcomes.Project(results);

        return RequiredAgentExecutionOutcomes.HasCommitReadyOutcomes(outcomes)
               && HasAllRequiredAgentResults(results);
    }

    /// <inheritdoc/>
    public ArchitectureRunStatus DeriveStatusAfterResultSubmission(IReadOnlyList<AgentResult> results)
    {
        return HasCommitReadyAgentResults(results)
            ? ArchitectureRunStatus.ReadyForCommit
            : ArchitectureRunStatus.WaitingForResults;
    }

    /// <inheritdoc/>
    public ArchitectureRunStatus DeriveStatusAfterExecuteCompletion(IReadOnlyList<AgentResult> results)
    {
        ArgumentNullException.ThrowIfNull(results);

        if (HasCommitReadyAgentResults(results))
            return ArchitectureRunStatus.ReadyForCommit;

        return ArchitectureRunStatus.PartiallyCompleted;
    }

    /// <inheritdoc/>
    public ArchitectureRunStatus DeriveStatusAfterExecuteFailure(IReadOnlyList<AgentResult>? completedResults)
    {
        IReadOnlyList<AgentExecutionOutcome> outcomes = RequiredAgentExecutionOutcomes.Project(completedResults);

        if (RequiredAgentExecutionOutcomes.HasAnySucceededRequiredAgent(outcomes))
            return ArchitectureRunStatus.FailedPartial;

        return ArchitectureRunStatus.Failed;
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
    public bool ShouldSetTasksGeneratedAfterDeferredMaterialize(string? currentLegacyRunStatus)
    {
        if (string.IsNullOrWhiteSpace(currentLegacyRunStatus))
            return true;

        return string.Equals(
            currentLegacyRunStatus,
            nameof(ArchitectureRunStatus.Created),
            StringComparison.OrdinalIgnoreCase);
    }

    /// <inheritdoc/>
    public string GetCoordinationLegacyStatusAfterCreate(bool deferredAuthorityPipeline)
    {
        return deferredAuthorityPipeline
            ? nameof(ArchitectureRunStatus.Created)
            : nameof(ArchitectureRunStatus.TasksGenerated);
    }

    /// <inheritdoc/>
    public bool ShouldApplyCoordinationLegacyStatusPatch(string? currentLegacyRunStatus, string targetLegacyRunStatus)
    {
        if (string.Equals(currentLegacyRunStatus, targetLegacyRunStatus, StringComparison.OrdinalIgnoreCase))
            return false;

        if (string.Equals(targetLegacyRunStatus, nameof(ArchitectureRunStatus.TasksGenerated), StringComparison.OrdinalIgnoreCase))
            return ShouldSetTasksGeneratedAfterDeferredMaterialize(currentLegacyRunStatus);

        if (string.Equals(targetLegacyRunStatus, nameof(ArchitectureRunStatus.Created), StringComparison.OrdinalIgnoreCase))
        {
            return string.IsNullOrWhiteSpace(currentLegacyRunStatus)
                || string.Equals(
                    currentLegacyRunStatus,
                    nameof(ArchitectureRunStatus.Created),
                    StringComparison.OrdinalIgnoreCase);
        }

        return true;
    }

    /// <inheritdoc/>
    public bool ShouldSkipQueuedAuthorityPipelineCompletion(Guid? contextSnapshotId) => contextSnapshotId is not null;
}
