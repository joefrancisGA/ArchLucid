namespace ArchLucid.Core.Tenancy;

/// <summary>Persistence for <c>dbo.TenantCatalogMigrations</c>.</summary>
public interface ITenantCatalogMigrationRepository
{
    Task<TenantCatalogMigrationRecord?> GetActiveByTenantIdAsync(Guid tenantId, CancellationToken ct);

    Task<TenantCatalogMigrationRecord?> GetByIdAsync(Guid migrationId, CancellationToken ct);

    Task InsertAsync(TenantCatalogMigrationRecord record, CancellationToken ct);

    Task UpdateStageAsync(Guid migrationId, TenantCatalogMigrationStage stage, CancellationToken ct);

    Task MarkVerificationResultAsync(
        Guid migrationId,
        bool passed,
        string? errorMessage,
        DateTimeOffset utcNow,
        CancellationToken ct);

    Task CompleteAsync(Guid migrationId, DateTimeOffset completedUtc, CancellationToken ct);
}
