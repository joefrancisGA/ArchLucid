using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration.Create.Hooks;

public interface IArchitectureRunCreateAuditHook
{
    Task LogRequestCreatedAndLockedAsync(
        ArchitectureRequest request,
        CoordinationResult coordination,
        string actor,
        CancellationToken cancellationToken);
}

public sealed class ArchitectureRunCreateAuditHook(
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    ILogger<ArchitectureRunCreateAuditHook> logger) : IArchitectureRunCreateAuditHook
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ILogger<ArchitectureRunCreateAuditHook> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task LogRequestCreatedAndLockedAsync(
        ArchitectureRequest request,
        CoordinationResult coordination,
        string actor,
        CancellationToken cancellationToken)
    {
        ScopeContext scopeCtx = _scopeContextProvider.GetCurrentScope();
        Guid runGuid = TryParseCoordinationRunGuid(coordination.Run.RunId, out Guid parsed) ? parsed : Guid.Empty;

        AuditEvent requestCreated = scopeCtx.CreateAuditEvent(
            AuditEventTypes.RequestCreated,
            actor,
            actor,
            JsonSerializer.Serialize(
                new
                {
                    requestId = request.RequestId,
                    runId = coordination.Run.RunId,
                    systemName = request.SystemName,
                    environment = request.Environment,
                    cloudProvider = request.CloudProvider.ToString(),
                },
                AuditJsonSerializationOptions.Instance));
        requestCreated.RunId = runGuid == Guid.Empty ? null : runGuid;
        requestCreated.ExplicitActor = true;

        await DurableAuditLogRetry.TryLogAsync(
            ct => _auditService.LogAsync(requestCreated, ct),
            _logger,
            $"{AuditEventTypes.RequestCreated}:{LogSanitizer.Sanitize(coordination.Run.RunId)}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.RequestCreated).ConfigureAwait(false);

        AuditEvent requestLocked = scopeCtx.CreateAuditEvent(
            AuditEventTypes.RequestLocked,
            actor,
            actor,
            JsonSerializer.Serialize(
                new
                {
                    requestId = request.RequestId,
                    runId = coordination.Run.RunId,
                    rationale =
                        "Run persisted for this ArchitectureRequest — request is scoped as locked relative to drafts until terminal runs settle.",
                },
                AuditJsonSerializationOptions.Instance));
        requestLocked.RunId = runGuid == Guid.Empty ? null : runGuid;
        requestLocked.ExplicitActor = true;

        await DurableAuditLogRetry.TryLogAsync(
            ct => _auditService.LogAsync(requestLocked, ct),
            _logger,
            $"{AuditEventTypes.RequestLocked}:{LogSanitizer.Sanitize(coordination.Run.RunId)}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.RequestLocked);

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Architecture run created: RunId={RunId}, TaskCount={TaskCount}",
                LogSanitizer.Sanitize(coordination.Run.RunId),
                coordination.Tasks.Count);
        }
    }

    private static bool TryParseCoordinationRunGuid(string runId, out Guid runGuid) =>
        Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
}
