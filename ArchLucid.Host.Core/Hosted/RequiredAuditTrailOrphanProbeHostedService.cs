using ArchLucid.Host.Core.Audit;
using ArchLucid.Host.Core.Configuration;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Periodically probes for Required domain rows missing expected durable audit events (TB-955).
/// </summary>
public sealed class RequiredAuditTrailOrphanProbeHostedService(
    IOptionsMonitor<RequiredAuditTrailProbeOptions> optionsMonitor,
    IRequiredAuditTrailOrphanProbeExecutor executor,
    IOptions<ArchLucidOptions> archLucidOptions,
    ILogger<RequiredAuditTrailOrphanProbeHostedService> logger) : BackgroundService
{
    private readonly IRequiredAuditTrailOrphanProbeExecutor _executor =
        executor ?? throw new ArgumentNullException(nameof(executor));

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(archLucidOptions.Value.StorageProvider))
            return;

        try
        {
            await Task.Delay(TimeSpan.FromMinutes(3), stoppingToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            RequiredAuditTrailProbeOptions snapshot = optionsMonitor.CurrentValue;

            if (!snapshot.OrphanProbeEnabled)
            {
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken).ConfigureAwait(false);

                continue;
            }

            int minutes = Math.Clamp(snapshot.OrphanProbeIntervalMinutes, 5, 24 * 60);

            try
            {
                await _executor.RunOnceAsync(stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                return;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Required audit trail orphan probe failed.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromMinutes(minutes), stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                return;
            }
        }
    }
}
