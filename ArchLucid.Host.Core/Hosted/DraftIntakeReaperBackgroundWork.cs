using ArchLucid.Application.Drafts;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Shared TTL reaper pass for <see cref="DraftIntakeReaperHostedService" /> and API-hosted
///     <c>DraftIntakeReaperWorker</c>.
/// </summary>
public static class DraftIntakeReaperBackgroundWork
{
    /// <summary>
    ///     When <see cref="DraftIntakeReaperOptions.Enabled" /> is true, purges terminal drafts older than
    ///     <see cref="DraftIntakeReaperOptions.TtlDays" />.
    /// </summary>
    public static async Task RunTtlPassAsync(
        IServiceScopeFactory scopeFactory,
        IOptionsMonitor<DraftIntakeReaperOptions> optionsMonitor,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scopeFactory);
        ArgumentNullException.ThrowIfNull(optionsMonitor);
        ArgumentNullException.ThrowIfNull(logger);

        DraftIntakeReaperOptions opts = optionsMonitor.CurrentValue;

        if (!opts.Enabled)
            return;

        try
        {
            int ttlDays = Math.Clamp(opts.TtlDays, 1, 365);
            DateTimeOffset cutoff = TimeProvider.System.GetUtcNow().AddDays(-ttlDays);

            using IServiceScope scope = scopeFactory.CreateScope();
            IDraftIntakeReaperService reaper = scope.ServiceProvider.GetRequiredService<IDraftIntakeReaperService>();

            await reaper.PurgeExpiredTerminalDraftsAsync(cutoff, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            if (logger.IsEnabled(LogLevel.Error))
                logger.LogError(ex, "Draft intake reaper TTL pass failed.");
        }
    }
}
