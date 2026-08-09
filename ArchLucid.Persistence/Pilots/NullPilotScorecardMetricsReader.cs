namespace ArchLucid.Persistence.Pilots;

/// <summary>
///     Optional zero stub for hosts that intentionally omit scorecard aggregates.
///     InMemory DI registers <see cref="RunRepositoryPilotScorecardMetricsReader"/> instead.
/// </summary>
public sealed class NullPilotScorecardMetricsReader : IPilotScorecardMetricsReader
{
    public Task<PilotScorecardTenantMetrics> GetAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        _ = tenantId;
        _ = cancellationToken;

        return Task.FromResult(
            new PilotScorecardTenantMetrics
            {
                TotalRunsCommitted = 0,
                TotalManifestsCreated = 0,
                TotalFindingsResolved = 0,
                AverageTimeToManifestMinutes = null,
                TotalAuditEventsGenerated = 0,
                TotalGovernanceApprovalsCompleted = 0,
                FirstCommitUtc = null
            });
    }
}
