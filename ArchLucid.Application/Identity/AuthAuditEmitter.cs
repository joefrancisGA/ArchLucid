using System.Text.Json;

using ArchLucid.Core.Audit;

namespace ArchLucid.Application.Identity;

/// <summary>
///     Shared audit event construction and emission for identity/auth flows.
/// </summary>
public static class AuthAuditEmitter
{
    public static AuditEvent Create(
        string eventType,
        string actorId,
        object payload,
        Guid? tenantId = null,
        Guid? workspaceId = null,
        bool explicitActor = false) =>
        new()
        {
            EventType = eventType,
            ActorUserId = actorId,
            ActorUserName = actorId,
            ExplicitActor = explicitActor,
            TenantId = tenantId ?? Guid.Empty,
            WorkspaceId = workspaceId ?? Guid.Empty,
            DataJson = JsonSerializer.Serialize(payload)
        };

    public static Task LogAsync(
        IAuditService auditService,
        string eventType,
        string actorId,
        object payload,
        CancellationToken cancellationToken,
        Guid? tenantId = null,
        Guid? workspaceId = null,
        bool explicitActor = false) =>
        auditService.LogAsync(
            Create(eventType, actorId, payload, tenantId, workspaceId, explicitActor),
            cancellationToken);

    public static Task LogIdentityEventAsync(
        IAuditService auditService,
        string eventType,
        string actorId,
        object payload,
        CancellationToken cancellationToken,
        Guid? tenantId = null,
        Guid? workspaceId = null) =>
        LogAsync(
            auditService,
            eventType,
            actorId,
            payload,
            cancellationToken,
            tenantId,
            workspaceId,
            explicitActor: true);
}
