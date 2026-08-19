using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Shared eligible purge pass for <see cref="TenantErasureEligiblePurgeHostedService" /> and API-hosted
///     <see cref="ArchLucid.Api.Workers.TenantErasurePurgeWorker" />.
/// </summary>
public static class TenantErasureEligiblePurgeBackgroundWork
{
    /// <summary>When enabled, hard-purges tenants past erasure eligibility (still honoring legal hold in SQL list).</summary>
    public static async Task RunSinglePassAsync(
        IServiceScopeFactory scopeFactory,
        IOptionsMonitor<TenantErasurePurgeOptions> optionsMonitor,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scopeFactory);
        ArgumentNullException.ThrowIfNull(optionsMonitor);
        ArgumentNullException.ThrowIfNull(logger);

        TenantErasurePurgeOptions opts = optionsMonitor.CurrentValue;

        if (!opts.Enabled)
            return;

        try
        {
            using IServiceScope scope = scopeFactory.CreateScope();
            ITenantRepository tenants = scope.ServiceProvider.GetRequiredService<ITenantRepository>();
            ITenantDeletionService deletion = scope.ServiceProvider.GetRequiredService<ITenantDeletionService>();
            TimeProvider clock = scope.ServiceProvider.GetRequiredService<TimeProvider>();

            DateTimeOffset utcNow = clock.GetUtcNow();
            int batch = Math.Clamp(opts.BatchSize, 1, 100);

            IReadOnlyList<Guid> ids =
                await tenants.ListTenantIdsEligibleForScheduledHardPurgeAsync(utcNow, batch, cancellationToken);

            foreach (Guid tenantId in ids)
            {
                TenantRecord? row = await tenants.GetByIdAsync(tenantId, cancellationToken);

                if (!TenantErasureEligibility.IsEligibleForScheduledHardPurge(row, utcNow))
                    continue;

                await deletion.DeleteTenantAsync(
                    tenantId,
                    new TenantDeletionInvocation
                    {
                        ActorUserId = "system:tenant-erasure-purge",
                        ActorUserName = "tenant-erasure-eligible-purge",
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
                logger.LogError(ex, "Tenant erasure eligible purge pass failed.");
        }
    }
}
