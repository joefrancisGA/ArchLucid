using ArchLucid.Contracts.Operations;

namespace ArchLucid.Persistence.Tenancy.Diagnostics;

/// <summary>In-memory storage: always zero active trials for gauge wiring in tests.</summary>
public sealed class InMemoryTrialFunnelOperationalMetricsReader : ITrialFunnelOperationalMetricsReader
{
    public Task<long> CountActiveSelfServiceTrialsAsync(CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;

        return Task.FromResult(0L);
    }

    public Task<TrialFunnelOperationalSummaryResponse> GetOperationalSummaryAsync(
        int periodDays = 30,
        bool comparePreviousPeriod = false,
        CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;
        _ = periodDays;
        _ = comparePreviousPeriod;

        return Task.FromResult(TrialFunnelOperationalSummaryBuilder.BuildEmpty(0, periodDays, comparePreviousPeriod));
    }
}
