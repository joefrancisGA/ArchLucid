using ArchLucid.Core.Metering;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>
///     Shared usage-event repository rules used by SQL and in-memory <see cref="IUsageEventRepository" /> implementations.
/// </summary>
internal static class UsageEventRepositoryCore
{
    public const int MinListTake = 1;

    public static int ClampListTake(int take) => Math.Max(MinListTake, take);

    public static bool MatchesTenantPeriod(
        UsageEvent usageEvent,
        Guid tenantId,
        DateTimeOffset periodStart,
        DateTimeOffset periodEnd)
    {
        ArgumentNullException.ThrowIfNull(usageEvent);

        return usageEvent.TenantId == tenantId
               && usageEvent.RecordedUtc >= periodStart
               && usageEvent.RecordedUtc < periodEnd;
    }

    public static bool MatchesKindFilter(UsageEvent usageEvent, UsageMeterKind? kindFilter)
    {
        ArgumentNullException.ThrowIfNull(usageEvent);

        return !kindFilter.HasValue || usageEvent.Kind == kindFilter.Value;
    }

    public static bool IsDuplicateIdempotencyKey(
        IEnumerable<UsageEvent> existingEvents,
        UsageEvent candidate)
    {
        ArgumentNullException.ThrowIfNull(existingEvents);
        ArgumentNullException.ThrowIfNull(candidate);

        if (string.IsNullOrWhiteSpace(candidate.IdempotencyKey))
            return false;

        return existingEvents.Any(existing =>
            existing.TenantId == candidate.TenantId
            && string.Equals(existing.IdempotencyKey, candidate.IdempotencyKey, StringComparison.Ordinal));
    }

    public static List<UsageEvent> SelectDistinctIdempotencyKeysForBatchInsert(IReadOnlyList<UsageEvent> events)
    {
        ArgumentNullException.ThrowIfNull(events);

        List<UsageEvent> selected = new(events.Count);
        HashSet<(Guid TenantId, string IdempotencyKey)> seenKeys = new();

        foreach (UsageEvent usageEvent in events)
        {
            if (!string.IsNullOrWhiteSpace(usageEvent.IdempotencyKey))
            {
                (Guid TenantId, string IdempotencyKey) key = (usageEvent.TenantId, usageEvent.IdempotencyKey);

                if (!seenKeys.Add(key))
                    continue;
            }

            selected.Add(usageEvent);
        }

        return selected;
    }

    public static IReadOnlyList<TenantUsageSummary> AggregateByKind(
        IEnumerable<UsageEvent> events,
        Guid tenantId,
        DateTimeOffset periodStart,
        DateTimeOffset periodEnd)
    {
        ArgumentNullException.ThrowIfNull(events);

        return events
            .Where(e => MatchesTenantPeriod(e, tenantId, periodStart, periodEnd))
            .GroupBy(static e => e.Kind)
            .Select(g => new TenantUsageSummary
            {
                TenantId = tenantId,
                Kind = g.Key,
                TotalQuantity = g.Sum(static x => x.Quantity),
                PeriodStartUtc = periodStart,
                PeriodEndUtc = periodEnd,
            })
            .ToList();
    }

    public static IReadOnlyList<UsageEvent> ListInPeriod(
        IEnumerable<UsageEvent> events,
        Guid tenantId,
        DateTimeOffset periodStart,
        DateTimeOffset periodEnd,
        UsageMeterKind? kindFilter,
        int take)
    {
        ArgumentNullException.ThrowIfNull(events);

        IEnumerable<UsageEvent> query = events.Where(e => MatchesTenantPeriod(e, tenantId, periodStart, periodEnd));

        if (kindFilter.HasValue)
            query = query.Where(e => e.Kind == kindFilter.Value);

        return query
            .OrderByDescending(static e => e.RecordedUtc)
            .Take(ClampListTake(take))
            .ToList();
    }
}
