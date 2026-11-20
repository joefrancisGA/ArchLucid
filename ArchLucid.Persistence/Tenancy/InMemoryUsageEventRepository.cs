using System.Collections.Concurrent;

using ArchLucid.Core.Metering;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>In-memory usage events for tests and <c>InMemory</c> storage mode.</summary>
public sealed class InMemoryUsageEventRepository : IUsageEventRepository
{
    private readonly Lock _writeGate = new();
    private readonly ConcurrentBag<UsageEvent> _events = [];

    public Task InsertAsync(UsageEvent usageEvent, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(usageEvent);
        ct.ThrowIfCancellationRequested();

        lock (_writeGate)
        {
            ct.ThrowIfCancellationRequested();

            if (UsageEventRepositoryCore.IsDuplicateIdempotencyKey(_events, usageEvent))
                return Task.CompletedTask;

            _events.Add(usageEvent);
        }

        return Task.CompletedTask;
    }

    public Task InsertBatchAsync(IReadOnlyList<UsageEvent> events, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(events);
        ct.ThrowIfCancellationRequested();

        lock (_writeGate)
        {
            ct.ThrowIfCancellationRequested();

            foreach (UsageEvent usageEvent in events)
            {
                if (UsageEventRepositoryCore.IsDuplicateIdempotencyKey(_events, usageEvent))
                    continue;

                _events.Add(usageEvent);
            }
        }

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<TenantUsageSummary>> AggregateByKindAsync(
        Guid tenantId,
        DateTimeOffset periodStart,
        DateTimeOffset periodEnd,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        IReadOnlyList<TenantUsageSummary> summaries =
            UsageEventRepositoryCore.AggregateByKind(_events, tenantId, periodStart, periodEnd);

        return Task.FromResult(summaries);
    }

    public Task<IReadOnlyList<UsageEvent>> ListAsync(
        Guid tenantId,
        DateTimeOffset periodStart,
        DateTimeOffset periodEnd,
        UsageMeterKind? kindFilter,
        int take,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        IReadOnlyList<UsageEvent> list = UsageEventRepositoryCore.ListInPeriod(
            _events,
            tenantId,
            periodStart,
            periodEnd,
            kindFilter,
            take);

        return Task.FromResult(list);
    }
}
