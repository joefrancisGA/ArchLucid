using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration.Execute.Hooks;

public interface IArchitectureRunExecuteAuditHook
{
    Task LogSelectiveExecuteRequestedAsync(
        string runId,
        string actor,
        IReadOnlyList<AgentTask> forcedTasks,
        bool includeDependents,
        CancellationToken cancellationToken);

    Task LogFailedRunRetryRequestedAsync(
        ArchitectureRun run,
        string runId,
        string actor,
        CancellationToken cancellationToken);

    Task LogLegacyReadyForCommitPromotedAsync(
        string runId,
        string actor,
        Guid runGuid,
        ScopeContext scope,
        string previousLegacyRunStatus,
        string newLegacyRunStatus,
        CancellationToken cancellationToken);
}

public sealed class ArchitectureRunExecuteAuditHook(
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    ILogger<ArchitectureRunExecuteAuditHook> logger) : IArchitectureRunExecuteAuditHook
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ILogger<ArchitectureRunExecuteAuditHook> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task LogSelectiveExecuteRequestedAsync(
        string runId,
        string actor,
        IReadOnlyList<AgentTask> forcedTasks,
        bool includeDependents,
        CancellationToken cancellationToken)
    {
        if (!ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(runId, out Guid runGuid))
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

        if (!ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(runId, out Guid failedRunGuid))
            return;

        AuditEvent retryRequested = retryScope.CreateAuditEvent(
            AuditEventTypes.Run.RetryRequested,
            actor,
            actor,
            JsonSerializer.Serialize(new
            {
                runId,
                previousStatus = run.Status.ToString(),
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
                newLegacyRunStatus,
            },
                AuditJsonSerializationOptions.Instance),
        };

        await DurableAuditLogRetry.TryLogAsync(
            ct => _auditService.LogAsync(legacyReadyForCommitPromoted, ct),
            _logger,
            $"{AuditEventTypes.RunLegacyReadyForCommitPromoted}:{LogSanitizer.Sanitize(runId)}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.RunLegacyReadyForCommitPromoted);
    }
}
