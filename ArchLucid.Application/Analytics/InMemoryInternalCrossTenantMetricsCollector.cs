using ArchLucid.Core.Analytics;

namespace ArchLucid.Application.Analytics;

/// <summary>Returns no tenant metrics in InMemory hosts (rollup APIs return empty sets).</summary>
public sealed class InMemoryInternalCrossTenantMetricsCollector : IInternalCrossTenantMetricsCollector
{
    /// <inheritdoc />
    public Task<IReadOnlyList<InternalCrossTenantTenantRunMetrics>> CollectTenantMetricsAsync(
        DateOnly rollupDate,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IReadOnlyList<InternalCrossTenantTenantRunMetrics>>([]);
    }
}
