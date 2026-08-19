using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy;

public sealed class TenantMigrationStatusService(ITenantCatalogMigrationRepository migrationRepository)
    : ITenantMigrationStatusService
{
    private readonly ITenantCatalogMigrationRepository _migrationRepository =
        migrationRepository ?? throw new ArgumentNullException(nameof(migrationRepository));

    public async Task<TenantMigrationStatusSnapshot> GetForTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        TenantCatalogMigrationRecord? active =
            await _migrationRepository.GetActiveByTenantIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (active is null)
        {
            return new TenantMigrationStatusSnapshot { InMigration = false };
        }

        return new TenantMigrationStatusSnapshot
        {
            InMigration = true,
            Message = active.MaintenanceMessage,
            CorrelationId = active.CorrelationId,
            Stage = active.Stage.ToString(),
            MigrationId = active.MigrationId,
            LastVerificationError = active.LastVerificationError,
        };
    }
}
