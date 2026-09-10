using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     Required durable audit for architecture share grant/revoke and restrict-to-shares toggles (AS-093 / ADR 0083).
/// </summary>
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
        Guid userId,
        string role,
        CancellationToken cancellationToken) =>
        LogRequiredAsync(
            scope,
            actor,
            AuditEventTypes.ArchitectureShareGranted,
            JsonSerializer.Serialize(new { architectureId, userId, role }),
            $"ArchitectureShareGranted:{architectureId:N}:{userId:N}",
            cancellationToken);

    public Task LogShareRevokedAsync(
        ScopeContext scope,
        string actor,
        Guid architectureId,
        Guid userId,
        CancellationToken cancellationToken) =>
        LogRequiredAsync(
            scope,
            actor,
            AuditEventTypes.ArchitectureShareRevoked,
            JsonSerializer.Serialize(new { architectureId, userId }),
            $"ArchitectureShareRevoked:{architectureId:N}:{userId:N}",
            cancellationToken);

    public Task LogRestrictToSharesEnabledAsync(
        ScopeContext scope,
        string actor,
        Guid architectureId,
        CancellationToken cancellationToken) =>
        LogRequiredAsync(
            scope,
            actor,
            AuditEventTypes.ArchitectureRestrictToSharesEnabled,
            JsonSerializer.Serialize(new { architectureId }),
            $"ArchitectureRestrictToSharesEnabled:{architectureId:N}",
            cancellationToken);

    public Task LogRestrictToSharesDisabledAsync(
        ScopeContext scope,
        string actor,
        Guid architectureId,
        CancellationToken cancellationToken) =>
        LogRequiredAsync(
            scope,
            actor,
            AuditEventTypes.ArchitectureRestrictToSharesDisabled,
            JsonSerializer.Serialize(new { architectureId }),
            $"ArchitectureRestrictToSharesDisabled:{architectureId:N}",
            cancellationToken);

    private Task LogRequiredAsync(
        ScopeContext scope,
        string actor,
        string eventType,
        string dataJson,
        string operationLabel,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(actor);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventType);
        ArgumentException.ThrowIfNullOrWhiteSpace(dataJson);
        ArgumentException.ThrowIfNullOrWhiteSpace(operationLabel);

        AuditEvent auditEvent = scope.CreateAuditEvent(eventType, actor, actor, dataJson);

        return DurableAuditLogRetry.LogOrThrowAsync(
            ct => _auditService.LogAsync(auditEvent, ct),
            _logger,
            operationLabel,
            cancellationToken,
            auditEventTypeForMetrics: eventType);
    }
}
