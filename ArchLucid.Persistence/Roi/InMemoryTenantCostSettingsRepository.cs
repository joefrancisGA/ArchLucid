using System.Collections.Concurrent;

namespace ArchLucid.Persistence.Roi;

public sealed class InMemoryTenantCostSettingsRepository : ITenantCostSettingsRepository
{
    private readonly ConcurrentDictionary<Guid, TenantCostSettingsRecord> _rows = new();

    public Task<TenantCostSettingsRecord?> TryGetAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        _rows.TryGetValue(tenantId, out TenantCostSettingsRecord? row);

        return Task.FromResult(row);
    }

    public Task UpsertAsync(TenantCostSettingsRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);
        cancellationToken.ThrowIfCancellationRequested();

        TenantCostSettingsRecord copy = new()
        {
            TenantId = record.TenantId,
            ArchitectHourlyRateUsd = record.ArchitectHourlyRateUsd,
            AverageIncidentCostUsd = record.AverageIncidentCostUsd,
            UpdatedUtc = record.UpdatedUtc,
            UpdatedByActorId = record.UpdatedByActorId,
        };

        _rows[record.TenantId] = copy;

        return Task.CompletedTask;
    }
}
