using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Persistence.ApplicationPorts.Coordination;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Orchestration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Coordination;

/// <summary>
///     Shared dequeue / isolation / failure-handling shell for recoverable SQL outbox processors (TB-920).
/// </summary>
public abstract class RecoverableOutboxProcessorBase<TEntry, TRepository, TOptions>
    where TEntry : class, IRecoverableOutboxEntry
    where TRepository : class, IRecoverableOutboxRepository<TEntry>
    where TOptions : class, IOutboxLeaseRetryProcessorOptions
{
    protected const int MaxBatchSize = 25;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IOptions<TOptions> _processorOptions;
    private readonly TimeProvider _timeProvider;
    private readonly ILogger _logger;

    protected RecoverableOutboxProcessorBase(
        IServiceScopeFactory scopeFactory,
        IOptions<TOptions> processorOptions,
        TimeProvider timeProvider,
        ILogger logger)
    {
        _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
        _processorOptions = processorOptions ?? throw new ArgumentNullException(nameof(processorOptions));
        _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    protected TimeProvider TimeProvider => _timeProvider;

    protected IServiceScopeFactory ScopeFactory => _scopeFactory;

    protected ILogger Logger => _logger;

    public async Task<int> ProcessPendingBatchAsync(CancellationToken cancellationToken)
    {
        TOptions opts = VerifyOptions(_processorOptions.Value);

        using IServiceScope dequeueScope = _scopeFactory.CreateScope();
        TRepository outbox = dequeueScope.ServiceProvider.GetRequiredService<TRepository>();

        IReadOnlyList<TEntry> batch = await outbox.DequeuePendingAsync(
                MaxBatchSize,
                opts.LeaseDurationSeconds,
                cancellationToken)
            .ConfigureAwait(false);

        if (UsesParallelBatchProcessing(opts))
        {
            int maxConcurrent = Math.Clamp(GetMaxConcurrentBatchEntries(opts), 1, MaxBatchSize);

            await BoundedBatchParallelism.ForEachAsync(
                batch,
                maxConcurrent,
                (entry, token) => ProcessEntryWithIsolationAsync(entry, opts, token),
                cancellationToken).ConfigureAwait(false);
        }
        else
        {
            foreach (TEntry entry in batch)
            {
                cancellationToken.ThrowIfCancellationRequested();
                await ProcessEntryWithIsolationAsync(entry, opts, cancellationToken).ConfigureAwait(false);
            }
        }

        return batch.Count;
    }

    protected abstract Task ProcessEntryAsync(
        IServiceScope scope,
        TRepository outbox,
        TEntry entry,
        TOptions opts,
        CancellationToken cancellationToken);

    protected abstract TOptions VerifyOptions(TOptions configured);

    protected virtual bool UsesParallelBatchProcessing(TOptions opts) => true;

    protected virtual int GetMaxConcurrentBatchEntries(TOptions opts) => 4;

    protected virtual Task OnDeadLetterAsync(
        IServiceScope scope,
        TEntry entry,
        string summary,
        TOptions opts,
        CancellationToken cancellationToken) => Task.CompletedTask;

    protected virtual void LogProcessingFailure(Exception fault, TEntry entry)
    {
    }

    protected virtual Task OnRetryScheduledAsync(
        TEntry entry,
        TOptions opts,
        CancellationToken cancellationToken) => Task.CompletedTask;

    private async Task ProcessEntryWithIsolationAsync(
        TEntry entry,
        TOptions opts,
        CancellationToken cancellationToken)
    {
        using IServiceScope scope = _scopeFactory.CreateScope();
        TRepository outbox = scope.ServiceProvider.GetRequiredService<TRepository>();

        try
        {
            await ProcessEntryAsync(scope, outbox, entry, opts, cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            await OnProcessingFailedAsync(scope, outbox, entry, ex, opts, cancellationToken).ConfigureAwait(false);
        }
    }

    private async Task OnProcessingFailedAsync(
        IServiceScope scope,
        TRepository outbox,
        TEntry entry,
        Exception fault,
        TOptions opts,
        CancellationToken cancellationToken)
    {
        LogProcessingFailure(fault, entry);

        string summary = AuthorityPipelineWorkErrorSummary.From(fault);

        await RecoverableOutboxFailureHandler.HandleAsync(
            outbox,
            entry,
            summary,
            opts,
            _timeProvider,
            () => OnDeadLetterAsync(scope, entry, summary, opts, cancellationToken),
            () => OnRetryScheduledAsync(entry, opts, cancellationToken),
            cancellationToken).ConfigureAwait(false);
    }
}
