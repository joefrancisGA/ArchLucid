namespace ArchLucid.Persistence.Telemetry;

/// <summary>No-op batch store when funnel SQL archival is not used (InMemory storage).</summary>
public sealed class NoOpFirstTenantFunnelArchivalBatchStore : IFirstTenantFunnelArchivalBatchStore
{
    /// <inheritdoc />
    public Task<IReadOnlyList<FirstTenantFunnelArchiveRow>> TakeRowsOlderThanAsync(
        int retentionDays,
        int maxRows,
        CancellationToken ct)
    {
        return Task.FromResult<IReadOnlyList<FirstTenantFunnelArchiveRow>>([]);
    }

    /// <inheritdoc />
    public Task DeleteByEventIdsAsync(IReadOnlyList<long> eventIds, CancellationToken ct)
    {
        if (eventIds is null)
            throw new ArgumentNullException(nameof(eventIds));

        return Task.CompletedTask;
    }
}
