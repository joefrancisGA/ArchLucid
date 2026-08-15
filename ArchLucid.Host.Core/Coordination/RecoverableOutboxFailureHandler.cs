using ArchLucid.Core.Persistence.ApplicationPorts.Coordination;
using ArchLucid.Host.Core.Configuration;

namespace ArchLucid.Host.Core.Coordination;

/// <summary>
///     Shared dead-letter vs backoff branch for recoverable outbox processors (TB-920).
/// </summary>
public static class RecoverableOutboxFailureHandler
{
    public static async Task HandleAsync<TEntry>(
        IRecoverableOutboxRepository<TEntry> outbox,
        TEntry entry,
        string summary,
        IOutboxLeaseRetryProcessorOptions retryOptions,
        TimeProvider timeProvider,
        Func<Task> onDeadLetterAsync,
        Func<Task> onRetryScheduledAsync,
        CancellationToken cancellationToken)
        where TEntry : IRecoverableOutboxEntry
    {
        ArgumentNullException.ThrowIfNull(outbox);
        ArgumentNullException.ThrowIfNull(entry);
        ArgumentNullException.ThrowIfNull(summary);
        ArgumentNullException.ThrowIfNull(retryOptions);
        ArgumentNullException.ThrowIfNull(timeProvider);
        ArgumentNullException.ThrowIfNull(onDeadLetterAsync);
        ArgumentNullException.ThrowIfNull(onRetryScheduledAsync);

        if (OutboxProcessorRetryCalculator.RetriesExhaustedAfterThisFailure(
                entry.AttemptCount,
                retryOptions.MaxAttemptsBeforeDeadLetter))
        {
            await outbox.RecordDeadLetterAsync(entry.OutboxId, summary, cancellationToken).ConfigureAwait(false);
            await onDeadLetterAsync().ConfigureAwait(false);

            return;
        }

        DateTime nextAttemptUtc = timeProvider.UtcNowDateTime()
            .Add(OutboxProcessorRetryCalculator.RetryDelayAfterFailure(entry.AttemptCount, retryOptions));

        await outbox.RecordBackoffAfterProcessingFailureAsync(
                entry.OutboxId,
                nextAttemptUtc,
                summary,
                cancellationToken)
            .ConfigureAwait(false);

        await onRetryScheduledAsync().ConfigureAwait(false);
    }
}
