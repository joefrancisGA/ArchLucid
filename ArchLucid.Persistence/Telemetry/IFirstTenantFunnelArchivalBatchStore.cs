namespace ArchLucid.Persistence.Telemetry;

/// <summary>Reads and deletes aged funnel rows for blob archival.</summary>
public interface IFirstTenantFunnelArchivalBatchStore
{
    Task<IReadOnlyList<FirstTenantFunnelArchiveRow>> TakeRowsOlderThanAsync(
        int retentionDays,
        int maxRows,
        CancellationToken ct);

    Task DeleteByEventIdsAsync(IReadOnlyList<long> eventIds, CancellationToken ct);
}
