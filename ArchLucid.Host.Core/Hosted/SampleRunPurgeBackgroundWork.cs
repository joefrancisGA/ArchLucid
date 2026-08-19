using ArchLucid.Application.Runs.Sample;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Shared TTL purge pass for <see cref="SampleRunTtlHostedService" /> and API-hosted
///     <c>SampleRunTtlPurgeWorker</c>.
/// </summary>
public static class SampleRunPurgeBackgroundWork
{
    /// <summary>
    ///     When <see cref="SampleRunPurgeOptions.Enabled" /> is true, purges sample runs older than
    ///     <see cref="SampleRunPurgeOptions.TtlDays" />.
    /// </summary>
    public static async Task RunTtlPassAsync(
        IServiceScopeFactory scopeFactory,
        IOptionsMonitor<SampleRunPurgeOptions> optionsMonitor,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scopeFactory);
        ArgumentNullException.ThrowIfNull(optionsMonitor);
        ArgumentNullException.ThrowIfNull(logger);

        SampleRunPurgeOptions opts = optionsMonitor.CurrentValue;

        if (!opts.Enabled)
            return;

        try
        {
            int ttlDays = Math.Clamp(opts.TtlDays, 1, 30);
            DateTimeOffset cutoff = TimeProvider.System.GetUtcNow().AddDays(-ttlDays);

            using IServiceScope scope = scopeFactory.CreateScope();
            ISampleRunPurgeService purge = scope.ServiceProvider.GetRequiredService<ISampleRunPurgeService>();

            await purge.PurgeExpiredAsync(cutoff, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            if (logger.IsEnabled(LogLevel.Error))
                logger.LogError(ex, "Sample run TTL purge failed.");
        }
    }
}
