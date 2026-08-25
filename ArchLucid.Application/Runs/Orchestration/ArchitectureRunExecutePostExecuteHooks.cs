using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Best-effort post-execute side effects (audit, baseline mutation audit, integration events) after run execution outcomes.
/// </summary>
public sealed class ArchitectureRunExecutePostExecuteHooks(
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    IBaselineMutationAuditService baselineMutationAudit,
    IRunRepository runRepository,
    IRunStateTransitionService runStateTransitionService,
    IIntegrationEventOutboxRepository integrationEventOutbox,
    IIntegrationEventPublisher integrationEventPublisher,
    IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
    ILogger<ArchitectureRunExecutePostExecuteHooks> logger)
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IBaselineMutationAuditService _baselineMutationAudit =
        baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));

    private readonly IIntegrationEventOutboxRepository _integrationEventOutbox =
        integrationEventOutbox ?? throw new ArgumentNullException(nameof(integrationEventOutbox));

    private readonly IIntegrationEventPublisher _integrationEventPublisher =
        integrationEventPublisher ?? throw new ArgumentNullException(nameof(integrationEventPublisher));

    private readonly IOptionsMonitor<IntegrationEventsOptions> _integrationEventsOptions =
        integrationEventsOptions ?? throw new ArgumentNullException(nameof(integrationEventsOptions));

    private readonly ILogger<ArchitectureRunExecutePostExecuteHooks> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IRunStateTransitionService _runStateTransitionService =
        runStateTransitionService ?? throw new ArgumentNullException(nameof(runStateTransitionService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task LogSelectiveExecuteRequestedAsync(
        string runId,
        string actor,
        IReadOnlyList<AgentTask> forcedTasks,
        bool includeDependents,
        CancellationToken cancellationToken)
    {
        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        AuditEvent selectiveRequested = scope.CreateAuditEvent(
            AuditEventTypes.Run.SelectiveExecuteRequested,
            actor,
            actor,
            JsonSerializer.Serialize(new
            {
                runId,
                includeDependents,
                taskIds = forcedTasks.Select(static t => t.TaskId).ToArray(),
                agentTypes = forcedTasks.Select(static t => t.AgentType.ToString()).ToArray(),
            },
                AuditJsonSerializationOptions.Instance));
        selectiveRequested.RunId = runGuid;

        await DurableAuditLogRetry.TryLogAsync(
            ct => _auditService.LogAsync(selectiveRequested, ct),
            _logger,
            $"{AuditEventTypes.Run.SelectiveExecuteRequested}:{LogSanitizer.Sanitize(runId)}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.Run.SelectiveExecuteRequested);
    }

    public async Task LogFailedRunRetryRequestedAsync(
        ArchitectureRun run,
        string runId,
        string actor,
        CancellationToken cancellationToken)
    {
        if (run.Status is not ArchitectureRunStatus.Failed and not ArchitectureRunStatus.ExecutionCompletedQualityRejected)
            return;

        ScopeContext retryScope = _scopeContextProvider.GetCurrentScope();

        if (!TryParseRunGuid(runId, out Guid failedRunGuid))
            return;

        AuditEvent retryRequested = retryScope.CreateAuditEvent(
            AuditEventTypes.Run.RetryRequested,
            actor,
            actor,
            JsonSerializer.Serialize(new
            {
                runId,
                previousStatus = run.Status.ToString()
            },
                AuditJsonSerializationOptions.Instance));
        retryRequested.RunId = failedRunGuid;

        await DurableAuditLogRetry.TryLogAsync(
            ct => _auditService.LogAsync(retryRequested, ct),
            _logger,
            $"{AuditEventTypes.Run.RetryRequested}:{LogSanitizer.Sanitize(runId)}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.Run.RetryRequested);
    }

    public async Task LogLegacyReadyForCommitPromotedAsync(
        string runId,
        string actor,
        Guid runGuid,
        ScopeContext scope,
        string previousLegacyRunStatus,
        string newLegacyRunStatus,
        CancellationToken cancellationToken)
    {
        AuditEvent legacyReadyForCommitPromoted = new()
        {
            EventType = AuditEventTypes.RunLegacyReadyForCommitPromoted,
            ActorUserId = actor,
            ActorUserName = actor,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runGuid,
            DataJson = JsonSerializer.Serialize(new
            {
                runId,
                previousLegacyRunStatus,
                newLegacyRunStatus
            },
                AuditJsonSerializationOptions.Instance)
        };

        await DurableAuditLogRetry.TryLogAsync(
            ct => _auditService.LogAsync(legacyReadyForCommitPromoted, ct),
            _logger,
            $"{AuditEventTypes.RunLegacyReadyForCommitPromoted}:{LogSanitizer.Sanitize(runId)}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.RunLegacyReadyForCommitPromoted);
    }

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
        await TryMarkRunExecuteFailedAsync(runId, failureSummary, cancellationToken);
        await _baselineMutationAudit.RecordAsync(
            AuditEventTypes.Baseline.Architecture.RunFailed,
            actor,
            runId,
            AgentExecutionFailureSummaryJson.Serialize(failureSummary),
            cancellationToken);

        if (TryParseRunGuid(runId, out Guid runGuid))
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();

            await ArchitectureRunIntegrationEventPublishing.TryPublishRunFailedAsync(
                _integrationEventOutbox,
                _integrationEventPublisher,
                _integrationEventsOptions,
                _logger,
                runGuid,
                scope,
                failureSummary,
                cancellationToken);
        }
    }

    public async Task RecordQualityGateRejectedAsync(
        string runId,
        string actor,
        AgentOutputQualityGateRejectedException ex,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(ex);

        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? header = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (header is null)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning("Quality gate reject: dbo.Runs header missing for RunId={RunId}.", LogSanitizer.Sanitize(runId));

            return;
        }

        header.LegacyRunStatus = nameof(ArchitectureRunStatus.ExecutionCompletedQualityRejected);
        await _runRepository.UpdateAsync(header, cancellationToken);

        string details = BuildQualityGateRejectedAuditDetails(ex);
        await _baselineMutationAudit.RecordAsync(
            AuditEventTypes.Baseline.Architecture.RunQualityGateRejected,
            actor,
            runId,
            details,
            cancellationToken);

        await ArchitectureRunIntegrationEventPublishing.TryPublishQualityGateRejectedAsync(
            _integrationEventOutbox,
            _integrationEventPublisher,
            _integrationEventsOptions,
            _logger,
            runGuid,
            scope,
            ex,
            cancellationToken);
    }

    private async Task TryMarkRunExecuteFailedAsync(
        string runId,
        AgentExecutionFailureSummary summary,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(summary);

        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? header = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (header is null)
            return;

        if (string.Equals(header.LegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return;

        ArchitectureRunStatus failedStatus = _runStateTransitionService.DeriveStatusAfterExecuteFailure(completedResults: null);
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

    private static string BuildQualityGateRejectedAuditDetails(AgentOutputQualityGateRejectedException ex)
    {
        List<string> parts = [
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

    private static bool TryParseRunGuid(string runId, out Guid runGuid) =>
        Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
}
