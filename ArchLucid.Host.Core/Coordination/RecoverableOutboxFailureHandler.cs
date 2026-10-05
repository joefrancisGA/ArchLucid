using ArchLucid.Application;
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
        Exception fault,
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
        ArgumentNullException.ThrowIfNull(fault);
        ArgumentNullException.ThrowIfNull(summary);
        ArgumentNullException.ThrowIfNull(retryOptions);
        ArgumentNullException.ThrowIfNull(timeProvider);
        ArgumentNullException.ThrowIfNull(onDeadLetterAsync);
        ArgumentNullException.ThrowIfNull(onRetryScheduledAsync);

        if (fault is ConflictException)
        {
            await outbox.RecordDeadLetterAsync(entry.OutboxId, summary, cancellationToken).ConfigureAwait(false);
            await InvokeDeadLetterHookBestEffortAsync(onDeadLetterAsync, cancellationToken).ConfigureAwait(false);

            return;
        }

        if (OutboxProcessorRetryCalculator.RetriesExhaustedAfterThisFailure(
                entry.AttemptCount,
                retryOptions.MaxAttemptsBeforeDeadLetter))
        {
            await outbox.RecordDeadLetterAsync(entry.OutboxId, summary, cancellationToken).ConfigureAwait(false);
            await InvokeDeadLetterHookBestEffortAsync(onDeadLetterAsync, cancellationToken).ConfigureAwait(false);

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

        await InvokeRetryHookBestEffortAsync(onRetryScheduledAsync, cancellationToken).ConfigureAwait(false);
    }

    private static async Task InvokeRetryHookBestEffortAsync(
        Func<Task> onRetryScheduledAsync,
        CancellationToken cancellationToken)
    {
        try
        {
            await onRetryScheduledAsync().ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception)
        {
            // Backoff is already persisted; retry instrumentation hooks must not abort batch isolation.
        }
    }

    private static async Task InvokeDeadLetterHookBestEffortAsync(
        Func<Task> onDeadLetterAsync,
        CancellationToken cancellationToken)
    {
        try
        {
            await onDeadLetterAsync().ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception)
        {
            // The terminal outbox state is already persisted; audit/metric hooks must not abort batch isolation.
        }
    }
}
