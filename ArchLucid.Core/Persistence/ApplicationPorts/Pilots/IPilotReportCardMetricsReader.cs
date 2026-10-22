namespace ArchLucid.Persistence.Pilots;

/// <summary>Scope-scoped SQL aggregates powering <c>GET /v1/pilots/report-card</c>.</summary>
public interface IPilotReportCardMetricsReader
{
    Task<PilotReportCardScopeMetrics> ReadAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid scopeProjectId,
        CancellationToken cancellationToken);
}
