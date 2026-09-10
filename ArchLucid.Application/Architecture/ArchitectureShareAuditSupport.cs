using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Architecture;

/// <summary>AS-093: Required durable audit for architecture share grant/revoke/restrict changes.</summary>
public sealed class ArchitectureShareAuditSupport(
    IAuditService auditService,
    ILogger<ArchitectureShareAuditSupport> logger)
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ILogger<ArchitectureShareAuditSupport> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public Task LogShareGrantedAsync(
        ScopeContext scope,
        string actor,
        Guid architectureId,
        string targetActorOid,
        string role,
        CancellationToken cancellationToken) =>
        LogRequiredAsync(
            scope,
            actor,
            AuditEventTypes.ArchitectureShareGranted,
            new { architectureId, targetActorOid, role },
            $"ArchitectureShareGranted:{architectureId:N}:{targetActorOid}",
            cancellationToken);

    public Task LogShareRevokedAsync(
        ScopeContext scope,
        string actor,
        Guid architectureId,
        string targetActorOid,
        CancellationToken cancellationToken) =>
        LogRequiredAsync(
            scope,
            actor,
            AuditEventTypes.ArchitectureShareRevoked,
            new { architectureId, targetActorOid },
            $"ArchitectureShareRevoked:{architectureId:N}:{targetActorOid}",
            cancellationToken);

    public Task LogRestrictToSharesChangedAsync(
        ScopeContext scope,
        string actor,
        Guid architectureId,
        bool restrictToShares,
        CancellationToken cancellationToken) =>
        LogRequiredAsync(
            scope,
            actor,
            restrictToShares
                ? AuditEventTypes.ArchitectureRestrictToSharesEnabled
                : AuditEventTypes.ArchitectureRestrictToSharesDisabled,
            new { architectureId, restrictToShares },
            $"ArchitectureRestrictToShares:{architectureId:N}:{restrictToShares}",
            cancellationToken);

    private Task LogRequiredAsync(
        ScopeContext scope,
        string actor,
        string eventType,
        object payload,
        string operationLabel,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(actor);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventType);

        AuditEvent auditEvent = scope.CreateAuditEvent(eventType, actor, actor, JsonSerializer.Serialize(payload));

        return DurableAuditLogRetry.LogOrThrowAsync(
            ct => _auditService.LogAsync(auditEvent, ct),
            _logger,
            operationLabel,
            cancellationToken,
            auditEventTypeForMetrics: eventType);
    }
}
