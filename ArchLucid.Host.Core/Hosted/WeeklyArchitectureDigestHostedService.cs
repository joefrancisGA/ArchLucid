using ArchLucid.Application.WeeklyArchitectureDigest;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Leader-elected loop that emits a capped mock digest for relational critical findings.</summary>
public sealed class WeeklyArchitectureDigestHostedService(
    IServiceProvider serviceProvider,
    HostLeaderElectionCoordinator electionCoordinator,
    IOptionsMonitor<WeeklyArchitectureDigestOptions> weeklyDigestOptions,
    ILogger<WeeklyArchitectureDigestHostedService> logger) : BackgroundService
{
    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.WeeklyArchitectureDigestPolling,
            PollLoopAsync,
            stoppingToken);
    }

    private async Task PollLoopAsync(CancellationToken leaderToken)
    {
        WeeklyArchitectureDigestOptions bootstrap = weeklyDigestOptions.CurrentValue;

        logger.LogInformation(
            "Weekly architecture digest loop started (poll every {PollingIntervalHours} hours; enabled={Enabled}).",
            Math.Clamp(
                bootstrap.PollingIntervalHours,
                WeeklyArchitectureDigestPollingDefaults.MinPollingIntervalHours,
                WeeklyArchitectureDigestPollingDefaults.MaxPollingIntervalHours),
            bootstrap.Enabled);

        while (!leaderToken.IsCancellationRequested)
        {
            try
            {
                WeeklyArchitectureDigestOptions iterationOptions =
                    weeklyDigestOptions.CurrentValue;

                if (!iterationOptions.Enabled)
                {
                    logger.LogDebug(
                        "{Lease} skipped iteration because WeeklyArchitectureDigest:Enabled=false.",
                        HostElectionLeaseNames.WeeklyArchitectureDigestPolling);
                }
                else
                {
                    using IServiceScope scope = serviceProvider.CreateScope();
                    WeeklyArchitectureDigestJobRunner runner =
                        scope.ServiceProvider.GetRequiredService<WeeklyArchitectureDigestJobRunner>();

                    await runner.RunOnceEmitLogAsync(leaderToken).ConfigureAwait(false);
                }
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex) when (!leaderToken.IsCancellationRequested)
            {
                logger.LogError(ex, "Weekly architecture digest iteration failed.");
            }

            WeeklyArchitectureDigestOptions delayOptions =
                weeklyDigestOptions.CurrentValue;

            TimeSpan sleep = ResolvePollIdleDelay(delayOptions);

            try
            {
                await Task.Delay(sleep, leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private static TimeSpan ResolvePollIdleDelay(WeeklyArchitectureDigestOptions options)
    {

        int hours =
            Math.Clamp(
                options.PollingIntervalHours,
                WeeklyArchitectureDigestPollingDefaults.MinPollingIntervalHours,
                WeeklyArchitectureDigestPollingDefaults.MaxPollingIntervalHours);

        return TimeSpan.FromHours(hours);
    }
}
