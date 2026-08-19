namespace ArchLucid.Core.Analytics;

/// <summary>System-catalog persistence for pseudonymized daily cross-tenant rollups.</summary>
public interface IInternalCrossTenantRollupRepository
{
    Task UpsertDailyRowsAsync(
        IReadOnlyList<InternalCrossTenantRollupDailyRow> rows,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<InternalCrossTenantRollupDailyRow>> ListDailyRowsAsync(
        DateOnly rollupDate,
        CancellationToken cancellationToken = default);
}
