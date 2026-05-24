using ArchLucid.Persistence.IntegrationOutbox;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Automatically requeues dead-lettered integration events with bounded retries.</summary>
public static class IntegrationEventDlqRetryBackgroundWork
{
    private const int MaxAutoRetryCount = 3;

    /// <summary>Runs one DLQ auto-retry pass (leader-elected hosts call this on a timer).</summary>
    public static async Task RunSinglePassAsync(
        IServiceScopeFactory scopeFactory,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scopeFactory);
        ArgumentNullException.ThrowIfNull(logger);

        await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
        IIntegrationEventOutboxRepository repository =
            scope.ServiceProvider.GetRequiredService<IIntegrationEventOutboxRepository>();

        IReadOnlyList<IntegrationEventOutboxDeadLetterRow> deadLetters =
            await repository.ListDeadLettersAsync(100, cancellationToken).ConfigureAwait(false);

        int requeued = 0;

        foreach (IntegrationEventOutboxDeadLetterRow row in deadLetters)
        {
            if (row.RetryCount >= MaxAutoRetryCount)
                continue;

            bool ok = await repository.ResetDeadLetterForRetryAsync(row.OutboxId, cancellationToken).ConfigureAwait(false);

            if (ok)
                requeued++;
        }

        if (requeued > 0 && logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation(
                "Integration event DLQ auto-retry requeued {Count} dead-letter row(s).",
                requeued);
        }
    }
}

/// <summary>Leader-elected loop that auto-retries integration outbox dead letters every 15 minutes.</summary>
public sealed class IntegrationEventDlqRetryHostedService(
    IServiceScopeFactory scopeFactory,
    ILogger<IntegrationEventDlqRetryHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly ILogger<IntegrationEventDlqRetryHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.IntegrationEventDlqRetry,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            try
            {
                await IntegrationEventDlqRetryBackgroundWork.RunSinglePassAsync(
                    _scopeFactory,
                    _logger,
                    leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Integration event DLQ auto-retry loop error.");
            }

            try
            {
                await Task.Delay(Interval, leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
