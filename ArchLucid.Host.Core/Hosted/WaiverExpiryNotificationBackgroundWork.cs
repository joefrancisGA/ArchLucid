using ArchLucid.Application.Governance;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Single fleet-wide waiver expiry pass shared by <see cref="WaiverExpiryNotificationHostedService" /> (TB-2193).</summary>
public static class WaiverExpiryNotificationBackgroundWork
{
    public static async Task RunSinglePassAsync(
        IServiceScopeFactory scopeFactory,
        IOptionsMonitor<WaiverExpiryNotificationOptions> optionsMonitor,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scopeFactory);
        ArgumentNullException.ThrowIfNull(optionsMonitor);
        ArgumentNullException.ThrowIfNull(logger);

        if (!optionsMonitor.CurrentValue.Enabled)
            return;

        using IServiceScope scope = scopeFactory.CreateScope();
        ITenantRepository tenants = scope.ServiceProvider.GetRequiredService<ITenantRepository>();

        IWaiverExpiryNotificationService notificationService =
            scope.ServiceProvider.GetRequiredService<IWaiverExpiryNotificationService>();

        IReadOnlyList<TenantRecord> rows = await tenants.ListAsync(cancellationToken).ConfigureAwait(false);

        foreach (TenantRecord tenant in rows)
        {
            if (cancellationToken.IsCancellationRequested)
                break;

            if (tenant.SuspendedUtc is not null)
                continue;

            try
            {
                await notificationService
                    .RunTenantPassAsync(tenant.Id, cancellationToken)
                    .ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                // One tenant's failure must not stop the fleet-wide pass; the next tenant still gets scanned.
                if (logger.IsEnabled(LogLevel.Error))
                    logger.LogError(ex, "Waiver expiry pass failed for tenant {TenantId}.", tenant.Id);
            }
        }
    }
}
