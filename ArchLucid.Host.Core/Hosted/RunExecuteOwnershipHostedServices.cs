using ArchLucid.Application.DataConsistency;
using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Core.Hosting;
using ArchLucid.Host.Core.Hosted;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Reconciles expired execute ownership leases on a leader-elected loop (TB-943).</summary>
public sealed class RunExecuteOwnershipReconciliationHostedService(
    IServiceScopeFactory scopeFactory,
    HostLeaderElectionCoordinator electionCoordinator,
    IOptionsMonitor<RunExecuteOwnershipLeaseOptions> optionsMonitor,
    ILogger<RunExecuteOwnershipReconciliationHostedService> logger) : BackgroundService
{
    private const string LeaderLeaseName = "hosted:run-execute-ownership-reconciliation";

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    private readonly ILogger<RunExecuteOwnershipReconciliationHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IOptionsMonitor<RunExecuteOwnershipLeaseOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(LeaderLeaseName, LoopAsync, stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            RunExecuteOwnershipLeaseOptions options = _optionsMonitor.CurrentValue;

            if (options.Enabled)
            {
                try
                {
                    using IServiceScope scope = _scopeFactory.CreateScope();
                    IRunExecuteOwnershipReconciliationService reconciliation =
                        scope.ServiceProvider.GetRequiredService<IRunExecuteOwnershipReconciliationService>();

                    _ = await reconciliation.ReconcileExpiredLeasesAsync(leaderToken).ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
                {
                    return;
                }
                catch (Exception ex)
                {
                    if (_logger.IsEnabled(LogLevel.Warning))
                        _logger.LogWarning(ex, "Execute ownership reconciliation iteration failed.");
                }
            }

            int minutes = Math.Clamp(_optionsMonitor.CurrentValue.ReconciliationIntervalMinutes, 1, 60);

            try
            {
                await Task.Delay(TimeSpan.FromMinutes(minutes), leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                return;
            }
        }
    }
}

/// <summary>Releases execute ownership leases held by this process on SIGTERM / shutdown (TB-961).</summary>
public sealed class RunExecuteOwnershipShutdownReleaseHostedService(
    IHostApplicationLifetime lifetime,
    IWorkerHostDrainGate drainGate,
    IServiceScopeFactory scopeFactory,
    ILogger<RunExecuteOwnershipShutdownReleaseHostedService> logger) : IHostedService
{
    private readonly IWorkerHostDrainGate _drainGate =
        drainGate ?? throw new ArgumentNullException(nameof(drainGate));

    private readonly IHostApplicationLifetime _lifetime =
        lifetime ?? throw new ArgumentNullException(nameof(lifetime));

    private readonly ILogger<RunExecuteOwnershipShutdownReleaseHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private IDisposable? _registration;

    /// <inheritdoc />
    public Task StartAsync(CancellationToken cancellationToken)
    {
        _registration = _lifetime.ApplicationStopping.Register(() =>
        {
            try
            {
                WorkerHostDrainSignal.BeginIfNeeded(_drainGate, _logger);

                using IServiceScope scope = _scopeFactory.CreateScope();
                IRunExecuteOwnershipLeaseService leaseService =
                    scope.ServiceProvider.GetRequiredService<IRunExecuteOwnershipLeaseService>();

                leaseService.ReleaseAllHeldByThisInstanceAsync(CancellationToken.None).GetAwaiter().GetResult();
            }
            catch (Exception ex)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                    _logger.LogWarning(ex, "Failed to release execute ownership leases during application stopping.");
            }
        });

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task StopAsync(CancellationToken cancellationToken)
    {
        _registration?.Dispose();
        _registration = null;

        return Task.CompletedTask;
    }
}

/// <summary>Optional bounded auto soft-archive for stale in-flight runs (solo-operator / dev hygiene).</summary>
public sealed class StaleInFlightAutoRemediationHostedService(
    IServiceScopeFactory scopeFactory,
    HostLeaderElectionCoordinator electionCoordinator,
    DataConsistencyReconciliationHealthState reconciliationHealthState,
    IOptionsMonitor<StaleInFlightAutoRemediationOptions> optionsMonitor,
    ILogger<StaleInFlightAutoRemediationHostedService> logger) : BackgroundService
{
    private const string LeaderLeaseName = "hosted:stale-in-flight-auto-remediation";

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    private readonly ILogger<StaleInFlightAutoRemediationHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IOptionsMonitor<StaleInFlightAutoRemediationOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly DataConsistencyReconciliationHealthState _reconciliationHealthState =
        reconciliationHealthState ?? throw new ArgumentNullException(nameof(reconciliationHealthState));

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(LeaderLeaseName, LoopAsync, stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            StaleInFlightAutoRemediationOptions options = _optionsMonitor.CurrentValue;

            if (options.Enabled)
            {
                try
                {
                    using IServiceScope scope = _scopeFactory.CreateScope();
                    IStaleInFlightRunRemediator remediator =
                        scope.ServiceProvider.GetRequiredService<IStaleInFlightRunRemediator>();

                    StaleInFlightRemediationOutcome outcome = await remediator
                        .RemediateAsync(false, options.MaxRowsPerPass, leaderToken)
                        .ConfigureAwait(false);

                    if (outcome.ArchivedRunIds.Count > 0)
                    {
                        using IServiceScope reconcileScope = _scopeFactory.CreateScope();
                        IDataConsistencyReconciliationService reconciliation =
                            reconcileScope.ServiceProvider.GetRequiredService<IDataConsistencyReconciliationService>();

                        DataConsistencyReport report =
                            await reconciliation.RunReconciliationAsync(leaderToken).ConfigureAwait(false);

                        _reconciliationHealthState.RecordSuccess(report);
                    }
                }
                catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
                {
                    return;
                }
                catch (Exception ex)
                {
                    if (_logger.IsEnabled(LogLevel.Warning))
                        _logger.LogWarning(ex, "Stale in-flight auto-remediation iteration failed.");
                }
            }

            int minutes = Math.Clamp(_optionsMonitor.CurrentValue.IntervalMinutes, 15, 24 * 60);

            try
            {
                await Task.Delay(TimeSpan.FromMinutes(minutes), leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                return;
            }
        }
    }
}
