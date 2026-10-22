using ArchLucid.Contracts.Operations;

namespace ArchLucid.Persistence.Tenancy.Diagnostics;

/// <summary>SQL-backed counts for trial funnel Prometheus gauges (no HTTP context).</summary>
public interface ITrialFunnelOperationalMetricsReader
{
    Task<long> CountActiveSelfServiceTrialsAsync(CancellationToken cancellationToken = default);

    Task<TrialFunnelOperationalSummaryResponse> GetOperationalSummaryAsync(
        int periodDays = 30,
        bool comparePreviousPeriod = false,
        CancellationToken cancellationToken = default);
}
