using System.Collections.Concurrent;

using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.Tenancy;

public sealed class InMemoryTenantCatalogMigrationRepository : ITenantCatalogMigrationRepository
{
    private readonly ConcurrentDictionary<Guid, TenantCatalogMigrationRecord> _byId = new();
    private readonly Lock _gate = new();

    public Task<TenantCatalogMigrationRecord?> GetActiveByTenantIdAsync(Guid tenantId, CancellationToken ct)
    {
        _ = ct;

        lock (_gate)
        {
            TenantCatalogMigrationRecord? active = _byId.Values
                .Where(record => record.TenantId == tenantId && record.IsActive)
                .OrderByDescending(record => record.StartedUtc)
                .FirstOrDefault();

            return Task.FromResult(active);
        }
    }

    public Task<TenantCatalogMigrationRecord?> GetByIdAsync(Guid migrationId, CancellationToken ct)
    {
        _ = ct;

        lock (_gate)
        {
            _byId.TryGetValue(migrationId, out TenantCatalogMigrationRecord? record);

            return Task.FromResult(record);
        }
    }

    public Task InsertAsync(TenantCatalogMigrationRecord record, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(record);
        _ = ct;

        lock (_gate)
        {
            _byId[record.MigrationId] = record;
        }

        return Task.CompletedTask;
    }

    public Task UpdateStageAsync(Guid migrationId, TenantCatalogMigrationStage stage, CancellationToken ct)
    {
        _ = ct;

        lock (_gate)
        {
            if (_byId.TryGetValue(migrationId, out TenantCatalogMigrationRecord? existing))
            {
                _byId[migrationId] = Clone(existing, stage: stage);
            }
        }

        return Task.CompletedTask;
    }

    public Task MarkVerificationResultAsync(
        Guid migrationId,
        bool passed,
        string? errorMessage,
        DateTimeOffset utcNow,
        CancellationToken ct)
    {
        _ = ct;

        lock (_gate)
        {
            if (_byId.TryGetValue(migrationId, out TenantCatalogMigrationRecord? existing))
            {
                _byId[migrationId] = Clone(
                    existing,
                    verificationPassedUtc: passed ? utcNow : null,
                    lastVerificationError: passed ? null : errorMessage,
                    stage: TenantCatalogMigrationStage.Verification);
            }
        }

        return Task.CompletedTask;
    }

    public Task CompleteAsync(Guid migrationId, DateTimeOffset completedUtc, CancellationToken ct)
    {
        _ = ct;

        lock (_gate)
        {
            if (_byId.TryGetValue(migrationId, out TenantCatalogMigrationRecord? existing))
            {
                _byId[migrationId] = Clone(
                    existing,
                    completedUtc: completedUtc,
                    stage: TenantCatalogMigrationStage.Complete);
            }
        }

        return Task.CompletedTask;
    }

    private static TenantCatalogMigrationRecord Clone(
        TenantCatalogMigrationRecord record,
        TenantCatalogMigrationStage? stage = null,
        DateTimeOffset? completedUtc = null,
        DateTimeOffset? verificationPassedUtc = null,
        string? lastVerificationError = null) =>
        new()
        {
            MigrationId = record.MigrationId,
            TenantId = record.TenantId,
            CorrelationId = record.CorrelationId,
            Stage = stage ?? record.Stage,
            StartedUtc = record.StartedUtc,
            CompletedUtc = completedUtc ?? record.CompletedUtc,
            MaintenanceMessage = record.MaintenanceMessage,
            VerificationPassedUtc = verificationPassedUtc ?? record.VerificationPassedUtc,
            LastVerificationError = lastVerificationError ?? record.LastVerificationError,
        };
}
