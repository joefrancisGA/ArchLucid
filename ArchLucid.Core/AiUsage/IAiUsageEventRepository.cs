namespace ArchLucid.Core.AiUsage;

public interface IAiUsageEventRepository
{
    Task InsertAsync(AiUsageEventRecord record, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AiUsageEventRecord>> ListRecentForTenantAsync(
        Guid tenantId,
        int limit,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyDictionary<AiUsageFeature, decimal>> SumEstimatedCostByFeatureAsync(
        Guid tenantId,
        DateTimeOffset fromUtc,
        CancellationToken cancellationToken = default);
}
