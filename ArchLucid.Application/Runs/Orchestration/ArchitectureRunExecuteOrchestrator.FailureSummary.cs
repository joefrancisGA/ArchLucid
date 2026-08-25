using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Execute failure run header marking for partial-budget and agent-loop paths.</summary>
public sealed partial class ArchitectureRunExecuteOrchestrator
{
    private Task TryMarkRunExecuteFailedAsync(
        string runId,
        AgentExecutionFailureSummary summary,
        CancellationToken cancellationToken) =>
        TryMarkRunExecuteFailedAsync(runId, summary, completedResults: null, cancellationToken);

    private async Task TryMarkRunExecuteFailedAsync(
        string runId,
        AgentExecutionFailureSummary summary,
        IReadOnlyList<AgentResult>? completedResults,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(summary);

        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRecord? header = await runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (header is null)
            return;

        if (string.Equals(header.LegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return;

        ArchitectureRunStatus failedStatus = _runStateTransitionService.DeriveStatusAfterExecuteFailure(completedResults);
        header.LegacyRunStatus = failedStatus.ToString();
        header.CompletedUtc = TimeProvider.System.UtcNowDateTime();
        header.LastFailureReason = AgentExecutionFailureSummaryJson.Serialize(summary);
        await runRepository.UpdateAsync(header, cancellationToken);

        logger.LogError(
            "Run execution failed for RunId={RunId}. Status={Status}. CorrelationId={CorrelationId}",
            LogSanitizer.Sanitize(runId),
            failedStatus,
            System.Diagnostics.Activity.Current?.Id ?? "unknown");
    }
}
