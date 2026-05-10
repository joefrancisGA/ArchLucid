namespace ArchLucid.Persistence.Pilots;

/// <summary>Non-relational modes: deterministic empty aggregates so callers do not probe SQL topology.</summary>
public sealed class NullPilotReportCardMetricsReader : IPilotReportCardMetricsReader
{
    public Task<PilotReportCardScopeMetrics> ReadAsync(Guid tenantId, Guid workspaceId, Guid scopeProjectId,
        CancellationToken cancellationToken)
    {
        _ = tenantId;
        _ = workspaceId;
        _ = scopeProjectId;
        PilotReportCardScopeMetrics empty =
            new()
            {
                FindingsBySeverity = [],
            };

        return Task.FromResult(empty);
    }
}
