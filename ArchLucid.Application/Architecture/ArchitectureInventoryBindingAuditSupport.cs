using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     Required durable audit for architecture inventory snapshot bind/unbind (AS-055 / ADR 0083 spirit).
/// </summary>
public sealed class ArchitectureInventoryBindingAuditSupport(
    IAuditService auditService,
    ILogger<ArchitectureInventoryBindingAuditSupport> logger)
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ILogger<ArchitectureInventoryBindingAuditSupport> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public Task LogSnapshotBoundAsync(
        ScopeContext scope,
        string actor,
        Guid architectureId,
        Guid snapshotId,
        CancellationToken cancellationToken) =>
        LogRequiredAsync(
            scope,
            actor,
            AuditEventTypes.ArchitectureInventorySnapshotBound,
            architectureId,
            snapshotId,
            cancellationToken);

    public Task LogSnapshotDetachedAsync(
        ScopeContext scope,
        string actor,
        Guid architectureId,
        CancellationToken cancellationToken) =>
        LogRequiredAsync(
            scope,
            actor,
            AuditEventTypes.ArchitectureInventorySnapshotDetached,
            architectureId,
            snapshotId: null,
            cancellationToken);

    private Task LogRequiredAsync(
        ScopeContext scope,
        string actor,
        string eventType,
        Guid architectureId,
        Guid? snapshotId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(actor);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventType);

        string dataJson = snapshotId.HasValue
            ? JsonSerializer.Serialize(new { architectureId, snapshotId })
            : JsonSerializer.Serialize(new { architectureId });

        AuditEvent auditEvent = scope.CreateAuditEvent(eventType, actor, actor, dataJson);

        string operationLabel = snapshotId.HasValue
            ? $"ArchitectureInventorySnapshotBound:{architectureId:N}:{snapshotId:N}"
            : $"ArchitectureInventorySnapshotDetached:{architectureId:N}";

        return DurableAuditLogRetry.LogOrThrowAsync(
            ct => _auditService.LogAsync(auditEvent, ct),
            _logger,
            operationLabel,
            cancellationToken,
            auditEventTypeForMetrics: eventType);
    }
}
