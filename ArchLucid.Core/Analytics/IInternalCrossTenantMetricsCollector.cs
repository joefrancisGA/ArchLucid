namespace ArchLucid.Core.Analytics;

/// <summary>Collects per-tenant BI-safe counters from tenant catalogs (in-process tenant ids only).</summary>
public interface IInternalCrossTenantMetricsCollector
{
    Task<IReadOnlyList<InternalCrossTenantTenantRunMetrics>> CollectTenantMetricsAsync(
        DateOnly rollupDate,
        CancellationToken cancellationToken = default);
}
