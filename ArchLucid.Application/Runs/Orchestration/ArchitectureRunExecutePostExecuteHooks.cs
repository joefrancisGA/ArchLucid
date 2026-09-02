using ArchLucid.Application.Runs.Orchestration.Execute.Hooks;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Sequences post-execute hook handlers (audit, baseline mutation, integration outbox).
/// </summary>
public sealed class ArchitectureRunExecutePostExecuteHooks(
    IArchitectureRunExecuteAuditHook auditHook,
    IArchitectureRunExecuteBaselineMutationHook baselineMutationHook,
    IArchitectureRunExecuteOutboxPublishHook outboxPublishHook)
{
    private readonly IArchitectureRunExecuteAuditHook _auditHook =
        auditHook ?? throw new ArgumentNullException(nameof(auditHook));

    private readonly IArchitectureRunExecuteBaselineMutationHook _baselineMutationHook =
        baselineMutationHook ?? throw new ArgumentNullException(nameof(baselineMutationHook));

    private readonly IArchitectureRunExecuteOutboxPublishHook _outboxPublishHook =
        outboxPublishHook ?? throw new ArgumentNullException(nameof(outboxPublishHook));

    public Task LogSelectiveExecuteRequestedAsync(
        string runId,
        string actor,
        IReadOnlyList<AgentTask> forcedTasks,
        bool includeDependents,
        CancellationToken cancellationToken) =>
        _auditHook.LogSelectiveExecuteRequestedAsync(
            runId,
            actor,
            forcedTasks,
            includeDependents,
            cancellationToken);

    public Task LogFailedRunRetryRequestedAsync(
        ArchitectureRun run,
        string runId,
        string actor,
        CancellationToken cancellationToken) =>
        _auditHook.LogFailedRunRetryRequestedAsync(run, runId, actor, cancellationToken);

    public Task LogLegacyReadyForCommitPromotedAsync(
        string runId,
        string actor,
        Guid runGuid,
        ScopeContext scope,
        string previousLegacyRunStatus,
        string newLegacyRunStatus,
        CancellationToken cancellationToken) =>
        _auditHook.LogLegacyReadyForCommitPromotedAsync(
            runId,
            actor,
            runGuid,
            scope,
            previousLegacyRunStatus,
            newLegacyRunStatus,
            cancellationToken);

    public async Task RecordExecuteRunFailureAsync(
        string runId,
        string actor,
        Exception ex,
        CancellationToken cancellationToken)
    {
        await _baselineMutationHook.RecordExecuteRunFailureAsync(runId, actor, ex, cancellationToken)
            .ConfigureAwait(false);

        AgentExecutionFailureSummary failureSummary = AgentExecutionFailureSummaryFactory.FromException(ex);
        await _outboxPublishHook.TryPublishRunFailedAsync(runId, failureSummary, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task RecordQualityGateRejectedAsync(
        string runId,
        string actor,
        AgentOutputQualityGateRejectedException ex,
        CancellationToken cancellationToken)
    {
        await _baselineMutationHook.RecordQualityGateRejectedAsync(runId, actor, ex, cancellationToken)
            .ConfigureAwait(false);
        await _outboxPublishHook.TryPublishQualityGateRejectedAsync(runId, ex, cancellationToken)
            .ConfigureAwait(false);
    }
}
