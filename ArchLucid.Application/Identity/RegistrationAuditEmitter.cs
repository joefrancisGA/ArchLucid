using System.Text.Json;

using ArchLucid.Core.Audit;

namespace ArchLucid.Application.Identity;

/// <summary>
///     Audit event construction and emission for public tenant self-registration.
/// </summary>
public static class RegistrationAuditEmitter
{
    public static string ResolveActorDisplayName(string actorEmail, string? adminDisplayName) =>
        string.IsNullOrWhiteSpace(adminDisplayName) ? actorEmail : adminDisplayName.Trim();

    public static AuditEvent Create(
        string eventType,
        string actorUserId,
        string actorUserName,
        object payload,
        Guid tenantId = default,
        Guid workspaceId = default,
        Guid projectId = default) =>
        new()
        {
            EventType = eventType,
            ActorUserId = actorUserId,
            ActorUserName = actorUserName,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            DataJson = JsonSerializer.Serialize(payload)
        };

    public static Task LogAsync(
        IAuditService auditService,
        string eventType,
        string actorUserId,
        string actorUserName,
        object payload,
        CancellationToken cancellationToken,
        Guid tenantId = default,
        Guid workspaceId = default,
        Guid projectId = default) =>
        auditService.LogAsync(
            Create(eventType, actorUserId, actorUserName, payload, tenantId, workspaceId, projectId),
            cancellationToken);

    public static Task LogTrialRegistrationFailedAsync(
        IAuditService auditService,
        string actorUserId,
        string actorUserName,
        object payload,
        CancellationToken cancellationToken) =>
        LogAsync(
            auditService,
            AuditEventTypes.TrialRegistrationFailed,
            actorUserId,
            actorUserName,
            payload,
            cancellationToken);

    public static Task LogTrialSignupAttemptedAsync(
        IAuditService auditService,
        string actorUserId,
        string actorUserName,
        CancellationToken cancellationToken) =>
        LogAsync(
            auditService,
            AuditEventTypes.TrialSignupAttempted,
            actorUserId,
            actorUserName,
            new { channel = "api_register" },
            cancellationToken);

    public static Task LogTenantSelfRegisteredAsync(
        IAuditService auditService,
        string actorUserId,
        string actorUserName,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        object payload,
        CancellationToken cancellationToken) =>
        LogAsync(
            auditService,
            AuditEventTypes.TenantSelfRegistered,
            actorUserId,
            actorUserName,
            payload,
            cancellationToken,
            tenantId,
            workspaceId,
            projectId);

    public static Task LogTrialBaselineReviewCycleCapturedAsync(
        IAuditService auditService,
        string actorUserId,
        string actorUserName,
        Guid tenantId,
        object payload,
        CancellationToken cancellationToken) =>
        LogAsync(
            auditService,
            AuditEventTypes.TrialBaselineReviewCycleCaptured,
            actorUserId,
            actorUserName,
            payload,
            cancellationToken,
            tenantId);
}
