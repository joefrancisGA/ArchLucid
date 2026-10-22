namespace ArchLucid.Persistence.Orchestration;

/// <summary>
///     Shared authority pipeline work outbox rules used by Dapper and in-memory
///     <see cref="IAuthorityPipelineWorkRepository" /> implementations.
/// </summary>
public static class AuthorityPipelineWorkRepositoryCore
{
    public const int MaxDequeueBatch = 100;
    public const int MinLeaseDurationSeconds = 60;
    public const int MaxLeaseDurationSeconds = 7200;

    public static int ClampDequeueBatch(int maxBatch) => Math.Clamp(maxBatch, 1, MaxDequeueBatch);

    public static int ClampLeaseDurationSeconds(int leaseDurationSeconds) =>
        Math.Clamp(leaseDurationSeconds, MinLeaseDurationSeconds, MaxLeaseDurationSeconds);

    public static DateTime NormalizeUtc(DateTime value) =>
        value.Kind is DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
            : value.ToUniversalTime();

    /// <summary>
    ///     Mirrors SQL dequeue ordering: interleave tenants by per-tenant FIFO rank, then TenantId, CreatedUtc, OutboxId.
    /// </summary>
    public static List<T> TenantRoundRobinEligibleBatch<T>(
        IEnumerable<T> eligibleEnumerable,
        int take,
        Func<T, Guid> tenantIdSelector,
        Func<T, DateTime> createdUtcSelector,
        Func<T, Guid> outboxIdSelector)
    {
        ArgumentNullException.ThrowIfNull(eligibleEnumerable);
        ArgumentNullException.ThrowIfNull(tenantIdSelector);
        ArgumentNullException.ThrowIfNull(createdUtcSelector);
        ArgumentNullException.ThrowIfNull(outboxIdSelector);

        List<T> eligible = eligibleEnumerable.ToList();

        return eligible
            .GroupBy(tenantIdSelector)
            .SelectMany(
                grp => grp
                    .OrderBy(createdUtcSelector)
                    .ThenBy(outboxIdSelector)
                    .Select((row, index) => (Row: row, TenantSeq: index + 1)))
            .OrderBy(x => x.TenantSeq)
            .ThenBy(x => tenantIdSelector(x.Row))
            .ThenBy(x => createdUtcSelector(x.Row))
            .ThenBy(x => outboxIdSelector(x.Row))
            .Take(take)
            .Select(x => x.Row)
            .ToList();
    }
}
