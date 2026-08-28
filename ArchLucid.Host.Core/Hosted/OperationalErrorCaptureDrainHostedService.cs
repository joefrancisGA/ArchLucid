using ArchLucid.Core.Audit;
using ArchLucid.Core.OperationalErrors;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Drains <see cref="IOperationalErrorCaptureQueue"/> into SQL on a background thread.</summary>
public sealed class OperationalErrorCaptureDrainHostedService(
    IOperationalErrorCaptureQueue captureQueue,
    IServiceScopeFactory scopeFactory,
    ILogger<OperationalErrorCaptureDrainHostedService> logger) : BackgroundService
{
    private readonly IOperationalErrorCaptureQueue _captureQueue =
        captureQueue ?? throw new ArgumentNullException(nameof(captureQueue));

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly ILogger<OperationalErrorCaptureDrainHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            OperationalErrorRecord record;

            try
            {
                record = await _captureQueue.DequeueAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }

            try
            {
                using IServiceScope scope = _scopeFactory.CreateScope();
                IOperationalErrorRepository repository =
                    scope.ServiceProvider.GetRequiredService<IOperationalErrorRepository>();

                await DurableAuditLogRetry.TryLogAsync(
                    ct => repository.AppendAsync(record, ct),
                    _logger,
                    "OperationalErrorCaptureDrain",
                    stoppingToken);

                _captureQueue.NotifyPersistedSuccess();
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                if (_captureQueue.TryReturnToQueueAfterFailedDrain(record))
                {
                    if (_logger.IsEnabled(LogLevel.Debug))
                        _logger.LogDebug(ex, "Operational error drain failed; row re-queued.");
                }
                else if (_logger.IsEnabled(LogLevel.Warning))
                {
                    _logger.LogWarning(
                        ex,
                        "Operational error drain failed and re-queue dropped; row {OperationalErrorId} may be lost.",
                        record.Id);
                }
            }
        }
    }
}
