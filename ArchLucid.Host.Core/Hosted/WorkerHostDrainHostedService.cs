using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Hosting;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Flips the host drain gate and emits drain telemetry when SIGTERM / <see cref="IHostApplicationLifetime.ApplicationStopping" />
///     begins (TB-961).
/// </summary>
public sealed class WorkerHostDrainHostedService(
    IHostApplicationLifetime lifetime,
    IWorkerHostDrainGate drainGate,
    ILogger<WorkerHostDrainHostedService> logger) : IHostedService
{
    private readonly IWorkerHostDrainGate _drainGate =
        drainGate ?? throw new ArgumentNullException(nameof(drainGate));

    private readonly IHostApplicationLifetime _lifetime =
        lifetime ?? throw new ArgumentNullException(nameof(lifetime));

    private readonly ILogger<WorkerHostDrainHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private IDisposable? _registration;

    /// <inheritdoc />
    public Task StartAsync(CancellationToken cancellationToken)
    {
        _registration = _lifetime.ApplicationStopping.Register(OnApplicationStopping);

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task StopAsync(CancellationToken cancellationToken)
    {
        _registration?.Dispose();
        _registration = null;

        if (cancellationToken.IsCancellationRequested && _drainGate.IsDraining)
        {
            ArchLucidInstrumentation.WorkerDrainForcedKillTotal.Add(1);

            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    "Host shutdown timed out while drain was in progress; platform may force-kill the replica.");
            }
        }

        return Task.CompletedTask;
    }

    private void OnApplicationStopping()
    {
        WorkerHostDrainSignal.BeginIfNeeded(_drainGate, _logger);
    }
}
