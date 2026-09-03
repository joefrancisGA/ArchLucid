using ArchLucid.Application.AiUsage;
using ArchLucid.Application.Common;
using ArchLucid.Application.Diagnostics;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Audit;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <inheritdoc cref="IArchitectureRunExecuteTailHooksStage" />
public sealed class ArchitectureRunExecuteTailHooksStage(
    IScopeContextProvider scopeContextProvider,
    IBaselineMutationAuditService baselineMutationAudit,
    ArchitectureRunExecutePostExecuteHooks postExecuteHooks,
    DemoExpensiveActionGate demoExpensiveActionGate,
    IAgentExecutionReadinessGuard agentExecutionReadinessGuard) : IArchitectureRunExecuteTailHooksStage
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IBaselineMutationAuditService _baselineMutationAudit =
        baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));

    private readonly ArchitectureRunExecutePostExecuteHooks _postExecuteHooks =
        postExecuteHooks ?? throw new ArgumentNullException(nameof(postExecuteHooks));

    private readonly DemoExpensiveActionGate _demoExpensiveActionGate =
        demoExpensiveActionGate ?? throw new ArgumentNullException(nameof(demoExpensiveActionGate));

    private readonly IAgentExecutionReadinessGuard _agentExecutionReadinessGuard =
        agentExecutionReadinessGuard ?? throw new ArgumentNullException(nameof(agentExecutionReadinessGuard));

    /// <inheritdoc />
    public Task LogFailedRunRetryRequestedAsync(
        ArchitectureRun run,
        string runId,
        string actor,
        CancellationToken cancellationToken) =>
        _postExecuteHooks.LogFailedRunRetryRequestedAsync(run, runId, actor, cancellationToken);

    /// <inheritdoc />
    public async Task EnsurePreAgentLoopExecuteAllowedAsync(
        string runId,
        string actor,
        CancellationToken cancellationToken)
    {
        Guid tenantId = _scopeContextProvider.GetCurrentScope().TenantId;

        await _demoExpensiveActionGate
            .EnsureExpensiveActionAllowedAsync(tenantId, AiUsageFeature.ArchitectureGeneration, cancellationToken)
            .ConfigureAwait(false);

        await _agentExecutionReadinessGuard.EnsureReadyForExecuteAsync(cancellationToken).ConfigureAwait(false);

        await _baselineMutationAudit
            .RecordAsync(AuditEventTypes.Baseline.Architecture.RunStarted, actor, runId, null, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <inheritdoc />
    public Task RecordExecuteRunFailureAsync(
        string runId,
        string actor,
        Exception ex,
        CancellationToken cancellationToken) =>
        _postExecuteHooks.RecordExecuteRunFailureAsync(runId, actor, ex, cancellationToken);
}
