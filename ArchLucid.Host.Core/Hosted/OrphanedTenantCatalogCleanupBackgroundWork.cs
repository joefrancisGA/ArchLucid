using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Shared orphaned-catalog purge pass for <see cref="OrphanedTenantCleanupHostedService" />.
/// </summary>
public static class OrphanedTenantCatalogCleanupBackgroundWork
{
    /// <summary>Purges up to <see cref="OrphanedTenantCatalogCleanupOptions.MaxCatalogsPerHour" /> eligible tenants per pass.</summary>
    public static async Task RunSinglePassAsync(
        IServiceScopeFactory scopeFactory,
        IOptionsMonitor<OrphanedTenantCatalogCleanupOptions> optionsMonitor,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scopeFactory);
        ArgumentNullException.ThrowIfNull(optionsMonitor);
        ArgumentNullException.ThrowIfNull(logger);

        OrphanedTenantCatalogCleanupOptions opts = optionsMonitor.CurrentValue;

        if (!opts.Enabled)
            return;

        try
        {
            using IServiceScope scope = scopeFactory.CreateScope();
            ITenantRepository tenants = scope.ServiceProvider.GetRequiredService<ITenantRepository>();
            ITenantDeletionService deletion = scope.ServiceProvider.GetRequiredService<ITenantDeletionService>();
            TimeProvider clock = scope.ServiceProvider.GetRequiredService<TimeProvider>();

            DateTimeOffset utcNow = clock.GetUtcNow();
            int retentionDays = Math.Clamp(opts.RetentionDays, 1, 365);
            int take = Math.Clamp(opts.MaxCatalogsPerHour, 1, 100);
            DateTimeOffset erasureRequestedOnOrBefore = utcNow.AddDays(-retentionDays);

            IReadOnlyList<Guid> ids = await tenants.ListTenantIdsForOrphanedCatalogCleanupAsync(
                utcNow,
                erasureRequestedOnOrBefore,
                take,
                cancellationToken);

            foreach (Guid tenantId in ids)
            {
                TenantRecord? row = await tenants.GetByIdAsync(tenantId, cancellationToken);

                if (row?.TenantErasureApprovedUtc is null)
                    continue;

                if (row.TenantErasureRequestedUtc is null || row.TenantErasureRequestedUtc > erasureRequestedOnOrBefore)
                    continue;

                if (row.LegalHoldUntilUtc is { } hold && hold > utcNow)
                    continue;

                await deletion.DeleteTenantAsync(
                    tenantId,
                    new TenantDeletionInvocation
                    {
                        ActorUserId = "system:orphaned-tenant-catalog-cleanup",
                        ActorUserName = "orphaned-tenant-catalog-cleanup",
                        CorrelationId = null
                    },
                    cancellationToken);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            if (logger.IsEnabled(LogLevel.Error))
                logger.LogError(ex, "Orphaned tenant catalog cleanup pass failed.");
        }
    }
}
