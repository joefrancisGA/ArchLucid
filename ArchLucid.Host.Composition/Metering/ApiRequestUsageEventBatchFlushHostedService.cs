using ArchLucid.Core.Metering;
using ArchLucid.Persistence.Metering;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Metering;

/// <summary>
///     Drains <see cref="ApiRequestUsageEventBuffer" /> on a timer and persists batches (TB-582).
/// </summary>
public sealed class ApiRequestUsageEventBatchFlushHostedService(
    ApiRequestUsageEventBuffer buffer,
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<MeteringOptions> meteringOptions,
    ILogger<ApiRequestUsageEventBatchFlushHostedService> logger) : BackgroundService
{
    private readonly ApiRequestUsageEventBuffer _buffer =
        buffer ?? throw new ArgumentNullException(nameof(buffer));

    private readonly ILogger<ApiRequestUsageEventBatchFlushHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IOptionsMonitor<MeteringOptions> _meteringOptions =
        meteringOptions ?? throw new ArgumentNullException(nameof(meteringOptions));

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            MeteringOptions options = _meteringOptions.CurrentValue;
            options.Normalize();

            if (!options.Enabled)
            {
                await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken).ConfigureAwait(false);
                continue;
            }

            TimeSpan interval = TimeSpan.FromSeconds(options.ApiRequestBatchFlushIntervalSeconds);

            using PeriodicTimer timer = new(interval);

            while (await timer.WaitForNextTickAsync(stoppingToken).ConfigureAwait(false))
            {
                options = _meteringOptions.CurrentValue;
                options.Normalize();

                if (!options.Enabled)
                    break;

                await FlushPendingAsync(options.ApiRequestBatchMaxSize, stoppingToken).ConfigureAwait(false);
            }
        }
    }

    /// <inheritdoc />
    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        try
        {
            MeteringOptions options = _meteringOptions.CurrentValue;
            options.Normalize();

            await FlushPendingAsync(options.ApiRequestBatchMaxSize, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))

                _logger.LogWarning(ex, "Final API usage metering batch flush failed during shutdown.");
        }

        await base.StopAsync(cancellationToken).ConfigureAwait(false);
    }

    private async Task FlushPendingAsync(int maxBatchSize, CancellationToken ct)
    {
        int safeMax = Math.Clamp(maxBatchSize, 1, 500);
        List<UsageEvent> batch = [];

        while (_buffer.TryDequeue(out UsageEvent? usageEvent))
        {
            batch.Add(usageEvent);

            if (batch.Count >= safeMax)
            {

                if (!await PersistOrReturnAsync(batch, ct).ConfigureAwait(false))
                {
                    return;
                }

                batch = [];
            }
        }

        if (batch.Count > 0)
        {
            await PersistOrReturnAsync(batch, ct).ConfigureAwait(false);
        }
    }

    /// <summary>
    ///     Dequeue already removed these events. A failed persist has to put them back or the next
    ///     interval cannot retry and API usage is undercounted.
    /// </summary>
    private async Task<bool> PersistOrReturnAsync(List<UsageEvent> batch, CancellationToken ct)
    {
        try
        {
            bool persisted = await TryPersistBatchAsync(batch, ct).ConfigureAwait(false);

            if (!persisted)
            {
                ReturnBatchToBuffer(batch);
            }

            return persisted;
        }
        catch (OperationCanceledException)
        {
            ReturnBatchToBuffer(batch);

            throw;
        }
    }

    private void ReturnBatchToBuffer(IReadOnlyList<UsageEvent> batch)
    {
        foreach (UsageEvent usageEvent in batch)
        {
            _buffer.Requeue(usageEvent);
        }
    }

    private async Task<bool> TryPersistBatchAsync(IReadOnlyList<UsageEvent> batch, CancellationToken ct)
    {
        try
        {
            using IServiceScope scope = _scopeFactory.CreateScope();
            IUsageMeteringService metering = scope.ServiceProvider.GetRequiredService<IUsageMeteringService>();

            await metering.RecordBatchAsync(batch, ct).ConfigureAwait(false);

            return true;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {

            if (_logger.IsEnabled(LogLevel.Warning))

                _logger.LogWarning(ex, "API usage metering batch flush failed for {EventCount} events.", batch.Count);

            return false;
        }
    }
}
