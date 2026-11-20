using ArchLucid.Application.Jobs;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
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

        if (requeuedJobIds.Count == 0)
            return;

        logger.LogWarning(
            "Reclaimed background jobs stuck Running > {Minutes} minutes: {Count}.",
            staleAfter.TotalMinutes,
            requeuedJobIds.Count);

        // Future passes only reclaim Running rows. Give this committed batch the host's
        // graceful drain window to reach the queue after the watchdog is stopped.
        TimeSpan drainBudget = scope.ServiceProvider.GetService<IOptions<HostOptions>>()?.Value.ShutdownTimeout
            ?? new HostOptions().ShutdownTimeout;
        using CancellationTokenSource handoffCancellation = new();
        using CancellationTokenRegistration stoppingRegistration = cancellationToken.Register(
            () => handoffCancellation.CancelAfter(drainBudget));
        CancellationToken handoffToken = handoffCancellation.Token;
        foreach (string jobId in requeuedJobIds)
        {
            try
            {
                await notifySender.SendJobIdAsync(jobId, handoffToken);
            }
            catch (OperationCanceledException) when (handoffToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex,
                    "Failed to notify durable queue for reclaimed background job {JobId}.",
                    jobId);

                BackgroundJobRow? current = await repository.GetAsync(jobId, handoffToken);

                if (current is not null
                    && string.Equals(current.State, nameof(BackgroundJobState.Canceled), StringComparison.OrdinalIgnoreCase))
                    continue;

                current = await repository.GetAsync(jobId, handoffToken);

                if (current is not null
                    && string.Equals(current.State, nameof(BackgroundJobState.Canceled), StringComparison.OrdinalIgnoreCase))
                    continue;

                int retryCount = current?.RetryCount ?? 0;

                await repository.MarkFailedTerminalFromQueuedStateAsync(
                    jobId,
                    $"Queue notification failed: {ex.Message}",
                    retryCount,
                    handoffToken);
            }
        }
    }
}
