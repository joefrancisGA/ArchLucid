using ArchLucid.Core.OperationalErrors;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Periodically purges platform operational error rows past configured retention.</summary>
public sealed class OperationalErrorRetentionHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<OperationalErrorOptions> options,
    ILogger<OperationalErrorRetentionHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(6);

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<OperationalErrorOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly ILogger<OperationalErrorRetentionHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await OperationalErrorRetentionIteration.RunOnceAsync(
                    _scopeFactory,
                    _options.CurrentValue,
                    _logger,
                    stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex) when (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(ex, "Operational error retention purge iteration failed.");
            }

            try
            {
                await Task.Delay(Interval, stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
