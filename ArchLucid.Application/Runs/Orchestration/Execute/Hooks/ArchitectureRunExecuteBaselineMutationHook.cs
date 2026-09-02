using ArchLucid.Application.Common;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration.Execute.Hooks;

public interface IArchitectureRunExecuteBaselineMutationHook
{
    Task RecordExecuteRunFailureAsync(
        string runId,
        string actor,
        Exception ex,
        CancellationToken cancellationToken);

    Task RecordQualityGateRejectedAsync(
        string runId,
        string actor,
        AgentOutputQualityGateRejectedException ex,
        CancellationToken cancellationToken);
}

public sealed class ArchitectureRunExecuteBaselineMutationHook(
    IBaselineMutationAuditService baselineMutationAudit,
    IRunRepository runRepository,
    IRunStateTransitionService runStateTransitionService,
    IScopeContextProvider scopeContextProvider,
    ILogger<ArchitectureRunExecuteBaselineMutationHook> logger) : IArchitectureRunExecuteBaselineMutationHook
{
    private readonly IBaselineMutationAuditService _baselineMutationAudit =
        baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IRunStateTransitionService _runStateTransitionService =
        runStateTransitionService ?? throw new ArgumentNullException(nameof(runStateTransitionService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ILogger<ArchitectureRunExecuteBaselineMutationHook> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task RecordExecuteRunFailureAsync(
        string runId,
        string actor,
        Exception ex,
        CancellationToken cancellationToken)
    {
        if (_logger.IsEnabled(LogLevel.Warning))
            _logger.LogWarningArchitectureRunExecutionFailed(ex, runId, ex.GetType().Name);

        _logger.LogError(
            ex,
            "Architecture run execution failed: RunId={RunId}, ExceptionType={ExceptionType}. CorrelationId={CorrelationId}",
            LogSanitizer.Sanitize(runId),
            ex.GetType().Name,
            System.Diagnostics.Activity.Current?.Id ?? "unknown");

        AgentExecutionFailureSummary failureSummary = AgentExecutionFailureSummaryFactory.FromException(ex);
        await TryMarkRunExecuteFailedAsync(runId, failureSummary, cancellationToken).ConfigureAwait(false);

        await _baselineMutationAudit.RecordAsync(
            AuditEventTypes.Baseline.Architecture.RunFailed,
            actor,
            runId,
            AgentExecutionFailureSummaryJson.Serialize(failureSummary),
            cancellationToken).ConfigureAwait(false);
    }

    public async Task RecordQualityGateRejectedAsync(
        string runId,
        string actor,
        AgentOutputQualityGateRejectedException ex,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(ex);

        if (!ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? header = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken).ConfigureAwait(false);

        if (header is null)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    "Quality gate reject: dbo.Runs header missing for RunId={RunId}.",
                    LogSanitizer.Sanitize(runId));
            }

            return;
        }

        header.LegacyRunStatus = nameof(ArchitectureRunStatus.ExecutionCompletedQualityRejected);
        await _runRepository.UpdateAsync(header, cancellationToken).ConfigureAwait(false);

        string details = BuildQualityGateRejectedAuditDetails(ex);
        await _baselineMutationAudit.RecordAsync(
            AuditEventTypes.Baseline.Architecture.RunQualityGateRejected,
            actor,
            runId,
            details,
            cancellationToken).ConfigureAwait(false);
    }

    private async Task TryMarkRunExecuteFailedAsync(
        string runId,
        AgentExecutionFailureSummary summary,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(summary);

        if (!ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? header = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken).ConfigureAwait(false);

        if (header is null)
            return;

        if (string.Equals(header.LegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return;

        ArchitectureRunStatus failedStatus =
            _runStateTransitionService.DeriveStatusAfterExecuteFailure(completedResults: null);
        header.LegacyRunStatus = failedStatus.ToString();
        header.CompletedUtc = TimeProvider.System.UtcNowDateTime();
        header.LastFailureReason = AgentExecutionFailureSummaryJson.Serialize(summary);
        await _runRepository.UpdateAsync(header, cancellationToken).ConfigureAwait(false);

        _logger.LogError(
            "Run execution failed for RunId={RunId}. Status={Status}. CorrelationId={CorrelationId}",
            LogSanitizer.Sanitize(runId),
            failedStatus,
            System.Diagnostics.Activity.Current?.Id ?? "unknown");
    }

    private static string BuildQualityGateRejectedAuditDetails(AgentOutputQualityGateRejectedException ex)
    {
        List<string> parts =
        [
            $"TraceId={ex.TraceId}",
            $"AgentLabel={ex.AgentLabel}",
        ];

        if (ex.StructuralCompletenessRatio is { } structural)
            parts.Add($"StructuralCompletenessRatio={structural}");

        if (ex.SemanticScore is { } semantic)
            parts.Add($"SemanticScore={semantic}");

        if (!string.IsNullOrWhiteSpace(ex.RejectReasonCategory))
            parts.Add($"RejectReasonCategory={ex.RejectReasonCategory}");

        if (!string.IsNullOrWhiteSpace(ex.TriageScenarioId))
            parts.Add($"TriageScenarioId={ex.TriageScenarioId}");

        if (!string.IsNullOrWhiteSpace(ex.GateDefinitionVersion))
            parts.Add($"GateDefinitionVersion={ex.GateDefinitionVersion}");

        if (!string.IsNullOrWhiteSpace(ex.GateDefinitionContentHashSha256))
            parts.Add($"GateDefinitionContentHashSha256={ex.GateDefinitionContentHashSha256}");

        if (!string.IsNullOrWhiteSpace(ex.GateMode))
            parts.Add($"GateMode={ex.GateMode}");

        return string.Join(';', parts);
    }
}
