using ArchiForge.Persistence.Archival;

using Microsoft.Extensions.Options;

namespace ArchiForge.Host.Core.Hosted;

/// <summary>
/// Periodically applies <see cref="DataArchivalOptions"/> retention cutoffs via <see cref="IDataArchivalCoordinator"/>.
/// </summary>
public sealed class DataArchivalHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<DataArchivalOptions> optionsMonitor,
    ILogger<DataArchivalHostedService> logger,
    DataArchivalHostHealthState healthState) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<DataArchivalOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<DataArchivalHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly DataArchivalHostHealthState _healthState =
        healthState ?? throw new ArgumentNullException(nameof(healthState));

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            DataArchivalOptions opts = _optionsMonitor.CurrentValue;
            TimeSpan delay = TimeSpan.FromHours(Math.Clamp(opts.IntervalHours, 1, 168));

            try
            {
                await DataArchivalHostIteration.RunOnceAsync(
                    _scopeFactory,
                    opts,
                    _logger,
                    _healthState,
                    stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }

            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
