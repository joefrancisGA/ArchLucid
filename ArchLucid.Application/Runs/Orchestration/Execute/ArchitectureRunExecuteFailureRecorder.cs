using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <inheritdoc cref="IArchitectureRunExecuteFailureRecorder" />
public sealed class ArchitectureRunExecuteFailureRecorder(
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IRunStateTransitionService runStateTransitionService,
    ILogger<ArchitectureRunExecuteFailureRecorder> logger) : IArchitectureRunExecuteFailureRecorder
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunStateTransitionService _runStateTransitionService =
        runStateTransitionService ?? throw new ArgumentNullException(nameof(runStateTransitionService));

    private readonly ILogger<ArchitectureRunExecuteFailureRecorder> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public Task TryMarkRunExecuteFailedAsync(
        string runId,
        AgentExecutionFailureSummary summary,
        CancellationToken cancellationToken) =>
        TryMarkRunExecuteFailedAsync(runId, summary, completedResults: null, cancellationToken);

    /// <inheritdoc />
    public async Task TryMarkRunExecuteFailedAsync(
        string runId,
        AgentExecutionFailureSummary summary,
        IReadOnlyList<AgentResult>? completedResults,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(summary);

        if (!ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? header = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (header is null)
            return;

        if (string.Equals(header.LegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return;

        ArchitectureRunStatus failedStatus = _runStateTransitionService.DeriveStatusAfterExecuteFailure(completedResults);
        header.LegacyRunStatus = failedStatus.ToString();
        header.CompletedUtc = TimeProvider.System.UtcNowDateTime();
        header.LastFailureReason = AgentExecutionFailureSummaryJson.Serialize(summary);
        await _runRepository.UpdateAsync(header, cancellationToken);

        _logger.LogError(
            "Run execution failed for RunId={RunId}. Status={Status}. CorrelationId={CorrelationId}",
            LogSanitizer.Sanitize(runId),
            failedStatus,
            System.Diagnostics.Activity.Current?.Id ?? "unknown");
    }
}
