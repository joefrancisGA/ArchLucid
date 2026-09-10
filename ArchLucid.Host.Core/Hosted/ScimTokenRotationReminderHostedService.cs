using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Daily leader-elected scan for SCIM bearer tokens past rotation reminder age.</summary>
public sealed class ScimTokenRotationReminderHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<ScimOptions> options,
    ILogger<ScimTokenRotationReminderHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private static readonly TimeSpan Cadence = TimeSpan.FromHours(24);

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<ScimOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly ILogger<ScimTokenRotationReminderHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.ScimTokenRotationReminder,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        try
        {
            await Task.Delay(TimeSpan.FromMinutes(2), leaderToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
        {
            return;
        }

        while (!leaderToken.IsCancellationRequested)
        {
            try
            {
                await ScimTokenRotationReminderIteration.RunOnceAsync(
                    _scopeFactory,
                    _options.CurrentValue,
                    _logger,
                    leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex) when (_logger.IsEnabled(LogLevel.Error))
            {
                _logger.LogError(ex, "SCIM token rotation reminder scan failed.");
            }

            try
            {
                await Task.Delay(Cadence, leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
