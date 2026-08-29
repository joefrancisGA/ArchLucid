using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class SqlTenantSqlCatalogProvisioner
{
    public async Task ProvisionTenantCatalogAsync(
        Guid tenantId,
        string sqlLogicalDatabaseName,
        CancellationToken cancellationToken)
    {
        SqlTopologyOptions snapshot = _topologyOptions.CurrentValue;

        if (snapshot.Mode != SqlTopologyMode.SystemWithPerTenantCatalogs)
            return;

        try
        {
            string effectiveLogicalName = sqlLogicalDatabaseName.Trim();
            WarmTenantCatalogStandbyRecord? claimedStandby = null;

            if (_warmCatalogOptions.CurrentValue.Enabled)
            {
                claimedStandby = await _warmStandbyRepository.TryClaimOldestUnclaimedAsync(cancellationToken);

                if (claimedStandby is not null)
                    effectiveLogicalName = claimedStandby.SqlLogicalDatabaseName.Trim();
            }

            await _bindingRepository.UpsertPendingAsync(tenantId, effectiveLogicalName, cancellationToken);

            if (string.IsNullOrWhiteSpace(snapshot.TenantCatalogConnectionStringTemplate))
                throw new InvalidOperationException(
                    "ArchLucid:SqlTopology:TenantCatalogConnectionStringTemplate is required when provisioning tenant catalogs.");

            string tenantConnectionString = SqlTenantCatalogConnectionStringFactory.FromTemplate(
                snapshot.TenantCatalogConnectionStringTemplate.Trim(),
                effectiveLogicalName);

            if (DatabaseMigrator.IsTenantUpgradeRequired(tenantConnectionString))
                DatabaseMigrator.RunTenant(tenantConnectionString);
            else if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation(
                    "Skipping RunTenant for tenant {TenantId}; warm catalog schema is current ({Database}).",
                    tenantId,
                    effectiveLogicalName);

            await MirrorTenantRowFromSystemAsync(tenantId, tenantConnectionString, cancellationToken);
            await _bindingRepository.MarkActiveAsync(tenantId, cancellationToken);

            if (claimedStandby is not null)
                await _warmStandbyRepository.MarkClaimedAsync(claimedStandby.StandbyId, cancellationToken);

            _tenantDatabaseResolver.InvalidateCachedTenantConnectionString(tenantId);
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Error))
                _logger.LogError(ex, "Tenant catalog provisioning failed for tenant {TenantId}.", tenantId);

            await _bindingRepository.MarkFailedAsync(tenantId, ex.Message, cancellationToken);

            throw;
        }
    }
}
