using System.Collections.Concurrent;

using ArchLucid.Core.AiUsage;

namespace ArchLucid.Persistence.AiUsage;

public sealed class InMemoryAiUsageEventRepository : IAiUsageEventRepository
{
    private readonly ConcurrentBag<AiUsageEventRecord> _events = [];

    public Task InsertAsync(AiUsageEventRecord record, CancellationToken cancellationToken = default)
    {
        _events.Add(record);

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<AiUsageEventRecord>> ListRecentForTenantAsync(
        Guid tenantId,
        int limit,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<AiUsageEventRecord> rows = _events
            .Where(e => e.TenantId == tenantId)
            .OrderByDescending(e => e.OccurredUtc)
            .Take(Math.Max(1, limit))
            .ToList();

        return Task.FromResult(rows);
    }

    public Task<IReadOnlyDictionary<AiUsageFeature, decimal>> SumEstimatedCostByFeatureAsync(
        Guid tenantId,
        DateTimeOffset fromUtc,
        CancellationToken cancellationToken = default)
    {
        Dictionary<AiUsageFeature, decimal> grouped = _events
            .Where(e => e.TenantId == tenantId && e.OccurredUtc >= fromUtc && !e.BudgetBlocked && !e.ServedFromDemoCache)
            .GroupBy(e => e.Feature)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.EstimatedCostUsd));

        return Task.FromResult<IReadOnlyDictionary<AiUsageFeature, decimal>>(grouped);
    }
}
