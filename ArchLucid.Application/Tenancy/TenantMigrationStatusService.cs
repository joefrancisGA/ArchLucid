using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy;

public sealed class TenantMigrationStatusService(
    ITenantCatalogMigrationRepository migrationRepository,
    ITenantRepository tenantRepository) : ITenantMigrationStatusService
{
    private readonly ITenantCatalogMigrationRepository _migrationRepository =
        migrationRepository ?? throw new ArgumentNullException(nameof(migrationRepository));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

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

        TenantRecord? tenant =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenant?.OffboardedUtc is not null)
        {
            return new TenantMigrationStatusSnapshot { InMigration = false };
        }

        return new TenantMigrationStatusSnapshot
        {
            InMigration = true,
            Message = string.IsNullOrWhiteSpace(active.MaintenanceMessage)
                ? null
                : active.MaintenanceMessage.Trim(),
            CorrelationId = string.IsNullOrWhiteSpace(active.CorrelationId)
                ? null
                : active.CorrelationId.Trim(),
            Stage = active.Stage.ToString(),
            MigrationId = active.MigrationId,
            LastVerificationError = string.IsNullOrWhiteSpace(active.LastVerificationError)
                ? null
                : active.LastVerificationError.Trim(),
        };
    }
}
