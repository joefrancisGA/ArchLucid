using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Shared stale-running reclaim pass for <see cref="BackgroundJobStuckRunningWatchdogHostedService" />.</summary>
public static class BackgroundJobStuckRunningWatchdogBackgroundWork
{
    /// <summary>Reclaims stale <c>Running</c> jobs and re-notifies the durable queue for rows moved to <c>Pending</c>.</summary>
    public static async Task RunSinglePassAsync(
        IServiceScopeFactory scopeFactory,
        IOptions<BackgroundJobsOptions> backgroundJobsOptions,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scopeFactory);
        ArgumentNullException.ThrowIfNull(backgroundJobsOptions);
        ArgumentNullException.ThrowIfNull(logger);

        await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();

        IBackgroundJobRepository repository =
            scope.ServiceProvider.GetRequiredService<IBackgroundJobRepository>();

        IBackgroundJobQueueNotifySender notifySender =
            scope.ServiceProvider.GetRequiredService<IBackgroundJobQueueNotifySender>();

        TimeSpan staleAfter = BackgroundJobStuckRunningWatchdogHostedService.ResolveStaleRunningThreshold(
            backgroundJobsOptions.Value);

        IReadOnlyList<string> requeuedJobIds =
            await repository.ResetStaleRunningJobsOlderThanAsync(staleAfter, cancellationToken);

        if (requeuedJobIds.Count > 0)
        {
            logger.LogWarning(
                "Reclaimed background jobs stuck Running > {Minutes} minutes: {Count}.",
                staleAfter.TotalMinutes,
                requeuedJobIds.Count);
        }

        foreach (string jobId in requeuedJobIds)
        {
            await notifySender.SendJobIdAsync(jobId, cancellationToken);
        }
    }
}
