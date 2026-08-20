using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Execute failure recording, run header failure marking, and audit detail formatting.</summary>
public sealed partial class ArchitectureRunExecuteOrchestrator
{

    private async Task RecordExecuteRunFailureAsync(
        string runId,
        string actor,
        Exception ex,
        CancellationToken cancellationToken)
    {
        if (logger.IsEnabled(LogLevel.Warning))
            logger.LogWarningArchitectureRunExecutionFailed(ex, runId, ex.GetType().Name);

        logger.LogError(ex, "Architecture run execution failed: RunId={RunId}, ExceptionType={ExceptionType}. CorrelationId={CorrelationId}", LogSanitizer.Sanitize(runId), ex.GetType().Name, System.Diagnostics.Activity.Current?.Id ?? "unknown");

        AgentExecutionFailureSummary failureSummary = AgentExecutionFailureSummaryFactory.FromException(ex);
        await TryMarkRunExecuteFailedAsync(runId, failureSummary, cancellationToken);
        await baselineMutationAudit.RecordAsync(
            AuditEventTypes.Baseline.Architecture.RunFailed,
            actor,
            runId,
            FormatExecuteRunFailureAuditDetails(failureSummary),
            cancellationToken);

        if (TryParseRunGuid(runId, out Guid runGuid))
        {
            ScopeContext scope = scopeContextProvider.GetCurrentScope();

            await ArchitectureRunIntegrationEventPublishing.TryPublishRunFailedAsync(
                integrationEventOutbox,
                integrationEventPublisher,
                integrationEventsOptions,
                logger,
                runGuid,
                scope,
                failureSummary,
                cancellationToken);
        }
    }


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


    private static string FormatExecuteRunFailureAuditDetails(AgentExecutionFailureSummary summary)
    {
        ArgumentNullException.ThrowIfNull(summary);

        return AgentExecutionFailureSummaryJson.Serialize(summary);
    }
}
