using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Integrations;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

internal static class ExternalTicketConnectorSupport
{
    internal static AuditEvent SkippedAudit(string eventType, ScopeContext scope, FindingInspectResponse inspect, string reason)
    {
        return new AuditEvent
        {
            EventType = eventType,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = inspect.RunId,
            DataJson = System.Text.Json.JsonSerializer.Serialize(new { findingId = inspect.FindingId, reason })
        };
    }

    internal static async Task<Guid?> ResolveFindingRecordIdForInspectAsync(
        IItsmFindingCorrelationRepository correlations,
        ScopeContext scope,
        FindingInspectResponse inspect,
        CancellationToken ct)
    {
        if (inspect.RunId == Guid.Empty)
            return null;

        return await correlations
            .TryResolveFindingRecordIdForRunFindingAsync(scope.TenantId, inspect.RunId, inspect.FindingId, ct)
            .ConfigureAwait(false);
    }
}
