using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Wave-13 suggestion 128: append-only audit rows for authority lifecycle transitions.
/// </summary>
public static class AuthorityRunLifecycleTransitionAuditor
{
    public static AuditEvent BuildTransitionEvent(
        ScopeContext scope,
        Guid runId,
        AuthorityRunLifecyclePhase fromPhase,
        AuthorityRunLifecyclePhase toPhase,
        string reason,
        string? actorUserId = null,
        string? correlationId = null)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(reason);

        return new AuditEvent
        {
            EventType = AuditEventTypes.Run.LifecycleTransition,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runId,
            ActorUserId = actorUserId ?? string.Empty,
            DataJson = JsonSerializer.Serialize(new
            {
                runId = runId.ToString("N"),
                fromPhase = fromPhase.ToString(),
                toPhase = toPhase.ToString(),
                reason,
                correlationId,
            }),
        };
    }
}
