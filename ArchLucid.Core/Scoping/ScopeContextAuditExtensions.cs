using ArchLucid.Core.Audit;

namespace ArchLucid.Core.Scoping;

/// <summary>
///     Factory helpers for <see cref="AuditEvent" /> scoped to the current tenant, workspace, and project.
/// </summary>
public static class ScopeContextAuditExtensions
{
    /// <summary>
    ///     Creates an <see cref="AuditEvent" /> with <see cref="AuditEvent.TenantId" />, <see cref="AuditEvent.WorkspaceId" />,
    ///     and <see cref="AuditEvent.ProjectId" /> taken from <paramref name="scope" />. <see cref="AuditEvent.DataJson" />
    ///     defaults to <c>"{}"</c> when <paramref name="dataJson" /> is null or whitespace.
    /// </summary>
    public static AuditEvent CreateAuditEvent(
        this ScopeContext scope,
        string eventType,
        string actorId,
        string actorName,
        string? dataJson = null)
    {
        if (scope is null)
            throw new ArgumentNullException(nameof(scope));

        return new AuditEvent
        {
            EventType = eventType,
            ActorUserId = actorId,
            ActorUserName = actorName,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            DataJson = string.IsNullOrWhiteSpace(dataJson) ? "{}" : dataJson,
        };
    }
}
